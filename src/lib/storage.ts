import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { extractText } from 'unpdf';
import pdfParse from 'pdf-parse';
import { detectLanguage, LanguageDetectionResult } from '@/lib/languageDetector';

const STORAGE_DIR = process.env.STORAGE_DIR || path.join(process.cwd(), 'storage', 'cvs');

export interface StoredCVResult {
  fileHash: string;
  fileName: string;
  fileSize: number;
  storagePath: string;
  extractedText: string;
  pageCount: number;
  languageResult: LanguageDetectionResult;
  isDuplicate: boolean;
}

/**
 * Ensures the target storage directory exists.
 */
export async function ensureStorageDir(): Promise<string> {
  await fs.mkdir(STORAGE_DIR, { recursive: true });
  return STORAGE_DIR;
}

/**
 * Saves a PDF buffer to local disk with SHA-256 content addressing,
 * extracts raw text, counts pages, and tests language policy.
 */
export async function storeAndParseCV(
  fileBuffer: Buffer,
  originalFileName: string
): Promise<StoredCVResult> {
  await ensureStorageDir();

  // 1. Calculate SHA-256 hash for deduplication and tamper-proofing
  const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
  const targetPath = path.join(STORAGE_DIR, `${fileHash}.pdf`);

  // 2. Check if file already exists in disk storage
  let isDuplicate = false;
  try {
    await fs.access(targetPath);
    isDuplicate = true;
  } catch {
    // Write new file
    await fs.writeFile(targetPath, fileBuffer);
  }

  // 3. Extract text and page count via unpdf (fallback to pdf-parse)
  let extractedText = '';
  let pageCount = 1;

  try {
    const unpdfResult = await extractText(new Uint8Array(fileBuffer));
    extractedText = Array.isArray(unpdfResult.text)
      ? unpdfResult.text.join('\n').trim()
      : (unpdfResult.text || '').trim();
    pageCount = unpdfResult.totalPages || 1;
  } catch (unpdfErr: any) {
    try {
      const parsed = await pdfParse(fileBuffer);
      extractedText = parsed.text ? parsed.text.trim() : '';
      pageCount = parsed.numpages || 1;
    } catch (fallbackErr: any) {
      console.warn(`[storage] pdf extraction fallback for ${originalFileName}:`, fallbackErr.message);
      const raw = fileBuffer.toString('latin1');
      const chunks = raw.match(/[A-Za-z0-9\s.,;:'"@/()\-]{4,}/g) || [];
      extractedText = chunks.join(' ').replace(/\s+/g, ' ').trim();
    }
  }

  // 4. Verify language policy (English required for JEV)
  const languageResult = await detectLanguage(extractedText);

  return {
    fileHash,
    fileName: originalFileName,
    fileSize: fileBuffer.length,
    storagePath: targetPath,
    extractedText,
    pageCount,
    languageResult,
    isDuplicate,
  };
}

/**
 * Reads a stored CV file buffer by hash.
 */
export async function getCVFileBuffer(fileHash: string): Promise<Buffer> {
  const filePath = path.join(STORAGE_DIR, `${fileHash}.pdf`);
  return fs.readFile(filePath);
}
