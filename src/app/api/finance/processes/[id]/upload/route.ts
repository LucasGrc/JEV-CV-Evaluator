import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { prisma } from '@/lib/prisma';
import { extractText } from 'unpdf';
import { parseInvoiceText } from '@/lib/invoiceParser';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const processId = params.id;
    const processRecord = await prisma.invoiceProcess.findUnique({
      where: { id: processId },
    });

    if (!processRecord) {
      return NextResponse.json(
        { error: 'Proceso de facturas no encontrado' },
        { status: 404 }
      );
    }

    if (processRecord.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'El proceso está cerrado o pausado. No se permiten nuevas cargas.' },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No se enviaron archivos' },
        { status: 400 }
      );
    }

    const storageDir = path.join(process.cwd(), 'storage', 'invoices');
    await fs.mkdir(storageDir, { recursive: true });

    let totalUploaded = 0;
    const createdInvoices = [];

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const hash = crypto.createHash('sha256').update(buffer).digest('hex');
      const ext = path.extname(file.name).toLowerCase() || '.pdf';
      const storagePath = path.join(storageDir, `${hash}${ext}`);

      // Guardar archivo en disco
      await fs.writeFile(storagePath, buffer);

      // Extracción de texto
      let extractedText = '';
      if (ext === '.pdf') {
        try {
          const { text } = await extractText(new Uint8Array(buffer));
          extractedText = Array.isArray(text) ? text.join('\n') : (text || '');
        } catch (pdfErr) {
          console.warn(`Error extrayendo texto del PDF ${file.name}:`, pdfErr);
        }
      }

      // Si el texto está vacío (ej: foto JPG/PNG o PDF escaneado), buscar si vino texto auxiliar o usar fallback
      if (!extractedText.trim()) {
        extractedText = `Factura Escaneada / Imagen: ${file.name}\nArchivo: ${file.name}\nTamaño: ${(file.size / 1024).toFixed(1)} KB`;
      }

      // Parsear datos de la factura
      const parsed = parseInvoiceText(extractedText);

      // Crear o actualizar documento en el proceso
      const invoiceDoc = await prisma.invoiceDocument.create({
        data: {
          processId,
          fileName: file.name,
          fileSize: file.size,
          fileHash: hash,
          storagePath: `storage/invoices/${hash}${ext}`,
          mimeType: file.type || (ext === '.pdf' ? 'application/pdf' : 'image/jpeg'),
          buyerName: parsed.buyerName,
          buyerCi: parsed.buyerCi,
          invoiceNumber: parsed.invoiceNumber,
          invoiceDate: parsed.invoiceDate,
          totalAmount: parsed.totalAmount,
          currency: parsed.currency || 'BOB',
          items: parsed.items && parsed.items.length > 0 ? (parsed.items as any) : null,
          extractedText,
          status: 'PENDING',
        },
      });

      totalUploaded++;
      createdInvoices.push(invoiceDoc);
    }

    return NextResponse.json({
      success: true,
      totalUploaded,
      invoices: createdInvoices,
    });
  } catch (error: any) {
    console.error('Error uploading invoices:', error);
    return NextResponse.json(
      { error: error.message || 'Error al procesar la carga de facturas' },
      { status: 500 }
    );
  }
}
