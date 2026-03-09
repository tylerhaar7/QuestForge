# QuestForge

AI-powered solo D&D 5e mobile RPG. Claude serves as the Dungeon Master, narrating your adventure while a deterministic game engine handles all dice, damage, and mechanics.

## Tech Stack

- **Client:** React Native + Expo (SDK 55), TypeScript, Expo Router
- **State:** Zustand (client), React Query (server), MMKV (local cache)
- **Backend:** Supabase (auth, Postgres, Edge Functions)
- **AI:** Claude API (Haiku for exploration, Sonnet for combat/story) via Edge Functions
- **UI:** react-native-reanimated, expo-haptics, Cinzel/Crimson Text/IM Fell English fonts

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
   > The `supabase/config.toml` also sets `verify_jwt = false` per function.

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
src/
  engine/               D&D 5e mechanics (dice, combat, HP — no AI)
  ai/                   Prompt building, response parsing, model routing
  components/game/      Game UI (NarrativeText, ChoiceButton, PartyCard, etc.)
  stores/               Zustand state (useGameStore, useSettingsStore)
  services/             Supabase client, campaign/character API calls
  theme/                Colors, typography, spacing
  types/                TypeScript definitions
  data/                 Companion roster, dice skins
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

See `docs/security-smoke-tests.md` for the full verification checklist.

## Design

Dark fantasy aesthetic inspired by BG3, Hades, and Slay the Spire:

- **Colors:** Near-black background (#0d0a08), gold accents (#b48c3c), warm off-white text (#e8dcc8)
- **Mood shifts:** Dungeon, combat, tavern, forest, town, camp, threshold — each with distinct palettes
- **Fonts:** Cinzel (headings), Crimson Text (body), IM Fell English (narrative)
- **Companions:** BG3-style approval system (0-100), camp conversations, personal quests
- **Death:** Hades-inspired Threshold hub — death is progression, not game over
- **Combat:** Into the Breach-style telegraphed enemy intentions

## Scripts

```bash
npx tsc --noEmit          # Type check
npx expo start            # Dev server
npx expo prebuild --clean # Generate native projects
eas build --platform ios  # Production iOS build
eas submit --platform ios # Submit to TestFlight
```

## License

Private. All rights reserved.
