import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import VacancyDetailClient from './VacancyDetailClient';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: {
    id: string;
  };
}

export default async function VacancyDetailPage({ params }: PageProps) {
  const vacancy = await prisma.vacancy.findUnique({
    where: { id: params.id },
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
    notFound();
  }

  return <VacancyDetailClient vacancy={vacancy as any} />;
}
