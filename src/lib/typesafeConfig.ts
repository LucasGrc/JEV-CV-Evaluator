import { TypeSafeClient } from '@typesafe-ai/sdk';

const PLACEHOLDER = 'tu_api_key';

export function createTypeSafeClient(): { client: TypeSafeClient; hasApiKey: boolean } {
  const apiKey = process.env.TYPESAFE_API_KEY || process.env.TYPESAFE_AI_API_KEY;
  const hasApiKey = Boolean(apiKey && !apiKey.includes(PLACEHOLDER));

  // The SDK appends its own /v1 paths, so tolerate a base URL that already ends in /v1.
  const baseURL = process.env.TYPESAFE_AI_BASE_URL?.trim().replace(/\/+$/, '').replace(/\/v1$/, '');
  const defaultModel = process.env.TYPESAFE_MODEL?.trim();

  const client = new TypeSafeClient({
    apiKey: apiKey || 'unconfigured-api-key',
    ...(baseURL ? { baseURL } : {}),
    ...(defaultModel ? { defaultModel } : {}),
  });

  return { client, hasApiKey };
}
