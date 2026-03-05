# Phase 3: Playable Game Loop — Design

**Goal:** Wire up the minimum end-to-end game loop so a player can create a character, start a campaign, and play D&D turns with Claude as DM.

**Scope:** Campaign init, game turn resolution, app wiring. No adventure map, no camp/journal/codex/threshold screens, no image generation.

---

## Edge Function: `campaign-init`

**Trigger:** Player finishes character creation.

**Two creation modes:**
1. **Generated** — Claude creates a full adventure based on character race, class, origin, and companions. Player just hits go.
2. **Custom prompt** — Player types a premise (e.g., "A heist in a floating city") and Claude builds the opening from that.

**Flow:**
1. Receives: character data, companion roster, mode (`generated` | `custom`), optional custom prompt
2. Creates campaign row in Supabase (character_id, location, turn 0, exploration mode)
3. Creates 3 companion_state rows (Korrin, Sera, Thaelen — 50 approval, full HP)
4. Builds system prompt: DM persona + mechanical enforcement + character context + origin AI context
5. Calls Claude Sonnet with either:
   - Generated: "Create an opening adventure for this character..."
   - Custom: "The player wants: {prompt}. Create an opening scene..."
6. Returns: campaign ID + opening narration + first choices

**Cost:** ~$0.02 per campaign init (one Sonnet call)

---

## Edge Function: `game-turn`

**Trigger:** Player picks a choice or types a freeform action.

**Flow:**
1. Receives: campaign ID, player action (choice text or freeform)
2. Fetches latest campaign/character/companion state from Supabase
3. Builds prompt: system prompt + character + companions + mode instructions + recent turn history
4. Routes model: Haiku (exploration, simple dialogue) or Sonnet (combat, story beats, social)
5. Claude returns AIResponse JSON (narration, choices, dice_requests, state_changes, approval_changes)
6. If dice_requests exist: engine resolves them server-side (attacks, saves, skill checks, damage), injects results back into a follow-up Claude call for narration
7. Applies state_changes to Supabase (HP, conditions, items, XP, location)
8. Updates companion approval scores in companion_states table
9. Increments campaign turn count
10. Returns: final narration + new choices + resolved dice results + updated state

**Two-call pattern for combat:** Claude requests dice → engine resolves → Claude narrates outcome. Non-combat turns are single-call.

**Cost:** ~$0.005-0.015 per turn

---

## App Wiring

### Campaign Service (`src/services/campaign.ts`)
- `initCampaign(characterId, mode, customPrompt?)` — calls campaign-init Edge Function
- `loadCampaign(campaignId)` — fetches campaign + companions + character from Supabase, populates useGameStore
- `submitAction(campaignId, action)` — calls game-turn Edge Function, processes response, updates store

### session.tsx Changes
- `handleChoicePress` calls `submitAction()` instead of console.log stub
- On response: updates narration, choices, companion approvals via store
- Dice results displayed before narration when present

### Character Creation Finish
- New screen after summary: "How do you want to start?" with Generated vs Custom options
- Custom mode shows text input for campaign premise
- Calls campaign-init → routes to game/session

### index.tsx Routing
- On app load with existing campaign: calls `loadCampaign()` to hydrate store

### AI Prompts (server-side in Edge Functions)
- System prompt + mechanical enforcement (from existing dm-system.ts)
- Mode instructions for exploration/combat/social (from existing context-builder)
- Companion approval prompt (tells Claude to include approval_changes with each response)

---

## Companions (Basic)
- 3 starter companions: Korrin (fighter/paladin), Sera (rogue), Thaelen (druid/ranger)
- Show in party strip with HP/AC
- Approval changes come back from Claude and display via ApprovalStack
- No relationship stage transitions or personal quest unlocks in this pass

---

## What This Enables
- Create a character (race, class, abilities, origin, name)
- Start a campaign (generated or custom premise)
- Play turns: read narration, pick choices, see dice results, watch approval changes
- Combat: enemies telegraph intentions, player picks actions, engine resolves dice
- Exploration/social: Claude drives narrative, player picks from choices or types freeform
