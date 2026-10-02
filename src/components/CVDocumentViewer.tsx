'use client';

/**
 * ==============================================================================
 * CVDocumentViewer.tsx - Visor Profesional de Currículum Vitae (PDF)
 * ==============================================================================
 * Renderiza el currículum del candidato con maquetación de documento A4/PDF,
 * barra de herramientas de impresión, alternancia entre texto plano/formateado,
 * y acceso directo al reporte de evaluación de TypeSafe AI (JEV).
 * ==============================================================================
 */

import React, { useState } from 'react';
import {
  FileText,
  Printer,
  Copy,
  Check,
  X,
  Sparkles,
  Award,
  AlertTriangle,
  User,
  Mail,
  MapPin,
  Briefcase,
  Layers,
  ChevronRight,
  Clock,
  Coins,
  CheckCircle2,
  XCircle,
  Scale,
} from 'lucide-react';
import { Candidate, EvaluationResult } from '@/types/evaluation';
import { EvaluationCriteriaModal } from '@/components/EvaluationCriteriaModal';

interface CVDocumentViewerProps {
  candidate: Candidate;
  evaluation?: EvaluationResult;
  onClose: () => void;
  onEvaluate?: () => void;
  isEvaluating?: boolean;
  initialTab?: 'document' | 'evaluation';
}

export function CVDocumentViewer({
  candidate,
  evaluation,
  onClose,
  onEvaluate,
  isEvaluating = false,
  initialTab = 'document',
}: CVDocumentViewerProps) {
  const [activeTab, setActiveTab] = useState<'document' | 'evaluation'>(
    initialTab === 'evaluation' && evaluation ? 'evaluation' : 'document'
  );
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'styled' | 'raw'>('styled');
  const [showCriteria, setShowCriteria] = useState(false);

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(candidate.cvText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Parser ligero para renderizar el cvText en secciones limpias
  const parseCVSections = (text: string) => {
    const lines = text.split('\n');
    let candidateName = candidate.name;
    let title = candidate.targetRole;
    let contactInfo = '';
    const sections: Array<{ title: string; content: string[] }> = [];

    let currentSectionTitle = 'Información General';
    let currentLines: string[] = [];

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (index === 0 && trimmed.length > 0) {
        candidateName = trimmed;
        return;
      }
      if (index === 1 && trimmed.length > 0 && !trimmed.toLowerCase().includes('contacto')) {
        title = trimmed;
        return;
      }
      if (trimmed.toLowerCase().startsWith('contacto:') || trimmed.toLowerCase().includes('@')) {
        contactInfo = trimmed.replace(/^contacto:\s*/i, '');
        return;
      }

      // Detectar encabezados de sección en mayúsculas o con dos puntos
      if (
        (trimmed === trimmed.toUpperCase() && trimmed.length > 4 && trimmed.length < 35) ||
        trimmed.endsWith(':')
      ) {
        if (currentLines.length > 0) {
          sections.push({ title: currentSectionTitle, content: [...currentLines] });
          currentLines = [];
        }
        currentSectionTitle = trimmed.replace(/:$/, '');
      } else if (trimmed.length > 0) {
        currentLines.push(trimmed);
      }
    });

    if (currentLines.length > 0) {
      sections.push({ title: currentSectionTitle, content: currentLines });
    }

    return { candidateName, title, contactInfo, sections };
  };

  const parsed = parseCVSections(candidate.cvText);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-100 rounded-2xl border border-slate-300 shadow-2xl max-w-4xl w-full h-[92vh] flex flex-col overflow-hidden relative">
        {/* ================================================================== */}
        {/* Barra Superior de Herramientas y Tabs                              */}
        {/* ================================================================== */}
        <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-tight">
                  {candidate.name}
                </h3>
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  {candidate.id}.pdf
                </span>
              </div>
              <p className="text-xs text-slate-500">{candidate.targetRole}</p>
            </div>
          </div>

          {/* Selector de Pestañas (Documento CV vs Evaluación JEV) */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setActiveTab('document')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === 'document'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Documento CV (PDF)</span>
            </button>

            <button
              onClick={() => setActiveTab('evaluation')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === 'evaluation'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Evaluación JEV</span>
              {evaluation && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full text-white ${
                    evaluation.overallScore >= 70 ? 'bg-emerald-600' : 'bg-rose-600'
                  }`}
                >
                  {evaluation.overallScore}
                </span>
              )}
            </button>
          </div>

          {/* Botón Cerrar */}
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Cerrar visor"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* ================================================================== */}
        {/* Cuerpo del Visor                                                   */}
        {/* ================================================================== */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 flex justify-center">
          {/* TAB 1: DOCUMENTO CV (HOJA A4 ESTILIZADA) */}
          {activeTab === 'document' && (
            <div className="w-full max-w-3xl space-y-4">
              {/* Barra de Controles del Documento */}
              <div className="flex items-center justify-between gap-2 bg-white/80 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-slate-200 text-xs">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewMode(viewMode === 'styled' ? 'raw' : 'styled')}
                    className="font-medium text-slate-600 hover:text-blue-600 underline"
                  >
                    {viewMode === 'styled' ? 'Ver Texto Plano Extraído' : 'Ver Formato Documento'}
                  </button>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-400">Página 1 de 1</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyText}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copiado' : 'Copiar Texto'}</span>
                  </button>

                  <button
                    onClick={handlePrint}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Imprimir</span>
                  </button>

                  {!evaluation && onEvaluate && (
                    <button
                      onClick={onEvaluate}
                      disabled={isEvaluating}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors shadow-sm disabled:opacity-50"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{isEvaluating ? 'Evaluando...' : 'Evaluar con JEV'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Vista Estilizada de Hoja de Currículum (A4 Paper Style) */}
              {viewMode === 'styled' ? (
                <article className="bg-white rounded-xl shadow-xl border border-slate-200 p-8 sm:p-12 space-y-8 font-sans text-slate-800 leading-normal">
                  {/* Encabezado del CV */}
                  <header className="border-b border-slate-200 pb-6 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                        {parsed.candidateName}
                      </h1>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 self-start sm:self-auto">
                        {parsed.title}
                      </span>
                    </div>

                    {parsed.contactInfo && (
                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                        <span className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>{parsed.contactInfo}</span>
                        </span>
                      </div>
                    )}
                  </header>

                  {/* Secciones del CV */}
                  <div className="space-y-6">
                    {parsed.sections.map((sec, secIdx) => (
                      <section key={secIdx} className="space-y-3">
                        <h2 className="text-xs font-bold uppercase tracking-wider text-blue-700 border-b border-slate-100 pb-1 flex items-center gap-2">
                          {sec.title}
                        </h2>

                        <div className="space-y-2 text-xs sm:text-sm text-slate-700 leading-relaxed">
                          {sec.content.map((p, pIdx) => {
                            const isBullet = p.startsWith('-') || p.startsWith('•');
                            return (
                              <p
                                key={pIdx}
                                className={isBullet ? 'pl-4 relative text-slate-600' : 'text-slate-800 font-normal'}
                              >
                                {isBullet && (
                                  <span className="absolute left-0 text-blue-500 font-bold">•</span>
                                )}
                                {isBullet ? p.replace(/^[-•]\s*/, '') : p}
                              </p>
                            );
                          })}
                        </div>
                      </section>
                    ))}
                  </div>

                  {/* Pie de Documento */}
                  <footer className="border-t border-slate-100 pt-6 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Documento verificado para evaluación técnica Full-Stack</span>
                    <span>Procesado con TypeSafe AI Engine</span>
                  </footer>
                </article>
              ) : (
                /* Vista de Texto Plano */
                <div className="bg-slate-900 text-slate-100 p-6 rounded-xl font-mono text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed shadow-lg">
                  {candidate.cvText}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: INFORME DE EVALUACIÓN JEV */}
          {activeTab === 'evaluation' && (
            <div className="w-full max-w-3xl space-y-6">
              {evaluation ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-sm">
                  {/* Encabezado de Evaluación */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div>
                      <h4 className="text-lg font-bold text-slate-900">
                        Informe Técnico Discriminativo (JEV)
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-slate-500">
                          Evaluación basada en Composite Scoring con System One
                        </p>
                        <span>•</span>
                        <button
                          type="button"
                          onClick={() => setShowCriteria(true)}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
                        >
                          <Scale className="w-3 h-3" />
                          <span>Ver Criterios y Rúbrica</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                          evaluation.passed
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : 'bg-rose-50 text-rose-800 border-rose-300'
                        }`}
                      >
                        {evaluation.passed ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>PASA A ENTREVISTA</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                            <span>RECHAZADO</span>
                          </>
                        )}
                      </span>

                      <div className="text-right">
                        <span className="text-2xl font-black font-mono text-slate-900">
                          {evaluation.overallScore}
                        </span>
                        <span className="text-xs text-slate-400">/100</span>
                      </div>
                    </div>
                  </div>

                  {/* Resumen */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 leading-relaxed">
                    <p className="font-semibold text-slate-900 mb-1">Diagnóstico Ejecutivo:</p>
                    {evaluation.summary}
                  </div>

                  {/* Desglose de las 5 Categorías */}
                  <div className="space-y-3">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Puntuaciones por Categoría & Confianza
                    </h5>

                    <div className="space-y-3">
                      {evaluation.categories.map((cat) => (
                        <div
                          key={cat.id}
                          className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-100 space-y-2"
                        >
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold text-slate-800">
                              {cat.name} ({cat.weight}%)
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-slate-400 font-mono">
                                Nivel {cat.rawScore}/4 • Confianza: {(cat.confidence * 100).toFixed(0)}%
                              </span>
                              <span className="font-mono font-bold text-slate-900">
                                {cat.score} / 100
                              </span>
                            </div>
                          </div>

                          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                cat.score < 50
                                  ? 'bg-red-500'
                                  : cat.score < 75
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${cat.score}%` }}
                            />
                          </div>

                          <p className="text-[11px] text-slate-500 pt-0.5">{cat.feedback}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Finanzas */}
                  <div className="flex items-center justify-between text-xs text-slate-500 pt-4 border-t border-slate-100 font-mono">
                    <span>Costo API: <strong className="text-slate-800">{evaluation.metrics.apiCost}</strong></span>
                    <span>Tokens: {evaluation.metrics.totalTokens.toLocaleString()}</span>
                    <span>Tiempo: {evaluation.metrics.executionTimeMs} ms</span>
                  </div>
                </div>
              ) : (
                /* Estado Pendiente */
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4 shadow-sm">
                  <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-base font-bold text-slate-900">
                      Candidato Pendiente de Evaluación
                    </h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Este currículum aún no ha sido procesado por el modelo System One (JEV). Puedes evaluarlo individualmente ahora mismo.
                    </p>
                  </div>
                  {onEvaluate && (
                    <button
                      onClick={onEvaluate}
                      disabled={isEvaluating}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>{isEvaluating ? 'Evaluando...' : 'Evaluar Candidato con JEV'}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Criterios Oficiales */}
      <EvaluationCriteriaModal
        isOpen={showCriteria}
        onClose={() => setShowCriteria(false)}
      />
    </div>
  );
}
