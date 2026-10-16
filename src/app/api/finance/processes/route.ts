import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const processes = await prisma.invoiceProcess.findMany({
      include: {
        invoices: {
          include: {
            evaluation: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(processes);
  } catch (error: any) {
    console.error('Error fetching invoice processes:', error);
    return NextResponse.json(
      { error: error.message || 'Error al obtener procesos de facturas' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title,
      description,
      periodMonth,
      periodYear,
      employeeName,
      employeeCi,
      department,
      maxAmountThreshold,
      suspiciousConcepts,
    } = body;

    if (!title || !periodMonth || !periodYear || !employeeName || !employeeCi) {
      return NextResponse.json(
        {
          error:
            'Campos requeridos: title, periodMonth, periodYear, employeeName, employeeCi',
        },
        { status: 400 }
      );
    }

    const process = await prisma.invoiceProcess.create({
      data: {
        title,
        description: description || null,
        periodMonth,
        periodYear: parseInt(periodYear, 10),
        employeeName,
        employeeCi,
        department: department || 'Finanzas',
        maxAmountThreshold: maxAmountThreshold ? parseFloat(maxAmountThreshold) : 10000.0,
        suspiciousConcepts:
          suspiciousConcepts ||
          'Compra o instalación de ascensores, elevadores, maquinaria pesada, obras civiles de construcción a granel o activos industriales.',
        status: 'ACTIVE',
      },
      include: {
        invoices: true,
      },
    });

    return NextResponse.json(process, { status: 201 });
  } catch (error: any) {
    console.error('Error creating invoice process:', error);
    return NextResponse.json(
      { error: error.message || 'Error al crear proceso de facturas' },
      { status: 500 }
    );
  }
}
