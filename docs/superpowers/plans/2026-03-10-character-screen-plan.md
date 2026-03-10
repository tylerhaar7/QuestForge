# Character Screen Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a parchment scroll character screen accessible via a persistent HUD button, displaying stats, gear, inventory, spells, and features.

**Architecture:** New `Spell` type + `knownSpells` field on Character. New `app/game/character.tsx` screen rendered as a full-screen modal with scroll aesthetics. HUD button component added to session screen. Server-side: prompts updated to assign/update spells, ai-parser normalizes spell changes, game-turn applies them.

**Tech Stack:** React Native, react-native-reanimated, expo-haptics, expo-linear-gradient, Zustand, Supabase Edge Functions, Claude API

---

## Chunk 1: Data Model & Types

### Task 1: Add Spell type and knownSpells to Character

**Files:**
- Modify: `src/types/game.ts`
- Modify: `supabase/functions/_shared/types.ts`
- Modify: `src/services/character.ts`

- [ ] **Step 1: Add Spell interface and knownSpells to client types**

In `src/types/game.ts`, add after the `InventoryItem` interface (line 95):

```typescript
export interface Spell {
  name: string;
  level: number;        // 0 = cantrip, 1-9
  school: string;       // "evocation", "abjuration", etc.
  castingTime: string;  // "1 action", "1 bonus action"
  range: string;        // "120 feet", "Touch", "Self"
  duration: string;     // "Instantaneous", "1 hour"
  description: string;
  components: string;   // "V, S, M (a bit of fleece)"
}
```

Add `knownSpells: Spell[];` to the `Character` interface after `inventory` (line 70).

Add `spellChanges` to `AIResponse` interface:

```typescript
spellChanges?: { learned: Spell[]; removed: string[] };
```

- [ ] **Step 2: Add Spell and knownSpells to server types**

In `supabase/functions/_shared/types.ts`, add the `Spell` interface (same as client).

Add `known_spells: any[];` and `spell_slots: number[];` and `max_spell_slots: number[];` to `CharacterRow` (these fields exist in the DB but are missing from the type).

- [ ] **Step 3: Update character service mappings**

In `src/services/character.ts`, update `fromRow()` to map `known_spells` → `knownSpells` (default `[]`).
Update `toRow()` to map `knownSpells` → `known_spells`.

- [ ] **Step 4: Update character creation to initialize knownSpells**

In `app/create/summary.tsx`, add `knownSpells: []` to the character creation object (alongside the existing `spellSlots: []`).

- [ ] **Step 5: Commit**

```bash
git add src/types/game.ts supabase/functions/_shared/types.ts src/services/character.ts app/create/summary.tsx
git commit -m "feat: add Spell type, knownSpells field, and spellChanges to AIResponse"
```

### Task 2: Update AI prompts for spell assignment

**Files:**
- Modify: `supabase/functions/_shared/prompts.ts`
- Modify: `supabase/functions/_shared/ai-parser.ts`
- Modify: `supabase/functions/game-turn/index.ts`
- Modify: `supabase/functions/campaign-init/index.ts`

- [ ] **Step 1: Add spell instructions to system prompt**

In `supabase/functions/_shared/prompts.ts`, add to `DM_SYSTEM_PROMPT` after the JOURNAL ENTRIES section:

```
SPELLS:
For spellcasting classes, include a "spell_changes" object when the player learns new spells (level up, found spellbook, divine revelation, etc.). Format: {"learned": [{"name": "Shield", "level": 1, "school": "abjuration", "casting_time": "1 reaction", "range": "Self", "duration": "1 round", "description": "An invisible barrier of magical force appears and protects you. Until the start of your next turn, you have a +5 bonus to AC.", "components": "V, S"}], "removed": []}
```

Add `"spell_changes"` to the JSON schema in the system prompt.

- [ ] **Step 2: Add spell assignment to campaign-init prompt**

In `supabase/functions/_shared/prompts.ts`, add to `CAMPAIGN_INIT_GENERATED_PROMPT` and `CAMPAIGN_INIT_DISCOVER_PROMPT`:

```
If the character's class is a spellcaster, include "starting_spells" in your response: an array of Spell objects representing the character's known spells at level 1. Include 3-4 cantrips and 2-4 first-level spells appropriate to the class. Each spell needs: name, level, school, casting_time, range, duration, description, components.
```

- [ ] **Step 3: Normalize spellChanges in ai-parser**

In `supabase/functions/_shared/ai-parser.ts`, add to `normalizeResponse()` after the adventure map block (around line 323):

```typescript
// Spell changes
const spellChanges = raw.spell_changes || raw.spellChanges;
if (spellChanges) {
  result.spellChanges = {
    learned: (spellChanges.learned || []).map((s: any) => ({
      name: s.name || '',
      level: Number(s.level) || 0,
      school: s.school || '',
      castingTime: s.casting_time || s.castingTime || '1 action',
      range: s.range || '',
      duration: s.duration || '',
      description: s.description || '',
      components: s.components || '',
    })),
    removed: spellChanges.removed || [],
  };
}
```

- [ ] **Step 4: Apply spell changes in game-turn**

In `supabase/functions/game-turn/index.ts`, after the journal entry writes block, add:

```typescript
// Spell changes: update character's known spells
if (normalized.spellChanges) {
  const currentSpells = character.known_spells || [];
  let updatedSpells = [...currentSpells];

  // Add learned spells
  if (normalized.spellChanges.learned?.length > 0) {
    for (const spell of normalized.spellChanges.learned) {
      // Avoid duplicates by name
      if (!updatedSpells.some((s: any) => s.name === spell.name)) {
        updatedSpells.push(spell);
      }
    }
  }

  // Remove spells
  if (normalized.spellChanges.removed?.length > 0) {
    updatedSpells = updatedSpells.filter(
      (s: any) => !normalized.spellChanges.removed.includes(s.name)
    );
  }

  await adminClient.from('characters').update({ known_spells: updatedSpells }).eq('id', character.id);
}
```

- [ ] **Step 5: Handle starting spells in campaign-init**

In `supabase/functions/campaign-init/index.ts`, after processing the AI response, check for `starting_spells` in the response and write to the character:

```typescript
const startingSpells = aiResponse.starting_spells || aiResponse.startingSpells || [];
if (startingSpells.length > 0) {
  await adminClient.from('characters').update({ known_spells: startingSpells }).eq('id', characterId);
}
```

- [ ] **Step 6: Commit**

```bash
git add supabase/functions/_shared/prompts.ts supabase/functions/_shared/ai-parser.ts supabase/functions/game-turn/index.ts supabase/functions/campaign-init/index.ts
git commit -m "feat: add spell assignment to AI prompts, parser, and edge functions"
```

---

## Chunk 2: Character Screen UI

### Task 3: Create HUD button component

**Files:**
- Create: `src/components/game/CharacterHudButton.tsx`
- Modify: `app/game/session.tsx`

- [ ] **Step 1: Create CharacterHudButton component**

Create `src/components/game/CharacterHudButton.tsx`:

A rectangular pressable button with:
- Class icon (use unicode/text fallback mapped from `ClassName` — e.g., fighter→"⚔", wizard→"🔮", rogue→"🗡", cleric→"✝", etc.)
- Icon sits inside a small gold-bordered square frame (1.5px border, `#b48c3c`, border-radius 4)
- "Character" text label to the right (Cinzel font, 11px, `#e8dcc8`)
- Dark semi-transparent background (`rgba(13, 10, 8, 0.85)`), rounded corners (8px)
- Horizontal padding 10, vertical 6
- `onPress` prop to navigate to character screen
- Light haptic on press

Props: `className: ClassName`, `onPress: () => void`

- [ ] **Step 2: Add HUD button to session screen**

In `app/game/session.tsx`:
- Import `CharacterHudButton`
- Add it positioned absolute, top: 8, left: 12, zIndex: 10
- `onPress` navigates to `/game/character`

- [ ] **Step 3: Commit**

```bash
git add src/components/game/CharacterHudButton.tsx app/game/session.tsx
git commit -m "feat: add character HUD button to game session"
```

### Task 4: Create the parchment scroll character screen

**Files:**
- Create: `app/game/character.tsx`

This is the main character screen. It's a full-screen component that overlays the game session.

- [ ] **Step 1: Create the character screen file**

Create `app/game/character.tsx` with these sections:

**Structure:**
```
SafeAreaView (dark overlay background #0d0a08)
  Animated.View (scroll container — unroll animation)
    View (top curl — gradient styled view)
    ScrollView (parchment body — warm tan background)
      CharacterHeader (name, level, race, class)
      AbilityScores (6 diamond boxes)
      CombatStats (AC, HP, Speed)
      SavingThrows (6 saves, proficient highlighted)
      Skills (18 skills with modifiers)
      Equipment (equipped items with properties)
      Inventory (items with quantities)
      KnownSpells (grouped by level, expandable)
      ClassFeatures (name + description)
    View (bottom curl — gradient styled view)
    Pressable (X close button, top-right)
```

**Parchment colors:**
- Body: `#e8d8b4`
- Edge darkening: `rgba(160, 128, 80, 0.2)` gradient overlays
- Ink: `#2a1a08` primary, `#6b5730` secondary
- Gold: `#8b6914` headers/accents
- Section dividers: `#b8a070`
- Aged spots: `rgba(160, 130, 80, 0.15)` radial positioned views

**Top/Bottom curls:**
Each curl is ~48px tall. Built with nested Views using LinearGradient (from expo-linear-gradient) or background color stops:
- Outer: darker brown tones (#7a5c32 → #c8a870 → #e8d4a8)
- Inner highlight: lighter curl (#b89858 → #e8d8b8)
- Shadow line between curl and parchment body

**Close button:** Absolute positioned top-right, over the top curl. White X or parchment-colored, with slight shadow for visibility.

**Unroll animation:**
- `useSharedValue(0)` for progress (0=closed, 1=open)
- On mount: `withSpring(1, { damping: 15, stiffness: 120 })`
- Animated height from 0 to screen height
- Opacity from 0 to 1
- Top/bottom curls animate from center outward

**Section implementations:**

1. **CharacterHeader**: Centered name (Cinzel, 22px, #2a1a08), subtitle "Level X · Race · Class" (italic, 12px, #6b5730), bottom border.

2. **AbilityScores**: Row of 6 diamond-rotated boxes. Each: 38x38 View with `transform: [{ rotate: '45deg' }]`, 1.5px gold border. Score inside (rotated back -45deg), abbreviation below, modifier below that.

3. **CombatStats**: Flex row of 3 bordered cards — AC, HP (color-coded: green if >50%, yellow 25-50%, red <25%), Speed.

4. **SavingThrows**: Flex-wrap row of 6 pills. Proficient: gold background with white text. Non-proficient: transparent with border, dimmed text. Show modifier value.

5. **Skills**: List of 18 skills. Each row: skill name (left), modifier (right). Proficient skills in bold gold text. Non-proficient in dimmed. Use `getSkillModifier()` from `src/engine/character.ts`. Format modifier as "+3" or "-1".

6. **Equipment**: List with dotted bottom borders. Each row: emoji icon based on type (⚔ weapon, 🛡 armor/shield, ✦ accessory) + name (left), property summary (right, dimmed — e.g. "1d8 slashing", "AC 16", "+2 AC").

7. **Inventory**: Same layout as equipment. Emoji by type (🧪 consumable, 📜 quest, 💰 treasure, 🔮 material, 🎒 misc) + name (left), quantity (right).

8. **KnownSpells**: Section header with slot tracker ("Slots: ●●●○ 3/4"). Spells grouped by level (subsection headers: "CANTRIPS", "1ST LEVEL", etc.). Each spell as a chip/tag. Tapping a chip expands it inline (Reanimated LayoutAnimation) to show: casting time, range, duration, components, description. Non-casters show "No spells known".

9. **ClassFeatures**: List of features from `CLASSES[character.className].features`. Each: bold name + dimmed description on next line.

- [ ] **Step 2: Add expo-linear-gradient dependency check**

Verify `expo-linear-gradient` is installed. If not: `npx expo install expo-linear-gradient`

- [ ] **Step 3: Commit**

```bash
git add app/game/character.tsx
git commit -m "feat: add parchment scroll character screen with full stat display"
```

### Task 5: Add class icon mapping and utilities

**Files:**
- Create: `src/data/classIcons.ts`

- [ ] **Step 1: Create class icon mapping**

Create `src/data/classIcons.ts`:

```typescript
import type { ClassName } from '@/types/game';

export const CLASS_ICONS: Record<ClassName, string> = {
  barbarian: '⚔',
  bard: '🎵',
  cleric: '✟',
  druid: '🌿',
  fighter: '🗡',
  monk: '👊',
  paladin: '🛡',
  ranger: '🏹',
  rogue: '🔪',
  sorcerer: '✨',
  warlock: '🔮',
  wizard: '📖',
  artificer: '⚙',
};
```

- [ ] **Step 2: Commit**

```bash
git add src/data/classIcons.ts
git commit -m "feat: add class icon mapping for HUD button"
```

---

## Chunk 3: Integration & Deploy

### Task 6: Wire up navigation and store updates

**Files:**
- Modify: `app/game/session.tsx`
- Modify: `src/stores/useGameStore.ts`

- [ ] **Step 1: Add spell state handling to game store**

In `src/stores/useGameStore.ts`, the `processAIResponse` already handles most fields. Add handling for spellChanges to update the character's knownSpells in the store:

After the tutorial check block in `processAIResponse`:

```typescript
// Update character spells if changed
if (response.spellChanges) {
  const char = get().character;
  if (char) {
    let spells = [...(char.knownSpells || [])];
    if (response.spellChanges.learned?.length) {
      for (const spell of response.spellChanges.learned) {
        if (!spells.some(s => s.name === spell.name)) {
          spells.push(spell);
        }
      }
    }
    if (response.spellChanges.removed?.length) {
      spells = spells.filter(s => !response.spellChanges!.removed.includes(s.name));
    }
    set({ character: { ...char, knownSpells: spells } });
  }
}
```

- [ ] **Step 2: Ensure session screen navigates to character screen**

Verify the HUD button's `onPress` calls `router.push('/game/character')`. The screen is auto-discovered by Expo Router since it's in `app/game/`.

- [ ] **Step 3: Commit**

```bash
git add src/stores/useGameStore.ts app/game/session.tsx
git commit -m "feat: wire spell changes to game store and character screen navigation"
```

### Task 7: Deploy updated edge functions

**Files:**
- Deploy: `supabase/functions/game-turn`
- Deploy: `supabase/functions/campaign-init`

- [ ] **Step 1: Deploy game-turn**

```bash
npx supabase functions deploy game-turn --project-ref bsbdtdexdlyruojyabtn
```

- [ ] **Step 2: Deploy campaign-init**

```bash
npx supabase functions deploy campaign-init --project-ref bsbdtdexdlyruojyabtn
```

- [ ] **Step 3: Add known_spells column if needed**

Check if the `characters` table has a `known_spells` column. If not, run migration:

```sql
ALTER TABLE characters ADD COLUMN IF NOT EXISTS known_spells jsonb DEFAULT '[]'::jsonb;
```

- [ ] **Step 4: Commit any migration**

```bash
git add supabase/migrations/
git commit -m "chore: add known_spells column to characters table"
```
