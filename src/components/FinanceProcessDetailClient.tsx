'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Receipt,
  FileText,
  UploadCloud,
  Play,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Sparkles,
  Sliders,
  Eye,
  RefreshCw,
  Coins,
  Check,
  User,
  ShieldAlert,
  Building2,
  DollarSign,
  Filter,
  FileCheck2,
  AlertOctagon,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
  Settings,
  X,
} from 'lucide-react';
import { formatJevCost } from '@/lib/pricing';
import { InvoiceDetailModal } from '@/components/InvoiceDetailModal';
import { InvoiceVisualSheet } from '@/components/InvoiceVisualSheet';

export const STATUS_CONFIG: Record<
  string,
  { label: string; badge: string; dot: string }
> = {
  ACTIVE: {
    label: 'Activo / Abierto',
    badge: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    dot: 'bg-emerald-500',
  },
  PAUSED: {
    label: 'Pausado',
    badge: 'bg-amber-50 text-amber-800 border-amber-300',
    dot: 'bg-amber-500',
  },
  CLOSED: {
    label: 'Cerrado / Concluido',
    badge: 'bg-slate-100 text-slate-700 border-slate-300',
    dot: 'bg-slate-400',
  },
  ARCHIVED: {
    label: 'Archivado',
    badge: 'bg-slate-100 text-slate-600 border-slate-300',
    dot: 'bg-slate-300',
  },
};

interface InvoiceItem {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  status: string;
  buyerName?: string | null;
  buyerCi?: string | null;
  invoiceNumber?: string | null;
  invoiceDate?: string | null;
  totalAmount?: number | null;
  currency?: string;
  items?: any;
  extractedText?: string | null;
  evaluation?: {
    id: string;
    verdict: 'APPROVED' | 'MANUAL_REVIEW' | 'REJECTED';
    identityMatch: boolean;
    identityMatchScore: number;
    mathConsistent: boolean;
    calculatedSum?: number | null;
    declaredTotal?: number | null;
    sumDifference?: number | null;
    amountAlert: boolean;
    suspiciousConceptAlert: boolean;
    suspiciousDetails?: string | null;
    reasons: string[];
    jevReasoning: string;
    confidence: number;
    inputTokens: number;
    costUsd: number;
    processingTimeMs: number;
    reviewerNotes?: string | null;
    reviewedBy?: string | null;
    reviewedAt?: string | null;
  } | null;
  createdAt: string;
}

interface InvoiceProcessData {
  id: string;
  title: string;
  description?: string | null;
  status: 'ACTIVE' | 'PAUSED' | 'CLOSED' | 'ARCHIVED';
  periodMonth: string;
  periodYear: number;
  employeeName: string;
  employeeCi: string;
  department: string;
  maxAmountThreshold: number;
  mathTolerance: number;
  suspiciousConcepts: string;
  requireStrictCiMatch: boolean;
  invoices: InvoiceItem[];
}

interface ProcessDetailProps {
  initialProcess: InvoiceProcessData;
}

export default function FinanceProcessDetailClient({ initialProcess }: ProcessDetailProps) {
  const [process, setProcess] = useState<InvoiceProcessData>(initialProcess);
  const [uploading, setUploading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Modal detail & Quick Sheet Preview
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceItem | null>(null);
  const [previewVisualInvoice, setPreviewVisualInvoice] = useState<InvoiceItem | null>(null);

  // Real-time evaluation streaming progress state
  const [evalProgress, setEvalProgress] = useState<{
    current: number;
    total: number;
    percentage: number;
    elapsedMs: number;
    totalCostUsd: number;
    approvedCount: number;
    manualReviewCount: number;
    rejectedCount: number;
  } | null>(null);

  // Rules drawer/modal
  const [showRulesDrawer, setShowRulesDrawer] = useState(false);
  const [tempThreshold, setTempThreshold] = useState(process.maxAmountThreshold);
  const [tempSuspicious, setTempSuspicious] = useState(process.suspiciousConcepts);
  const [savingRules, setSavingRules] = useState(false);

  // Filter tabs
  const [activeTab, setActiveTab] = useState<'ALL' | 'APPROVED' | 'MANUAL_REVIEW' | 'REJECTED' | 'PENDING'>('ALL');

  // Prevent default window drop behavior in Safari/Chrome so files don't open in browser
  useEffect(() => {
    const preventWindowDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };
    window.addEventListener('dragover', preventWindowDrop);
    window.addEventListener('drop', preventWindowDrop);
    return () => {
      window.removeEventListener('dragover', preventWindowDrop);
      window.removeEventListener('drop', preventWindowDrop);
    };
  }, []);

  // Refresh process data from API
  const refreshData = async () => {
    try {
      const res = await fetch(`/api/finance/processes/${process.id}`);
      if (res.ok) {
        const updated = await res.json();
        setProcess(updated);
        // If modal is open, refresh selected invoice
        if (selectedInvoice) {
          const freshInv = updated.invoices.find((i: InvoiceItem) => i.id === selectedInvoice.id);
          if (freshInv) setSelectedInvoice(freshInv);
        }
      }
    } catch (err) {
      console.error('Error refreshing process:', err);
    }
  };

  // Upload handler for files (PDFs, Images)
  const uploadFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;

    if (process.status !== 'ACTIVE') {
      setNotice({
        type: 'error',
        message: 'No se pueden cargar facturas porque el proceso no está ACTIVO.',
      });
      return;
    }

    setUploading(true);
    setNotice(null);

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    try {
      const res = await fetch(`/api/finance/processes/${process.id}/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error subiendo archivos');

      setNotice({
        type: 'success',
        message: `✓ Se cargaron exitosamente ${data.totalUploaded} factura(s). Listas para ser auditadas.`,
      });
      await refreshData();
    } catch (err: any) {
      setNotice({ type: 'error', message: `Error: ${err.message}` });
    } finally {
      setUploading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadFiles(e.dataTransfer.files);
    }
  };

  // Status management
  const handleStatusChange = async (newStatus: 'ACTIVE' | 'PAUSED' | 'CLOSED') => {
    setUpdatingStatus(true);
    setNotice(null);
    try {
      const res = await fetch(`/api/finance/processes/${process.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error actualizando estado');

      setProcess((prev) => ({ ...prev, status: newStatus }));
      setNotice({
        type: 'success',
        message: `Estado actualizado a "${STATUS_CONFIG[newStatus]?.label || newStatus}"`,
      });
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message });
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Save updated rules
  const handleSaveRules = async () => {
    setSavingRules(true);
    try {
      const res = await fetch(`/api/finance/processes/${process.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maxAmountThreshold: tempThreshold,
          suspiciousConcepts: tempSuspicious,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error guardando reglas');

      setProcess((prev) => ({
        ...prev,
        maxAmountThreshold: tempThreshold,
        suspiciousConcepts: tempSuspicious,
      }));
      setShowRulesDrawer(false);
      setNotice({
        type: 'success',
        message: '✓ Reglas de auditoría actualizadas correctamente.',
      });
    } catch (err: any) {
      setNotice({ type: 'error', message: `Error guardando reglas: ${err.message}` });
    } finally {
      setSavingRules(false);
    }
  };

  // Run bulk evaluation with JEV (Real-Time Streaming)
  const handleRunEvaluation = async () => {
    setEvaluating(true);
    setNotice(null);

    const startTime = Date.now();
    const totalToEvaluate = pendingInvoices.length;

    // Inicializar estado de progreso en vivo
    setEvalProgress({
      current: 0,
      total: totalToEvaluate,
      percentage: 0,
      elapsedMs: 0,
      totalCostUsd: 0,
      approvedCount: 0,
      manualReviewCount: 0,
      rejectedCount: 0,
    });

    // Cronómetro en vivo
    const timerInterval = setInterval(() => {
      setEvalProgress((prev) =>
        prev ? { ...prev, elapsedMs: Date.now() - startTime } : null
      );
    }, 100);

    try {
      const res = await fetch(
        `/api/finance/processes/${process.id}/evaluate?stream=true`,
        {
          method: 'POST',
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al iniciar la auditoría');
      }

      if (!res.body) {
        throw new Error('Streaming no disponible en el navegador');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() || '';

        for (const part of parts) {
          const lines = part.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const jsonStr = line.slice(6).trim();
              if (!jsonStr) continue;

              try {
                const event = JSON.parse(jsonStr);

                if (event.type === 'invoice_evaluated') {
                  // 1. Actualizar barra de progreso y métricas en vivo
                  setEvalProgress({
                    current: event.progress.current,
                    total: event.progress.total,
                    percentage: event.progress.percentage,
                    elapsedMs: event.liveStats.elapsedMs,
                    totalCostUsd: event.liveStats.totalCostUsd,
                    approvedCount: event.liveStats.approvedCount,
                    manualReviewCount: event.liveStats.manualReviewCount,
                    rejectedCount: event.liveStats.rejectedCount,
                  });

                  // 2. Actualizar la factura en la tabla en tiempo real
                  setProcess((prev) => ({
                    ...prev,
                    invoices: prev.invoices.map((inv) =>
                      inv.id === event.invoiceId
                        ? {
                            ...inv,
                            status: 'EVALUATED',
                            evaluation: event.evaluation,
                          }
                        : inv
                    ),
                  }));
                } else if (event.type === 'complete') {
                  const elapsedSec = (event.totalProcessingTimeMs / 1000).toFixed(1);
                  setNotice({
                    type: 'success',
                    message: `✓ Auditoría JEV en tiempo real finalizada: ${event.totalEvaluated} facturas evaluadas en ${elapsedSec}s (${event.approvedCount} aprobadas, ${event.manualReviewCount} revisión manual, ${event.rejectedCount} rechazadas). Costo total API: ${formatJevCost(event.totalCostUsd)}`,
                  });
                } else if (event.type === 'error') {
                  throw new Error(event.error);
                }
              } catch (parseErr) {
                console.error('Error parseando chunk SSE:', parseErr);
              }
            }
          }
        }
      }

      await refreshData();
    } catch (err: any) {
      setNotice({ type: 'error', message: `Error: ${err.message}` });
    } finally {
      clearInterval(timerInterval);
      setEvaluating(false);
      // Mantener visible el resumen de progreso 10 segundos
      setTimeout(() => setEvalProgress(null), 10000);
    }
  };

  // Manual verdict override from modal
  const handleSaveVerdict = async (
    invoiceId: string,
    newVerdict: 'APPROVED' | 'MANUAL_REVIEW' | 'REJECTED',
    notes: string
  ) => {
    const res = await fetch(`/api/finance/invoices/${invoiceId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        verdict: newVerdict,
        reviewerNotes: notes,
        reviewedBy: 'Auditor de Finanzas',
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Error al guardar dictamen');
    }

    await refreshData();
  };

  // Computed metrics
  const totalInvoices = process.invoices.length;
  const pendingInvoices = process.invoices.filter((i) => i.status === 'PENDING' || !i.evaluation);
  const evaluatedInvoices = process.invoices.filter((i) => i.evaluation);

  const approvedInvoices = process.invoices.filter(
    (i) => i.evaluation?.verdict === 'APPROVED'
  );
  const manualReviewInvoices = process.invoices.filter(
    (i) => i.evaluation?.verdict === 'MANUAL_REVIEW'
  );
  const rejectedInvoices = process.invoices.filter(
    (i) => i.evaluation?.verdict === 'REJECTED'
  );

  const totalAmountSum = process.invoices.reduce(
    (acc, inv) => acc + (inv.totalAmount || 0),
    0
  );

  const totalJevCostUsd = process.invoices.reduce(
    (acc, inv) => acc + (inv.evaluation?.costUsd || 0),
    0
  );

  // Filtered invoices by active tab
  const filteredInvoices = process.invoices.filter((inv) => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'PENDING') return inv.status === 'PENDING' || !inv.evaluation;
    return inv.evaluation?.verdict === activeTab;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <Link
          href="/finanzas/procesos"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al listado de rendiciones</span>
        </Link>

        {/* Status Control Toggle */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-200">
          <span className="text-xs font-bold text-slate-500 px-2">Estado:</span>
          <button
            onClick={() => handleStatusChange('ACTIVE')}
            disabled={updatingStatus || process.status === 'ACTIVE'}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
              process.status === 'ACTIVE'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Activo
          </button>
          <button
            onClick={() => handleStatusChange('PAUSED')}
            disabled={updatingStatus || process.status === 'PAUSED'}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
              process.status === 'PAUSED'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pausado
          </button>
          <button
            onClick={() => handleStatusChange('CLOSED')}
            disabled={updatingStatus || process.status === 'CLOSED'}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
              process.status === 'CLOSED'
                ? 'bg-slate-700 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Cerrado
          </button>
        </div>
      </div>

      {/* Process Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 overflow-hidden relative">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                  STATUS_CONFIG[process.status]?.badge || 'bg-slate-100'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    STATUS_CONFIG[process.status]?.dot || 'bg-slate-400'
                  }`}
                />
                {STATUS_CONFIG[process.status]?.label || process.status}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {process.periodMonth} {process.periodYear}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                {process.department}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {process.title}
            </h1>

            {/* Employee pill */}
            <div className="inline-flex items-center gap-3 p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-slate-800">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
                <User className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider block">
                  Empleado Titular de la Rendición
                </span>
                <span className="font-bold text-slate-900">{process.employeeName}</span>
                <span className="text-slate-500 font-mono ml-2">CI: {process.employeeCi}</span>
              </div>
            </div>
          </div>

          {/* Quick Rules & Actions */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-stretch lg:items-end gap-2.5 flex-shrink-0">
            <button
              onClick={() => {
                setTempThreshold(process.maxAmountThreshold);
                setTempSuspicious(process.suspiciousConcepts);
                setShowRulesDrawer(!showRulesDrawer);
              }}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-sm transition-all"
            >
              <Settings className="w-4 h-4 text-slate-500" />
              <span>Configurar Reglas de Auditoría</span>
              {showRulesDrawer ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            <button
              onClick={refreshData}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 text-xs font-semibold"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Actualizar Datos</span>
            </button>
          </div>
        </div>

        {/* Collapsible Rules Editor */}
        {showRulesDrawer && (
          <div className="mt-6 pt-6 border-t border-slate-200 bg-slate-50 -mx-6 -mb-6 sm:-mx-8 sm:-mb-8 p-6 sm:p-8 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Reglas de Auditoría Activas para este Proceso
                </h3>
              </div>
              <span className="text-[11px] text-slate-500">
                Afecta a las facturas que sean auditadas por JEV
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Umbral de Monto para Revisión Manual (Bs.)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="1000"
                    max="50000"
                    step="1000"
                    value={tempThreshold}
                    onChange={(e) => setTempThreshold(Number(e.target.value))}
                    className="flex-1 accent-emerald-600 cursor-pointer"
                  />
                  <span className="font-mono text-sm font-bold text-emerald-800 px-2.5 py-1 bg-emerald-50 rounded-lg border border-emerald-200">
                    Bs. {tempThreshold.toLocaleString('es-BO')}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Toda factura con total igual o mayor será retenida para inspección humana.
                </p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Regla de Conceptos Atípicos / Bienes No Propios
                </label>
                <textarea
                  rows={2}
                  value={tempSuspicious}
                  onChange={(e) => setTempSuspicious(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowRulesDrawer(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveRules}
                disabled={savingRules}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50"
              >
                {savingRules ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>Guardar Cambios de Regla</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Alerts / Notices */}
      {notice && (
        <div
          className={`p-4 rounded-2xl border text-xs sm:text-sm flex items-start gap-3 transition-all animate-fadeIn ${
            notice.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : notice.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}
        >
          {notice.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          ) : notice.type === 'error' ? (
            <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          ) : (
            <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0" />
          )}
          <span className="flex-1 font-medium">{notice.message}</span>
          <button
            onClick={() => setNotice(null)}
            className="text-slate-400 hover:text-slate-700 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* KPI Cards Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        {/* Total Facturas */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Facturas</span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{totalInvoices}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            {pendingInvoices.length} pendientes
          </div>
        </div>

        {/* Aprobadas */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-emerald-600 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Aprobadas</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-700">
            {approvedInvoices.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {totalInvoices > 0
              ? `${Math.round((approvedInvoices.length / totalInvoices) * 100)}% del total`
              : '0%'}
          </div>
        </div>

        {/* Revisión Manual */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-amber-600 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Revisión Manual</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="text-2xl font-extrabold text-amber-700">
            {manualReviewInvoices.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {totalInvoices > 0
              ? `${Math.round((manualReviewInvoices.length / totalInvoices) * 100)}% del total`
              : '0%'}
          </div>
        </div>

        {/* Rechazadas */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-rose-600 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Rechazadas</span>
            <XCircle className="w-4 h-4" />
          </div>
          <div className="text-2xl font-extrabold text-rose-700">
            {rejectedInvoices.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {totalInvoices > 0
              ? `${Math.round((rejectedInvoices.length / totalInvoices) * 100)}% del total`
              : '0%'}
          </div>
        </div>

        {/* Monto Total */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Monto Total</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-mono font-extrabold text-slate-900">
            Bs. {totalAmountSum.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Rendición F-110</div>
        </div>

        {/* Costo JEV API */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Costo JEV API</span>
            <Coins className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl sm:text-2xl font-mono font-extrabold text-emerald-700">
            {formatJevCost(totalJevCostUsd)}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            $0.042 / 1M tokens
          </div>
        </div>
      </div>

      {/* Action Bar & Dropzone */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Dropzone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`lg:col-span-2 p-6 rounded-3xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center ${
            isDragging
              ? 'border-emerald-500 bg-emerald-50/50 scale-[0.99]'
              : 'border-slate-300 bg-white hover:border-emerald-400 hover:bg-slate-50/50'
          }`}
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mb-3">
            <UploadCloud className="w-6 h-6" />
          </div>

          <h3 className="text-sm font-bold text-slate-900">
            Arrastra y suelta tus facturas aquí (PDF o Fotos)
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md">
            Soporta PDFs digitales, facturas escaneadas o fotos tomadas desde celular (PNG, JPG, WebP). Decodifica automáticamente códigos QR de Impuestos Nacionales de Bolivia.
          </p>

          <label className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer">
            <input
              type="file"
              multiple
              accept=".pdf,image/png,image/jpeg,image/webp"
              onChange={handleFileInputChange}
              disabled={uploading || process.status !== 'ACTIVE'}
              className="hidden"
            />
            {uploading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Cargando y extrayendo datos...</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4" />
                <span>Seleccionar Archivos desde el Dispositivo</span>
              </>
            )}
          </label>
        </div>

        {/* Audit Trigger Box */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-800 rounded-3xl p-6 text-white shadow-xl flex flex-col justify-between border border-slate-700">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4" />
              <span>Auditoría Automatizada JEV</span>
            </div>
            <h3 className="text-lg font-bold tracking-tight">
              Ejecutar Dictamen en Lote
            </h3>
            <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
              JEV verificará en segundos la identidad del comprador, la coherencia matemática del desglose de compras, el límite de 10.000 Bs. y alertará conceptos sospechosos.
            </p>
          </div>

          <div className="pt-6 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-700/60 pt-3">
              <span>Facturas pendientes:</span>
              <span className="font-mono font-bold text-emerald-400">
                {pendingInvoices.length} de {totalInvoices}
              </span>
            </div>

            <button
              onClick={handleRunEvaluation}
              disabled={evaluating || pendingInvoices.length === 0}
              className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.01]"
            >
              {evaluating ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
                  <span>
                    Auditando en Vivo ({evalProgress?.current || 0}/{evalProgress?.total || pendingInvoices.length})...
                  </span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>
                    {pendingInvoices.length > 0
                      ? `Auditar ${pendingInvoices.length} Factura(s) en Tiempo Real con JEV`
                      : 'Todas las facturas auditadas'}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Live Streaming Audit Progress Banner */}
      {(evaluating || evalProgress) && evalProgress && (
        <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 rounded-3xl p-6 text-white shadow-xl border border-emerald-500/40 space-y-4 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 flex-shrink-0">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold tracking-tight">
                    Auditoría Masiva con TypeSafe AI (JEV) en Tiempo Real
                  </h3>
                  {evaluating && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Procesando en Vivo
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Verificando Identidad (Nombre & CI), Consistencia Matemática (Suma de ítems = Total), Umbral de 10k Bs y Detección de Bienes Atípicos.
                </p>
              </div>
            </div>

            {/* Live Stopwatch & Cost Ticker */}
            <div className="flex items-center gap-4 bg-slate-800/90 px-4 py-2.5 rounded-2xl border border-slate-700/80 text-xs font-mono shadow-inner flex-shrink-0">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Tiempo Transcurrido</span>
                <span className="text-sm font-bold text-slate-100 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {((evalProgress.elapsedMs || 0) / 1000).toFixed(1)}s
                </span>
              </div>
              <div className="h-7 w-px bg-slate-700" />
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Costo JEV API</span>
                <span className="text-sm font-bold text-emerald-400 flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5 text-amber-400" />
                  {formatJevCost(evalProgress.totalCostUsd)}
                </span>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-300 font-sans font-semibold">
                Progreso: <b>{evalProgress.current}</b> de <b>{evalProgress.total}</b> facturas
              </span>
              <span className="font-extrabold text-emerald-400 text-sm">{evalProgress.percentage}%</span>
            </div>
            <div className="w-full h-3.5 bg-slate-800/90 rounded-full overflow-hidden border border-slate-700/80 p-0.5">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 transition-all duration-150 rounded-full shadow-lg shadow-emerald-500/50"
                style={{ width: `${evalProgress.percentage}%` }}
              />
            </div>
          </div>

          {/* Live Verdict Counters */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800/80 text-xs">
            <span className="text-slate-400 text-[11px] font-semibold">Veredictos en vivo:</span>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              {evalProgress.approvedCount} Aprobadas
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              {evalProgress.manualReviewCount} Revisión Manual
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-rose-500/10 text-rose-300 border border-rose-500/20 font-bold">
              <XCircle className="w-3.5 h-3.5 text-rose-400" />
              {evalProgress.rejectedCount} Rechazadas
            </span>
          </div>
        </div>
      )}

      {/* Filter Tabs & Invoices Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Filter Tabs Bar */}
        <div className="border-b border-slate-200 px-6 pt-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-4">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'ALL'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>Todas</span>
              <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-white/20">
                {totalInvoices}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('APPROVED')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'APPROVED'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Aprobadas</span>
              <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-white/20">
                {approvedInvoices.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('MANUAL_REVIEW')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'MANUAL_REVIEW'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-amber-700 hover:bg-amber-50'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Revisión Manual</span>
              <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-white/20">
                {manualReviewInvoices.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('REJECTED')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'REJECTED'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-rose-700 hover:bg-rose-50'
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Rechazadas</span>
              <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-white/20">
                {rejectedInvoices.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('PENDING')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'PENDING'
                  ? 'bg-slate-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Pendientes</span>
              <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-white/20">
                {pendingInvoices.length}
              </span>
            </button>
          </div>

          <div className="text-xs text-slate-500 pb-4">
            Mostrando <b>{filteredInvoices.length}</b> factura(s)
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Documento / Archivo</th>
                <th className="py-3 px-4">Comprador Declarado</th>
                <th className="py-3 px-4">N° Factura & Fecha</th>
                <th className="py-3 px-4 text-right">Monto (Bs.)</th>
                <th className="py-3 px-4 text-center">Veredicto JEV</th>
                <th className="py-3 px-4">Validaciones & Alertas</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <span>No hay facturas en esta categoría.</span>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const ev = inv.evaluation;
                  return (
                    <tr
                      key={inv.id}
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                      onClick={() => setSelectedInvoice(inv)}
                    >
                      {/* Documento */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center flex-shrink-0">
                            <Receipt className="w-4 h-4 text-emerald-600" />
                          </div>
                          <div className="max-w-[200px]">
                            <div className="font-semibold text-slate-900 truncate" title={inv.fileName}>
                              {inv.fileName}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {(inv.fileSize / 1024).toFixed(1)} KB
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Comprador */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">
                          {inv.buyerName || <span className="text-slate-400 italic">No extraído</span>}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500">
                          CI: {inv.buyerCi || 'N/A'}
                        </div>
                      </td>

                      {/* Factura & Fecha */}
                      <td className="py-3.5 px-4 font-mono">
                        <div className="text-slate-800 font-semibold">
                          {inv.invoiceNumber ? `#${inv.invoiceNumber}` : '-'}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {inv.invoiceDate || 'Sin fecha'}
                        </div>
                      </td>

                      {/* Monto Total */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                        {inv.totalAmount ? (
                          <span
                            className={
                              inv.totalAmount >= process.maxAmountThreshold
                                ? 'text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200'
                                : 'text-emerald-700'
                            }
                          >
                            Bs. {inv.totalAmount.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Veredicto JEV */}
                      <td className="py-3.5 px-4 text-center">
                        {ev ? (
                          ev.verdict === 'APPROVED' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Aprobada
                            </span>
                          ) : ev.verdict === 'MANUAL_REVIEW' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              Revisión Manual
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                              <XCircle className="w-3 h-3 text-rose-600" />
                              Rechazada
                            </span>
                          )
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-300">
                            <Clock className="w-3 h-3 text-slate-400" />
                            Pendiente
                          </span>
                        )}
                      </td>

                      {/* Validaciones & Alertas */}
                      <td className="py-3.5 px-4">
                        {ev ? (
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {/* Identidad */}
                            <span
                              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                                ev.identityMatch
                                  ? 'bg-slate-100 text-slate-700'
                                  : 'bg-rose-100 text-rose-800 font-bold'
                              }`}
                            >
                              {ev.identityMatch ? 'CI: OK' : 'CI: Discrepancia'}
                            </span>

                            {/* Matemático */}
                            <span
                              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                                ev.mathConsistent
                                  ? 'bg-slate-100 text-slate-700'
                                  : 'bg-rose-100 text-rose-800 font-bold'
                              }`}
                            >
                              {ev.mathConsistent ? 'Suma: OK' : 'Suma: Descuadre'}
                            </span>

                            {/* Monto */}
                            {ev.amountAlert && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                                &gt; 10k Bs.
                              </span>
                            )}

                            {/* Concepto sospechoso */}
                            {ev.suspiciousConceptAlert && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                                Concepto Atípico
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">En espera de auditoría</span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewVisualInvoice(inv);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors shadow-sm"
                            title="Ver Factura Impresa"
                          >
                            <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Ver Factura</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedInvoice(inv);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-300 hover:bg-emerald-50 hover:border-emerald-300 text-slate-700 hover:text-emerald-800 font-bold text-xs transition-colors shadow-sm"
                            title="Ver Matriz de Auditoría JEV"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Auditoría JEV</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedInvoice && (
        <InvoiceDetailModal
          invoice={selectedInvoice}
          employeeName={process.employeeName}
          employeeCi={process.employeeCi}
          maxAmountThreshold={process.maxAmountThreshold}
          onClose={() => setSelectedInvoice(null)}
          onSaveVerdict={handleSaveVerdict}
        />
      )}

      {/* Quick Visual Invoice Sheet Modal */}
      {previewVisualInvoice && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">
                    Comprobante Fiscal: {previewVisualInvoice.fileName}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Representación Impresa Digital • Formato Estándar SIN Bolivia
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPreviewVisualInvoice(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
              <InvoiceVisualSheet
                invoice={previewVisualInvoice}
                employeeName={process.employeeName}
                employeeCi={process.employeeCi}
              />
            </div>

            <div className="px-6 py-3.5 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <button
                onClick={() => {
                  const inv = previewVisualInvoice;
                  setPreviewVisualInvoice(null);
                  setSelectedInvoice(inv);
                }}
                className="inline-flex items-center gap-1.5 text-emerald-700 hover:text-emerald-800 font-bold"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ver Análisis y Dictamen de JEV</span>
              </button>
              <button
                onClick={() => setPreviewVisualInvoice(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold transition-colors"
              >
                Cerrar Ventana
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
