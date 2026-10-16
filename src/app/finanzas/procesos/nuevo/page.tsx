'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Receipt,
  FileCheck2,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
  Sparkles,
  Sliders,
  DollarSign,
  User,
} from 'lucide-react';

const MONTHS = [
  { value: 'Enero', label: 'Enero (01)' },
  { value: 'Febrero', label: 'Febrero (02)' },
  { value: 'Marzo', label: 'Marzo (03)' },
  { value: 'Abril', label: 'Abril (04)' },
  { value: 'Mayo', label: 'Mayo (05)' },
  { value: 'Junio', label: 'Junio (06)' },
  { value: 'Julio', label: 'Julio (07)' },
  { value: 'Agosto', label: 'Agosto (08)' },
  { value: 'Septiembre', label: 'Septiembre (09)' },
  { value: 'Octubre', label: 'Octubre (10)' },
  { value: 'Noviembre', label: 'Noviembre (11)' },
  { value: 'Diciembre', label: 'Diciembre (12)' },
];

export default function NuevoProcesoFacturasPage() {
  const router = useRouter();

  const currentMonthIdx = new Date().getMonth();
  const [periodMonth, setPeriodMonth] = useState(MONTHS[currentMonthIdx].value);
  const [periodYear, setPeriodYear] = useState(new Date().getFullYear());
  const [employeeName, setEmployeeName] = useState('');
  const [employeeCi, setEmployeeCi] = useState('');
  const [department, setDepartment] = useState('Finanzas');
  const [title, setTitle] = useState('');
  const [userEditedTitle, setUserEditedTitle] = useState(false);

  // Reglas configurables
  const [maxAmountThreshold, setMaxAmountThreshold] = useState(10000);
  const [suspiciousConcepts, setSuspiciousConcepts] = useState(
    'Compra o instalación de ascensores, elevadores, maquinaria pesada, obras civiles de construcción a granel o activos industriales no propios de una persona natural.'
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-actualizar el título si el usuario no lo ha sobreescrito manualmente
  useEffect(() => {
    if (!userEditedTitle) {
      if (employeeName.trim()) {
        setTitle(`Descargo de Facturas - ${periodMonth} ${periodYear} (${employeeName.trim()})`);
      } else {
        setTitle(`Descargo de Facturas - ${periodMonth} ${periodYear}`);
      }
    }
  }, [periodMonth, periodYear, employeeName, userEditedTitle]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !employeeName.trim() || !employeeCi.trim()) {
      setError('Por favor completa todos los campos requeridos (*)');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/finance/processes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          periodMonth,
          periodYear,
          employeeName: employeeName.trim(),
          employeeCi: employeeCi.trim(),
          department,
          maxAmountThreshold: Number(maxAmountThreshold),
          suspiciousConcepts: suspiciousConcepts.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al crear proceso de facturas');
      }

      router.push(`/finanzas/procesos/${data.id}`);
    } catch (err: any) {
      setError(err.message || 'Error inesperado al crear proceso');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Back button */}
      <Link
        href="/finanzas/procesos"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Volver a Auditoría de Facturas</span>
      </Link>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Banner */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 px-6 sm:px-8 py-6 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm">
              <Receipt className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                  Crear Nuevo Proceso de Rendición
                </h1>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-100 border border-emerald-300/30">
                  RC-IVA / F-110
                </span>
              </div>
              <p className="text-emerald-100 text-xs sm:text-sm mt-0.5">
                Configura el empleado titular, período fiscal y las reglas de auditoría para TypeSafe AI (JEV).
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

          {/* Employee & Period Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm border-b border-slate-100 pb-2">
              <User className="w-4 h-4 text-emerald-600" />
              <span>Datos del Empleado y Período</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Nombre Completo del Empleado *
                </label>
                <input
                  type="text"
                  value={employeeName}
                  onChange={(e) => setEmployeeName(e.target.value)}
                  placeholder="Ej. Juan Pérez Gómez"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Cédula de Identidad (CI / NIT) *
                </label>
                <input
                  type="text"
                  value={employeeCi}
                  onChange={(e) => setEmployeeCi(e.target.value)}
                  placeholder="Ej. 4892104 o 4892104 LP"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm font-mono"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Mes de Presentación *
                </label>
                <select
                  value={periodMonth}
                  onChange={(e) => setPeriodMonth(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm bg-white"
                >
                  {MONTHS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Año *
                </label>
                <input
                  type="number"
                  min="2020"
                  max="2035"
                  value={periodYear}
                  onChange={(e) => setPeriodYear(parseInt(e.target.value, 10))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm font-mono"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Departamento / Área *
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm bg-white"
                >
                  <option value="Finanzas">Finanzas & Contabilidad</option>
                  <option value="Operaciones">Operaciones</option>
                  <option value="Comercial">Comercial & Ventas</option>
                  <option value="Tecnología">Tecnología & Sistemas</option>
                  <option value="Recursos Humanos">Recursos Humanos</option>
                  <option value="Administración">Administración Central</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Título del Proceso *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setUserEditedTitle(true);
                }}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm font-medium"
                required
              />
            </div>
          </div>

          {/* Audit Rules Section */}
          <div className="p-5 sm:p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-slate-900 text-sm">
                Reglas y Políticas de Auditoría (TypeSafe AI JEV)
              </h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              JEV aplicará estas reglas a cada factura física o PDF cargado. Las facturas que cumplan todos los requisitos serán marcadas como <b>Aprobadas</b>, mientras que anomalías de monto o concepto pasarán a <b>Revisión Manual</b>.
            </p>

            {/* Threshold rule */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Umbral para Revisión Manual (Monto Grande)
                  </label>
                  <p className="text-xs text-slate-500">
                    Facturas con importe igual o superior serán retenidas para revisión manual por auditoría.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200 font-mono text-sm font-bold">
                  <span>Bs.</span>
                  <span>{Number(maxAmountThreshold).toLocaleString('es-BO')}</span>
                </div>
              </div>
              <input
                type="range"
                min="1000"
                max="50000"
                step="1000"
                value={maxAmountThreshold}
                onChange={(e) => setMaxAmountThreshold(parseInt(e.target.value, 10))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Bs. 1.000</span>
                <span>Bs. 10.000 (Recomendado)</span>
                <span>Bs. 50.000</span>
              </div>
            </div>

            {/* Suspicious concept rule */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-500" />
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Regla de Conceptos Sospechosos / No Habituales
                </label>
              </div>
              <p className="text-xs text-slate-500">
                JEV evaluará semánticamente el desglose de productos y marcará para <b>Revisión Manual</b> si detecta ítems fuera del perfil de gasto personal.
              </p>
              <textarea
                rows={3}
                value={suspiciousConcepts}
                onChange={(e) => setSuspiciousConcepts(e.target.value)}
                placeholder="Describe los conceptos o bienes que no corresponden a un descargo de gasto personal..."
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs leading-relaxed"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Link
              href="/finanzas/procesos"
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01]"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Creando Proceso...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Crear Proceso y Cargar Facturas</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
