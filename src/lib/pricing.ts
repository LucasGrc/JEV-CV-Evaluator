/**
 * Official TypeSafe AI (JEV) Pricing Calculator
 * Reference: docs.typesafe.ai/models.md
 *
 * JEV (jev-1.13.0 / System One discriminative model):
 * - Input tokens: $0.042 per 1,000,000 tokens
 * - Output tokens: $0.00 (free)
 */

export const JEV_INPUT_PRICE_PER_MILLION = 0.042;
export const JEV_OUTPUT_PRICE_PER_MILLION = 0.00;

export function calculateJevCostUsd(inputTokens: number, outputTokens: number = 0): number {
  const inputCost = (inputTokens * JEV_INPUT_PRICE_PER_MILLION) / 1_000_000;
  const outputCost = (outputTokens * JEV_OUTPUT_PRICE_PER_MILLION) / 1_000_000;
  return Number((inputCost + outputCost).toFixed(7));
}

export function formatJevCost(costUsd: number): string {
  if (costUsd < 0.0001) {
    return `$${costUsd.toFixed(6)}`;
  }
  return `$${costUsd.toFixed(4)}`;
}
