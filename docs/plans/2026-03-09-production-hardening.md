# Production Hardening Pass — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Eliminate recurring Edge Function auth/deploy regressions, improve runtime reliability and observability, fix UI bugs, and remove dead code.

**Architecture:** Surgical changes across client services, edge functions, stores, and tooling. No architectural rewrites. Each task is independently deployable.

**Tech Stack:** React Native/Expo, TypeScript, Supabase Edge Functions (Deno), Zustand

---

## Task 1: Client invoke auth robustness

**Files:**
- Modify: `src/services/campaign.ts:37-63`

**Step 1: Rewrite `invokeEdgeFunction` helper**

Replace lines 37-63 with:

```typescript
async function invokeEdgeFunction<T>(
  fnName: 'campaign-init' | 'game-turn',
  body: Record<string, any>,
  failurePrefix: string
): Promise<T> {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !sessionData.session) {
    throw new Error(`${failurePrefix}: Not authenticated. Please sign in again.`);
  }

  let accessToken = sessionData.session.access_token;
  const expiresAt = sessionData.session.expires_at ?? 0;
  const now = Math.floor(Date.now() / 1000);

  if (expiresAt > 0 && expiresAt - now < 90) {
    const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
    if (!refreshError && refreshed.session?.access_token) {
      accessToken = refreshed.session.access_token;
    }
  }

  let data: any;
  let error: any;
  try {
    const result = await supabase.functions.invoke(fnName, {
      body,
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    data = result.data;
    error = result.error;
  } catch (fetchErr: any) {
    throw new Error(`${failurePrefix}: Network error — ${fetchErr?.message || 'check your connection'}`);
  }

  if (error) {
    let message = error.message;
    try {
      const errorBody = await (error as any).context?.json();
      if (errorBody?.error) message = errorBody.error;
    } catch {}
    throw new Error(`${failurePrefix}: ${message}`);
  }

  if ((data as any)?.error) throw new Error((data as any).error);
  return data as T;
}
```

**Step 2: Commit**
```bash
git add src/services/campaign.ts
git commit -m "fix: restore conditional token refresh in edge function invoke helper"
```

---

## Task 2: Edge Function DB write error checking (game-turn)

**Files:**
- Modify: `supabase/functions/game-turn/index.ts`

**Step 1: Add error checking to companion_states update (around line 241)**

Current code (lines 240-246) does `await adminClient.from('companion_states').update(...)` without checking error. Wrap each update:

After the `.update({ approval_score: ... })` call, add error logging:
```typescript
const { error: compUpdateErr } = await adminClient
  .from('companion_states')
  .update({ approval_score: comp?.approvalScore ?? 50 })
  .eq('campaign_id', campaignId)
  .eq('companion_name', change.companion);
if (compUpdateErr) {
  console.error('companion_states update failed', { campaignId, companion: change.companion, error: compUpdateErr.message });
}
```

**Step 2: Add error checking to campaigns update (around line 276)**

Current code: `await adminClient.from('campaigns').update(campaignUpdates).eq('id', campaignId);`

Replace with:
```typescript
const { error: campUpdateErr } = await adminClient.from('campaigns').update(campaignUpdates).eq('id', campaignId);
if (campUpdateErr) {
  console.error('campaign update failed', { campaignId, error: campUpdateErr.message });
  return errorResponse('Failed to save game state.', 500, headers);
}
```

**Step 3: Add error checking to character HP update (around line 283)**

Current code: `await adminClient.from('characters').update({ hp: newHp }).eq('id', character.id);`

Replace with:
```typescript
const { error: hpUpdateErr } = await adminClient.from('characters').update({ hp: newHp }).eq('id', character.id);
if (hpUpdateErr) {
  console.error('character HP update failed', { characterId: character.id, error: hpUpdateErr.message });
}
```

**Step 4: Commit**
```bash
git add supabase/functions/game-turn/index.ts
git commit -m "fix: add error checking for DB writes in game-turn edge function"
```

---

## Task 3: AI parser comments and cleanup

**Files:**
- Modify: `supabase/functions/_shared/ai-parser.ts`

**Step 1: Add comments to non-obvious logic**

Add comments before:
- `tryParseJson` — explain the two repair strategies (trailing commas, smart quotes)
- `isNarrativeText` — explain the heuristic (min length, alpha ratio, word count)
- The escape-sequence cleanup in `normalizeResponse` — explain why double-serialization causes this

No behavioral changes. Comments only.

**Step 2: Commit**
```bash
git add supabase/functions/_shared/ai-parser.ts
git commit -m "docs: add clarifying comments to AI parser non-obvious logic"
```

---

## Task 4: Fix approval lifecycle bug

**Files:**
- Modify: `src/stores/useGameStore.ts` (add action)
- Modify: `app/game/session.tsx` (wire action)

**Step 1: Add `clearPendingApprovals` to store interface and implementation**

In `useGameStore.ts`, add to interface (after line 52):
```typescript
clearPendingApprovals: () => void;
```

Add implementation (after `clearTutorialComplete` at line 191):
```typescript
clearPendingApprovals: () => set({ pendingApprovalChanges: [] }),
```

**Step 2: Wire into session.tsx**

In `app/game/session.tsx`, update `handleApprovalsDismissed` (lines 80-82):
```typescript
const handleApprovalsDismissed = useCallback(() => {
  useGameStore.getState().clearPendingApprovals();
}, []);
```

**Step 3: Commit**
```bash
git add src/stores/useGameStore.ts app/game/session.tsx
git commit -m "fix: wire approval dismissal to clear pending approvals from store"
```

---

## Task 5: Root bootstrap error handling

**Files:**
- Modify: `app/index.tsx`

**Step 1: Add explicit error display for query failures**

In the character/campaign query sections, ensure errors are surfaced to the user instead of silently treating as empty data. When queries fail, set a debug message and route to a safe fallback. Read the current file first to identify exact lines, then add error state display with a retry option.

Key changes:
- If character query errors, show "Failed to load characters" with retry
- If campaign query errors, show "Failed to load campaign" with retry
- Keep existing routing logic for the success path

**Step 2: Commit**
```bash
git add app/index.tsx
git commit -m "fix: surface query errors in root bootstrap instead of silent fallback"
```

---

## Task 6: Dependency cleanup

**Files:**
- Modify: `package.json`

**Step 1: Remove `@types/react-native` from devDependencies**

The types are bundled with React Native in Expo SDK 55+. This package is unnecessary.

**Step 2: Add quality scripts**

Add to scripts section:
```json
"typecheck": "tsc --noEmit",
"doctor": "npx expo-doctor"
```

**Step 3: Run `npm install`**

**Step 4: Commit**
```bash
git add package.json package-lock.json
git commit -m "chore: remove unused @types/react-native, add typecheck and doctor scripts"
```

---

## Task 7: Dead code audit + tech debt doc

**Files:**
- Modify: `src/services/character.ts` (remove unused exports)
- Modify: `src/components/game/DiceOverlay.tsx` (add TODO)
- Modify: `src/components/game/D20Mesh.tsx` (add TODO)
- Modify: `src/components/game/AbilityCard.tsx` (add TODO)
- Create: `docs/tech-debt.md`

**Step 1: Remove `getCharacters` and `deleteCharacter` from character.ts**

These are exported but never imported anywhere. Remove the function definitions.

**Step 2: Add `TODO(feature-flag)` to staged components**

Add to top of each file:
```typescript
// TODO(feature-flag): This component is feature-staged for the combat UI system.
// Not yet wired into the game session. See docs/tech-debt.md.
```

**Step 3: Create `docs/tech-debt.md`**

```markdown
# Tech Debt — QuestForge

## Feature-Staged Components (Do Not Delete)

| File | Purpose | Blocked On |
|------|---------|------------|
| `src/components/game/DiceOverlay.tsx` | 3D dice roll animation overlay | Combat UI integration |
| `src/components/game/D20Mesh.tsx` | Three.js D20 mesh + tumble animation | DiceOverlay dependency |
| `src/components/game/AbilityCard.tsx` | Combat ability card display | Combat mode UI |

These components are built and ready but not yet wired into the game session screen.
They will be integrated during the Combat UI phase.
```

**Step 4: Commit**
```bash
git add src/services/character.ts src/components/game/DiceOverlay.tsx src/components/game/D20Mesh.tsx src/components/game/AbilityCard.tsx docs/tech-debt.md
git commit -m "chore: remove unused character exports, document feature-staged components"
```

---

## Task 8: README deploy instructions + config.toml

**Files:**
- Modify: `README.md`
- Verify: `supabase/config.toml`

**Step 1: Update README deploy section**

Replace the existing deploy commands (around lines 46-50) with:

```markdown
5. Deploy Edge Functions:
   ```bash
   supabase functions deploy game-turn --no-verify-jwt --project-ref <your-project-ref>
   supabase functions deploy campaign-init --no-verify-jwt --project-ref <your-project-ref>
   ```
   > **Important:** `--no-verify-jwt` is required. This project verifies JWTs inside
   > each function via `supabase.auth.getUser()`. The Supabase gateway's legacy JWT
   > verification must remain disabled — CLI deploys reset it to enabled by default.
   > The `supabase/config.toml` also sets `verify_jwt = false` per function.
```

**Step 2: Verify config.toml is correct**

Should contain:
```toml
[functions.campaign-init]
verify_jwt = false

[functions.game-turn]
verify_jwt = false
```

**Step 3: Commit**
```bash
git add README.md supabase/config.toml
git commit -m "docs: update deploy instructions to prevent JWT verification regression"
```

---

## Task 9: Validation

**Step 1: Run typecheck**
```bash
npm run typecheck
```
Report pass/fail.

**Step 2: Run expo doctor**
```bash
npx expo-doctor
```
Report pass/fail with remaining issues.

**Step 3: Deploy edge functions**
```bash
supabase functions deploy game-turn --no-verify-jwt --project-ref bsbdtdexdlyruojyabtn
supabase functions deploy campaign-init --no-verify-jwt --project-ref bsbdtdexdlyruojyabtn
```

---

## Parallelization Notes

These tasks can be grouped:
- **Group A (independent, client-side):** Tasks 1, 4, 5, 6 — no dependencies between them
- **Group B (independent, server-side):** Tasks 2, 3 — no dependencies between them
- **Group C (docs):** Tasks 7, 8 — no dependencies
- **Group D (sequential):** Task 9 — must run after all others complete
