'use client';

import { useState } from 'react';
import {
  Printer,
  Copy,
  Check,
  Building,
  QrCode,
  FileText,
  Calendar,
  User,
  ShieldCheck,
  ExternalLink,
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

// Generador visual de matriz QR en SVG
function SimpleQrSvg({ text }: { text: string }) {
  // Genera un patrón pseudo-QR representativo determinista basado en el hash del texto
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }

  const size = 25;
  const matrix: boolean[][] = [];
  for (let r = 0; r < size; r++) {
    matrix[r] = [];
    for (let c = 0; c < size; c++) {
      // Patrones de esquina fijos del estándar QR
      const isCorner1 = r < 7 && c < 7;
      const isCorner2 = r < 7 && c >= size - 7;
      const isCorner3 = r >= size - 7 && c < 7;

      if (isCorner1 || isCorner2 || isCorner3) {
        const localR = isCorner3 ? r - (size - 7) : r;
        const localC = isCorner2 ? c - (size - 7) : c;
        const isBorder = localR === 0 || localR === 6 || localC === 0 || localC === 6;
        const isCenter = localR >= 2 && localR <= 4 && localC >= 2 && localC <= 4;
        matrix[r][c] = isBorder || isCenter;
      } else {
        const val = Math.sin(hash * 0.1 + r * 1.3 + c * 2.7);
        matrix[r][c] = val > 0.05;
      }
    }
  }

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-24 h-24 bg-white p-1 border border-slate-300 rounded shadow-sm">
      {matrix.map((row, r) =>
        row.map((active, c) =>
          active ? <rect key={`${r}-${c}`} x={c} y={r} width="1" height="1" fill="#0f172a" /> : null
        )
      )}
    </svg>
  );
}

export function InvoiceVisualSheet({ invoice, employeeName, employeeCi }: InvoiceVisualProps) {
  const [copied, setCopied] = useState(false);

  // Parsear texto crudo para extraer datos de cabecera si existen
  const raw = invoice.extractedText || '';
  const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean);
  const companyName = lines[0] && !lines[0].startsWith('Factura') ? lines[0] : 'HIPERMERCADOS KETAL S.A.';

  const nitMatch = raw.match(/NIT:\s*([0-9]+)/i);
  const nitValue = nitMatch ? nitMatch[1] : '1028492023';

  const authMatch = raw.match(/AUTORIZACI[OÓ]N:\s*([0-9]+)/i);
  const authValue = authMatch ? authMatch[1] : '4920019284';

  const dateValue = invoice.invoiceDate || '04/10/2026';
  const invoiceNum = invoice.invoiceNumber || '48291';
  const totalVal = invoice.totalAmount || 0;

  const buyerName = invoice.buyerName || employeeName || 'Juan Pérez';
  const buyerCi = invoice.buyerCi || employeeCi || '4892182 LP';

  const qrChain = `${nitValue}|${invoiceNum}|${authValue}|${dateValue}|${totalVal.toFixed(2)}|${totalVal.toFixed(2)}|A1-B2-C3-D4|${buyerCi}`;

  const copyQrChain = () => {
    navigator.clipboard.writeText(qrChain);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const printInvoice = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Top action bar */}
      <div className="flex items-center justify-between bg-slate-100 p-3 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-2 text-xs text-slate-600 font-semibold">
          <FileText className="w-4 h-4 text-emerald-600" />
          <span>Vista de Factura Oficial Digital (Formato Estándar SIN Bolivia)</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={copyQrChain}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-sm"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Cadena QR Copiada' : 'Copiar Cadena QR'}</span>
          </button>
          <button
            type="button"
            onClick={printInvoice}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir / Guardar PDF</span>
          </button>
        </div>
      </div>

      {/* Invoice Document Paper Sheet */}
      <div className="bg-white border-2 border-slate-300 rounded-2xl p-6 sm:p-8 font-sans shadow-lg text-slate-900 max-w-3xl mx-auto printable-invoice">
        {/* Header Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-start pb-6 border-b-2 border-slate-900">
          {/* Company details */}
          <div className="sm:col-span-2 space-y-1">
            <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 uppercase">
              {companyName}
            </h2>
            <div className="text-[11px] text-slate-600 space-y-0.5 leading-snug">
              <p className="font-semibold">Casa Matriz: Av. Ballivián N° 1055, Calacoto</p>
              <p>Teléfonos: (591-2) 2791000 • La Paz, Bolivia</p>
              <p className="font-mono text-[10px] text-slate-500">Actividad: VENTA AL POR MENOR DE PRODUCTOS DIVERSOS</p>
            </div>
          </div>

          {/* Fiscal Box */}
          <div className="border-2 border-slate-900 p-3 rounded-lg text-center bg-slate-50/50 space-y-1 font-mono">
            <div className="text-[10px] font-bold text-slate-500 uppercase">NIT</div>
            <div className="text-xs font-bold text-slate-900">{nitValue}</div>

            <div className="text-[10px] font-bold text-slate-500 uppercase pt-1 border-t border-slate-200">
              FACTURA N°
            </div>
            <div className="text-sm font-black text-emerald-800">{invoiceNum}</div>

            <div className="text-[10px] font-bold text-slate-500 uppercase pt-1 border-t border-slate-200">
              AUTORIZACIÓN N°
            </div>
            <div className="text-[11px] font-semibold text-slate-700">{authValue}</div>

            <div className="pt-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              ORIGINAL
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="text-center py-4">
          <h1 className="text-xl font-black uppercase tracking-wider text-slate-950">
            FACTURA
          </h1>
          <p className="text-[11px] font-semibold text-slate-600 tracking-wide">
            (Con Derecho a Crédito Fiscal)
          </p>
        </div>

        {/* Client & Date Details */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 mb-5 text-xs grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <div className="flex gap-2">
              <span className="font-bold text-slate-600 w-28">Fecha de Emisión:</span>
              <span className="font-mono font-bold text-slate-900">{dateValue}</span>
            </div>
            <div className="flex gap-2">
              <span className="font-bold text-slate-600 w-28">Señor(es):</span>
              <span className="font-bold text-slate-900">{buyerName}</span>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex gap-2">
              <span className="font-bold text-slate-600 w-28">NIT / CI Cliente:</span>
              <span className="font-mono font-bold text-emerald-800">{buyerCi}</span>
            </div>
            <div className="flex gap-2">
              <span className="font-bold text-slate-600 w-28">Lugar:</span>
              <span className="text-slate-700">La Paz - Bolivia</span>
            </div>
          </div>
        </div>

        {/* Itemized Table */}
        <div className="border border-slate-300 rounded-xl overflow-hidden mb-5">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2.5 px-3 w-16 text-center">Cant.</th>
                <th className="py-2.5 px-3">Descripción del Producto / Servicio</th>
                <th className="py-2.5 px-3 text-right w-28">P. Unitario (Bs.)</th>
                <th className="py-2.5 px-3 text-right w-28">Subtotal (Bs.)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono">
              {invoice.items && invoice.items.length > 0 ? (
                invoice.items.map((it, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                    <td className="py-2 px-3 text-center text-slate-700 font-bold">
                      {it.quantity || 1}
                    </td>
                    <td className="py-2 px-3 font-sans text-slate-800 font-medium">
                      {it.description}
                    </td>
                    <td className="py-2 px-3 text-right text-slate-600">
                      {it.unitPrice ? it.unitPrice.toFixed(2) : '-'}
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-slate-900">
                      {it.subtotal ? it.subtotal.toFixed(2) : '-'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="py-2 px-3 text-center text-slate-700 font-bold">1</td>
                  <td className="py-2 px-3 font-sans text-slate-800 font-medium">
                    Servicios y consumos autorizados según comprobante fiscal
                  </td>
                  <td className="py-2 px-3 text-right text-slate-600">{totalVal.toFixed(2)}</td>
                  <td className="py-2 px-3 text-right font-bold text-slate-900">{totalVal.toFixed(2)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Totals & Amount in Words */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start mb-6">
          <div className="sm:col-span-2 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Monto en Palabras
            </span>
            <p className="text-xs font-bold text-slate-800 uppercase font-mono leading-relaxed">
              {numberToSpanishWords(totalVal)}
            </p>
          </div>

          <div className="space-y-1.5 font-mono text-xs p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span>Bs. {totalVal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Descuento:</span>
              <span>Bs. 0.00</span>
            </div>
            <div className="flex justify-between font-black text-sm text-slate-900 border-t border-emerald-300 pt-1">
              <span>TOTAL:</span>
              <span className="text-emerald-800 font-extrabold">Bs. {totalVal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 pt-0.5">
              <span>Base Crédito Fiscal:</span>
              <span>Bs. {totalVal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* SIN Legal Footer & QR Code */}
        <div className="border-t-2 border-slate-900 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <SimpleQrSvg text={qrChain} />
            <div className="text-[10px] text-slate-500 font-mono space-y-1">
              <div>
                <span className="font-bold text-slate-700">CÓDIGO DE CONTROL: </span>
                <span className="font-bold text-slate-900">A1-B2-C3-D4</span>
              </div>
              <div>
                <span className="font-bold text-slate-700">FECHA LÍMITE DE EMISIÓN: </span>
                <span>31/12/2026</span>
              </div>
              <div className="max-w-xs text-[9px] text-slate-400 line-clamp-2">
                Cadena Fiscal SIN: {qrChain}
              </div>
            </div>
          </div>

          <div className="text-[10px] text-center sm:text-right text-slate-500 space-y-1 max-w-xs font-semibold leading-tight">
            <p className="uppercase text-slate-800">
              "ESTA FACTURA CONTRIBUYE AL DESARROLLO DEL PAÍS, EL USO ILÍCITO SERÁ SANCIONADO PENALMENTE DE ACUERDO A LEY"
            </p>
            <p className="text-[9px] text-slate-400">
              Ley N° 453: El proveedor debe brindar atención sin discriminación, con respeto y calidez.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
