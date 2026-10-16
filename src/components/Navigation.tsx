'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, Briefcase, Receipt, LayoutGrid, PlusCircle } from 'lucide-react';

export default function Navigation() {
  const pathname = usePathname();

  const isPortal = pathname === '/';
  const isRrhh = pathname.startsWith('/vacantes');
  const isFinance = pathname.startsWith('/finanzas');

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-base tracking-tight">TypeSafe Suite</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 border border-blue-200">
                    Enterprise
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 -mt-0.5">JEV System One Intelligence</span>
              </div>
            </Link>

            {/* Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-1 ml-4 pl-4 border-l border-slate-200">
              <Link
                href="/"
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isPortal
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Portal Hub</span>
              </Link>

              <Link
                href="/vacantes"
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isRrhh
                    ? 'bg-blue-50 text-blue-700 border border-blue-200/80 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                <span>RRHH • Evaluador CVs</span>
              </Link>

              <Link
                href="/finanzas/procesos"
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isFinance
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                <span>Finanzas • Auditor Facturas</span>
              </Link>
            </nav>
          </div>

          {/* Right Status & Action */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>JEV API: $0.042 / 1M Tokens</span>
            </div>

            {isFinance ? (
              <Link
                href="/finanzas/procesos/nuevo"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs sm:text-sm shadow-sm transition-all hover:shadow active:scale-95"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Nuevo Descargo</span>
              </Link>
            ) : (
              <Link
                href="/vacantes/nueva"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs sm:text-sm shadow-sm transition-all hover:shadow active:scale-95"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Nueva Vacante</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
