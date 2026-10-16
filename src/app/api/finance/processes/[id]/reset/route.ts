import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const processId = params.id;
    const process = await prisma.invoiceProcess.findUnique({
      where: { id: processId },
      include: { invoices: true },
    });

    if (!process) {
      return NextResponse.json(
        { error: 'Proceso de facturas no encontrado' },
        { status: 404 }
      );
    }

    // 1. Eliminar todas las evaluaciones asociadas a las facturas de este proceso
    const deletedEvals = await prisma.invoiceEvaluation.deleteMany({
      where: {
        invoice: { processId },
      },
    });

    // 2. Restablecer todos los documentos a estado PENDING
    const updatedDocs = await prisma.invoiceDocument.updateMany({
      where: { processId },
      data: { status: 'PENDING' },
    });

    return NextResponse.json({
      success: true,
      message: `Se reiniciaron ${updatedDocs.count} facturas a estado pendiente para repetir la demostración.`,
      resetCount: updatedDocs.count,
      deletedEvaluationsCount: deletedEvals.count,
    });
  } catch (error: any) {
    console.error('Error resetting invoice process:', error);
    return NextResponse.json(
      { error: error.message || 'Error al reiniciar proceso de facturas' },
      { status: 500 }
    );
  }
}
