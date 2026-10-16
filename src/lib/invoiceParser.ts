/**
 * Extractor y analizador de facturas para Bolivia y Latinoamérica.
 * Extrae comprador (Nombre, CI/NIT), montos, fechas, desglose de ítems
 * y valida códigos QR estándar del Servicio de Impuestos Nacionales (SIN).
 */

export interface ParsedInvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface ParsedInvoiceData {
  buyerName: string | null;
  buyerCi: string | null;
  invoiceNumber: string | null;
  invoiceDate: string | null;
  totalAmount: number | null;
  currency: string;
  items: ParsedInvoiceItem[];
  sinQrDetected: boolean;
  rawText: string;
}

/**
 * Intenta parsear la cadena fiscal oficial del QR de Bolivia:
 * Formato: NIT_Emisor|Nro_Factura|Nro_Autorizacion|Fecha|Total|Total_Base|Codigo_Control|CI_Comprador|...
 */
function tryParseBoliviaSinQr(text: string): Partial<ParsedInvoiceData> | null {
  // Buscar cadena con al menos 7 pipes
  const qrMatch = text.match(/(\d{6,15})\|(\d+)\|([A-Z0-9\-]+)\|(\d{2}\/\d{2}\/\d{4}|\d{4}-\d{2}-\d{2})\|([\d\.,]+)\|([\d\.,]+)\|([A-Z0-9\-]+)\|([A-Z0-9\-]+)/i);
  
  if (qrMatch) {
    const [, , invoiceNumber, , invoiceDate, totalStr, , , buyerCi] = qrMatch;
    const cleanTotal = parseFloat(totalStr.replace(',', '.'));
    return {
      invoiceNumber: invoiceNumber.trim(),
      invoiceDate: invoiceDate.trim(),
      totalAmount: isNaN(cleanTotal) ? null : cleanTotal,
      buyerCi: buyerCi.trim(),
      sinQrDetected: true,
    };
  }
  return null;
}

export function parseInvoiceText(text: string): ParsedInvoiceData {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  // Intentar QR fiscal primero
  const qrData = tryParseBoliviaSinQr(text);

  let buyerName: string | null = null;
  let buyerCi: string | null = qrData?.buyerCi || null;
  let invoiceNumber: string | null = qrData?.invoiceNumber || null;
  let invoiceDate: string | null = qrData?.invoiceDate || null;
  let totalAmount: number | null = qrData?.totalAmount || null;
  const currency: string = 'BOB';
  const items: ParsedInvoiceItem[] = [];

  // Expresiones regulares para campos clave
  const namePatterns = [
    /(?:se[ñn]or(?:\(es\))?|cliente|raz[oó]n social|a nombre de|comprador|nombre)\s*[:\-]?\s*([^\n\r\|;]{3,60})/i,
    /nombre\s*\/\s*raz[oó]n social\s*[:\-]?\s*([^\n\r\|;]{3,60})/i,
  ];

  const ciPatterns = [
    /(?:ci|c\.i\.|nit|c[eé]dula|cédula de identidad|doc\.?|identificaci[oó]n)\s*(?:del comprador|cliente)?\s*[:\-]?\s*([0-9]{5,12}(?:\s*[A-Z]{2})?)/i,
    /(?:nit\s*\/\s*ci)\s*[:\-]?\s*([0-9]{5,12}(?:\s*[A-Z]{2})?)/i,
  ];

  const invoiceNumPatterns = [
    /(?:factura|n[uú]mero|nro\.?|factura nro\.?|n[o°]\.?)\s*[:\-]?\s*#?\s*([0-9]{1,12})/i,
  ];

  const datePatterns = [
    /(?:fecha|fecha de emisi[oó]n)\s*[:\-]?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
    /(\d{2}\/\d{2}\/\d{4})/,
  ];

  const totalPatterns = [
    /(?:total a pagar|total bs\.?|importe total|total general|total)\s*[:\-]?\s*(?:bs\.?|bob)?\s*([\d\.,]+)/i,
    /(?:bs\.?|bob)\s*([\d\.,]+)\s*$/i,
  ];

  for (const line of lines) {
    // Buscar Nombre si no se tiene
    if (!buyerName) {
      for (const pat of namePatterns) {
        const m = line.match(pat);
        if (m && m[1]) {
          const cand = m[1].trim().replace(/^(sr|sra|dr|ing)\.?\s+/i, '');
          if (cand.length > 2 && !cand.toLowerCase().includes('factura') && !cand.toLowerCase().includes('nit')) {
            buyerName = cand;
            break;
          }
        }
      }
    }

    // Buscar CI si no se tiene
    if (!buyerCi) {
      for (const pat of ciPatterns) {
        const m = line.match(pat);
        if (m && m[1]) {
          buyerCi = m[1].trim();
          break;
        }
      }
    }

    // Buscar Nro Factura si no se tiene
    if (!invoiceNumber) {
      for (const pat of invoiceNumPatterns) {
        const m = line.match(pat);
        if (m && m[1]) {
          invoiceNumber = m[1].trim();
          break;
        }
      }
    }

    // Buscar Fecha si no se tiene
    if (!invoiceDate) {
      for (const pat of datePatterns) {
        const m = line.match(pat);
        if (m && m[1]) {
          invoiceDate = m[1].trim();
          break;
        }
      }
    }

    // Buscar Total si no se tiene
    if (totalAmount === null) {
      for (const pat of totalPatterns) {
        const m = line.match(pat);
        if (m && m[1]) {
          const val = parseFloat(m[1].replace(',', '.'));
          if (!isNaN(val) && val > 0) {
            totalAmount = val;
            break;
          }
        }
      }
    }
  }

  // Detección de ítems de compra
  // Líneas como: "2  Hamburguesa Clásica  45.00  90.00" o "1 x Servicio de mantenimiento 350.00"
  const itemLinePattern = /^(\d+)?\s*(?:x\s*)?([A-Za-zÁÉÍÓÚáéíóúñÑ0-9\s\.\-_,\/]{3,60})\s+([\d\.,]+)\s+([\d\.,]+)$/;
  const fallbackItemPattern = /([A-Za-zÁÉÍÓÚáéíóúñÑ\s\.\-_]{3,40})\s+(?:bs\.?|bob)?\s*([\d\.,]+)$/i;

  for (const line of lines) {
    if (line.toLowerCase().includes('total') || line.toLowerCase().includes('subtotal') || line.toLowerCase().includes('nit')) {
      continue;
    }

    const match4 = line.match(itemLinePattern);
    if (match4) {
      const qty = parseInt(match4[1] || '1', 10);
      const desc = match4[2].trim();
      const unitPrice = parseFloat(match4[3].replace(',', '.'));
      const subtotal = parseFloat(match4[4].replace(',', '.'));

      if (!isNaN(subtotal) && subtotal > 0 && desc.length > 2) {
        items.push({
          description: desc,
          quantity: isNaN(qty) ? 1 : qty,
          unitPrice: isNaN(unitPrice) ? subtotal : unitPrice,
          subtotal,
        });
      }
      continue;
    }

    const matchFallback = line.match(fallbackItemPattern);
    if (matchFallback && items.length < 20) {
      const desc = matchFallback[1].trim();
      const subtotal = parseFloat(matchFallback[2].replace(',', '.'));
      if (!isNaN(subtotal) && subtotal > 0 && desc.length > 3 && !desc.toLowerCase().includes('cambio') && !desc.toLowerCase().includes('efectivo')) {
        items.push({
          description: desc,
          quantity: 1,
          unitPrice: subtotal,
          subtotal,
        });
      }
    }
  }

  return {
    buyerName,
    buyerCi,
    invoiceNumber,
    invoiceDate,
    totalAmount,
    currency,
    items,
    sinQrDetected: !!qrData?.sinQrDetected,
    rawText: text,
  };
}
