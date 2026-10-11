import { EvaluationResult, CategoryDetail, SeniorityLevel } from '@/types/evaluation';
import { formatJevCost } from '@/lib/pricing';

export function mapPrismaEvaluationToResult(
  evalData: any,
  candidateName: string,
  targetRole: string,
  cvText: string,
  minScoreThreshold: number = 2.5
): EvaluationResult {
  const raw = evalData.jevRawResponses || {};
  const feRaw = raw.frontend_depth?.score ?? (evalData.scoreSkills || 0);
  const beRaw = raw.backend_depth?.score ?? (evalData.scoreSkills || 0);
  const dbRaw = raw.database_depth?.score ?? (evalData.scoreEducation || 0);
  const devopsRaw = raw.devops_cloud?.score ?? (evalData.scoreExperience || 0);
  const bizRaw = raw.business_impact?.score ?? (evalData.scoreLeadership || 0);

  const feScore = Math.min(100, Math.max(0, Math.round((feRaw / 4) * 100)));
  const beScore = Math.min(100, Math.max(0, Math.round((beRaw / 4) * 100)));
  const dbScore = Math.min(100, Math.max(0, Math.round((dbRaw / 4) * 100)));
  const devopsScore = Math.min(100, Math.max(0, Math.round((devopsRaw / 4) * 100)));
  const bizScore = Math.min(100, Math.max(0, Math.round((bizRaw / 4) * 100)));

  const seniority: SeniorityLevel = raw.seniority_level?.choice || 'Senior';
  const seniorityConf = raw.seniority_level?.confidence ?? evalData.confidence ?? 0.9;

  const passed = evalData.overallScore >= minScoreThreshold;

  const categories: CategoryDetail[] = [
    {
      id: 'frontend',
      name: 'Front-End Development',
      weight: 25,
      score: feScore,
      rawScore: Number(feRaw.toFixed(2)),
      confidence: raw.frontend_depth?.confidence ?? evalData.confidence ?? 0.9,
      feedback: feScore >= 75
        ? 'Dominio fuerte en frameworks modernos, TypeScript y optimización de Web Vitals.'
        : 'Nivel básico o mención limitada en desarrollo front-end moderno.',
    },
    {
      id: 'backend',
      name: 'Back-End Architecture & APIs',
      weight: 25,
      score: beScore,
      rawScore: Number(beRaw.toFixed(2)),
      confidence: raw.backend_depth?.confidence ?? evalData.confidence ?? 0.9,
      feedback: beScore >= 75
        ? 'Arquitectura sólida de APIs, servicios concurrentes y microservicios escalables.'
        : 'Experiencia básica en scripting o rutas CRUD tradicionales.',
    },
    {
      id: 'database',
      name: 'Database & Data Modeling',
      weight: 15,
      score: dbScore,
      rawScore: Number(dbRaw.toFixed(2)),
      confidence: raw.database_depth?.confidence ?? evalData.confidence ?? 0.9,
      feedback: dbScore >= 75
        ? 'Modelado relacional avanzado, índices, transacciones y caching con Redis.'
        : 'Uso elemental de consultas o persistencia relacional estándar.',
    },
    {
      id: 'devops',
      name: 'DevOps & Cloud Infrastructure',
      weight: 15,
      score: devopsScore,
      rawScore: Number(devopsRaw.toFixed(2)),
      confidence: raw.devops_cloud?.confidence ?? evalData.confidence ?? 0.9,
      feedback: devopsScore >= 75
        ? 'Despliegues con contenedores Docker, CI/CD automatizado y arquitecturas Cloud.'
        : 'Despliegues manuales o conocimiento superficial de infraestructura y contenedores.',
    },
    {
      id: 'businessImpact',
      name: 'Business Impact & Leadership',
      weight: 20,
      score: bizScore,
      rawScore: Number(bizRaw.toFixed(2)),
      confidence: raw.business_impact?.confidence ?? evalData.confidence ?? 0.9,
      feedback: bizScore >= 75
        ? 'Liderazgo técnico comprobado, mentoría de equipos y resultados cuantificables de negocio.'
        : 'Contribuidor individual enfocado en ejecución de tareas asignadas.',
    },
  ];

  const lower = cvText.toLowerCase();
  const techPool = [
    'React', 'Next.js', 'TypeScript', 'Node.js', 'PostgreSQL', 'Docker',
    'Kubernetes', 'Redis', 'AWS', 'GCP', 'Prisma', 'Drizzle', 'GraphQL', 'CI/CD'
  ];
  const detectedSkills = techPool.filter((t) => lower.includes(t.toLowerCase()));

  return {
    candidateName,
    yearsOfExperience: seniority === 'Architect' ? 10 : seniority === 'Lead / Staff' ? 8 : seniority === 'Senior' ? 5 : 2,
    seniorityLevel: seniority,
    seniorityConfidence: seniorityConf,
    summary: `Evaluación técnica discriminativa generada con TypeSafe AI (JEV). Score global rubricado: ${evalData.overallScore.toFixed(2)}/4.0 (${evalData.normalizedScore}%).`,
    frontendScore: feScore,
    backendScore: beScore,
    databaseScore: dbScore,
    devopsScore: devopsScore,
    businessImpactScore: bizScore,
    overallScore: Math.round(evalData.normalizedScore),
    passed,
    decision: passed ? 'Pasa a Entrevista' : 'No Pasa',
    hasContainerizationProb: raw.has_containerization?.noul ?? 0.5,
    hasModernStackProb: raw.has_modern_stack?.noul ?? 0.5,
    categories,
    detectedSkills,
    missingKeywords: [],
    highlights: [
      `Score Ordinal Rubricado: ${evalData.overallScore.toFixed(2)} / 4.0`,
      `Recomendación Oficial: ${evalData.recommendation}`,
      `Seniority Inferido: ${seniority}`,
    ],
    metrics: {
      promptTokens: evalData.inputTokens,
      completionTokens: evalData.outputTokens || 0,
      totalTokens: evalData.inputTokens + (evalData.outputTokens || 0),
      apiCost: formatJevCost(evalData.costUsd),
      executionTimeMs: evalData.processingTimeMs || 0,
    },
    evaluatedAt: evalData.createdAt ? new Date(evalData.createdAt).toISOString() : new Date().toISOString(),
  };
}
