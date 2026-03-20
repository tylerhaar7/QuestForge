# Phase 5: D&D 5e Level-Up System + Loot Reveal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete D&D 5e level-up experience with ASI/feat selection, subclass choice, spell learning, animated ceremony, and loot reveal overlays.

**Architecture:** Level-up flow is triggered when the server returns `levelUpMeta` after a turn. The client presents an animated ceremony overlay, then walks the player through choices (ASI/feat, new spells, subclass at level 3). Choices persist to Supabase via the character record. Loot reveal triggers on item state changes. All UI uses Reanimated for animations, matching the existing dark fantasy design system.

**Tech Stack:** React Native + Expo, TypeScript, Reanimated 4, Zustand, Supabase, expo-linear-gradient, expo-haptics

---

## File Structure

### New Files
| File | Responsibility |
|------|---------------|
| `src/data/levelUpFeats.ts` | General feats available at ASI levels (not origin feats) |
| `src/data/subclasses.ts` | Subclass definitions per class (research agent building) |
| `src/data/spellProgression.ts` | Spell learning rules per class per level (already built by research agent) |
| `src/engine/levelUp.ts` | Determine what choices are available at a given level/class |
| `app/game/level-up.tsx` | Level-up screen with animated ceremony + interactive choices |
| `src/components/animations/LootReveal.tsx` | Animated item drop overlay |
| `src/components/animations/StatTicker.tsx` | Animated number counter (old -> new) for stat reveals |

### Modified Files
| File | Changes |
|------|---------|
| `src/types/game.ts` | Add `LevelUpChoices` type, expand `LevelUpMeta` |
| `src/stores/useGameStore.ts` | Add `pendingLootItems`, loot queue actions |
| `src/services/campaign.ts` | Add `saveLevelUpChoices()` to persist ASI/feat/spell/subclass to Supabase |
| `supabase/functions/_shared/progression.ts` | Expand `getLevelUpChanges` to include ASI levels, subclass level |
| `supabase/functions/game-turn/index.ts` | Include richer `levelUpMeta` (available choices, ASI flag, subclass flag) |
| `app/game/session.tsx` | Render level-up screen on `levelUpMeta`, render LootReveal, wire loot queue |

---

## Task 1: General Feats Data

**Files:**
- Create: `src/data/levelUpFeats.ts`

- [ ] **Step 1: Create general feats file**

~20 feats available at ASI levels (4, 8, 12, 16, 19). Same `FeatData` interface from existing `feats.ts`. Include: Great Weapon Master, Sharpshooter, War Caster, Resilient, Sentinel, Polearm Master, Crossbow Expert, Shield Master, Spell Sniper, Defensive Duelist, Dual Wielder, Heavy Armor Master, Mage Slayer, Mobile, Observant, Ritual Caster, Actor, Athlete, Charger, Inspiring Leader.

Export `LEVEL_UP_FEATS: FeatData[]` and `getFeatsForClass(className: string): FeatData[]` (filters to feats the class can use, e.g., War Caster requires spellcasting).

- [ ] **Step 2: Verify types compile**

Run: `node node_modules/typescript/bin/tsc --noEmit 2>&1 | grep levelUpFeats`

---

## Task 2: Level-Up Engine

**Files:**
- Create: `src/engine/levelUp.ts`

- [ ] **Step 1: Build the level-up choice resolver**

This module determines what choices a player has at each level:

```typescript
interface LevelUpChoices {
  asiAvailable: boolean;        // Can pick ASI (+2/+1+1) or feat
  subclassAvailable: boolean;   // Level 3 for most classes
  subclassLevel: number;        // What level subclass is chosen
  newSpells: {                  // From spellProgression.ts
    canLearnNew: boolean;
    newSpellCount: number;
    canSwap: boolean;
    maxNewSpellLevel: number;
  } | null;
  newFeatures: string[];        // Class features gained at this level (narrative)
}

function getLevelUpChoices(className: string, newLevel: number, abilityMod: number): LevelUpChoices
```

ASI levels per class:
- Most classes: [4, 8, 12, 16, 19]
- Fighter: [4, 6, 8, 12, 14, 16, 19]
- Rogue: [4, 8, 10, 12, 16, 19]

Uses `getNewSpellsOnLevelUp()` from `spellProgression.ts` and `SUBCLASS_SELECTION_LEVEL` from `subclasses.ts`.

- [ ] **Step 2: Verify types compile**

---

## Task 3: Expand LevelUpMeta & Types

**Files:**
- Modify: `src/types/game.ts`
- Modify: `src/services/campaign.ts`

- [ ] **Step 1: Expand LevelUpMeta in campaign.ts**

Add to `LevelUpMeta`:
```typescript
newMaxSpellSlots?: number[];
asiAvailable?: boolean;
subclassAvailable?: boolean;
```

- [ ] **Step 2: Add LevelUpChoices type to game.ts**

```typescript
interface LevelUpPlayerChoices {
  asiChoice?: { type: 'asi'; abilities: Partial<Record<AbilityScore, number>> }
            | { type: 'feat'; featId: string };
  subclassId?: string;
  newSpells?: string[];      // spell IDs learned
  swappedSpell?: { old: string; new: string };
}
```

- [ ] **Step 3: Verify types compile**

---

## Task 4: Save Level-Up Choices Service

**Files:**
- Modify: `src/services/campaign.ts`

- [ ] **Step 1: Add saveLevelUpChoices function**

Persists player choices to Supabase `characters` table:
- If ASI: update `ability_scores` (+2 to one or +1 to two)
- If feat: update `feat_data` with new feat, add to `features` array
- If subclass: update `subclass` field
- If new spells: append to `known_spells`
- If spell swap: replace in `known_spells`

Uses `supabase.from('characters').update(...)`.

- [ ] **Step 2: Verify types compile**

---

## Task 5: StatTicker Animation Component

**Files:**
- Create: `src/components/animations/StatTicker.tsx`

- [ ] **Step 1: Build the animated stat counter**

Props: `{ label: string, oldValue: number, newValue: number, delay?: number, color?: string }`

Animates the displayed number from `oldValue` to `newValue` at 50ms per tick (from `REWARDS.LEVEL_UP_STAT_TICK`). Uses `useSharedValue` + `useDerivedValue` to interpolate the number. Haptic tick on each value change. Cinzel heading font, gold color for the number.

- [ ] **Step 2: Verify types compile**

---

## Task 6: Level-Up Screen

**Files:**
- Create: `app/game/level-up.tsx`

- [ ] **Step 1: Build the level-up screen with ceremony + choices**

This is a full Expo Router screen (not a modal overlay) that the player is routed to when `levelUpMeta` is set. Flow:

**Phase A — Ceremony (animated, ~3 seconds):**
1. Dark overlay fades in
2. "LEVEL UP" text scales in with spring + gold glow
3. Level number animates (e.g., "Level 3 → 4") with StatTicker
4. Stats reveal one by one with StatTicker: Max HP, Proficiency Bonus, Spell Slots
5. CriticalBurst particles behind the level number
6. Haptics on each reveal

**Phase B — Choices (interactive):**
7. If `asiAvailable`: Show ASI panel
   - Two tabs: "Ability Score Increase" / "Choose a Feat"
   - ASI tab: 6 ability scores with +/- buttons, 2 points to spend (max +2 to one, or +1 to two)
   - Feat tab: Scrollable list of `LEVEL_UP_FEATS`, each in a FantasyPanel card
8. If `subclassAvailable`: Show subclass selection
   - Cards for each subclass option (from `subclasses.ts`)
   - Each card shows name, description, key features
9. If `newSpells`: Show spell learning panel
   - Available spells filtered by max spell level and class
   - If `canSwap`: option to swap one known spell
10. Confirm button → calls `saveLevelUpChoices()` → navigates back to session

**Design:** Dark fantasy style matching existing screens. FantasyPanel cards for each choice. Gold accent buttons. Cinzel headings.

- [ ] **Step 2: Add screen to game layout**

In `app/game/_layout.tsx`, add:
```tsx
<Stack.Screen name="level-up" options={{ animation: 'fade_from_bottom', gestureEnabled: false }} />
```

- [ ] **Step 3: Wire level-up trigger in session.tsx**

In `handleChoicePress` and `handleFreeformSubmit`, after processing the turn result:
```typescript
if (result.levelUpMeta) {
  store.setLevelUpMeta(result.levelUpMeta);
  router.push('/game/level-up');
}
```

- [ ] **Step 4: Verify types compile and screen renders**

---

## Task 7: Loot Reveal Component

**Files:**
- Create: `src/components/animations/LootReveal.tsx`
- Modify: `src/stores/useGameStore.ts`
- Modify: `app/game/session.tsx`

- [ ] **Step 1: Add loot queue to game store**

```typescript
// In GameState:
pendingLootItems: LootItem[];
queueLootItems: (items: LootItem[]) => void;
clearLootItems: () => void;

interface LootItem {
  name: string;
  type: string;
  rarity?: 'common' | 'uncommon' | 'rare' | 'legendary';
  description?: string;
}
```

- [ ] **Step 2: Build LootReveal overlay**

Full-screen overlay, `pointerEvents: 'box-none'`. Shows when `pendingLootItems.length > 0`.

- Dark semi-transparent backdrop
- "LOOT" header in gold Cinzel
- Items stagger in with `FadeInDown` (80ms delay each)
- Each item in a FantasyPanel "strip" variant
- Rarity border glow: common (white), uncommon (green pulse), rare (blue shimmer), legendary (gold glow with CriticalBurst)
- Tap anywhere to dismiss → `clearLootItems()`
- Haptic on reveal

- [ ] **Step 3: Wire loot detection in session.tsx**

After `processAIResponse`, extract item state changes:
```typescript
const items = (result.aiResponse.stateChanges || [])
  .filter(c => c.type === 'item')
  .map(c => ({ name: typeof c.value === 'object' ? c.value.name : String(c.value), ... }));
if (items.length > 0) store.queueLootItems(items);
```

Render `<LootReveal />` in session.tsx when queue has items.

- [ ] **Step 4: Verify types compile and overlay renders**

---

## Task 8: Server-Side Enrichment (Optional Enhancement)

**Files:**
- Modify: `supabase/functions/game-turn/index.ts`
- Modify: `supabase/functions/_shared/progression.ts`

- [ ] **Step 1: Include richer data in levelUpMeta**

In `getLevelUpChanges`, add:
```typescript
asiAvailable: boolean;
subclassAvailable: boolean;
```

Update `game-turn/index.ts` to include these in the response so the client knows what UI to show without recalculating.

- [ ] **Step 2: Deploy edge function**

Run: `npx supabase functions deploy game-turn`

---

## Execution Order

1. **Task 1** (feats data) + **Task 2** (level-up engine) — independent, can parallel
2. **Task 3** (types) — depends on understanding from 1+2
3. **Task 4** (save service) — depends on 3
4. **Task 5** (StatTicker) — independent, can parallel with 1-4
5. **Task 6** (level-up screen) — depends on 1-5
6. **Task 7** (loot reveal) — independent of 1-6, can parallel
7. **Task 8** (server enrichment) — optional, can be done anytime

**Recommended parallel grouping:**
- Group A: Tasks 1, 2, 5 (data + engine + animation component)
- Group B: Task 7 (loot reveal — fully independent)
- Then: Tasks 3, 4, 6 (types → service → screen, sequential)
- Optional: Task 8

---

## Testing Strategy

Since this is React Native (no Jest unit tests set up), testing is manual:
1. After each task, run `tsc --noEmit` to verify types
2. After Task 6, test the full level-up flow on device:
   - Start a campaign, play until XP gain triggers level-up
   - Verify ceremony animation plays
   - Verify ASI/feat selection works and persists
   - Verify spell selection works (if caster)
3. After Task 7, test loot reveal by playing a combat encounter that drops items
