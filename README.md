# QuestForge

AI-powered solo D&D 5e mobile RPG. Claude serves as the Dungeon Master, narrating your adventure while a deterministic game engine handles all dice, damage, and mechanics.

## Tech Stack

- **Client:** React Native + Expo (SDK 55), TypeScript, Expo Router
- **State:** Zustand (client), React Query (server), MMKV (local cache)
- **Backend:** Supabase (auth, Postgres, Edge Functions)
- **AI:** Claude API (Haiku for exploration, Sonnet for combat/story) via Edge Functions
- **UI:** react-native-reanimated, expo-haptics, custom fantasy UI kit
- **Fonts:** Cinzel (headings), Crimson Text (body), IM Fell English (narrative)

## Features

- **Full D&D 5e Character Creation** — 9 races, 13 classes (including Artificer), 20 official backgrounds with origin feats, starting equipment choices, spell/cantrip selection, and custom backstory
- **AI Dungeon Master** — Claude generates narrative, NPC dialogue, encounter design, and reacts to player choices with structured JSON responses
- **Companion System** — BG3-inspired party members with approval tracking (0-100), relationship stages, and personality-driven reactions
- **Combat Engine** — Turn-based with telegraphed enemy intentions (Into the Breach style), XP rewards, loot drops, and level-up progression
- **11-Slot Equipment System** — Head, body, cloak, hands, feet, neck, rings, waist, main hand, off hand with interactive equip/unequip UI and AC recalculation
- **The Threshold** — Hades-inspired death hub — death is progression, not game over
- **Living Codex** — Tappable lore entries that build as you explore
- **Adventure Map** — Slay the Spire branching node map for campaign progression
- **Fantasy UI Kit** — Wood-framed panels, corner studs, inventory slots, parchment character sheet with scroll curls

## Getting Started

### Prerequisites

- Node.js 18+
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- Supabase project (see setup below)
- Anthropic API key

### Setup

1. Clone and install:
   ```bash
   git clone https://github.com/tylerhaar7/QuestForge.git
   cd QuestForge
   npm install
   ```

2. Create `.env` from the template:
   ```bash
   cp .env.example .env
   ```
   Fill in your Supabase URL and anon key.

3. Set Supabase Edge Function secrets (via dashboard or CLI):
   - `ANTHROPIC_API_KEY` — your Claude API key
   - `ALLOWED_ORIGINS` — comma-separated allowed CORS origins (optional, defaults to localhost)

4. Apply database migrations:
   ```bash
   supabase db push
   ```

5. Deploy Edge Functions:
   ```bash
   supabase functions deploy game-turn --no-verify-jwt --project-ref <your-project-ref>
   supabase functions deploy campaign-init --no-verify-jwt --project-ref <your-project-ref>
   ```
   > **Important:** `--no-verify-jwt` is required. This project verifies JWTs inside
   > each function via `supabase.auth.getUser()`. The Supabase gateway's legacy JWT
   > verification must remain disabled — CLI deploys reset it to enabled by default.

6. Start the dev server:
   ```bash
   npx expo start
   ```

### Running on Device

```bash
# iOS (requires Xcode)
npx expo run:ios

# Android (requires Android Studio)
npx expo run:android

# Expo Go (limited — no native modules like expo-gl)
npx expo start
```

## Architecture

```
app/                    Expo Router screens (file-based routing)
  create/               Character creation flow (8 steps)
  game/                 Gameplay screens (narrative, combat, character sheet)
  (auth)/               Authentication screens
src/
  engine/               D&D 5e mechanics (dice, combat, HP, AC, progression — no AI)
  ai/                   Prompt building, response parsing, model routing
  components/
    game/               Game UI (NarrativeText, ChoiceButton, PartyCard, MoodParticles)
    ui/                 Fantasy UI kit (FantasyPanel, InventorySlot, CreationHeader)
  data/                 D&D 5e data (races, classes, backgrounds, feats, spells, origins)
  stores/               Zustand state (useGameStore, useCharacterCreationStore)
  services/             Supabase client, campaign/character API calls
  theme/                Colors, typography, spacing
  types/                TypeScript definitions
supabase/
  functions/
    game-turn/          Main gameplay loop (player action -> Claude -> dice -> narrate)
    campaign-init/      New campaign creation + opening narration
    _shared/            Shared modules (parser, guards, CORS, types, prompts, dice engine)
  migrations/           SQL migrations (RLS policies, rate limits)
```

### Core Rules

1. **Claude never does math.** The game engine resolves all dice, damage, HP, AC, and spell slots. Claude only narrates outcomes.
2. **Supabase stores all persistent state.** Campaigns, characters, companions, NPCs, quests — all in Postgres with RLS.
3. **Structured AI responses.** Claude returns JSON matching the `AIResponse` type. A shared parser handles malformed output.
4. **Model routing.** Haiku for exploration turns, Sonnet for combat/social/boss encounters.

## Character Creation

8-step flow with back navigation:

1. **Race** — 9 races with tappable trait descriptions
2. **Class** — 13 classes with tappable feature descriptions and hit die display
3. **Abilities** — Standard array assignment with recommended distribution per class
4. **Background** — 20 D&D 5e backgrounds (13 PHB + 7 expansion) with skill proficiencies, tool proficiencies, languages, features, and origin feat selection
5. **Origin** — 6 narrative origins with personal quests, suggested backstory prompts, or custom backstory (1200 chars)
6. **Equipment** — Class-specific gear choices with full stat comparison (AC, DEX cap, stealth, weight, damage type, range)
7. **Spells** — Cantrip and 1st-level spell selection for caster classes with recommended quick-fill
8. **Summary** — Review all choices, name your character, begin adventure

## Database

9 tables with Row Level Security enforcing per-user ownership:

| Table | Ownership |
|-------|-----------|
| profiles | `auth.uid() = id` |
| characters | `auth.uid() = user_id` |
| campaigns | `auth.uid() = user_id` |
| companion_states | via campaign join |
| journal_entries | via campaign join |
| npc_relationships | via campaign join |
| plot_threads | via campaign join |
| codex_entries | via campaign join |
| meta_progression | `auth.uid() = user_id` |
| rate_limits | service_role only |

## Security

- All UPDATE policies include `WITH CHECK` to prevent ownership mutation
- Edge Functions validate input (UUID format, max lengths, allowed modes)
- Per-user rate limiting: 10 game-turns/min, 5 campaign-inits/min (fail-closed)
- Dynamic CORS with env-configurable allowed origins
- Sanitized error responses (no internal details leak to clients)
- MMKV encryption key stored in device keychain via expo-secure-store
- JWT gateway verification disabled; each Edge Function verifies tokens via `supabase.auth.getUser()`
- Anthropic API key lives only in Supabase secrets (never in client code)

## Design

Dark fantasy aesthetic inspired by BG3, Hades, and Slay the Spire:

- **Colors:** Near-black background (#0d0a08), gold accents (#b48c3c), warm off-white text (#e8dcc8)
- **Mood shifts:** Dungeon, combat, tavern, forest, town, camp, threshold — each with distinct palettes
- **UI Kit:** Wood-framed FantasyPanels with corner studs, dark inset InventorySlots, parchment scroll character sheet
- **Companions:** BG3-style approval system (0-100), camp conversations, personal quests
- **Death:** Hades-inspired Threshold hub — death is progression, not game over
- **Combat:** Into the Breach-style telegraphed enemy intentions
- **Haptics:** Dice rolls, combat hits, choice selection, equipment changes

## Scripts

```bash
npx tsc --noEmit                              # Type check
npx expo start                                # Dev server
npx expo prebuild --clean                     # Generate native projects
eas build --platform ios --profile production  # Build + auto-submit to TestFlight
```

## License

Private. All rights reserved.
