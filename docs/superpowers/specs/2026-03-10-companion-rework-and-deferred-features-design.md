# Companion Rework + Deferred Features Design

## Overview

Rework the companion system to support recruitment throughout gameplay (BG3-inspired) and implement 6 deferred features: camp screen, enemy intentions UI, threshold/death screen, session recaps, journal/auto-journaling, and adventure map.

---

## 1. Companion System Rework

### Recruitment Modes

At campaign start, player chooses:
- **"Choose my party"** — Pick 3 companions from roster, all join immediately (current flow)
- **"Discover along the way"** — Player browses the full roster and picks 3-4 companions they want to *eventually* meet. These go into `companion_pool` as unrecruited. Claude introduces them at milestones. Alternatively, player can tap "Let fate decide" and Claude picks from the roster.

### Discover Mode — Creation UI Flow (`app/create/companions.tsx`)

1. New screen before companion selection: "How do you want to meet your companions?"
   - "Choose my party" → existing flow (pick 3, all join immediately)
   - "Discover along the way" → modified selection flow
2. In Discover mode, companion selection screen changes:
   - Header: "Choose who fate will bring to you" (or similar)
   - Player picks 3-4 companions from roster (or taps "Let fate decide")
   - Selection cap becomes 4 (not 3) to account for potential rejections
   - "Let fate decide" button: randomly picks 3-4 and also lets Claude generate 1-2 custom ones
3. `canContinue` gate changes: `selectedCompanions.length >= 3 && selectedCompanions.length <= 4`
4. Campaign init receives `recruitmentMode: 'choose' | 'discover'` in the request body

### Companion Pool

- **13 pre-built companions** — one per D&D 5e class (Fighter, Rogue, Druid, Barbarian, Bard, Cleric, Monk, Paladin, Ranger, Sorcerer, Warlock, Wizard, Artificer)
- Each has: name, personality, approval triggers, backstory, abilities, voice. Player can rename and change appearance (name + appearance only, personality locked).
- **1-2 AI-generated companions** per campaign — Claude creates custom companions during campaign-init in Discover mode. Generated companions must match the `CompanionPoolEntry` shape.
- Pre-built roster expanded from current 3 (Korrin, Sera, Thaelen) to 13

### Type Definitions

```typescript
// New type extending CompanionData
interface CompanionPoolEntry extends CompanionData {
  recruited: boolean;      // Has the player accepted them into the party?
  introduced: boolean;     // Has Claude introduced them in the narrative?
  aiGenerated: boolean;    // Was this companion created by Claude?
  introductionTurn?: number; // Target turn for Claude to introduce them (milestone)
}

// New AI response field
interface CompanionEncounter {
  companionName: string;   // Must match a name in companion_pool
  hook: string;            // Brief description of the encounter situation
  miniQuestHint: string;   // What the player needs to do to earn recruitment
}

// Added to AIResponse
companionEncounter?: CompanionEncounter;
```

### Data Model Changes

- `campaign.companion_pool` (new JSONB column) — array of `CompanionPoolEntry`. All companions available for this campaign.
- `campaign.recruitment_mode` (new TEXT column) — `'choose'` or `'discover'`
- `campaign.companions` — remains the active party array (recruited companions only)
- Campaign init prompt includes the full pool with milestone turns: "Introduce [name] around turn [N]"

### Recruitment Flow

1. Claude narrates finding the companion in a situation (encounter) — returns `companionEncounter` in AI response
2. Server-side: `game-turn` detects `companionEncounter`, marks companion as `introduced: true` in `companion_pool`
3. Player helps them with a mini-quest (1-2 turns)
4. Player gets choice: "Invite them to join" / "Part ways" (may involve skill check)
5. If recruited: server moves companion from `companion_pool` to `companions` array, sets `recruited: true`
6. If rejected: Claude can re-introduce them later in a different context, or they become a recurring NPC

### AI-Generated Companions

- When mode is "Discover," Claude generates 1-2 custom companions during campaign-init
- Campaign-init prompt includes: "Generate 1-2 additional companions that fit this campaign's theme. Return them in the `generated_companions` field matching the CompanionPoolEntry schema."
- Generated companions are added to `companion_pool` with `aiGenerated: true`

### `artificer` Class Addition

Add `'artificer'` to the `ClassName` union in both `src/types/game.ts` and `supabase/functions/_shared/types.ts`. Define default stats (HP: 8+CON, AC: 12, proficiency bonus +2, abilities: Flash of Genius, Infuse Item).

---

## 2. Camp Screen

### Triggers

- Player taps "Make Camp" from game session menu
- Auto-suggested by Claude after 3-4 encounters or major story beats
- After boss fights
- When HP is critically low

### UI: `app/game/camp.tsx`

- Warm amber background (mood shift from dungeon/combat)
- Campfire center, companion portraits arranged around it
- Companions with queued conversations show exclamation mark (BG3-style)
- Activity buttons at bottom
- Only recruited companions appear at camp

### Activities

- **Talk to companion** — Approval-gated dialogue. Low approval = terse. High approval = personal quest triggers, backstory.
- **Rest** — Long rest, full HP/spell slot recovery (see mechanical trigger below)
- **Companion banter** — Two companions talk to each other. Player observes.
- **Explore camp** — Random event: visitor, omen, discovery
- **Journal** — Navigate to journal screen

### Long Rest Mechanical Trigger

Selecting "Rest" sends `game-turn` with action `"[LONG REST]"`. The `game-turn` edge function intercepts this action string *before* calling Claude:
1. Set character HP to `max_hp` in the characters table
2. Reset spell slots (when spell system is implemented)
3. Include `[GAME ENGINE RESULTS]\nLong rest complete. All HP restored. Spell slots refreshed.` in the Claude prompt
4. Claude narrates the rest scene (dawn breaking, companions stirring, etc.)

This follows the architecture rule: engine does mechanics, Claude narrates.

### Implementation

- Enter camp by sending `game-turn` with action `"Make camp"` and current mode set to `"camp"`
- Claude returns camp scene + available activities based on companion states
- Each activity is a follow-up turn within camp mode
- Exit via "Break Camp" / "Set Out" — mode returns to previous mode

---

## 3. Enemy Intentions UI

### Component: `src/components/game/EnemyIntentions.tsx`

Data already flows — `enemyIntentions` array is parsed and stored in `useGameStore`. Needs rendering.

- Appears above choice area during combat mode only
- Each enemy row: name → arrow icon → target + intended action
- Predicted damage in red, special effects as small badges
- Subtle pulse animation on the row
- Only renders when `currentMode === 'combat'` and `enemyIntentions.length > 0`
- Sits between narrative area and choice buttons in session.tsx

---

## 4. Threshold / Death Screen

### Trigger

Player character dies (HP 0 + failed death saves, or TPK).

### Death Detection — Server-Side (`game-turn`)

Death detection is fully owned by the `game-turn` edge function (per architecture rule 2: "Supabase stores ALL persistent state"):

1. After applying HP changes from `state_changes`, check if character HP <= 0
2. If dead:
   - Increment `campaign.death_count`
   - Append to `campaign.death_history`: `{ turn, cause, location, companionsPresent }`
   - Evaluate `threshold_unlocks`: check `death_count` against unlock thresholds, grant any new unlocks
   - Override response mode to `"threshold"`
   - Return: `{ mode: "threshold", deathCount: N, newUnlocks: string[], deathRecord: {...} }`
3. Claude is NOT called again for the death turn — the client handles the transition
4. TPK handling: if all companion HP <= 0 AND player HP <= 0, same flow applies

### Flow

1. `game-turn` returns `mode: "threshold"` + death metadata
2. Client shows fade-to-black transition → "The darkness takes you..."
3. Navigate to `app/game/threshold.tsx`
4. First turn in Threshold calls `game-turn` with mode `"threshold"` — Claude generates the Keeper scene using existing mode instructions

### UI: `app/game/threshold.tsx`

- Dark ethereal atmosphere — deep purples, dim fog
- The Keeper (mysterious NPC) greets player, references how they died specifically
- Companions present, react per personality
- Actions: Talk to Keeper, Explore Threshold, Return to world
- Death count displayed subtly ("Visit #N")
- New unlocks shown with a subtle gold reveal animation

### Death Progression Unlocks

Stored in `campaign.threshold_unlocks`:
- Death 1: Threshold access
- Death 2: Keeper reveals world lore
- Death 3: Spectral Candle item
- Death 5: Death Defiance (cheat death once)
- Death 7: Keeper's personal quest
- Death 10: Ghostly companion recruitable

### Return to World

- When player chooses "Return," next `game-turn` call sets mode back to `"exploration"`
- Claude narrates the return with consequences (time has passed, world moved forward)
- Character HP restored to 1 (or more if Death Defiance unlocked)

---

## 5. Session Recaps

### Trigger

Player opens existing campaign after being away > 1 hour. Skippable. Can disable in settings.

### `last_session_at` Tracking

- Add `last_session_at TIMESTAMPTZ` column to campaigns table (included in migration)
- Updated server-side by `game-turn` on every turn (set to `NOW()`)
- Client checks `campaign.last_session_at` on load — if > 1 hour ago, show recap
- This survives app reinstalls and device changes since it's server-side

### Edge Function: `supabase/functions/session-recap/index.ts`

- Takes `campaignId`, fetches campaign with `turn_history` (last 10-15 turns)
- Calls Claude Haiku (`claude-haiku-4-5-20251001`, ~$0.003 per recap)
- Prompt: "Summarize these events as a dramatic 'Previously on...' narration in 3-4 sentences. Focus on: the last major decision, current threat, and emotional state of the party. Second person, vivid but concise."
- Returns `{ recap: string }`

### UI

- Full screen, dark background
- "Previously on..." header in Cinzel gold
- Recap text in narrative font (IM Fell English) with typewriter effect
- "Continue your adventure" button at bottom
- Skip button in top corner

---

## 6. Journal / Auto-Journaling

### Type Definition

```typescript
interface JournalEntry {
  entryType: 'npc_met' | 'quest_accepted' | 'quest_completed' | 'location_discovered'
    | 'item_found' | 'lore_learned' | 'decision_made' | 'companion_event'
    | 'combat_victory' | 'combat_defeat';
  title: string;          // "Met the Blacksmith of Copperwall"
  description: string;    // 2-3 sentences
  relatedNpcs?: string[]; // NPC names
  relatedLocations?: string[]; // Location names
}
```

Added to `AIResponse` as `journalEntries?: JournalEntry[]`.

### Entry Creation — Server-Side Write Path

1. After each `game-turn`, Claude may include `journal_entries` in its response (0-2 entries)
2. `normalizeResponse` maps `journal_entries` / `journalEntries` to the normalized field
3. `game-turn` edge function writes entries to the `journal_entries` Supabase table after normalizing:
   - `campaign_id`, `turn_number` (current turn count), `entry_type`, `title`, `description`, `tags` (derived from entry type), `related_npcs`, `related_locations`
4. Entries are also returned in the response so the client can show a brief toast ("Journal updated: Met the Blacksmith")

### Existing Table Schema (`journal_entries`)

```sql
id UUID PRIMARY KEY, campaign_id UUID, turn_number INTEGER,
entry_type TEXT, title TEXT, description TEXT,
tags JSONB DEFAULT '[]', related_npcs JSONB DEFAULT '[]',
related_locations JSONB DEFAULT '[]', is_pinned BOOLEAN DEFAULT false,
created_at TIMESTAMPTZ DEFAULT NOW()
```

### UI: `app/game/journal.tsx`

- Accessible from game session menu (kebab menu)
- Filter tabs: All | NPCs | Quests | Locations | Lore | Decisions
- Parchment-styled cards: title (bold), turn number, type icon, description, related tags
- Newest first, pinnable entries, keyword search

### Prompt Addition

- `JOURNAL` section in system prompt: "When something notable happens (NPC met, quest accepted, location discovered, lore learned, major decision, combat outcome), include a `journal_entries` array with 1-2 entries. Only log meaningful moments."
- Include the `JournalEntry` schema in the JSON schema section of the prompt

---

## 7. Adventure Map (Slay the Spire)

### When Shown

- At the start of each campaign chapter (every 8-12 turns)
- After completing an encounter node
- Player picks next node → Claude generates encounter

### Map Generation

- Claude generates map structure as JSON at chapter start (via `game-turn` when chapter transitions)
- 8-12 nodes per chapter, branching paths (2-3 choices at each fork)
- Chapter ends at boss node

### Node Types

Update `MapNodeType` in `src/types/game.ts`:
```typescript
export type MapNodeType =
  | 'combat' | 'elite' | 'boss' | 'rest'
  | 'merchant' | 'mystery' | 'social' | 'treasure'
  | 'companion';  // NEW — recruitment encounter in Discover mode
```

- Combat (sword) — Standard encounter
- Elite (skull) — Harder fight, better rewards
- Boss (crown) — Chapter-ending
- Rest (campfire) — Triggers camp screen
- Merchant (coin) — Buy/sell/trade
- Mystery (?) — Puzzle, dilemma, vision, strange NPC
- Social (speech) — Roleplay/dialogue
- Treasure (chest) — Loot/reward (kept from existing type)
- Companion (star) — Recruitment encounter (Discover mode only)

### UI: `app/game/map.tsx`

- Vertical scroll, bottom to top (like Slay the Spire)
- Circular node icons with type emoji
- Gold lines for available paths, grey for locked/future
- Current position with glow pulse animation
- Completed nodes dimmed
- Tap connected node → confirmation → Claude generates encounter

### Data

- `campaign.adventure_map` (JSONB, field already exists)
- Stores: nodes array, connections, current position, chapter title

### Companion Integration with Map

- In Discover mode, Claude places companion nodes on the map during chapter generation
- The map generation prompt includes the `companion_pool` (unrecruited, unintroduced companions) so Claude knows who to place
- Companion nodes are optional paths — player can skip them
- **Skipped companions are NOT permanently lost** — Claude re-introduces them in a later chapter's map. A companion is only permanently missable if the player rejects them during the recruitment mini-quest.
- `companion_pool` is injected into `buildSystemPrompt` so Claude always knows which companions remain available

---

## Summary of New/Modified Files

### New Files
- `src/data/companions.ts` — 13 pre-built companion definitions (full personality, abilities, approval triggers)
- `src/components/game/EnemyIntentions.tsx` — Combat intention display
- `app/game/camp.tsx` — Camp screen
- `app/game/threshold.tsx` — Death/Threshold screen
- `app/game/journal.tsx` — Journal screen
- `app/game/map.tsx` — Adventure map screen
- `supabase/functions/session-recap/index.ts` — Recap edge function

### Modified Files
- `app/create/companions.tsx` — Add recruitment mode choice screen, expand roster, Discover mode UI
- `app/game/session.tsx` — Add EnemyIntentions, camp/threshold/map routing, journal menu entry
- `app/game/_layout.tsx` — Add routes for camp, threshold, journal, map
- `supabase/functions/campaign-init/index.ts` — Handle companion pool, discover mode, recruitment_mode, AI-generated companions
- `supabase/functions/game-turn/index.ts` — Handle companion_encounter, journal_entries write, death detection, long rest interception, map progression, companion_pool updates
- `supabase/functions/_shared/prompts.ts` — Add journal prompt, companion recruitment prompt, map generation prompt, companion_pool injection, updated JSON schema
- `supabase/functions/_shared/ai-parser.ts` — Add normalization for companionEncounter, journalEntries
- `supabase/functions/_shared/types.ts` — Add CompanionPoolEntry, artificer to ClassName, companion to MapNodeType
- `src/stores/useGameStore.ts` — Add companion pool state, map state, journal state, death handling, threshold routing
- `src/types/game.ts` — Add CompanionPoolEntry, CompanionEncounter, JournalEntry, artificer to ClassName, companion to MapNodeType, companionEncounter + journalEntries to AIResponse
- `src/services/campaign.ts` — Add session-recap caller, journal queries

### Database Migration
- Add `companion_pool` JSONB column to campaigns table
- Add `recruitment_mode` TEXT column to campaigns table (default: `'choose'`)
- Add `last_session_at` TIMESTAMPTZ column to campaigns table (default: `NOW()`)
