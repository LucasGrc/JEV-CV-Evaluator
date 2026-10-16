import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import {
  Briefcase,
  Users,
  Receipt,
  Coins,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Zap,
} from 'lucide-react';
import { formatJevCost } from '@/lib/pricing';

export const dynamic = 'force-dynamic';

export default async function PortalHubPage() {
  // RRHH data
  const vacancies = await prisma.vacancy.findMany({
    include: {
      applications: {
        include: { evaluation: true },
      },
    },
  });

  const totalVacancies = vacancies.length;
  const activeVacancies = vacancies.filter((v) => v.status === 'ACTIVE').length;
  const totalCvs = vacancies.reduce((sum, v) => sum + v.applications.length, 0);
  const evaluatedCvs = vacancies.reduce(
    (sum, v) => sum + v.applications.filter((a) => a.evaluation !== null).length,
    0
  );
  const rrhhCost = vacancies.reduce(
    (sum, v) =>
      sum +
      v.applications.reduce((vSum, a) => vSum + (a.evaluation?.costUsd || 0), 0),
    0
  );

  // Finance data
  const invoiceProcesses = await prisma.invoiceProcess.findMany({
    include: {
      invoices: {
        include: { evaluation: true },
      },
    },
  });

  const totalProcesses = invoiceProcesses.length;
  const activeProcesses = invoiceProcesses.filter((p) => p.status === 'ACTIVE').length;
  const allInvoices = invoiceProcesses.flatMap((p) => p.invoices);
  const totalInvoices = allInvoices.length;
  const evaluatedInvoices = allInvoices.filter((i) => i.evaluation !== null).length;
  const approvedInvoices = allInvoices.filter(
    (i) => i.evaluation?.verdict === 'APPROVED'
  ).length;
  const reviewInvoices = allInvoices.filter(
    (i) => i.evaluation?.verdict === 'MANUAL_REVIEW'
  ).length;
  const rejectedInvoices = allInvoices.filter(
    (i) => i.evaluation?.verdict === 'REJECTED'
  ).length;
  const totalBsAmount = allInvoices.reduce(
    (sum, i) => sum + (i.totalAmount || 0),
    0
  );
  const financeCost = allInvoices.reduce(
    (sum, i) => sum + (i.evaluation?.costUsd || 0),
    0
  );

  const totalGlobalCost = rrhhCost + financeCost;
  const totalInferences = evaluatedCvs + evaluatedInvoices;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
      {/* Executive Hero */}
      <div className="bg-gradient-to-b from-white to-slate-50 rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-10 text-center relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500" />
        
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 mb-4">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>TypeSafe AI Enterprise Suite • System One Architecture</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight max-w-4xl mx-auto">
          Suite Empresarial de Decisión & Auditoría Inteligente
        </h1>

        <p className="text-sm sm:text-base text-slate-600 mt-4 max-w-2xl mx-auto leading-relaxed">
          Plataforma multi-área potenciada por el modelo discriminativo <strong>JEV</strong>. Automatiza decisiones semánticas de negocio con velocidad de milisegundos y un costo real de solo <strong className="text-slate-900">$0.042 / 1M tokens</strong>.
        </p>

        {/* Global KPIs strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-slate-200/80 max-w-4xl mx-auto text-left">
          <div className="p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Inferencias JEV</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">{totalInferences}</span>
            <span className="text-[11px] text-slate-500">Evaluaciones totales</span>
          </div>

          <div className="p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Tarifa Oficial</span>
            <span className="text-2xl font-black font-mono text-emerald-600 mt-1 block">$0.042</span>
            <span className="text-[11px] text-slate-500">Por 1M input tokens</span>
          </div>

          <div className="p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Gasto Total Acumulado</span>
            <span className="text-2xl font-black font-mono text-slate-900 mt-1 block">{formatJevCost(totalGlobalCost)}</span>
            <span className="text-[11px] text-emerald-600 font-semibold">Salidas gratuitas</span>
          </div>

          <div className="p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Latencia Media</span>
            <span className="text-2xl font-black text-blue-600 mt-1 block">~140 ms</span>
            <span className="text-[11px] text-slate-500">Decisión determinista</span>
          </div>
        </div>
      </div>

      {/* Main Module Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Module 1: RRHH - CV Evaluator */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group">
          <div className="p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner">
                <Briefcase className="w-6 h-6" />
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100/70 text-blue-800 border border-blue-200">
                POC 1 • Recursos Humanos
              </span>
            </div>

            <h2 className="text-2xl font-black text-slate-900 group-hover:text-blue-600 transition-colors">
              Evaluador Inteligente de CVs & Selección Técnica
            </h2>

            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              Carga masiva de currículums en PDF (en inglés), evaluación determinista basada en rúbricas de ingeniería (0.0 a 4.0 pts), filtro de política de idioma, tabla clasificatoria en tiempo real y embudo de selección de candidatos.
            </p>

            {/* RRHH Mini Metrics */}
            <div className="grid grid-cols-3 gap-3 mt-6 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Convocatorias</span>
                <span className="text-lg font-black text-slate-800 mt-0.5 block">{activeVacancies} Activas</span>
              </div>
              <div className="border-x border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">CVs Evaluados</span>
                <span className="text-lg font-black text-blue-600 mt-0.5 block">{evaluatedCvs} / {totalCvs}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Gasto JEV</span>
                <span className="text-lg font-black font-mono text-emerald-600 mt-0.5 block">{formatJevCost(rrhhCost)}</span>
              </div>
            </div>

            {/* Feature highlights */}
            <div className="mt-5 space-y-2 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Ponderación customizable: Skills, Experiencia, Fundamentos y Liderazgo.</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Gestión de pipeline de candidatos y notas internas de reclutador.</span>
              </div>
            </div>
          </div>

          <div className="p-6 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Modelo JEV 1.13.0 • Escala Ordinal 0–4.0
            </span>
            <Link
              href="/vacantes"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-95"
            >
              <span>Acceder al Módulo RRHH</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Module 2: Finanzas - Invoice Auditor */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group">
          <div className="p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner">
                <Receipt className="w-6 h-6" />
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100/70 text-emerald-800 border border-emerald-200">
                POC 2 • Finanzas & Contabilidad
              </span>
            </div>

            <h2 className="text-2xl font-black text-slate-900 group-hover:text-emerald-600 transition-colors">
              Auditor Inteligente de Facturas & Descargos
            </h2>

            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              Auditoría y validación automática de facturas físicas y electrónicas (Bolivia / RC-IVA / Form 110). Comprueba correspondencia de identidad (CI/Nombre), consistencia matemática de ítems, alertas &gt; 10.000 Bs y compras atípicas con JEV.
            </p>

            {/* Finance Mini Metrics */}
            <div className="grid grid-cols-3 gap-3 mt-6 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Procesos</span>
                <span className="text-lg font-black text-slate-800 mt-0.5 block">{activeProcesses} Activos</span>
              </div>
              <div className="border-x border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Facturas</span>
                <span className="text-lg font-black text-emerald-600 mt-0.5 block">{evaluatedInvoices} Auditadas</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Auditado</span>
                <span className="text-lg font-black font-mono text-slate-800 mt-0.5 block">{totalBsAmount.toLocaleString('es-BO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} Bs</span>
              </div>
            </div>

            {/* Feature highlights */}
            <div className="mt-5 space-y-2 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Verificación matemática: Suma de desglose = Total declarado.</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <span>Detección semántica de conceptos impropios (ej. ascensores o maquinaria).</span>
              </div>
            </div>
          </div>

          <div className="p-6 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Validación Fiscal • QR Bolivia SIN Compatible
            </span>
            <Link
              href="/finanzas/procesos"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-95"
            >
              <span>Acceder al Módulo Finanzas</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
