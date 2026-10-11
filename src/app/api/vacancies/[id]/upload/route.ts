import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { storeAndParseCV } from '@/lib/storage';
import { ApplicationStatus } from '@prisma/client';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const vacancyId = params.id;
    const vacancy = await prisma.vacancy.findUnique({
      where: { id: vacancyId },
    });

    if (!vacancy) {
      return NextResponse.json({ error: 'Vacancy not found' }, { status: 404 });
    }

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided in request' }, { status: 400 });
    }

    const uploadResults = [];

    for (const file of files) {
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        uploadResults.push({
          fileName: file.name,
          success: false,
          error: 'Only PDF files are supported',
        });
        continue;
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // 1. Save to disk, extract text, and check language
      const stored = await storeAndParseCV(buffer, file.name);

      // 2. Infer candidate name from filename or first line
      const cleanName = file.name
        .replace(/\.pdf$/i, '')
        .replace(/[-_]/g, ' ')
        .replace(/cv|resume|curriculum/gi, '')
        .trim();
      const fallbackName = cleanName.length > 2 ? cleanName : 'Candidate';

      // 3. Find or create candidate
      let candidate = await prisma.candidate.findFirst({
        where: { fullName: fallbackName },
      });

      if (!candidate) {
        candidate = await prisma.candidate.create({
          data: {
            fullName: fallbackName,
          },
        });
      }

      // 4. Create or get CvDocument
      let cvDoc = await prisma.cvDocument.findUnique({
        where: { fileHash: stored.fileHash },
      });

      if (!cvDoc) {
        cvDoc = await prisma.cvDocument.create({
          data: {
            candidateId: candidate.id,
            fileName: stored.fileName,
            fileSize: stored.fileSize,
            fileHash: stored.fileHash,
            storagePath: stored.storagePath,
            extractedText: stored.extractedText,
            pageCount: stored.pageCount,
            detectedLanguage: stored.languageResult.language,
            isLanguageValid: stored.languageResult.isEnglish,
          },
        });
      }

      // 5. Create application if not exists
      let application = await prisma.application.findUnique({
        where: {
          vacancyId_candidateId: {
            vacancyId,
            candidateId: candidate.id,
          },
        },
      });

      if (!application) {
        application = await prisma.application.create({
          data: {
            vacancyId,
            candidateId: candidate.id,
            cvDocumentId: cvDoc.id,
            status: stored.languageResult.isEnglish
              ? ApplicationStatus.PENDING
              : ApplicationStatus.WRONG_LANGUAGE,
          },
        });

        // Add to JobQueue if valid language
        if (stored.languageResult.isEnglish) {
          await prisma.jobQueue.create({
            data: {
              applicationId: application.id,
              priority: 0,
            },
          });
        }
      }

      uploadResults.push({
        fileName: file.name,
        candidateName: candidate.fullName,
        applicationId: application.id,
        isLanguageValid: stored.languageResult.isEnglish,
        detectedLanguage: stored.languageResult.language,
        isDuplicate: stored.isDuplicate,
        success: true,
      });
    }

    return NextResponse.json({
      success: true,
      totalUploaded: uploadResults.length,
      results: uploadResults,
    });
  } catch (error: any) {
    console.error('[Upload API Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
