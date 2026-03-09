// Shared input validation and rate limiting for Edge Functions

import { corsHeaders } from './cors.ts';

const MAX_ACTION_LENGTH = 2000;
const MAX_PROMPT_LENGTH = 4000;
const MAX_NAME_LENGTH = 100;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MODE_SET = new Set(['generated', 'custom', 'tutorial']);

function isUuid(v: unknown): v is string {
  return typeof v === 'string' && UUID_RE.test(v);
}

export function validateGameTurnInput(body: any): string | null {
  if (!body || typeof body !== 'object') return 'Invalid request body';
  if (!isUuid(body.campaignId)) return 'campaignId must be a UUID';
  if (typeof body.action !== 'string' || body.action.trim().length === 0) return 'action required';
  if (body.action.length > MAX_ACTION_LENGTH) return `action exceeds ${MAX_ACTION_LENGTH} chars`;
  return null;
}

export function validateCampaignInitInput(body: any): string | null {
  if (!body || typeof body !== 'object') return 'Invalid request body';
  if (!isUuid(body.characterId)) return 'characterId must be a UUID';
  if (body.mode !== undefined && !MODE_SET.has(body.mode)) return 'mode must be generated|custom|tutorial';
  if (typeof body.customPrompt === 'string' && body.customPrompt.length > MAX_PROMPT_LENGTH) {
    return `customPrompt exceeds ${MAX_PROMPT_LENGTH} chars`;
  }
  if (typeof body.campaignName === 'string' && body.campaignName.length > MAX_NAME_LENGTH) {
    return `campaignName exceeds ${MAX_NAME_LENGTH} chars`;
  }
  if (body.companions && !Array.isArray(body.companions)) return 'companions must be an array';
  return null;
}

export function errorResponse(message: string, status: number, headers?: Record<string, string>) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...(headers || corsHeaders), 'Content-Type': 'application/json' },
  });
}

export async function checkRateLimit(
  adminClient: any,
  userId: string,
  endpoint: string,
  maxPerMinute: number = 10
): Promise<boolean> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - 60_000);

  const { data, error } = await adminClient
    .from('rate_limits')
    .select('request_count, window_start')
    .eq('user_id', userId)
    .eq('endpoint', endpoint)
    .maybeSingle();

  if (error) {
    console.error('rate_limit_read_error', { userId, endpoint, error: error.message });
    return true; // fail-open: don't block gameplay on DB errors
  }

  if (!data || new Date(data.window_start) < windowStart) {
    const { error: upsertError } = await adminClient
      .from('rate_limits')
      .upsert({
        user_id: userId,
        endpoint,
        window_start: now.toISOString(),
        request_count: 1,
      });

    if (upsertError) {
      console.error('rate_limit_upsert_error', { userId, endpoint, error: upsertError.message });
      return true; // fail-open: don't block gameplay on DB errors
    }
    return true;
  }

  if (data.request_count >= maxPerMinute) return false;

  const { error: updateError } = await adminClient
    .from('rate_limits')
    .update({ request_count: data.request_count + 1 })
    .eq('user_id', userId)
    .eq('endpoint', endpoint);

  if (updateError) {
    console.error('rate_limit_update_error', { userId, endpoint, error: updateError.message });
    return true; // fail-open: don't block gameplay on DB errors
  }

  return true;
}
