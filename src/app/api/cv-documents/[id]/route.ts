import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs/promises';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const document = await prisma.cvDocument.findUnique({
      where: { id: params.id },
      include: {
        candidate: true,
      },
    });

    if (!document) {
      return NextResponse.json({ error: 'CV Document not found' }, { status: 404 });
    }

    // Check if query is asking for binary file download/view
    const url = new URL(request.url);
    const download = url.searchParams.get('download') === 'true';

    try {
      const fileBuffer = await fs.readFile(document.storagePath);
      const headers = new Headers();
      headers.set('Content-Type', document.mimeType || 'application/pdf');
      headers.set('Content-Length', fileBuffer.length.toString());
      if (download) {
        headers.set('Content-Disposition', `attachment; filename="${document.fileName}"`);
      } else {
        headers.set('Content-Disposition', `inline; filename="${document.fileName}"`);
      }

      return new NextResponse(fileBuffer, { status: 200, headers });
    } catch {
      // If file not on disk, return JSON metadata and extracted text
      return NextResponse.json({
        id: document.id,
        fileName: document.fileName,
        candidateName: document.candidate.fullName,
        extractedText: document.extractedText,
        pageCount: document.pageCount,
        detectedLanguage: document.detectedLanguage,
        isLanguageValid: document.isLanguageValid,
      });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
