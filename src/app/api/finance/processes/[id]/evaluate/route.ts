import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { invoiceEvaluator } from '@/lib/invoiceEvaluator';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const processId = params.id;
    const isStream = req.nextUrl.searchParams.get('stream') === 'true';

    const processRecord = await prisma.invoiceProcess.findUnique({
      where: { id: processId },
      include: {
        invoices: {
          where: { status: 'PENDING' },
          include: { evaluation: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!processRecord) {
      return NextResponse.json(
        { error: 'Proceso de facturas no encontrado' },
        { status: 404 }
      );
    }

    if (processRecord.invoices.length === 0) {
      return NextResponse.json(
        { message: 'No hay facturas pendientes de evaluación en este proceso' },
        { status: 200 }
      );
    }

    const startTime = Date.now();
    let totalTokens = 0;
    let totalCostUsd = 0;
    let approvedCount = 0;
    let manualReviewCount = 0;
    let rejectedCount = 0;

    // Si el cliente solicita streaming en tiempo real (Server-Sent Events)
    if (isStream) {
      const encoder = new TextEncoder();
      const totalInvoices = processRecord.invoices.length;

      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            let current = 0;

            for (const inv of processRecord.invoices) {
              current++;
              const items = (inv.items as any) || [];

              const evalResult = await invoiceEvaluator.evaluateInvoice({
                employee: {
                  name: processRecord.employeeName,
                  ci: processRecord.employeeCi,
                },
                invoice: {
                  buyerName: inv.buyerName,
                  buyerCi: inv.buyerCi,
                  invoiceNumber: inv.invoiceNumber,
                  invoiceDate: inv.invoiceDate,
                  totalAmount: inv.totalAmount,
                  items,
                  rawText: inv.extractedText,
                },
                policy: {
                  maxAmountThreshold: processRecord.maxAmountThreshold,
                  mathTolerance: processRecord.mathTolerance,
                  suspiciousConceptsRule: processRecord.suspiciousConcepts,
                  requireStrictCiMatch: processRecord.requireStrictCiMatch,
                },
              });

              // Guardar evaluación en PostgreSQL
              const savedEval = await prisma.invoiceEvaluation.upsert({
                where: { invoiceId: inv.id },
                create: {
                  invoiceId: inv.id,
                  verdict: evalResult.verdict,
                  identityMatch: evalResult.identityMatch,
                  identityMatchScore: evalResult.identityMatchScore,
                  mathConsistent: evalResult.mathConsistent,
                  calculatedSum: evalResult.calculatedSum,
                  declaredTotal: evalResult.declaredTotal,
                  sumDifference: evalResult.sumDifference,
                  amountAlert: evalResult.amountAlert,
                  suspiciousConceptAlert: evalResult.suspiciousConceptAlert,
                  suspiciousDetails: evalResult.suspiciousDetails,
                  reasons: evalResult.reasons,
                  jevReasoning: evalResult.jevReasoning,
                  jevRawResponse: evalResult.jevRawResponse ? (evalResult.jevRawResponse as any) : undefined,
                  confidence: evalResult.confidence,
                  inputTokens: evalResult.inputTokens,
                  costUsd: evalResult.costUsd,
                  processingTimeMs: evalResult.processingTimeMs,
                },
                update: {
                  verdict: evalResult.verdict,
                  identityMatch: evalResult.identityMatch,
                  identityMatchScore: evalResult.identityMatchScore,
                  mathConsistent: evalResult.mathConsistent,
                  calculatedSum: evalResult.calculatedSum,
                  declaredTotal: evalResult.declaredTotal,
                  sumDifference: evalResult.sumDifference,
                  amountAlert: evalResult.amountAlert,
                  suspiciousConceptAlert: evalResult.suspiciousConceptAlert,
                  suspiciousDetails: evalResult.suspiciousDetails,
                  reasons: evalResult.reasons,
                  jevReasoning: evalResult.jevReasoning,
                  jevRawResponse: evalResult.jevRawResponse ? (evalResult.jevRawResponse as any) : undefined,
                  confidence: evalResult.confidence,
                  inputTokens: evalResult.inputTokens,
                  costUsd: evalResult.costUsd,
                  processingTimeMs: evalResult.processingTimeMs,
                },
              });

              // Actualizar documento
              await prisma.invoiceDocument.update({
                where: { id: inv.id },
                data: { status: 'EVALUATED' },
              });

              totalTokens += evalResult.inputTokens;
              totalCostUsd += evalResult.costUsd;

              if (evalResult.verdict === 'APPROVED') approvedCount++;
              else if (evalResult.verdict === 'MANUAL_REVIEW') manualReviewCount++;
              else rejectedCount++;

              // Emitir chunk SSE en tiempo real
              const chunkData = {
                type: 'invoice_evaluated',
                invoiceId: inv.id,
                evaluation: savedEval,
                progress: {
                  current,
                  total: totalInvoices,
                  percentage: Math.round((current / totalInvoices) * 100),
                },
                liveStats: {
                  approvedCount,
                  manualReviewCount,
                  rejectedCount,
                  totalCostUsd,
                  totalTokens,
                  elapsedMs: Date.now() - startTime,
                },
              };

              controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunkData)}\n\n`));
            }

            // Evento final de completado
            const completeData = {
              type: 'complete',
              totalEvaluated: totalInvoices,
              approvedCount,
              manualReviewCount,
              rejectedCount,
              totalCostUsd,
              totalTokens,
              totalProcessingTimeMs: Date.now() - startTime,
            };

            controller.enqueue(encoder.encode(`data: ${JSON.stringify(completeData)}\n\n`));
            controller.close();
          } catch (streamErr: any) {
            console.error('Error in evaluation stream:', streamErr);
            const errData = {
              type: 'error',
              error: streamErr.message || 'Error durante el procesamiento en streaming',
            };
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(errData)}\n\n`));
            controller.close();
          }
        },
      });

      return new Response(readableStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive',
        },
      });
    }

    // Modo estándar sincrónico (fallback sin stream)
    for (const inv of processRecord.invoices) {
      const items = (inv.items as any) || [];
      const evalResult = await invoiceEvaluator.evaluateInvoice({
        employee: {
          name: processRecord.employeeName,
          ci: processRecord.employeeCi,
        },
        invoice: {
          buyerName: inv.buyerName,
          buyerCi: inv.buyerCi,
          invoiceNumber: inv.invoiceNumber,
          invoiceDate: inv.invoiceDate,
          totalAmount: inv.totalAmount,
          items,
          rawText: inv.extractedText,
        },
        policy: {
          maxAmountThreshold: processRecord.maxAmountThreshold,
          mathTolerance: processRecord.mathTolerance,
          suspiciousConceptsRule: processRecord.suspiciousConcepts,
          requireStrictCiMatch: processRecord.requireStrictCiMatch,
        },
      });

      await prisma.invoiceEvaluation.upsert({
        where: { invoiceId: inv.id },
        create: {
          invoiceId: inv.id,
          verdict: evalResult.verdict,
          identityMatch: evalResult.identityMatch,
          identityMatchScore: evalResult.identityMatchScore,
          mathConsistent: evalResult.mathConsistent,
          calculatedSum: evalResult.calculatedSum,
          declaredTotal: evalResult.declaredTotal,
          sumDifference: evalResult.sumDifference,
          amountAlert: evalResult.amountAlert,
          suspiciousConceptAlert: evalResult.suspiciousConceptAlert,
          suspiciousDetails: evalResult.suspiciousDetails,
          reasons: evalResult.reasons,
          jevReasoning: evalResult.jevReasoning,
          jevRawResponse: evalResult.jevRawResponse ? (evalResult.jevRawResponse as any) : undefined,
          confidence: evalResult.confidence,
          inputTokens: evalResult.inputTokens,
          costUsd: evalResult.costUsd,
          processingTimeMs: evalResult.processingTimeMs,
        },
        update: {
          verdict: evalResult.verdict,
          identityMatch: evalResult.identityMatch,
          identityMatchScore: evalResult.identityMatchScore,
          mathConsistent: evalResult.mathConsistent,
          calculatedSum: evalResult.calculatedSum,
          declaredTotal: evalResult.declaredTotal,
          sumDifference: evalResult.sumDifference,
          amountAlert: evalResult.amountAlert,
          suspiciousConceptAlert: evalResult.suspiciousConceptAlert,
          suspiciousDetails: evalResult.suspiciousDetails,
          reasons: evalResult.reasons,
          jevReasoning: evalResult.jevReasoning,
          jevRawResponse: evalResult.jevRawResponse ? (evalResult.jevRawResponse as any) : undefined,
          confidence: evalResult.confidence,
          inputTokens: evalResult.inputTokens,
          costUsd: evalResult.costUsd,
          processingTimeMs: evalResult.processingTimeMs,
        },
      });

      await prisma.invoiceDocument.update({
        where: { id: inv.id },
        data: { status: 'EVALUATED' },
      });

      totalTokens += evalResult.inputTokens;
      totalCostUsd += evalResult.costUsd;

      if (evalResult.verdict === 'APPROVED') approvedCount++;
      else if (evalResult.verdict === 'MANUAL_REVIEW') manualReviewCount++;
      else rejectedCount++;
    }

    const totalProcessingTimeMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      evaluatedCount: processRecord.invoices.length,
      approvedCount,
      manualReviewCount,
      rejectedCount,
      totalTokens,
      totalCostUsd,
      totalProcessingTimeMs,
    });
  } catch (error: any) {
    console.error('Error evaluating invoices in bulk:', error);
    return NextResponse.json(
      { error: error.message || 'Error durante la evaluación de facturas' },
      { status: 500 }
    );
  }
}
