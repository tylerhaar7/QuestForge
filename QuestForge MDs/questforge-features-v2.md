# QuestForge — Feature Addendum v2
## Competitive Edge Features & QoL Systems

*Append to questforge-architecture.md and questforge-addendum.md*
*Based on deep competitive research across 6 AI D&D apps, 10+ adjacent games, and TTRPG community analysis*

---

## Table of Contents

1. Hybrid Architecture Enforcement (The #1 Fix)
2. Companion Approval System (BG3-inspired)
3. Death as Narrative Progression (Hades-inspired)
4. Branching Map Paths (Slay the Spire-inspired)
5. Camp Mechanic (BG3-inspired)
6. Telegraphed Enemy Intentions (Into the Breach-inspired)
7. Skill Check UI with Dice Rolls
8. Origin Stories & Personal Quests
9. Session Recaps & Auto-Journaling
10. NPC Relationship Tracker
11. Chekhov's Gun Tracker (Narrative Payoff System)
12. Dynamic Difficulty Adjustment
13. AI Image Generation (Character Portraits + Scene Art)
14. Smart Notifications
15. Daily Tavern Rumors (Login Rewards)
16. Living Codex (Lore Encyclopedia)
17. Meta-Progression System
18. Achievement System
19. Accessibility Features
20. Onboarding Dual-Track Tutorial
21. Voice Synthesis (Phase 3 Premium)
22. Ambient Music System
23. Cosmetic Store
24. Seasonal Adventure Passes
25. Updated Database Schema
26. Updated AI Prompt Additions
27. Updated Build Phases

---

## 1. Hybrid Architecture Enforcement

**Why:** Every competitor's #1 complaint is the AI doing math wrong — damage applied twice, spell slots duplicated, healing dealing damage. The root cause is letting the LLM handle mechanics.

**Rule: Claude NEVER does math. The game engine does ALL mechanical computation. Claude ONLY narrates.**

### Flow for Every Game Action:
```
Player Action → Claude interprets intent → Returns structured JSON
  → Game Engine resolves mechanics (dice, damage, HP, spell slots)
  → Results fed back to Claude → Claude narrates the outcome
```

### Add to `src/ai/prompts/dm-system.ts`:
```typescript
export const MECHANICAL_ENFORCEMENT = `
CRITICAL RULES — NEVER VIOLATE:
1. NEVER calculate damage, HP changes, or spell effects yourself
2. NEVER tell the player what number they rolled — request a roll and the engine handles it
3. NEVER track spell slots, HP, inventory, or conditions — the game engine does this
4. NEVER contradict the game state provided to you in the system prompt
5. When a player attacks, respond with dice_requests — the engine resolves and tells you the result
6. Your job is NARRATIVE ONLY — describe what happens, not the numbers

For attacks/spells, output:
{
  "dice_requests": [
    {"type": "attack_roll", "roller": "Varek", "ability": "Eldritch Blast", "target": "Goblin Chief"}
  ]
}

The engine will resolve this and inject the result into your next prompt:
"MECHANICAL RESULT: Varek's Eldritch Blast hits (rolled 17 vs AC 14) for 11 force damage. Goblin Chief HP: 23/34."

You then narrate: "Eldritch energy crackles from your fingertips, slamming into the Goblin Chief's chest. He staggers back, snarling, but stays on his feet."
`;
```

### Updated Edge Function Flow (`supabase/functions/game-turn/index.ts`):
```
1. Receive player action
2. Call Claude → get narrative + dice_requests + state_changes
3. Game engine resolves ALL dice_requests locally
4. Game engine applies ALL state changes (damage, healing, conditions, items)
5. Update Supabase with new state
6. If combat continues: inject mechanical results back into Claude's next call
7. Return final narrative + resolved results + updated state to client
```

---

## 2. Companion Approval System

**Why:** No AI D&D app has companions that feel like real people with opinions. BG3 proved this is what makes players emotionally invested.

### Database Addition:
```sql
-- Add to campaigns table or create separate table
CREATE TABLE companion_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  companion_name TEXT NOT NULL,
  approval_score INTEGER DEFAULT 50,  -- 0-100 scale, 50 = neutral
  relationship_stage TEXT DEFAULT 'acquaintance',
    -- acquaintance → friendly → trusted → bonded → romance (optional) → rival → hostile
  personal_quest_stage INTEGER DEFAULT 0,
  personal_quest_flags JSONB DEFAULT '{}',
  memorable_moments JSONB DEFAULT '[]',  -- [{turn, summary, approval_delta}]
  unlocked_abilities JSONB DEFAULT '[]', -- Abilities gained from high approval
  gift_history JSONB DEFAULT '[]',       -- Items given to companion
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(campaign_id, companion_name)
);
```

### Approval Thresholds:
```typescript
export const APPROVAL_THRESHOLDS = {
  hostile: { min: 0, max: 15, event: 'companion_threatens_leave' },
  cold: { min: 16, max: 30, event: 'companion_distant' },
  neutral: { min: 31, max: 50, event: null },
  friendly: { min: 51, max: 65, event: 'companion_opens_up' },
  trusted: { min: 66, max: 80, event: 'companion_personal_quest_unlock' },
  bonded: { min: 81, max: 95, event: 'companion_ability_unlock' },
  devoted: { min: 96, max: 100, event: 'companion_ultimate_loyalty' },
};
```

### AI Prompt Addition:
```typescript
export const COMPANION_APPROVAL_PROMPT = `
COMPANION APPROVAL SYSTEM:
After EVERY player choice that has moral, tactical, or personal implications,
include approval changes in your response:

"approval_changes": [
  {"companion": "Thaelen", "delta": -5, "reason": "disapproves of burning the forest"},
  {"companion": "Sera", "delta": +3, "reason": "respects the pragmatic choice"},
  {"companion": "Korrin", "delta": -8, "reason": "horrified by the deception"}
]

Guidelines per companion:
- Thaelen: +nature protection, +patience, +wisdom. -destruction, -haste, -fire
- Sera: +cleverness, +loyalty, +street smarts. -naivety, -authority, -unnecessary cruelty
- Korrin: +honor, +protection, +honesty. -deception, -cowardice, -harming innocents

At approval milestones, trigger special dialogue:
- Below 20: Companion confronts player, threatens to leave
- Above 65: Companion shares personal backstory
- Above 80: Companion's personal quest unlocks
- Above 95: Companion grants a unique ability to the player

IMPORTANT: Companions should NOT always agree with each other. Create tension.
A choice that pleases Sera might anger Korrin. Force the player to choose alliances.
`;
```

### UI Component: `src/components/game/ApprovalIndicator.tsx`
- Small floating indicator that briefly appears after choices: "▲ Sera approves" / "▼ Korrin disapproves"
- Uses Reanimated for slide-in/fade-out animation
- Haptic feedback on approval change
- Companion portrait pulses briefly with green (approval) or red (disapproval) border

---

## 3. Death as Narrative Progression (Hades-inspired)

**Why:** This is potentially QuestForge's single most innovative feature. Every other AI D&D app treats death as game-over. Hades proved death can be the most anticipated moment in a game.

### How It Works:
1. When the party wipes (TPK) or the player character dies and death saves fail:
   - Don't show "Game Over" — show a transition sequence
   - Fade to black → "The darkness takes you..." → Fade into the **Threshold**

2. **The Threshold** is a between-death hub area (like the House of Hades):
   - A liminal space between life and death
   - Staffed by a mysterious NPC guide (The Keeper) who comments on HOW you died
   - Companions who died are there too, processing the failure differently
   - New story threads and lore unlock ONLY through death
   - The player can talk to The Keeper, explore, and eventually choose to return

3. **Return to the world** at a narratively appropriate point:
   - Not a save-reload — the world moved forward while you were "gone"
   - The threat you failed to stop has progressed
   - NPCs reference your failure
   - New approaches and allies may have appeared

### Database Addition:
```sql
ALTER TABLE campaigns ADD COLUMN death_count INTEGER DEFAULT 0;
ALTER TABLE campaigns ADD COLUMN threshold_unlocks JSONB DEFAULT '[]';
-- Tracks what lore/dialogue has been unlocked through deaths
ALTER TABLE campaigns ADD COLUMN death_history JSONB DEFAULT '[]';
-- [{turn, cause, location, enemy, companions_present}]
```

### AI Prompt for The Threshold:
```typescript
export const THRESHOLD_PROMPT = `
THE THRESHOLD (triggered on player death):
The player has died. They find themselves in The Threshold — a vast, dim space
between life and death. Stone pillars stretch into fog. A faint heartbeat echoes.

The Keeper (an ancient, gender-ambiguous figure in grey robes) greets them.
The Keeper should:
- Reference SPECIFICALLY how the player died (not generic)
- Offer cryptic insight about the threat they faced
- Reveal one new piece of lore or world information only available through death
- Be wry, philosophical, never cruel — death is a teacher, not a punishment

Companions present in The Threshold should:
- React to death according to their personality
- Korrin: shaken but determined to do better
- Sera: dark humor, deflecting with jokes
- Thaelen: contemplative, seeks meaning in the failure

After the player is ready, offer return options:
1. Return to the world (time has passed — consequences exist)
2. Linger and explore The Threshold (discover hidden lore)
3. Ask The Keeper for guidance about the challenge that killed them

CRITICAL: Make death feel like a REWARD, not a punishment.
Each death should unlock something — lore, dialogue, an item, or knowledge
that makes the next attempt more meaningful.

Death count so far: ${deathCount}
Previous deaths: ${deathHistory}
The Keeper should reference previous visits if applicable.
`;
```

### Meta-progression from Death:
```typescript
export const DEATH_UNLOCKS = [
  { death: 1, unlock: 'threshold_access', desc: 'The Threshold hub unlocks' },
  { death: 2, unlock: 'keeper_lore_1', desc: 'The Keeper reveals world origin lore' },
  { death: 3, unlock: 'spectral_gift', desc: 'The Keeper gifts a Spectral Candle (see in darkness)' },
  { death: 5, unlock: 'death_defiance', desc: 'Once per campaign, cheat death (auto-stabilize at 1 HP)' },
  { death: 7, unlock: 'keeper_quest', desc: 'The Keeper has a personal request...' },
  { death: 10, unlock: 'threshold_companion', desc: 'A ghostly companion can be recruited from The Threshold' },
];
```

---

## 4. Branching Map Paths (Slay the Spire-inspired)

**Why:** Gives structure to open-ended AI narrative. Players choose risk/reward. The most mobile-optimized UI pattern in gaming.

### Data Model:
```typescript
export interface MapNode {
  id: string;
  type: 'combat' | 'elite' | 'boss' | 'rest' | 'merchant' | 'mystery' | 'social' | 'treasure';
  connections: string[];  // IDs of nodes this connects to
  completed: boolean;
  difficulty: 1 | 2 | 3;
  teaser: string;  // "A strange noise echoes from a side passage..."
  icon: string;    // Emoji for display
}

export interface AdventureMap {
  nodes: MapNode[];
  currentNodeId: string;
  chaptertTitle: string;
}
```

### When to Show the Map:
- At the start of each adventure chapter
- After completing an encounter
- The player picks their next node, Claude generates the encounter for that node type

### UI Component: `src/components/game/AdventureMap.tsx`
- Vertical scrolling node map (like Slay the Spire but fantasy-themed)
- Nodes as circular icons with type emoji
- Paths as connecting lines (gold for available, grey for locked)
- Current position highlighted with glow animation
- Tap a connected node to proceed → confirmation → Claude generates encounter

### AI Integration:
- Claude generates the initial map structure as JSON at the start of each chapter
- Each node type has a prompt template (combat encounters, merchant inventories, mystery events)
- Mystery nodes are the most creative — Claude generates anything: a puzzle, a trapped room, a moral dilemma, a vision, an NPC with a strange request

---

## 5. Camp Mechanic

**Why:** Creates emotional depth, pacing rhythm, and mobile-friendly session breaks. This is where players fall in love with their companions.

### When Camp Triggers:
- After completing 3-4 encounters
- Player manually chooses "Make Camp" from the menu
- After a boss fight or major story beat
- When HP is critically low (AI suggests it)

### Camp Activities (choose up to 3 per rest):
```typescript
export type CampActivity =
  | 'talk_companion'     // Talk to a specific companion (approval-gated dialogue)
  | 'rest'               // Long rest — full HP/spell slot recovery
  | 'cook'               // Use ingredients for temporary buffs
  | 'train'              // Gain small XP bonus or practice a skill
  | 'explore_camp'       // Random event — visitor, discovery, omen
  | 'give_gift'          // Give an item to a companion (approval boost)
  | 'journal'            // View auto-journal, add personal notes
  | 'companion_banter'   // Watch companions interact with each other
  | 'the_keepers_fire'   // Unlocked after first death — The Keeper visits camp dreams
```

### AI Prompt for Camp:
```typescript
export const CAMP_PROMPT = `
CAMP SEQUENCE:
The party has made camp. Generate a brief scene description (2-3 sentences)
based on the current location. Then present available activities.

When the player talks to a companion:
- Check their approval score and relationship stage
- Low approval: companion is terse, guarded, maybe hostile
- High approval: companion shares personal stories, asks about the player
- At trust thresholds: trigger personal quest dialogue
- Companions should reference recent events naturally

When companion_banter is chosen:
- Generate a conversation BETWEEN two companions (not involving the player)
- The player observes silently
- This builds world/character depth and can foreshadow events
- Topics: their pasts, opinions on recent events, fears, jokes, arguments

Example banter:
Sera: "You ever wonder what happens if we lose?"
Korrin: "We won't."
Sera: "That's not an answer, tin man."
Korrin: [long pause] "I know."
`;
```

### UI: `app/game/camp.tsx`
- Warm amber background gradient (contrast to dungeon/combat colors)
- Companion portraits arranged around a campfire illustration
- Activity buttons as circular icons
- Companion dialogue appears in a styled speech bubble
- Ambient campfire sound + forest/wind ambiance

---

## 6. Telegraphed Enemy Intentions

**Why:** Makes text-based combat feel tactical and puzzle-like instead of blind dice rolling.

### Implementation:
At the start of each player turn in combat, Claude describes what enemies INTEND to do:

```typescript
// AI response includes:
"enemy_intentions": [
  {
    "enemy": "Goblin Archer",
    "target": "Thaelen",
    "action": "Aimed Shot",
    "predicted_damage": "1d8+2 (avg 6)",
    "description": "The archer draws back, aiming at Thaelen's exposed flank."
  },
  {
    "enemy": "Orc Berserker",
    "action": "Reckless Charge",
    "target": "Varek",
    "predicted_damage": "2d6+4 (avg 11)",
    "special": "knockback 10ft",
    "description": "The orc lowers its shoulder, preparing to bull-rush you."
  }
]
```

### UI Component: `src/components/game/EnemyIntentions.tsx`
- Displayed above enemy cards during player's turn
- Each enemy shows an arrow pointing to their target
- Damage preview in red text
- Special effects (knockback, stun, etc.) shown as badges
- Creates "what do I do about THIS" tactical thinking

---

## 7. Skill Check UI with Dice Rolls

**Why:** This IS D&D. Visible dice rolls with modifiers, DCs, and consequences are core to the experience.

### When Claude Presents Dialogue/Action Options:
```json
{
  "choices": [
    {
      "text": "Perhaps we can reach an agreement...",
      "type": "diplomatic",
      "icon": "🗣️",
      "skill_check": {
        "skill": "persuasion",
        "dc": 14,
        "modifier": 6,
        "success_chance": 65,
        "advantage": false
      }
    },
    {
      "text": "I know what you're hiding. The cult marks on your wrists give you away.",
      "type": "knowledge",
      "icon": "🔍",
      "skill_check": {
        "skill": "insight",
        "dc": 12,
        "modifier": 4,
        "success_chance": 65,
        "advantage": false
      }
    },
    {
      "text": "Stand aside or I'll move you myself.",
      "type": "aggressive",
      "icon": "💪",
      "skill_check": {
        "skill": "intimidation",
        "dc": 16,
        "modifier": 2,
        "success_chance": 35,
        "advantage": false
      }
    }
  ]
}
```

### UI Enhancement to ChoiceButton:
- Show skill name and success % as a subtle tag: `[Persuasion — 65%]`
- When selected → full-screen dice roll animation with haptic
- d20 tumbles, lands, modifier adds on → total vs DC comparison
- Success: gold burst, triumphant haptic
- Failure: red pulse, consequence narration
- Critical success (nat 20): special animation + bonus outcome
- Critical failure (nat 1): dramatic failure animation + comedic/dramatic consequence

---

## 8. Origin Stories & Personal Quests

**Why:** Solves the blank-slate problem and gives AI-generated content a narrative spine from minute one.

### Pre-built Origins (choose during character creation):
```typescript
export const ORIGIN_STORIES = [
  {
    id: 'exiled_noble',
    name: 'Exiled Noble',
    description: 'You were born to privilege, but betrayal stripped you of title, land, and family. Someone close to you orchestrated your fall. You\'re hunting for the truth.',
    personal_quest: 'Uncover the betrayer and reclaim — or reject — your birthright',
    quest_flags: ['betrayer_identity_unknown', 'noble_house_fallen'],
    bonus_skills: ['persuasion', 'history'],
    unique_dialogue_tags: ['noble_speech', 'recognize_heraldry', 'political_knowledge'],
    ai_context: 'The player is an exiled noble. NPCs of high station may recognize their family name. The betrayer\'s identity should be slowly revealed through clues planted across the campaign.',
  },
  {
    id: 'haunted_scholar',
    name: 'Haunted Scholar',
    description: 'You opened a book you shouldn\'t have. Now something whispers in your dreams, and you understand languages that haven\'t been spoken in centuries. The knowledge is useful. The cost is unclear.',
    personal_quest: 'Discover what entity is feeding you knowledge — and what it wants in return',
    quest_flags: ['entity_unnamed', 'forbidden_knowledge_1'],
    bonus_skills: ['arcana', 'investigation'],
    unique_dialogue_tags: ['ancient_languages', 'forbidden_lore', 'dream_visions'],
    ai_context: 'The player hears whispers from an unknown entity. Occasionally feed them a vision or piece of forbidden knowledge. The entity should slowly reveal itself over the campaign as something more complex than good or evil.',
  },
  {
    id: 'debt_runner',
    name: 'Debt Runner',
    description: 'You owe a very dangerous person a very large sum. Every city has their agents. Every tavern might be a trap. You adventure because you need coin — fast — and because standing still means getting caught.',
    personal_quest: 'Pay the debt, kill the creditor, or find leverage to make it disappear',
    quest_flags: ['debt_amount_large', 'creditor_unknown_faction'],
    bonus_skills: ['deception', 'sleight_of_hand'],
    unique_dialogue_tags: ['street_knowledge', 'recognize_thugs', 'haggling'],
    ai_context: 'The player is being hunted by debt collectors. Occasionally introduce agents looking for them. The debt should tie into the larger plot. Give the player multiple paths to resolution — not just "pay it off."',
  },
  {
    id: 'oathbound',
    name: 'Oathbound',
    description: 'You made a promise to someone who died. You don\'t know exactly how to fulfill it, only that you must. The promise pulls you toward danger like a compass needle.',
    personal_quest: 'Fulfill the oath — whatever it costs',
    quest_flags: ['oath_target_unclear', 'oath_origin_traumatic'],
    bonus_skills: ['survival', 'perception'],
    unique_dialogue_tags: ['oath_references', 'death_awareness', 'honor_code'],
    ai_context: 'The player carries an oath to a dead person. The oath\'s true meaning should unfold gradually — what they think they promised and what the oath actually requires may be different. Build to a climactic choice.',
  },
  {
    id: 'reformed_cultist',
    name: 'Reformed Cultist',
    description: 'You were part of something terrible. You left — or were cast out. You know rituals, symbols, and secrets that most people shouldn\'t. Your former "family" hasn\'t forgotten you.',
    personal_quest: 'Stop the cult\'s plan — or be tempted back into the fold',
    quest_flags: ['cult_active', 'cult_agent_tracking'],
    bonus_skills: ['religion', 'intimidation'],
    unique_dialogue_tags: ['cult_recognition', 'dark_rituals', 'symbol_reading'],
    ai_context: 'The player is a former cultist. Occasionally introduce cult symbols, agents, or temptations. The cult should be connected to the main plot. Give the player moments where their dark knowledge is useful — and moments where it disturbs their companions.',
  },
  {
    id: 'last_of_the_order',
    name: 'Last of the Order',
    description: 'Your mentor, your allies, your entire order — gone. Destroyed in a single night. You survived because you weren\'t there. The guilt drives you as much as the need for answers.',
    personal_quest: 'Find out who destroyed the order and why — then decide what justice looks like',
    quest_flags: ['order_destroyed', 'survivor_guilt', 'destroyer_unknown'],
    bonus_skills: ['athletics', 'medicine'],
    unique_dialogue_tags: ['order_training', 'recognize_techniques', 'mentor_memories'],
    ai_context: 'The player is the sole survivor of a destroyed order. Plant clues about the destroyers across the campaign. Former members may have survived in hiding. The destruction should connect to the world\'s larger threats.',
  },
];
```

### Character Creation Integration:
- After race/class/subclass, present origin selection as visual cards
- Each card shows the origin name, a one-line hook, and the personal quest summary
- "Custom" option lets the player write their own (Claude adapts)
- Selected origin's `ai_context` is injected into EVERY Claude call

---

## 9. Session Recaps & Auto-Journaling

**Why:** D&D players spend 15+ min remembering what happened last session. AI Realm's auto-notes are their most praised feature. We do it better.

### Session Recap (on campaign load):
```typescript
// When player opens a saved campaign, call this edge function:
// supabase/functions/session-recap/index.ts

// Use Haiku (cheap, fast) to generate a recap from recent turns
const recapPrompt = `
Summarize the following game events as a dramatic "Previously on..." 
narration in 3-4 sentences. Focus on: the last major decision, 
current threat, and emotional state of the party.
Write in second person. Be vivid but concise.

Recent events:
${last20Turns.map(t => t.ai_response).join('\n---\n')}
`;

// Cost: ~$0.003 per recap using Haiku
```

### Auto-Journal System:
After each turn, extract structured data and store:

```sql
CREATE TABLE journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  turn_number INTEGER NOT NULL,
  entry_type TEXT NOT NULL, -- 'npc_met', 'quest_accepted', 'quest_completed',
                            -- 'location_discovered', 'item_found', 'item_lost',
                            -- 'lore_learned', 'decision_made', 'companion_event',
                            -- 'combat_victory', 'combat_defeat', 'level_up'
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  tags JSONB DEFAULT '[]',      -- For filtering: ['npc', 'combat', 'lore', etc.]
  related_npcs JSONB DEFAULT '[]',
  related_locations JSONB DEFAULT '[]',
  is_pinned BOOLEAN DEFAULT false, -- Player can pin important entries
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_journal_campaign ON journal_entries(campaign_id, created_at);
```

### Journal UI: `app/game/journal.tsx`
- Tabs: All | NPCs | Quests | Locations | Lore | Decisions
- Searchable text field
- Entries displayed as parchment-styled cards
- Timeline view option (visual timeline of events)
- Player can add personal notes to any entry
- Pin important entries to top

---

## 10. NPC Relationship Tracker

### Database:
```sql
CREATE TABLE npc_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  npc_name TEXT NOT NULL,
  disposition TEXT DEFAULT 'neutral',
    -- hostile, unfriendly, neutral, friendly, allied, romantic
  disposition_score INTEGER DEFAULT 50,  -- 0-100
  first_met_turn INTEGER,
  first_met_location TEXT,
  last_seen_turn INTEGER,
  last_seen_location TEXT,
  known_information JSONB DEFAULT '[]', -- What the player knows about this NPC
  secrets JSONB DEFAULT '[]',           -- What the NPC is hiding (for Claude)
  appearance TEXT,
  personality_summary TEXT,
  faction TEXT,
  is_alive BOOLEAN DEFAULT true,
  interaction_count INTEGER DEFAULT 0,
  UNIQUE(campaign_id, npc_name)
);
```

### UI: Accessible from journal or party screen
- NPC portraits (emoji or AI-generated) in a grid
- Disposition shown as a colored bar (red→yellow→green→blue)
- Tap to view full NPC dossier
- Filter by: faction, location, disposition, alive/dead

---

## 11. Chekhov's Gun Tracker

**Why:** AI DMs generate moment-to-moment but never set up and pay off plot threads. Human DMs do this naturally. This system forces narrative payoffs.

### Database:
```sql
CREATE TABLE plot_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  thread_name TEXT NOT NULL,           -- "The mysterious letter"
  description TEXT NOT NULL,            -- "A sealed letter was found on the dead courier"
  introduced_turn INTEGER NOT NULL,
  status TEXT DEFAULT 'active',         -- 'active', 'resolved', 'abandoned'
  resolved_turn INTEGER,
  resolution_description TEXT,
  urgency TEXT DEFAULT 'background',    -- 'immediate', 'upcoming', 'background'
  related_npcs JSONB DEFAULT '[]',
  related_quests JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### AI Integration:
```typescript
export const PLOT_THREAD_PROMPT = `
PLOT THREAD MANAGEMENT:
Active plot threads: ${JSON.stringify(activeThreads)}

Rules:
1. Every 15-20 turns, at least ONE active thread should be referenced or advanced
2. If a thread has been active for 30+ turns without advancement, create an event that forces it forward
3. When introducing new mysteries, items, or NPCs, they SHOULD connect to existing threads when possible
4. When a thread resolves, the resolution should feel earned — not sudden
5. Include thread updates in state_changes:
   "thread_updates": [
     {"thread_id": "abc", "action": "advance", "detail": "The mysterious letter's seal matches the cult symbol found in the ruins"}
   ]
6. Never have more than 5 active threads at once — resolve old ones before introducing new ones
`;
```

---

## 12. Dynamic Difficulty Adjustment

**Why:** An AI DM should adjust like a human DM — secretly making things easier when the party is struggling and harder when they're breezing through.

### Tracked Metrics (stored in campaign):
```typescript
export interface DifficultyProfile {
  win_rate_last_10: number;      // % of combats won
  avg_hp_at_combat_end: number;  // How close to death on average
  deaths: number;                 // Total death count
  session_length_avg: number;     // Minutes per session
  retry_rate: number;             // How often do they reload/redo
  input_frequency: number;        // Actions per minute (engagement)
  difficulty_preference: 'story' | 'balanced' | 'hardcore';  // Player-set
}
```

### AI Prompt Addition:
```typescript
export const DIFFICULTY_PROMPT = `
ADAPTIVE DIFFICULTY:
Player profile: ${JSON.stringify(difficultyProfile)}

If win_rate > 80%: Increase encounter difficulty. Add more enemies, use smarter tactics,
  introduce environmental hazards. Make the player WORK.
If win_rate < 40%: Reduce difficulty subtly. Enemies make tactical mistakes,
  provide more healing opportunities, have allies appear.
If avg_hp_at_combat_end < 20%: Encounters are too close — slightly easier.
If avg_hp_at_combat_end > 60%: Not challenging enough — harder.

Player preference: ${preference}
- "story": Focus on narrative, combat is light, success is frequent
- "balanced": Fair challenge, death possible but not frequent
- "hardcore": Punishing combat, scarce resources, death is expected

NEVER tell the player you're adjusting difficulty. Just DO it naturally,
like a good human DM would.
`;
```

### Settings UI:
- Three difficulty buttons: Story Mode | Balanced | Hardcore
- Description for each explaining what to expect
- Can change anytime from settings

---

## 13. AI Image Generation

**Why:** AI Realm's character portraits are their most praised feature. Scene art transforms text into a visual experience.

### Implementation:
```typescript
// Use an image generation API (Gemini Imagen, Stability, etc.)
// via Supabase Edge Function

// supabase/functions/generate-image/index.ts
// Accepts a prompt, returns a URL to the generated image stored in Supabase Storage

// Character Portrait: generated once at character creation
// Scene Art: generated at major story beats (2-5 per session)
// NPC Portrait: generated on first meeting with important NPCs
```

### Cost Management:
```typescript
export const IMAGE_GENERATION_RULES = {
  character_portrait: { trigger: 'character_creation', count: 1, tier: 'free' },
  scene_art: {
    trigger: 'major_story_beat',
    max_per_session: 3,            // Free tier
    max_per_session_premium: 8,    // Premium
    tier: 'free',
  },
  npc_portrait: { trigger: 'important_npc_first_meet', tier: 'champion' },
};
```

### Style Consistency:
- Define a master style prompt prefix for all image generation:
```typescript
export const ART_STYLE_PREFIX = 
  "Dark fantasy digital painting, dramatic lighting, rich colors, " +
  "detailed but stylized, similar to Magic: The Gathering card art. ";
```

---

## 14. Smart Notifications

**Why:** Drives return visits by making the story feel alive between sessions.

### Notification Types:
```typescript
export const NOTIFICATION_TEMPLATES = [
  // Narrative hooks (generated by Claude, stored in queue)
  { type: 'tavern_rumor', template: 'A stranger at the ${tavern} is asking about you by name...' },
  { type: 'companion_wants_to_talk', template: '${companion} has been quiet all evening. Something\'s on their mind.' },
  { type: 'world_event', template: 'Smoke rises from the direction of ${location}. Something has changed.' },
  { type: 'quest_reminder', template: 'The ${quest_name} grows more urgent. Time may be running out.' },

  // Meta notifications
  { type: 'streak_reminder', template: 'Your party awaits, adventurer. Day ${streak} of your quest.' },
  { type: 'new_content', template: 'A new seasonal campaign is available: ${campaign_name}' },
];

// Rules:
// - Maximum 2 notifications per day
// - Never send between 10pm-8am local time
// - Content should be in-character, never generic
// - Tapping opens the app to the relevant campaign
```

---

## 15. Daily Tavern Rumors (Login Rewards)

**Why:** Creates habit loops while staying in-character. Not generic currency drops.

### Implementation:
- On first daily app open, show a "Tavern Board" with a rumor/hook
- Generated by Haiku based on current campaign state (costs ~$0.001)
- Rumors can hint at upcoming encounters, side quests, or world events
- Some rumors are true, some are false — the player doesn't know
- Collecting 7 consecutive rumors unlocks a minor reward (cosmetic or lore entry)

### Streak System (forgiving):
```typescript
export const STREAK_RULES = {
  allow_one_miss: true,           // 1 missed day doesn't break streak
  weekly_reward_at: 7,            // Streak bonus at 7 days
  monthly_reward_at: 30,          // Major reward at 30 days
  rewards: {
    7: { type: 'cosmetic', item: 'tavern_regular_badge' },
    14: { type: 'bonus_session', desc: '1 extra session for free users' },
    30: { type: 'cosmetic', item: 'legendary_dice_skin' },
  },
};
```

---

## 16. Living Codex (Lore Encyclopedia)

**Why:** Pillars of Eternity proved players love tappable lore terms. Builds investment in the world.

### Implementation:
- Certain words in narrative text are highlighted (subtle gold underline)
- Tapping opens a bottom sheet with a codex entry
- Entries are auto-generated by Claude when new lore is introduced
- Organized by category: People, Places, Factions, Creatures, Items, History

### Database:
```sql
CREATE TABLE codex_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  term TEXT NOT NULL,
  category TEXT NOT NULL,   -- 'person', 'place', 'faction', 'creature', 'item', 'history'
  summary TEXT NOT NULL,    -- 2-3 sentences
  full_entry TEXT,          -- Longer description (unlocked through exploration)
  discovered_turn INTEGER,
  is_complete BOOLEAN DEFAULT false,  -- Full entry unlocked
  UNIQUE(campaign_id, term)
);
```

---

## 17. Meta-Progression System

**Why:** Completing campaigns should unlock new options for future campaigns, like Slay the Spire unlocking cards.

```typescript
export const META_UNLOCKS = [
  // Campaign completion unlocks
  { trigger: 'complete_first_campaign', unlock: 'hardcore_mode' },
  { trigger: 'complete_as_warlock', unlock: 'hexblade_subclass' },
  { trigger: 'complete_as_rogue', unlock: 'phantom_blade_subclass' },
  { trigger: 'reach_level_10', unlock: 'legendary_origin_story' },
  { trigger: 'die_5_times', unlock: 'threshold_companion' },
  { trigger: 'max_companion_approval', unlock: 'companion_origin_story' },
  { trigger: 'betray_oath', unlock: 'oathbreaker_subclass' },

  // Cosmetic unlocks
  { trigger: 'complete_campaign_under_50_deaths', unlock: 'golden_dice_skin' },
  { trigger: 'defeat_boss_without_taking_damage', unlock: 'perfect_combat_badge' },
  { trigger: 'play_30_days_streak', unlock: 'veteran_ui_theme' },
];
```

### Database:
```sql
CREATE TABLE meta_progression (
  user_id UUID PRIMARY KEY REFERENCES profiles(id),
  unlocks JSONB DEFAULT '[]',       -- List of unlock IDs achieved
  campaigns_completed INTEGER DEFAULT 0,
  total_play_time_minutes INTEGER DEFAULT 0,
  classes_played JSONB DEFAULT '[]', -- Classes completed a campaign with
  achievements JSONB DEFAULT '[]',
  cosmetics_owned JSONB DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 18. Achievement System

```typescript
export const ACHIEVEMENTS = [
  // Combat
  { id: 'first_blood', name: 'First Blood', desc: 'Win your first combat encounter', icon: '⚔️' },
  { id: 'critical_moment', name: 'Critical Moment', desc: 'Roll a natural 20 at a pivotal moment', icon: '🎯' },
  { id: 'against_all_odds', name: 'Against All Odds', desc: 'Win a combat with all party members below 25% HP', icon: '💀' },
  { id: 'untouchable', name: 'Untouchable', desc: 'Complete a combat without taking damage', icon: '🛡️' },
  { id: 'dragon_slayer', name: 'Dragon Slayer', desc: 'Defeat a dragon', icon: '🐉' },

  // Roleplay
  { id: 'silver_tongue', name: 'Silver Tongue', desc: 'Succeed on 5 Persuasion checks in a row', icon: '🗣️' },
  { id: 'dark_path', name: 'Dark Path', desc: 'Make 3 morally questionable decisions in one session', icon: '🌑' },
  { id: 'beloved', name: 'Beloved', desc: 'Reach maximum approval with any companion', icon: '💛' },
  { id: 'oathbreaker_rise', name: 'Fall from Grace', desc: 'Break your paladin oath', icon: '⛓️' },
  { id: 'back_from_death', name: 'Back from the Beyond', desc: 'Return from The Threshold for the first time', icon: '👻' },

  // Exploration
  { id: 'cartographer', name: 'Cartographer', desc: 'Discover 20 unique locations', icon: '🗺️' },
  { id: 'loremaster', name: 'Loremaster', desc: 'Unlock 50 codex entries', icon: '📚' },
  { id: 'completionist', name: 'Completionist', desc: 'Complete every quest in a campaign', icon: '✅' },

  // Meta
  { id: 'veteran', name: 'Veteran', desc: 'Complete your first campaign', icon: '🏆' },
  { id: 'multiclass', name: 'Jack of All Trades', desc: 'Play as 4 different classes', icon: '🎭' },
  { id: 'threshold_regular', name: 'The Keeper Remembers', desc: 'Visit The Threshold 10 times', icon: '🕯️' },
];
```

---

## 19. Accessibility Features

```typescript
// src/stores/useSettingsStore.ts — Add accessibility settings
export interface AccessibilitySettings {
  textSize: 'small' | 'medium' | 'large' | 'xlarge';  // Multiplier: 0.85, 1.0, 1.2, 1.4
  highContrast: boolean;            // Increases border/text contrast
  reduceMotion: boolean;            // Disables animations
  colorblindMode: 'none' | 'deuteranopia' | 'protanopia' | 'tritanopia';
  dyslexiaFont: boolean;            // Switches to OpenDyslexic font
  screenReaderOptimized: boolean;   // Adds comprehensive accessibilityLabels
  textSpeed: 'instant' | 'fast' | 'normal' | 'slow'; // Narrative text typing speed
  hapticFeedback: boolean;          // Toggle haptics
  narratorVoice: boolean;           // TTS for all narrative (Phase 3)
}
```

---

## 20. Onboarding Dual-Track Tutorial

### Flow:
```
App first launch → "Welcome to QuestForge"
  → Two buttons:
    "I'm new to D&D" → Tutorial campaign (teaches mechanics while playing)
    "I'm a D&D veteran" → Quick character creation → jump into campaign

Tutorial Campaign ("The First Door"):
- Pre-built character (customizable name/appearance)
- Guided encounter that teaches one system at a time:
  Turn 1: Narrative choice (teaches guided input)
  Turn 2: Simple combat (teaches abilities and dice)
  Turn 3: Skill check (teaches modifiers and DCs)
  Turn 4: Companion interaction (teaches approval system)
  Turn 5: Free choice moment (teaches freeform input)
  Turn 6: First real decision with consequences
- Total playtime: 8-12 minutes
- Ends with: "Your adventure begins. Create your own character?"
```

---

## 21-24. Phase 3+ Features (Brief Specs)

### 21. Voice Synthesis (Premium Only)
- Voice key NPC dialogue and dramatic narration
- Different voice ID per NPC (gruff dwarf, elegant elf, etc.)
- ~$0.02-0.06 per session at 20 voiced moments
- Toggle on/off per session

### 22. Ambient Music System
- Pre-generate 20-40 tracks for moods: tavern, dungeon, combat, forest, town, camp, boss, threshold
- Claude tags each response with `ambient_hint`
- Music crossfades between moods
- Store tracks in app bundle (not streamed)

### 23. Cosmetic Store (IAP)
- Portrait packs: $1.99-3.99 (art style variations)
- UI themes: $2.99 (Parchment, Elven, Dwarven Forge, Celestial, Abyssal)
- Dice skins: $0.99-1.99 (Crystal, Obsidian, Dragon Bone, Starlight)
- Journal styles: $1.99 (Scholar's Notebook, Pirate's Log, Royal Decree)

### 24. Seasonal Adventure Passes
- 30-day themed campaigns (e.g., "The Frost Crown" winter campaign)
- Free track: 20 tiers, basic rewards (XP boosts, common cosmetics)
- Premium track: $4.99, 50 tiers, exclusive cosmetics + narrative content
- Seasonal exclusive companions, enemies, locations

---

## 25. Updated Database Schema Summary

New tables to add:
```sql
-- companion_states (Section 2)
-- journal_entries (Section 9)
-- npc_relationships (Section 10)
-- plot_threads (Section 11)
-- codex_entries (Section 16)
-- meta_progression (Section 17)

-- Column additions to existing tables:
ALTER TABLE campaigns ADD COLUMN death_count INTEGER DEFAULT 0;
ALTER TABLE campaigns ADD COLUMN threshold_unlocks JSONB DEFAULT '[]';
ALTER TABLE campaigns ADD COLUMN death_history JSONB DEFAULT '[]';
ALTER TABLE campaigns ADD COLUMN difficulty_profile JSONB DEFAULT '{}';
ALTER TABLE campaigns ADD COLUMN active_plot_threads JSONB DEFAULT '[]';
ALTER TABLE campaigns ADD COLUMN adventure_map JSONB;
ALTER TABLE characters ADD COLUMN origin_story TEXT;
ALTER TABLE characters ADD COLUMN personal_quest_flags JSONB DEFAULT '{}';
ALTER TABLE characters ADD COLUMN portrait_url TEXT;
ALTER TABLE profiles ADD COLUMN accessibility_settings JSONB DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN notification_preferences JSONB DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN login_streak INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN last_login DATE;
```

---

## 26. Updated AI Prompt System

The system prompt now has these additional layers (added to context-builder.ts):

```
[SYSTEM PROMPT LAYERS — in order]
1.  DM Core Behavior (~800 tokens) — ALWAYS CACHED
2.  Mechanical Enforcement (~300 tokens) — ALWAYS CACHED  ★ NEW
3.  Current Mode Instructions (~400 tokens) — CACHED per mode
4.  World Lore (~500 tokens) — CACHED per campaign
5.  Story Summary (~300 tokens)
6.  Active Quests (~200 tokens)
7.  Active Plot Threads (~200 tokens) ★ NEW
8.  Party State (~400 tokens)
9.  Character Details + Origin Story (~400 tokens) ★ UPDATED
10. Companion Personalities + Approval Scores (~500 tokens) ★ UPDATED
11. NPC Relationships (~200 tokens) ★ NEW
12. Difficulty Profile (~100 tokens) ★ NEW
13. Freeform Mode Instructions (~200 tokens, if active) — from previous addendum
14. Companion Approval Prompt (~300 tokens) ★ NEW
15. Plot Thread Management (~200 tokens) ★ NEW

[USER MESSAGES]
16. Recent turns (last 6-10)
17. Player's current action

Total: ~5,000-6,500 tokens input, ~1,000-2,000 tokens output
Layers 1-4 are prompt-cached (90% cost reduction on those tokens)
```

---

## 27. Updated Build Phases

### Phase 1: Foundation + Core Engine (Weeks 1-3)
```
Same as original Phase 1-2, plus:
- Implement difficulty_profile tracking
- Add origin_story to character creation
- Set up all new database tables
```

### Phase 2: Character Creation + Tutorial (Weeks 3-5)
```
Same as original Phase 3, plus:
- Add origin story selection step
- Build tutorial campaign "The First Door"
- Implement dual-track onboarding
- Add accessibility settings screen
```

### Phase 3: AI Integration + Core Game (Weeks 5-8)
```
Same as original Phase 4-5, plus:
- Add mechanical enforcement to prompts
- Implement companion approval system (AI prompt + UI indicator)
- Build skill check UI with dice roll animation
- Build telegraphed enemy intentions display
- Implement Chekhov's Gun tracker
- Build adventure map (Slay the Spire nodes)
```

### Phase 4: Engagement Systems (Weeks 8-10)
```
- Build camp mechanic (full camp screen + companion conversations)
- Build death/Threshold system
- Implement session recaps
- Build auto-journal + journal UI
- Build NPC relationship tracker
- Build living codex
- Implement smart notifications
- Implement daily tavern rumors
```

### Phase 5: Monetization + Polish (Weeks 10-12)
```
Same as original Phase 7-8, plus:
- Implement meta-progression system
- Build achievement system + achievement UI
- Implement AI image generation (portraits + scenes)
- Build cosmetic store
- Dynamic difficulty adjustment
- Ambient music integration
- Full accessibility implementation
- TestFlight beta
```

### Phase 6: Premium Features (Post-Launch)
```
- Voice synthesis integration
- Seasonal adventure passes
- Community features
- Campaign sharing
- Multiplayer co-op
```

---

## Key Files to Add (for Claude CLI reference)

Priority new files to build, in addition to the original 11:

```
12. src/components/game/ApprovalIndicator.tsx     — Companion approval popup
13. src/components/game/EnemyIntentions.tsx        — Telegraphed enemy actions
14. src/components/game/AdventureMap.tsx           — Slay the Spire node map
15. src/components/game/ActionInput.tsx            — Dual mode input (guided + freeform)
16. app/game/camp.tsx                              — Camp screen
17. app/game/threshold.tsx                         — Death hub screen
18. app/game/journal.tsx                           — Auto-journal viewer
19. app/game/codex.tsx                             — Living lore encyclopedia
20. src/ai/prompts/dm-mechanical-enforcement.ts    — Rules for Claude never doing math
21. src/ai/prompts/dm-companion-approval.ts        — Companion personality & approval rules
22. src/ai/prompts/dm-threshold.ts                 — Death/Threshold narrative prompts
23. src/ai/prompts/dm-plot-threads.ts              — Chekhov's Gun management
24. src/ai/prompts/dm-difficulty.ts                — Dynamic difficulty instructions
25. src/engine/difficulty.ts                       — Difficulty tracking & profile calculation
26. src/data/origins.ts                            — Origin story definitions
27. src/data/achievements.ts                       — Achievement definitions
28. src/data/meta-unlocks.ts                       — Meta-progression definitions
29. supabase/functions/generate-image/index.ts     — Image generation edge function
30. supabase/functions/session-recap/index.ts      — Session recap generator
```
