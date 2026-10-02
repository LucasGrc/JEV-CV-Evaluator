'use server';

/**
 * ==============================================================================
 * Server Action: evaluateCV (Refactorizado con TypeSafe AI System One)
 * ==============================================================================
 * 1. Extracción segura del buffer binario del PDF.
 * 2. Invocación paralela de preguntas tipadas a JEV.
 * 3. Composite Scoring (normalización 0-4 a 0-100 y pesos ponderados).
 * 4. Estimación de costos financieros de la API con 4 decimales.
 * ==============================================================================
 */

import { typeSafeEngine } from '@/lib/typesafe';
import {
  CategoryDetail,
  EvaluationActionResponse,
  EvaluationResult,
  PASSING_SCORE_THRESHOLD,
  WEIGHTS,
} from '@/types/evaluation';

function extractTextFallback(buffer: Buffer): string {
  const content = buffer.toString('latin1');
  const textChunks: string[] = [];
  const streamRegex = /BT[\s\S]*?ET/g;
  let match: RegExpExecArray | null;
  
  while ((match = streamRegex.exec(content)) !== null) {
    const rawChunk = match[0];
    const stringMatches = rawChunk.match(/\(([^)]+)\)|\[([^\]]+)\]/g);
    if (stringMatches) {
      stringMatches.forEach((str) => {
        const clean = str.replace(/[()[\]\\]/g, ' ').trim();
        if (clean.length > 1) {
          textChunks.push(clean);
        }
      });
    }
  }

  if (textChunks.length > 0) {
    return textChunks.join(' ');
  }

  const printable = content.replace(/[^\x20-\x7E\xA0-\xFF\n\r\t]/g, ' ');
  return printable.replace(/\s+/g, ' ').trim();
}

export async function evaluateCV(formData: FormData): Promise<EvaluationActionResponse> {
  const startTime = Date.now();

  try {
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return {
        success: false,
        error: 'No se recibió ningún archivo. Por favor, selecciona un documento PDF.',
      };
    }

    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      return {
        success: false,
        error: 'El archivo adjunto no es un PDF válido. Por favor, sube un archivo .pdf.',
      };
    }

    if (file.size > 15 * 1024 * 1024) {
      return {
        success: false,
        error: 'El archivo excede el tamaño máximo permitido (15 MB).',
      };
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    let extractedText = '';

    try {
      // @ts-ignore
      const pdfParseModule = await import('pdf-parse');
      const pdfParse = pdfParseModule.default || pdfParseModule;
      const pdfData = await pdfParse(buffer);
      extractedText = pdfData.text || '';
    } catch {
      extractedText = extractTextFallback(buffer);
    }

    if (!extractedText || extractedText.trim().length < 40) {
      extractedText = extractTextFallback(buffer);
    }

    if (!extractedText || extractedText.trim().length < 30) {
      return {
        success: false,
        error:
          'No se pudo extraer texto legible del PDF. Es posible que el archivo esté protegido o no contenga capa OCR.',
      };
    }

    // Invocación a TypeSafe AI (JEV)
    const { answers, usage } = await typeSafeEngine.evaluateResume(extractedText);

    // Normalización de Scores Ordinales de JEV (0 a 4) a Escala 0-100
    const frontendScore = Math.min(100, Math.max(0, Math.round((answers.frontend_depth.score / 4) * 100)));
    const backendScore = Math.min(100, Math.max(0, Math.round((answers.backend_depth.score / 4) * 100)));
    const databaseScore = Math.min(100, Math.max(0, Math.round((answers.database_depth.score / 4) * 100)));
    const devopsScore = Math.min(100, Math.max(0, Math.round((answers.devops_cloud.score / 4) * 100)));
    const businessImpactScore = Math.min(100, Math.max(0, Math.round((answers.business_impact.score / 4) * 100)));

    // Composite Scoring
    const computedOverall =
      frontendScore * WEIGHTS.frontend +
      backendScore * WEIGHTS.backend +
      databaseScore * WEIGHTS.database +
      devopsScore * WEIGHTS.devops +
      businessImpactScore * WEIGHTS.businessImpact;

    const overallScore = Math.round(computedOverall);
    const passed = overallScore >= PASSING_SCORE_THRESHOLD;
    const decision: 'Pasa a Entrevista' | 'No Pasa' = passed ? 'Pasa a Entrevista' : 'No Pasa';

    // Estimación Financiera
    const promptCost = (usage.input_tokens * 2.5) / 1_000_000;
    const completionCost = (usage.output_tokens * 10.0) / 1_000_000;
    const totalCost = promptCost + completionCost;
    const apiCost = `$${totalCost.toFixed(4)}`;

    const lowerCV = extractedText.toLowerCase();
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

    const firstLine = extractedText.split('\n').find((l) => l.trim().length > 3 && l.trim().length < 45) || 'Candidato Full-Stack';

    const categories: CategoryDetail[] = [
      {
        id: 'frontend',
        name: 'Front-End Development',
        weight: 25,
        score: frontendScore,
        rawScore: Number(answers.frontend_depth.score.toFixed(2)),
        confidence: answers.frontend_depth.confidence,
        feedback: frontendScore >= 75
          ? 'Dominio senior en frameworks modernos, tipado estricto con TypeScript y Web Vitals.'
          : 'Habilidades de maquetación aceptables con oportunidades de mejora en SSR y optimización.',
      },
      {
        id: 'backend',
        name: 'Back-End Architecture & APIs',
        weight: 25,
        score: backendScore,
        rawScore: Number(answers.backend_depth.score.toFixed(2)),
        confidence: answers.backend_depth.confidence,
        feedback: backendScore >= 75
          ? 'Arquitectura modular sólida, buen diseño de APIs REST/GraphQL y patrones de resiliencia.'
          : 'Manejo funcional de servicios backend, con necesidad de mayor robustez y concurrencia.',
      },
      {
        id: 'database',
        name: 'Base de Datos & Persistencia',
        weight: 15,
        score: databaseScore,
        rawScore: Number(answers.database_depth.score.toFixed(2)),
        confidence: answers.database_depth.confidence,
        feedback: databaseScore >= 75
          ? 'Excelente manejo relacional y de caching con Redis, esquemas ORM y optimización de queries.'
          : 'Uso básico de persistencia; requiere afianzar transacciones ACID y afinamiento de consultas.',
      },
      {
        id: 'devops',
        name: 'DevOps & Infraestructura Cloud',
        weight: 15,
        score: devopsScore,
        rawScore: Number(answers.devops_cloud.score.toFixed(2)),
        confidence: answers.devops_cloud.confidence,
        feedback: devopsScore >= 75
          ? 'Familiaridad con contenerización Docker, CI/CD automatizado y servicios cloud.'
          : 'Conocimientos limitados de infraestructura moderna y automatización de despliegues.',
      },
      {
        id: 'businessImpact',
        name: 'Impacto de Negocio & Liderazgo',
        weight: 20,
        score: businessImpactScore,
        rawScore: Number(answers.business_impact.score.toFixed(2)),
        confidence: answers.business_impact.confidence,
        feedback: businessImpactScore >= 75
          ? 'Fuerte orientación a objetivos de negocio, optimización de métricas de usuario y liderazgo.'
          : 'Adecuado cumplimiento operativo, pero con escasa evidencia cuantificable de impacto en el producto.',
      },
    ];

    const executionTimeMs = Date.now() - startTime;

    const finalResult: EvaluationResult = {
      candidateName: firstLine.trim(),
      yearsOfExperience: answers.seniority_level.choice === 'Junior' ? 2 : answers.seniority_level.choice === 'Semi-Senior' ? 4 : answers.seniority_level.choice === 'Senior' ? 6 : 9,
      seniorityLevel: answers.seniority_level.choice,
      seniorityConfidence: answers.seniority_level.confidence,
      summary: `Evaluación determinista procesada por JEV. Seniority clasificado: ${answers.seniority_level.choice} (confianza: ${(answers.seniority_level.confidence * 100).toFixed(0)}%). Score ponderado: ${overallScore}/100.`,
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
    };

    return {
      success: true,
      data: finalResult,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Error inesperado al evaluar el currículum con JEV.',
    };
  }
}
