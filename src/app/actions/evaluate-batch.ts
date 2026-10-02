'use server';

/**
 * ==============================================================================
 * Server Actions: evaluate-batch.ts (Refactor con TypeSafe AI System One)
 * ==============================================================================
 * Aplica el patrón oficial de Composite Scoring de TypeSafe AI:
 * 1. Envía el CV y 8 preguntas paralelas (Score, Choice, Noul) a JEV.
 * 2. Normaliza los scores ordinales (0 a 4) a escala porcentual (0 a 100).
 * 3. Aplica los pesos ponderados gobernados por el código de la aplicación.
 * 4. Calcula costos financieros de API con precisión a 4 decimales.
 * ==============================================================================
 */

import { typeSafeEngine } from '@/lib/typesafe';
import { MOCK_CANDIDATES } from '@/mocks/candidates';
import {
  CategoryDetail,
  EvaluationResult,
  PASSING_SCORE_THRESHOLD,
  WEIGHTS,
} from '@/types/evaluation';

export interface SingleCandidateEvaluationResponse {
  success: boolean;
  candidateId: string;
  data?: EvaluationResult & { costNumeric: number };
  error?: string;
}

/**
 * Obtiene la lista inicial de candidatos mock
 */
export async function getCandidatesList() {
  return MOCK_CANDIDATES.map((c) => ({
    id: c.id,
    name: c.name,
    targetRole: c.targetRole,
  }));
}

/**
 * Evalúa un único candidato utilizando las primitivas de TypeSafe AI (JEV)
 */
export async function evaluateSingleCandidate(
  candidateId: string
): Promise<SingleCandidateEvaluationResponse> {
  const startTime = Date.now();

  try {
    const candidate = MOCK_CANDIDATES.find((c) => c.id === candidateId);
    if (!candidate) {
      return {
        success: false,
        candidateId,
        error: `Candidato con ID ${candidateId} no encontrado.`,
      };
    }

    // 1. Invocación al modelo discriminativo System One (JEV)
    const { answers, usage } = await typeSafeEngine.evaluateResume(candidate.cvText);

    // 2. Normalización de Scores Ordinales de JEV (0 a 4) a Escala 0-100
    const frontendScore = Math.min(100, Math.max(0, Math.round((answers.frontend_depth.score / 4) * 100)));
    const backendScore = Math.min(100, Math.max(0, Math.round((answers.backend_depth.score / 4) * 100)));
    const databaseScore = Math.min(100, Math.max(0, Math.round((answers.database_depth.score / 4) * 100)));
    const devopsScore = Math.min(100, Math.max(0, Math.round((answers.devops_cloud.score / 4) * 100)));
    const businessImpactScore = Math.min(100, Math.max(0, Math.round((answers.business_impact.score / 4) * 100)));

    // 3. Composite Scoring (Pesos Ponderados en Código)
    const computedOverall =
      frontendScore * WEIGHTS.frontend +
      backendScore * WEIGHTS.backend +
      databaseScore * WEIGHTS.database +
      devopsScore * WEIGHTS.devops +
      businessImpactScore * WEIGHTS.businessImpact;

    const overallScore = Math.round(computedOverall);
    const passed = overallScore >= PASSING_SCORE_THRESHOLD;
    const decision: 'Pasa a Entrevista' | 'No Pasa' = passed ? 'Pasa a Entrevista' : 'No Pasa';

    // 4. Estimación Financiera de Inferencia
    const promptCost = (usage.input_tokens * 2.5) / 1_000_000;
    const completionCost = (usage.output_tokens * 10.0) / 1_000_000;
    const costNumeric = promptCost + completionCost;
    const apiCost = `$${costNumeric.toFixed(4)}`;

    // 5. Análisis de tecnologías detectadas y faltantes
    const lowerCV = candidate.cvText.toLowerCase();
    const techPool = [
      'React', 'Next.js', 'TypeScript', 'Node.js', 'PostgreSQL', 'Docker',
      'Kubernetes', 'Redis', 'AWS', 'GCP', 'Prisma', 'Drizzle', 'GraphQL', 'CI/CD'
    ];
    const detectedSkills = techPool.filter((t) => lowerCV.includes(t.toLowerCase()));

    const missingCandidates = [
      'Docker / Contenedores', 'Kubernetes', 'Redis Caching', 'PostgreSQL / SQL',
      'CI/CD Pipelines', 'TypeScript Estricto', 'Next.js App Router'
    ];
    const missingKeywords = missingCandidates.filter((t) => !lowerCV.includes(t.split(' ')[0].toLowerCase())).slice(0, 3);

    // 6. Construcción de Categorías con Métricas de Confianza de JEV
    const categories: CategoryDetail[] = [
      {
        id: 'frontend',
        name: 'Front-End Development',
        weight: 25,
        score: frontendScore,
        rawScore: Number(answers.frontend_depth.score.toFixed(2)),
        confidence: answers.frontend_depth.confidence,
        feedback:
          frontendScore >= 75
            ? 'Dominio senior en frameworks modernos, tipado estricto con TypeScript y Web Vitals.'
            : 'Conocimientos de interfaz básicos a intermedios; requiere mayor profundidad en arquitectura SSR y state management.',
      },
      {
        id: 'backend',
        name: 'Back-End Architecture & APIs',
        weight: 25,
        score: backendScore,
        rawScore: Number(answers.backend_depth.score.toFixed(2)),
        confidence: answers.backend_depth.confidence,
        feedback:
          backendScore >= 75
            ? 'Arquitectura modular sólida, buen diseño de APIs REST/GraphQL y patrones de resiliencia.'
            : 'Falta evidencia de diseño de microservicios robustos, concurrencia o seguridad avanzada.',
      },
      {
        id: 'database',
        name: 'Base de Datos & Persistencia',
        weight: 15,
        score: databaseScore,
        rawScore: Number(answers.database_depth.score.toFixed(2)),
        confidence: answers.database_depth.confidence,
        feedback:
          databaseScore >= 75
            ? 'Excelente manejo relacional y de caching con Redis, esquemas ORM y optimización de queries.'
            : 'Uso elemental de persistencia; requiere afianzar transacciones ACID y optimización de índices.',
      },
      {
        id: 'devops',
        name: 'DevOps & Infraestructura Cloud',
        weight: 15,
        score: devopsScore,
        rawScore: Number(answers.devops_cloud.score.toFixed(2)),
        confidence: answers.devops_cloud.confidence,
        feedback:
          devopsScore >= 75
            ? 'Familiaridad con contenerización Docker, CI/CD automatizado y servicios cloud (AWS/GCP).'
            : 'Poco conocimiento práctico de despliegues productivos automatizados o IaC.',
      },
      {
        id: 'businessImpact',
        name: 'Impacto de Negocio & Liderazgo',
        weight: 20,
        score: businessImpactScore,
        rawScore: Number(answers.business_impact.score.toFixed(2)),
        confidence: answers.business_impact.confidence,
        feedback:
          businessImpactScore >= 75
            ? 'Orientación probada a resultados de negocio, liderazgo técnico y optimización de métricas clave.'
            : 'Enfoque centrado en tareas técnicas sin métricas claras de impacto en el producto.',
      },
    ];

    const executionTimeMs = Date.now() - startTime;

    const finalResult: EvaluationResult & { costNumeric: number } = {
      candidateName: candidate.name,
      yearsOfExperience: answers.seniority_level.choice === 'Junior' ? 2 : answers.seniority_level.choice === 'Semi-Senior' ? 4 : answers.seniority_level.choice === 'Senior' ? 6 : 9,
      seniorityLevel: answers.seniority_level.choice,
      seniorityConfidence: answers.seniority_level.confidence,
      summary: `Evaluación completada mediante TypeSafe AI (JEV). Nivel inferido: ${answers.seniority_level.choice} (confianza: ${(answers.seniority_level.confidence * 100).toFixed(0)}%). Score global de idoneidad: ${overallScore}/100.`,
      frontendScore,
      backendScore,
      databaseScore,
      devopsScore,
      businessImpactScore,
      overallScore,
      passed,
      decision,
      hasContainerizationProb: answers.has_containerization.noul,
      hasModernStackProb: answers.has_modern_stack.noul,
      categories,
      detectedSkills,
      missingKeywords,
      highlights: [
        `Probabilidad de stack moderno (Next.js/TS): ${(answers.has_modern_stack.noul * 100).toFixed(0)}%`,
        `Probabilidad de experiencia en contenedores (Docker/K8s): ${(answers.has_containerization.noul * 100).toFixed(0)}%`,
        `Confianza de clasificación de seniority: ${(answers.seniority_level.confidence * 100).toFixed(0)}%`,
      ],
      metrics: {
        promptTokens: usage.input_tokens,
        completionTokens: usage.output_tokens,
        totalTokens: usage.total_tokens,
        apiCost,
        executionTimeMs,
      },
      evaluatedAt: new Date().toISOString(),
      costNumeric,
    };

    return {
      success: true,
      candidateId,
      data: finalResult,
    };
  } catch (err: any) {
    console.error(`[evaluateSingleCandidate] Error evaluando ${candidateId}:`, err);
    return {
      success: false,
      candidateId,
      error: err.message || 'Error en el motor de TypeSafe AI.',
    };
  }
}
