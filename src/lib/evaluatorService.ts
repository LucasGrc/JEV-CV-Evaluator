import { prisma } from '@/lib/prisma';
import { typeSafeEngine } from '@/lib/typesafe';
import { calculateJevCostUsd } from '@/lib/pricing';
import { RecommendationType, ApplicationStatus, EvaluationStatus } from '@prisma/client';

export interface ProcessApplicationResult {
  success: boolean;
  applicationId: string;
  status: ApplicationStatus;
  overallScore?: number;
  costUsd?: number;
  error?: string;
}

/**
 * Evaluates an application using TypeSafe AI (JEV) and saves the result to PostgreSQL.
 */
export async function processApplicationEvaluation(
  applicationId: string,
  evaluatorId?: string
): Promise<ProcessApplicationResult> {
  const startTime = Date.now();

  // 1. Fetch application with related Vacancy, Candidate, and CvDocument
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      vacancy: true,
      candidate: true,
      cvDocument: true,
    },
  });

  if (!application) {
    return {
      success: false,
      applicationId,
      status: ApplicationStatus.PENDING,
      error: `Application ${applicationId} not found`,
    };
  }

  // 2. Mark application and queue as processing
  await prisma.application.update({
    where: { id: applicationId },
    data: { status: ApplicationStatus.PROCESSING },
  });

  // 3. Language policy gate: English is required before calling JEV
  if (!application.cvDocument.isLanguageValid) {
    const procTime = Date.now() - startTime;

    const evaluation = await prisma.evaluation.upsert({
      where: { applicationId },
      create: {
        applicationId,
        evaluatorId: evaluatorId || null,
        status: EvaluationStatus.WRONG_LANGUAGE,
        recommendation: RecommendationType.REVIEW_REQUIRED,
        overallScore: 0.0,
        normalizedScore: 0.0,
        confidence: 1.0,
        scoreSkills: 0.0,
        scoreExperience: 0.0,
        scoreEducation: 0.0,
        scoreLeadership: 0.0,
        jevRawResponses: {
          error: 'Document language is not English',
          detectedLanguage: application.cvDocument.detectedLanguage,
        },
        inputTokens: 0,
        outputTokens: 0,
        costUsd: 0.0,
        processingTimeMs: procTime,
        recruiterFeedback: `Document detected as '${application.cvDocument.detectedLanguage}'. English is required per company hiring policy.`,
      },
      update: {
        status: EvaluationStatus.WRONG_LANGUAGE,
        recommendation: RecommendationType.REVIEW_REQUIRED,
        overallScore: 0.0,
        normalizedScore: 0.0,
        recruiterFeedback: `Document detected as '${application.cvDocument.detectedLanguage}'. English is required per company hiring policy.`,
      },
    });

    await prisma.application.update({
      where: { id: applicationId },
      data: { status: ApplicationStatus.WRONG_LANGUAGE },
    });

    await prisma.auditLog.create({
      data: {
        userId: evaluatorId || null,
        action: 'EVALUATION_LANGUAGE_REJECTED',
        entityType: 'Application',
        entityId: applicationId,
        metadata: {
          candidate: application.candidate.fullName,
          detectedLanguage: application.cvDocument.detectedLanguage,
        },
      },
    });

    return {
      success: true,
      applicationId,
      status: ApplicationStatus.WRONG_LANGUAGE,
      overallScore: 0.0,
      costUsd: 0.0,
    };
  }

  // 4. Invoke JEV System One model via TypeSafe SDK
  try {
    const cvText = application.cvDocument.extractedText;
    const response = await typeSafeEngine.evaluateResume(cvText, { bypassLanguageCheck: true });
    const { answers, usage } = response;
    const procTime = Date.now() - startTime;

    // 5. Extract ordinal rubric scores (0.0 - 4.0)
    // Map to 4 core dimensions defined in Vacancy
    // Skills (FE + BE + DB + Stack)
    const skillsScore = (answers.frontend_depth.score + answers.backend_depth.score + answers.database_depth.score) / 3;
    // Experience (Seniority + Devops)
    const experienceScore = (answers.devops_cloud.score + (answers.seniority_level.choice === 'Lead / Staff' || answers.seniority_level.choice === 'Architect' ? 4.0 : answers.seniority_level.choice === 'Senior' ? 3.2 : answers.seniority_level.choice === 'Semi-Senior' ? 2.2 : 1.0)) / 2;
    // Education / Fundamental Depth (Devops / Architecture depth)
    const educationScore = answers.database_depth.score;
    // Leadership & Business Impact
    const leadershipScore = answers.business_impact.score;

    // 6. Compute weighted score using the specific Vacancy's weights
    const vacancy = application.vacancy;
    const overallScore = Number(
      (
        skillsScore * vacancy.weightSkills +
        experienceScore * vacancy.weightExperience +
        educationScore * vacancy.weightEducation +
        leadershipScore * vacancy.weightLeadership
      ).toFixed(2)
    );

    const normalizedScore = Number(((overallScore / 4.0) * 100).toFixed(1));

    // 7. Determine candidate recommendation
    let recommendation: RecommendationType = RecommendationType.NOT_RECOMMENDED;
    if (overallScore >= vacancy.minScoreThreshold + 0.7) {
      recommendation = RecommendationType.TOP_CANDIDATE;
    } else if (overallScore >= vacancy.minScoreThreshold) {
      recommendation = RecommendationType.POTENTIAL_FIT;
    } else {
      recommendation = RecommendationType.NOT_RECOMMENDED;
    }

    // Average confidence across questions
    const confidence = Number(
      (
        (answers.frontend_depth.confidence +
          answers.backend_depth.confidence +
          answers.database_depth.confidence +
          answers.devops_cloud.confidence +
          answers.business_impact.confidence) /
        5
      ).toFixed(3)
    );

    const costUsd = calculateJevCostUsd(usage.input_tokens, usage.output_tokens);

    // 8. Persist Evaluation in PostgreSQL
    await prisma.evaluation.upsert({
      where: { applicationId },
      create: {
        applicationId,
        evaluatorId: evaluatorId || null,
        status: EvaluationStatus.SUCCESS,
        recommendation,
        overallScore,
        normalizedScore,
        confidence,
        scoreSkills: Number(skillsScore.toFixed(2)),
        scoreExperience: Number(experienceScore.toFixed(2)),
        scoreEducation: Number(educationScore.toFixed(2)),
        scoreLeadership: Number(leadershipScore.toFixed(2)),
        jevRawResponses: answers as any,
        inputTokens: usage.input_tokens,
        outputTokens: usage.output_tokens,
        costUsd,
        processingTimeMs: procTime,
      },
      update: {
        status: EvaluationStatus.SUCCESS,
        recommendation,
        overallScore,
        normalizedScore,
        confidence,
        scoreSkills: Number(skillsScore.toFixed(2)),
        scoreExperience: Number(experienceScore.toFixed(2)),
        scoreEducation: Number(educationScore.toFixed(2)),
        scoreLeadership: Number(leadershipScore.toFixed(2)),
        jevRawResponses: answers as any,
        inputTokens: usage.input_tokens,
        outputTokens: usage.output_tokens,
        costUsd,
        processingTimeMs: procTime,
      },
    });

    // 9. Update Application status
    await prisma.application.update({
      where: { id: applicationId },
      data: { status: ApplicationStatus.EVALUATED },
    });

    // 10. Audit log
    await prisma.auditLog.create({
      data: {
        userId: evaluatorId || null,
        action: 'EVALUATION_COMPLETED',
        entityType: 'Application',
        entityId: applicationId,
        metadata: {
          vacancyTitle: vacancy.title,
          candidateName: application.candidate.fullName,
          overallScore,
          costUsd,
          tokens: usage.input_tokens,
        },
      },
    });

    return {
      success: true,
      applicationId,
      status: ApplicationStatus.EVALUATED,
      overallScore,
      costUsd,
    };
  } catch (error: any) {
    console.error(`[evaluatorService] Evaluation failed for application ${applicationId}:`, error);

    await prisma.application.update({
      where: { id: applicationId },
      data: { status: ApplicationStatus.PENDING },
    });

    return {
      success: false,
      applicationId,
      status: ApplicationStatus.PENDING,
      error: error.message || 'Unknown evaluation error',
    };
  }
}
