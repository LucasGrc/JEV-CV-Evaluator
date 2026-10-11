import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const vacancyId = params.id;
    const vacancy = await prisma.vacancy.findUnique({
      where: { id: vacancyId },
      include: {
        applications: {
          include: {
            candidate: true,
            cvDocument: true,
            evaluation: true,
          },
        },
      },
    });

    if (!vacancy) {
      return NextResponse.json({ error: 'Vacancy not found' }, { status: 404 });
    }

    // Sort evaluated applications by overallScore descending
    const sortedApps = [...vacancy.applications].sort((a, b) => {
      const scoreA = a.evaluation?.overallScore ?? -1;
      const scoreB = b.evaluation?.overallScore ?? -1;
      return scoreB - scoreA;
    });

    const csvRows: string[] = [];
    // CSV Header
    csvRows.push(
      [
        'Rank',
        'Candidate Name',
        'Stage',
        'Status',
        'Recommendation',
        'Overall Score (0-4)',
        'Score (%)',
        'Skills Score (0-4)',
        'Experience Score (0-4)',
        'Education Score (0-4)',
        'Leadership Score (0-4)',
        'JEV Confidence',
        'Input Tokens',
        'Cost USD',
        'Detected Language',
        'Recruiter Notes',
        'Evaluated Date',
      ].join(',')
    );

    sortedApps.forEach((app, index) => {
      const evalData = app.evaluation;
      const rank = evalData ? (index + 1).toString() : '-';
      const name = `"${app.candidate.fullName.replace(/"/g, '""')}"`;
      const stage = app.stage || 'APPLIED';
      const status = app.status;
      const recommendation = evalData?.recommendation || '-';
      const overallScore = evalData ? evalData.overallScore.toFixed(2) : '-';
      const normalizedScore = evalData ? `${evalData.normalizedScore}%` : '-';
      const skills = evalData ? evalData.scoreSkills.toFixed(2) : '-';
      const exp = evalData ? evalData.scoreExperience.toFixed(2) : '-';
      const edu = evalData ? evalData.scoreEducation.toFixed(2) : '-';
      const lead = evalData ? evalData.scoreLeadership.toFixed(2) : '-';
      const conf = evalData ? `${(evalData.confidence * 100).toFixed(1)}%` : '-';
      const tokens = evalData ? evalData.inputTokens.toString() : '0';
      const cost = evalData ? `$${evalData.costUsd.toFixed(6)}` : '$0.00';
      const lang = app.cvDocument.detectedLanguage || 'eng';
      const notes = `"${(app.recruiterNotes || '').replace(/"/g, '""')}"`;
      const date = evalData ? evalData.createdAt.toISOString().split('T')[0] : '-';

      csvRows.push(
        [
          rank,
          name,
          stage,
          status,
          recommendation,
          overallScore,
          normalizedScore,
          skills,
          exp,
          edu,
          lead,
          conf,
          tokens,
          cost,
          lang,
          notes,
          date,
        ].join(',')
      );
    });

    const csvContent = csvRows.join('\n');
    const safeTitle = vacancy.title.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const filename = `evaluation_report_${safeTitle}_${new Date().toISOString().split('T')[0]}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
