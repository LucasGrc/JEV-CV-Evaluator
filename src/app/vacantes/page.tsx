import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import {
  Briefcase,
  Users,
  PlusCircle,
  Coins,
  Sparkles,
  FileCheck,
} from 'lucide-react';
import { formatJevCost } from '@/lib/pricing';
import VacanciesListWithFilter from '@/components/VacanciesListWithFilter';

export const dynamic = 'force-dynamic';

export default async function VacantesPage() {
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

  // Calculate global recruitment metrics
  const totalVacancies = vacancies.length;
  const activeVacancies = vacancies.filter((v) => v.status === 'ACTIVE').length;
  const totalApplications = vacancies.reduce((sum, v) => sum + v.applications.length, 0);
  const totalEvaluated = vacancies.reduce(
    (sum, v) => sum + v.applications.filter((a) => a.evaluation !== null).length,
    0
  );
  const totalGlobalCost = vacancies.reduce(
    (sum, v) =>
      sum +
      v.applications.reduce((vSum, a) => vSum + (a.evaluation?.costUsd || 0), 0),
    0
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Hero / Executive Cockpit */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>POC 1: Recursos Humanos • TypeSafe AI (JEV)</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Plataforma de Selección & Evaluación de CVs
            </h1>
            <p className="text-sm text-slate-500 mt-2 max-w-2xl">
              Gestiona múltiples convocatorias en paralelo. Carga cientos de currículums en PDF (en inglés), aplica rúbricas ordinales personalizadas y evalúa con precisión determinista por solo <strong className="text-slate-800">$0.042 / 1M tokens</strong>.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/vacantes/nueva"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-95"
            >
              <PlusCircle className="w-5 h-5" />
              <span>Crear Nueva Vacante</span>
            </Link>
          </div>
        </div>

        {/* Global KPI Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-6">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider">
              <Briefcase className="w-4 h-4 text-blue-600" />
              <span>Vacantes Activas</span>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
              {activeVacancies}{' '}
              <span className="text-sm font-semibold text-slate-400">/ {totalVacancies}</span>
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider">
              <Users className="w-4 h-4 text-indigo-600" />
              <span>CVs Almacenados</span>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">{totalApplications}</p>
          </div>

          <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-100">
            <div className="flex items-center gap-2 text-blue-600 text-xs font-bold uppercase tracking-wider">
              <FileCheck className="w-4 h-4 text-blue-600" />
              <span>Evaluados con JEV</span>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-blue-700 mt-2">{totalEvaluated}</p>
          </div>

          <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100">
            <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold uppercase tracking-wider">
              <Coins className="w-4 h-4 text-emerald-600" />
              <span>Gasto Total JEV</span>
            </div>
            <p className="text-2xl sm:text-3xl font-black font-mono text-emerald-700 mt-2">
              {formatJevCost(totalGlobalCost)}
            </p>
          </div>
        </div>
      </div>

      {/* Vacancies Section with Filter & State Management */}
      <VacanciesListWithFilter initialVacancies={vacancies as any} />
    </div>
  );
}
