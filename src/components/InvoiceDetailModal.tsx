'use client';

import { useState } from 'react';
import {
  X,
  Receipt,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Sparkles,
  UserCheck,
  Calculator,
  ShieldAlert,
  Coins,
  ChevronDown,
  ChevronUp,
  Save,
  FileText,
  DollarSign,
  AlertOctagon,
  Building2,
} from 'lucide-react';
import { formatJevCost } from '@/lib/pricing';
import { InvoiceVisualSheet } from '@/components/InvoiceVisualSheet';

export interface InvoiceDetailProps {
  invoice: {
    id: string;
    fileName: string;
    fileSize: number;
    status: string;
    buyerName?: string | null;
    buyerCi?: string | null;
    invoiceNumber?: string | null;
    invoiceDate?: string | null;
    totalAmount?: number | null;
    currency?: string;
    items?: Array<{
      description: string;
      quantity?: number;
      unitPrice?: number;
      subtotal?: number;
    }> | null;
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
  };
  employeeName: string;
  employeeCi: string;
  maxAmountThreshold: number;
  onClose: () => void;
  onSaveVerdict?: (
    invoiceId: string,
    newVerdict: 'APPROVED' | 'MANUAL_REVIEW' | 'REJECTED',
    notes: string
  ) => Promise<void>;
}

export function InvoiceDetailModal({
  invoice,
  employeeName,
  employeeCi,
  maxAmountThreshold,
  onClose,
  onSaveVerdict,
}: InvoiceDetailProps) {
  const evaluation = invoice.evaluation;

  const [currentVerdict, setCurrentVerdict] = useState<
    'APPROVED' | 'MANUAL_REVIEW' | 'REJECTED'
  >(evaluation?.verdict || 'MANUAL_REVIEW');
  const [reviewerNotes, setReviewerNotes] = useState(
    evaluation?.reviewerNotes || ''
  );
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showRawText, setShowRawText] = useState(false);
  const [activeTab, setActiveTab] = useState<'audit' | 'visual'>('audit');

  const handleSave = async () => {
    if (!onSaveVerdict) return;
    setSaving(true);
    setSaveSuccess(false);
    try {
      await onSaveVerdict(invoice.id, currentVerdict, reviewerNotes);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving review verdict:', err);
    } finally {
      setSaving(false);
    }
  };

  const getVerdictBadge = (verdict?: string) => {
    switch (verdict) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Factura Aprobada
          </span>
        );
      case 'MANUAL_REVIEW':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            Revisión Manual Requerida
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            Factura Rechazada
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            Pendiente de Evaluación
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Auditoría de Factura: {invoice.fileName}
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Evaluado con TypeSafe AI System One (JEV) • {(invoice.fileSize / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {getVerdictBadge(evaluation?.verdict)}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal View Tabs */}
        <div className="bg-slate-900 px-6 pt-0 pb-0 border-b border-slate-800 flex items-center gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`pb-3 pt-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'audit'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Matriz de Auditoría JEV</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('visual')}
            className={`pb-3 pt-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'visual'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Ver Factura Original (Documento Impreso)</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
          {activeTab === 'visual' ? (
            <InvoiceVisualSheet
              invoice={invoice}
              employeeName={employeeName}
              employeeCi={employeeCi}
            />
          ) : (
            <>
              {/* Key Facts Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">
                Monto Declarado
              </span>
              <span className="text-lg font-extrabold text-emerald-700 font-mono">
                Bs. {invoice.totalAmount ? invoice.totalAmount.toFixed(2) : '0.00'}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">
                Comprador / Titular
              </span>
              <span className="text-xs font-semibold text-slate-800 line-clamp-1">
                {invoice.buyerName || 'No detectado'}
              </span>
              <span className="text-[11px] font-mono text-slate-500 block">
                CI/NIT: {invoice.buyerCi || 'N/A'}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">
                N° Factura & Fecha
              </span>
              <span className="text-xs font-mono font-semibold text-slate-800 block">
                {invoice.invoiceNumber ? `#${invoice.invoiceNumber}` : 'Sin número'}
              </span>
              <span className="text-[11px] text-slate-500">
                {invoice.invoiceDate || 'Fecha no detectada'}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">
                Empleado Titular
              </span>
              <span className="text-xs font-semibold text-slate-800 line-clamp-1">
                {employeeName}
              </span>
              <span className="text-[11px] font-mono text-slate-500 block">
                CI: {employeeCi}
              </span>
            </div>
          </div>

          {evaluation ? (
            <>
              {/* 4-Rule Audit Breakdown */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Matriz de Validación de Reglas Financieras</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Regla 1: Identidad */}
                  <div
                    className={`p-4 rounded-xl border transition-all ${
                      evaluation.identityMatch
                        ? 'bg-emerald-50/60 border-emerald-200'
                        : 'bg-rose-50/60 border-rose-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <UserCheck
                          className={`w-4 h-4 ${
                            evaluation.identityMatch ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        />
                        <h4 className="font-bold text-xs text-slate-900">
                          1. Correspondencia de Identidad (Nombre & CI)
                        </h4>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          evaluation.identityMatch
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {evaluation.identityMatch ? '✓ Coincide' : '✗ No coincide'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-2">
                      {evaluation.identityMatch
                        ? `El comprador en factura corresponde a ${employeeName} (CI: ${employeeCi}).`
                        : `El nombre o CI en la factura no coincide con el empleado registrado (${employeeName} / ${employeeCi}).`}
                    </p>
                    <div className="mt-2 text-[11px] font-mono text-slate-500">
                      Confianza de coincidencia: {(evaluation.identityMatchScore * 100).toFixed(0)}%
                    </div>
                  </div>

                  {/* Regla 2: Coherencia Matemática */}
                  <div
                    className={`p-4 rounded-xl border transition-all ${
                      evaluation.mathConsistent
                        ? 'bg-emerald-50/60 border-emerald-200'
                        : 'bg-rose-50/60 border-rose-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Calculator
                          className={`w-4 h-4 ${
                            evaluation.mathConsistent ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        />
                        <h4 className="font-bold text-xs text-slate-900">
                          2. Coherencia Matemática de Ítems
                        </h4>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          evaluation.mathConsistent
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {evaluation.mathConsistent ? '✓ Cuadra' : '✗ Descuadre'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-2">
                      {evaluation.mathConsistent
                        ? `La suma de los ítems (${evaluation.calculatedSum?.toFixed(2) || '0.00'} Bs.) coincide con el total declarado (${evaluation.declaredTotal?.toFixed(2) || '0.00'} Bs.).`
                        : `Diferencia de Bs. ${evaluation.sumDifference?.toFixed(2)} entre el desglose y el total.`}
                    </p>
                    <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-slate-500">
                      <span>Suma Ítems: Bs. {evaluation.calculatedSum?.toFixed(2) || '0.00'}</span>
                      <span>Total Factura: Bs. {evaluation.declaredTotal?.toFixed(2) || '0.00'}</span>
                    </div>
                  </div>

                  {/* Regla 3: Umbral de Monto */}
                  <div
                    className={`p-4 rounded-xl border transition-all ${
                      !evaluation.amountAlert
                        ? 'bg-emerald-50/60 border-emerald-200'
                        : 'bg-amber-50/60 border-amber-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <DollarSign
                          className={`w-4 h-4 ${
                            !evaluation.amountAlert ? 'text-emerald-600' : 'text-amber-600'
                          }`}
                        />
                        <h4 className="font-bold text-xs text-slate-900">
                          3. Control de Importe Elevado (&gt; Bs. {maxAmountThreshold.toLocaleString('es-BO')})
                        </h4>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          !evaluation.amountAlert
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {!evaluation.amountAlert ? '✓ Normal' : '⚠ Monto Alto'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-2">
                      {!evaluation.amountAlert
                        ? `El importe de Bs. ${invoice.totalAmount?.toFixed(2) || '0.00'} está dentro del rango operativo normal.`
                        : `El importe de Bs. ${invoice.totalAmount?.toFixed(2) || '0.00'} supera el umbral de Bs. ${maxAmountThreshold.toLocaleString('es-BO')}. Requiere aprobación manual de finanzas.`}
                    </p>
                  </div>

                  {/* Regla 4: Conceptos Sospechosos / No Propios */}
                  <div
                    className={`p-4 rounded-xl border transition-all ${
                      !evaluation.suspiciousConceptAlert
                        ? 'bg-emerald-50/60 border-emerald-200'
                        : 'bg-amber-50/60 border-amber-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldAlert
                          className={`w-4 h-4 ${
                            !evaluation.suspiciousConceptAlert ? 'text-emerald-600' : 'text-amber-600'
                          }`}
                        />
                        <h4 className="font-bold text-xs text-slate-900">
                          4. Conceptos Sospechosos o Atípicos
                        </h4>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          !evaluation.suspiciousConceptAlert
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {!evaluation.suspiciousConceptAlert ? '✓ Habitual' : '⚠ Concepto Atípico'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-2">
                      {!evaluation.suspiciousConceptAlert
                        ? 'Los bienes y servicios adquiridos corresponden a un perfil de gasto personal habitual.'
                        : evaluation.suspiciousDetails ||
                          'Se detectaron compras inusuales (ej. ascensores, maquinaria o bienes de capital) no propios de un dependiente.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* JEV Reasoning Card */}
              <div className="p-4 bg-gradient-to-r from-slate-50 to-emerald-50/30 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>Dictamen y Razonamiento de TypeSafe AI (JEV)</span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {evaluation.processingTimeMs} ms
                    </span>
                    <span className="flex items-center gap-1 text-emerald-700 font-bold">
                      <Coins className="w-3 h-3" />
                      {formatJevCost(evaluation.costUsd)}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed font-sans bg-white p-3 rounded-xl border border-slate-200">
                  {evaluation.jevReasoning}
                </p>

                {evaluation.reasons && evaluation.reasons.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {evaluation.reasons.map((r, i) => (
                      <span
                        key={i}
                        className="text-[11px] font-medium px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200"
                      >
                        • {r}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Items Breakdown Table */}
              {invoice.items && invoice.items.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Desglose de Ítems / Productos ({invoice.items.length})
                  </h4>
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="py-2 px-3">Descripción</th>
                          <th className="py-2 px-3 text-right">Cantidad</th>
                          <th className="py-2 px-3 text-right">Precio Unit. (Bs.)</th>
                          <th className="py-2 px-3 text-right">Subtotal (Bs.)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        {invoice.items.map((it, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="py-2 px-3 font-sans text-slate-800 font-medium">
                              {it.description}
                            </td>
                            <td className="py-2 px-3 text-right text-slate-600">
                              {it.quantity ?? 1}
                            </td>
                            <td className="py-2 px-3 text-right text-slate-600">
                              {it.unitPrice ? it.unitPrice.toFixed(2) : '-'}
                            </td>
                            <td className="py-2 px-3 text-right font-bold text-slate-800">
                              {it.subtotal ? it.subtotal.toFixed(2) : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-50 border-t border-slate-200 font-mono font-bold text-slate-900">
                        <tr>
                          <td colSpan={3} className="py-2 px-3 text-right font-sans text-xs">
                            Total Calculado de Ítems:
                          </td>
                          <td className="py-2 px-3 text-right text-emerald-700">
                            Bs. {evaluation.calculatedSum?.toFixed(2) || '0.00'}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              {/* Reviewer / Auditor Override Section */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-emerald-600" />
                    <span>Resolución del Revisor / Auditor de Finanzas</span>
                  </h4>
                  {saveSuccess && (
                    <span className="text-xs text-emerald-700 font-bold flex items-center gap-1 animate-fadeIn">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Dictamen guardado exitosamente
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentVerdict('APPROVED')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      currentVerdict === 'APPROVED'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Aprobar Factura
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentVerdict('MANUAL_REVIEW')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      currentVerdict === 'MANUAL_REVIEW'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-amber-50'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4" />
                    Revisión Manual
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentVerdict('REJECTED')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      currentVerdict === 'REJECTED'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-rose-50'
                    }`}
                  >
                    <XCircle className="w-4 h-4" />
                    Rechazar Factura
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    Comentarios y Notas del Auditor
                  </label>
                  <textarea
                    rows={2}
                    value={reviewerNotes}
                    onChange={(e) => setReviewerNotes(e.target.value)}
                    placeholder="Escribe observaciones adicionales para el descargo (ej. se verificó autorización del gerente para compra mayor)..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow transition-all disabled:opacity-50"
                  >
                    {saving ? (
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Save className="w-3.5 h-3.5" />
                    )}
                    <span>Guardar Resolución de Auditoría</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300">
              <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2 animate-pulse" />
              <h3 className="font-bold text-sm text-slate-700">Factura Pendiente de Evaluación</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Esta factura aún no ha sido evaluada por JEV. Inicia la evaluación en lote desde el panel del proceso para obtener el veredicto automático.
              </p>
            </div>
          )}

          {/* Raw Text Accordion */}
          {invoice.extractedText && (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setShowRawText(!showRawText)}
                className="w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>Inspeccionar Texto Extraído / Cadena QR Impuestos Nacionales</span>
                </div>
                {showRawText ? (
                  <ChevronUp className="w-4 h-4 text-slate-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                )}
              </button>
              {showRawText && (
                <div className="p-4 bg-slate-900 text-emerald-400 font-mono text-[11px] leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap select-all">
                  {invoice.extractedText}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>
            ID Documento: <span className="font-mono text-slate-700">{invoice.id}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold transition-colors"
          >
            Cerrar Ventana
          </button>
        </div>
      </div>
    </div>
  );
}
