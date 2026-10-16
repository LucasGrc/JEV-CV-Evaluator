import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const vacancyId = params.id;
    const vacancy = await prisma.vacancy.findUnique({
      where: { id: vacancyId },
    });

    if (!vacancy) {
      return NextResponse.json(
        { error: 'Vacante no encontrada' },
        { status: 404 }
      );
    }

    // 1. Obtener postulaciones para saber qué candidatos limpiar
    const apps = await prisma.application.findMany({
      where: { vacancyId },
      include: { candidate: true },
    });

    // 2. Eliminar todas las postulaciones de esta vacante (cascada elimina evaluaciones y jobQueue)
    const deletedResult = await prisma.application.deleteMany({
      where: { vacancyId },
    });

    // 3. Limpiar candidatos y documentos si no tienen otras postulaciones
    for (const app of apps) {
      const otherApps = await prisma.application.count({
        where: { candidateId: app.candidateId },
      });
      if (otherApps === 0) {
        await prisma.cvDocument.deleteMany({
          where: { candidateId: app.candidateId },
        }).catch(() => {});
        await prisma.candidate.delete({
          where: { id: app.candidateId },
        }).catch(() => {});
      }
    }

    return NextResponse.json({
      success: true,
      deletedCount: deletedResult.count,
      message: `Se eliminaron exitosamente ${deletedResult.count} CV(s) evaluados. La vacante está lista para cargar nuevos archivos.`,
    });
  } catch (error: any) {
    console.error('Error resetting vacancy applications:', error);
    return NextResponse.json(
      { error: error.message || 'Error al eliminar CVs de la vacante' },
      { status: 500 }
    );
  }
}
