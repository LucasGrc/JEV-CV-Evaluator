import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const application = await prisma.application.findUnique({
      where: { id: params.id },
      include: {
        candidate: true,
        cvDocument: true,
        evaluation: true,
        vacancy: {
          select: { id: true, title: true, department: true },
        },
      },
    });

    if (!application) {
      return NextResponse.json(
        { error: 'Postulación no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(application);
  } catch (error: any) {
    console.error('Error fetching application:', error);
    return NextResponse.json(
      { error: error.message || 'Error al obtener postulación' },
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
    const { stage, recruiterNotes } = body;

    const dataToUpdate: any = {};

    if (stage !== undefined) {
      const validStages = [
        'APPLIED',
        'REVIEWING',
        'INTERVIEW',
        'OFFER',
        'HIRED',
        'REJECTED',
      ];
      if (!validStages.includes(stage)) {
        return NextResponse.json(
          { error: `Etapa inválida. Permitidas: ${validStages.join(', ')}` },
          { status: 400 }
        );
      }
      dataToUpdate.stage = stage;
    }

    if (recruiterNotes !== undefined) {
      dataToUpdate.recruiterNotes = recruiterNotes;
    }

    const updated = await prisma.application.update({
      where: { id: params.id },
      data: dataToUpdate,
      include: {
        candidate: true,
        cvDocument: true,
        evaluation: true,
      },
    });

    // Register audit log
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE_APPLICATION',
        entityType: 'Application',
        entityId: updated.id,
        metadata: {
          updatedFields: Object.keys(dataToUpdate),
          stage: updated.stage,
          hasNotes: !!updated.recruiterNotes,
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating application:', error);
    return NextResponse.json(
      { error: error.message || 'Error al actualizar postulación' },
      { status: 500 }
    );
  }
}
