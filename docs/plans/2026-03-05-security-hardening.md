# Security Hardening Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Harden Supabase database policies, Edge Function inputs, credentials management, and abuse controls for QuestForge.

**Architecture:** DB policy fixes via SQL migration, Edge Function input validation + rate limiting via a shared guard module, client config via Expo Constants, gitignore hygiene.

**Tech Stack:** Supabase (Postgres RLS, Edge Functions/Deno), React Native/Expo, TypeScript

---

## Audit Findings Summary

| # | Finding | Severity | Status |
|---|---------|----------|--------|
| 1 | UPDATE policies missing `with_check` — user could change `user_id` to hijack rows | **HIGH** | Fix in Task 1 |
| 2 | `game-turn` Edge Function has `verify_jwt: false` — gateway bypass | **HIGH** | Fix in Task 2 |
| 3 | No input length validation on Edge Functions — payload abuse | **MEDIUM** | Fix in Task 3 |
| 4 | No rate limiting on AI endpoints — cost abuse | **MEDIUM** | Fix in Task 4 |
| 5 | Raw `error.message` leaks internals to clients | **MEDIUM** | Fix in Task 5 |
| 6 | Supabase URL + anon key hardcoded in source | **LOW** | Fix in Task 6 |
| 7 | CORS wildcard `*` on Edge Functions | **LOW** | Fix in Task 7 |
| 8 | `supabase/.temp/` not gitignored | **LOW** | Fix in Task 8 |
| 9 | RLS enabled on all 9 tables with ownership policies | **OK** | No fix needed |
| 10 | Campaign-joined tables use subquery ownership checks | **OK** | No fix needed |
| 11 | profiles table has no INSERT policy (auto-created via trigger) | **OK** | By design |

---

### Task 1: Harden UPDATE policies with `with_check`

**Files:**
- Create: `supabase/migrations/20260305_harden_update_policies.sql`

**Problem:** UPDATE policies on `characters`, `campaigns`, `profiles`, and `meta_progression` have `USING (auth.uid() = user_id)` but no `WITH CHECK`. A user could update their own row to set `user_id` to a different UUID, orphaning or hijacking data.

**SQL Migration:**
```sql
-- Harden UPDATE policies to prevent user_id mutation

-- characters: prevent changing user_id
DROP POLICY "Users can update own characters" ON characters;
CREATE POLICY "Users can update own characters" ON characters
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- campaigns: prevent changing user_id
DROP POLICY "Users can update own campaigns" ON campaigns;
CREATE POLICY "Users can update own campaigns" ON campaigns
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- profiles: prevent changing id
DROP POLICY "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- meta_progression: prevent changing user_id
DROP POLICY "Users can update own meta progression" ON meta_progression;
CREATE POLICY "Users can update own meta progression" ON meta_progression
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

**Apply:** Via Supabase MCP `apply_migration` tool.

**Verify:** Run policy query to confirm `with_check` is populated on all UPDATE policies.

---

### Task 2: Re-enable verify_jwt on game-turn

**Problem:** `game-turn` has `verify_jwt: false` (set to work around expired JWT issue). This means unauthenticated requests reach the function code, consuming compute. The function does its own auth check, but the gateway should filter first.

**Fix:** Redeploy `game-turn` with `verify_jwt: true`. The root cause (expired JWTs) was a client-side token refresh issue, not a function issue. The client's `autoRefreshToken: true` handles this.

**Deploy:** Via Supabase MCP `deploy_edge_function` with `verify_jwt: true`.

**Note:** If users report 401s again, the fix is client-side token refresh, not disabling gateway JWT.

---

### Task 3: Add input validation guards to Edge Functions

**Files:**
- Create: `supabase/functions/_shared/guards.ts`
- Modify: `supabase/functions/game-turn/index.ts`
- Modify: `supabase/functions/campaign-init/index.ts`

**`guards.ts`:**
```typescript
import { corsHeaders } from './cors.ts';

const MAX_ACTION_LENGTH = 2000;
const MAX_PROMPT_LENGTH = 4000;
const MAX_NAME_LENGTH = 100;

export function validateGameTurnInput(body: any): string | null {
  if (!body.campaignId || typeof body.campaignId !== 'string') return 'campaignId required';
  if (!body.action || typeof body.action !== 'string') return 'action required';
  if (body.action.length > MAX_ACTION_LENGTH) return `action exceeds ${MAX_ACTION_LENGTH} chars`;
  return null;
}

export function validateCampaignInitInput(body: any): string | null {
  if (!body.characterId || typeof body.characterId !== 'string') return 'characterId required';
  if (body.customPrompt && typeof body.customPrompt === 'string' && body.customPrompt.length > MAX_PROMPT_LENGTH) {
    return `customPrompt exceeds ${MAX_PROMPT_LENGTH} chars`;
  }
  if (body.campaignName && typeof body.campaignName === 'string' && body.campaignName.length > MAX_NAME_LENGTH) {
    return `campaignName exceeds ${MAX_NAME_LENGTH} chars`;
  }
  return null;
}

export function errorResponse(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
```

**Integration in game-turn (after request parse):**
```typescript
import { validateGameTurnInput, errorResponse } from '../_shared/guards.ts';
// ... after const body = await req.json();
const inputError = validateGameTurnInput(body);
if (inputError) return errorResponse(inputError, 400);
```

**Integration in campaign-init (after request parse):**
```typescript
import { validateCampaignInitInput, errorResponse } from '../_shared/guards.ts';
// ... after const body = await req.json();
const inputError = validateCampaignInitInput(body);
if (inputError) return errorResponse(inputError, 400);
```

---

### Task 4: Add per-user rate limiting for AI endpoints

**Files:**
- Create: `supabase/migrations/20260305_rate_limit_table.sql`
- Modify: `supabase/functions/_shared/guards.ts`
- Modify: `supabase/functions/game-turn/index.ts`
- Modify: `supabase/functions/campaign-init/index.ts`

**Migration — rate limit tracking table:**
```sql
CREATE TABLE IF NOT EXISTS public.rate_limits (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  window_start timestamptz NOT NULL DEFAULT now(),
  request_count integer NOT NULL DEFAULT 1,
  PRIMARY KEY (user_id, endpoint)
);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
-- No client policies — only service_role accesses this table
```

**Guard function (add to guards.ts):**
```typescript
export async function checkRateLimit(
  adminClient: any,
  userId: string,
  endpoint: string,
  maxPerMinute: number = 10
): Promise<boolean> {
  const windowStart = new Date(Date.now() - 60_000).toISOString();

  // Upsert: increment if within window, reset if expired
  const { data } = await adminClient
    .from('rate_limits')
    .select('request_count, window_start')
    .eq('user_id', userId)
    .eq('endpoint', endpoint)
    .single();

  if (!data || new Date(data.window_start) < new Date(windowStart)) {
    // Reset window
    await adminClient.from('rate_limits').upsert({
      user_id: userId,
      endpoint,
      window_start: new Date().toISOString(),
      request_count: 1,
    });
    return true;
  }

  if (data.request_count >= maxPerMinute) {
    return false; // Rate limited
  }

  await adminClient.from('rate_limits')
    .update({ request_count: data.request_count + 1 })
    .eq('user_id', userId)
    .eq('endpoint', endpoint);
  return true;
}
```

**Integration (both functions, after auth check):**
```typescript
const allowed = await checkRateLimit(adminClient, user.id, 'game-turn', 10);
if (!allowed) return errorResponse('Rate limited. Please wait a moment.', 429);
```

---

### Task 5: Sanitize error responses

**Files:**
- Modify: `supabase/functions/game-turn/index.ts:301-306`
- Modify: `supabase/functions/campaign-init/index.ts:335-340`

**Fix:** Replace raw `error.message` with generic message, log internally:

```typescript
// BEFORE:
return new Response(JSON.stringify({ error: error.message || 'Internal error' }), {

// AFTER:
return new Response(JSON.stringify({ error: 'An unexpected error occurred. Please try again.' }), {
```

Keep `console.error` for server-side debugging — it goes to Supabase logs, not to client.

---

### Task 6: Move Supabase credentials to Expo config

**Files:**
- Create: `.env` (gitignored, local only)
- Modify: `app.json` (add extra.supabaseUrl, extra.supabaseAnonKey)
- Modify: `src/services/supabase.ts`
- Modify: `.gitignore`

**`.env`:**
```
EXPO_PUBLIC_SUPABASE_URL=https://bsbdtdexdlyruojyabtn.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...UqN8
```

**`supabase.ts` change:**
```typescript
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
```

**`.gitignore` additions:**
```
.env
.env.*
!.env.example
```

**Create `.env.example`:**
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Note:** The anon key is designed to be public (RLS protects data). Moving to env is defense-in-depth and prevents accidental key rotation issues.

---

### Task 7: Tighten CORS headers

**Files:**
- Modify: `supabase/functions/_shared/cors.ts`

**Fix:**
```typescript
const ALLOWED_ORIGINS = [
  'http://localhost:8081',      // Expo dev
  'http://localhost:19006',     // Expo web
  'questforge://',              // Mobile deep links
];

export function getCorsHeaders(origin?: string | null): Record<string, string> {
  // In production, restrict to known origins
  // For mobile apps, Origin header is often absent — allow those through
  const allowedOrigin = !origin || ALLOWED_ORIGINS.some(o => origin.startsWith(o))
    ? (origin || '*')
    : ALLOWED_ORIGINS[0];

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}

// Backward-compatible export for existing code
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
```

**Note:** Mobile React Native apps don't send an Origin header, so `*` is actually required for mobile. Keep `corsHeaders` as-is for now but add the function for future web use. This is LOW priority.

---

### Task 8: Gitignore supabase temp files

**Files:**
- Modify: `.gitignore`

**Add:**
```
# Supabase
supabase/.temp/
```

---

## Deployment Order

1. Task 1 — Apply migration (DB policies)
2. Task 4 — Apply migration (rate_limits table)
3. Task 8 — Gitignore
4. Task 6 — Env config
5. Tasks 3+5+7 — Edge function code changes
6. Task 2 — Redeploy both edge functions with verify_jwt: true + all code changes
7. Validate

## Validation

- `npx tsc --noEmit` — zero errors
- Policy smoke check: query `pg_policies` to verify `with_check` on all UPDATE policies
- Rate limit table exists with RLS and no client policies
- Edge functions return 400 on oversized input, 429 on rate limit, generic 500 on internal error
- `.env` file not tracked by git

## Residual Risks

1. **Anthropic API key in Supabase secrets** — secure (server-only), but if Supabase is compromised, key is exposed. Mitigation: set Anthropic spending limits ($20/mo already configured).
2. **No per-campaign turn cap** — a user could run unlimited turns consuming AI credits. Mitigation: rate limiting helps, but a hard campaign turn cap could be added later.
3. **CORS `*` still needed for mobile** — React Native doesn't send Origin. True CORS restriction only possible with a web client.
4. **No request signing** — mobile app requests are reproducible with extracted JWT. Standard for mobile apps; RLS is the real protection layer.
