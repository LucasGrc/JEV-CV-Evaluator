'use client';

import { useState } from 'react';
import {
  Printer,
  Copy,
  Check,
  Building,
  FileText,
  Calendar,
  User,
  ShieldCheck,
  Stamp,
  Receipt,
} from 'lucide-react';

interface InvoiceVisualProps {
  invoice: {
    id: string;
    fileName: string;
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
  };
  employeeName?: string;
  employeeCi?: string;
}

// Convertidor de números a palabras en español (formato legal para facturas bolivianas)
function numberToSpanishWords(amount: number): string {
  const units = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
  const teens = [
    'DIEZ',
    'ONCE',
    'DOCE',
    'TRECE',
    'CATORCE',
    'QUINCE',
    'DIECISÉIS',
    'DIECISIETE',
    'DIECIOCHO',
    'DIECINUEVE',
  ];
  const tens = [
    '',
    '',
    'VEINTE',
    'TREINTA',
    'CUARENTA',
    'CINCUENTA',
    'SESENTA',
    'SETENTA',
    'OCHENTA',
    'NOVENTA',
  ];
  const hundreds = [
    '',
    'CIENTO',
    'DOSCIENTOS',
    'TRESCIENTOS',
    'CUATROCIENTOS',
    'QUINIENTOS',
    'SEISCIENTOS',
    'SETECIENTOS',
    'OCHOCIENTOS',
    'NOVECIENTOS',
  ];

  const intPart = Math.floor(amount);
  const cents = Math.round((amount - intPart) * 100);
  const centsStr = String(cents).padStart(2, '0');

  if (intPart === 0) return `CERO ${centsStr}/100 BOLIVIANOS`;

  function convertGroup(n: number): string {
    let out = '';
    const h = Math.floor(n / 100);
    const t = Math.floor((n % 100) / 10);
    const u = n % 10;

    if (n === 100) return 'CIEN';
    if (h > 0) out += hundreds[h] + ' ';

    if (t === 1) {
      out += teens[u] + ' ';
    } else if (t === 2) {
      if (u === 0) out += 'VEINTE ';
      else out += 'VEINTI' + units[u] + ' ';
    } else if (t > 2) {
      out += tens[t] + ' ';
      if (u > 0) out += 'Y ' + units[u] + ' ';
    } else if (u > 0) {
      out += units[u] + ' ';
    }

    return out.trim();
  }

  let text = '';
  const thousands = Math.floor(intPart / 1000);
  const remainder = intPart % 1000;

  if (thousands > 0) {
    if (thousands === 1) {
      text += 'MIL ';
    } else {
      text += convertGroup(thousands) + ' MIL ';
    }
  }

  if (remainder > 0) {
    text += convertGroup(remainder) + ' ';
  }

  return `SON: ${text.trim()} ${centsStr}/100 BOLIVIANOS`;
}

export function InvoiceVisualSheet({ invoice, employeeName, employeeCi }: InvoiceVisualProps) {
  const [copied, setCopied] = useState(false);

  // Parsear texto crudo para extraer datos de cabecera si existen
  const raw = invoice.extractedText || '';
  const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean);
  const companyName = lines[0] && !lines[0].startsWith('Factura') ? lines[0] : 'COMERCIAL & SERVICIOS BOLIVIA';

  const nitMatch = raw.match(/NIT:\s*([0-9]+)/i);
  const nitValue = nitMatch ? nitMatch[1] : '1028492023';

  const authMatch = raw.match(/AUTORIZACI[OÓ]N:\s*([0-9]+)/i);
  const authValue = authMatch ? authMatch[1] : '4920019284';

  const dateValue = invoice.invoiceDate || '14/10/2026';
  const invoiceNum = invoice.invoiceNumber ? String(invoice.invoiceNumber).padStart(6, '0') : '048291';
  const totalVal = invoice.totalAmount || 0;

  const buyerName = invoice.buyerName || employeeName || 'Carlos Morales';
  const buyerCi = invoice.buyerCi || employeeCi || '5129481 LP';

  const printInvoice = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Top action & context bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-50/80 p-3.5 rounded-2xl border border-amber-200 text-amber-900">
        <div className="flex items-center gap-2.5 text-xs font-semibold">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center flex-shrink-0">
            <Receipt className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold block text-amber-950">
              Factura Física Manual (Talonario Preimpreso Dosificado)
            </span>
            <span className="text-[11px] text-amber-800">
              Descargo de gastos dependientes • RC-IVA (Formulario 110) presentado por {employeeName || buyerName}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={printInvoice}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir Comprobante</span>
          </button>
        </div>
      </div>

      {/* Manual Invoice Document Paper Sheet (Formato Talonario Físico) */}
      <div className="bg-[#fffdf7] border-2 border-slate-400 rounded-2xl p-6 sm:p-9 font-sans shadow-xl text-slate-900 max-w-3xl mx-auto printable-invoice relative overflow-hidden">
        {/* Marca de agua / Sello de Talonario */}
        <div className="absolute top-3 right-4 transform rotate-12 pointer-events-none opacity-20">
          <span className="font-mono text-xs font-black uppercase tracking-widest border-2 border-rose-600 text-rose-600 px-3 py-1 rounded">
            TALONARIO OFICIAL
          </span>
        </div>

        {/* Header Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-start pb-5 border-b-2 border-slate-800">
          {/* Company details preimpresos */}
          <div className="sm:col-span-2 space-y-1">
            <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-950 uppercase font-serif">
              {companyName}
            </h2>
            <div className="text-[11px] text-slate-600 space-y-0.5 leading-snug">
              <p className="font-medium">Casa Matriz: Calle Comercio N° 450, Zona Central</p>
              <p>Teléfono: (591-2) 2401829 • La Paz - Bolivia</p>
              <p className="text-[10px] text-slate-500 font-mono">Actividad Económica: VENTA AL POR MENOR / SERVICIOS COMERCIALES</p>
            </div>
          </div>

          {/* Fiscal Box Preimpreso (Con tipografía roja de talonario) */}
          <div className="border-2 border-slate-800 p-3 rounded-lg text-center bg-white shadow-sm space-y-1 font-mono">
            <div className="text-[10px] font-bold text-slate-500 uppercase">NIT</div>
            <div className="text-xs font-extrabold text-slate-900">{nitValue}</div>

            <div className="text-[10px] font-bold text-slate-500 uppercase pt-1 border-t border-slate-200">
              FACTURA MANUAL
            </div>
            {/* Número en rojo tipográfico típico de imprenta de talonario */}
            <div className="text-base font-black text-rose-600 tracking-wider">
              N° {invoiceNum}
            </div>

            <div className="text-[10px] font-bold text-slate-500 uppercase pt-1 border-t border-slate-200">
              AUTORIZACIÓN N°
            </div>
            <div className="text-[10px] font-semibold text-slate-700">{authValue}</div>

            <div className="pt-1 text-[9px] font-black text-emerald-800 uppercase tracking-widest">
              ORIGINAL: CLIENTE
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="text-center py-3.5">
          <h1 className="text-xl font-black uppercase tracking-widest text-slate-950 font-serif">
            FACTURA
          </h1>
          <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
            (Con Derecho a Crédito Fiscal)
          </p>
        </div>

        {/* Client & Date Details (Campos llenados en el talonario manual) */}
        <div className="bg-white border border-slate-300 rounded-xl p-3.5 mb-5 text-xs grid grid-cols-1 sm:grid-cols-2 gap-3 shadow-sm">
          <div className="space-y-1.5">
            <div className="flex gap-2 items-baseline">
              <span className="font-bold text-slate-600 text-[11px] w-28 uppercase">Lugar y Fecha:</span>
              <span className="font-mono font-bold text-slate-900 border-b border-dotted border-slate-400 flex-1 pb-0.5">
                La Paz, {dateValue}
              </span>
            </div>
            <div className="flex gap-2 items-baseline">
              <span className="font-bold text-slate-600 text-[11px] w-28 uppercase">Señor(es):</span>
              <span className="font-bold text-slate-900 border-b border-dotted border-slate-400 flex-1 pb-0.5">
                {buyerName}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex gap-2 items-baseline">
              <span className="font-bold text-slate-600 text-[11px] w-28 uppercase">NIT / CI:</span>
              <span className="font-mono font-bold text-emerald-800 border-b border-dotted border-slate-400 flex-1 pb-0.5">
                {buyerCi}
              </span>
            </div>
            <div className="flex gap-2 items-baseline">
              <span className="font-bold text-slate-600 text-[11px] w-28 uppercase">Condición:</span>
              <span className="text-slate-800 border-b border-dotted border-slate-400 flex-1 pb-0.5">
                Al Contado / Efectivo
              </span>
            </div>
          </div>
        </div>

        {/* Itemized Table (Líneas de la factura manual) */}
        <div className="border border-slate-300 rounded-xl overflow-hidden mb-5 bg-white">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800 text-white font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2.5 px-3 w-16 text-center">Cant.</th>
                <th className="py-2.5 px-3">Detalle / Concepto</th>
                <th className="py-2.5 px-3 text-right w-28">P. Unitario (Bs.)</th>
                <th className="py-2.5 px-3 text-right w-28">Subtotal (Bs.)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono">
              {invoice.items && invoice.items.length > 0 ? (
                invoice.items.map((it, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#faf8f2]'}>
                    <td className="py-2 px-3 text-center text-slate-800 font-bold">
                      {it.quantity || 1}
                    </td>
                    <td className="py-2 px-3 font-sans text-slate-900 font-medium">
                      {it.description}
                    </td>
                    <td className="py-2 px-3 text-right text-slate-700">
                      {it.unitPrice ? it.unitPrice.toFixed(2) : '-'}
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-slate-950">
                      {it.subtotal ? it.subtotal.toFixed(2) : '-'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="py-2 px-3 text-center text-slate-800 font-bold">1</td>
                  <td className="py-2 px-3 font-sans text-slate-900 font-medium">
                    Consumos y gastos autorizados según factura física
                  </td>
                  <td className="py-2 px-3 text-right text-slate-700">{totalVal.toFixed(2)}</td>
                  <td className="py-2 px-3 text-right font-bold text-slate-950">{totalVal.toFixed(2)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Totals, Literal Amount & Stamp */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start mb-6">
          {/* Monto en palabras */}
          <div className="sm:col-span-2 p-3.5 bg-white border border-slate-300 rounded-xl space-y-1 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Monto Total en Palabras
            </span>
            <p className="text-xs font-bold text-slate-900 uppercase font-mono leading-relaxed">
              {numberToSpanishWords(totalVal)}
            </p>
          </div>

          {/* Cuadro de Totales */}
          <div className="space-y-1.5 font-mono text-xs p-3.5 bg-emerald-50/70 border-2 border-emerald-300 rounded-xl">
            <div className="flex justify-between text-slate-700 font-medium">
              <span>Subtotal:</span>
              <span>Bs. {totalVal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Descuento:</span>
              <span>Bs. 0.00</span>
            </div>
            <div className="flex justify-between font-black text-sm text-slate-900 border-t-2 border-emerald-400 pt-1.5">
              <span>TOTAL BS:</span>
              <span className="text-emerald-900 font-black text-base">Bs. {totalVal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Sello comercial y datos de imprenta autorizada (SIN Bolivia) */}
        <div className="border-t-2 border-slate-850 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Sello de cancelado / pagado del comercio */}
          <div className="border-2 border-dashed border-emerald-700/60 p-2.5 rounded-xl text-center transform -rotate-2 bg-emerald-50/40">
            <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider block">
              ✓ CANCELADO
            </span>
            <span className="text-[9px] text-emerald-700 font-mono block">
              FECHA: {dateValue}
            </span>
            <span className="text-[8px] text-slate-500 uppercase block">
              SELLO & FIRMA AUTORIZADA
            </span>
          </div>

          {/* Pie de imprenta legal (Talonarios preimpresos dosificados por SIN) */}
          <div className="text-[10px] text-center sm:text-right text-slate-500 space-y-1 max-w-sm font-semibold leading-tight">
            <p className="text-slate-700 font-mono text-[9px]">
              Imprenta Autorizada: Artes Gráficas El Cóndor S.R.L. • NIT: 1029384019
            </p>
            <p className="text-slate-600 text-[9px]">
              Autorización Imprenta: 4920192837 • Tiraje: 0001 - 5000 • Fecha Límite de Emisión: 31/12/2026
            </p>
            <p className="uppercase text-slate-900 text-[9px] pt-1">
              "ESTA FACTURA CONTRIBUYE AL DESARROLLO DEL PAÍS, EL USO ILÍCITO SERÁ SANCIONADO PENALMENTE DE ACUERDO A LEY"
            </p>
            <p className="text-[8px] text-slate-400">
              Ley N° 453: El proveedor debe brindar atención sin discriminación, con respeto y calidez.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
