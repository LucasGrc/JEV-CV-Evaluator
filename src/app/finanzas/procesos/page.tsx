import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import {
  Receipt,
  Users,
  Coins,
  PlusCircle,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import { formatJevCost } from '@/lib/pricing';
import InvoiceProcessesList from '@/components/InvoiceProcessesList';

export const dynamic = 'force-dynamic';

export default async function FinanceProcessesPage() {
  const processes = await prisma.invoiceProcess.findMany({
    include: {
      invoices: {
        include: {
          evaluation: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Calculate global finance metrics
  const totalProcesses = processes.length;
  const activeProcesses = processes.filter((p) => p.status === 'ACTIVE').length;
  const allInvoices = processes.flatMap((p) => p.invoices);
  const totalInvoices = allInvoices.length;
  const evaluatedInvoices = allInvoices.filter((i) => i.evaluation !== null);
  const totalEvaluated = evaluatedInvoices.length;
  const approvedCount = evaluatedInvoices.filter((i) => i.evaluation?.verdict === 'APPROVED').length;
  const reviewCount = evaluatedInvoices.filter((i) => i.evaluation?.verdict === 'MANUAL_REVIEW').length;
  const rejectedCount = evaluatedInvoices.filter((i) => i.evaluation?.verdict === 'REJECTED').length;
  const totalBs = allInvoices.reduce((sum, i) => sum + (i.totalAmount || 0), 0);
  const totalCostUsd = evaluatedInvoices.reduce(
    (sum, i) => sum + (i.evaluation?.costUsd || 0),
    0
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Hero / Executive Cockpit */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>POC 2: Finanzas & Contabilidad • TypeSafe AI (JEV)</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Auditor Inteligente de Facturas & Descargos
            </h1>
            <p className="text-sm text-slate-500 mt-2 max-w-2xl">
              Auditoría fiscal y contable de facturas físicas y electrónicas (Bolivia). Valida correspondencia de CI/Nombre, coherencia matemática de ítems, alertas &gt; 10.000 Bs y conceptos no propios de persona natural por <strong className="text-slate-800">$0.042 / 1M tokens</strong>.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/finanzas/procesos/nuevo"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-95"
            >
              <PlusCircle className="w-5 h-5" />
              <span>Nuevo Proceso de Descargo</span>
            </Link>
          </div>
        </div>

        {/* Global KPI Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-6">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider">
              <Receipt className="w-4 h-4 text-emerald-600" />
              <span>Procesos Activos</span>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
              {activeProcesses}{' '}
              <span className="text-sm font-semibold text-slate-400">/ {totalProcesses}</span>
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider">
              <Users className="w-4 h-4 text-indigo-600" />
              <span>Facturas Auditadas</span>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
              {totalEvaluated}{' '}
              <span className="text-sm font-semibold text-slate-400">/ {totalInvoices}</span>
            </p>
          </div>

          <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100">
            <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold uppercase tracking-wider">
              <Receipt className="w-4 h-4 text-emerald-600" />
              <span>Total Auditado (Bs)</span>
            </div>
            <p className="text-2xl sm:text-3xl font-black font-mono text-emerald-800 mt-2">
              {totalBs.toLocaleString('es-BO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} <span className="text-sm font-bold text-emerald-600">Bs</span>
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider">
              <Coins className="w-4 h-4 text-emerald-600" />
              <span>Gasto JEV (API)</span>
            </div>
            <p className="text-2xl sm:text-3xl font-black font-mono text-slate-900 mt-2">
              {formatJevCost(totalCostUsd)}
            </p>
          </div>
        </div>
      </div>

      {/* Invoice Processes Section with Tabs and Status Management */}
      <InvoiceProcessesList initialProcesses={processes as any} />
    </div>
  );
}
