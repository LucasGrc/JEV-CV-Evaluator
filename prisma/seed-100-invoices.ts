import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Lista de proveedores y comercios bolivianos realistas
const MERCHANTS = [
  {
    name: 'HIPERMAXI S.A.',
    nit: '1020392019',
    auth: '4920192837',
    city: 'La Paz - Bolivia',
    address: 'Av. Costanera N° 1200, Calacoto',
    phone: '2790011',
    category: 'Supermercado',
    defaultItems: [
      { desc: 'Café tostado en grano 500g', price: 48.0 },
      { desc: 'Agua purificada 2.5L x 2', price: 24.0 },
      { desc: 'Galletas surtidas finas', price: 18.5 },
      { desc: 'Fruta fresca seleccionada', price: 32.0 },
      { desc: 'Té verde con menta x 20 sobres', price: 15.0 },
    ],
  },
  {
    name: 'HIPERMERCADOS KETAL S.A.',
    nit: '1028492023',
    auth: '4920019284',
    city: 'La Paz - Bolivia',
    address: 'Calle 15 de Calacoto N° 8028',
    phone: '2791000',
    category: 'Supermercado',
    defaultItems: [
      { desc: 'Servilletas premium x 250', price: 19.5 },
      { desc: 'Yogurt natural descremado 1L', price: 14.0 },
      { desc: 'Queso pasteurizado criollo 500g', price: 38.0 },
      { desc: 'Pan integral multicereales', price: 16.0 },
      { desc: 'Snacks secos y frutos secos 200g', price: 28.0 },
    ],
  },
  {
    name: 'FARMACIAS CHAVEZ S.R.L.',
    nit: '1029481029',
    auth: '2948192039',
    city: 'Santa Cruz - Bolivia',
    address: 'Av. Cristo Redentor N° 350',
    phone: '3429000',
    category: 'Farmacia',
    defaultItems: [
      { desc: 'Alcohol en gel antibacterial 500ml', price: 32.0 },
      { desc: 'Paracetamol 500mg x 20 comprimidos', price: 16.0 },
      { desc: 'Complejo Vitamínico B x 30 caps', price: 65.0 },
      { desc: 'Curitas adhesivas estériles x 40', price: 18.0 },
    ],
  },
  {
    name: 'FARMACORP S.A.',
    nit: '1028394857',
    auth: '3948271635',
    city: 'Cochabamba - Bolivia',
    address: 'Av. Ballivián N° 580',
    phone: '4259000',
    category: 'Farmacia',
    defaultItems: [
      { desc: 'Ibuprofeno 400mg x 10', price: 14.0 },
      { desc: 'Solución salina fisiológica 500ml', price: 22.0 },
      { desc: 'Protector solar FPS 50 120ml', price: 95.0 },
      { desc: 'Gasa esterilizada paquete x 10', price: 12.0 },
    ],
  },
  {
    name: 'TELECEL S.A. (TIGO BOLIVIA)',
    nit: '1020384729',
    auth: '5920192834',
    city: 'La Paz - Bolivia',
    address: 'Torre Tigo, Calacoto Calle 18',
    phone: '800174000',
    category: 'Telecomunicaciones',
    defaultItems: [
      { desc: 'Plan Pospago Corporativo Mensual Datos + Voz', price: 220.0 },
      { desc: 'Paquete Adicional Roaming Datos Sudamérica', price: 140.0 },
    ],
  },
  {
    name: 'ENTEL S.A.',
    nit: '1020473829',
    auth: '4928172634',
    city: 'La Paz - Bolivia',
    address: 'Calle Federico Zuazo N° 1671',
    phone: '800105000',
    category: 'Telecomunicaciones',
    defaultItems: [
      { desc: 'Servicio Fibra Óptica Empresarial Pyme', price: 350.0 },
      { desc: 'Línea Móvil Corporativa Bolsa de Minutos', price: 180.0 },
    ],
  },
  {
    name: 'BOLIVIANA DE AVIACION (BOA)',
    nit: '1548291028',
    auth: '6920192837',
    city: 'Cochabamba - Bolivia',
    address: 'Av. Melchor Pérez de Olguín N° 200',
    phone: '901105010',
    category: 'Transporte Aéreo',
    defaultItems: [
      { desc: 'Boleto Aéreo La Paz - Santa Cruz (Ida y Vuelta)', price: 890.0 },
      { desc: 'Tasa aeroportuaria nacional e impuestos', price: 82.0 },
    ],
  },
  {
    name: 'ALEXANDER COFFEE S.R.L.',
    nit: '1029482736',
    auth: '4928172635',
    city: 'La Paz - Bolivia',
    address: 'Av. 20 de Octubre N° 2463, Sopocachi',
    phone: '2432000',
    category: 'Restaurante',
    defaultItems: [
      { desc: 'Capuccino Grande Italiano x 2', price: 56.0 },
      { desc: 'Sándwich de lomo en pan ciabatta', price: 46.0 },
      { desc: 'Cheesecake de maracuyá porción', price: 32.0 },
      { desc: 'Jugo natural de naranja 400ml', price: 22.0 },
    ],
  },
  {
    name: 'POLLOS COPACABANA S.A.',
    nit: '1028392019',
    auth: '3928172635',
    city: 'La Paz - Bolivia',
    address: 'Plaza del Estudiante N° 1920',
    phone: '2332000',
    category: 'Restaurante',
    defaultItems: [
      { desc: 'Combo Cuarto Pierna con papas y gaseosa x 3', price: 114.0 },
      { desc: 'Porción extra de papas fritas Copacabana', price: 16.0 },
      { desc: 'Hamburguesa doble con queso', price: 34.0 },
    ],
  },
  {
    name: 'ESTACION DE SERVICIO YPFB CENTRAL',
    nit: '1020391028',
    auth: '2918273645',
    city: 'La Paz - Bolivia',
    address: 'Av. Montes N° 710',
    phone: '2281000',
    category: 'Combustible',
    defaultItems: [
      { desc: 'Gasolina Especial (Litros) x 40L', price: 149.6 },
    ],
  },
  {
    name: 'LIBRERIA E IMPRENTA OLACHEA',
    nit: '1029384728',
    auth: '4928172639',
    city: 'La Paz - Bolivia',
    address: 'Calle Loayza N° 250',
    phone: '2201000',
    category: 'Librería y Papelería',
    defaultItems: [
      { desc: 'Resma de papel bond Chambril A4 75g x 5', price: 210.0 },
      { desc: 'Archivadores de palanca lomo ancho x 6', price: 126.0 },
      { desc: 'Caja bolígrafos Bic cristal azul x 50', price: 45.0 },
      { desc: 'Marcadores para pizarra acrílica surtidos', price: 38.0 },
    ],
  },
  {
    name: 'HOTEL CAMINO REAL S.A.',
    nit: '1028472918',
    auth: '5928172635',
    city: 'La Paz - Bolivia',
    address: 'Calle 10 de Calacoto esq. Ballivián',
    phone: '2792323',
    category: 'Hotel',
    defaultItems: [
      { desc: 'Hospedaje Habitación Ejecutiva Superior 1 Noche', price: 780.0 },
      { desc: 'Consumo Restaurante La Tranquera Cena Ejecutiva', price: 195.0 },
    ],
  },
];

async function main() {
  console.log('🚀 Generando proceso de rendición con 100 facturas para demostración en tiempo real...');

  const employeeName = 'Lic. Carlos Morales Rodríguez';
  const employeeCi = '5129481 LP';
  const periodMonth = 'Noviembre';
  const periodYear = 2026;

  // 1. Crear o resetear el proceso
  let process = await prisma.invoiceProcess.findFirst({
    where: {
      employeeCi,
      periodMonth,
      periodYear,
    },
    include: { invoices: true },
  });

  if (process) {
    console.log(`Eliminando facturas anteriores del proceso existente ID: ${process.id}...`);
    await prisma.invoiceEvaluation.deleteMany({
      where: { invoice: { processId: process.id } },
    });
    await prisma.invoiceDocument.deleteMany({
      where: { processId: process.id },
    });
  } else {
    process = await prisma.invoiceProcess.create({
      data: {
        title: 'Rendición de Gastos Operativos y Viajes (100 Facturas) - Carlos Morales',
        description:
          'Proceso de auditoría masiva con 100 facturas mensuales para demostración de procesamiento en tiempo real con TypeSafe AI (JEV).',
        periodMonth,
        periodYear,
        employeeName,
        employeeCi,
        department: 'Finanzas & Tesorería',
        maxAmountThreshold: 10000.0,
        mathTolerance: 0.1,
        suspiciousConcepts:
          'Compra o instalación de ascensores, elevadores, maquinaria pesada, obras civiles de construcción a granel o activos industriales.',
        requireStrictCiMatch: true,
        status: 'ACTIVE',
      },
      include: { invoices: true },
    });
    console.log(`✓ Creado nuevo proceso: ${process.title}`);
  }

  // 2. Generar 100 facturas
  // Casos especiales distribuidos estratégicamente para que se observen en tiempo real:
  // - Facturas con monto > 10.000 Bs (Revisión manual)
  const HIGH_AMOUNT_INDICES = [18, 37, 59, 74, 86, 92, 98];
  // - Facturas con conceptos sospechosos (Revisión manual)
  const SUSPICIOUS_INDICES = [12, 29, 44, 63, 81, 95];
  // - Facturas con inconsistencia matemática (Rechazadas)
  const MATH_ERROR_INDICES = [21, 49, 68, 89];
  // - Facturas con CI/Nombre que no coincide (Rechazadas)
  const CI_MISMATCH_INDICES = [15, 33, 54, 78];

  const totalInvoices = 100;
  console.log(`Creando ${totalInvoices} facturas pendientes...`);

  for (let i = 1; i <= totalInvoices; i++) {
    const merchant = MERCHANTS[(i - 1) % MERCHANTS.length];
    const invoiceNumber = `${10000 + i * 37}`;
    const day = (i % 28) + 1;
    const dateFormatted = `${day < 10 ? '0' + day : day}/11/2026`;
    const fileName = `factura_${String(i).padStart(3, '0')}_${merchant.name.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 15)}.pdf`;

    let buyerName = employeeName;
    let buyerCi = employeeCi;
    let items: Array<{ description: string; quantity: number; unitPrice: number; subtotal: number }> = [];
    let totalAmount = 0;

    if (SUSPICIOUS_INDICES.includes(i)) {
      // Concepto atípico (ej. ascensor, retroexcavadora)
      if (i === 12) {
        items = [
          {
            description: 'Adquisición e instalación de ascensor electromecánico para edificio de 6 paradas',
            quantity: 1,
            unitPrice: 48500.0,
            subtotal: 48500.0,
          },
        ];
        totalAmount = 48500.0;
      } else if (i === 29) {
        items = [
          {
            description: 'Alquiler de retroexcavadora Caterpillar 320D con operador (80 horas)',
            quantity: 1,
            unitPrice: 8500.0,
            subtotal: 8500.0,
          },
        ];
        totalAmount = 8500.0;
      } else if (i === 44) {
        items = [
          {
            description: '150 bolsas de cemento asfáltico y aditivo para obra civil pesada',
            quantity: 150,
            unitPrice: 55.0,
            subtotal: 8250.0,
          },
        ];
        totalAmount = 8250.0;
      } else if (i === 63) {
        items = [
          {
            description: 'Torno mecánico industrial de precisión y prensa hidráulica 20T',
            quantity: 1,
            unitPrice: 9800.0,
            subtotal: 9800.0,
          },
        ];
        totalAmount = 9800.0;
      } else if (i === 81) {
        items = [
          {
            description: 'Mantenimiento preventivo mayor y cambio de cables de ascensor de carga',
            quantity: 1,
            unitPrice: 7400.0,
            subtotal: 7400.0,
          },
        ];
        totalAmount = 7400.0;
      } else {
        items = [
          {
            description: 'Montacargas industrial a combustión 2.5 toneladas para planta fabril',
            quantity: 1,
            unitPrice: 9900.0,
            subtotal: 9900.0,
          },
        ];
        totalAmount = 9900.0;
      }
    } else if (HIGH_AMOUNT_INDICES.includes(i)) {
      // Monto > 10.000 Bs legítimo pero requiere revisión manual
      const basePrice = 11000 + (i * 240);
      items = [
        {
          description: `Servicios de consultoría y auditoría financiera externa especializada`,
          quantity: 1,
          unitPrice: basePrice,
          subtotal: basePrice,
        },
      ];
      totalAmount = basePrice;
    } else if (MATH_ERROR_INDICES.includes(i)) {
      // Inconsistencia matemática
      items = [
        { description: 'Consumo almuerzo ejecutivo de trabajo', quantity: 2, unitPrice: 85.0, subtotal: 170.0 },
        { description: 'Bebidas naturales y postre', quantity: 2, unitPrice: 20.0, subtotal: 40.0 },
      ];
      // Suma da 210, pero se declara 360 (descuadre de 150 Bs)
      totalAmount = 360.0;
    } else if (CI_MISMATCH_INDICES.includes(i)) {
      // Emitida a otra persona o empresa
      if (i === 15) {
        buyerName = 'Mariana Flores Toledo';
        buyerCi = '3381920 CB';
      } else if (i === 33) {
        buyerName = 'Constructora El Roble S.R.L.';
        buyerCi = '1029384756';
      } else if (i === 54) {
        buyerName = 'Gonzalo Mamani Quispe';
        buyerCi = '4920194 LP';
      } else {
        buyerName = 'Importadora Los Andes Ltda.';
        buyerCi = '3928172635';
      }
      items = [
        { description: 'Combustible y lubricantes para vehículo utilitario', quantity: 1, unitPrice: 280.0, subtotal: 280.0 },
      ];
      totalAmount = 280.0;
    } else {
      // Factura habitual normal (Aprobada)
      // Generar entre 2 y 4 ítems de la lista del comercio
      const numItems = (i % 3) + 2;
      let calculated = 0;
      items = merchant.defaultItems.slice(0, numItems).map((it, idx) => {
        const qty = ((i + idx) % 3) + 1;
        const sub = Math.round(it.price * qty * 100) / 100;
        calculated += sub;
        return {
          description: it.desc,
          quantity: qty,
          unitPrice: it.price,
          subtotal: sub,
        };
      });
      totalAmount = Math.round(calculated * 100) / 100;
    }

    // Texto representativo tipo factura boliviana con cadena QR
    const qrString = `${merchant.nit}|${invoiceNumber}|${merchant.auth}|${dateFormatted}|${totalAmount.toFixed(2)}|${totalAmount.toFixed(2)}|A${i}-B${i}-C${i}|${buyerCi}`;
    const extractedText = `${merchant.name}
CASA MATRIZ: ${merchant.address}
TEL: ${merchant.phone} - ${merchant.city}
NIT: ${merchant.nit}
FACTURA N°: ${invoiceNumber}
AUTORIZACIÓN: ${merchant.auth}
FECHA: ${dateFormatted}
SEÑOR(ES): ${buyerName}
NIT/CI: ${buyerCi}
------------------------------------------------------------
DETALLE:
${items.map((it) => `${it.quantity} x ${it.description} | P.U: ${it.unitPrice.toFixed(2)} | Subtotal: ${it.subtotal.toFixed(2)}`).join('\n')}
------------------------------------------------------------
TOTAL BS: ${totalAmount.toFixed(2)}
CÓDIGO DE CONTROL: A${i}-B${i}-C${i}-D${i}
CADENA QR SIN: ${qrString}
ESTA FACTURA CONTRIBUYE AL DESARROLLO DEL PAÍS.`;

    const hash = crypto.createHash('sha256').update(fileName + totalAmount + i).digest('hex');

    await prisma.invoiceDocument.create({
      data: {
        processId: process.id,
        fileName,
        fileSize: 1024 * (30 + (i % 40)),
        fileHash: hash,
        storagePath: `storage/invoices/${hash}.pdf`,
        mimeType: 'application/pdf',
        buyerName,
        buyerCi,
        invoiceNumber,
        invoiceDate: dateFormatted,
        totalAmount,
        currency: 'BOB',
        items: items as any,
        extractedText,
        status: 'PENDING', // ¡Todas PENDIENTES para la demostración en vivo!
      },
    });

    if (i % 20 === 0 || i === totalInvoices) {
      console.log(`✓ Creadas ${i} / ${totalInvoices} facturas pendientes.`);
    }
  }

  console.log('🎉 100 facturas creadas exitosamente con estado PENDING.');
  console.log(`Proceso ID: ${process.id}`);
}

main()
  .catch((e) => {
    console.error('Error generando 100 facturas:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
