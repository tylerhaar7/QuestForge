# Phase 2 Completion Design — Origin AI, Tutorial, Accessibility

**Date:** 2026-03-05
**Status:** Approved

## Overview

Four remaining Phase 2 features to complete before moving to Phase 3 (AI Integration + Core Game).

---

## 1. Origin AI Integration

**Goal:** Inject origin story's `aiContext` into Claude prompts so the DM weaves the player's backstory into the narrative.

**Approach:** Store `aiContext` in the characters DB row (not just the origin ID). Edge Functions read it directly — no data duplication.

**Changes:**
- `app/create/summary.tsx` — When saving character, include `aiContext` from selected origin (or custom text)
- `src/services/character.ts` — Pass `origin_ai_context` field to Supabase insert
- `supabase/functions/_shared/prompts.ts` — Append origin AI context to the character block in `buildSystemPrompt()`
- DB migration: Add `origin_ai_context TEXT` column to characters table (verify `origin_story` column also exists)

---

## 2. Dual-Track Routing

**Goal:** "I'M NEW" button routes to tutorial, "I KNOW D&D" routes to full character creation.

**Changes:**
- `app/create/index.tsx` — Branch `handleStart()`:
  - `'veteran'` → `/create/race` (unchanged)
  - `'new'` → `/create/tutorial` (new screen)

---

## 3. Tutorial Campaign — "The First Door"

**Goal:** 6-turn guided campaign that teaches one game mechanic per turn. Server-side enforced.

### New Screen: `app/create/tutorial.tsx`
- Simplified class picker: Fighter, Rogue, Wizard, Cleric (large cards)
- Name input (optional, defaults per class)
- "BEGIN" button → calls campaign-init with `mode: 'tutorial'`

### Server-Side Tutorial Logic
- `campaign-init` Edge Function: When `mode === 'tutorial'`, creates campaign with `is_tutorial: true`, assigns default companions (Korrin, Sera, Thaelen), uses tutorial-specific opening prompt
- `game-turn` Edge Function: Checks `is_tutorial` flag and `turn_count`. Injects tutorial instruction per turn:
  - Turn 1: Narrative choice (teaches guided input)
  - Turn 2: Simple combat (teaches abilities & dice)
  - Turn 3: Skill check (teaches modifiers & DCs)
  - Turn 4: Companion interaction (teaches approval system)
  - Turn 5: Free choice moment (teaches freeform input)
  - Turn 6: Meaningful decision with consequences, includes `tutorial_complete: true`

### Post-Tutorial Flow
- Game session detects `tutorial_complete` in AI response
- Shows modal: "Your adventure begins. Create your own character?"
- Options: "Create My Character" → `/create/race`, "Continue Playing" → keeps tutorial character

### DB Changes
- Add `is_tutorial BOOLEAN DEFAULT FALSE` to campaigns table

### Tutorial Character Defaults (per class)
| Class   | Name    | HP | AC | Key Stat |
|---------|---------|----|----|----------|
| Fighter | Aldric  | 12 | 16 | STR 16   |
| Rogue   | Kael    | 9  | 14 | DEX 16   |
| Wizard  | Lywen   | 7  | 12 | INT 16   |
| Cleric  | Miriel  | 10 | 16 | WIS 16   |

---

## 4. Accessibility Settings (Full Spec)

**Goal:** Complete accessibility system with 8 active settings (TTS deferred to Phase 3).

### New Store: `src/stores/useSettingsStore.ts`
- Zustand + MMKV persistence
- `AccessibilitySettings` interface with defaults

### New Screen: `app/settings.tsx`
- Dedicated settings icon in game session header
- Sections: Display, Motion, Color, Input, Audio
- Immediate feedback where possible

### Settings Implementation

| Setting | Effect | Files Touched |
|---------|--------|---------------|
| `textSize` (small/medium/large/xlarge) | Multiplier 0.85/1.0/1.2/1.4 on all font sizes | `src/theme/typography.ts`, context provider |
| `highContrast` | Boost border/text contrast | `src/theme/colors.ts` helper |
| `reduceMotion` | Skip animations to final state | `src/components/game/NarrativeText.tsx`, any animated components |
| `colorblindMode` (deuteranopia/protanopia/tritanopia) | Remap status colors (HP, conditions) | `src/theme/colors.ts` helper |
| `dyslexiaFont` | Swap to OpenDyslexic font family | `src/theme/typography.ts`, font asset |
| `screenReaderOptimized` | Add accessibilityLabel/Role to interactive elements | All interactive components |
| `textSpeed` (instant/fast/normal/slow) | NarrativeText typing speed | `src/components/game/NarrativeText.tsx` |
| `hapticFeedback` | Toggle all haptic calls | Wrapper around `expo-haptics` |

### Dependencies
- OpenDyslexic font file (~200KB) added to `assets/fonts/`
- `expo-font` for loading (already available via Expo)

### DB Changes
- Add `accessibility_settings JSONB DEFAULT '{}'` to profiles table

---

## Architecture Decisions

1. **Origin AI context stored in DB** — Self-contained, Edge Functions read directly
2. **Tutorial enforced server-side** — Edge Function tracks turn_count and injects tutorial prompts
3. **Tutorial character: player picks class** — 4 beginner-friendly options (Fighter/Rogue/Wizard/Cleric)
4. **Settings via dedicated header icon** — Always accessible during gameplay
5. **OpenDyslexic included now** — Full accessibility from the start
6. **MMKV for settings persistence** — Fast local reads, synced to Supabase profiles for cross-device
