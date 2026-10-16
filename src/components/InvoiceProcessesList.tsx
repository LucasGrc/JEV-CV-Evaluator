'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Receipt,
  Users,
  Coins,
  ArrowRight,
  PlusCircle,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { formatJevCost } from '@/lib/pricing';

export interface InvoiceProcessItem {
  id: string;
  title: string;
  description: string | null;
  periodMonth: string;
  periodYear: number;
  employeeName: string;
  employeeCi: string;
  department: string;
  maxAmountThreshold: number;
  mathTolerance: number;
  suspiciousConcepts: string | null;
  status: 'ACTIVE' | 'PAUSED' | 'CLOSED' | 'ARCHIVED';
  invoices: Array<{
    id: string;
    totalAmount: number | null;
    status: string;
    evaluation?: {
      verdict: 'APPROVED' | 'MANUAL_REVIEW' | 'REJECTED';
      costUsd: number;
    } | null;
  }>;
}

export default function InvoiceProcessesList({
  initialProcesses,
}: {
  initialProcesses: InvoiceProcessItem[];
}) {
  const [processes, setProcesses] = useState<InvoiceProcessItem[]>(initialProcesses);
  const [activeTab, setActiveTab] = useState<'ALL' | 'ACTIVE' | 'PAUSED' | 'CLOSED'>('ALL');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleQuickStatusChange = async (
    processId: string,
    newStatus: 'ACTIVE' | 'PAUSED' | 'CLOSED'
  ) => {
    setUpdatingId(processId);
    try {
      const res = await fetch(`/api/finance/processes/${processId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setProcesses((prev) =>
          prev.map((p) => (p.id === processId ? { ...p, status: newStatus } : p))
        );
      }
    } catch (err) {
      console.error('Error updating status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const activeCount = processes.filter((p) => p.status === 'ACTIVE').length;
  const pausedCount = processes.filter((p) => p.status === 'PAUSED').length;
  const closedCount = processes.filter((p) => p.status === 'CLOSED').length;

  const filteredProcesses = processes.filter((p) => {
    if (activeTab === 'ALL') return true;
    return p.status === activeTab;
  });

  return (
    <div className="space-y-6">
      {/* Header & Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-600" />
            <span>Descargos & Rendiciones de Facturas</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Organizados por empleado y periodo mensual. Audita facturas con TypeSafe JEV.
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="inline-flex items-center p-1 rounded-2xl bg-slate-100 border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeTab === 'ALL'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todos ({processes.length})
          </button>
          <button
            onClick={() => setActiveTab('ACTIVE')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeTab === 'ACTIVE'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Activos ({activeCount})
          </button>
          <button
            onClick={() => setActiveTab('PAUSED')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeTab === 'PAUSED'
                ? 'bg-white text-amber-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pausados ({pausedCount})
          </button>
          <button
            onClick={() => setActiveTab('CLOSED')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeTab === 'CLOSED'
                ? 'bg-white text-slate-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Cerrados ({closedCount})
          </button>
        </div>
      </div>

      {filteredProcesses.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
            <Receipt className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">
            {activeTab === 'ALL'
              ? 'No hay procesos de descargos de facturas'
              : `No hay procesos en estado ${activeTab}`}
          </h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
            Crea una nueva rendición mensual para un empleado y comienza a cargar facturas en PDF o imagen para su auditoría con JEV.
          </p>
          <Link
            href="/finanzas/procesos/nuevo"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow hover:shadow-md transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Crear Primer Proceso de Descargo</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProcesses.map((proc) => {
            const total = proc.invoices.length;
            const evaluated = proc.invoices.filter((i) => i.evaluation !== null && i.evaluation !== undefined);
            const approved = evaluated.filter((i) => i.evaluation?.verdict === 'APPROVED').length;
            const review = evaluated.filter((i) => i.evaluation?.verdict === 'MANUAL_REVIEW').length;
            const rejected = evaluated.filter((i) => i.evaluation?.verdict === 'REJECTED').length;
            const totalBs = proc.invoices.reduce((sum, i) => sum + (i.totalAmount || 0), 0);
            const totalCost = evaluated.reduce(
              (sum, i) => sum + (i.evaluation?.costUsd || 0),
              0
            );

            return (
              <div
                key={proc.id}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                {/* Card Header */}
                <div className="p-6">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {proc.periodMonth} {proc.periodYear}
                    </span>

                    {/* Inline Status Toggle */}
                    <div className="inline-flex items-center p-0.5 rounded-lg bg-slate-100 border border-slate-200 text-[10px] font-bold">
                      <button
                        type="button"
                        disabled={updatingId === proc.id}
                        onClick={() => handleQuickStatusChange(proc.id, 'ACTIVE')}
                        className={`px-2 py-0.5 rounded transition-all ${
                          proc.status === 'ACTIVE'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                        title="Marcar como Activo"
                      >
                        Activo
                      </button>
                      <button
                        type="button"
                        disabled={updatingId === proc.id}
                        onClick={() => handleQuickStatusChange(proc.id, 'PAUSED')}
                        className={`px-2 py-0.5 rounded transition-all ${
                          proc.status === 'PAUSED'
                            ? 'bg-amber-500 text-white shadow-xs'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                        title="Pausar proceso"
                      >
                        Pausa
                      </button>
                      <button
                        type="button"
                        disabled={updatingId === proc.id}
                        onClick={() => handleQuickStatusChange(proc.id, 'CLOSED')}
                        className={`px-2 py-0.5 rounded transition-all ${
                          proc.status === 'CLOSED'
                            ? 'bg-slate-700 text-white shadow-xs'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                        title="Cerrar proceso"
                      >
                        Cerrado
                      </button>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-600 transition-colors line-clamp-1">
                    {proc.title}
                  </h3>

                  <div className="mt-2 flex items-center gap-2 text-xs text-slate-600">
                    <span className="font-semibold text-slate-900">{proc.employeeName}</span>
                    <span className="text-slate-400">•</span>
                    <span className="font-mono text-slate-500 font-medium">CI: {proc.employeeCi}</span>
                  </div>

                  {/* Rules preview */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span className="flex items-center gap-1">
                      <Sliders className="w-3.5 h-3.5 text-slate-400" />
                      Límite: {proc.maxAmountThreshold.toLocaleString('es-BO')} Bs
                    </span>
                    <span className="text-slate-400">Dpto: {proc.department}</span>
                  </div>

                  {/* Verdicts count bar */}
                  <div className="grid grid-cols-4 gap-2 mt-4 p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total</span>
                      <span className="font-bold text-slate-800 text-sm mt-0.5 block">{total}</span>
                    </div>
                    <div className="border-l border-slate-200">
                      <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Aprob.</span>
                      <span className="font-bold text-emerald-700 text-sm mt-0.5 block">{approved}</span>
                    </div>
                    <div className="border-l border-slate-200">
                      <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">Revisión</span>
                      <span className="font-bold text-amber-700 text-sm mt-0.5 block">{review}</span>
                    </div>
                    <div className="border-l border-slate-200">
                      <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block">Rechaz.</span>
                      <span className="font-bold text-rose-700 text-sm mt-0.5 block">{rejected}</span>
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Monto Auditado</span>
                    <span className="text-xs font-black font-mono text-slate-800">
                      {totalBs.toLocaleString('es-BO', { minimumFractionDigits: 2 })} Bs
                    </span>
                  </div>

                  <Link
                    href={`/finanzas/procesos/${proc.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 group-hover:translate-x-0.5 transition-all"
                  >
                    <span>Auditar Proceso</span>
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
