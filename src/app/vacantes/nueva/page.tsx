'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Briefcase,
  Sliders,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
} from 'lucide-react';

export default function NuevaVacantePage() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [description, setDescription] = useState('');
  const [minScoreThreshold, setMinScoreThreshold] = useState(2.5);

  // Weights (Percentages)
  const [weightSkills, setWeightSkills] = useState(40);
  const [weightExperience, setWeightExperience] = useState(35);
  const [weightEducation, setWeightEducation] = useState(15);
  const [weightLeadership, setWeightLeadership] = useState(10);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalWeights = weightSkills + weightExperience + weightEducation + weightLeadership;
  const isWeightsValid = totalWeights === 100;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Por favor ingresa el título de la vacante');
      return;
    }

    if (!isWeightsValid) {
      setError(`La suma de ponderaciones debe ser exactamente 100% (actual: ${totalWeights}%)`);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/vacancies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          department,
          description: description.trim(),
          minScoreThreshold,
          weightSkills: weightSkills / 100,
          weightExperience: weightExperience / 100,
          weightEducation: weightEducation / 100,
          weightLeadership: weightLeadership / 100,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al crear la vacante');
      }

      router.push(`/vacantes/${data.id}`);
    } catch (err: any) {
      setError(err.message || 'Error inesperado al crear vacante');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Back button */}
      <Link
        href="/vacantes"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Volver al listado de vacantes</span>
      </Link>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 sm:px-8 py-6 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Crear Nueva Convocatoria</h1>
              <p className="text-blue-100 text-xs sm:text-sm mt-0.5">
                Configura los criterios de evaluación y ponderaciones que TypeSafe AI (JEV) aplicará a los candidatos.
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Título del Puesto / Rol *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. Senior Full-Stack Engineer (React + Node)"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Departamento *
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
              >
                <option value="Engineering">Engineering</option>
                <option value="Data & AI">Data & AI</option>
                <option value="DevOps & Cloud">DevOps & Cloud</option>
                <option value="Product & Design">Product & Design</option>
                <option value="Security">Security</option>
                <option value="QA & Testing">QA & Testing</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Descripción y Requisitos Clave
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe las responsabilidades, tecnologías esperadas o contexto del equipo..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>

          {/* Threshold */}
          <div className="p-4 sm:p-5 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between gap-4 mb-2">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Umbral Mínimo de Aprobación (0.0 a 4.0)
                </label>
                <p className="text-xs text-slate-500">
                  Puntaje ponderado mínimo requerido para que el candidato sea marcado como apto para entrevista.
                </p>
              </div>
              <span className="font-mono text-lg font-extrabold text-blue-700 px-3 py-1 bg-blue-100 rounded-lg">
                {minScoreThreshold.toFixed(1)} / 4.0
              </span>
            </div>
            <input
              type="range"
              min="1.0"
              max="3.8"
              step="0.1"
              value={minScoreThreshold}
              onChange={(e) => setMinScoreThreshold(parseFloat(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-400 mt-1">
              <span>1.0 (Junior accesible)</span>
              <span>2.5 (Estándar Semi-Senior)</span>
              <span>3.5 (Senior exigente)</span>
            </div>
          </div>

          {/* Custom Dimension Weights */}
          <div className="p-5 sm:p-6 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">Ponderación de Dimensiones de Evaluación</h3>
              </div>
              <span
                className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full ${
                  isWeightsValid
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-rose-100 text-rose-800 border border-rose-300'
                }`}
              >
                Total: {totalWeights}% {isWeightsValid ? '✓' : '(debe ser 100%)'}
              </span>
            </div>

            <p className="text-xs text-slate-600">
              Ajusta qué porcentaje de relevancia tiene cada área técnica para el cálculo del score global por JEV.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Skills */}
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Habilidades Técnicas (Stack & Profundidad)</span>
                  <span className="font-mono text-blue-600">{weightSkills}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="70"
                  step="5"
                  value={weightSkills}
                  onChange={(e) => setWeightSkills(parseInt(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              {/* Experience */}
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Años de Experiencia & Seniority</span>
                  <span className="font-mono text-blue-600">{weightExperience}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="70"
                  step="5"
                  value={weightExperience}
                  onChange={(e) => setWeightExperience(parseInt(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              {/* Education */}
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Arquitectura & Fundamentos de BD</span>
                  <span className="font-mono text-blue-600">{weightEducation}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="5"
                  value={weightEducation}
                  onChange={(e) => setWeightEducation(parseInt(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              {/* Leadership */}
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Impacto en Negocio & Liderazgo</span>
                  <span className="font-mono text-blue-600">{weightLeadership}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="5"
                  value={weightLeadership}
                  onChange={(e) => setWeightLeadership(parseInt(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Link
              href="/vacantes"
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={loading || !isWeightsValid}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01]"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Creando Convocatoria...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Publicar Vacante</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
