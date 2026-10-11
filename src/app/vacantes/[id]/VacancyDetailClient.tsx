'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  ArrowLeft,
  UploadCloud,
  Play,
  Download,
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Sparkles,
  Sliders,
  Eye,
  HelpCircle,
  RefreshCw,
  Coins,
  Check,
} from 'lucide-react';
import { formatJevCost } from '@/lib/pricing';
import { CVDocumentViewer } from '@/components/CVDocumentViewer';
import { EvaluationCriteriaModal } from '@/components/EvaluationCriteriaModal';
import { mapPrismaEvaluationToResult } from '@/lib/evaluationMapper';
import { EvaluationResult } from '@/types/evaluation';

interface CandidateApp {
  id: string;
  status: string;
  candidate: {
    id: string;
    fullName: string;
    email?: string | null;
  };
  cvDocument: {
    id: string;
    fileName: string;
    fileSize: number;
    extractedText: string;
    pageCount: number;
    detectedLanguage: string | null;
    isLanguageValid: boolean;
  };
  evaluation?: {
    id: string;
    status: string;
    recommendation: string;
    overallScore: number;
    normalizedScore: number;
    confidence: number;
    scoreSkills: number;
    scoreExperience: number;
    scoreEducation: number;
    scoreLeadership: number;
    jevRawResponses: any;
    inputTokens: number;
    costUsd: number;
    processingTimeMs: number;
  } | null;
}

interface VacancyDetailProps {
  vacancy: {
    id: string;
    title: string;
    department: string;
    description: string;
    status: string;
    minScoreThreshold: number;
    weightSkills: number;
    weightExperience: number;
    weightEducation: number;
    weightLeadership: number;
    applications: CandidateApp[];
  };
}

export default function VacancyDetailClient({ vacancy: initialVacancy }: VacancyDetailProps) {
  const [vacancy, setVacancy] = useState(initialVacancy);
  const [uploading, setUploading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);

  // Modals state
  const [selectedCVForViewer, setSelectedCVForViewer] = useState<{
    candidateName: string;
    targetRole: string;
    cvText: string;
    fileName?: string;
    evaluation?: EvaluationResult | null;
  } | null>(null);

  const [showCriteriaModal, setShowCriteriaModal] = useState(false);

  // Refresh vacancy data from API
  const refreshData = async () => {
    try {
      const res = await fetch(`/api/vacancies/${vacancy.id}`);
      if (res.ok) {
        const updated = await res.json();
        setVacancy(updated);
      }
    } catch (err) {
      console.error('Error refreshing vacancy:', err);
    }
  };

  const [isDragging, setIsDragging] = useState(false);

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

  // Upload handler for multiple files (works for both input selection and drag & drop)
  const uploadFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadNotice(null);

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    try {
      const res = await fetch(`/api/vacancies/${vacancy.id}/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error subiendo archivos');

      setUploadNotice(
        `✓ Se subieron exitosamente ${data.totalUploaded} archivos PDF. Listos para evaluación.`
      );
      await refreshData();
    } catch (err: any) {
      setUploadNotice(`Error: ${err.message}`);
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

  const handleDragEnter = (e: React.DragEvent) => {
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

  // Batch evaluation trigger
  const handleRunEvaluation = async () => {
    setEvaluating(true);
    setUploadNotice(null);

    try {
      const res = await fetch(`/api/vacancies/${vacancy.id}/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error ejecutando evaluación');

      setUploadNotice(`✓ Evaluación con JEV completada.`);
      await refreshData();
    } catch (err: any) {
      setUploadNotice(`Error durante evaluación: ${err.message}`);
    } finally {
      setEvaluating(false);
    }
  };

  // Sort applications by overallScore descending
  const sortedApplications = [...vacancy.applications].sort((a, b) => {
    const scoreA = a.evaluation?.overallScore ?? -1;
    const scoreB = b.evaluation?.overallScore ?? -1;
    return scoreB - scoreA;
  });

  const pendingCount = vacancy.applications.filter((a) => a.status === 'PENDING').length;
  const evaluatedCount = vacancy.applications.filter((a) => a.evaluation !== null).length;
  const totalCost = vacancy.applications.reduce(
    (sum, a) => sum + (a.evaluation?.costUsd || 0),
    0
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Top Navigation */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <Link
          href="/vacantes"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a vacantes</span>
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCriteriaModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm transition-all"
          >
            <HelpCircle className="w-4 h-4 text-blue-600" />
            <span>Ver Criterios y Rúbricas</span>
          </button>

          <a
            href={`/api/vacancies/${vacancy.id}/export-csv`}
            download
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm transition-all"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Exportar CSV</span>
          </a>
        </div>
      </div>

      {/* Vacancy Hero Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                {vacancy.department}
              </span>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 uppercase">
                {vacancy.status}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {vacancy.title}
            </h1>

            {vacancy.description && (
              <p className="text-sm text-slate-500 mt-2 max-w-3xl">{vacancy.description}</p>
            )}
          </div>

          {/* Stats Badges */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="bg-slate-50 px-4 py-3 rounded-2xl border border-slate-100 text-center min-w-[90px]">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Candidatos</span>
              <span className="text-xl font-extrabold text-slate-800">{vacancy.applications.length}</span>
            </div>

            <div className="bg-blue-50/60 px-4 py-3 rounded-2xl border border-blue-100 text-center min-w-[90px]">
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">Evaluados</span>
              <span className="text-xl font-extrabold text-blue-700">{evaluatedCount}</span>
            </div>

            <div className="bg-emerald-50/60 px-4 py-3 rounded-2xl border border-emerald-100 text-center min-w-[90px]">
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Gasto JEV</span>
              <span className="text-base font-extrabold font-mono text-emerald-700">
                {formatJevCost(totalCost)}
              </span>
            </div>
          </div>
        </div>

        {/* Weights & Threshold bar */}
        <div className="pt-4 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-4 font-mono text-slate-600 flex-wrap">
            <span className="flex items-center gap-1 font-sans font-semibold text-slate-700">
              <Sliders className="w-3.5 h-3.5 text-blue-600" />
              Pesos aplicados:
            </span>
            <span className="px-2 py-1 bg-slate-100 rounded-md">Skills: {Math.round(vacancy.weightSkills * 100)}%</span>
            <span className="px-2 py-1 bg-slate-100 rounded-md">Experiencia: {Math.round(vacancy.weightExperience * 100)}%</span>
            <span className="px-2 py-1 bg-slate-100 rounded-md">Educación: {Math.round(vacancy.weightEducation * 100)}%</span>
            <span className="px-2 py-1 bg-slate-100 rounded-md">Liderazgo: {Math.round(vacancy.weightLeadership * 100)}%</span>
          </div>

          <div className="text-slate-500 font-sans">
            Umbral de corte: <strong className="text-blue-700 font-bold">{vacancy.minScoreThreshold.toFixed(1)} / 4.0</strong>
          </div>
        </div>
      </div>

      {/* Upload & Actions Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Multi-PDF Upload Card */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-blue-600" />
                <span>Cargar Currículums en Formato PDF</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Soporta carga simultánea de múltiples archivos PDF. Deduplicación automática por hash SHA-256 y validación de idioma inglés.
              </p>
            </div>
          </div>

          <div
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center transition-all ${
              isDragging
                ? 'border-blue-600 bg-blue-50 scale-[1.01] ring-4 ring-blue-500/20 shadow-md'
                : 'border-slate-300 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/20'
            }`}
          >
            <input
              type="file"
              id="pdf-dropzone-input"
              multiple
              accept="application/pdf"
              onChange={handleFileInputChange}
              disabled={uploading}
              className="hidden"
            />
            <label
              htmlFor="pdf-dropzone-input"
              className="cursor-pointer flex flex-col items-center justify-center w-full"
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center mb-2 transition-all ${
                  isDragging
                    ? 'bg-blue-600 text-white scale-110 shadow-lg shadow-blue-500/30'
                    : 'bg-blue-100/70 text-blue-600'
                }`}
              >
                <FileText className="w-6 h-6" />
              </div>
              <span className="text-sm font-semibold text-slate-700">
                {uploading
                  ? 'Procesando y almacenando PDFs...'
                  : isDragging
                  ? '¡Suelta los archivos PDF aquí para cargarlos!'
                  : 'Selecciona o arrastra múltiples archivos PDF aquí'}
              </span>
              <span className="text-xs text-slate-400 mt-1">
                Compatible con Safari y Chrome (Archivos PDF en inglés)
              </span>
            </label>
          </div>
        </div>

        {/* Evaluation Execution Card */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-200 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-300" />
                Motor System One
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/20">
                $0.042 / 1M
              </span>
            </div>
            <h3 className="text-lg font-bold">Evaluar Pendientes con JEV</h3>
            <p className="text-xs text-blue-100 mt-1">
              Ejecuta el análisis tipado y rubricado sobre todos los CVs en espera usando el modelo JEV.
            </p>

            <div className="mt-4 p-3 bg-white/10 rounded-xl backdrop-blur-sm text-xs space-y-1">
              <div className="flex justify-between">
                <span>CVs Pendientes:</span>
                <strong className="font-bold">{pendingCount}</strong>
              </div>
              <div className="flex justify-between">
                <span>Costo estimado:</span>
                <strong className="font-mono">
                  ~{formatJevCost((pendingCount * 1200 * 0.042) / 1_000_000)}
                </strong>
              </div>
            </div>
          </div>

          <button
            onClick={handleRunEvaluation}
            disabled={evaluating || pendingCount === 0}
            className="w-full mt-6 py-3 px-4 rounded-xl bg-white hover:bg-blue-50 text-blue-700 font-bold text-sm shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95"
          >
            {evaluating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                <span>Evaluando con JEV...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current text-blue-600" />
                <span>Iniciar Evaluación ({pendingCount})</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Upload notice message */}
      {uploadNotice && (
        <div className="mb-6 p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 text-sm flex items-center justify-between animate-fadeIn">
          <span>{uploadNotice}</span>
          <button
            onClick={() => setUploadNotice(null)}
            className="text-blue-500 hover:text-blue-700 font-bold text-xs"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Candidate Leaderboard Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <span>Tabla de Clasificación de Candidatos (Leaderboard)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Ordenados automáticamente por el score rubricado calculado por TypeSafe AI (0.0 a 4.0).
            </p>
          </div>

          <span className="text-xs text-slate-400 font-mono">
            Total: {vacancy.applications.length} registros
          </span>
        </div>

        {sortedApplications.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <FileText className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-medium">No hay candidatos cargados para esta vacante.</p>
            <p className="text-xs mt-1">Sube archivos PDF en el cuadro superior para comenzar.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4">Candidato & Documento</th>
                  <th className="py-3 px-4 text-center">Idioma</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 px-4 text-center">Recomendación</th>
                  <th className="py-3 px-4 text-center">Score JEV (0-4)</th>
                  <th className="py-3 px-4 text-center">Confianza</th>
                  <th className="py-3 px-4 text-center">Costo API</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {sortedApplications.map((app, index) => {
                  const evalData = app.evaluation;
                  const isEvaluated = evalData !== null && evalData !== undefined;
                  const passed =
                    isEvaluated && evalData.overallScore >= vacancy.minScoreThreshold;

                  return (
                    <tr
                      key={app.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Rank */}
                      <td className="py-4 px-4 text-center font-bold text-slate-400 font-mono">
                        {isEvaluated ? `#${index + 1}` : '-'}
                      </td>

                      {/* Candidate Name & PDF */}
                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {app.candidate.fullName}
                          </span>
                          <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                            <FileText className="w-3 h-3" />
                            {app.cvDocument.fileName}
                          </span>
                        </div>
                      </td>

                      {/* Language */}
                      <td className="py-4 px-4 text-center">
                        {app.cvDocument.isLanguageValid ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                            ENG
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            {app.cvDocument.detectedLanguage?.toUpperCase() || 'NO-ENG'}
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 text-center">
                        {app.status === 'EVALUATED' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Evaluado
                          </span>
                        )}
                        {app.status === 'PENDING' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3.5 h-3.5" />
                            Pendiente
                          </span>
                        )}
                        {app.status === 'PROCESSING' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 animate-pulse">
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            Procesando
                          </span>
                        )}
                        {app.status === 'WRONG_LANGUAGE' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle className="w-3.5 h-3.5" />
                            No Inglés
                          </span>
                        )}
                      </td>

                      {/* Recommendation */}
                      <td className="py-4 px-4 text-center">
                        {isEvaluated ? (
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                              evalData.recommendation === 'TOP_CANDIDATE'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : evalData.recommendation === 'POTENTIAL_FIT'
                                ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                : evalData.recommendation === 'REVIEW_REQUIRED'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-slate-100 text-slate-700 border border-slate-300'
                            }`}
                          >
                            {evalData.recommendation.replace('_', ' ')}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </td>

                      {/* Score JEV (0-4) */}
                      <td className="py-4 px-4 text-center font-mono">
                        {isEvaluated ? (
                          <div className="flex flex-col items-center">
                            <span
                              className={`text-base font-extrabold px-2.5 py-0.5 rounded-lg border ${
                                passed
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}
                            >
                              {evalData.overallScore.toFixed(2)} <span className="text-xs font-normal text-slate-400">/ 4.0</span>
                            </span>
                            <span className="text-[10px] text-slate-400 mt-0.5">
                              {evalData.normalizedScore}% ({Math.round(evalData.normalizedScore)} / 100)
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </td>

                      {/* Confidence */}
                      <td className="py-4 px-4 text-center font-mono text-xs">
                        {isEvaluated ? (
                          <span className="font-semibold text-slate-700">
                            {(evalData.confidence * 100).toFixed(0)}%
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Cost */}
                      <td className="py-4 px-4 text-center font-mono text-xs text-slate-600">
                        {isEvaluated ? formatJevCost(evalData.costUsd) : '-'}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              const mappedEvaluation = app.evaluation
                                ? mapPrismaEvaluationToResult(
                                    app.evaluation,
                                    app.candidate.fullName,
                                    vacancy.title,
                                    app.cvDocument.extractedText,
                                    vacancy.minScoreThreshold
                                  )
                                : null;

                              setSelectedCVForViewer({
                                candidateName: app.candidate.fullName,
                                targetRole: vacancy.title,
                                cvText: app.cvDocument.extractedText,
                                fileName: app.cvDocument.fileName,
                                evaluation: mappedEvaluation,
                              });
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 transition-colors"
                            title="Ver documento CV extraído y evaluación"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Ver CV</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CV Document Viewer Modal */}
      {selectedCVForViewer && (
        <CVDocumentViewer
          candidate={{
            id: selectedCVForViewer.candidateName,
            name: selectedCVForViewer.candidateName,
            targetRole: selectedCVForViewer.targetRole,
            cvText: selectedCVForViewer.cvText,
          }}
          evaluation={selectedCVForViewer.evaluation ?? undefined}
          initialTab={selectedCVForViewer.evaluation ? 'evaluation' : 'document'}
          onClose={() => setSelectedCVForViewer(null)}
        />
      )}

      {/* Evaluation Criteria Modal */}
      <EvaluationCriteriaModal
        isOpen={showCriteriaModal}
        onClose={() => setShowCriteriaModal(false)}
      />
    </div>
  );
}
