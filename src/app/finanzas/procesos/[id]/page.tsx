import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import FinanceProcessDetailClient from '@/components/FinanceProcessDetailClient';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: {
    id: string;
  };
}

export default async function FinanceProcessDetailPage({ params }: PageProps) {
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
    notFound();
  }

  return <FinanceProcessDetailClient initialProcess={process as any} />;
}
