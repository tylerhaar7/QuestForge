# Phase 3: Playable Game Loop — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Wire up the minimum end-to-end game loop: create character → start campaign (generated or custom) → play D&D turns with Claude as DM.

**Architecture:** Supabase Edge Functions (Deno) call Claude API server-side. Game engine resolves dice server-side in the Edge Function. Client calls Edge Functions via `supabase.functions.invoke()`. Zustand store processes responses. All existing client-side code (types, parser, context-builder, UI components) is reused.

**Tech Stack:** Supabase Edge Functions (Deno), Anthropic Claude API (Haiku 4.5 + Sonnet 4.6), existing React Native + Expo app

**Source docs:**
- `docs/plans/2026-03-04-phase3-playable-loop-design.md` — Approved design
- `src/types/game.ts` — All type definitions
- `src/ai/prompts/dm-system.ts` — Existing DM system prompt
- `src/ai/context-builder.ts` — Existing context builder (reference for server-side port)
- `src/engine/combat.ts` — Existing dice resolution (reference for server-side port)

---

### Task 1: Add turn_history column to campaigns table

**Files:**
- Supabase migration (applied via MCP)

**Step 1: Apply migration**

```sql
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS turn_history jsonb DEFAULT '[]'::jsonb;
COMMENT ON COLUMN campaigns.turn_history IS 'Last 20 turns as [{role, content}] for Claude context window';
```

Apply via Supabase MCP `apply_migration` with name `add_turn_history_column`.

**Step 2: Verify**

Run: `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'turn_history';`

Expected: One row showing `turn_history | jsonb`

---

### Task 2: Create starter companions data

**Files:**
- Create: `src/data/companions.ts`

**Step 1: Create the file**

```typescript
// Starter companions — Korrin, Sera, Thaelen
// These are the default party members for every new campaign

import type { Companion, ClassName, Condition } from '@/types/game';

export interface StarterCompanion {
  name: string;
  className: ClassName;
  level: number;
  maxHp: number;
  ac: number;
  portrait: string;
  color: string;
  personality: {
    approves: string[];
    disapproves: string[];
    voice: string;
    backstory: string;
  };
  abilities: {
    name: string;
    type: 'attack' | 'spell' | 'reaction' | 'bonus' | 'heal';
    description: string;
    icon: string;
  }[];
}

export const STARTER_COMPANIONS: StarterCompanion[] = [
  {
    name: 'Korrin',
    className: 'fighter',
    level: 1,
    maxHp: 12,
    ac: 16,
    portrait: '',
    color: '#c4a035',
    personality: {
      approves: ['honor', 'protection', 'honesty', 'bravery', 'defending_innocents'],
      disapproves: ['deception', 'cowardice', 'harming_innocents', 'betrayal', 'cruelty'],
      voice: 'Steadfast and earnest. Speaks plainly. Believes in doing the right thing even when it costs. Occasional dry humor.',
      backstory: 'A disgraced soldier seeking redemption through honest service.',
    },
    abilities: [
      { name: 'Second Wind', type: 'heal', description: 'Recover 1d10+1 HP', icon: '💨' },
      { name: 'Protection', type: 'reaction', description: 'Impose disadvantage on attack targeting adjacent ally', icon: '🛡️' },
    ],
  },
  {
    name: 'Sera',
    className: 'rogue',
    level: 1,
    maxHp: 9,
    ac: 14,
    portrait: '',
    color: '#8b5cf6',
    personality: {
      approves: ['cleverness', 'loyalty', 'street_smarts', 'pragmatism', 'wit'],
      disapproves: ['naivety', 'blind_authority', 'unnecessary_cruelty', 'stupidity', 'self_righteousness'],
      voice: 'Sharp-tongued and quick. Uses humor to deflect. Fiercely loyal once trust is earned. Hides vulnerability behind sarcasm.',
      backstory: 'A former street urchin who learned that trust is a luxury.',
    },
    abilities: [
      { name: 'Sneak Attack', type: 'attack', description: 'Extra 1d6 damage with advantage', icon: '🗡️' },
      { name: 'Cunning Action', type: 'bonus', description: 'Dash, Disengage, or Hide as bonus action', icon: '💨' },
    ],
  },
  {
    name: 'Thaelen',
    className: 'druid',
    level: 1,
    maxHp: 9,
    ac: 13,
    portrait: '',
    color: '#22c55e',
    personality: {
      approves: ['nature_protection', 'patience', 'wisdom', 'empathy', 'balance'],
      disapproves: ['destruction', 'haste', 'fire_use', 'greed', 'waste'],
      voice: 'Thoughtful and measured. Speaks with quiet authority. Sees patterns others miss. Occasionally cryptic.',
      backstory: 'A wandering druid whose grove was destroyed. Seeks to understand why the natural order is breaking.',
    },
    abilities: [
      { name: 'Healing Word', type: 'heal', description: 'Heal 1d4+2 at range as bonus action', icon: '🌿' },
      { name: 'Entangle', type: 'spell', description: 'Restrain creatures in a 20ft area', icon: '🌱' },
    ],
  },
];

/**
 * Build a full Companion object from starter data for a new campaign
 */
export function buildCompanion(starter: StarterCompanion): Companion {
  return {
    name: starter.name,
    className: starter.className,
    level: starter.level,
    hp: starter.maxHp,
    maxHp: starter.maxHp,
    ac: starter.ac,
    portrait: starter.portrait,
    color: starter.color,
    approvalScore: 50,
    relationshipStage: 'neutral',
    personality: starter.personality,
    abilities: starter.abilities,
    conditions: [],
  };
}
```

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit --skipLibCheck 2>&1 | head -10
```

Expected: No errors from `companions.ts`

**Step 3: Commit**

```bash
git add src/data/companions.ts
git commit -m "Add starter companion data (Korrin, Sera, Thaelen)"
```

---

### Task 3: Create Edge Function shared modules

**Files:**
- Create: `supabase/functions/_shared/cors.ts`
- Create: `supabase/functions/_shared/types.ts`
- Create: `supabase/functions/_shared/dice-engine.ts`
- Create: `supabase/functions/_shared/prompts.ts`

**Step 1: Create CORS helper**

File: `supabase/functions/_shared/cors.ts`

```typescript
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
```

**Step 2: Create server-side types**

File: `supabase/functions/_shared/types.ts`

```typescript
// Minimal types for Edge Functions — mirrors src/types/game.ts

export type AbilityScore = 'strength' | 'dexterity' | 'constitution' | 'intelligence' | 'wisdom' | 'charisma';

export type Skill =
  | 'acrobatics' | 'animal_handling' | 'arcana' | 'athletics'
  | 'deception' | 'history' | 'insight' | 'intimidation'
  | 'investigation' | 'medicine' | 'nature' | 'perception'
  | 'performance' | 'persuasion' | 'religion' | 'sleight_of_hand'
  | 'stealth' | 'survival';

export type ClassName =
  | 'barbarian' | 'bard' | 'cleric' | 'druid' | 'fighter'
  | 'monk' | 'paladin' | 'ranger' | 'rogue' | 'sorcerer'
  | 'warlock' | 'wizard';

export type GameMode = 'exploration' | 'combat' | 'social' | 'rest' | 'camp' | 'threshold';
export type MoodType = 'dungeon' | 'combat' | 'tavern' | 'forest' | 'town' | 'camp' | 'threshold' | 'boss';

export interface AbilityScores {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

export interface DiceRequest {
  type: 'attack_roll' | 'saving_throw' | 'skill_check' | 'damage' | 'initiative';
  roller: string;
  ability?: string;
  target?: string;
  dc?: number;
  formula?: string;
}

export interface CharacterRow {
  id: string;
  name: string;
  race: string;
  class_name: ClassName;
  level: number;
  ability_scores: AbilityScores;
  hp: number;
  max_hp: number;
  ac: number;
  speed: number;
  proficiency_bonus: number;
  proficient_skills: Skill[];
  proficient_saves: AbilityScore[];
  equipment: any[];
  conditions: string[];
  origin_story: string;
}

export interface CampaignRow {
  id: string;
  user_id: string;
  character_id: string;
  name: string;
  current_location: string;
  current_mood: MoodType;
  current_mode: GameMode;
  companions: any;
  combat_state: any;
  quest_log: any;
  story_summary: string;
  death_count: number;
  difficulty_profile: any;
  turn_count: number;
  turn_history: any[];
}

export interface CompanionData {
  name: string;
  className: ClassName;
  level: number;
  hp: number;
  maxHp: number;
  ac: number;
  approvalScore: number;
  relationshipStage: string;
  personality: {
    approves: string[];
    disapproves: string[];
    voice: string;
  };
  conditions: string[];
}
```

**Step 3: Create server-side dice engine**

File: `supabase/functions/_shared/dice-engine.ts`

```typescript
// Dice engine for Edge Functions — mirrors src/engine/dice.ts + combat.ts
// Deterministic mechanics, no AI

import type { AbilityScore, AbilityScores, CharacterRow, DiceRequest, Skill } from './types.ts';

// ─── Core Dice ──────────────────────────────────────

function rollDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

function rollD20(): number {
  return rollDie(20);
}

function parseDiceFormula(formula: string): { count: number; sides: number; modifier: number } {
  const match = formula.match(/^(\d+)d(\d+)([+-]\d+)?$/);
  if (!match) return { count: 1, sides: 6, modifier: 0 };
  return {
    count: parseInt(match[1]),
    sides: parseInt(match[2]),
    modifier: match[3] ? parseInt(match[3]) : 0,
  };
}

function rollFormula(formula: string, multiplier: number = 1): { total: number; rolls: number[]; formula: string } {
  const { count, sides, modifier } = parseDiceFormula(formula);
  const diceCount = count * multiplier;
  const rolls: number[] = [];
  for (let i = 0; i < diceCount; i++) {
    rolls.push(rollDie(sides));
  }
  const total = rolls.reduce((a, b) => a + b, 0) + modifier;
  return { total: Math.max(0, total), rolls, formula };
}

// ─── Character Helpers ──────────────────────────────

export function getModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function getProficiencyBonus(level: number): number {
  return Math.ceil(level / 4) + 1;
}

const SKILL_ABILITIES: Record<Skill, AbilityScore> = {
  acrobatics: 'dexterity', animal_handling: 'wisdom', arcana: 'intelligence',
  athletics: 'strength', deception: 'charisma', history: 'intelligence',
  insight: 'wisdom', intimidation: 'charisma', investigation: 'intelligence',
  medicine: 'wisdom', nature: 'intelligence', perception: 'wisdom',
  performance: 'charisma', persuasion: 'charisma', religion: 'intelligence',
  sleight_of_hand: 'dexterity', stealth: 'dexterity', survival: 'wisdom',
};

function getSkillModifier(char: CharacterRow, skill: Skill): number {
  const ability = SKILL_ABILITIES[skill];
  if (!ability) return 0;
  const abilityMod = getModifier(char.ability_scores[ability]);
  const isProficient = char.proficient_skills.includes(skill);
  return abilityMod + (isProficient ? char.proficiency_bonus : 0);
}

function getSaveModifier(char: CharacterRow, ability: AbilityScore): number {
  const abilityMod = getModifier(char.ability_scores[ability]);
  const isProficient = char.proficient_saves.includes(ability);
  return abilityMod + (isProficient ? char.proficiency_bonus : 0);
}

function getAttackModifier(char: CharacterRow): number {
  // Use higher of STR/DEX + proficiency (simplified for MVP)
  const strMod = getModifier(char.ability_scores.strength);
  const dexMod = getModifier(char.ability_scores.dexterity);
  return Math.max(strMod, dexMod) + char.proficiency_bonus;
}

// ─── Dice Resolution ────────────────────────────────

interface DiceResolutionResult {
  results: string[];
  hpChanges: { target: string; delta: number }[];
}

export function processDiceRequests(
  requests: DiceRequest[],
  character: CharacterRow,
  enemies: { name: string; ac: number; hp: number; maxHp: number }[]
): DiceResolutionResult {
  const results: string[] = [];
  const hpChanges: { target: string; delta: number }[] = [];

  for (const req of requests) {
    switch (req.type) {
      case 'attack_roll': {
        const attackMod = getAttackModifier(character);
        const target = enemies.find(e => e.name === req.target);
        const targetAC = target?.ac ?? 10;
        const d20 = rollD20();
        const isCrit = d20 === 20;
        const isFumble = d20 === 1;
        const total = d20 + attackMod;
        const hit = isCrit || (!isFumble && total >= targetAC);

        if (hit) {
          const formula = req.formula || '1d8+3';
          const dmg = rollFormula(formula, isCrit ? 2 : 1);
          results.push(
            `MECHANICAL RESULT: ${req.roller}'s ${req.ability || 'attack'} ${isCrit ? 'CRITS' : 'hits'} ${req.target || 'target'} (rolled ${total} vs AC ${targetAC}) for ${dmg.total} damage.${target ? ` ${target.name} HP: ${Math.max(0, target.hp - dmg.total)}/${target.maxHp}.` : ''}`
          );
          if (req.target) hpChanges.push({ target: req.target, delta: -dmg.total });
        } else {
          results.push(
            `MECHANICAL RESULT: ${req.roller}'s ${req.ability || 'attack'} misses ${req.target || 'target'} (rolled ${total} vs AC ${targetAC}).`
          );
        }
        break;
      }

      case 'saving_throw': {
        const abilityStr = (req.ability || 'constitution').toLowerCase();
        const abilityKey = (['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'] as const)
          .find(a => abilityStr.includes(a)) || 'constitution';
        const saveMod = getSaveModifier(character, abilityKey);
        const d20 = rollD20();
        const total = d20 + saveMod;
        const dc = req.dc || 10;
        const success = total >= dc;
        results.push(
          `MECHANICAL RESULT: ${req.roller} ${success ? 'succeeds' : 'fails'} ${req.ability || ''} save (rolled ${total} vs DC ${dc}).`
        );
        break;
      }

      case 'skill_check': {
        const skillStr = (req.ability || 'perception').toLowerCase().replace(/ /g, '_') as Skill;
        const skillMod = getSkillModifier(character, skillStr);
        const d20 = rollD20();
        const total = d20 + skillMod;
        const dc = req.dc || 10;
        const success = total >= dc;
        const margin = total - dc;
        results.push(
          `MECHANICAL RESULT: ${req.roller}'s ${req.ability || 'check'} ${success ? 'succeeds' : 'fails'} (rolled ${total} vs DC ${dc}, margin ${margin >= 0 ? '+' : ''}${margin}).`
        );
        break;
      }

      case 'damage': {
        const formula = req.formula || '1d6';
        const dmg = rollFormula(formula);
        results.push(
          `MECHANICAL RESULT: ${req.roller} deals ${dmg.total} damage to ${req.target || 'target'} (${formula}).`
        );
        if (req.target) hpChanges.push({ target: req.target, delta: -dmg.total });
        break;
      }

      case 'initiative':
        // Handled separately if needed
        break;
    }
  }

  return { results, hpChanges };
}
```

**Step 4: Create server-side prompts**

File: `supabase/functions/_shared/prompts.ts`

```typescript
// DM prompts for Edge Functions — mirrors src/ai/prompts/dm-system.ts + context-builder.ts

import type { CampaignRow, CharacterRow, CompanionData, GameMode } from './types.ts';

export const DM_SYSTEM_PROMPT = `You are the Dungeon Master for QuestForge, a solo D&D 5e adventure.

PERSONA:
- Write vivid, atmospheric prose in second person for the player, third person for NPCs
- 2-4 paragraphs per response, never more unless a major story beat
- Use strong verbs, sensory details, and varied sentence structure
- Companions speak with distinct voices and personalities
- NPCs have motivations, secrets, and agendas — they are not quest dispensers
- The world feels lived-in, with history and consequences

CRITICAL MECHANICAL RULES — NEVER VIOLATE:
1. NEVER calculate damage, HP changes, healing, or any math
2. NEVER tell the player what number they rolled
3. NEVER track spell slots, HP, inventory, or conditions
4. When a player attacks or casts: output dice_requests, the engine resolves
5. When you need a skill check: output dice_requests with the DC
6. Your job is NARRATIVE ONLY — describe what happens, not the numbers
7. The game engine will inject MECHANICAL RESULT into your next prompt
8. Narrate based on those results — you don't decide if attacks hit

NARRATIVE RULES:
1. ALWAYS present meaningful consequences for choices
2. NEVER guarantee success — failure should be possible and interesting
3. Companions act independently with their own judgment — they argue, refuse, joke
4. The player can TRY anything, but impossible actions fail narratively
5. When in doubt, call for a skill check
6. Avoid cliches: "a chill runs down your spine", "you feel a sense of foreboding"
7. Make the player's class and abilities matter in narration
8. Reference the player's origin story and personal quest naturally

COMPANION APPROVAL:
After EVERY player choice with moral, tactical, or personal implications, include approval_changes.
Small changes (-3 to +3) for minor choices, medium (-5 to +5) for significant ones, large (-10 to +10) for major moral decisions.

RESPONSE FORMAT — Always respond with valid JSON:
{
  "mode": "exploration|combat|social|rest|camp|threshold",
  "narration": "The narrative text...",
  "location": "Current location name (if changed)",
  "companion_actions": [
    {"companion": "Name", "action": "What they do", "dialogue": "What they say"}
  ],
  "choices": [
    {"text": "Choice description", "type": "aggressive|diplomatic|stealth|knowledge|creative", "icon": "emoji",
     "skill_check": {"skill": "persuasion", "dc": 14, "modifier": 0, "success_chance": 60, "advantage": false}}
  ],
  "dice_requests": [
    {"type": "attack_roll|saving_throw|skill_check|damage|initiative", "roller": "Name", "ability": "Eldritch Blast", "target": "Goblin", "dc": 15, "formula": "1d10+4"}
  ],
  "state_changes": [
    {"type": "hp|condition|item|xp|spell_slot|quest|location", "target": "Name", "value": "..."}
  ],
  "approval_changes": [
    {"companion": "Name", "delta": -5, "reason": "disapproves of deception"}
  ],
  "enemy_intentions": [
    {"enemy": "Goblin", "target": "Player", "action": "Slash", "predicted_damage": "1d6+2", "description": "raises its blade"}
  ],
  "mood": "dungeon|combat|tavern|forest|town|camp|threshold|boss",
  "ambient_hint": "dungeon_drip"
}

Only include fields that are relevant. choices and dice_requests should not both appear.`;

export const MECHANICAL_ENFORCEMENT = `
REMINDER: You are the narrator, not the calculator.
- The game engine handles ALL dice rolls, damage, HP tracking, and state
- You receive MECHANICAL RESULT messages with outcomes
- Narrate those outcomes — do not recalculate or second-guess them
- If a result says "HIT for 11 damage", describe the hit, don't verify the math
- If a result says "MISS", describe the miss dramatically`;

const MODE_INSTRUCTIONS: Record<GameMode, string> = {
  exploration: `MODE: EXPLORATION
- Present the environment with rich sensory detail
- Offer 3-4 meaningful choices (not just directions)
- Include at least one option requiring a skill check
- Companions comment on surroundings based on personality`,

  combat: `MODE: COMBAT
- Describe the battlefield vividly
- Include enemy_intentions for EVERY enemy each round
- Present tactical choices (attack, defend, use environment, flee)
- Companions suggest tactics based on personality
- NEVER resolve attacks yourself — use dice_requests`,

  social: `MODE: SOCIAL ENCOUNTER
- NPCs have distinct voices, motivations, and tells
- Offer diplomatic, deceptive, intimidating, and creative approaches
- Include skill checks for persuasion, deception, insight
- Companions react to NPC interactions with approval/disapproval`,

  rest: `MODE: REST
- Describe the rest environment
- Companions share personal stories
- Healing happens via game engine, not narration`,

  camp: `MODE: CAMP
- Warm, intimate atmosphere
- Companions available for conversation
- Approval scores influence dialogue tone`,

  threshold: `MODE: THE THRESHOLD (Death Hub)
- Ethereal, liminal atmosphere
- Death is not failure — it's progression`,
};

export function buildSystemPrompt(
  campaign: CampaignRow,
  character: CharacterRow,
  companions: CompanionData[]
): string {
  const layers: string[] = [
    DM_SYSTEM_PROMPT,
    MECHANICAL_ENFORCEMENT,
    MODE_INSTRUCTIONS[campaign.current_mode] || MODE_INSTRUCTIONS.exploration,
  ];

  // Character context
  layers.push(`PLAYER CHARACTER:
- ${character.name}, ${character.race} ${character.class_name} (Lv${character.level})
- HP: ${character.hp}/${character.max_hp}, AC: ${character.ac}
- STR ${character.ability_scores.strength} DEX ${character.ability_scores.dexterity} CON ${character.ability_scores.constitution} INT ${character.ability_scores.intelligence} WIS ${character.ability_scores.wisdom} CHA ${character.ability_scores.charisma}
- Conditions: ${character.conditions.length > 0 ? character.conditions.join(', ') : 'none'}
- Origin: ${character.origin_story || 'Unknown'}`);

  // Location
  layers.push(`CURRENT LOCATION: ${campaign.current_location || 'Unknown'}`);

  // Story so far
  if (campaign.story_summary) {
    layers.push(`STORY SO FAR: ${campaign.story_summary}`);
  }

  // Companion context
  if (companions.length > 0) {
    const companionLines = companions.map(c =>
      `- ${c.name} (${c.className}, Lv${c.level}): Approval ${c.approvalScore}/100 [${c.relationshipStage}]
  Approves: ${c.personality.approves.join(', ')}
  Disapproves: ${c.personality.disapproves.join(', ')}
  Voice: ${c.personality.voice}
  HP: ${c.hp}/${c.maxHp}, AC: ${c.ac}`
    );
    layers.push(`PARTY COMPANIONS:\n${companionLines.join('\n')}`);
  }

  // Combat enemies
  if (campaign.current_mode === 'combat' && campaign.combat_state?.isActive) {
    const enemies = (campaign.combat_state.enemies || [])
      .filter((e: any) => e.hp > 0)
      .map((e: any) => `- ${e.name}: HP ${e.hp}/${e.maxHp}, AC ${e.ac}`)
      .join('\n');
    if (enemies) {
      layers.push(`ENEMIES IN COMBAT:\n${enemies}\nRound: ${campaign.combat_state.round || 1}`);
    }
  }

  return layers.join('\n\n---\n\n');
}

export function selectModel(mode: GameMode, mood?: string): string {
  if (mode === 'combat' || mode === 'social' || mode === 'threshold' || mood === 'boss') {
    return 'claude-sonnet-4-6';
  }
  return 'claude-haiku-4-5-20251001';
}

export const CAMPAIGN_INIT_GENERATED_PROMPT = `Create an opening adventure for this character. Design:
1. A compelling starting location with atmosphere
2. An immediate situation that draws the player in
3. Introduction of the three companions (Korrin, Sera, Thaelen) naturally in the scene
4. 3-4 initial choices for the player

Set the mood and location. Make it feel like the first page of an epic novel.`;

export function buildCampaignInitCustomPrompt(customPrompt: string): string {
  return `The player wants this kind of adventure: "${customPrompt}"

Create an opening scene based on their request. Design:
1. A compelling starting location that fits their vision
2. An immediate situation that draws the player in
3. Introduction of the three companions (Korrin, Sera, Thaelen) naturally in the scene
4. 3-4 initial choices for the player

Set the mood and location. Make it feel like the first page of an epic novel.`;
}
```

**Step 5: Commit**

```bash
git add supabase/functions/_shared/
git commit -m "Add Edge Function shared modules (CORS, types, dice engine, prompts)"
```

---

### Task 4: Create campaign-init Edge Function

**Files:**
- Create: `supabase/functions/campaign-init/index.ts`
- Delete: `supabase/functions/campaign-init/.gitkeep`

**Step 1: Create the Edge Function**

File: `supabase/functions/campaign-init/index.ts`

```typescript
// Campaign Init — Creates a new campaign and generates opening narration
// Called after character creation

import { createClient } from 'npm:@supabase/supabase-js@2';
import Anthropic from 'npm:@anthropic-ai/sdk';
import { corsHeaders } from '../_shared/cors.ts';
import {
  buildSystemPrompt,
  CAMPAIGN_INIT_GENERATED_PROMPT,
  buildCampaignInitCustomPrompt,
} from '../_shared/prompts.ts';
import type { CompanionData } from '../_shared/types.ts';

// Starter companions (server-side copy)
const STARTER_COMPANIONS: CompanionData[] = [
  {
    name: 'Korrin',
    className: 'fighter',
    level: 1,
    hp: 12,
    maxHp: 12,
    ac: 16,
    approvalScore: 50,
    relationshipStage: 'neutral',
    personality: {
      approves: ['honor', 'protection', 'honesty', 'bravery', 'defending_innocents'],
      disapproves: ['deception', 'cowardice', 'harming_innocents', 'betrayal', 'cruelty'],
      voice: 'Steadfast and earnest. Speaks plainly. Believes in doing the right thing even when it costs.',
    },
    conditions: [],
  },
  {
    name: 'Sera',
    className: 'rogue',
    level: 1,
    hp: 9,
    maxHp: 9,
    ac: 14,
    approvalScore: 50,
    relationshipStage: 'neutral',
    personality: {
      approves: ['cleverness', 'loyalty', 'street_smarts', 'pragmatism', 'wit'],
      disapproves: ['naivety', 'blind_authority', 'unnecessary_cruelty', 'stupidity'],
      voice: 'Sharp-tongued and quick. Uses humor to deflect. Fiercely loyal once trust is earned.',
    },
    conditions: [],
  },
  {
    name: 'Thaelen',
    className: 'druid',
    level: 1,
    hp: 9,
    maxHp: 9,
    ac: 13,
    approvalScore: 50,
    relationshipStage: 'neutral',
    personality: {
      approves: ['nature_protection', 'patience', 'wisdom', 'empathy', 'balance'],
      disapproves: ['destruction', 'haste', 'fire_use', 'greed', 'waste'],
      voice: 'Thoughtful and measured. Speaks with quiet authority. Occasionally cryptic.',
    },
    conditions: [],
  },
];

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Auth: get user from JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request
    const { characterId, mode, customPrompt, campaignName } = await req.json();
    if (!characterId) {
      return new Response(JSON.stringify({ error: 'characterId required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Service role client for writes
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Fetch character
    const { data: character, error: charError } = await adminClient
      .from('characters')
      .select('*')
      .eq('id', characterId)
      .eq('user_id', user.id)
      .single();

    if (charError || !character) {
      return new Response(JSON.stringify({ error: 'Character not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create campaign row
    const campaignData = {
      user_id: user.id,
      character_id: characterId,
      name: campaignName || `${character.name}'s Adventure`,
      current_location: 'Unknown',
      current_mood: 'tavern',
      current_mode: 'exploration',
      companions: STARTER_COMPANIONS,
      combat_state: { isActive: false, round: 0, turnIndex: 0, initiativeOrder: [], enemies: [] },
      quest_log: [],
      story_summary: '',
      death_count: 0,
      death_history: [],
      threshold_unlocks: [],
      difficulty_profile: {
        winRateLast10: 0.5,
        avgHpAtCombatEnd: 0.6,
        deaths: 0,
        sessionLengthAvg: 0,
        retryRate: 0,
        inputFrequency: 0,
        preference: 'balanced',
      },
      adventure_map: null,
      turn_count: 0,
      turn_history: [],
    };

    const { data: campaign, error: campaignError } = await adminClient
      .from('campaigns')
      .insert(campaignData)
      .select()
      .single();

    if (campaignError || !campaign) {
      return new Response(JSON.stringify({ error: `Failed to create campaign: ${campaignError?.message}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create companion_states rows
    for (const comp of STARTER_COMPANIONS) {
      await adminClient.from('companion_states').insert({
        campaign_id: campaign.id,
        companion_name: comp.name,
        approval_score: 50,
        relationship_stage: 'neutral',
        personal_quest_stage: 0,
        personal_quest_flags: {},
        memorable_moments: [],
        unlocked_abilities: [],
        gift_history: [],
      });
    }

    // Build prompt and call Claude for opening narration
    const systemPrompt = buildSystemPrompt(campaign, character, STARTER_COMPANIONS);
    const userMessage = mode === 'custom' && customPrompt
      ? buildCampaignInitCustomPrompt(customPrompt)
      : CAMPAIGN_INIT_GENERATED_PROMPT;

    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY'),
    });

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });

    // Extract text from response
    const rawText = response.content
      .filter((block: any) => block.type === 'text')
      .map((block: any) => block.text)
      .join('');

    // Parse AI response (simple JSON extraction)
    let aiResponse;
    try {
      const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/) || rawText.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]).trim() : rawText;
      aiResponse = JSON.parse(jsonStr);
    } catch {
      // Fallback: treat as narration
      aiResponse = {
        mode: 'exploration',
        narration: rawText,
        choices: [
          { text: 'Look around carefully', type: 'knowledge', icon: '👁️' },
          { text: 'Introduce yourself to nearby people', type: 'diplomatic', icon: '🗣️' },
          { text: 'Find a quiet corner to plan', type: 'stealth', icon: '🤔' },
        ],
        mood: 'tavern',
      };
    }

    // Update campaign with initial state from AI
    const updates: Record<string, any> = {
      turn_count: 1,
      story_summary: aiResponse.narration?.substring(0, 500) || '',
      turn_history: [
        { role: 'user', content: userMessage },
        { role: 'assistant', content: rawText },
      ],
    };
    if (aiResponse.location) updates.current_location = aiResponse.location;
    if (aiResponse.mood) updates.current_mood = aiResponse.mood;
    if (aiResponse.mode) updates.current_mode = aiResponse.mode;

    await adminClient.from('campaigns').update(updates).eq('id', campaign.id);

    // Return to client
    return new Response(JSON.stringify({
      campaignId: campaign.id,
      aiResponse,
      companions: STARTER_COMPANIONS,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('campaign-init error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
```

**Step 2: Remove .gitkeep**

```bash
rm supabase/functions/campaign-init/.gitkeep
```

**Step 3: Commit**

```bash
git add supabase/functions/campaign-init/
git commit -m "Add campaign-init Edge Function"
```

---

### Task 5: Create game-turn Edge Function

**Files:**
- Create: `supabase/functions/game-turn/index.ts`
- Delete: `supabase/functions/game-turn/.gitkeep`

**Step 1: Create the Edge Function**

File: `supabase/functions/game-turn/index.ts`

```typescript
// Game Turn — Main turn resolution loop
// Receive player action → call Claude → resolve dice → narrate → update state

import { createClient } from 'npm:@supabase/supabase-js@2';
import Anthropic from 'npm:@anthropic-ai/sdk';
import { corsHeaders } from '../_shared/cors.ts';
import { buildSystemPrompt, selectModel } from '../_shared/prompts.ts';
import { processDiceRequests } from '../_shared/dice-engine.ts';
import type { CompanionData } from '../_shared/types.ts';

const MAX_TURN_HISTORY = 20;

function parseAIJson(rawText: string): any {
  try {
    const codeBlockMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) return JSON.parse(codeBlockMatch[1].trim());
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    return { mode: 'exploration', narration: rawText };
  } catch {
    return { mode: 'exploration', narration: rawText };
  }
}

// Map snake_case AI keys to camelCase for client
function normalizeResponse(raw: any): any {
  const result: any = {
    mode: raw.mode || 'exploration',
    narration: raw.narration || raw.narrative || '',
  };

  if (raw.location) result.location = raw.location;
  if (raw.mood) result.mood = raw.mood;
  if (raw.ambient_hint || raw.ambientHint) result.ambientHint = raw.ambient_hint || raw.ambientHint;

  if (Array.isArray(raw.companion_actions || raw.companionActions)) {
    result.companionActions = raw.companion_actions || raw.companionActions;
  }

  if (Array.isArray(raw.choices)) {
    result.choices = raw.choices.map((c: any) => ({
      text: c.text || '',
      type: c.type || 'action',
      icon: c.icon || '',
      skillCheck: c.skill_check || c.skillCheck ? {
        skill: (c.skill_check || c.skillCheck).skill,
        dc: Number((c.skill_check || c.skillCheck).dc) || 10,
        modifier: Number((c.skill_check || c.skillCheck).modifier) || 0,
        successChance: Number((c.skill_check || c.skillCheck).success_chance || (c.skill_check || c.skillCheck).successChance) || 50,
        advantage: Boolean((c.skill_check || c.skillCheck).advantage),
      } : undefined,
    }));
  }

  if (Array.isArray(raw.dice_requests || raw.diceRequests)) {
    result.diceRequests = (raw.dice_requests || raw.diceRequests).map((d: any) => ({
      type: d.type,
      roller: d.roller || '',
      ability: d.ability,
      target: d.target,
      dc: d.dc ? Number(d.dc) : undefined,
      formula: d.formula,
    }));
  }

  if (Array.isArray(raw.state_changes || raw.stateChanges)) {
    result.stateChanges = raw.state_changes || raw.stateChanges;
  }

  if (Array.isArray(raw.approval_changes || raw.approvalChanges)) {
    result.approvalChanges = (raw.approval_changes || raw.approvalChanges).map((a: any) => ({
      companion: a.companion || '',
      delta: Number(a.delta) || 0,
      reason: a.reason || '',
    }));
  }

  if (Array.isArray(raw.enemy_intentions || raw.enemyIntentions)) {
    result.enemyIntentions = (raw.enemy_intentions || raw.enemyIntentions).map((e: any) => ({
      target: e.target || '',
      action: e.action || '',
      predictedDamage: e.predicted_damage || e.predictedDamage || '',
      special: e.special,
      description: e.description || '',
    }));
  }

  return result;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request
    const { campaignId, action } = await req.json();
    if (!campaignId || !action) {
      return new Response(JSON.stringify({ error: 'campaignId and action required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Fetch campaign
    const { data: campaign, error: campError } = await adminClient
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .eq('user_id', user.id)
      .single();

    if (campError || !campaign) {
      return new Response(JSON.stringify({ error: 'Campaign not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch character
    const { data: character, error: charError } = await adminClient
      .from('characters')
      .select('*')
      .eq('id', campaign.character_id)
      .single();

    if (charError || !character) {
      return new Response(JSON.stringify({ error: 'Character not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get companions from campaign
    const companions: CompanionData[] = campaign.companions || [];

    // Build system prompt
    const systemPrompt = buildSystemPrompt(campaign, character, companions);

    // Build messages from turn history + current action
    const messages: { role: 'user' | 'assistant'; content: string }[] = [];
    const turnHistory = campaign.turn_history || [];
    // Include last 10 turns for context
    const recentHistory = turnHistory.slice(-10);
    for (const turn of recentHistory) {
      messages.push({ role: turn.role, content: turn.content });
    }
    messages.push({ role: 'user', content: action });

    // Select model
    const model = selectModel(campaign.current_mode, campaign.current_mood);

    // Call Claude
    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY'),
    });

    const claudeResponse = await anthropic.messages.create({
      model,
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    });

    const rawText = claudeResponse.content
      .filter((block: any) => block.type === 'text')
      .map((block: any) => block.text)
      .join('');

    let aiResponse = parseAIJson(rawText);

    // If dice_requests present, resolve and call Claude again for narration
    const diceRequests = aiResponse.dice_requests || aiResponse.diceRequests || [];
    let diceResults: string[] = [];

    if (diceRequests.length > 0) {
      // Extract enemies from combat state
      const enemies = (campaign.combat_state?.enemies || []).map((e: any) => ({
        name: e.name,
        ac: e.ac,
        hp: e.hp,
        maxHp: e.maxHp,
      }));

      const { results, hpChanges } = processDiceRequests(diceRequests, character, enemies);
      diceResults = results;

      // Apply HP changes to enemies in combat state
      if (hpChanges.length > 0 && campaign.combat_state?.enemies) {
        for (const change of hpChanges) {
          const enemy = campaign.combat_state.enemies.find((e: any) => e.name === change.target);
          if (enemy) {
            enemy.hp = Math.max(0, enemy.hp + change.delta);
          }
        }
      }

      // Call Claude again with mechanical results
      const followUpMessages = [
        ...messages,
        { role: 'assistant' as const, content: rawText },
        {
          role: 'user' as const,
          content: `[GAME ENGINE RESULTS]\n${results.join('\n')}\n\nNarrate these outcomes. Do NOT recalculate any numbers. Include new choices for the player.`,
        },
      ];

      const followUpResponse = await anthropic.messages.create({
        model,
        max_tokens: 1024,
        system: systemPrompt,
        messages: followUpMessages,
      });

      const followUpText = followUpResponse.content
        .filter((block: any) => block.type === 'text')
        .map((block: any) => block.text)
        .join('');

      aiResponse = parseAIJson(followUpText);
    }

    const normalized = normalizeResponse(aiResponse);

    // ─── Update state ────────────────────────────────

    // Update companion approval scores
    const updatedCompanions = [...companions];
    if (normalized.approvalChanges) {
      for (const change of normalized.approvalChanges) {
        const comp = updatedCompanions.find((c: any) => c.name === change.companion);
        if (comp) {
          comp.approvalScore = Math.max(0, Math.min(100, comp.approvalScore + change.delta));
        }
        // Also update companion_states table
        await adminClient
          .from('companion_states')
          .update({ approval_score: comp?.approvalScore ?? 50 })
          .eq('campaign_id', campaignId)
          .eq('companion_name', change.companion);
      }
    }

    // Build updated turn history
    const newHistory = [
      ...turnHistory,
      { role: 'user', content: action },
      { role: 'assistant', content: JSON.stringify(normalized) },
    ].slice(-MAX_TURN_HISTORY);

    // Campaign updates
    const campaignUpdates: Record<string, any> = {
      turn_count: campaign.turn_count + 1,
      companions: updatedCompanions,
      turn_history: newHistory,
    };

    if (normalized.location) campaignUpdates.current_location = normalized.location;
    if (normalized.mood) campaignUpdates.current_mood = normalized.mood;
    if (normalized.mode) campaignUpdates.current_mode = normalized.mode;
    if (campaign.combat_state?.enemies) {
      campaignUpdates.combat_state = campaign.combat_state;
    }

    await adminClient.from('campaigns').update(campaignUpdates).eq('id', campaignId);

    // Apply HP changes to character if needed
    if (normalized.stateChanges) {
      for (const change of normalized.stateChanges) {
        if (change.type === 'hp' && change.target === character.name) {
          const newHp = Math.max(0, Math.min(character.max_hp, character.hp + Number(change.value)));
          await adminClient.from('characters').update({ hp: newHp }).eq('id', character.id);
        }
      }
    }

    // Return response
    return new Response(JSON.stringify({
      aiResponse: normalized,
      diceResults,
      companions: updatedCompanions,
      turnCount: campaign.turn_count + 1,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('game-turn error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
```

**Step 2: Remove .gitkeep**

```bash
rm supabase/functions/game-turn/.gitkeep
```

**Step 3: Commit**

```bash
git add supabase/functions/game-turn/
git commit -m "Add game-turn Edge Function with dice resolution"
```

---

### Task 6: Create campaign service (client-side)

**Files:**
- Create: `src/services/campaign.ts`

**Step 1: Create the service**

```typescript
// Campaign service — calls Supabase Edge Functions and manages campaign state
import { supabase } from './supabase';
import type { Campaign, Character, Companion, AIResponse } from '@/types/game';

// ─── Edge Function callers ──────────────────────────

export interface InitCampaignParams {
  characterId: string;
  mode: 'generated' | 'custom';
  customPrompt?: string;
  campaignName?: string;
}

export interface InitCampaignResult {
  campaignId: string;
  aiResponse: AIResponse;
  companions: Companion[];
}

export async function initCampaign(params: InitCampaignParams): Promise<InitCampaignResult> {
  const { data, error } = await supabase.functions.invoke('campaign-init', {
    body: params,
  });

  if (error) throw new Error(`Campaign init failed: ${error.message}`);
  if (data?.error) throw new Error(data.error);
  return data;
}

export interface SubmitActionResult {
  aiResponse: AIResponse;
  diceResults: string[];
  companions: Companion[];
  turnCount: number;
}

export async function submitAction(campaignId: string, action: string): Promise<SubmitActionResult> {
  const { data, error } = await supabase.functions.invoke('game-turn', {
    body: { campaignId, action },
  });

  if (error) throw new Error(`Game turn failed: ${error.message}`);
  if (data?.error) throw new Error(data.error);
  return data;
}

// ─── Supabase queries ───────────────────────────────

interface CampaignRow {
  id: string;
  user_id: string;
  character_id: string;
  name: string;
  current_location: string;
  current_mood: string;
  current_mode: string;
  companions: any;
  combat_state: any;
  quest_log: any;
  story_summary: string;
  death_count: number;
  death_history: any;
  threshold_unlocks: any;
  difficulty_profile: any;
  adventure_map: any;
  turn_count: number;
  turn_history: any;
  created_at: string;
  updated_at: string;
}

function campaignFromRow(row: CampaignRow): Campaign {
  return {
    id: row.id,
    userId: row.user_id,
    characterId: row.character_id,
    name: row.name,
    worldId: '',
    currentLocation: row.current_location || 'Unknown',
    currentMood: (row.current_mood || 'dungeon') as Campaign['currentMood'],
    currentMode: (row.current_mode || 'exploration') as Campaign['currentMode'],
    companions: row.companions || [],
    combatState: row.combat_state || { isActive: false, round: 0, turnIndex: 0, initiativeOrder: [], enemies: [] },
    questLog: row.quest_log || [],
    storySummary: row.story_summary || '',
    deathCount: row.death_count || 0,
    deathHistory: row.death_history || [],
    thresholdUnlocks: row.threshold_unlocks || [],
    difficultyProfile: row.difficulty_profile || {
      winRateLast10: 0.5,
      avgHpAtCombatEnd: 0.6,
      deaths: 0,
      sessionLengthAvg: 0,
      retryRate: 0,
      inputFrequency: 0,
      preference: 'balanced',
    },
    adventureMap: row.adventure_map || undefined,
    turnCount: row.turn_count || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getActiveCampaign(userId: string): Promise<Campaign | null> {
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;
  return campaignFromRow(data);
}

export async function getCampaign(campaignId: string): Promise<Campaign> {
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', campaignId)
    .single();

  if (error || !data) throw new Error(`Campaign not found: ${error?.message}`);
  return campaignFromRow(data);
}
```

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit --skipLibCheck 2>&1 | head -10
```

**Step 3: Commit**

```bash
git add src/services/campaign.ts
git commit -m "Add campaign service (Edge Function callers + Supabase queries)"
```

---

### Task 7: Create campaign start screen

**Files:**
- Create: `app/create/campaign-start.tsx`

**Step 1: Create the screen**

```typescript
// Campaign Start — Choose generated or custom adventure
// Shown after character creation, before first game turn

import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors } from '@/theme/colors';
import { fonts, spacing, textStyles } from '@/theme/typography';
import { initCampaign } from '@/services/campaign';
import { useGameStore } from '@/stores/useGameStore';
import { getCharacter } from '@/services/character';

type CampaignMode = 'generated' | 'custom';

export default function CampaignStartScreen() {
  const router = useRouter();
  const { characterId } = useLocalSearchParams<{ characterId: string }>();
  const [mode, setMode] = useState<CampaignMode | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStart() {
    if (!characterId) {
      setError('No character found. Please go back and try again.');
      return;
    }
    if (mode === 'custom' && !customPrompt.trim()) {
      setError('Please describe what kind of adventure you want.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Call campaign-init Edge Function
      const result = await initCampaign({
        characterId,
        mode: mode!,
        customPrompt: mode === 'custom' ? customPrompt.trim() : undefined,
      });

      // Load character and hydrate game store
      const character = await getCharacter(characterId);
      const store = useGameStore.getState();
      store.setCharacter(character);

      // Build campaign object for store
      const campaign = {
        id: result.campaignId,
        userId: character.userId,
        characterId: character.id,
        name: `${character.name}'s Adventure`,
        worldId: '',
        currentLocation: result.aiResponse.location || 'Unknown',
        currentMood: result.aiResponse.mood || 'tavern' as any,
        currentMode: result.aiResponse.mode || 'exploration' as any,
        companions: result.companions,
        combatState: { isActive: false, round: 0, turnIndex: 0, initiativeOrder: [], enemies: [] },
        questLog: [],
        storySummary: '',
        deathCount: 0,
        deathHistory: [],
        thresholdUnlocks: [],
        difficultyProfile: {
          winRateLast10: 0.5,
          avgHpAtCombatEnd: 0.6,
          deaths: 0,
          sessionLengthAvg: 0,
          retryRate: 0,
          inputFrequency: 0,
          preference: 'balanced' as const,
        },
        turnCount: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      store.setCampaign(campaign);
      store.processAIResponse(result.aiResponse);
      store.setNarrationComplete(false);

      // Navigate to game
      router.replace('/game/session');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start campaign';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.gold.primary} />
          <Text style={styles.loadingText}>
            {mode === 'custom' ? 'Crafting your adventure...' : 'Generating your world...'}
          </Text>
          <Text style={styles.loadingSubtext}>The Dungeon Master prepares...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Begin Your Adventure</Text>
          <Text style={styles.subtitle}>How would you like to start?</Text>
        </View>

        {/* Options */}
        <View style={styles.options}>
          <Pressable
            style={[styles.optionCard, mode === 'generated' && styles.optionCardSelected]}
            onPress={() => setMode('generated')}
          >
            <Text style={styles.optionIcon}>🎲</Text>
            <Text style={styles.optionTitle}>GENERATE FOR ME</Text>
            <Text style={styles.optionDesc}>
              The DM creates a unique adventure based on your character's race, class, and origin.
            </Text>
          </Pressable>

          <Pressable
            style={[styles.optionCard, mode === 'custom' && styles.optionCardSelected]}
            onPress={() => setMode('custom')}
          >
            <Text style={styles.optionIcon}>✍️</Text>
            <Text style={styles.optionTitle}>CUSTOM ADVENTURE</Text>
            <Text style={styles.optionDesc}>
              Describe the adventure you want and the DM will bring it to life.
            </Text>
          </Pressable>
        </View>

        {/* Custom prompt input */}
        {mode === 'custom' && (
          <View style={styles.promptSection}>
            <Text style={styles.promptLabel}>DESCRIBE YOUR ADVENTURE</Text>
            <TextInput
              style={styles.promptInput}
              value={customPrompt}
              onChangeText={setCustomPrompt}
              placeholder='e.g., "A heist in a floating city" or "Investigate disappearances in a cursed swamp"'
              placeholderTextColor={colors.text.tertiary}
              multiline
              maxLength={300}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{customPrompt.length}/300</Text>
          </View>
        )}

        {/* Error */}
        {error && <Text style={styles.errorText}>{error}</Text>}

        {/* Start button */}
        <View style={styles.footer}>
          <Pressable
            style={[styles.startButton, !mode && styles.startButtonDisabled]}
            onPress={handleStart}
            disabled={!mode}
          >
            <Text style={styles.startButtonText}>BEGIN</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  flex: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  loadingText: {
    fontFamily: fonts.heading,
    fontSize: 16,
    color: colors.gold.primary,
    marginTop: spacing.lg,
    letterSpacing: 1,
  },
  loadingSubtext: {
    fontFamily: fonts.narrative,
    fontSize: 14,
    color: colors.text.tertiary,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
  },
  title: {
    ...textStyles.screenTitle,
    color: colors.gold.primary,
    fontSize: 22,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontFamily: fonts.narrative,
    fontSize: 15,
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
  options: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  optionCard: {
    borderWidth: 1.5,
    borderColor: colors.gold.border,
    borderRadius: 12,
    padding: spacing.lg,
    backgroundColor: colors.bg.tertiary,
  },
  optionCardSelected: {
    borderColor: colors.gold.primary,
    backgroundColor: colors.bg.secondary,
  },
  optionIcon: {
    fontSize: 28,
    marginBottom: spacing.sm,
  },
  optionTitle: {
    fontFamily: fonts.heading,
    fontSize: 13,
    color: colors.gold.primary,
    letterSpacing: 2,
    marginBottom: spacing.xs,
  },
  optionDesc: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 19,
  },
  promptSection: {
    paddingHorizontal: spacing.xl,
    marginTop: spacing.lg,
  },
  promptLabel: {
    ...textStyles.sectionLabel,
    color: colors.text.tertiary,
    marginBottom: spacing.sm,
  },
  promptInput: {
    borderWidth: 1,
    borderColor: colors.gold.border,
    borderRadius: 8,
    padding: spacing.md,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.text.primary,
    backgroundColor: colors.bg.secondary,
    minHeight: 100,
    lineHeight: 20,
  },
  charCount: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.text.tertiary,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  errorText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.combat.red,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
    marginTop: spacing.md,
  },
  footer: {
    marginTop: 'auto',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    paddingTop: spacing.md,
  },
  startButton: {
    backgroundColor: colors.gold.primary,
    paddingVertical: spacing.lg,
    borderRadius: 8,
    alignItems: 'center',
  },
  startButtonDisabled: {
    opacity: 0.4,
  },
  startButtonText: {
    ...textStyles.buttonLabel,
    color: colors.bg.primary,
    fontSize: 15,
    fontFamily: fonts.heading,
    letterSpacing: 2,
  },
});
```

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit --skipLibCheck 2>&1 | head -10
```

**Step 3: Commit**

```bash
git add app/create/campaign-start.tsx
git commit -m "Add campaign start screen (generated vs custom adventure)"
```

---

### Task 8: Wire summary.tsx to navigate to campaign-start

**Files:**
- Modify: `app/create/summary.tsx:199-201`

**Step 1: Change the navigation after character save**

In `summary.tsx`, find the `handleBeginAdventure` function. After `createCharacter(...)` succeeds, change the navigation from `router.replace('/')` to pass the character ID to the campaign start screen.

Replace lines 172-200 (the try block inside handleBeginAdventure):

Old:
```typescript
      await createCharacter({
        ...
      });

      // Navigate to game
      router.replace('/');
```

New:
```typescript
      const savedCharacter = await createCharacter({
        ...
      });

      // Navigate to campaign start with character ID
      router.replace({
        pathname: '/create/campaign-start',
        params: { characterId: savedCharacter.id },
      });
```

This means changing `await createCharacter(...)` to `const savedCharacter = await createCharacter(...)` and changing the `router.replace` call.

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit --skipLibCheck 2>&1 | head -10
```

**Step 3: Commit**

```bash
git add app/create/summary.tsx
git commit -m "Wire character summary to campaign start screen"
```

---

### Task 9: Wire index.tsx to load campaign on game entry

**Files:**
- Modify: `app/index.tsx:33-46`

**Step 1: Update the routing logic**

When the user has a character, check for an active campaign. If found, load it into the game store before navigating to the game session.

Replace the entire `checkAuthAndRoute` function:

```typescript
  async function checkAuthAndRoute() {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.replace('/(auth)/login');
        return;
      }

      // Check if user has any characters
      const { data: characters } = await supabase
        .from('characters')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!characters || characters.length === 0) {
        router.replace('/create');
        return;
      }

      // Check for active campaign
      const { data: campaigns } = await supabase
        .from('campaigns')
        .select('*')
        .eq('user_id', session.user.id)
        .order('updated_at', { ascending: false })
        .limit(1);

      if (!campaigns || campaigns.length === 0) {
        // Has character but no campaign — go to campaign start
        router.replace({
          pathname: '/create/campaign-start',
          params: { characterId: characters[0].id },
        });
        return;
      }

      // Has campaign — load into store and go to game
      const { getCharacter } = await import('@/services/character');
      const { getActiveCampaign } = await import('@/services/campaign');
      const { useGameStore } = await import('@/stores/useGameStore');

      const character = await getCharacter(characters[0].id);
      const campaign = await getActiveCampaign(session.user.id);

      if (campaign) {
        const store = useGameStore.getState();
        store.setCharacter(character);
        store.setCampaign(campaign);

        // Restore last narration from turn history
        const turnHistory = (campaigns[0].turn_history || []) as any[];
        const lastAssistant = [...turnHistory].reverse().find((t: any) => t.role === 'assistant');
        if (lastAssistant) {
          try {
            const parsed = JSON.parse(lastAssistant.content);
            store.processAIResponse(parsed);
          } catch {
            // If can't parse, just show a default
          }
        }
      }

      router.replace('/game/session');
    } catch {
      router.replace('/(auth)/login');
    } finally {
      setChecking(false);
    }
  }
```

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit --skipLibCheck 2>&1 | head -10
```

**Step 3: Commit**

```bash
git add app/index.tsx
git commit -m "Wire index routing to load campaign + hydrate game store"
```

---

### Task 10: Wire session.tsx with choice handling + freeform input

**Files:**
- Modify: `app/game/session.tsx`

**Step 1: Add imports and state for freeform input**

Add to the imports at top of file:

```typescript
import { TextInput, Keyboard } from 'react-native';
import { submitAction } from '@/services/campaign';
```

**Step 2: Replace handleChoicePress with real implementation**

Replace the `handleChoicePress` callback (lines 31-35):

```typescript
  const handleChoicePress = useCallback(async (choice: Choice) => {
    if (!campaign) return;
    const store = useGameStore.getState();
    store.setLoading(true);
    store.setNarrationComplete(false);
    store.setError(null);

    try {
      const result = await submitAction(campaign.id, choice.text);

      // Update companions in campaign
      if (result.companions) {
        store.setCampaign({
          ...store.campaign!,
          companions: result.companions,
          turnCount: result.turnCount,
        });
      }

      // Process AI response
      store.processAIResponse(result.aiResponse);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      store.setError(message);
    } finally {
      store.setLoading(false);
    }
  }, [campaign]);
```

**Step 3: Add freeform action handler**

Add after `handleApprovalsDismissed`:

```typescript
  const [freeformText, setFreeformText] = React.useState('');

  const handleFreeformSubmit = useCallback(async () => {
    if (!campaign || !freeformText.trim()) return;
    Keyboard.dismiss();
    const text = freeformText.trim();
    setFreeformText('');

    const store = useGameStore.getState();
    store.setLoading(true);
    store.setNarrationComplete(false);
    store.setError(null);

    try {
      const result = await submitAction(campaign.id, text);

      if (result.companions) {
        store.setCampaign({
          ...store.campaign!,
          companions: result.companions,
          turnCount: result.turnCount,
        });
      }

      store.processAIResponse(result.aiResponse);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      store.setError(message);
    } finally {
      store.setLoading(false);
    }
  }, [campaign, freeformText]);
```

**Step 4: Add freeform input to the choice area**

In the JSX, after the choices map and before the closing `</View>` of the choiceArea, add:

```tsx
        {/* Freeform action input */}
        {isNarrationComplete && !isLoading && (
          <View style={styles.freeformContainer}>
            <TextInput
              style={styles.freeformInput}
              value={freeformText}
              onChangeText={setFreeformText}
              placeholder="Or type your own action..."
              placeholderTextColor={colors.text.tertiary}
              onSubmitEditing={handleFreeformSubmit}
              returnKeyType="send"
              editable={!isLoading}
            />
            {freeformText.trim().length > 0 && (
              <Pressable style={styles.freeformSend} onPress={handleFreeformSubmit}>
                <Text style={styles.freeformSendText}>→</Text>
              </Pressable>
            )}
          </View>
        )}
```

Also add an error display above the choice area:

```tsx
      {/* Error display */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
```

And add `error` to the destructured state from `useGameStore`:

```typescript
  const {
    campaign,
    character,
    isLoading,
    error,
    currentNarration,
    ...
  } = useGameStore();
```

**Step 5: Add styles**

Add these styles to the StyleSheet:

```typescript
  freeformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gold.border,
    borderRadius: 8,
    backgroundColor: colors.bg.secondary,
  },
  freeformInput: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.text.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  freeformSend: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  freeformSendText: {
    fontFamily: fonts.heading,
    fontSize: 18,
    color: colors.gold.primary,
  },
  errorContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  errorText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.combat.red,
    textAlign: 'center',
  },
```

Also add `Pressable` to the react-native imports if not already there.

**Step 6: Verify TypeScript compiles**

```bash
npx tsc --noEmit --skipLibCheck 2>&1 | head -10
```

**Step 7: Commit**

```bash
git add app/game/session.tsx
git commit -m "Wire game session with choice handling and freeform input"
```

---

### Task 11: Deploy Edge Functions + set API key

**Step 1: Install Supabase CLI (if not already)**

```bash
brew install supabase/tap/supabase
```

Or if already installed, ensure it's up to date:
```bash
supabase --version
```

**Step 2: Link project**

```bash
cd /Users/fauni/Documents/Code/QuestForge
supabase link --project-ref bsbdtdexdlyruojyabtn
```

**Step 3: Set Anthropic API key as secret**

```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-YOUR_KEY_HERE
```

(User provides their actual key)

**Step 4: Deploy Edge Functions**

```bash
supabase functions deploy campaign-init --no-verify-jwt
supabase functions deploy game-turn --no-verify-jwt
```

Note: `--no-verify-jwt` is used because we handle JWT verification inside the function. Alternatively, remove this flag and let Supabase verify JWTs at the gateway level.

**Step 5: Verify deployment**

```bash
supabase functions list
```

Expected: `campaign-init` and `game-turn` listed as deployed.

**Step 6: Test campaign-init with curl**

```bash
curl -X POST \
  https://bsbdtdexdlyruojyabtn.supabase.co/functions/v1/campaign-init \
  -H "Authorization: Bearer YOUR_SUPABASE_JWT" \
  -H "Content-Type: application/json" \
  -d '{"characterId": "test-id", "mode": "generated"}'
```

Expected: 401 or 404 (character not found) — confirms the function is running.

---

### Task 12: End-to-end verification

**Step 1: Run TypeScript check**

```bash
npx tsc --noEmit --skipLibCheck
```

Expected: No errors from project source files.

**Step 2: Start Expo dev server**

```bash
npx expo start
```

**Step 3: Test the full flow**

1. Open app → should route to login (if not authenticated) or create (if no character)
2. Create a character through the 5-step wizard
3. After "BEGIN ADVENTURE" → should see campaign start screen with Generated/Custom options
4. Pick "Generate for me" → loading screen → should get opening narration in game session
5. Read narration → choices appear → pick a choice → narration updates
6. Try typing a freeform action → narration updates
7. Verify companion approval changes appear after choices

**Step 4: Check Edge Function logs for errors**

```bash
supabase functions logs campaign-init
supabase functions logs game-turn
```

**Step 5: Final commit if any cleanup needed**

```bash
git status
```

---

### Task 13: UI overhaul — polish all screens

**Goal:** Deep-dive into every screen and component to make the app feel complete and polished. Move beyond functional scaffolding to a production-quality dark fantasy UI.

**Scope:** All existing screens and components. This is a design-focused pass, not a feature pass.

**Approach:** Use the `superpowers:brainstorming` skill to design the overhaul, then `superpowers:writing-plans` to create a detailed plan. This task is intentionally open-ended — the specifics will be determined by reviewing every screen in the app and identifying what needs work.

**Areas to evaluate:**

1. **Login screen** — Currently basic. Needs branded splash, fantasy atmosphere, animated elements
2. **Character creation flow** (race, class, abilities, origin, summary) — Functional but plain. Needs better card designs, transitions between steps, visual hierarchy, animations
3. **Campaign start screen** — New screen, needs to feel epic and set the tone
4. **Game session screen** — The core experience. Needs:
   - Narrative area: better typography, mood-based background colors/gradients, scroll behavior
   - Party strip: richer card design, HP bar animations, condition badges, approval indicators
   - Choice area: better button design, skill check display polish, hover/press states
   - Freeform input: styled to match the fantasy theme
   - Loading state: more atmospheric than a spinner ("The DM ponders...")
   - Error states: graceful, themed error display
5. **Approval indicators** — Animated slide-in/fade-out with companion portraits
6. **Dice roll display** — Visual dice animation when dice_requests resolve (currently just stored in state)
7. **Overall polish** — Consistent spacing, font usage, color application across all screens. Haptic feedback on key interactions. Smooth transitions between screens.
8. **Empty/loading states** — Every screen should have a themed empty state, not just a spinner

**This task uses brainstorming → writing-plans → subagent-driven-development workflow.**

---

## Verification Checklist

- [ ] `turn_history` column exists in campaigns table
- [ ] Companion data file compiles (`src/data/companions.ts`)
- [ ] Edge Function shared modules created in `supabase/functions/_shared/`
- [ ] `campaign-init` Edge Function deployed and callable
- [ ] `game-turn` Edge Function deployed and callable
- [ ] Campaign service works (`src/services/campaign.ts`)
- [ ] Campaign start screen renders with Generated/Custom options
- [ ] Summary screen navigates to campaign-start after save
- [ ] Index loads campaign data on app entry
- [ ] Session screen sends choices to game-turn and displays responses
- [ ] Freeform text input works in game session
- [ ] Companion approval changes display after choices
- [ ] Full flow: create character → start campaign → play turns
- [ ] UI overhaul complete — all screens polished and cohesive
