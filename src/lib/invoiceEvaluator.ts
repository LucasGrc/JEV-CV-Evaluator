import { choice } from '@typesafe-ai/sdk';
import { TypeSafeClient } from '@typesafe-ai/sdk';
import { calculateJevCostUsd } from '@/lib/pricing';
import { ParsedInvoiceItem } from './invoiceParser';

/**
 * Preguntas formales de juicio semántico para TypeSafe AI (JEV - System One)
 */
export const INVOICE_EVALUATION_QUESTIONS = {
  suspicious_concept: choice(
    'Based on the provided invoice items, does this invoice contain purchases of industrial, heavy machinery, building infrastructure, or large-scale commercial assets (such as elevators, cranes, bulk construction concrete, industrial equipment, or corporate subcontracting) that are anomalous and inappropriate for a natural person / individual employee expense claim?',
    {
      NORMAL:
        'Standard personal, travel, office, or operational employee expenses (food/meals, local transport, hotel, stationery, pharmacy/medical, consumer tech/peripherals, standard minor tools)',
      SUSPICIOUS:
        'Anomalous, industrial, structural, or heavy machinery purchases (elevators, lifts, civil engineering, industrial equipment, wholesale building materials, commercial fleet assets)',
    }
  ),
  identity_match: choice(
    'Does the buyer name and/or identification on the invoice correspond to or reasonably match the declared employee, allowing for standard name abbreviations, single surnames, or minor spelling variants?',
    {
      MATCH:
        'The buyer information matches or reasonably corresponds to the employee name/identity',
      MISMATCH:
        'The invoice is clearly and unambiguously issued to a completely different individual, third-party entity, or unrelated company',
    }
  ),
  expense_coherence: choice(
    'Is the nature of the transaction coherent with legitimate employee expense presentation according to the described items and amounts?',
    {
      COHERENT:
        'Items and amounts represent coherent and customary business/personal expenses',
      INCOHERENT:
        'The transaction contains conflicting, suspicious, or irregular items that warrant accounting audit',
    }
  ),
};

export type InvoiceQuestionsType = typeof INVOICE_EVALUATION_QUESTIONS;

export interface InvoiceEvaluationInput {
  employee: {
    name: string;
    ci: string;
  };
  invoice: {
    buyerName: string | null;
    buyerCi: string | null;
    invoiceNumber: string | null;
    invoiceDate: string | null;
    totalAmount: number | null;
    items: ParsedInvoiceItem[];
    rawText: string;
  };
  policy: {
    maxAmountThreshold: number;
    mathTolerance: number;
    suspiciousConceptsRule?: string | null;
    requireStrictCiMatch?: boolean;
  };
}

export interface InvoiceEvaluationResult {
  verdict: 'APPROVED' | 'MANUAL_REVIEW' | 'REJECTED';
  identityMatch: boolean;
  identityMatchScore: number;
  mathConsistent: boolean;
  calculatedSum: number | null;
  declaredTotal: number | null;
  sumDifference: number | null;
  amountAlert: boolean;
  suspiciousConceptAlert: boolean;
  suspiciousDetails: string | null;
  reasons: string[];
  jevReasoning: string;
  jevRawResponse?: any;
  confidence: number;
  inputTokens: number;
  costUsd: number;
  processingTimeMs: number;
}

export class InvoiceEvaluator {
  private client: TypeSafeClient;
  private hasApiKey: boolean;

  constructor() {
    const apiKey =
      process.env.TYPESAFE_API_KEY ||
      process.env.TYPESAFE_AI_API_KEY;

    this.hasApiKey = Boolean(
      apiKey &&
      apiKey !== 'tsa_live_tu_api_key_aqui' &&
      !apiKey.includes('tu_api_key')
    );

    this.client = new TypeSafeClient({
      apiKey: apiKey || 'unconfigured-api-key',
    });
  }

  async evaluateInvoice(input: InvoiceEvaluationInput): Promise<InvoiceEvaluationResult> {
    const startTime = Date.now();
    const reasons: string[] = [];
    const { employee, invoice, policy } = input;

    // =========================================================================
    // 1. REGLA DETERMINISTA: Verificación Matemática (Ítems vs Total)
    // =========================================================================
    let mathConsistent = true;
    let calculatedSum: number | null = null;
    const declaredTotal = invoice.totalAmount;
    let sumDifference: number | null = null;

    if (invoice.items && invoice.items.length > 0) {
      calculatedSum = invoice.items.reduce((acc, it) => acc + (it.subtotal || 0), 0);
      calculatedSum = Math.round(calculatedSum * 100) / 100;

      if (declaredTotal !== null) {
        sumDifference = Math.abs(calculatedSum - declaredTotal);
        sumDifference = Math.round(sumDifference * 100) / 100;

        if (sumDifference > policy.mathTolerance) {
          mathConsistent = false;
          reasons.push(
            `Inconsistencia matemática: la suma de ítems (${calculatedSum.toFixed(2)} Bs) difiere del total declarado (${declaredTotal.toFixed(2)} Bs) por ${sumDifference.toFixed(2)} Bs.`
          );
        }
      }
    }

    // =========================================================================
    // 2. REGLA DETERMINISTA: Verificación de Identidad (CI / NIT)
    // =========================================================================
    let identityMatch = true;
    let identityMatchScore = 1.0;

    const normalizeCi = (ci: string) => ci.replace(/[^0-9]/g, '');
    const cleanEmpCi = normalizeCi(employee.ci);
    const cleanBuyerCi = invoice.buyerCi ? normalizeCi(invoice.buyerCi) : '';

    if (cleanBuyerCi && cleanEmpCi) {
      if (cleanBuyerCi !== cleanEmpCi) {
        // Si el CI está explícitamente en la factura y no coincide
        identityMatch = false;
        identityMatchScore = 0.0;
        reasons.push(
          `Cédula/NIT no coincide: La factura indica CI/NIT ${invoice.buyerCi}, pero el empleado registrado es ${employee.ci} (${employee.name}).`
        );
      }
    }

    // =========================================================================
    // 3. REGLA DETERMINISTA: Umbral de Monto Elevado (> 10.000 Bs)
    // =========================================================================
    let amountAlert = false;
    if (declaredTotal !== null && declaredTotal > policy.maxAmountThreshold) {
      amountAlert = true;
      reasons.push(
        `Monto elevado (${declaredTotal.toFixed(2)} Bs): supera el umbral límite de ${policy.maxAmountThreshold.toFixed(2)} Bs establecido para personas naturales.`
      );
    }

    // =========================================================================
    // 4. REGLA SEMÁNTICA CON TYPESAFE AI (JEV): Conceptos Atípicos / Coherencia
    // =========================================================================
    let suspiciousConceptAlert = false;
    let suspiciousDetails: string | null = null;
    let jevReasoning = '';
    let confidence = 0.95;
    let inputTokens = 0;
    let costUsd = 0.0;
    let jevRawResponse: any = null;

    // Comprobación de palabras clave inmediatas (ej. ascensor) como fast-path determinista
    const rawLower = (invoice.rawText + ' ' + invoice.items.map((i) => i.description).join(' ')).toLowerCase();
    const explicitSuspiciousKeywords = ['ascensor', 'elevador', 'hormigonera', 'retroexcavadora', 'maquinaria pesada', 'obra civil', 'cemento a granel'];
    for (const kw of explicitSuspiciousKeywords) {
      if (rawLower.includes(kw)) {
        suspiciousConceptAlert = true;
        suspiciousDetails = `Detección de concepto atípico: "${kw.toUpperCase()}" (adquisición impropia de consumo personal/empleado).`;
        reasons.push(suspiciousDetails);
        break;
      }
    }

    // Consulta real a TypeSafe AI (JEV)
    if (this.hasApiKey) {
      try {
        const statePayload = {
          employee: {
            fullName: employee.name,
            nationalId: employee.ci,
          },
          invoice: {
            buyerName: invoice.buyerName || 'No especificado',
            buyerId: invoice.buyerCi || 'No especificado',
            totalAmountBs: declaredTotal,
            items: invoice.items.slice(0, 15),
            textExcerpt: invoice.rawText.slice(0, 1000),
          },
          policy: {
            maxAmountLimitBs: policy.maxAmountThreshold,
            suspiciousPolicyDescription: policy.suspiciousConceptsRule || 'Compras de ascensores, maquinaria pesada, obras civiles o activos industriales no aptos para una persona natural.',
          },
        };

        const response = await this.client.systemOne<InvoiceQuestionsType>({
          state: statePayload as any,
          questions: INVOICE_EVALUATION_QUESTIONS,
        });

        jevRawResponse = response;
        inputTokens = response.usage.input_tokens || 850;
        costUsd = calculateJevCostUsd(inputTokens, response.usage.output_tokens || 0);

        const jevSuspicious = response.answers.suspicious_concept;
        const jevIdentity = response.answers.identity_match;

        if (jevSuspicious.choice === 'SUSPICIOUS') {
          suspiciousConceptAlert = true;
          if (!suspiciousDetails) {
            suspiciousDetails =
              'TypeSafe JEV identificó que los conceptos facturados corresponden a bienes o activos industriales/corporativos inusuales para un empleado.';
            reasons.push(suspiciousDetails);
          }
        }

        if (jevIdentity.choice === 'MISMATCH' && identityMatch) {
          identityMatch = false;
          identityMatchScore = 0.2;
          reasons.push(
            `Falta de correspondencia de identidad: JEV determinó que el nombre en la factura ("${invoice.buyerName || 'Desconocido'}") pertenece a otra persona o empresa distinta a ${employee.name}.`
          );
        }

        confidence = Math.min(jevSuspicious.confidence, jevIdentity.confidence);
      } catch (err: any) {
        console.warn('[InvoiceEvaluator] TypeSafe JEV call error (using fallback):', err.message);
        inputTokens = 600;
        costUsd = calculateJevCostUsd(inputTokens, 0);
      }
    } else {
      // Heurística de tokens de desarrollo
      inputTokens = Math.max(300, Math.ceil(invoice.rawText.length / 4));
      costUsd = calculateJevCostUsd(inputTokens, 0);
    }

    // =========================================================================
    // 5. DETERMINACIÓN DEL VEREDICTO FINAL
    // =========================================================================
    let verdict: 'APPROVED' | 'MANUAL_REVIEW' | 'REJECTED' = 'APPROVED';

    if (!identityMatch || !mathConsistent) {
      verdict = 'REJECTED';
    } else if (amountAlert || suspiciousConceptAlert) {
      verdict = 'MANUAL_REVIEW';
    } else {
      verdict = 'APPROVED';
    }

    // Construcción de la justificación textual
    if (verdict === 'APPROVED') {
      jevReasoning = `Factura validada correctamente. El comprador coincide con el empleado (${employee.name}), la suma de los ítems es coherente con el total (${declaredTotal ? declaredTotal.toFixed(2) : 0} Bs), el importe no supera el umbral límite (${policy.maxAmountThreshold} Bs) y los conceptos corresponden a consumo admisible.`;
    } else if (verdict === 'MANUAL_REVIEW') {
      jevReasoning = `Factura marcada para REVISIÓN MANUAL por el equipo de finanzas debido a: ${reasons.join(' | ')}. Se requiere visto bueno de jefatura antes de su aprobación definitiva.`;
    } else {
      jevReasoning = `Factura RECHAZADA por incumplimiento de requisitos normativos o fiscales: ${reasons.join(' | ')}. No es admisible para el descargo mensual.`;
    }

    const processingTimeMs = Date.now() - startTime;

    return {
      verdict,
      identityMatch,
      identityMatchScore,
      mathConsistent,
      calculatedSum,
      declaredTotal,
      sumDifference,
      amountAlert,
      suspiciousConceptAlert,
      suspiciousDetails,
      reasons,
      jevReasoning,
      jevRawResponse,
      confidence,
      inputTokens,
      costUsd,
      processingTimeMs,
    };
  }
}

export const invoiceEvaluator = new InvoiceEvaluator();
