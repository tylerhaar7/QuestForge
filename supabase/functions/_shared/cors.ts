const DEFAULT_ALLOWED_ORIGINS = ['http://localhost:8081', 'http://localhost:19006'];

function getAllowedOrigins(): string[] {
  const env = Deno.env.get('ALLOWED_ORIGINS');
  if (!env) return DEFAULT_ALLOWED_ORIGINS;
  return env.split(',').map(s => s.trim()).filter(Boolean);
}

export function getCorsHeaders(origin?: string | null): Record<string, string> {
  const allowed = getAllowedOrigins();
  const isAllowed = !!origin && allowed.some(o => origin.startsWith(o));

  const base: Record<string, string> = {
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  // Mobile RN apps don't send Origin — they don't need CORS headers.
  // Only set Access-Control-Allow-Origin for whitelisted browser origins.
  if (!origin) {
    return base;
  }

  base['Access-Control-Allow-Origin'] = isAllowed ? origin : allowed[0] ?? 'http://localhost:8081';
  return base;
}

// Backward-compatible static export (used by guards.ts errorResponse default)
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
