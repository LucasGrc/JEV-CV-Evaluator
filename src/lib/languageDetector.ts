/**
 * Language Detector for CV Evaluation
 * Enforces English language requirement before submitting to JEV.
 * Saves tokens and provides clean categorization for non-English CVs.
 */

export interface LanguageDetectionResult {
  language: string; // ISO 639-3 code: 'eng', 'spa', 'fra', 'deu', etc.
  isEnglish: boolean;
  confidence: number;
  reason?: string;
}

// Common English stopwords and patterns for ultra-fast heuristic check
const ENGLISH_MARKERS = new Set([
  "the", "and", "with", "from", "experience", "education", "skills",
  "project", "work", "responsibilities", "management", "developed",
  "led", "managed", "designed", "implemented", "summary", "university",
  "bachelor", "master", "years", "team", "software", "engineer", "lead"
]);

const SPANISH_MARKERS = new Set([
  "de", "la", "el", "en", "y", "con", "experiencia", "educación",
  "habilidades", "proyecto", "trabajo", "responsabilidades", "gestión",
  "desarrolló", "lideró", "diseñado", "resumen", "universidad", "licenciatura",
  "años", "equipo", "ingeniero", "desarrollador"
]);

export async function detectLanguage(text: string): Promise<LanguageDetectionResult> {
  const clean = text
    .toLowerCase()
    .replace(/[^a-záéíóúñü\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const words = clean.split(" ").filter((w) => w.length > 2);

  if (words.length < 15) {
    return {
      language: "und",
      isEnglish: false,
      confidence: 0.1,
      reason: "Document text too short to verify English language (< 15 words extracted)",
    };
  }

  // 1. Try franc if available
  try {
    const { franc } = await import("franc");
    const code = franc(text, { minLength: 20 });
    if (code && code !== "und") {
      const isEnglish = code === "eng";
      return {
        language: code,
        isEnglish,
        confidence: isEnglish ? 0.95 : 0.85,
        reason: isEnglish
          ? "English language confirmed by statistical detector"
          : `Non-English language detected (${code}). Company policy requires CVs in English.`,
      };
    }
  } catch {
    // Fall back to heuristic marker check
  }

  // 2. Heuristic word frequency fallback
  let englishCount = 0;
  let spanishCount = 0;

  for (const w of words) {
    if (ENGLISH_MARKERS.has(w)) englishCount++;
    if (SPANISH_MARKERS.has(w)) spanishCount++;
  }

  const totalMatches = englishCount + spanishCount;
  if (totalMatches === 0) {
    return {
      language: "und",
      isEnglish: false,
      confidence: 0.4,
      reason: "Could not reliably determine language. Please verify English format.",
    };
  }

  const englishRatio = englishCount / totalMatches;
  const isEnglish = englishRatio >= 0.65;

  return {
    language: isEnglish ? "eng" : (spanishCount > englishCount ? "spa" : "oth"),
    isEnglish,
    confidence: Number(englishRatio.toFixed(2)),
    reason: isEnglish
      ? "English vocabulary confirmed"
      : "Non-English content detected. Company policy requires CVs in English.",
  };
}
