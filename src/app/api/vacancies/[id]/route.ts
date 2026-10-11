import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { VacancyStatus } from '@prisma/client';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const vacancy = await prisma.vacancy.findUnique({
      where: { id: params.id },
      include: {
        author: {
          select: { name: true, email: true },
        },
        applications: {
          include: {
            candidate: true,
            cvDocument: true,
            evaluation: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!vacancy) {
      return NextResponse.json({ error: 'Vacancy not found' }, { status: 404 });
    }

    return NextResponse.json(vacancy);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const {
      status,
      title,
      department,
      description,
      minScoreThreshold,
      weightSkills,
      weightExperience,
      weightEducation,
      weightLeadership,
    } = body;

    const dataToUpdate: any = {};

    if (status && Object.values(VacancyStatus).includes(status)) {
      dataToUpdate.status = status as VacancyStatus;
    }
    if (title) dataToUpdate.title = title;
    if (department) dataToUpdate.department = department;
    if (description !== undefined) dataToUpdate.description = description;
    if (minScoreThreshold !== undefined) {
      dataToUpdate.minScoreThreshold = parseFloat(minScoreThreshold.toString());
    }
    if (weightSkills !== undefined) dataToUpdate.weightSkills = parseFloat(weightSkills.toString());
    if (weightExperience !== undefined) {
      dataToUpdate.weightExperience = parseFloat(weightExperience.toString());
    }
    if (weightEducation !== undefined) {
      dataToUpdate.weightEducation = parseFloat(weightEducation.toString());
    }
    if (weightLeadership !== undefined) {
      dataToUpdate.weightLeadership = parseFloat(weightLeadership.toString());
    }

    const updated = await prisma.vacancy.update({
      where: { id: params.id },
      data: dataToUpdate,
      include: {
        author: { select: { name: true, email: true } },
        applications: {
          include: {
            candidate: true,
            cvDocument: true,
            evaluation: true,
          },
        },
      },
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        action: 'VACANCY_UPDATED',
        entityType: 'Vacancy',
        entityId: updated.id,
        metadata: {
          newStatus: updated.status,
          title: updated.title,
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const vacancy = await prisma.vacancy.findUnique({
      where: { id: params.id },
      include: { applications: true },
    });

    if (!vacancy) {
      return NextResponse.json({ error: 'Vacancy not found' }, { status: 404 });
    }

    // Mark as CLOSED or delete if 0 applications
    if (vacancy.applications.length > 0) {
      const closed = await prisma.vacancy.update({
        where: { id: params.id },
        data: { status: VacancyStatus.CLOSED },
      });
      return NextResponse.json({
        message: 'Vacancy contains candidate applications and was marked as CLOSED',
        vacancy: closed,
      });
    }

    await prisma.vacancy.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: 'Vacancy deleted' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
