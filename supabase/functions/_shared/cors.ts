const DEFAULT_ALLOWED_ORIGINS = ['http://localhost:8081', 'http://localhost:19006'];

function getAllowedOrigins(): string[] {
  const env = Deno.env.get('ALLOWED_ORIGINS');
  if (!env) return DEFAULT_ALLOWED_ORIGINS;
  return env.split(',').map(s => s.trim()).filter(Boolean);
}

export function getCorsHeaders(origin?: string | null): Record<string, string> {
  const allowed = getAllowedOrigins();
  const isAllowed = !!origin && allowed.some(o => origin.startsWith(o));
  // Mobile RN apps don't send Origin — allow those through with '*'
  const resolved = !origin ? '*' : isAllowed ? origin : allowed[0] ?? 'http://localhost:8081';

  return {
    'Access-Control-Allow-Origin': resolved,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}

// Backward-compatible static export (used by guards.ts errorResponse default)
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
