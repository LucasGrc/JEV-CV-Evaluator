import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { InvoiceVerdict } from '@prisma/client';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const invoice = await prisma.invoiceDocument.findUnique({
      where: { id: params.id },
      include: {
        evaluation: true,
        process: true,
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: 'Factura no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(invoice);
  } catch (error: any) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json(
      { error: error.message || 'Error al obtener factura' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { reviewerNotes, verdict, reviewedBy } = body;

    const invoice = await prisma.invoiceDocument.findUnique({
      where: { id: params.id },
      include: { evaluation: true },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: 'Factura no encontrada' },
        { status: 404 }
      );
    }

    if (!invoice.evaluation) {
      return NextResponse.json(
        { error: 'La factura aún no ha sido evaluada' },
        { status: 400 }
      );
    }

    const dataToUpdate: any = {
      reviewedAt: new Date(),
      reviewedBy: reviewedBy || 'Revisor de Finanzas',
    };

    if (reviewerNotes !== undefined) {
      dataToUpdate.reviewerNotes = reviewerNotes;
    }

    if (verdict !== undefined) {
      const validVerdicts: InvoiceVerdict[] = ['APPROVED', 'MANUAL_REVIEW', 'REJECTED'];
      if (!validVerdicts.includes(verdict)) {
        return NextResponse.json(
          { error: `Veredicto inválido. Opciones: ${validVerdicts.join(', ')}` },
          { status: 400 }
        );
      }
      dataToUpdate.verdict = verdict;
    }

    const updatedEvaluation = await prisma.invoiceEvaluation.update({
      where: { invoiceId: params.id },
      data: dataToUpdate,
    });

    return NextResponse.json(updatedEvaluation);
  } catch (error: any) {
    console.error('Error updating invoice evaluation:', error);
    return NextResponse.json(
      { error: error.message || 'Error al actualizar evaluación de factura' },
      { status: 500 }
    );
  }
}
