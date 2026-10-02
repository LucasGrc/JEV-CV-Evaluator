'use client';

/**
 * ==============================================================================
 * EvaluationCriteriaModal.tsx - Modal de Criterios y Rúbrica Técnica Oficial
 * ==============================================================================
 * Explica con transparencia y rigor técnico los criterios aplicados por JEV:
 * - Ponderación de pesos (Front-End, Back-End, DB, DevOps, Negocio)
 * - Rúbricas ordinales de Score (0 a 4) por categoría
 * - Criterios de Seniority (Choice) y Verificaciones (Nouls)
 * - Umbral matemático de corte (>= 70 puntos)
 * ==============================================================================
 */

import React, { useState } from 'react';
import {
  X,
  Sliders,
  Terminal,
  Layers,
  Database,
  Cloud,
  TrendingUp,
  UserCheck,
  ShieldCheck,
  CheckCircle2,
  Info,
  Scale,
  Award,
} from 'lucide-react';
import { WEIGHTS, PASSING_SCORE_THRESHOLD } from '@/types/evaluation';

interface EvaluationCriteriaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EvaluationCriteriaModal({ isOpen, onClose }: EvaluationCriteriaModalProps) {
  const [activeCategory, setActiveCategory] = useState<
    'frontend' | 'backend' | 'database' | 'devops' | 'businessImpact'
  >('frontend');

  if (!isOpen) return null;

  const categoryDetails = {
    frontend: {
      title: 'Front-End Development',
      weight: '25%',
      icon: <Terminal className="w-5 h-5 text-sky-500" />,
      color: 'sky',
      description:
        'Evalúa la profundidad en frameworks reactivos modernos, tipado estricto, gestión de estado y optimización de Web Vitals.',
      levels: [
        {
          level: 0,
          label: 'Sin Experiencia',
          desc: 'No se menciona experiencia en desarrollo front-end ni JavaScript moderno.',
          scoreEquiv: '0 - 20 pts',
        },
        {
          level: 1,
          label: 'Básico / Legacy',
          desc: 'Conocimientos de HTML/CSS básico o jQuery/scripts planos; poca o nula profundidad en React o TypeScript.',
          scoreEquiv: '21 - 45 pts',
        },
        {
          level: 2,
          label: 'Competente',
          desc: 'Conocimiento práctico y sólido de React y TypeScript con proyectos reales en entornos de producción.',
          scoreEquiv: '46 - 70 pts',
        },
        {
          level: 3,
          label: 'Avanzado / Senior',
          desc: 'Fuerte dominio de Next.js (App Router), arquitecturas de estado complejas, renderizado SSR/RSC y Web Vitals.',
          scoreEquiv: '71 - 90 pts',
        },
        {
          level: 4,
          label: 'Staff / Principal',
          desc: 'Liderazgo técnico del stack web: micro-frontends, optimización de Core Web Vitals a escala masiva (>10M usuarios).',
          scoreEquiv: '91 - 100 pts',
        },
      ],
    },
    backend: {
      title: 'Back-End Architecture & APIs',
      weight: '25%',
      icon: <Layers className="w-5 h-5 text-indigo-500" />,
      color: 'indigo',
      description:
        'Evalúa el diseño de servicios backend, robustez de APIs, concurrencia, autenticación y modularidad arquitectónica.',
      levels: [
        {
          level: 0,
          label: 'Sin Experiencia',
          desc: 'No se menciona desarrollo de servicios backend ni diseño de APIs.',
          scoreEquiv: '0 - 20 pts',
        },
        {
          level: 1,
          label: 'Scripting Elemental',
          desc: 'Scripts sencillos o endpoints CRUD elementales sin patrones de arquitectura ni middleware.',
          scoreEquiv: '21 - 45 pts',
        },
        {
          level: 2,
          label: 'Competente',
          desc: 'Desarrollo solvente en Node.js, Go o Python, construyendo APIs REST y GraphQL confiables.',
          scoreEquiv: '46 - 70 pts',
        },
        {
          level: 3,
          label: 'Avanzado / Senior',
          desc: 'Arquitectura modular limpia, autenticación OAuth/JWT, rate limiting, idempotencia y alta disponibilidad.',
          scoreEquiv: '71 - 90 pts',
        },
        {
          level: 4,
          label: 'Staff / Principal',
          desc: 'Maestría en sistemas distribuidos, streaming de eventos (Kafka/RabbitMQ), gRPC y microservicios de alto throughput.',
          scoreEquiv: '91 - 100 pts',
        },
      ],
    },
    database: {
      title: 'Base de Datos & Persistencia',
      weight: '15%',
      icon: <Database className="w-5 h-5 text-emerald-500" />,
      color: 'emerald',
      description:
        'Evalúa modelado relacional y NoSQL, transaccionalidad ACID, ORMs y estrategias de caching.',
      levels: [
        {
          level: 0,
          label: 'Sin Experiencia',
          desc: 'No se reporta trabajo con bases de datos ni persistencia de datos.',
          scoreEquiv: '0 - 20 pts',
        },
        {
          level: 1,
          label: 'Básico',
          desc: 'Consultas elementales o colecciones NoSQL no normalizadas sin diseño formal de esquemas.',
          scoreEquiv: '21 - 45 pts',
        },
        {
          level: 2,
          label: 'Competente',
          desc: 'Comprensión sólida de esquemas relacionales, normalización y uso de ORMs (Prisma, Drizzle, TypeORM).',
          scoreEquiv: '46 - 70 pts',
        },
        {
          level: 3,
          label: 'Avanzado / Senior',
          desc: 'Indexación avanzada (B-Tree/GiST), transacciones seguras ACID y capas de caching con Redis.',
          scoreEquiv: '71 - 90 pts',
        },
        {
          level: 4,
          label: 'Staff / Principal',
          desc: 'Arquitectura experta de datos: particionamiento, sharding, réplicas de lectura y query tuning de alta concurrencia.',
          scoreEquiv: '91 - 100 pts',
        },
      ],
    },
    devops: {
      title: 'DevOps & Infraestructura Cloud',
      weight: '15%',
      icon: <Cloud className="w-5 h-5 text-amber-500" />,
      color: 'amber',
      description:
        'Evalúa contenerización, pipelines de CI/CD automatizados, orquestación y despliegues en la nube.',
      levels: [
        {
          level: 0,
          label: 'Sin Experiencia',
          desc: 'Sin experiencia en contenedores, nube ni automatización de despliegues.',
          scoreEquiv: '0 - 20 pts',
        },
        {
          level: 1,
          label: 'Básico',
          desc: 'Manejo básico de Git y despliegues manuales; escaso conocimiento de infraestructura.',
          scoreEquiv: '21 - 45 pts',
        },
        {
          level: 2,
          label: 'Competente',
          desc: 'Uso práctico de Docker para contenerizar aplicaciones y pipelines básicos en GitHub Actions.',
          scoreEquiv: '46 - 70 pts',
        },
        {
          level: 3,
          label: 'Avanzado / Senior',
          desc: 'Despliegues productivos en AWS/GCP, orquestación de contenedores y configuración de entornos reproducibles.',
          scoreEquiv: '71 - 90 pts',
        },
        {
          level: 4,
          label: 'Staff / Principal',
          desc: 'Especialista en Kubernetes, Infraestructura como Código (Terraform), GitOps y observabilidad multi-región.',
          scoreEquiv: '91 - 100 pts',
        },
      ],
    },
    businessImpact: {
      title: 'Impacto de Negocio & Liderazgo',
      weight: '20%',
      icon: <TrendingUp className="w-5 h-5 text-rose-500" />,
      color: 'rose',
      description:
        'Evalúa la evidencia de resultados cuantificables, entrega orientada a producto y liderazgo técnico.',
      levels: [
        {
          level: 0,
          label: 'Sin Evidencia',
          desc: 'CV puramente descriptivo de tareas operativas sin mención de resultados ni impacto.',
          scoreEquiv: '0 - 20 pts',
        },
        {
          level: 1,
          label: 'Operativo',
          desc: 'Entrega estándar de tareas asignadas como desarrollador individual.',
          scoreEquiv: '21 - 45 pts',
        },
        {
          level: 2,
          label: 'Propiedad de Módulo',
          desc: 'Ownership comprobado de funcionalidades completas y colaboración ágil interfuncional.',
          scoreEquiv: '46 - 70 pts',
        },
        {
          level: 3,
          label: 'Alto Impacto',
          desc: 'Métricas cuantificables demostradas: reducción de latencia, ahorro de costos o liderazgo de squads.',
          scoreEquiv: '71 - 90 pts',
        },
        {
          level: 4,
          label: 'Liderazgo Estratégico',
          desc: 'Definición de visión técnica, mentoría de equipos completos y entrega de productos con impacto masivo en ingresos.',
          scoreEquiv: '91 - 100 pts',
        },
      ],
    },
  };

  const current = categoryDetails[activeCategory];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl border border-slate-300 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Cabecera del Modal */}
        <header className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 leading-tight">
                Criterios de Evaluación Técnica & Rúbricas JEV
              </h3>
              <p className="text-xs text-slate-500">
                Modelo discriminativo System One • Composite Scoring para Full-Stack Developers
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Contenido Scrolleable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-slate-700">
          {/* ================================================================ */}
          {/* Sección 1: Ponderación & Fórmula Matemática                      */}
          {/* ================================================================ */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="font-bold text-slate-900 flex items-center gap-2 text-xs uppercase tracking-wider">
                <Sliders className="w-4 h-4 text-blue-600" />
                Ponderación de Pesos Gobernados por Código
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                Umbral de Aprobación: ≥ {PASSING_SCORE_THRESHOLD} Puntos
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
              <div className="p-3 bg-white rounded-xl border border-slate-200 text-center">
                <span className="text-xs text-slate-500 block">Front-End</span>
                <span className="text-lg font-extrabold text-sky-600">
                  {WEIGHTS.frontend * 100}%
                </span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200 text-center">
                <span className="text-xs text-slate-500 block">Back-End</span>
                <span className="text-lg font-extrabold text-indigo-600">
                  {WEIGHTS.backend * 100}%
                </span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200 text-center">
                <span className="text-xs text-slate-500 block">Base de Datos</span>
                <span className="text-lg font-extrabold text-emerald-600">
                  {WEIGHTS.database * 100}%
                </span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200 text-center">
                <span className="text-xs text-slate-500 block">DevOps & Cloud</span>
                <span className="text-lg font-extrabold text-amber-600">
                  {WEIGHTS.devops * 100}%
                </span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200 text-center col-span-2 sm:col-span-1">
                <span className="text-xs text-slate-500 block">Impacto Negocio</span>
                <span className="text-lg font-extrabold text-rose-600">
                  {WEIGHTS.businessImpact * 100}%
                </span>
              </div>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs font-mono text-slate-700">
              <span className="text-slate-400 select-none">Fórmula: </span>
              <strong className="text-blue-700">Score Global = (FE × 0.25) + (BE × 0.25) + (DB × 0.15) + (Ops × 0.15) + (Negocio × 0.20)</strong>
            </div>
          </div>

          {/* ================================================================ */}
          {/* Sección 2: Selector de Categorías & Rúbrica 0 a 4               */}
          {/* ================================================================ */}
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Rúbrica Ordinal de JEV (Score Primitive 0 a 4)
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Selecciona una categoría técnica para inspeccionar la escala descriptiva aplicada por JEV
              </p>
            </div>

            {/* Selector de Pestañas de Categoría */}
            <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
              {(
                [
                  'frontend',
                  'backend',
                  'database',
                  'devops',
                  'businessImpact',
                ] as const
              ).map((catKey) => {
                const info = categoryDetails[catKey];
                const isActive = activeCategory === catKey;

                return (
                  <button
                    key={catKey}
                    onClick={() => setActiveCategory(catKey)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                  >
                    <span>{info.title}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                        isActive ? 'bg-blue-800 text-white' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {info.weight}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Detalle de la Categoría Activa */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-slate-100">{current.icon}</div>
                  <div>
                    <h5 className="font-bold text-slate-900 text-base">{current.title}</h5>
                    <p className="text-xs text-slate-500">{current.description}</p>
                  </div>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Peso Ponderado: {current.weight}
                </span>
              </div>

              {/* Niveles del 0 al 4 */}
              <div className="space-y-2.5 pt-2">
                {current.levels.map((lvl) => (
                  <div
                    key={lvl.level}
                    className="p-3 rounded-xl bg-slate-50/70 hover:bg-slate-50 border border-slate-200/80 flex items-start justify-between gap-4 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-white border border-slate-300 text-slate-800">
                          Nivel {lvl.level} / 4
                        </span>
                        <span className="font-semibold text-slate-900 text-xs">
                          {lvl.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed pl-1">{lvl.desc}</p>
                    </div>

                    <span className="text-xs font-mono font-bold text-slate-500 whitespace-nowrap bg-white px-2 py-1 rounded-lg border border-slate-200">
                      {lvl.scoreEquiv}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ================================================================ */}
          {/* Sección 3: Primitivas Auxiliares (Choice & Nouls)                */}
          {/* ================================================================ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {/* Seniority Choice */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                <UserCheck className="w-4 h-4 text-indigo-600" />
                Seniority Inferencia (Choice Primitive)
              </span>
              <p className="text-xs text-slate-600 leading-relaxed">
                JEV clasifica el nivel del candidato entre opciones ordinales mutuamente excluyentes
                reportando su certidumbre matemática:
              </p>
              <ul className="text-xs space-y-1 text-slate-600 pt-1">
                <li>• <strong>Junior:</strong> 0-2 años de experiencia, ejecución guiada.</li>
                <li>• <strong>Semi-Senior:</strong> 2-4 años, desarrollo autónomo de features.</li>
                <li>• <strong>Senior:</strong> 5-7 años, propiedad arquitectónica end-to-end.</li>
                <li>• <strong>Lead / Staff:</strong> 8+ años, impacto organizacional y mentoría.</li>
                <li>• <strong>Architect:</strong> 10+ años, diseño de sistemas empresariales.</li>
              </ul>
            </div>

            {/* Verificaciones Noul */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Verificaciones Booleanas (Noul Primitives)
              </span>
              <p className="text-xs text-slate-600 leading-relaxed">
                Cada Noul evalúa la probabilidad calibrada (0.0 a 1.0) de que se cumpla una condición específica:
              </p>
              <div className="space-y-2 pt-1 text-xs text-slate-600">
                <div className="p-2 rounded-lg bg-white border border-slate-200">
                  <p className="font-semibold text-slate-800">has_containerization:</p>
                  <p className="text-[11px] text-slate-500">¿Tiene experiencia comprobada en Docker / Kubernetes?</p>
                </div>
                <div className="p-2 rounded-lg bg-white border border-slate-200">
                  <p className="font-semibold text-slate-800">has_modern_stack:</p>
                  <p className="text-[11px] text-slate-500">¿Domina Next.js, React y TypeScript moderno?</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer del Modal */}
        <footer className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Estándar oficial TypeSafe AI • Composite Scoring Reference</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold transition-colors"
          >
            Entendido
          </button>
        </footer>
      </div>
    </div>
  );
}
