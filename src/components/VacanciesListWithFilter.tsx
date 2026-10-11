'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  Users,
  TrendingUp,
  Coins,
  Sliders,
  ArrowRight,
  PlusCircle,
  Filter,
  CheckCircle2,
  PauseCircle,
  XCircle,
} from 'lucide-react';
import { formatJevCost } from '@/lib/pricing';

interface VacancyItem {
  id: string;
  title: string;
  department: string;
  description: string;
  status: 'ACTIVE' | 'PAUSED' | 'CLOSED' | 'DRAFT';
  minScoreThreshold: number;
  weightSkills: number;
  weightExperience: number;
  weightEducation: number;
  weightLeadership: number;
  applications: Array<{
    evaluation?: {
      overallScore: number;
      costUsd: number;
    } | null;
  }>;
}

export default function VacanciesListWithFilter({
  initialVacancies,
}: {
  initialVacancies: VacancyItem[];
}) {
  const [vacancies, setVacancies] = useState<VacancyItem[]>(initialVacancies);
  const [activeTab, setActiveTab] = useState<'ALL' | 'ACTIVE' | 'PAUSED' | 'CLOSED'>('ALL');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Quick status update from card
  const handleQuickStatusChange = async (
    vacancyId: string,
    newStatus: 'ACTIVE' | 'PAUSED' | 'CLOSED'
  ) => {
    setUpdatingId(vacancyId);
    try {
      const res = await fetch(`/api/vacancies/${vacancyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setVacancies((prev) =>
          prev.map((v) => (v.id === vacancyId ? { ...v, status: newStatus } : v))
        );
      }
    } catch (err) {
      console.error('Error updating status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const activeCount = vacancies.filter((v) => v.status === 'ACTIVE').length;
  const pausedCount = vacancies.filter((v) => v.status === 'PAUSED').length;
  const closedCount = vacancies.filter((v) => v.status === 'CLOSED').length;

  const filteredVacancies = vacancies.filter((v) => {
    if (activeTab === 'ALL') return true;
    return v.status === activeTab;
  });

  return (
    <div className="space-y-6">
      {/* Header & Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-blue-600" />
            <span>Procesos de Selección</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Administra vacantes activas, pausa temporalmente o concluye procesos cerrados.
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="inline-flex items-center p-1 rounded-2xl bg-slate-100 border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeTab === 'ALL'
                ? 'bg-white text-slate-900 shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todos ({vacancies.length})
          </button>

          <button
            onClick={() => setActiveTab('ACTIVE')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'ACTIVE'
                ? 'bg-emerald-600 text-white shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${activeTab === 'ACTIVE' ? 'bg-white' : 'bg-emerald-500'}`} />
            <span>Activos ({activeCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('PAUSED')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'PAUSED'
                ? 'bg-amber-500 text-white shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${activeTab === 'PAUSED' ? 'bg-white' : 'bg-amber-400'}`} />
            <span>Pausados ({pausedCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('CLOSED')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'CLOSED'
                ? 'bg-slate-700 text-white shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${activeTab === 'CLOSED' ? 'bg-white' : 'bg-slate-400'}`} />
            <span>Cerrados ({closedCount})</span>
          </button>
        </div>
      </div>

      {/* Grid */}
      {filteredVacancies.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Filter className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800 mb-1">
            No hay procesos en la pestaña seleccionada
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
            No se encontraron vacantes con estado &quot;{activeTab}&quot;. Cambia de pestaña o crea una nueva convocatoria.
          </p>
          <button
            onClick={() => setActiveTab('ALL')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 underline"
          >
            Ver todos los procesos
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVacancies.map((vacancy) => {
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
            const isUpdating = updatingId === vacancy.id;

            return (
              <div
                key={vacancy.id}
                className={`bg-white rounded-3xl border shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group ${
                  vacancy.status === 'CLOSED'
                    ? 'border-slate-200/60 bg-slate-50/50 opacity-90'
                    : vacancy.status === 'PAUSED'
                    ? 'border-amber-200/80'
                    : 'border-slate-200/90'
                }`}
              >
                {/* Header */}
                <div className="p-6">
                  <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                      {vacancy.department}
                    </span>

                    {/* Quick status selector */}
                    <div className="inline-flex items-center p-0.5 rounded-lg bg-slate-100 border border-slate-200 text-[11px]">
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleQuickStatusChange(vacancy.id, 'ACTIVE')}
                        className={`px-2 py-0.5 rounded font-bold transition-all ${
                          vacancy.status === 'ACTIVE'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                        title="Activar proceso"
                      >
                        Activo
                      </button>
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleQuickStatusChange(vacancy.id, 'PAUSED')}
                        className={`px-2 py-0.5 rounded font-bold transition-all ${
                          vacancy.status === 'PAUSED'
                            ? 'bg-amber-500 text-white shadow-xs'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                        title="Pausar proceso"
                      >
                        Pausar
                      </button>
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleQuickStatusChange(vacancy.id, 'CLOSED')}
                        className={`px-2 py-0.5 rounded font-bold transition-all ${
                          vacancy.status === 'CLOSED'
                            ? 'bg-slate-700 text-white shadow-xs'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                        title="Cerrar / Inactivar proceso"
                      >
                        Cerrar
                      </button>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                    {vacancy.title}
                  </h3>

                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 min-h-[2rem]">
                    {vacancy.description || 'Sin descripción detallada proporcionada.'}
                  </p>

                  {/* Weights */}
                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span className="flex items-center gap-1">
                      <Sliders className="w-3.5 h-3.5 text-slate-400" />
                      Skills: {Math.round(vacancy.weightSkills * 100)}%
                    </span>
                    <span>Exp: {Math.round(vacancy.weightExperience * 100)}%</span>
                    <span>Edu: {Math.round(vacancy.weightEducation * 100)}%</span>
                    <span>Lead: {Math.round(vacancy.weightLeadership * 100)}%</span>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 mt-4 p-3 bg-slate-50 rounded-2xl border border-slate-100">
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
                <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    Corte: <strong className="text-slate-700 font-semibold">{vacancy.minScoreThreshold.toFixed(1)} / 4.0</strong>
                  </span>

                  <Link
                    href={`/vacantes/${vacancy.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 group-hover:translate-x-0.5 transition-all"
                  >
                    <span>{vacancy.status === 'CLOSED' ? 'Ver Reporte Final' : 'Entrar al Proceso'}</span>
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
