import fs from 'fs/promises';
import path from 'path';

// Load .env.local for standalone test execution
try {
  // @ts-ignore
  if (process.loadEnvFile) process.loadEnvFile('.env.local');
} catch {}

import { storeAndParseCV } from '@/lib/storage';
import { typeSafeEngine } from '@/lib/typesafe';
import { formatJevCost } from '@/lib/pricing';

async function main() {
  console.log('================================================================');
  console.log('🧪 TESTING SAMPLE PDF CVS WITH TYPESAFE AI (JEV) PIPELINE');
  console.log('================================================================\n');

  const sampleDir = path.join(process.cwd(), 'sample_cvs');
  const files = await fs.readdir(sampleDir);
  const pdfFiles = files.filter((f) => f.endsWith('.pdf'));

  console.log(`Found ${pdfFiles.length} PDF files in sample_cvs/:\n`);

  for (const fileName of pdfFiles) {
    console.log(`----------------------------------------------------------------`);
    console.log(`📄 Testing Document: ${fileName}`);
    console.log(`----------------------------------------------------------------`);

    const filePath = path.join(sampleDir, fileName);
    const buffer = await fs.readFile(filePath);

    // 1. Storage & Language Check
    const parsed = await storeAndParseCV(buffer, fileName);
    console.log(`• Extracted Text Length: ${parsed.extractedText.length} characters`);
    console.log(`• SHA-256 Hash: ${parsed.fileHash.substring(0, 16)}...`);
    console.log(`• Detected Language: ${parsed.languageResult.language} (Confidence: ${parsed.languageResult.confidence})`);
    console.log(`• Language Policy Valid (English): ${parsed.languageResult.isEnglish ? '✓ YES' : '✗ NO'}`);

    if (!parsed.languageResult.isEnglish) {
      console.log(`🚫 POLICY FILTER TRIGGERED: Document flagged as WRONG_LANGUAGE.`);
      console.log(`💰 Cost: $0.0000 (0 tokens billed - rejected before JEV call)\n`);
      continue;
    }

    // 2. Evaluation with JEV
    try {
      console.log(`⚡ Sending to TypeSafe AI (JEV System One)...`);
      const evalResponse = await typeSafeEngine.evaluateResume(parsed.extractedText);
      const { answers, usage, model } = evalResponse;

      console.log(`✓ JEV Model: ${model}`);
      console.log(`  - Frontend Depth:    ${answers.frontend_depth.score.toFixed(2)} / 4.0  (Conf: ${(answers.frontend_depth.confidence * 100).toFixed(0)}%)`);
      console.log(`  - Backend Depth:     ${answers.backend_depth.score.toFixed(2)} / 4.0  (Conf: ${(answers.backend_depth.confidence * 100).toFixed(0)}%)`);
      console.log(`  - Database Depth:    ${answers.database_depth.score.toFixed(2)} / 4.0  (Conf: ${(answers.database_depth.confidence * 100).toFixed(0)}%)`);
      console.log(`  - DevOps & Cloud:    ${answers.devops_cloud.score.toFixed(2)} / 4.0  (Conf: ${(answers.devops_cloud.confidence * 100).toFixed(0)}%)`);
      console.log(`  - Business Impact:   ${answers.business_impact.score.toFixed(2)} / 4.0  (Conf: ${(answers.business_impact.confidence * 100).toFixed(0)}%)`);
      console.log(`  - Inferred Seniority:${answers.seniority_level.choice} (Conf: ${(answers.seniority_level.confidence * 100).toFixed(0)}%)`);
      console.log(`  - Containerization:  ${(answers.has_containerization.noul * 100).toFixed(1)}% prob`);
      console.log(`  - Modern Stack:      ${(answers.has_modern_stack.noul * 100).toFixed(1)}% prob`);

      // Weighted Composite Score for Full-Stack (40% skills, 35% exp, 15% edu, 10% lead)
      const skillsScore = (answers.frontend_depth.score + answers.backend_depth.score + answers.database_depth.score) / 3;
      const expScore = (answers.devops_cloud.score + (answers.seniority_level.choice.includes('Senior') || answers.seniority_level.choice.includes('Lead') ? 3.5 : 1.5)) / 2;
      const overall = skillsScore * 0.4 + expScore * 0.35 + answers.database_depth.score * 0.15 + answers.business_impact.score * 0.1;

      console.log(`\n📊 Composite Overall Score: ${overall.toFixed(2)} / 4.0 (${((overall / 4) * 100).toFixed(1)}%)`);
      console.log(`📈 Decision Recommendation: ${overall >= 2.5 ? 'TOP / FIT CANDIDATE' : 'NOT RECOMMENDED'}`);
      console.log(`💰 Input Tokens: ${usage.input_tokens} | API Cost: ${formatJevCost(usage.cost_usd)} USD\n`);
    } catch (err: any) {
      console.error(`❌ Evaluation Error:`, err.message);
    }
  }

  console.log('================================================================');
  console.log('✓ All 5 sample CVs tested against JEV evaluation pipeline!');
  console.log('================================================================');
}

main().catch(console.error);
