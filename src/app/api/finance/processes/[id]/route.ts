import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { InvoiceProcessStatus } from '@prisma/client';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const process = await prisma.invoiceProcess.findUnique({
      where: { id: params.id },
      include: {
        invoices: {
          include: {
            evaluation: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!process) {
      return NextResponse.json(
        { error: 'Proceso de facturas no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(process);
  } catch (error: any) {
    console.error('Error fetching invoice process:', error);
    return NextResponse.json(
      { error: error.message || 'Error al obtener proceso' },
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
    const { status, maxAmountThreshold, suspiciousConcepts } = body;

    const dataToUpdate: any = {};

    if (status !== undefined) {
      const validStatuses: InvoiceProcessStatus[] = ['ACTIVE', 'PAUSED', 'CLOSED', 'ARCHIVED'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: `Estado inválido. Opciones: ${validStatuses.join(', ')}` },
          { status: 400 }
        );
      }
      dataToUpdate.status = status;
    }

    if (maxAmountThreshold !== undefined) {
      dataToUpdate.maxAmountThreshold = parseFloat(maxAmountThreshold);
    }

    if (suspiciousConcepts !== undefined) {
      dataToUpdate.suspiciousConcepts = suspiciousConcepts;
    }

    const updated = await prisma.invoiceProcess.update({
      where: { id: params.id },
      data: dataToUpdate,
      include: {
        invoices: {
          include: {
            evaluation: true,
          },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating invoice process:', error);
    return NextResponse.json(
      { error: error.message || 'Error al actualizar proceso' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.invoiceProcess.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting invoice process:', error);
    return NextResponse.json(
      { error: error.message || 'Error al eliminar proceso' },
      { status: 500 }
    );
  }
}
