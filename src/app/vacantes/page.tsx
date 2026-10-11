import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import {
  Briefcase,
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
  PlusCircle,
  TrendingUp,
  Coins,
  Sliders,
} from 'lucide-react';
import { formatJevCost } from '@/lib/pricing';

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <Briefcase className="w-8 h-8 text-blue-600" />
            <span>Gestión de Vacantes y Convocatorias</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Administra procesos de selección simultáneos, define ponderaciones por puesto y evalúa currículums en lote con JEV.
          </p>
        </div>

        <Link
          href="/vacantes/nueva"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02]"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Crear Nueva Vacante</span>
        </Link>
      </div>

      {/* Vacancies Grid */}
      {vacancies.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
            <Briefcase className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">Aún no hay vacantes creadas</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
            Crea tu primera vacante técnica para comenzar a cargar CVs en formato PDF y recibir evaluaciones tipadas con JEV.
          </p>
          <Link
            href="/vacantes/nueva"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm shadow hover:bg-blue-700 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Crear Primera Vacante</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vacancies.map((vacancy) => {
            const total = vacancy.applications.length;
            const evaluated = vacancy.applications.filter((a) => a.evaluation !== null);
            const evaluatedCount = evaluated.length;
            const passCount = evaluated.filter(
              (a) => (a.evaluation?.overallScore ?? 0) >= vacancy.minScoreThreshold
            ).length;
            const totalCost = evaluated.reduce(
              (sum, a) => sum + (a.evaluation?.costUsd || 0),
              0
            );
            const passRate = evaluatedCount > 0 ? Math.round((passCount / evaluatedCount) * 100) : 0;

            return (
              <div
                key={vacancy.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                {/* Header */}
                <div className="p-6">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                      {vacancy.department}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {vacancy.status}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                    {vacancy.title}
                  </h3>

                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 min-h-[2rem]">
                    {vacancy.description || 'Sin descripción detallada proporcionada.'}
                  </p>

                  {/* Weights summary */}
                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span className="flex items-center gap-1">
                      <Sliders className="w-3.5 h-3.5 text-slate-400" />
                      Skills: {Math.round(vacancy.weightSkills * 100)}%
                    </span>
                    <span>Exp: {Math.round(vacancy.weightExperience * 100)}%</span>
                    <span>Edu: {Math.round(vacancy.weightEducation * 100)}%</span>
                    <span>Lead: {Math.round(vacancy.weightLeadership * 100)}%</span>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-2 mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex flex-col items-center justify-center text-center">
                      <div className="flex items-center gap-1 text-slate-400 text-[10px] font-semibold uppercase">
                        <Users className="w-3 h-3" />
                        <span>CVs</span>
                      </div>
                      <span className="font-bold text-slate-800 text-sm mt-0.5">{total}</span>
                    </div>

                    <div className="flex flex-col items-center justify-center text-center border-x border-slate-200">
                      <div className="flex items-center gap-1 text-slate-400 text-[10px] font-semibold uppercase">
                        <TrendingUp className="w-3 h-3" />
                        <span>Aprobados</span>
                      </div>
                      <span className="font-bold text-emerald-600 text-sm mt-0.5">
                        {passCount} <span className="text-[10px] text-slate-400 font-normal">({passRate}%)</span>
                      </span>
                    </div>

                    <div className="flex flex-col items-center justify-center text-center">
                      <div className="flex items-center gap-1 text-slate-400 text-[10px] font-semibold uppercase">
                        <Coins className="w-3 h-3" />
                        <span>Costo JEV</span>
                      </div>
                      <span className="font-mono font-bold text-slate-700 text-xs mt-0.5">
                        {formatJevCost(totalCost)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="px-6 py-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    Corte: <strong className="text-slate-700 font-semibold">{vacancy.minScoreThreshold.toFixed(1)} / 4.0</strong>
                  </span>

                  <Link
                    href={`/vacantes/${vacancy.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 group-hover:translate-x-0.5 transition-all"
                  >
                    <span>Ver Proceso & Subir CVs</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
