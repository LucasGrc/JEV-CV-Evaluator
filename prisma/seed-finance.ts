import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Finance Invoice Auditor POC...');

  // Crear o buscar proceso de facturas
  let process = await prisma.invoiceProcess.findFirst({
    where: {
      employeeCi: '4892182 LP',
      periodMonth: 'Octubre',
      periodYear: 2026,
    },
  });

  if (!process) {
    process = await prisma.invoiceProcess.create({
      data: {
        title: 'Descargo de Facturas - Octubre 2026 (Juan Pérez)',
        description:
          'Proceso de rendición mensual de facturas de gastos para crédito fiscal (RC-IVA / Formulario 110).',
        periodMonth: 'Octubre',
        periodYear: 2026,
        employeeName: 'Juan Pérez',
        employeeCi: '4892182 LP',
        department: 'Ingeniería & Operaciones',
        maxAmountThreshold: 10000.0,
        mathTolerance: 0.1,
        suspiciousConcepts:
          'Compra o instalación de ascensores, elevadores, maquinaria pesada, obras civiles de construcción a granel o activos industriales.',
        requireStrictCiMatch: true,
        status: 'ACTIVE',
      },
    });
    console.log(`✓ Creado proceso: ${process.title}`);
  }

  // Sample Invoices
  const sampleInvoices = [
    {
      fileName: 'factura_001_supermercado_ketal.pdf',
      buyerName: 'Juan Pérez',
      buyerCi: '4892182 LP',
      invoiceNumber: '48291',
      invoiceDate: '04/10/2026',
      totalAmount: 285.5,
      items: [
        { description: 'Café soluble 200g', quantity: 2, unitPrice: 42.0, subtotal: 84.0 },
        { description: 'Galletas de agua surtidas', quantity: 4, unitPrice: 12.5, subtotal: 50.0 },
        { description: 'Leche entera UHT 1L', quantity: 6, unitPrice: 7.0, subtotal: 42.0 },
        { description: 'Servilletas de papel 200u', quantity: 3, unitPrice: 15.0, subtotal: 45.0 },
        { description: 'Agua mineral 2.5L', quantity: 5, unitPrice: 12.9, subtotal: 64.5 },
      ],
      extractedText: `HIPERMERCADOS KETAL S.A.
NIT: 1028492023
FACTURA N°: 48291
AUTORIZACIÓN: 4920019284
FECHA: 04/10/2026
SEÑOR(ES): Juan Pérez
NIT/CI: 4892182 LP
DETALLE:
2 x Café soluble 200g 42.00 84.00
4 x Galletas de agua surtidas 12.50 50.00
6 x Leche entera UHT 1L 7.00 42.00
3 x Servilletas de papel 200u 15.00 45.00
5 x Agua mineral 2.5L 12.90 64.50
TOTAL BS: 285.50
1028492023|48291|4920019284|04/10/2026|285.50|285.50|A1-B2-C3-D4|4892182 LP`,
      verdict: 'APPROVED' as const,
      identityMatch: true,
      mathConsistent: true,
      amountAlert: false,
      suspiciousConceptAlert: false,
      suspiciousDetails: null,
      reasons: ['Todos los requisitos e importes cumplen con la normativa.'],
      jevReasoning:
        'Factura validada correctamente. El comprador coincide con el empleado (Juan Pérez, CI: 4892182 LP), la suma de los 5 ítems es matemáticamente exacta (285.50 Bs), el monto es habitual para consumo personal y no supera el umbral límite de 10.000 Bs.',
    },
    {
      fileName: 'factura_002_farmacia_chavez.pdf',
      buyerName: 'Juan Pérez',
      buyerCi: '4892182',
      invoiceNumber: '119283',
      invoiceDate: '09/10/2026',
      totalAmount: 65.0,
      items: [
        { description: 'Paracetamol 500mg x 20 comp', quantity: 2, unitPrice: 15.0, subtotal: 30.0 },
        { description: 'Alcohol en gel 500ml antiséptico', quantity: 1, unitPrice: 35.0, subtotal: 35.0 },
      ],
      extractedText: `FARMACIAS CHAVEZ S.R.L.
NIT: 1029481029
FACTURA N°: 119283
AUTORIZACIÓN: 2948192039
FECHA: 09/10/2026
CLIENTE: Juan Pérez
CI/NIT: 4892182
2 x Paracetamol 500mg x 20 comp 15.00 30.00
1 x Alcohol en gel 500ml antiséptico 35.00 35.00
TOTAL BS: 65.00`,
      verdict: 'APPROVED' as const,
      identityMatch: true,
      mathConsistent: true,
      amountAlert: false,
      suspiciousConceptAlert: false,
      suspiciousDetails: null,
      reasons: ['Factura en regla. Coincidencia de identidad y suma correcta.'],
      jevReasoning:
        'Factura aprobada automáticamente. Gastos de botiquín personal coherentes, comprador verificado y suma exacta.',
    },
    {
      fileName: 'factura_003_elevadores_schindler.pdf',
      buyerName: 'Juan Pérez',
      buyerCi: '4892182 LP',
      invoiceNumber: '8910',
      invoiceDate: '11/10/2026',
      totalAmount: 68500.0,
      items: [
        {
          description: 'Adquisición e instalación de ascensor electromecánico 8 personas para edificio comercial',
          quantity: 1,
          unitPrice: 68500.0,
          subtotal: 68500.0,
        },
      ],
      extractedText: `ELEVADORES & ASCENSORES ANDINA S.A.
NIT: 391829021
FACTURA N°: 8910
AUTORIZACIÓN: 5910293819
FECHA: 11/10/2026
SEÑOR(ES): Juan Pérez
NIT/CI: 4892182 LP
1 x Adquisición e instalación de ascensor electromecánico 8 personas para edificio comercial 68500.00 68500.00
TOTAL BS: 68500.00`,
      verdict: 'MANUAL_REVIEW' as const,
      identityMatch: true,
      mathConsistent: true,
      amountAlert: true,
      suspiciousConceptAlert: true,
      suspiciousDetails:
        'Detección de concepto atípico: "ASCENSOR" (adquisición de infraestructura o activo corporativo no admisible para descargo personal de empleado).',
      reasons: [
        'Monto elevado (68,500.00 Bs supera el umbral límite de 10,000.00 Bs).',
        'Concepto atípico: Compra o instalación de ascensor electromecánico para edificio (activo comercial/industrial).',
      ],
      jevReasoning:
        'Factura marcada para REVISIÓN MANUAL por el equipo de finanzas. Aunque la cédula coincide, el monto (68.500 Bs) excede por mucho el límite personal y TypeSafe JEV identificó que la compra de un ascensor corresponde a un activo de infraestructura no admisible como descargo ordinario de un empleado.',
    },
    {
      fileName: 'factura_004_libreria_papeleria.pdf',
      buyerName: 'Juan Pérez',
      buyerCi: '4892182 LP',
      invoiceNumber: '2910',
      invoiceDate: '12/10/2026',
      totalAmount: 450.0,
      items: [
        { description: 'Resmas de papel bond A4 75g', quantity: 3, unitPrice: 40.0, subtotal: 120.0 },
        { description: 'Archivadores de palanca oficio', quantity: 4, unitPrice: 20.0, subtotal: 80.0 },
        { description: 'Caja de bolígrafos tinta gel', quantity: 1, unitPrice: 50.0, subtotal: 50.0 },
      ],
      extractedText: `LIBRERIA E IMPRENTA EL ESTUDIANTE
NIT: 2019284019
FACTURA N°: 2910
FECHA: 12/10/2026
CLIENTE: Juan Pérez
CI/NIT: 4892182 LP
3 x Resmas de papel bond A4 75g 40.00 120.00
4 x Archivadores de palanca oficio 20.00 80.00
1 x Caja de bolígrafos tinta gel 50.00 50.00
TOTAL BS: 450.00`,
      verdict: 'REJECTED' as const,
      identityMatch: true,
      mathConsistent: false,
      amountAlert: false,
      suspiciousConceptAlert: false,
      suspiciousDetails: null,
      reasons: [
        'Inconsistencia matemática: la suma de los 3 ítems da 250.00 Bs, pero el total declarado en la factura figura como 450.00 Bs (diferencia de 200.00 Bs).',
      ],
      jevReasoning:
        'Factura RECHAZADA por inconsistencia aritmética grave en el desglose de ítems. Los productos suman 250 Bs pero la factura cobra 450 Bs. Requiere corrección tributaria o rectificación del proveedor.',
    },
    {
      fileName: 'factura_005_combustible_ypfb.pdf',
      buyerName: 'Carlos Alberto Rodríguez M.',
      buyerCi: '3391029 SC',
      invoiceNumber: '99218',
      invoiceDate: '14/10/2026',
      totalAmount: 299.2,
      items: [
        { description: 'Gasolina Especial (Litros)', quantity: 80, unitPrice: 3.74, subtotal: 299.2 },
      ],
      extractedText: `ESTACION DE SERVICIO YPFB CENTRAL
NIT: 1020391028
FACTURA N°: 99218
FECHA: 14/10/2026
SEÑOR(ES): Carlos Alberto Rodríguez M.
NIT/CI: 3391029 SC
80 x Gasolina Especial (Litros) 3.74 299.20
TOTAL BS: 299.20`,
      verdict: 'REJECTED' as const,
      identityMatch: false,
      mathConsistent: true,
      amountAlert: false,
      suspiciousConceptAlert: false,
      suspiciousDetails: null,
      reasons: [
        'Cédula/NIT no coincide: La factura indica CI 3391029 SC a nombre de Carlos Alberto Rodríguez M., pero el empleado titular del descargo es Juan Pérez (CI: 4892182 LP).',
      ],
      jevReasoning:
        'Factura RECHAZADA por falta de correspondencia de identidad. El comprobante fiscal está emitido a nombre de una persona completamente diferente (Carlos Alberto Rodríguez M.), violando la normativa de descargo personal.',
    },
  ];

  for (const inv of sampleInvoices) {
    const hash = crypto.createHash('sha256').update(inv.fileName + inv.totalAmount).digest('hex');

    const invoiceDoc = await prisma.invoiceDocument.create({
      data: {
        processId: process.id,
        fileName: inv.fileName,
        fileSize: 1024 * 45,
        fileHash: hash,
        storagePath: `storage/invoices/${hash}.pdf`,
        mimeType: 'application/pdf',
        buyerName: inv.buyerName,
        buyerCi: inv.buyerCi,
        invoiceNumber: inv.invoiceNumber,
        invoiceDate: inv.invoiceDate,
        totalAmount: inv.totalAmount,
        currency: 'BOB',
        items: inv.items as any,
        extractedText: inv.extractedText,
        status: 'EVALUATED',
        evaluation: {
          create: {
            verdict: inv.verdict,
            identityMatch: inv.identityMatch,
            identityMatchScore: inv.identityMatch ? 1.0 : 0.0,
            mathConsistent: inv.mathConsistent,
            calculatedSum: inv.items.reduce((acc, i) => acc + i.subtotal, 0),
            declaredTotal: inv.totalAmount,
            sumDifference: Math.abs(inv.items.reduce((acc, i) => acc + i.subtotal, 0) - inv.totalAmount),
            amountAlert: inv.amountAlert,
            suspiciousConceptAlert: inv.suspiciousConceptAlert,
            suspiciousDetails: inv.suspiciousDetails,
            reasons: inv.reasons,
            jevReasoning: inv.jevReasoning,
            confidence: 0.96,
            inputTokens: 820,
            costUsd: (820 * 0.042) / 1_000_000,
            processingTimeMs: 140,
          },
        },
      },
    });

    console.log(`✓ Factura creada & evaluada: ${inv.fileName} → [${inv.verdict}]`);
  }

  console.log('🎉 Seed de Finanzas completado con éxito.');
}

main()
  .catch((e) => {
    console.error('Error seeding finance:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
