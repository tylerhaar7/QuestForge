# QuestForge Foundation Build Design

**Date:** 2026-03-04
**Scope:** Project scaffolding + 9 foundational files
**Approach:** Follow setup guide exactly (Option A)

---

## Context

QuestForge is an AI-powered solo D&D 5e mobile RPG. This is the initial build session — going from an empty directory to a running Expo project with all foundational code in place.

**Source docs:**
- `QuestForge MDs/questforge-setup-guide.md` — Step-by-step setup + file contents
- `QuestForge MDs/questforge-features-v2.md` — Feature specs (not built this session)

**Environment:** Node v24.14.0, npm 11.9.0, git 2.53.0, macOS (Intel MacBook Pro)

---

## Section 1: Project Scaffolding

1. Create Expo project: `npx create-expo-app@latest QuestForge --template blank-typescript`
2. Initialize git + initial commit
3. Install dependencies:
   - Core nav: expo-router, expo-linking, expo-constants, expo-status-bar, react-native-screens, react-native-safe-area-context
   - Animation: react-native-reanimated, react-native-gesture-handler, expo-haptics
   - Audio: expo-av
   - Fonts: expo-font, @expo-google-fonts/cinzel, @expo-google-fonts/crimson-text
   - Storage: react-native-mmkv
   - State: zustand
   - Server state: @tanstack/react-query
   - Backend: @supabase/supabase-js, react-native-url-polyfill
   - Dev: @types/react, @types/react-native
4. Configure app.json (dark theme, portrait, expo-router plugin)
5. Configure tsconfig.json (path aliases: @/*, @components/*, @engine/*, etc.)
6. Configure babel.config.js (reanimated plugin last)
7. Create full directory tree:
   - src/{theme,components/{ui,game},engine,ai/{prompts},services,stores,hooks,types,data}
   - app/{(auth),(tabs),game,create}
   - supabase/functions/{game-turn,generate-image,session-recap,campaign-init}
   - assets/{fonts,images,audio/{ambient,sfx}}

## Section 2: Foundational Files (in dependency order)

| # | File | Purpose |
|---|------|---------|
| 1 | `src/theme/colors.ts` | Dark fantasy color system — bg, gold, text, combat, ability, class, approval, mood variants |
| 2 | `src/theme/typography.ts` | Cinzel/CrimsonText/IMFellEnglish fonts, text styles (screen titles, narrative, combat, stats, choices), spacing |
| 3 | `src/types/game.ts` | All core types: DiceRoll, Character, Companion, CombatState, Campaign, AIResponse, Choice, SkillCheck, etc. |
| 4 | `src/engine/dice.ts` | Deterministic dice engine: rollDie, rollDice, parseFormula, rollAttack, rollSavingThrow, rollSkillCheck, rollInitiative, rollDamage, calculateSuccessChance |
| 5 | `src/services/supabase.ts` | Supabase client with MMKV storage adapter, placeholder URL/key |
| 6 | `src/stores/useGameStore.ts` | Zustand store: campaign/character state, AI response processing, combat, companion approval, UI state |
| 7 | `src/engine/character.ts` | getModifier, getProficiencyBonus, SKILL_ABILITIES map, getSkillModifier, getSaveModifier, CLASS_HIT_DIE, calculateMaxHP, calculateAC |
| 8 | `src/ai/prompts/dm-system.ts` | DM_SYSTEM_PROMPT (persona + rules + JSON format) + MECHANICAL_ENFORCEMENT |
| 9 | `app/_layout.tsx` | Root layout: font loading, QueryClientProvider, GestureHandlerRootView, dark Stack navigator |

All file contents taken directly from the setup guide document.

## Section 3: Fonts + CLAUDE.md

- Download 7 TTF files from Google Fonts into `assets/fonts/`:
  - Cinzel-Regular.ttf, Cinzel-Bold.ttf
  - CrimsonText-Regular.ttf, CrimsonText-Bold.ttf, CrimsonText-Italic.ttf
  - IMFellEnglish-Regular.ttf, IMFellEnglish-Italic.ttf
- Create `CLAUDE.md` in project root (per setup guide Section "CLAUDE.md for Claude CLI")

## Section 4: Verification

- Run `npx expo start` to confirm app boots (dark screen, no errors)
- Commit all work with descriptive messages

---

## Decisions Made

- **Supabase:** Placeholder credentials (no project set up yet)
- **Fonts:** Download TTFs automatically from Google Fonts
- **Scope:** Setup + 9 foundational files only. Combat engine and UI components deferred to next session.
- **Approach:** Follow setup guide 1:1, only deviation is using `npx expo` instead of global expo-cli

## Next Session

Build the next 10 files: combat engine, AI context builder, AI parser, and 7 game UI components (NarrativeText, ChoiceButton, AbilityCard, HpBar, PartyCard, ApprovalIndicator, game session screen).
