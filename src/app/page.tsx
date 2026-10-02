'use client';

/**
 * ==============================================================================
 * CV Evaluator - Batch Processing & Real-Time Leaderboard Dashboard
 * ==============================================================================
 * Sala de control de reclutamiento masivo con TypeSafe AI (JEV).
 * - Procesamiento por lotes con concurrencia controlada
 * - Tabla clasificatoria (Leaderboard) reactiva en tiempo real
 * - Contador gigante de gasto acumulado en dólares
 * - Skeletons animados por fila en cola
 * - Modal detallado de feedback de JEV por candidato
 * ==============================================================================
 */

import React, { useState, useMemo, useRef } from 'react';
import {
  Play,
  RotateCcw,
  Pause,
  Award,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Coins,
  Cpu,
  Clock,
  ChevronRight,
  TrendingUp,
  Sparkles,
  Layers,
  Terminal,
  Database,
  Cloud,
  X,
  Filter,
  BarChart3,
  Sliders,
  Check,
  FileText,
  Scale,
  Info,
} from 'lucide-react';
import { MOCK_CANDIDATES } from '@/mocks/candidates';
import { evaluateSingleCandidate } from '@/app/actions/evaluate-batch';
import { EvaluationResult, CandidateRowState, Candidate } from '@/types/evaluation';
import { CVDocumentViewer } from '@/components/CVDocumentViewer';
import { EvaluationCriteriaModal } from '@/components/EvaluationCriteriaModal';

type CandidateWithCost = EvaluationResult & { costNumeric: number };

export default function LeaderboardPage() {
  // Estado inicial de la lista de candidatos
  const [candidates, setCandidates] = useState<
    Array<CandidateRowState & { costNumeric?: number }>
  >(() =>
    MOCK_CANDIDATES.map((c) => ({
      id: c.id,
      name: c.name,
      targetRole: c.targetRole,
      status: 'idle',
    }))
  );

  const [isRunning, setIsRunning] = useState(false);
  const isCancelledRef = useRef(false);

  // Filtros de visualización
  const [filterType, setFilterType] = useState<'all' | 'passed' | 'rejected'>('all');

  // Candidato seleccionado para ver en el visor (CV PDF o informe de evaluación JEV)
  const [viewingCandidate, setViewingCandidate] = useState<Candidate | null>(null);
  const [viewerInitialTab, setViewerInitialTab] = useState<'document' | 'evaluation'>('document');
  const [isEvaluatingSingleId, setIsEvaluatingSingleId] = useState<string | null>(null);

  // Modal de Criterios de Evaluación
  const [isCriteriaModalOpen, setIsCriteriaModalOpen] = useState(false);

  // Concurrencia de procesamiento (paralelismo seguro)
  const CONCURRENCY_LIMIT = 2;

  const handleOpenCvViewer = (candidateId: string, tab: 'document' | 'evaluation' = 'document') => {
    const cand = MOCK_CANDIDATES.find((c) => c.id === candidateId);
    if (cand) {
      setViewingCandidate(cand);
      setViewerInitialTab(tab);
    }
  };

  const handleEvaluateFromViewer = async (candidateId: string) => {
    setIsEvaluatingSingleId(candidateId);
    try {
      const res = await evaluateSingleCandidate(candidateId);
      if (res.success && res.data) {
        const evalData = res.data;
        setCandidates((prev) =>
          prev.map((c) =>
            c.id === candidateId
              ? {
                  ...c,
                  status: 'completed',
                  evaluation: evalData,
                  costNumeric: evalData.costNumeric,
                }
              : c
          )
        );
      }
    } finally {
      setIsEvaluatingSingleId(null);
    }
  };

  // ==========================================================================
  // Métricas Acumuladas en Tiempo Real
  // ==========================================================================
  const metrics = useMemo(() => {
    let totalCost = 0;
    let totalTokens = 0;
    let totalExecutionTime = 0;
    let completedCount = 0;
    let passedCount = 0;
    let rejectedCount = 0;

    candidates.forEach((c) => {
      if (c.status === 'completed' && c.evaluation) {
        completedCount++;
        totalCost += (c.evaluation as CandidateWithCost).costNumeric || 0;
        totalTokens += c.evaluation.metrics.totalTokens;
        totalExecutionTime += c.evaluation.metrics.executionTimeMs;
        if (c.evaluation.passed) {
          passedCount++;
        } else {
          rejectedCount++;
        }
      }
    });

    const totalCount = candidates.length;
    const progressPercent = Math.round((completedCount / totalCount) * 100);
    const passRate = completedCount > 0 ? Math.round((passedCount / completedCount) * 100) : 0;
    const avgScore =
      completedCount > 0
        ? Math.round(
            candidates
              .filter((c) => c.status === 'completed' && c.evaluation)
              .reduce((acc, c) => acc + (c.evaluation?.overallScore || 0), 0) / completedCount
          )
        : 0;

    return {
      totalCost,
      totalCostFormatted: `$${totalCost.toFixed(4)}`,
      totalTokens,
      totalExecutionTime,
      completedCount,
      totalCount,
      passedCount,
      rejectedCount,
      progressPercent,
      passRate,
      avgScore,
    };
  }, [candidates]);

  // ==========================================================================
  // Algoritmo de Ordenamiento Dinámico (Leaderboard)
  // ==========================================================================
  const sortedCandidates = useMemo(() => {
    const list = [...candidates];

    // Orden prioritario:
    // 1. Completados ordenados por score descendente
    // 2. En procesamiento
    // 3. En cola
    // 4. Idle
    // 5. Con error
    list.sort((a, b) => {
      if (a.status === 'completed' && b.status === 'completed') {
        return (b.evaluation?.overallScore || 0) - (a.evaluation?.overallScore || 0);
      }
      if (a.status === 'completed') return -1;
      if (b.status === 'completed') return 1;

      if (a.status === 'processing') return -1;
      if (b.status === 'processing') return 1;

      if (a.status === 'queued') return -1;
      if (b.status === 'queued') return 1;

      return 0;
    });

    if (filterType === 'passed') {
      return list.filter((c) => c.status === 'completed' && c.evaluation?.passed);
    }
    if (filterType === 'rejected') {
      return list.filter((c) => c.status === 'completed' && !c.evaluation?.passed);
    }
    return list;
  }, [candidates, filterType]);

  // ==========================================================================
  // Ejecución de la Cola de Procesamiento por Lote (Concurrent Worker Pool)
  // ==========================================================================
  const handleStartBatch = async () => {
    if (isRunning) return;
    setIsRunning(true);
    isCancelledRef.current = false;

    // Ponemos en cola a todos los que aún no están completados
    setCandidates((prev) =>
      prev.map((c) => (c.status !== 'completed' ? { ...c, status: 'queued', error: undefined } : c))
    );

    const pendingIds = candidates
      .filter((c) => c.status !== 'completed')
      .map((c) => c.id);

    const queue = [...pendingIds];

    const worker = async () => {
      while (queue.length > 0 && !isCancelledRef.current) {
        const id = queue.shift();
        if (!id) break;

        // Marcar candidato como 'processing'
        setCandidates((prev) =>
          prev.map((c) => (c.id === id ? { ...c, status: 'processing' } : c))
        );

        try {
          const res = await evaluateSingleCandidate(id);

          if (isCancelledRef.current) break;

          if (res.success && res.data) {
            const evalData = res.data;
            setCandidates((prev) =>
              prev.map((c) =>
                c.id === id
                  ? {
                      ...c,
                      status: 'completed',
                      evaluation: evalData,
                      costNumeric: evalData.costNumeric,
                    }
                  : c
              )
            );
          } else {
            setCandidates((prev) =>
              prev.map((c) =>
                c.id === id
                  ? { ...c, status: 'error', error: res.error || 'Error evaluando candidato' }
                  : c
              )
            );
          }
        } catch (err: any) {
          if (!isCancelledRef.current) {
            setCandidates((prev) =>
              prev.map((c) =>
                c.id === id ? { ...c, status: 'error', error: err.message } : c
              )
            );
          }
        }
      }
    };

    // Lanzar workers concurrentes
    const workers = Array.from(
      { length: Math.min(CONCURRENCY_LIMIT, pendingIds.length) },
      () => worker()
    );

    await Promise.all(workers);
    setIsRunning(false);
  };

  const handlePauseBatch = () => {
    isCancelledRef.current = true;
    setIsRunning(false);
    setCandidates((prev) =>
      prev.map((c) => (c.status === 'queued' ? { ...c, status: 'idle' } : c))
    );
  };

  const handleResetBatch = () => {
    isCancelledRef.current = true;
    setIsRunning(false);
    setCandidates(
      MOCK_CANDIDATES.map((c) => ({
        id: c.id,
        name: c.name,
        targetRole: c.targetRole,
        status: 'idle',
      }))
    );
    setViewingCandidate(null);
  };

  // Helper para colorear el badge de score
  const getScoreBadgeStyles = (score: number) => {
    if (score < 50) return 'bg-red-50 text-red-700 border-red-200';
    if (score < 75) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* ==================================================================== */}
      {/* Top Header & Branding */}
      {/* ==================================================================== */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 tracking-tight text-base sm:text-lg">
                TypeSafe AI <span className="text-blue-600">JEV</span>
              </span>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                Batch Engine
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Sala de Control: Evaluación Masiva y Leaderboard en Tiempo Real
            </p>
          </div>
        </div>

        {/* Status Pills y Acciones en Navbar */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setIsCriteriaModalOpen(true)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors shadow-sm"
          >
            <Scale className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">Criterios de Evaluación</span>
            <span className="sm:hidden">Rúbrica</span>
          </button>

          <div className="hidden md:flex items-center gap-2 text-xs text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            <Sliders className="w-3.5 h-3.5 text-blue-600" />
            <span>Concurrencia: {CONCURRENCY_LIMIT} Workers</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-mono font-medium bg-slate-900 text-white px-3 py-1.5 rounded-full shadow-sm">
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span>Gasto:</span>
            <span className="font-bold text-amber-300">{metrics.totalCostFormatted}</span>
          </div>
        </div>
      </header>

      {/* ==================================================================== */}
      {/* Main Content */}
      {/* ==================================================================== */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {/* ================================================================== */}
        {/* PANEL DE CONTROL SUPERIOR (Cockpit Financiero y de Operaciones)   */}
        {/* ================================================================== */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Contador Gigante de Gasto Total */}
            <div className="lg:col-span-5 p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white relative overflow-hidden shadow-lg shadow-slate-900/10">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Coins className="w-32 h-32" />
              </div>

              <div className="relative space-y-3">
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase px-2.5 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  <Coins className="w-3.5 h-3.5 text-amber-400" />
                  Gasto Total de la Operación
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white font-mono">
                    {metrics.totalCostFormatted}
                  </span>
                  <span className="text-sm font-semibold text-slate-400">USD</span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-700/60 text-xs text-slate-300">
                  <div>
                    <span className="text-slate-400">Tokens Procesados:</span>
                    <p className="font-mono font-bold text-white">
                      {metrics.totalTokens.toLocaleString()} tokens
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">Costo Promedio / CV:</span>
                    <p className="font-mono font-bold text-white">
                      {metrics.completedCount > 0
                        ? `$${(metrics.totalCost / metrics.completedCount).toFixed(4)}`
                        : '$0.0000'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Controles de Ejecución y Métricas Clave */}
            <div className="lg:col-span-7 space-y-5">
              {/* Barra de Progreso Global */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="font-semibold text-slate-800 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-blue-600" />
                    Progreso del Lote:
                    <span className="font-bold text-blue-600">
                      {metrics.completedCount} / {metrics.totalCount} CVs
                    </span>
                  </span>
                  <span className="font-mono font-bold text-slate-600">
                    {metrics.progressPercent}%
                  </span>
                </div>

                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${metrics.progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Fila de Métricas Secundarias */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60">
                  <p className="text-[11px] font-medium text-slate-500">Pasan a Entrevista</p>
                  <p className="text-lg font-bold text-emerald-600 mt-0.5">
                    {metrics.passedCount}
                    <span className="text-xs font-normal text-slate-400 ml-1">
                      ({metrics.passRate}%)
                    </span>
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60">
                  <p className="text-[11px] font-medium text-slate-500">Rechazados (&lt;70)</p>
                  <p className="text-lg font-bold text-rose-600 mt-0.5">
                    {metrics.rejectedCount}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60">
                  <p className="text-[11px] font-medium text-slate-500">Score Promedio</p>
                  <p className="text-lg font-bold text-slate-800 mt-0.5">
                    {metrics.avgScore}{' '}
                    <span className="text-xs font-normal text-slate-400">/ 100</span>
                  </p>
                </div>
              </div>

              {/* Botón de Acción Principal de Alto Impacto */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                {!isRunning ? (
                  <button
                    onClick={handleStartBatch}
                    disabled={metrics.completedCount === metrics.totalCount}
                    className={`inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-bold text-sm shadow-md transition-all duration-200 ${
                      metrics.completedCount === metrics.totalCount
                        ? 'bg-emerald-600 text-white cursor-default'
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25 hover:shadow-lg hover:scale-[1.01] active:scale-[0.99]'
                    }`}
                  >
                    {metrics.completedCount === metrics.totalCount ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Lote Completado con Éxito</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-white" />
                        <span>
                          {metrics.completedCount > 0
                            ? 'Reanudar Procesamiento por Lote'
                            : 'Iniciar Procesamiento por Lote'}
                        </span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handlePauseBatch}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20 transition-all hover:scale-[1.01]"
                  >
                    <Pause className="w-4 h-4 fill-white" />
                    <span>Pausar Procesamiento</span>
                  </button>
                )}

                <button
                  onClick={handleResetBatch}
                  className="inline-flex items-center gap-2 px-4 py-3.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reiniciar Lote</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ================================================================== */}
        {/* TABLA CLASIFICATORIA DINÁMICA (LEADERBOARD)                        */}
        {/* ================================================================== */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          {/* Header de la Tabla y Filtros */}
          <div className="p-4 sm:p-6 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                Tabla Clasificatoria en Tiempo Real
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Candidatos ordenados dinámicamente de mayor a menor según el score ponderado de JEV
              </p>
            </div>

            {/* Filtros de Estado */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/80 text-xs">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  filterType === 'all'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Todos ({candidates.length})
              </button>
              <button
                onClick={() => setFilterType('passed')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  filterType === 'passed'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-emerald-700'
                }`}
              >
                Pasan ({metrics.passedCount})
              </button>
              <button
                onClick={() => setFilterType('rejected')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  filterType === 'rejected'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-rose-700'
                }`}
              >
                Rechazados ({metrics.rejectedCount})
              </button>
            </div>
          </div>

          {/* Tabla de Candidatos */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4 text-center w-16">Rank</th>
                  <th className="py-3.5 px-4">Candidato & Perfil</th>
                  <th className="py-3.5 px-4 text-center">Desglose Técnico (FE/BE/DB/Ops/Neg)</th>
                  <th className="py-3.5 px-4 text-center">Estado Decisión</th>
                  <th className="py-3.5 px-4 text-center">Score Global</th>
                  <th className="py-3.5 px-4 text-right">Costo API</th>
                  <th className="py-3.5 px-4 text-center w-44">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {sortedCandidates.map((candidate, index) => {
                  const evalData = candidate.evaluation as CandidateWithCost | undefined;
                  const isCompleted = candidate.status === 'completed' && evalData;
                  const isProcessing = candidate.status === 'processing';
                  const isQueued = candidate.status === 'queued';
                  const isError = candidate.status === 'error';

                  // Estilos de Medallas para el Top 3
                  let rankBadge = (
                    <span className="font-mono font-semibold text-slate-400">
                      #{index + 1}
                    </span>
                  );
                  if (isCompleted && index === 0) {
                    rankBadge = (
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-100 text-amber-800 font-bold border border-amber-300 shadow-sm text-xs">
                        🥇 1
                      </span>
                    );
                  } else if (isCompleted && index === 1) {
                    rankBadge = (
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-bold border border-slate-300 shadow-sm text-xs">
                        🥈 2
                      </span>
                    );
                  } else if (isCompleted && index === 2) {
                    rankBadge = (
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-orange-100 text-orange-800 font-bold border border-orange-300 shadow-sm text-xs">
                        🥉 3
                      </span>
                    );
                  }

                  return (
                    <tr
                      key={candidate.id}
                      onClick={() => handleOpenCvViewer(candidate.id, isCompleted ? 'evaluation' : 'document')}
                      className={`group transition-all duration-200 cursor-pointer ${
                        isCompleted
                          ? 'hover:bg-blue-50/40'
                          : isProcessing
                          ? 'bg-blue-50/20'
                          : 'bg-white hover:bg-slate-50/60'
                      }`}
                    >
                      {/* Columna 1: Ranking */}
                      <td className="py-4 px-4 text-center">{rankBadge}</td>

                      {/* Columna 2: Nombre y Rol */}
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
                            <span>{candidate.name}</span>
                            <span className="opacity-0 group-hover:opacity-100 text-[10px] text-blue-500 font-normal transition-opacity">
                              (Ver CV)
                            </span>
                          </p>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span>{candidate.targetRole}</span>
                            {isCompleted && (
                              <>
                                <span>•</span>
                                <span className="font-medium text-slate-700">
                                  {evalData.seniorityLevel} ({evalData.yearsOfExperience}a exp)
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Columna 3: Desglose Técnico o Skeleton */}
                      <td className="py-4 px-4 text-center">
                        {isCompleted ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <span
                              title="Front-End (25%)"
                              className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200"
                            >
                              FE:{evalData.frontendScore}
                            </span>
                            <span
                              title="Back-End (25%)"
                              className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200"
                            >
                              BE:{evalData.backendScore}
                            </span>
                            <span
                              title="Base de Datos (15%)"
                              className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200"
                            >
                              DB:{evalData.databaseScore}
                            </span>
                            <span
                              title="DevOps (15%)"
                              className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200"
                            >
                              Ops:{evalData.devopsScore}
                            </span>
                            <span
                              title="Negocio (20%)"
                              className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200"
                            >
                              Neg:{evalData.businessImpactScore}
                            </span>
                          </div>
                        ) : isProcessing ? (
                          <div className="flex items-center justify-center gap-1 animate-pulse">
                            <div className="h-4 w-12 bg-blue-200 rounded" />
                            <div className="h-4 w-12 bg-blue-200 rounded" />
                            <div className="h-4 w-12 bg-blue-200 rounded" />
                            <div className="h-4 w-12 bg-blue-200 rounded" />
                          </div>
                        ) : isQueued ? (
                          <span className="text-xs text-slate-400 italic flex items-center justify-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            En cola de procesamiento...
                          </span>
                        ) : (
                          <span className="text-xs text-slate-300">Pendiente de inicio</span>
                        )}
                      </td>

                      {/* Columna 4: Estado Decisión */}
                      <td className="py-4 px-4 text-center">
                        {isCompleted ? (
                          evalData.passed ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-sm">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              PASA A ENTREVISTA
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-300 shadow-sm">
                              <XCircle className="w-3.5 h-3.5 text-rose-600" />
                              RECHAZADO
                            </span>
                          )
                        ) : isProcessing ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 animate-pulse border border-blue-200">
                            <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                            Analizando con JEV...
                          </span>
                        ) : isError ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-red-100 text-red-700">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Error en API
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium">En espera</span>
                        )}
                      </td>

                      {/* Columna 5: Score Global Resaltado */}
                      <td className="py-4 px-4 text-center">
                        {isCompleted ? (
                          <span
                            className={`inline-block font-extrabold text-base px-2.5 py-1 rounded-lg border font-mono ${getScoreBadgeStyles(
                              evalData.overallScore
                            )}`}
                          >
                            {evalData.overallScore}
                            <span className="text-[10px] font-normal opacity-70">/100</span>
                          </span>
                        ) : isProcessing ? (
                          <div className="w-12 h-6 bg-slate-200 rounded-md mx-auto animate-pulse" />
                        ) : (
                          <span className="text-slate-300 font-mono">—</span>
                        )}
                      </td>

                      {/* Columna 6: Costo Individual de API */}
                      <td className="py-4 px-4 text-right">
                        {isCompleted ? (
                          <span className="font-mono text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {evalData.metrics.apiCost}
                          </span>
                        ) : (
                          <span className="text-slate-300 font-mono text-xs">—</span>
                        )}
                      </td>

                      {/* Columna 7: Acciones (Ver CV PDF & Informe JEV) */}
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Botón Ver Documento CV PDF (previa o post evaluación) */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenCvViewer(candidate.id, 'document');
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200/80 transition-all hover:border-blue-300 shadow-sm"
                            title="Ver documento original del currículum (PDF)"
                          >
                            <FileText className="w-3.5 h-3.5 text-blue-600" />
                            <span>Ver CV</span>
                          </button>

                          {/* Botón Informe JEV (si ya fue evaluado) */}
                          {isCompleted && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenCvViewer(candidate.id, 'evaluation');
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-all shadow-sm"
                              title="Ver informe de evaluación de TypeSafe AI"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>JEV</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* ==================================================================== */}
      {/* VISOR DE CURRÍCULUM VITAE (PDF) & INFORME DE EVALUACIÓN JEV          */}
      {/* ==================================================================== */}
      {viewingCandidate && (
        <CVDocumentViewer
          candidate={viewingCandidate}
          evaluation={
            candidates.find((c) => c.id === viewingCandidate.id)?.evaluation
          }
          onClose={() => setViewingCandidate(null)}
          onEvaluate={() => handleEvaluateFromViewer(viewingCandidate.id)}
          isEvaluating={isEvaluatingSingleId === viewingCandidate.id}
          initialTab={viewerInitialTab}
        />
      )}

      {/* Modal de Criterios y Rúbricas Oficiales de JEV */}
      <EvaluationCriteriaModal
        isOpen={isCriteriaModalOpen}
        onClose={() => setIsCriteriaModalOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 px-4 text-center text-xs text-slate-500">
        <p>
          TypeSafe AI (JEV) Batch Processing Engine • Next.js (App Router) + Server Actions + Tailwind CSS Puro
        </p>
      </footer>
    </div>
  );
}
