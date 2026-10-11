import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { VacancyStatus } from '@prisma/client';

export async function GET() {
  try {
    const vacancies = await prisma.vacancy.findMany({
      include: {
        author: {
          select: { name: true, email: true },
        },
        applications: {
          include: {
            evaluation: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = vacancies.map((v) => {
      const totalCandidates = v.applications.length;
      const evaluated = v.applications.filter((a) => a.evaluation !== null);
      const evaluatedCount = evaluated.length;
      const totalCostUsd = evaluated.reduce((sum, a) => sum + (a.evaluation?.costUsd || 0), 0);
      const avgScore =
        evaluatedCount > 0
          ? evaluated.reduce((sum, a) => sum + (a.evaluation?.overallScore || 0), 0) / evaluatedCount
          : 0;

      return {
        id: v.id,
        title: v.title,
        department: v.department,
        description: v.description,
        status: v.status,
        minScoreThreshold: v.minScoreThreshold,
        weightSkills: v.weightSkills,
        weightExperience: v.weightExperience,
        weightEducation: v.weightEducation,
        weightLeadership: v.weightLeadership,
        author: v.author,
        createdAt: v.createdAt,
        totalCandidates,
        evaluatedCount,
        totalCostUsd: Number(totalCostUsd.toFixed(6)),
        avgScore: Number(avgScore.toFixed(2)),
      };
    });

    return NextResponse.json(formatted);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      department,
      description,
      minScoreThreshold = 2.5,
      weightSkills = 0.4,
      weightExperience = 0.35,
      weightEducation = 0.15,
      weightLeadership = 0.1,
    } = body;

    if (!title || !department) {
      return NextResponse.json({ error: 'Title and department are required' }, { status: 400 });
    }

    // Find or create default admin/recruiter user if needed
    let user = await prisma.user.findFirst();
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: 'admin@company.com',
          name: 'Lead Recruiter',
          role: 'ADMIN',
        },
      });
    }

    const vacancy = await prisma.vacancy.create({
      data: {
        title,
        department,
        description: description || '',
        status: VacancyStatus.ACTIVE,
        minScoreThreshold: parseFloat(minScoreThreshold.toString()),
        weightSkills: parseFloat(weightSkills.toString()),
        weightExperience: parseFloat(weightExperience.toString()),
        weightEducation: parseFloat(weightEducation.toString()),
        weightLeadership: parseFloat(weightLeadership.toString()),
        authorId: user.id,
      },
    });

    return NextResponse.json(vacancy, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
