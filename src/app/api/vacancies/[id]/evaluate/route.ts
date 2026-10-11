import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { processApplicationEvaluation } from '@/lib/evaluatorService';
import { ApplicationStatus } from '@prisma/client';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const vacancyId = params.id;
    const body = await request.json().catch(() => ({}));
    const { applicationId } = body;

    // If a specific applicationId is provided, evaluate just that one
    if (applicationId) {
      const result = await processApplicationEvaluation(applicationId);
      return NextResponse.json(result);
    }

    // Otherwise, evaluate all PENDING applications in this vacancy
    const pendingApplications = await prisma.application.findMany({
      where: {
        vacancyId,
        status: ApplicationStatus.PENDING,
      },
      include: {
        candidate: true,
      },
    });

    if (pendingApplications.length === 0) {
      return NextResponse.json({
        message: 'No pending applications to evaluate for this vacancy',
        evaluated: 0,
      });
    }

    const evaluationResults = [];

    for (const app of pendingApplications) {
      const result = await processApplicationEvaluation(app.id);
      evaluationResults.push({
        applicationId: app.id,
        candidateName: app.candidate.fullName,
        result,
      });
    }

    return NextResponse.json({
      success: true,
      evaluatedCount: evaluationResults.length,
      results: evaluationResults,
    });
  } catch (error: any) {
    console.error('[Evaluate API Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
