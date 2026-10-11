import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
