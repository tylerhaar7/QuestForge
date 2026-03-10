# Companion Rework + Deferred Features Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework the companion system for BG3-style recruitment and implement camp, enemy intentions, threshold/death, session recaps, journal, and adventure map.

**Architecture:** All persistent state changes go through Supabase edge functions (server-side). Client reads state from the store and renders UI. Claude generates narrative content; the game engine handles all mechanics. New screens route through Expo Router file-based routing.

**Tech Stack:** React Native + Expo (TypeScript), Expo Router, Zustand, Supabase (Edge Functions + Postgres), Claude API, react-native-reanimated, expo-haptics

**Spec:** `docs/superpowers/specs/2026-03-10-companion-rework-and-deferred-features-design.md`

---

## Chunk 1: Foundation — Types, Database Migration, Companion Roster

Updates type definitions, applies database migration, and creates the 13-companion roster. No UI changes yet — this is the data layer everything else builds on.

### Task 1: Update Type Definitions

**Files:**
- Modify: `src/types/game.ts`
- Modify: `supabase/functions/_shared/types.ts`

- [ ] **Step 1: Add `artificer` to `ClassName` in both files**

In `src/types/game.ts` line 31-34, add `'artificer'` to the union:
```typescript
export type ClassName =
  | 'barbarian' | 'bard' | 'cleric' | 'druid' | 'fighter'
  | 'monk' | 'paladin' | 'ranger' | 'rogue' | 'sorcerer'
  | 'warlock' | 'wizard' | 'artificer';
```

Same change in `supabase/functions/_shared/types.ts` line 12-14.

- [ ] **Step 2: Add `'companion'` to `MapNodeType`**

In `src/types/game.ts` line 234-236:
```typescript
export type MapNodeType =
  | 'combat' | 'elite' | 'boss' | 'rest'
  | 'merchant' | 'mystery' | 'social' | 'treasure' | 'companion';
```

- [ ] **Step 3: Add new types to `src/types/game.ts`**

Add after the `ThreadUpdate` interface (end of file):
```typescript
// ─── Companion Pool ────────────────────────────────
export interface CompanionPoolEntry extends Companion {
  recruited: boolean;
  introduced: boolean;
  aiGenerated: boolean;
  introductionTurn?: number;
}

export interface CompanionEncounter {
  companionName: string;
  hook: string;
  miniQuestHint: string;
}

// ─── Journal ───────────────────────────────────────
export type JournalEntryType =
  | 'npc_met' | 'quest_accepted' | 'quest_completed'
  | 'location_discovered' | 'item_found' | 'lore_learned'
  | 'decision_made' | 'companion_event'
  | 'combat_victory' | 'combat_defeat';

export interface JournalEntry {
  entryType: JournalEntryType;
  title: string;
  description: string;
  relatedNpcs?: string[];
  relatedLocations?: string[];
}
```

- [ ] **Step 4: Add new fields to `AIResponse`**

In `src/types/game.ts`, add to the `AIResponse` interface:
```typescript
companionEncounter?: CompanionEncounter;
journalEntries?: JournalEntry[];
```

- [ ] **Step 5: Add new fields to `Campaign`**

In `src/types/game.ts`, add to the `Campaign` interface:
```typescript
companionPool?: CompanionPoolEntry[];
recruitmentMode: 'choose' | 'discover';
lastSessionAt?: string;
```

- [ ] **Step 6: Mirror new types in `supabase/functions/_shared/types.ts`**

Add `CompanionPoolEntry`, `CompanionEncounter`, `JournalEntry`, `JournalEntryType` interfaces. Add `companion_pool`, `recruitment_mode`, `last_session_at` to `CampaignRow`. Add `'companion'` to any map node type references.

- [ ] **Step 7: Commit**

```
git add src/types/game.ts supabase/functions/_shared/types.ts
git commit -m "feat: add types for companion pool, journal, companion encounter, artificer class"
```

---

### Task 2: Database Migration

**Files:**
- Create: Supabase migration via MCP

- [ ] **Step 1: Apply migration to add new columns**

Using Supabase MCP, apply migration:
```sql
-- Add companion pool and recruitment mode to campaigns
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS companion_pool JSONB DEFAULT '[]';
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS recruitment_mode TEXT DEFAULT 'choose';
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS last_session_at TIMESTAMPTZ DEFAULT NOW();
```

- [ ] **Step 2: Verify migration applied**

Check tables via MCP `list_tables` or `execute_sql`:
```sql
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'campaigns' AND column_name IN ('companion_pool', 'recruitment_mode', 'last_session_at');
```

- [ ] **Step 3: Commit any local migration files if generated**

---

### Task 3: Create 13-Companion Roster

**Files:**
- Create: `src/data/companions.ts`

- [ ] **Step 1: Create the companion data file**

Create `src/data/companions.ts` with 13 pre-built companions, one per class. Each must match the `CompanionData` interface from `_shared/types.ts` (which is the base for `CompanionPoolEntry`).

Each companion needs:
- `name`, `className` (one of 13 classes), `level: 1`
- `hp`, `maxHp`, `ac` — class-appropriate starting stats
- `portrait: ''`, `color` — unique hex color
- `approvalScore: 50`, `relationshipStage: 'neutral'`
- `personality: { approves: [...], disapproves: [...], voice: '...', backstory: '...' }`
- `abilities: [{ name, type, description, icon }]` — 2 abilities each
- `conditions: []`

Existing 3 companions (Korrin/fighter, Sera/rogue, Thaelen/druid) should be moved here from `campaign-init/index.ts`.

New companions to design (10):
1. **Barbarian** — Rage-driven, tribal
2. **Bard** — Charming, hides pain with humor
3. **Cleric** — Faith-driven, doubting
4. **Monk** — Disciplined, seeking inner peace
5. **Paladin** — Righteous, struggles with rigid code
6. **Ranger** — Loner, slow to trust, tracks everything
7. **Sorcerer** — Wild magic, unpredictable, curious
8. **Warlock** — Dark patron, morally grey, secretive
9. **Wizard** — Bookish, analytical, socially awkward
10. **Artificer** — Inventive, practical, obsessed with tinkering

- [ ] **Step 2: Export a helper to get companions by class or by name**

```typescript
export function getCompanionByClass(className: ClassName): CompanionTemplate { ... }
export function getCompanionsByNames(names: string[]): CompanionTemplate[] { ... }
```

- [ ] **Step 3: Commit**

```
git add src/data/companions.ts
git commit -m "feat: add 13-class companion roster with full personalities"
```

---

## Chunk 2: Companion Recruitment System + Campaign Init Rework

Updates the companion creation flow and campaign-init edge function to support "Choose" vs "Discover" modes.

### Task 4: Update Companion Selection Screen

**Files:**
- Modify: `app/create/companions.tsx`

- [ ] **Step 1: Read the current companion selection screen**

Read `app/create/companions.tsx` fully to understand the current flow.

- [ ] **Step 2: Add recruitment mode selection before companion picker**

Add a screen/section before the companion grid:
- Header: "How do you want to meet your companions?"
- Two cards:
  - "Choose My Party" — "Pick 3 companions who join you from the start"
  - "Discover Along the Way" — "Meet companions throughout your journey. Pick who fate will bring."
- Store selection in local state: `recruitmentMode: 'choose' | 'discover'`

- [ ] **Step 3: Update companion grid to use full 13-companion roster**

Import from `src/data/companions.ts` instead of hardcoded templates. Display all 13 in the grid.

- [ ] **Step 4: Adjust selection rules for Discover mode**

- Choose mode: select exactly 3, all join immediately (current behavior)
- Discover mode: select 3-4 (they go into pool as unrecruited). Add "Let fate decide" button that randomly picks 4.
- Update `canContinue` gate accordingly.

- [ ] **Step 5: Pass `recruitmentMode` to campaign-start**

Pass `recruitmentMode` as a route param to `app/create/campaign-start.tsx`, which passes it to `initCampaign()`.

- [ ] **Step 6: Commit**

```
git add app/create/companions.tsx
git commit -m "feat: add recruitment mode selection and 13-companion roster to creation flow"
```

---

### Task 5: Update Campaign Init Edge Function

**Files:**
- Modify: `supabase/functions/campaign-init/index.ts`
- Modify: `src/services/campaign.ts`

- [ ] **Step 1: Accept `recruitmentMode` in the request body**

Add `recruitmentMode` to the validated input. Default to `'choose'` if not provided.

- [ ] **Step 2: Handle "Choose" mode (existing behavior)**

When `recruitmentMode === 'choose'`:
- Companions go directly into `campaign.companions` (active party) — same as current flow
- `companion_pool` is set to the same companions with `recruited: true, introduced: true`
- `recruitment_mode` column set to `'choose'`

- [ ] **Step 3: Handle "Discover" mode**

When `recruitmentMode === 'discover'`:
- `campaign.companions` starts as empty array `[]`
- `companion_pool` is set to selected companions with `recruited: false, introduced: false`
- Assign milestone turns: first companion `introductionTurn: 5`, second `introductionTurn: 15`, third `introductionTurn: 25`, fourth (if selected) `introductionTurn: 35`
- `recruitment_mode` column set to `'discover'`
- Add instruction to system prompt about companion introductions

- [ ] **Step 4: Remove hardcoded DEFAULT_COMPANIONS**

Replace with imports from `src/data/companions.ts` (need to create a shared version or duplicate for Deno). Since edge functions use Deno, create `supabase/functions/_shared/companions.ts` mirroring the roster data.

- [ ] **Step 5: Update `InitCampaignParams` in `src/services/campaign.ts`**

Add `recruitmentMode?: 'choose' | 'discover'` to the params interface.

- [ ] **Step 6: Update `campaignFromRow` in `src/services/campaign.ts`**

Map `companion_pool`, `recruitment_mode`, `last_session_at` from the row.

- [ ] **Step 7: Deploy campaign-init and commit**

```
npx supabase functions deploy campaign-init --no-verify-jwt
git add supabase/functions/ src/services/campaign.ts
git commit -m "feat: campaign-init supports choose/discover recruitment modes"
```

---

### Task 6: Update Game-Turn for Companion Encounters

**Files:**
- Modify: `supabase/functions/game-turn/index.ts`
- Modify: `supabase/functions/_shared/ai-parser.ts`
- Modify: `supabase/functions/_shared/prompts.ts`

- [ ] **Step 1: Add `companionEncounter` and `journalEntries` to `normalizeResponse`**

In `ai-parser.ts`, map `companion_encounter` / `companionEncounter` and `journal_entries` / `journalEntries` in `mapResponseKeys` and include in normalized output.

- [ ] **Step 2: Add companion pool context to system prompt**

In `prompts.ts`, add a section that injects unrecruited companion info when `recruitment_mode === 'discover'`:
```
COMPANION RECRUITMENT:
The following companions have not yet been introduced. Introduce them naturally
at the suggested turn milestones. When introducing a companion, include a
"companion_encounter" field in your response.
[list of unrecruited companions with introductionTurn]
```

- [ ] **Step 3: Add `companionEncounter` to the JSON schema in prompts**

Add the field to the schema documentation Claude sees.

- [ ] **Step 4: Handle `companionEncounter` in game-turn**

After parsing the AI response, if `companionEncounter` is present:
- Find the companion in `companion_pool` by name
- Set `introduced: true`
- Update `companion_pool` in the campaign record

- [ ] **Step 5: Handle companion recruitment completion**

When a player chooses to recruit (detected by action text or a future `recruit_companion` field):
- Move companion from pool to `companions` array
- Set `recruited: true` in pool
- Create `companion_states` row

- [ ] **Step 6: Deploy game-turn and commit**

```
npx supabase functions deploy game-turn --no-verify-jwt
git add supabase/functions/
git commit -m "feat: game-turn handles companion encounters and recruitment"
```

---

## Chunk 3: Enemy Intentions UI + Camp Screen

### Task 7: Enemy Intentions Component

**Files:**
- Create: `src/components/game/EnemyIntentions.tsx`
- Modify: `app/game/session.tsx`

- [ ] **Step 1: Create `EnemyIntentions.tsx`**

Component that renders the `enemyIntentions` array from `useGameStore`:
- Each row: enemy name (bold) → "targets" → target name → action description
- Predicted damage in red text
- Special effects as small gold badges
- Subtle pulse animation via Reanimated
- Dark card background with combat-red border

- [ ] **Step 2: Add to `session.tsx`**

Import and render between narrative area and choice area:
```tsx
{currentMode === 'combat' && enemyIntentions.length > 0 && (
  <EnemyIntentions intentions={enemyIntentions} />
)}
```

- [ ] **Step 3: Verify by entering combat in-game**

Start a campaign, get into combat, check that enemy intentions render.

- [ ] **Step 4: Commit**

```
git add src/components/game/EnemyIntentions.tsx app/game/session.tsx
git commit -m "feat: add enemy intentions UI for combat mode"
```

---

### Task 8: Camp Screen

**Files:**
- Create: `app/game/camp.tsx`
- Modify: `app/game/_layout.tsx`
- Modify: `app/game/session.tsx`
- Modify: `supabase/functions/game-turn/index.ts`

- [ ] **Step 1: Add camp route to game layout**

In `app/game/_layout.tsx`, ensure the Stack includes a `camp` screen.

- [ ] **Step 2: Create `app/game/camp.tsx`**

Camp screen UI:
- Warm amber background gradient
- Header: "CAMP" with location subtitle
- Companion portraits in a row around center (campfire emoji or icon)
- Exclamation mark badge on companions with queued conversations (based on approval milestones)
- Activity buttons at bottom:
  - Talk (speech icon) — shows companion picker, then calls game-turn with "Talk to [name]"
  - Rest (moon icon) — calls game-turn with "[LONG REST]"
  - Banter (two-people icon) — calls game-turn with "Watch companion banter"
  - Explore (eye icon) — calls game-turn with "Explore the camp"
  - Journal (book icon) — navigates to journal screen
  - Break Camp (arrow icon) — navigates back to session
- Each activity (except Journal and Break Camp) sends a game-turn call with `mode: "camp"` context
- Response displays in a narrative area within the camp screen

- [ ] **Step 3: Add "Make Camp" to session menu**

In `session.tsx`, add a "Make Camp" option to the kebab menu modal. On press, navigate to `/game/camp`.

- [ ] **Step 4: Add long rest interception in game-turn**

In `game-turn/index.ts`, before calling Claude, check if action is `"[LONG REST]"`:
```typescript
if (action === '[LONG REST]') {
  // Restore HP to max
  await adminClient.from('characters').update({ hp: character.max_hp }).eq('id', character.id);
  // Inject result into Claude prompt
  cleanAction = 'The party takes a long rest.';
  preRolledResults = ['MECHANICAL RESULT: Long rest complete. All HP restored.'];
}
```

- [ ] **Step 5: Update `last_session_at` on every game-turn**

Add to the campaign update object: `last_session_at: new Date().toISOString()`

- [ ] **Step 6: Deploy game-turn and commit**

```
npx supabase functions deploy game-turn --no-verify-jwt
git add app/game/camp.tsx app/game/_layout.tsx app/game/session.tsx supabase/functions/game-turn/index.ts
git commit -m "feat: add camp screen with rest, talk, banter, explore activities"
```

---

## Chunk 4: Threshold / Death Screen

### Task 9: Death Detection in Game-Turn

**Files:**
- Modify: `supabase/functions/game-turn/index.ts`

- [ ] **Step 1: Add death detection after HP changes**

After the existing HP update logic (around line 385-394), add:
```typescript
// Check for player death
if (normalized.stateChanges) {
  for (const change of normalized.stateChanges) {
    if (change.type === 'hp' && change.target === character.name) {
      const newHp = Math.max(0, Math.min(character.max_hp, character.hp + Number(change.value)));
      if (newHp <= 0) {
        // Player has died — trigger threshold
        const deathRecord = {
          turn: campaign.turn_count + 1,
          cause: action.substring(0, 200),
          location: campaign.current_location,
          companionsPresent: (campaign.companions || []).map((c: any) => c.name),
        };
        const newDeathCount = (campaign.death_count || 0) + 1;
        const deathHistory = [...(campaign.death_history || []), deathRecord];

        // Check for new threshold unlocks
        const DEATH_UNLOCK_THRESHOLDS = [
          { death: 1, unlock: 'threshold_access' },
          { death: 2, unlock: 'keeper_lore_1' },
          { death: 3, unlock: 'spectral_gift' },
          { death: 5, unlock: 'death_defiance' },
          { death: 7, unlock: 'keeper_quest' },
          { death: 10, unlock: 'threshold_companion' },
        ];
        const existingUnlocks = campaign.threshold_unlocks || [];
        const newUnlocks = DEATH_UNLOCK_THRESHOLDS
          .filter(t => newDeathCount >= t.death && !existingUnlocks.includes(t.unlock))
          .map(t => t.unlock);
        const allUnlocks = [...existingUnlocks, ...newUnlocks];

        // Update campaign with death data
        campaignUpdates.death_count = newDeathCount;
        campaignUpdates.death_history = deathHistory;
        campaignUpdates.threshold_unlocks = allUnlocks;
        campaignUpdates.current_mode = 'threshold';

        // Override response mode
        normalized.mode = 'threshold';

        // Add death metadata to response
        deathMeta = { deathCount: newDeathCount, newUnlocks, deathRecord };
      }
    }
  }
}
```

- [ ] **Step 2: Return death metadata in response**

Add `deathMeta` to the response JSON if present:
```typescript
return new Response(JSON.stringify({
  aiResponse: normalized,
  diceResults,
  diceRollResults: structuredResults || [],
  companions: updatedCompanions,
  turnCount: campaign.turn_count + 1,
  ...(deathMeta ? { deathMeta } : {}),
}), { ... });
```

- [ ] **Step 3: Deploy and commit**

```
npx supabase functions deploy game-turn --no-verify-jwt
git add supabase/functions/game-turn/index.ts
git commit -m "feat: add server-side death detection with threshold unlocks"
```

---

### Task 10: Threshold Screen

**Files:**
- Create: `app/game/threshold.tsx`
- Modify: `app/game/_layout.tsx`
- Modify: `app/game/session.tsx`
- Modify: `src/stores/useGameStore.ts`

- [ ] **Step 1: Add death handling to game store**

In `useGameStore.ts`, add to `GameState`:
```typescript
deathMeta: { deathCount: number; newUnlocks: string[]; deathRecord: any } | null;
setDeathMeta: (meta: any) => void;
clearDeathMeta: () => void;
```

Update `processAIResponse` to check if mode is `'threshold'` — if so, the session screen should navigate to threshold.

- [ ] **Step 2: Add threshold route to game layout**

In `app/game/_layout.tsx`, add threshold screen to the Stack.

- [ ] **Step 3: Create `app/game/threshold.tsx`**

Threshold screen UI:
- Dark purple/black background with subtle fog-like gradient
- "The darkness takes you..." fade-in text on first load
- After fade: The Keeper's greeting (from Claude via game-turn with mode threshold)
- Death count: "Visit #N" in subtle text
- New unlocks shown with gold animation
- Activity choices rendered as ChoiceButtons (Talk to Keeper, Explore, Return)
- Each choice sends a game-turn with mode locked to "threshold"
- "Return to the world" choice navigates back to session, mode resets to exploration

- [ ] **Step 4: Add death routing in session.tsx**

In `handleChoicePress` and `handleFreeformSubmit`, after processing the response:
```typescript
if (result.deathMeta) {
  store.setDeathMeta(result.deathMeta);
  router.push('/game/threshold');
  return;
}
```

- [ ] **Step 5: Commit**

```
git add app/game/threshold.tsx app/game/_layout.tsx app/game/session.tsx src/stores/useGameStore.ts
git commit -m "feat: add threshold death screen with Keeper, unlocks, and return flow"
```

---

## Chunk 5: Session Recaps + Journal

### Task 11: Session Recap Edge Function

**Files:**
- Create: `supabase/functions/session-recap/index.ts`
- Modify: `src/services/campaign.ts`

- [ ] **Step 1: Implement the session-recap edge function**

```typescript
// Fetches recent turn history, calls Haiku for a dramatic recap
// Input: { campaignId: string }
// Output: { recap: string }
```

- Uses same auth pattern as game-turn
- Fetches campaign, extracts last 10 turns from turn_history
- Calls `claude-haiku-4-5-20251001` with recap prompt
- Returns `{ recap: string }`

- [ ] **Step 2: Add `getSessionRecap` to `src/services/campaign.ts`**

```typescript
export async function getSessionRecap(campaignId: string): Promise<string> {
  const result = await invokeEdgeFunction<{ recap: string }>('session-recap', { campaignId }, 'Recap failed');
  return result.recap;
}
```

Update `invokeEdgeFunction` to accept `'session-recap'` in the union type.

- [ ] **Step 3: Deploy and commit**

```
npx supabase functions deploy session-recap --no-verify-jwt
git add supabase/functions/session-recap/ src/services/campaign.ts
git commit -m "feat: add session-recap edge function using Haiku"
```

---

### Task 12: Recap Screen UI

**Files:**
- Create: `app/game/recap.tsx`
- Modify: `app/game/_layout.tsx`
- Modify: `app/game/session.tsx` or campaign loading logic

- [ ] **Step 1: Create `app/game/recap.tsx`**

Full-screen recap display:
- Dark background
- "Previously on..." header in Cinzel gold, centered
- Recap text in IM Fell English with typewriter effect (reuse NarrativeText component)
- "Continue your adventure" button at bottom (gold, primary action)
- "Skip" text button in top-right corner
- On continue/skip: navigate to `/game/session`

- [ ] **Step 2: Add recap route to game layout**

- [ ] **Step 3: Trigger recap on campaign load**

When loading an existing campaign, check `campaign.lastSessionAt`:
- If > 1 hour ago: navigate to `/game/recap` first, passing `campaignId`
- Recap screen fetches recap, displays it, then navigates to session
- If < 1 hour: go directly to session

- [ ] **Step 4: Commit**

```
git add app/game/recap.tsx app/game/_layout.tsx
git commit -m "feat: add session recap screen with typewriter narration"
```

---

### Task 13: Journal — Server-Side Write + Prompts

**Files:**
- Modify: `supabase/functions/game-turn/index.ts`
- Modify: `supabase/functions/_shared/prompts.ts`
- Modify: `supabase/functions/_shared/ai-parser.ts`

- [ ] **Step 1: Add journal prompt section**

In `prompts.ts`, add to the system prompt:
```
JOURNAL ENTRIES:
When something notable happens (NPC met, quest accepted, location discovered, lore learned,
major decision, combat outcome, companion event), include a "journal_entries" array with 1-2 entries:
[{"entry_type": "npc_met", "title": "Met the Blacksmith", "description": "...", "related_npcs": ["Gareth"], "related_locations": ["Copperwall"]}]
Only log meaningful moments, not every turn.
```

- [ ] **Step 2: Add `journal_entries` normalization to ai-parser**

In `normalizeResponse` / `mapResponseKeys`, map `journal_entries` → `journalEntries`.

- [ ] **Step 3: Write journal entries to Supabase in game-turn**

After normalizing the response, if `journalEntries` is present and non-empty:
```typescript
if (normalized.journalEntries && normalized.journalEntries.length > 0) {
  for (const entry of normalized.journalEntries) {
    await adminClient.from('journal_entries').insert({
      campaign_id: campaignId,
      turn_number: campaign.turn_count + 1,
      entry_type: entry.entryType || entry.entry_type,
      title: entry.title,
      description: entry.description,
      tags: [entry.entryType || entry.entry_type],
      related_npcs: entry.relatedNpcs || entry.related_npcs || [],
      related_locations: entry.relatedLocations || entry.related_locations || [],
    });
  }
}
```

- [ ] **Step 4: Deploy and commit**

```
npx supabase functions deploy game-turn --no-verify-jwt
git add supabase/functions/
git commit -m "feat: auto-journal entries written to Supabase from game-turn"
```

---

### Task 14: Journal Screen UI

**Files:**
- Create: `app/game/journal.tsx`
- Modify: `app/game/_layout.tsx`
- Modify: `app/game/session.tsx`
- Modify: `src/services/campaign.ts`

- [ ] **Step 1: Add journal query to `src/services/campaign.ts`**

```typescript
export async function getJournalEntries(campaignId: string, filter?: string): Promise<JournalRow[]> {
  let query = supabase
    .from('journal_entries')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: false });
  if (filter && filter !== 'all') {
    query = query.eq('entry_type', filter);
  }
  const { data, error } = await query;
  if (error) throw new Error(`Journal fetch failed: ${error.message}`);
  return data || [];
}
```

- [ ] **Step 2: Create `app/game/journal.tsx`**

Journal screen:
- Header: "JOURNAL" with back button
- Filter tabs: All | NPCs | Quests | Locations | Lore | Decisions (horizontal scroll)
- FlatList of journal entries, each as a parchment-styled card:
  - Type icon (emoji based on entry_type) + title (bold, Cinzel)
  - "Turn N" subtitle in gold
  - Description text (Crimson Text)
  - Related NPC/location tags as small gold pills
- Pull to refresh
- Empty state: "Your journal is empty. Notable events will be recorded here."

- [ ] **Step 3: Add journal route to game layout**

- [ ] **Step 4: Add "Journal" to session menu**

Add to the kebab menu in `session.tsx`:
```tsx
<Pressable style={styles.modalOption} onPress={() => { setMenuVisible(false); router.push('/game/journal'); }}>
  <Text style={styles.modalOptionText}>Journal</Text>
  <Text style={styles.modalOptionDesc}>View your adventure log</Text>
</Pressable>
```

- [ ] **Step 5: Commit**

```
git add app/game/journal.tsx app/game/_layout.tsx app/game/session.tsx src/services/campaign.ts
git commit -m "feat: add journal screen with filtering and parchment-styled entries"
```

---

## Chunk 6: Adventure Map

### Task 15: Adventure Map Screen

**Files:**
- Create: `app/game/map.tsx`
- Modify: `app/game/_layout.tsx`
- Modify: `app/game/session.tsx`
- Modify: `supabase/functions/_shared/prompts.ts`
- Modify: `src/stores/useGameStore.ts`

- [ ] **Step 1: Add map generation prompt to `prompts.ts`**

Add a prompt section for generating adventure maps:
```
ADVENTURE MAP GENERATION:
When starting a new chapter, generate an adventure map as JSON in the "adventure_map" field:
{
  "chapterTitle": "The Sunken Crypts",
  "nodes": [
    {"id": "n1", "type": "combat", "connections": ["n2", "n3"], "completed": false, "difficulty": 1, "teaser": "Goblins block the path", "icon": "⚔️"},
    ...
  ],
  "currentNodeId": "n1"
}
Rules:
- 8-12 nodes per chapter, branching (2-3 choices at each fork)
- End with a boss node
- Include variety: combat, rest, merchant, mystery, social nodes
- [If discover mode]: Include 1 companion node for unrecruited companions
```

- [ ] **Step 2: Add map state to game store**

In `useGameStore.ts`, add:
```typescript
showMap: boolean;
setShowMap: (show: boolean) => void;
```

In `processAIResponse`, if `response.adventureMap` is present, update `campaign.adventureMap`.

- [ ] **Step 3: Create `app/game/map.tsx`**

Adventure map screen:
- Vertical ScrollView, nodes arranged bottom to top
- Each node: circular 48px container with type emoji icon
- Node colors: gold border for available (connected to current), grey for locked, dim for completed
- Current node: gold glow pulse animation (Reanimated)
- Connection lines drawn between nodes (simple View lines or SVG if needed)
- Tap available node → confirmation modal ("Travel to [teaser]?") → on confirm, send game-turn with `"Travel to node [id]: [teaser]"`
- Header: chapter title in Cinzel
- Back button returns to session

- [ ] **Step 4: Add map route to layout and session**

Add map to `_layout.tsx`. Add "View Map" button to session header or menu.

- [ ] **Step 5: Handle map node completion in game-turn**

In `game-turn/index.ts`, when the action references a map node:
- Mark node as `completed: true` in `adventure_map`
- Update `currentNodeId` to the selected node
- Save updated map to campaign

- [ ] **Step 6: Deploy and commit**

```
npx supabase functions deploy game-turn --no-verify-jwt
git add app/game/map.tsx app/game/_layout.tsx app/game/session.tsx src/stores/useGameStore.ts supabase/functions/
git commit -m "feat: add adventure map with node navigation and chapter progression"
```

---

## Chunk 7: Integration, Polish, Final Deploy

### Task 16: Wire Everything Together

**Files:**
- Modify: `app/game/session.tsx`
- Modify: `src/stores/useGameStore.ts`

- [ ] **Step 1: Update `processAIResponse` in store for all new fields**

Handle: `companionEncounter`, `journalEntries`, `adventureMap` from AI responses. Update campaign state accordingly.

- [ ] **Step 2: Add routing logic in session.tsx**

- If `currentMode === 'threshold'` and `deathMeta` present → navigate to threshold
- If `currentMode === 'camp'` → navigate to camp (or show camp suggestion)
- If `campaign.adventureMap` exists and map should be shown → navigate to map

- [ ] **Step 3: Test full flow manually**

1. Create new campaign in "Discover" mode → verify companions not in party
2. Play turns → verify companion encounter appears at milestone
3. Enter combat → verify enemy intentions render
4. Make camp → verify camp screen works with rest/talk/banter
5. Die → verify threshold screen with Keeper and unlocks
6. Return from threshold → verify consequences
7. Close app, reopen → verify session recap plays
8. Check journal → verify entries logged

- [ ] **Step 4: Final commit**

```
git add -A
git commit -m "feat: wire companion recruitment, camp, threshold, journal, map, and recap together"
```

---

### Task 17: Deploy All Edge Functions + Push

- [ ] **Step 1: Deploy all edge functions**

```bash
npx supabase functions deploy game-turn --no-verify-jwt
npx supabase functions deploy campaign-init --no-verify-jwt
npx supabase functions deploy session-recap --no-verify-jwt
```

- [ ] **Step 2: Push to remote**

```bash
git push
```

- [ ] **Step 3: Verify on device**

Test all features on the device when back on Wi-Fi.
