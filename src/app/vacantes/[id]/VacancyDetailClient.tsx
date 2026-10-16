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
  MessageSquare,
  Filter,
  X,
  Trash2,
  RotateCcw,
} from 'lucide-react';
import { formatJevCost } from '@/lib/pricing';
import { CVDocumentViewer } from '@/components/CVDocumentViewer';
import { EvaluationCriteriaModal } from '@/components/EvaluationCriteriaModal';
import { mapPrismaEvaluationToResult } from '@/lib/evaluationMapper';
import { EvaluationResult } from '@/types/evaluation';

export const STAGE_CONFIG: Record<
  string,
  { label: string; badge: string; dot: string }
> = {
  APPLIED: {
    label: 'Postulado',
    badge: 'bg-slate-100 text-slate-700 border-slate-300',
    dot: 'bg-slate-400',
  },
  REVIEWING: {
    label: 'En Revisión',
    badge: 'bg-amber-50 text-amber-800 border-amber-300',
    dot: 'bg-amber-500',
  },
  INTERVIEW: {
    label: 'Entrevista',
    badge: 'bg-purple-50 text-purple-800 border-purple-300',
    dot: 'bg-purple-500',
  },
  OFFER: {
    label: 'Oferta',
    badge: 'bg-blue-50 text-blue-800 border-blue-300',
    dot: 'bg-blue-500',
  },
  HIRED: {
    label: 'Contratado',
    badge: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    dot: 'bg-emerald-500',
  },
  REJECTED: {
    label: 'Descartado',
    badge: 'bg-rose-50 text-rose-800 border-rose-300',
    dot: 'bg-rose-500',
  },
};

interface CandidateApp {
  id: string;
  status: string;
  stage?: string;
  recruiterNotes?: string | null;
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
  const [resetting, setResetting] = useState(false);
  const [deletingAppId, setDeletingAppId] = useState<string | null>(null);
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

  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Status management handler
  const handleStatusChange = async (newStatus: 'ACTIVE' | 'PAUSED' | 'CLOSED') => {
    setUpdatingStatus(true);
    setUploadNotice(null);
    try {
      const res = await fetch(`/api/vacancies/${vacancy.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error actualizando estado');
      setVacancy((prev) => ({ ...prev, status: newStatus }));
      setUploadNotice(`✓ Estado de la vacante actualizado a: ${newStatus}`);
    } catch (err: any) {
      setUploadNotice(`Error: ${err.message}`);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Stage management & recruiter notes state
  const [stageFilter, setStageFilter] = useState<
    'ALL' | 'APPLIED' | 'REVIEWING' | 'INTERVIEW' | 'OFFER' | 'HIRED' | 'REJECTED'
  >('ALL');
  const [updatingAppId, setUpdatingAppId] = useState<string | null>(null);
  const [notesModal, setNotesModal] = useState<{
    applicationId: string;
    candidateName: string;
    fileName?: string;
    stage: string;
    notes: string;
  } | null>(null);
  const [savingNotes, setSavingNotes] = useState(false);

  // Stage change handler
  const handleUpdateStage = async (applicationId: string, newStage: string) => {
    setUpdatingAppId(applicationId);
    try {
      const res = await fetch(`/api/applications/${applicationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage }),
      });
      if (res.ok) {
        setVacancy((prev) => ({
          ...prev,
          applications: prev.applications.map((app) =>
            app.id === applicationId ? { ...app, stage: newStage } : app
          ),
        }));
      }
    } catch (err) {
      console.error('Error updating stage:', err);
    } finally {
      setUpdatingAppId(null);
    }
  };

  // Recruiter notes save handler
  const handleSaveNotes = async () => {
    if (!notesModal) return;
    setSavingNotes(true);
    try {
      const res = await fetch(`/api/applications/${notesModal.applicationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage: notesModal.stage,
          recruiterNotes: notesModal.notes,
        }),
      });
      if (res.ok) {
        setVacancy((prev) => ({
          ...prev,
          applications: prev.applications.map((app) =>
            app.id === notesModal.applicationId
              ? { ...app, stage: notesModal.stage, recruiterNotes: notesModal.notes }
              : app
          ),
        }));
        setNotesModal(null);
      }
    } catch (err) {
      console.error('Error saving notes:', err);
    } finally {
      setSavingNotes(false);
    }
  };

  // Reset all applications in vacancy for repeating demo
  const handleResetAllApplications = async () => {
    if (
      !window.confirm(
        '¿Estás seguro de que deseas eliminar todos los CVs y evaluaciones de esta vacante? Esto te permitirá cargar nuevamente los archivos PDF y mostrar la evaluación en vivo.'
      )
    ) {
      return;
    }

    setResetting(true);
    setUploadNotice(null);

    try {
      const res = await fetch(`/api/vacancies/${vacancy.id}/reset`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al eliminar CVs');

      setUploadNotice(`✓ ${data.message}`);
      await refreshData();
    } catch (err: any) {
      setUploadNotice(`Error: ${err.message}`);
    } finally {
      setResetting(false);
    }
  };

  // Delete single application/CV
  const handleDeleteApplication = async (appId: string, candidateName: string) => {
    if (
      !window.confirm(
        `¿Deseas eliminar el CV y la postulación de "${candidateName}"? Podrás cargarlo nuevamente para evaluarlo live.`
      )
    ) {
      return;
    }

    setDeletingAppId(appId);
    try {
      const res = await fetch(`/api/applications/${appId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al eliminar CV');

      setUploadNotice(`✓ ${data.message}`);
      await refreshData();
    } catch (err: any) {
      setUploadNotice(`Error: ${err.message}`);
    } finally {
      setDeletingAppId(null);
    }
  };

  // Sort applications by overallScore descending
  const sortedApplications = [...vacancy.applications].sort((a, b) => {
    const scoreA = a.evaluation?.overallScore ?? -1;
    const scoreB = b.evaluation?.overallScore ?? -1;
    return scoreB - scoreA;
  });

  // Filter applications by pipeline stage
  const displayedApplications = sortedApplications.filter((app) => {
    if (stageFilter === 'ALL') return true;
    return (app.stage || 'APPLIED') === stageFilter;
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

          {vacancy.applications.length > 0 && (
            <button
              type="button"
              onClick={handleResetAllApplications}
              disabled={resetting || evaluating}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 shadow-sm transition-all disabled:opacity-50"
              title="Eliminar todos los CVs y evaluaciones para repetir la demostración"
            >
              {resetting ? (
                <RefreshCw className="w-4 h-4 animate-spin text-rose-600" />
              ) : (
                <Trash2 className="w-4 h-4 text-rose-600" />
              )}
              <span>Borrar CVs (Reset Demo)</span>
            </button>
          )}
        </div>
      </div>

      {/* Vacancy Hero Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                {vacancy.department}
              </span>

              {/* Status Switcher Component */}
              <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs shadow-inner">
                <button
                  type="button"
                  disabled={updatingStatus}
                  onClick={() => handleStatusChange('ACTIVE')}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold transition-all ${
                    vacancy.status === 'ACTIVE'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                  title="Marcar como Activo (acepta CVs y evaluaciones)"
                >
                  <span className={`w-2 h-2 rounded-full ${vacancy.status === 'ACTIVE' ? 'bg-white' : 'bg-emerald-500'}`} />
                  <span>Activo</span>
                </button>

                <button
                  type="button"
                  disabled={updatingStatus}
                  onClick={() => handleStatusChange('PAUSED')}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold transition-all ${
                    vacancy.status === 'PAUSED'
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                  title="Pausar temporalmente el proceso"
                >
                  <span className={`w-2 h-2 rounded-full ${vacancy.status === 'PAUSED' ? 'bg-white' : 'bg-amber-400'}`} />
                  <span>Pausado</span>
                </button>

                <button
                  type="button"
                  disabled={updatingStatus}
                  onClick={() => handleStatusChange('CLOSED')}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold transition-all ${
                    vacancy.status === 'CLOSED'
                      ? 'bg-slate-700 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                  title="Cerrar / Inactivar proceso"
                >
                  <span className={`w-2 h-2 rounded-full ${vacancy.status === 'CLOSED' ? 'bg-white' : 'bg-slate-400'}`} />
                  <span>Cerrado / Inactivo</span>
                </button>
              </div>
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

      {/* Status Warning Banners */}
      {vacancy.status === 'CLOSED' && (
        <div className="mb-6 p-5 rounded-2xl bg-slate-100 border border-slate-300 text-slate-800 text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-fadeIn">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-lg flex-shrink-0">
              🔒
            </div>
            <div>
              <p className="font-bold text-slate-900 text-base">Proceso Cerrado / Inactivo</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Esta convocatoria ha finalizado. La carga de nuevos CVs y evaluaciones automáticas están bloqueadas. Puedes reactivarla cambiando su estado a &quot;Activo&quot; en cualquier momento.
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={updatingStatus}
            onClick={() => handleStatusChange('ACTIVE')}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm flex-shrink-0 hover:scale-[1.02]"
          >
            Reactivar Proceso
          </button>
        </div>
      )}

      {vacancy.status === 'PAUSED' && (
        <div className="mb-6 p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-fadeIn">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-lg flex-shrink-0">
              ⏸️
            </div>
            <div>
              <p className="font-bold text-amber-900 text-base">Proceso Pausado Temporalmente</p>
              <p className="text-xs text-amber-700 mt-0.5">
                La recepción de nuevos candidatos y evaluaciones con JEV está en pausa. Haz clic en Reanudar para habilitar nuevamente la convocatoria.
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={updatingStatus}
            onClick={() => handleStatusChange('ACTIVE')}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm flex-shrink-0 hover:scale-[1.02]"
          >
            Reanudar Proceso
          </button>
        </div>
      )}

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
            onDragOver={vacancy.status === 'ACTIVE' ? handleDragOver : undefined}
            onDragEnter={vacancy.status === 'ACTIVE' ? handleDragEnter : undefined}
            onDragLeave={vacancy.status === 'ACTIVE' ? handleDragLeave : undefined}
            onDrop={vacancy.status === 'ACTIVE' ? handleDrop : undefined}
            className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center transition-all ${
              vacancy.status !== 'ACTIVE'
                ? 'border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed'
                : isDragging
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
              disabled={uploading || vacancy.status !== 'ACTIVE'}
              className="hidden"
            />
            <label
              htmlFor={vacancy.status === 'ACTIVE' ? 'pdf-dropzone-input' : undefined}
              className={`flex flex-col items-center justify-center w-full ${
                vacancy.status === 'ACTIVE' ? 'cursor-pointer' : 'cursor-not-allowed'
              }`}
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center mb-2 transition-all ${
                  vacancy.status !== 'ACTIVE'
                    ? 'bg-slate-200 text-slate-400'
                    : isDragging
                    ? 'bg-blue-600 text-white scale-110 shadow-lg shadow-blue-500/30'
                    : 'bg-blue-100/70 text-blue-600'
                }`}
              >
                <FileText className="w-6 h-6" />
              </div>
              <span className="text-sm font-semibold text-slate-700">
                {vacancy.status === 'CLOSED'
                  ? '🔒 Convocatoria Cerrada (Reactiva arriba para cargar CVs)'
                  : vacancy.status === 'PAUSED'
                  ? '⏸️ Convocatoria Pausada (Reanuda arriba para cargar CVs)'
                  : uploading
                  ? 'Procesando y almacenando PDFs...'
                  : isDragging
                  ? '¡Suelta los archivos PDF aquí para cargarlos!'
                  : 'Selecciona o arrastra múltiples archivos PDF aquí'}
              </span>
              <span className="text-xs text-slate-400 mt-1">
                {vacancy.status === 'ACTIVE'
                  ? 'Compatible con Safari y Chrome (Archivos PDF en inglés)'
                  : 'Modo solo lectura para este proceso'}
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

          {pendingCount === 0 && vacancy.applications.length > 0 ? (
            <button
              type="button"
              onClick={handleResetAllApplications}
              disabled={resetting}
              className="w-full mt-6 py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 disabled:opacity-50"
              title="Borrar los CVs evaluados para volver a cargarlos y repetir la demostración live"
            >
              {resetting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Borrando CVs...</span>
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4 text-slate-950" />
                  <span>Borrar CVs y Repetir Demo Live</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleRunEvaluation}
              disabled={evaluating || pendingCount === 0 || vacancy.status !== 'ACTIVE'}
              className="w-full mt-6 py-3 px-4 rounded-xl bg-white hover:bg-blue-50 text-blue-700 font-bold text-sm shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95"
            >
              {evaluating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                  <span>Evaluando con JEV...</span>
                </>
              ) : vacancy.status === 'CLOSED' ? (
                <span>🔒 Proceso Cerrado</span>
              ) : vacancy.status === 'PAUSED' ? (
                <span>⏸️ Proceso Pausado</span>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current text-blue-600" />
                  <span>Iniciar Evaluación ({pendingCount})</span>
                </>
              )}
            </button>
          )}

          {pendingCount > 0 && vacancy.applications.some((a) => a.evaluation) && (
            <button
              type="button"
              onClick={handleResetAllApplications}
              disabled={resetting}
              className="w-full text-center text-xs text-blue-200 hover:text-white pt-2.5 transition-colors flex items-center justify-center gap-1.5"
            >
              <Trash2 className="w-3 h-3" />
              <span>Limpiar CVs evaluados para repetir demo</span>
            </button>
          )}
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
        <div className="p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <span>Tabla de Clasificación de Candidatos (Leaderboard)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Ordenados automáticamente por el score rubricado calculado por TypeSafe AI (0.0 a 4.0).
            </p>
          </div>

          {/* Stage Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setStageFilter('ALL')}
              className={`px-2.5 py-1 rounded-xl font-bold transition-all ${
                stageFilter === 'ALL'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos ({sortedApplications.length})
            </button>
            <button
              type="button"
              onClick={() => setStageFilter('APPLIED')}
              className={`px-2.5 py-1 rounded-xl font-bold transition-all ${
                stageFilter === 'APPLIED'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Postulados ({sortedApplications.filter((a) => (a.stage || 'APPLIED') === 'APPLIED').length})
            </button>
            <button
              type="button"
              onClick={() => setStageFilter('REVIEWING')}
              className={`px-2.5 py-1 rounded-xl font-bold transition-all ${
                stageFilter === 'REVIEWING'
                  ? 'bg-white text-amber-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              En Revisión ({sortedApplications.filter((a) => a.stage === 'REVIEWING').length})
            </button>
            <button
              type="button"
              onClick={() => setStageFilter('INTERVIEW')}
              className={`px-2.5 py-1 rounded-xl font-bold transition-all ${
                stageFilter === 'INTERVIEW'
                  ? 'bg-white text-purple-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Entrevista ({sortedApplications.filter((a) => a.stage === 'INTERVIEW').length})
            </button>
            <button
              type="button"
              onClick={() => setStageFilter('OFFER')}
              className={`px-2.5 py-1 rounded-xl font-bold transition-all ${
                stageFilter === 'OFFER'
                  ? 'bg-white text-blue-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Oferta ({sortedApplications.filter((a) => a.stage === 'OFFER').length})
            </button>
            <button
              type="button"
              onClick={() => setStageFilter('HIRED')}
              className={`px-2.5 py-1 rounded-xl font-bold transition-all ${
                stageFilter === 'HIRED'
                  ? 'bg-white text-emerald-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Contratado ({sortedApplications.filter((a) => a.stage === 'HIRED').length})
            </button>
            <button
              type="button"
              onClick={() => setStageFilter('REJECTED')}
              className={`px-2.5 py-1 rounded-xl font-bold transition-all ${
                stageFilter === 'REJECTED'
                  ? 'bg-white text-rose-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Descartado ({sortedApplications.filter((a) => a.stage === 'REJECTED').length})
            </button>
          </div>
        </div>

        {displayedApplications.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <FileText className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-medium">No hay candidatos en este estado para esta vacante.</p>
            <p className="text-xs mt-1">
              {stageFilter !== 'ALL'
                ? 'Prueba seleccionando la pestaña "Todos" o cambiando la etapa de algún candidato.'
                : 'Sube archivos PDF en el cuadro superior para comenzar.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-full">
              <thead>
                <tr className="bg-slate-50/90 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-3 w-10 text-center">#</th>
                  <th className="py-3 px-3 min-w-[200px]">Candidato & Documento</th>
                  <th className="py-3 px-2 text-center">Idioma</th>
                  <th className="py-3 px-3 text-center min-w-[130px]">Etapa Selección</th>
                  <th className="py-3 px-2 text-center">Estado JEV</th>
                  <th className="py-3 px-3 text-center">Recomendación</th>
                  <th className="py-3 px-3 text-center">Score JEV (0-4)</th>
                  <th className="py-3 px-2 text-center">Confianza</th>
                  <th className="py-3 px-2 text-center">Costo API</th>
                  <th className="py-3 px-4 text-right sticky right-0 bg-slate-50 shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.08)] z-10 whitespace-nowrap min-w-[170px]">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {displayedApplications.map((app, index) => {
                  const evalData = app.evaluation;
                  const isEvaluated = evalData !== null && evalData !== undefined;
                  const passed =
                    isEvaluated && evalData.overallScore >= vacancy.minScoreThreshold;

                  return (
                    <tr
                      key={app.id}
                      className="hover:bg-slate-50/80 transition-colors group relative"
                    >
                      {/* Rank */}
                      <td className="py-3 px-3 text-center font-bold text-slate-400 font-mono text-xs">
                        {isEvaluated ? `#${index + 1}` : '-'}
                      </td>

                      {/* Candidate Name & PDF */}
                      <td className="py-3 px-3">
                        <div className="flex flex-col max-w-[220px]">
                          <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                            {app.candidate.fullName}
                          </span>
                          <span className="text-xs text-slate-400 flex items-center gap-1 font-mono truncate">
                            <FileText className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{app.cvDocument.fileName}</span>
                          </span>
                        </div>
                      </td>

                      {/* Language */}
                      <td className="py-3 px-2 text-center">
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

                      {/* Stage Selector */}
                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex items-center">
                          <select
                            value={app.stage || 'APPLIED'}
                            disabled={updatingAppId === app.id}
                            onChange={(e) => handleUpdateStage(app.id, e.target.value)}
                            className={`text-xs font-bold px-2 py-1 rounded-xl border transition-all cursor-pointer shadow-sm outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 ${
                              STAGE_CONFIG[app.stage || 'APPLIED']?.badge ||
                              'bg-slate-100 text-slate-700 border-slate-300'
                            }`}
                            title="Cambiar etapa de selección del candidato"
                          >
                            <option value="APPLIED">📋 Postulado</option>
                            <option value="REVIEWING">🔍 En Revisión</option>
                            <option value="INTERVIEW">🎙️ Entrevista</option>
                            <option value="OFFER">💼 Oferta</option>
                            <option value="HIRED">🎉 Contratado</option>
                            <option value="REJECTED">🚫 Descartado</option>
                          </select>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-2 text-center">
                        {app.status === 'EVALUATED' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Evaluado
                          </span>
                        )}
                        {app.status === 'PENDING' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3.5 h-3.5" />
                            Pendiente
                          </span>
                        )}
                        {app.status === 'PROCESSING' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 animate-pulse">
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            Procesando
                          </span>
                        )}
                        {app.status === 'WRONG_LANGUAGE' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle className="w-3.5 h-3.5" />
                            No Inglés
                          </span>
                        )}
                      </td>

                      {/* Recommendation */}
                      <td className="py-3 px-3 text-center">
                        {isEvaluated ? (
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold whitespace-nowrap ${
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
                      <td className="py-3 px-3 text-center font-mono">
                        {isEvaluated ? (
                          <div className="flex flex-col items-center">
                            <span
                              className={`text-sm font-extrabold px-2 py-0.5 rounded-lg border ${
                                passed
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}
                            >
                              {evalData.overallScore.toFixed(2)} <span className="text-[10px] font-normal text-slate-400">/ 4.0</span>
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
                      <td className="py-3 px-2 text-center font-mono text-xs">
                        {isEvaluated ? (
                          <span className="font-semibold text-slate-700">
                            {(evalData.confidence * 100).toFixed(0)}%
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Cost */}
                      <td className="py-3 px-2 text-center font-mono text-xs text-slate-600 whitespace-nowrap">
                        {isEvaluated ? formatJevCost(evalData.costUsd) : '-'}
                      </td>

                      {/* Actions (Sticky Right) */}
                      <td className="py-3 px-4 text-right sticky right-0 bg-white group-hover:bg-slate-50/95 shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.08)] z-10 whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5 flex-nowrap">
                          {/* Recruiter Notes Button */}
                          <button
                            type="button"
                            onClick={() =>
                              setNotesModal({
                                applicationId: app.id,
                                candidateName: app.candidate.fullName,
                                fileName: app.cvDocument.fileName,
                                stage: app.stage || 'APPLIED',
                                notes: app.recruiterNotes || '',
                              })
                            }
                            className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-lg border transition-all flex-shrink-0 ${
                              app.recruiterNotes
                                ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100 font-bold shadow-sm'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                            }`}
                            title={
                              app.recruiterNotes
                                ? `Notas internas guardadas: ${app.recruiterNotes.slice(0, 35)}...`
                                : 'Agregar notas de reclutador'
                            }
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                            <span>{app.recruiterNotes ? 'Nota ✓' : 'Nota'}</span>
                          </button>

                          {/* Ver CV Button */}
                          <button
                            type="button"
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
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors flex-shrink-0 shadow-sm"
                            title="Ver documento CV extraído y evaluación JEV"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Ver CV</span>
                          </button>

                          {/* Delete single CV button */}
                          <button
                            type="button"
                            disabled={deletingAppId === app.id}
                            onClick={() =>
                              handleDeleteApplication(app.id, app.candidate.fullName)
                            }
                            className="inline-flex items-center justify-center p-1.5 text-xs font-semibold rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors flex-shrink-0 shadow-sm disabled:opacity-50"
                            title={`Eliminar postulación de ${app.candidate.fullName} para volver a cargarla`}
                          >
                            {deletingAppId === app.id ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin text-rose-600" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                            )}
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

      {/* Recruiter Notes Modal */}
      {notesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-scaleUp">
            <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 mb-2">
                  <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                  <span>Revisión Humana • Notas del Reclutador</span>
                </div>
                <h3 className="text-xl font-black text-slate-900">
                  {notesModal.candidateName}
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  {notesModal.fileName || 'Currículum Vitae'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setNotesModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Etapa en el modal */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Etapa en el Proceso de Selección:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(STAGE_CONFIG).map(([key, config]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() =>
                        setNotesModal((prev) => (prev ? { ...prev, stage: key } : null))
                      }
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all text-center flex items-center justify-center gap-1.5 ${
                        notesModal.stage === key
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span>{config.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Textarea for recruiter notes */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Observaciones Internas:
                  </label>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {notesModal.notes.length} caracteres
                  </span>
                </div>
                <textarea
                  rows={5}
                  value={notesModal.notes}
                  onChange={(e) =>
                    setNotesModal((prev) =>
                      prev ? { ...prev, notes: e.target.value } : null
                    )
                  }
                  placeholder="Ej: Candidato sólido en TypeScript y arquitectura. Agendar entrevista técnica para el jueves. Pretensión salarial: $4,500 USD..."
                  className="w-full p-3.5 text-sm rounded-2xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none text-slate-800 placeholder:text-slate-400 resize-none transition-all"
                />
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setNotesModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={savingNotes}
                onClick={handleSaveNotes}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
              >
                {savingNotes ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Guardar Notas & Etapa</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
