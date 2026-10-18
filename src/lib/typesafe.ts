/**
 * ==============================================================================
 * TypeSafe AI (JEV) - Client Module & System One Invocation Engine
 * ==============================================================================
 * Utiliza el SDK oficial `@typesafe-ai/sdk` para enviar estado y preguntas tipadas
 * a JEV (System One).
 * Tarifas oficiales JEV: $0.042 por 1,000,000 tokens de entrada; tokens de salida gratis.
 * ==============================================================================
 */

import { TypeSafeClient } from '@typesafe-ai/sdk';
import {
  CV_EVALUATION_QUESTIONS,
  CVEvaluationQuestionsType,
  SeniorityLevel,
} from '@/types/evaluation';
import { detectLanguage } from '@/lib/languageDetector';
import { calculateJevCostUsd } from '@/lib/pricing';
import { createTypeSafeClient } from '@/lib/typesafeConfig';

export interface SystemOneEvaluationResponse {
  answers: {
    frontend_depth: { score: number; confidence: number };
    backend_depth: { score: number; confidence: number };
    database_depth: { score: number; confidence: number };
    devops_cloud: { score: number; confidence: number };
    business_impact: { score: number; confidence: number };
    seniority_level: { choice: SeniorityLevel; confidence: number };
    has_containerization: { noul: number };
    has_modern_stack: { noul: number };
  };
  usage: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
    cost_usd: number;
  };
  model: string;
  isSimulated?: boolean;
}

export class TypeSafeEngine {
  private client: TypeSafeClient;
  private hasApiKey: boolean;

  constructor() {
    const { client, hasApiKey } = createTypeSafeClient();
    this.client = client;
    this.hasApiKey = hasApiKey;
  }

  /**
   * Ejecuta la evaluación del CV con el modelo System One (JEV)
   * 1. Verifica política de idioma (Inglés obligatorio)
   * 2. Envía estado y preguntas a JEV
   * 3. Calcula costo financiero exacto ($0.042/1M input tokens)
   */
  async evaluateResume(cvText: string, options: { bypassLanguageCheck?: boolean } = {}): Promise<SystemOneEvaluationResponse> {
    // 1. Language policy check (English only)
    if (!options.bypassLanguageCheck) {
      const langCheck = await detectLanguage(cvText);
      if (!langCheck.isEnglish) {
        throw new Error(
          `LANGUAGE_POLICY_VIOLATION: Document is in '${langCheck.language}'. ${langCheck.reason || 'Company policy requires resumes in English.'}`
        );
      }
    }

    // 2. Real API invocation via @typesafe-ai/sdk
    if (this.hasApiKey) {
      try {
        const response = await this.client.systemOne<CVEvaluationQuestionsType>({
          state: {
            resume: cvText,
          },
          questions: CV_EVALUATION_QUESTIONS,
        });

        const inputTokens = response.usage.input_tokens || Math.ceil(cvText.length / 3.8);
        const outputTokens = response.usage.output_tokens || 0;
        const costUsd = calculateJevCostUsd(inputTokens, outputTokens);

        return {
          answers: {
            frontend_depth: {
              score: response.answers.frontend_depth.score,
              confidence: response.answers.frontend_depth.confidence,
            },
            backend_depth: {
              score: response.answers.backend_depth.score,
              confidence: response.answers.backend_depth.confidence,
            },
            database_depth: {
              score: response.answers.database_depth.score,
              confidence: response.answers.database_depth.confidence,
            },
            devops_cloud: {
              score: response.answers.devops_cloud.score,
              confidence: response.answers.devops_cloud.confidence,
            },
            business_impact: {
              score: response.answers.business_impact.score,
              confidence: response.answers.business_impact.confidence,
            },
            seniority_level: {
              choice: response.answers.seniority_level.choice as SeniorityLevel,
              confidence: response.answers.seniority_level.confidence,
            },
            has_containerization: {
              noul: response.answers.has_containerization.noul,
            },
            has_modern_stack: {
              noul: response.answers.has_modern_stack.noul,
            },
          },
          usage: {
            input_tokens: inputTokens,
            output_tokens: outputTokens,
            total_tokens: inputTokens + outputTokens,
            cost_usd: costUsd,
          },
          model: response.model || 'jev-1.13.0',
          isSimulated: false,
        };
      } catch (error: any) {
        console.error('[TypeSafeEngine] JEV API invocation failed:', error.message);
        throw new Error(`JEV_INVOCATION_ERROR: ${error.message}`);
      }
    }

    // Si no hay API key configurada, lanzar error explícito indicando la necesidad de credenciales
    throw new Error(
      'MISSING_TYPESAFE_API_KEY: Set TYPESAFE_API_KEY in .env.local to evaluate candidates with real JEV models.'
    );
  }
}

export const typeSafeEngine = new TypeSafeEngine();
