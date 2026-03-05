# QuestForge — AI D&D Solo RPG

## Project Overview
QuestForge is an AI-powered solo D&D 5e mobile game built with React Native + Expo.
Claude (via API) serves as the Dungeon Master. The app has AI-controlled party members,
a deterministic D&D 5e game engine, and a Supabase backend.

## Tech Stack
- React Native + Expo (SDK 55+), TypeScript
- Expo Router (file-based routing)
- Zustand (client state), React Query (server state), MMKV (local cache)
- Supabase (auth, database, Edge Functions)
- Claude API (Haiku + Sonnet) via Supabase Edge Functions
- react-native-reanimated (animations), expo-haptics, expo-av

## Architecture Rules
1. **Claude NEVER does math.** The game engine handles ALL dice, damage, HP, AC, spell slots.
   Claude only narrates outcomes that the engine resolves.
2. **Supabase stores ALL persistent state.** Campaign, character, companions, NPCs, quests.
3. **Structured AI responses.** Claude always returns JSON matching the AIResponse type.
4. **Prompt caching.** System prompt + world lore + mode instructions are cached per campaign.
5. **Model routing.** Haiku for simple turns, Sonnet for combat/story/social scenes.

## Key Directories
- `src/engine/` — D&D 5e mechanics (deterministic, no AI)
- `src/ai/` — Prompt building, response parsing, model routing
- `src/components/game/` — Game UI components
- `src/stores/` — Zustand state management
- `src/services/` — Supabase client, API calls
- `src/theme/` — Colors, typography, spacing
- `src/types/` — TypeScript definitions
- `app/` — Expo Router screens
- `supabase/functions/` — Edge Functions (server-side AI calls)

## Design System
- Colors: Dark fantasy (near-black bg, gold accents, warm off-white text)
- Fonts: Cinzel (headings), Crimson Text (body), IM Fell English (narrative)
- Animations: Reanimated for combat, dice rolls, UI transitions
- Haptics on: dice rolls, combat hits, choice selection, approval changes

## Important Patterns
- Game state flows through useGameStore (Zustand)
- AI responses are parsed into typed AIResponse objects
- Companion approval tracked as 0-100 score with relationship stages
- Enemy intentions are telegraphed before player's turn
- Death triggers The Threshold hub (Hades-inspired), not game over
- Plot threads tracked in Supabase, injected into AI context for narrative payoff
