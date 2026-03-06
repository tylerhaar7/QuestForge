# Phase 2 Completion — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete Phase 2 by adding origin AI context injection, a 6-turn tutorial campaign ("The First Door"), dual-track onboarding routing, and full accessibility settings.

**Architecture:** Origin AI context stored in characters DB and injected into Edge Function prompts. Tutorial is server-side enforced via `is_tutorial` campaign flag and turn-count-based prompt injection. Accessibility uses a Zustand+MMKV settings store with a React context provider that wraps the app, providing scaled fonts, colors, and motion preferences.

**Tech Stack:** React Native + Expo, TypeScript, Zustand, MMKV, Supabase (Edge Functions + DB), expo-font, expo-haptics, react-native-reanimated

---

### Task 1: Origin AI Context — DB + Types

**Files:**
- Modify: `src/types/game.ts:49-78` (Character interface)
- Modify: `src/services/character.ts:6-68` (toRow/fromRow mappers)
- Modify: `supabase/functions/_shared/types.ts` (CharacterRow)

**Step 1: Add `originAiContext` to Character type**

In `src/types/game.ts`, add after line 73 (`originStory: string;`):

```typescript
originAiContext: string;        // AI prompt context for origin
```

**Step 2: Update character service mappers**

In `src/services/character.ts`, add to `toRow()` after line 30 (`origin_story: char.originStory,`):

```typescript
origin_ai_context: char.originAiContext,
```

In `fromRow()`, add after line 62 (`originStory: row.origin_story ?? '',`):

```typescript
originAiContext: row.origin_ai_context ?? '',
```

**Step 3: Update Edge Function shared types**

In `supabase/functions/_shared/types.ts`, add `origin_ai_context` to CharacterRow type.

**Step 4: Add DB column via Supabase MCP**

Run SQL: `ALTER TABLE characters ADD COLUMN IF NOT EXISTS origin_ai_context TEXT DEFAULT '';`

**Step 5: Verify**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 6: Commit**

```bash
git add src/types/game.ts src/services/character.ts supabase/functions/_shared/types.ts
git commit -m "feat: add originAiContext field to Character type and DB"
```

---

### Task 2: Wire Origin AI Context into Creation + Prompts

**Files:**
- Modify: `app/create/summary.tsx:172-197` (character save)
- Modify: `supabase/functions/_shared/prompts.ts:112-163` (buildSystemPrompt)

**Step 1: Pass origin AI context when saving character**

In `app/create/summary.tsx`, the character save (around line 195) currently sets `originStory: originId ?? ''`. Change this block to also include the AI context:

```typescript
originStory: originId ?? '',
originAiContext: originData?.aiContext ?? customOrigin ?? '',
personalQuestFlags,
```

The `originData` variable is already resolved at the top of the component from the store's `originId`.

**Step 2: Inject origin AI context into Edge Function prompts**

In `supabase/functions/_shared/prompts.ts`, in `buildSystemPrompt()` after the character block (around line 129), the `Origin:` line already exists. Enhance it:

Replace line 129:
```typescript
- Origin: ${character.origin_story || 'Unknown'}`);
```

With:
```typescript
- Origin: ${character.origin_story || 'Unknown'}
${character.origin_ai_context ? `\nORIGIN CONTEXT (weave this into the narrative naturally):\n${character.origin_ai_context}` : ''}`);
```

**Step 3: Verify**

Run: `npx tsc --noEmit`

**Step 4: Deploy campaign-init and game-turn Edge Functions**

```bash
npx supabase functions deploy campaign-init --no-verify-jwt
npx supabase functions deploy game-turn --no-verify-jwt
```

**Step 5: Commit**

```bash
git add app/create/summary.tsx supabase/functions/_shared/prompts.ts
git commit -m "feat: inject origin AI context into DM prompts"
```

---

### Task 3: Dual-Track Routing

**Files:**
- Modify: `app/create/index.tsx:12-17` (handleStart function)

**Step 1: Branch routing based on track**

Replace the `handleStart` function in `app/create/index.tsx`:

```typescript
const handleStart = (track: 'new' | 'veteran') => {
  reset();  // Clear any previous creation state
  if (track === 'new') {
    router.push('/create/tutorial');
  } else {
    router.push('/create/race');
  }
};
```

**Step 2: Verify**

Run: `npx tsc --noEmit`

**Step 3: Commit**

```bash
git add app/create/index.tsx
git commit -m "feat: route new players to tutorial, veterans to character creation"
```

---

### Task 4: Tutorial Screen

**Files:**
- Create: `app/create/tutorial.tsx`
- Create: `src/data/tutorial.ts`

**Step 1: Create tutorial data constants**

Create `src/data/tutorial.ts` with pre-built tutorial characters (4 classes), tutorial prompts, and default stats:

```typescript
import type { ClassName, AbilityScores } from '@/types/game';

export interface TutorialClassOption {
  className: ClassName;
  defaultName: string;
  description: string;
  icon: string;
  abilityScores: AbilityScores;
  hp: number;
  maxHp: number;
  ac: number;
  speed: number;
  proficientSkills: string[];
  proficientSaves: string[];
  equipment: { id: string; name: string; type: 'weapon' | 'armor' | 'shield'; equipped: boolean }[];
  features: string[];
}

export const TUTORIAL_CLASSES: TutorialClassOption[] = [
  {
    className: 'fighter',
    defaultName: 'Aldric',
    description: 'A sturdy warrior. Simple and strong — a great place to start.',
    icon: '\u2694\uFE0F',
    abilityScores: { strength: 16, dexterity: 12, constitution: 14, intelligence: 10, wisdom: 13, charisma: 8 },
    hp: 12, maxHp: 12, ac: 16, speed: 30,
    proficientSkills: ['athletics', 'intimidation'],
    proficientSaves: ['strength', 'constitution'],
    equipment: [
      { id: 'longsword', name: 'Longsword', type: 'weapon', equipped: true },
      { id: 'chain_mail', name: 'Chain Mail', type: 'armor', equipped: true },
      { id: 'shield', name: 'Shield', type: 'shield', equipped: true },
    ],
    features: ['Fighting Style: Defense', 'Second Wind'],
  },
  {
    className: 'rogue',
    defaultName: 'Kael',
    description: 'Quick and cunning. Sneaks past danger or strikes from the shadows.',
    icon: '\uD83D\uDDE1\uFE0F',
    abilityScores: { strength: 10, dexterity: 16, constitution: 12, intelligence: 13, wisdom: 8, charisma: 14 },
    hp: 9, maxHp: 9, ac: 14, speed: 30,
    proficientSkills: ['stealth', 'acrobatics', 'deception', 'sleight_of_hand'],
    proficientSaves: ['dexterity', 'intelligence'],
    equipment: [
      { id: 'shortsword', name: 'Shortsword', type: 'weapon', equipped: true },
      { id: 'leather_armor', name: 'Leather Armor', type: 'armor', equipped: true },
    ],
    features: ['Sneak Attack', 'Expertise'],
  },
  {
    className: 'wizard',
    defaultName: 'Lywen',
    description: 'A scholar of the arcane. Wields powerful spells but is fragile.',
    icon: '\uD83E\uDDD9',
    abilityScores: { strength: 8, dexterity: 13, constitution: 12, intelligence: 16, wisdom: 14, charisma: 10 },
    hp: 7, maxHp: 7, ac: 12, speed: 30,
    proficientSkills: ['arcana', 'investigation'],
    proficientSaves: ['intelligence', 'wisdom'],
    equipment: [
      { id: 'quarterstaff', name: 'Quarterstaff', type: 'weapon', equipped: true },
    ],
    features: ['Arcane Recovery', 'Spellcasting'],
  },
  {
    className: 'cleric',
    defaultName: 'Miriel',
    description: 'A healer and protector. Can fight and mend wounds.',
    icon: '\u2728',
    abilityScores: { strength: 14, dexterity: 10, constitution: 13, intelligence: 8, wisdom: 16, charisma: 12 },
    hp: 10, maxHp: 10, ac: 16, speed: 30,
    proficientSkills: ['medicine', 'religion'],
    proficientSaves: ['wisdom', 'charisma'],
    equipment: [
      { id: 'mace', name: 'Mace', type: 'weapon', equipped: true },
      { id: 'chain_mail', name: 'Chain Mail', type: 'armor', equipped: true },
      { id: 'shield', name: 'Shield', type: 'shield', equipped: true },
    ],
    features: ['Spellcasting', 'Divine Domain'],
  },
];

/** Turn-by-turn tutorial instructions injected into the system prompt */
export const TUTORIAL_TURN_INSTRUCTIONS: Record<number, string> = {
  1: `TUTORIAL TURN 1 — TEACHING: Narrative Choices
You are running a tutorial. This is the player's FIRST turn.
- Present a simple, low-stakes situation (arriving at a location, meeting someone)
- Offer 3 clear choices with distinct approaches (e.g., investigate, talk, explore)
- DO NOT include combat, dice rolls, or complex mechanics yet
- Add a brief meta-hint in parentheses after each choice explaining what type it is
- Keep narration short (1-2 paragraphs) and welcoming`,

  2: `TUTORIAL TURN 2 — TEACHING: Combat Basics
- Introduce a simple combat encounter (2-3 weak enemies like goblins or bandits)
- Set mode to "combat"
- Include enemy_intentions for each enemy
- Present 3 tactical choices (attack with weapon, use environment, defensive action)
- Include dice_requests for any attack the player might choose
- Add a brief meta-note: "Combat tip: enemies telegraph their moves so you can plan!"`,

  3: `TUTORIAL TURN 3 — TEACHING: Skill Checks
- Present a situation requiring a skill check (locked door, suspicious NPC, climbing)
- Include at least 2 choices with skill_check objects (show DC, modifier, success_chance)
- Include one choice without a skill check as an alternative approach
- Add meta-note: "Skill tip: your abilities affect your chances. Higher is better!"`,

  4: `TUTORIAL TURN 4 — TEACHING: Companion Approval
- Create a moral or tactical dilemma where companions have different opinions
- Have at least 2 companions speak with distinct voices about the situation
- Include approval_changes in your response based on the player's last choice
- Add meta-note: "Your companions remember your choices. Their approval affects their loyalty."`,

  5: `TUTORIAL TURN 5 — TEACHING: Freeform Input
- Present an open-ended situation (no choices array — leave it empty)
- Instead, narrate a moment that invites creative thinking
- Add meta-note: "You can type ANY action you want to try. Be creative!"
- Companions should react naturally to whatever the player does`,

  6: `TUTORIAL TURN 6 — TEACHING: Consequences
This is the FINAL tutorial turn.
- Present a meaningful decision with real consequences
- Make it clear that both options have trade-offs
- After the player chooses, narrate the consequence
- End the narration with a line like: "And so your story truly begins..."
- Include "tutorial_complete": true in your JSON response
- Include choices that are: "Create my own character" and "Continue with this character"`,
};

export const TUTORIAL_OPENING_PROMPT = `You are starting a tutorial campaign called "The First Door."
This is a new player learning D&D for the first time through play.

Create an opening scene that:
1. Places the player outside a mysterious tavern at dusk — "The First Door Inn"
2. The atmosphere is welcoming but intriguing — not threatening
3. Introduce the three companions (Korrin the fighter, Sera the rogue, Thaelen the druid) as fellow travelers who just arrived
4. Present 3 simple choices for what to do next (enter the tavern, investigate the area, talk to companions)
5. Add brief meta-hints in parentheses explaining each choice type
6. Keep it SHORT — 2 paragraphs max. This is turn 1 of the tutorial.

Remember: NO dice rolls, NO combat. Just narrative choices.`;
```

**Step 2: Create tutorial screen**

Create `app/create/tutorial.tsx` — a screen with:
- Header: "THE FIRST DOOR" title, subtitle "Choose your path"
- 4 class cards (Fighter, Rogue, Wizard, Cleric) in a 2x2 grid or vertical list
- Each card shows: icon, class name, 1-line description, key stat
- Name input (pre-filled with class default, editable)
- "BEGIN YOUR ADVENTURE" button
- On press: creates character in DB → calls campaign-init with `mode: 'tutorial'` → navigates to `/game/session`

The screen should follow the same dark-fantasy design patterns as the rest of the app (colors.bg.primary background, gold accents, Cinzel headings, Crimson body).

Key implementation details:
- Uses `createCharacter()` from `src/services/character.ts` to save
- Uses `initCampaign()` from `src/services/campaign.ts` with `mode: 'tutorial'`
- Sets character + campaign in `useGameStore` before navigating
- No origin selection needed for tutorial (set `originStory: 'tutorial'`, `originAiContext: ''`)

**Step 3: Verify**

Run: `npx tsc --noEmit`

**Step 4: Commit**

```bash
git add src/data/tutorial.ts app/create/tutorial.tsx
git commit -m "feat: add tutorial screen with class picker and tutorial data"
```

---

### Task 5: Tutorial Edge Functions

**Files:**
- Modify: `src/services/campaign.ts` (add tutorial mode to InitCampaignParams)
- Modify: `supabase/functions/campaign-init/index.ts` (tutorial campaign creation)
- Modify: `supabase/functions/game-turn/index.ts` (tutorial turn injection)
- Modify: `supabase/functions/_shared/prompts.ts` (tutorial prompt builder)

**Step 1: Add tutorial mode to campaign service**

In `src/services/campaign.ts`, update `InitCampaignParams.mode` to accept `'tutorial'`:

```typescript
mode: 'generated' | 'custom' | 'tutorial';
```

**Step 2: Update campaign-init for tutorial mode**

In `supabase/functions/campaign-init/index.ts`:

When `mode === 'tutorial'`:
- Set `is_tutorial: true` in the campaign row
- Use `TUTORIAL_OPENING_PROMPT` instead of the normal init prompt
- Use the default 3 companions (Korrin, Sera, Thaelen)
- Set `current_location: 'The First Door Inn'`
- Set `current_mood: 'tavern'`

Add the tutorial opening prompt as a constant in the Edge Function (since it can't import from `src/`):

```typescript
const TUTORIAL_OPENING_PROMPT = `You are starting a tutorial campaign called "The First Door."
This is a new player learning D&D for the first time through play.
Create an opening scene that:
1. Places the player outside a mysterious tavern at dusk — "The First Door Inn"
2. The atmosphere is welcoming but intriguing
3. Introduce the three companions naturally
4. Present 3 simple choices with meta-hints in parentheses
5. Keep it SHORT — 2 paragraphs max
Remember: NO dice rolls, NO combat. Just narrative choices.`;
```

In the campaign row creation, add `is_tutorial: mode === 'tutorial'`.

**Step 3: Update game-turn for tutorial turns**

In `supabase/functions/game-turn/index.ts`, after building the system prompt (around line 167), check if `campaign.is_tutorial` is true. If so, inject the turn-specific tutorial instruction:

```typescript
// Tutorial instruction injection
if (campaign.is_tutorial) {
  const turnNum = campaign.turn_count + 1; // Next turn number
  const tutorialInstruction = TUTORIAL_TURN_INSTRUCTIONS[turnNum];
  if (tutorialInstruction) {
    systemPrompt += '\n\n---\n\n' + tutorialInstruction;
  }
}
```

Add `TUTORIAL_TURN_INSTRUCTIONS` as a constant in the Edge Function (duplicate from `src/data/tutorial.ts` since Edge Functions can't import client code).

**Step 4: Add `is_tutorial` column to campaigns table**

Run SQL: `ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS is_tutorial BOOLEAN DEFAULT FALSE;`

**Step 5: Handle tutorial_complete in normalizeResponse**

In `supabase/functions/game-turn/index.ts`, in the `normalizeResponse` function, pass through the `tutorial_complete` flag:

```typescript
if (raw.tutorial_complete) result.tutorialComplete = true;
```

**Step 6: Verify and deploy**

```bash
npx tsc --noEmit
npx supabase functions deploy campaign-init --no-verify-jwt
npx supabase functions deploy game-turn --no-verify-jwt
```

**Step 7: Commit**

```bash
git add src/services/campaign.ts supabase/functions/
git commit -m "feat: add tutorial mode to campaign-init and game-turn Edge Functions"
```

---

### Task 6: Tutorial Completion Flow

**Files:**
- Modify: `app/game/session.tsx` (detect tutorial_complete, show modal)
- Modify: `src/stores/useGameStore.ts` (add tutorialComplete state)
- Modify: `src/types/game.ts` (add tutorialComplete to AIResponse)

**Step 1: Add tutorialComplete to AIResponse type**

In `src/types/game.ts`, add to the `AIResponse` interface:

```typescript
tutorialComplete?: boolean;
```

**Step 2: Add tutorial state to game store**

In `src/stores/useGameStore.ts`:
- Add `isTutorialComplete: boolean` to `GameState` interface
- Add to `initialState`: `isTutorialComplete: false`
- In `processAIResponse`, check for `response.tutorialComplete`:

```typescript
if (response.tutorialComplete) {
  set({ isTutorialComplete: true });
}
```

**Step 3: Add tutorial completion modal to game session**

In `app/game/session.tsx`:
- Read `isTutorialComplete` from `useGameStore`
- When true, show a Modal with:
  - Title: "Your Adventure Begins"
  - Body: "You've learned the basics. The rest is up to you."
  - Button 1: "CREATE MY CHARACTER" → `resetSession()`, `router.replace('/create/race')`
  - Button 2: "CONTINUE PLAYING" → dismiss modal, clear `isTutorialComplete`, continue with tutorial character as a real campaign (set `is_tutorial: false` on server)
- Style the modal like the existing menu modal (same dark-fantasy look)

**Step 4: Verify**

Run: `npx tsc --noEmit`

**Step 5: Commit**

```bash
git add src/types/game.ts src/stores/useGameStore.ts app/game/session.tsx
git commit -m "feat: add tutorial completion modal with character creation prompt"
```

---

### Task 7: Settings Store + OpenDyslexic Font

**Files:**
- Create: `src/stores/useSettingsStore.ts`
- Create: `src/types/settings.ts`
- Modify: `app/_layout.tsx` (load OpenDyslexic font)
- Add: `assets/fonts/OpenDyslexic-Regular.ttf` (download font file)

**Step 1: Create settings types**

Create `src/types/settings.ts`:

```typescript
export type TextSize = 'small' | 'medium' | 'large' | 'xlarge';
export type TextSpeed = 'instant' | 'fast' | 'normal' | 'slow';
export type ColorblindMode = 'none' | 'deuteranopia' | 'protanopia' | 'tritanopia';

export interface AccessibilitySettings {
  textSize: TextSize;
  highContrast: boolean;
  reduceMotion: boolean;
  colorblindMode: ColorblindMode;
  dyslexiaFont: boolean;
  screenReaderOptimized: boolean;
  textSpeed: TextSpeed;
  hapticFeedback: boolean;
}

export const DEFAULT_ACCESSIBILITY: AccessibilitySettings = {
  textSize: 'medium',
  highContrast: false,
  reduceMotion: false,
  colorblindMode: 'none',
  dyslexiaFont: false,
  screenReaderOptimized: false,
  textSpeed: 'normal',
  hapticFeedback: true,
};

export const TEXT_SIZE_MULTIPLIER: Record<TextSize, number> = {
  small: 0.85,
  medium: 1.0,
  large: 1.2,
  xlarge: 1.4,
};
```

**Step 2: Create settings store**

Create `src/stores/useSettingsStore.ts`:

```typescript
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';
import type { AccessibilitySettings, TextSize, TextSpeed, ColorblindMode } from '@/types/settings';
import { DEFAULT_ACCESSIBILITY } from '@/types/settings';

const storage = new MMKV({ id: 'questforge-settings' });

const mmkvStorage = {
  getItem: (name: string) => storage.getString(name) ?? null,
  setItem: (name: string, value: string) => storage.set(name, value),
  removeItem: (name: string) => storage.delete(name),
};

interface SettingsState {
  accessibility: AccessibilitySettings;
  setTextSize: (size: TextSize) => void;
  setHighContrast: (enabled: boolean) => void;
  setReduceMotion: (enabled: boolean) => void;
  setColorblindMode: (mode: ColorblindMode) => void;
  setDyslexiaFont: (enabled: boolean) => void;
  setScreenReaderOptimized: (enabled: boolean) => void;
  setTextSpeed: (speed: TextSpeed) => void;
  setHapticFeedback: (enabled: boolean) => void;
  resetAccessibility: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      accessibility: DEFAULT_ACCESSIBILITY,
      setTextSize: (textSize) =>
        set((s) => ({ accessibility: { ...s.accessibility, textSize } })),
      setHighContrast: (highContrast) =>
        set((s) => ({ accessibility: { ...s.accessibility, highContrast } })),
      setReduceMotion: (reduceMotion) =>
        set((s) => ({ accessibility: { ...s.accessibility, reduceMotion } })),
      setColorblindMode: (colorblindMode) =>
        set((s) => ({ accessibility: { ...s.accessibility, colorblindMode } })),
      setDyslexiaFont: (dyslexiaFont) =>
        set((s) => ({ accessibility: { ...s.accessibility, dyslexiaFont } })),
      setScreenReaderOptimized: (screenReaderOptimized) =>
        set((s) => ({ accessibility: { ...s.accessibility, screenReaderOptimized } })),
      setTextSpeed: (textSpeed) =>
        set((s) => ({ accessibility: { ...s.accessibility, textSpeed } })),
      setHapticFeedback: (hapticFeedback) =>
        set((s) => ({ accessibility: { ...s.accessibility, hapticFeedback } })),
      resetAccessibility: () =>
        set({ accessibility: DEFAULT_ACCESSIBILITY }),
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
```

**Step 3: Download OpenDyslexic font**

Download `OpenDyslexic-Regular.otf` from https://opendyslexic.org/ and save to `assets/fonts/OpenDyslexic-Regular.otf`.

**Step 4: Register font in root layout**

In `app/_layout.tsx`, add to the `useFonts` call:

```typescript
'OpenDyslexic-Regular': require('../assets/fonts/OpenDyslexic-Regular.otf'),
```

**Step 5: Verify**

Run: `npx tsc --noEmit`

**Step 6: Commit**

```bash
git add src/types/settings.ts src/stores/useSettingsStore.ts assets/fonts/OpenDyslexic-Regular.otf app/_layout.tsx
git commit -m "feat: add settings store with MMKV persistence and OpenDyslexic font"
```

---

### Task 8: Accessibility Context Provider

**Files:**
- Create: `src/providers/AccessibilityProvider.tsx`
- Create: `src/theme/accessibility.ts`
- Modify: `app/_layout.tsx` (wrap app with provider)

**Step 1: Create accessibility helpers**

Create `src/theme/accessibility.ts` with functions that compute adjusted values:

```typescript
import { fonts } from './typography';
import { colors } from './colors';
import type { TextSize, ColorblindMode } from '@/types/settings';
import { TEXT_SIZE_MULTIPLIER } from '@/types/settings';

/** Get font family based on dyslexia setting */
export function getFont(fontKey: keyof typeof fonts, dyslexiaFont: boolean): string {
  if (dyslexiaFont) return 'OpenDyslexic-Regular';
  return fonts[fontKey];
}

/** Scale a font size by the text size multiplier */
export function scaleFontSize(baseFontSize: number, textSize: TextSize): number {
  return Math.round(baseFontSize * TEXT_SIZE_MULTIPLIER[textSize]);
}

/** Remap colors for colorblind modes */
export function getColorblindColor(
  colorType: 'red' | 'green' | 'blue' | 'yellow',
  mode: ColorblindMode
): string {
  // Remap problematic colors for each mode
  const remaps: Record<ColorblindMode, Record<string, string>> = {
    none: {},
    deuteranopia: {
      red: '#d4a017',    // Red → amber (distinguishable from green)
      green: '#2560a8',  // Green → blue
    },
    protanopia: {
      red: '#d4a017',    // Red → amber
      green: '#2560a8',  // Green → blue
    },
    tritanopia: {
      blue: '#e85d75',   // Blue → pink
      green: '#d4a017',  // Green → amber
    },
  };
  const defaultColors: Record<string, string> = {
    red: colors.combat.red,
    green: '#28a745',
    blue: '#2a52be',
    yellow: colors.gold.primary,
  };
  return remaps[mode]?.[colorType] ?? defaultColors[colorType] ?? defaultColors.red;
}

/** Get high-contrast color adjustments */
export function getHighContrastColors(enabled: boolean) {
  if (!enabled) return {};
  return {
    textPrimary: '#ffffff',
    textSecondary: '#d4d0c8',
    borderColor: colors.gold.primary,
  };
}
```

**Step 2: Create AccessibilityProvider**

Create `src/providers/AccessibilityProvider.tsx`:

```typescript
import React, { createContext, useContext, useMemo } from 'react';
import { useSettingsStore } from '@/stores/useSettingsStore';
import type { AccessibilitySettings, TextSize, ColorblindMode } from '@/types/settings';
import { TEXT_SIZE_MULTIPLIER } from '@/types/settings';
import { getFont, scaleFontSize, getHighContrastColors } from '@/theme/accessibility';
import { fonts } from '@/theme/typography';

interface AccessibilityContextValue {
  settings: AccessibilitySettings;
  /** Get the appropriate font family */
  font: (key: keyof typeof fonts) => string;
  /** Scale a font size */
  fontSize: (base: number) => number;
  /** Whether animations should be skipped */
  skipAnimations: boolean;
  /** Whether haptics are enabled */
  hapticsEnabled: boolean;
  /** Text speed for narrative */
  textSpeed: AccessibilitySettings['textSpeed'];
  /** High contrast overrides (empty object if disabled) */
  contrastOverrides: ReturnType<typeof getHighContrastColors>;
}

const AccessibilityContext = createContext<AccessibilityContextValue | null>(null);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const settings = useSettingsStore((s) => s.accessibility);

  const value = useMemo<AccessibilityContextValue>(() => ({
    settings,
    font: (key) => getFont(key, settings.dyslexiaFont),
    fontSize: (base) => scaleFontSize(base, settings.textSize),
    skipAnimations: settings.reduceMotion,
    hapticsEnabled: settings.hapticFeedback,
    textSpeed: settings.textSpeed,
    contrastOverrides: getHighContrastColors(settings.highContrast),
  }), [settings]);

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility(): AccessibilityContextValue {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) throw new Error('useAccessibility must be used within AccessibilityProvider');
  return ctx;
}
```

**Step 3: Wrap app with provider**

In `app/_layout.tsx`, import and wrap the Stack with `<AccessibilityProvider>`:

```typescript
import { AccessibilityProvider } from '@/providers/AccessibilityProvider';

// Inside return:
<GestureHandlerRootView style={{ flex: 1 }}>
  <QueryClientProvider client={queryClient}>
    <AccessibilityProvider>
      <StatusBar style="light" />
      <Stack ... />
    </AccessibilityProvider>
  </QueryClientProvider>
</GestureHandlerRootView>
```

**Step 4: Verify**

Run: `npx tsc --noEmit`

**Step 5: Commit**

```bash
git add src/theme/accessibility.ts src/providers/AccessibilityProvider.tsx app/_layout.tsx
git commit -m "feat: add accessibility context provider with font/size/color helpers"
```

---

### Task 9: Settings Screen + Navigation

**Files:**
- Create: `app/settings.tsx`
- Modify: `app/game/session.tsx` (add settings icon to header)

**Step 1: Create settings screen**

Create `app/settings.tsx` with sections:

- **Display**: Text size picker (small/medium/large/xlarge as segmented buttons), High contrast toggle, Dyslexia font toggle
- **Motion**: Reduce motion toggle
- **Color**: Colorblind mode picker (none/deuteranopia/protanopia/tritanopia as radio buttons)
- **Input**: Text speed picker (instant/fast/normal/slow as segmented buttons)
- **Audio**: Haptic feedback toggle
- **Screen Reader**: Screen reader optimized toggle

Each setting reads from and writes to `useSettingsStore`. Use the same dark-fantasy styling as the rest of the app. Include a "RESET TO DEFAULTS" button at the bottom.

Back navigation via a "< Back" pressable at the top.

**Step 2: Add settings icon to game session header**

In `app/game/session.tsx`, add a gear icon Pressable to the header (next to the menu dots). On press, navigate to `/settings`:

```typescript
<Pressable onPress={() => router.push('/settings')} style={styles.settingsButton}>
  <Text style={styles.settingsIcon}>{'\u2699'}</Text>
</Pressable>
```

Add styles for `settingsButton` and `settingsIcon` (similar to menuButton/menuIcon).

**Step 3: Also add settings access from welcome screen**

In `app/create/index.tsx`, add a small gear icon in the top-right corner that navigates to `/settings`.

**Step 4: Verify**

Run: `npx tsc --noEmit`

**Step 5: Commit**

```bash
git add app/settings.tsx app/game/session.tsx app/create/index.tsx
git commit -m "feat: add accessibility settings screen with navigation from game session"
```

---

### Task 10: Wire Accessibility into Components

**Files:**
- Modify: `src/components/game/NarrativeText.tsx` (text speed + reduce motion + font + haptics)
- Modify: `src/components/game/ChoiceButton.tsx` (accessibility labels + font size)
- Modify: `src/components/game/PartyCard.tsx` (accessibility labels + font size + colorblind)

**Step 1: Update NarrativeText**

In `src/components/game/NarrativeText.tsx`:
- Import `useAccessibility` from the provider
- Use `textSpeed` from accessibility instead of the `speed` prop (prop takes priority as override)
- Use `skipAnimations` — if true, set text instantly
- Use `hapticsEnabled` — only fire haptics if enabled
- Use `font('narrative')` for the font family
- Use `fontSize(16)` for the base size

```typescript
const { textSpeed: settingsSpeed, skipAnimations, hapticsEnabled, font, fontSize } = useAccessibility();
const effectiveSpeed = speed ?? settingsSpeed;
const delayMs = skipAnimations ? 0 : (SPEED_MS[effectiveSpeed] || SPEED_MS.normal);

// In haptics calls:
if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
```

**Step 2: Update ChoiceButton**

Add `accessibilityLabel` and `accessibilityRole="button"` props. Use `useAccessibility` for font size scaling.

**Step 3: Update PartyCard**

Add `accessibilityLabel` with character status summary. Use colorblind-safe colors for HP bars.

**Step 4: Verify**

Run: `npx tsc --noEmit`

**Step 5: Commit**

```bash
git add src/components/game/NarrativeText.tsx src/components/game/ChoiceButton.tsx src/components/game/PartyCard.tsx
git commit -m "feat: wire accessibility settings into game components"
```

---

### Task 11: DB Migration + Deploy + Final Verification

**Files:**
- Supabase DB (via MCP or SQL)
- All Edge Functions

**Step 1: Run DB migrations**

Execute via Supabase MCP or dashboard:

```sql
-- Origin AI context for characters
ALTER TABLE characters ADD COLUMN IF NOT EXISTS origin_ai_context TEXT DEFAULT '';

-- Tutorial flag for campaigns
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS is_tutorial BOOLEAN DEFAULT FALSE;

-- Accessibility settings for profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS accessibility_settings JSONB DEFAULT '{}';
```

**Step 2: Deploy all Edge Functions**

```bash
npx supabase functions deploy campaign-init --no-verify-jwt
npx supabase functions deploy game-turn --no-verify-jwt
```

**Step 3: Full TypeScript verification**

```bash
npx tsc --noEmit
```

**Step 4: Manual test checklist**

- [ ] Veteran path: Welcome → "I KNOW D&D" → race selection → full creation flow
- [ ] New path: Welcome → "I'M NEW" → tutorial class picker → tutorial campaign starts
- [ ] Tutorial turns 1-6 teach mechanics progressively
- [ ] Tutorial completion modal appears after turn 6
- [ ] "Create My Character" from tutorial → goes to race selection
- [ ] Origin AI context appears in DM narration (test with Exiled Noble)
- [ ] Settings screen accessible from game session header
- [ ] Text size changes apply across the app
- [ ] Dyslexia font toggle swaps all fonts
- [ ] Reduce motion skips text animation
- [ ] Haptics toggle works
- [ ] Colorblind mode remaps HP colors

**Step 5: Commit any final fixes**

```bash
git add -A
git commit -m "feat: complete Phase 2 — tutorial, accessibility, origin AI context"
```
