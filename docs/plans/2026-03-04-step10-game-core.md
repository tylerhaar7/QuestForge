# Step 10: Game Core — Combat Engine, AI Layer, Game UI Components

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the 10 files from the setup guide Step 10 — combat engine, AI context builder, AI response parser, 6 game UI components, and the main game session screen.

**Architecture:** The combat engine extends the existing dice/character engines with initiative tracking, turn management, and attack resolution. The AI layer builds prompts from campaign state and parses Claude's JSON responses. UI components consume Zustand store state and render the game. All components use the existing theme system (colors, typography, spacing).

**Tech Stack:** TypeScript, React Native, react-native-reanimated (animations), expo-haptics (feedback), Zustand (state), existing engine modules (dice.ts, character.ts)

**Source docs:**
- `QuestForge MDs/questforge-setup-guide.md` — Step 10 file list
- `QuestForge MDs/questforge-features-v2.md` — Detailed specs for each component
- Existing files: `src/types/game.ts`, `src/engine/dice.ts`, `src/engine/character.ts`, `src/stores/useGameStore.ts`, `src/theme/colors.ts`, `src/theme/typography.ts`, `src/ai/prompts/dm-system.ts`

---

### Task 1: Create Combat Engine

**Files:**
- Create: `src/engine/combat.ts`

**Step 1: Create src/engine/combat.ts**

This engine handles initiative, turn order, attack resolution, and damage application. It uses the existing dice.ts and character.ts functions. No AI involvement — purely deterministic.

```typescript
// Combat engine — initiative, turn order, attack resolution, damage
// Deterministic. No AI. Uses dice.ts and character.ts.

import type {
  Character, Companion, Enemy, CombatState,
  InitiativeEntry, DiceRequest, DiceResult, Condition,
} from '@/types/game';
import { rollInitiative, rollAttack, rollDamage, rollSavingThrow, rollSkillCheck, rollDice } from './dice';
import { getModifier, getSkillModifier, getSaveModifier } from './character';

/**
 * Roll initiative for all combatants and return sorted order
 */
export function rollAllInitiative(
  party: { name: string; dexScore: number }[],
  enemies: { name: string; dexMod: number }[]
): InitiativeEntry[] {
  const entries: InitiativeEntry[] = [];

  party.forEach((member, index) => {
    const dexMod = getModifier(member.dexScore);
    entries.push({
      name: member.name,
      initiative: rollInitiative(dexMod),
      side: 'party',
      index,
    });
  });

  enemies.forEach((enemy, index) => {
    entries.push({
      name: enemy.name,
      initiative: rollInitiative(enemy.dexMod),
      side: 'enemy',
      index,
    });
  });

  // Sort descending by initiative, break ties by DEX (party wins ties)
  return entries.sort((a, b) => {
    if (b.initiative !== a.initiative) return b.initiative - a.initiative;
    return a.side === 'party' ? -1 : 1;
  });
}

/**
 * Create initial combat state
 */
export function initCombat(
  party: { name: string; dexScore: number }[],
  enemies: Enemy[]
): CombatState {
  const enemyDexMods = enemies.map(e => ({ name: e.name, dexMod: 0 }));
  const initiativeOrder = rollAllInitiative(party, enemyDexMods);

  return {
    isActive: true,
    round: 1,
    turnIndex: 0,
    initiativeOrder,
    enemies,
  };
}

/**
 * Advance to the next turn in initiative order
 * Returns the new combat state and who acts next
 */
export function advanceTurn(combat: CombatState): {
  combat: CombatState;
  currentTurn: InitiativeEntry;
} {
  let nextIndex = combat.turnIndex + 1;
  let nextRound = combat.round;

  if (nextIndex >= combat.initiativeOrder.length) {
    nextIndex = 0;
    nextRound += 1;
  }

  const newCombat: CombatState = {
    ...combat,
    turnIndex: nextIndex,
    round: nextRound,
  };

  return {
    combat: newCombat,
    currentTurn: combat.initiativeOrder[nextIndex],
  };
}

/**
 * Get whose turn it currently is
 */
export function getCurrentTurn(combat: CombatState): InitiativeEntry {
  return combat.initiativeOrder[combat.turnIndex];
}

/**
 * Resolve an attack dice request
 * Returns the result with hit/miss, damage if hit
 */
export function resolveAttack(
  request: DiceRequest,
  attackModifier: number,
  targetAC: number,
  damageFormula: string
): {
  hit: boolean;
  attackRoll: DiceResult;
  damageRoll?: DiceResult;
  totalDamage: number;
  description: string;
} {
  const { hit, roll: attackRoll, damageMultiplier } = rollAttack(
    attackModifier, targetAC
  );

  if (!hit) {
    return {
      hit: false,
      attackRoll,
      totalDamage: 0,
      description: `${request.roller}'s ${request.ability || 'attack'} misses ${request.target || 'target'} (rolled ${attackRoll.total} vs AC ${targetAC})`,
    };
  }

  const damageRoll = rollDamage(damageFormula, damageMultiplier);

  return {
    hit: true,
    attackRoll,
    damageRoll,
    totalDamage: damageRoll.total,
    description: `${request.roller}'s ${request.ability || 'attack'} ${attackRoll.isCritical ? 'CRITS' : 'hits'} ${request.target || 'target'} (rolled ${attackRoll.total} vs AC ${targetAC}) for ${damageRoll.total} damage`,
  };
}

/**
 * Resolve a saving throw dice request
 */
export function resolveSave(
  request: DiceRequest,
  saveModifier: number
): {
  success: boolean;
  roll: DiceResult;
  description: string;
} {
  const dc = request.dc || 10;
  const { success, roll } = rollSavingThrow(saveModifier, dc);

  return {
    success,
    roll,
    description: `${request.roller} ${success ? 'succeeds' : 'fails'} ${request.ability || ''} save (rolled ${roll.total} vs DC ${dc})`,
  };
}

/**
 * Resolve a skill check dice request
 */
export function resolveSkillCheck(
  request: DiceRequest,
  skillModifier: number
): {
  success: boolean;
  roll: DiceResult;
  margin: number;
  description: string;
} {
  const dc = request.dc || 10;
  const { success, roll, margin } = rollSkillCheck(skillModifier, dc);

  return {
    success,
    roll,
    margin,
    description: `${request.roller}'s ${request.ability || 'check'} ${success ? 'succeeds' : 'fails'} (rolled ${roll.total} vs DC ${dc}, margin ${margin >= 0 ? '+' : ''}${margin})`,
  };
}

/**
 * Apply damage to a target, returns new HP (clamped to 0)
 */
export function applyDamage(currentHp: number, damage: number): number {
  return Math.max(0, currentHp - damage);
}

/**
 * Apply healing to a target, returns new HP (clamped to maxHp)
 */
export function applyHealing(currentHp: number, maxHp: number, healing: number): number {
  return Math.min(maxHp, currentHp + healing);
}

/**
 * Check if combat should end
 * Returns 'party_wins' if all enemies at 0 HP, 'party_loses' if all party at 0 HP, null if ongoing
 */
export function checkCombatEnd(
  partyHp: number[],
  enemies: Enemy[]
): 'party_wins' | 'party_loses' | null {
  const allEnemiesDead = enemies.every(e => e.hp <= 0);
  if (allEnemiesDead) return 'party_wins';

  const allPartyDead = partyHp.every(hp => hp <= 0);
  if (allPartyDead) return 'party_loses';

  return null;
}

/**
 * Process all dice requests from an AI response
 * Returns mechanical results as a formatted string for Claude's next prompt
 */
export function processDiceRequests(
  requests: DiceRequest[],
  character: Character,
  enemies: Enemy[]
): {
  results: string[];
  hpChanges: { target: string; delta: number }[];
} {
  const results: string[] = [];
  const hpChanges: { target: string; delta: number }[] = [];

  for (const req of requests) {
    switch (req.type) {
      case 'attack_roll': {
        // Determine attacker's modifier
        // For simplicity, use character's proficiency + STR/DEX mod
        const attackMod = getModifier(character.abilityScores.strength)
          + character.proficiencyBonus;
        const target = enemies.find(e => e.name === req.target);
        const targetAC = target?.ac || 10;
        const formula = req.formula || '1d8+3';

        const result = resolveAttack(req, attackMod, targetAC, formula);
        results.push(`MECHANICAL RESULT: ${result.description}`);

        if (result.hit && req.target) {
          hpChanges.push({ target: req.target, delta: -result.totalDamage });
        }
        break;
      }
      case 'saving_throw': {
        const ability = req.ability?.toLowerCase() || 'constitution';
        // Try to find ability score name match
        const abilityKey = (['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'] as const)
          .find(a => ability.includes(a)) || 'constitution';
        const saveMod = getSaveModifier(character, abilityKey);
        const result = resolveSave(req, saveMod);
        results.push(`MECHANICAL RESULT: ${result.description}`);
        break;
      }
      case 'skill_check': {
        const skill = req.ability?.toLowerCase().replace(/ /g, '_') || 'perception';
        // Map common names to skill keys
        const skillMod = getModifier(character.abilityScores.wisdom)
          + character.proficiencyBonus;
        const result = resolveSkillCheck(req, skillMod);
        results.push(`MECHANICAL RESULT: ${result.description}`);
        break;
      }
      case 'damage': {
        const formula = req.formula || '1d6';
        const dmgRoll = rollDamage(formula);
        results.push(`MECHANICAL RESULT: ${req.roller} deals ${dmgRoll.total} damage to ${req.target} (${dmgRoll.formula})`);
        if (req.target) {
          hpChanges.push({ target: req.target, delta: -dmgRoll.total });
        }
        break;
      }
      case 'initiative': {
        // Already handled by initCombat
        break;
      }
    }
  }

  return { results, hpChanges };
}

/**
 * End combat and return to exploration
 */
export function endCombat(): CombatState {
  return {
    isActive: false,
    round: 0,
    turnIndex: 0,
    initiativeOrder: [],
    enemies: [],
  };
}
```

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit src/engine/combat.ts 2>&1 | head -10
```

Expected: No errors.

**Step 3: Commit**

```bash
git add src/engine/combat.ts
git commit -m "Add combat engine with initiative, turn order, and attack resolution"
```

---

### Task 2: Create AI Context Builder

**Files:**
- Create: `src/ai/context-builder.ts`

**Step 1: Create src/ai/context-builder.ts**

Assembles the full prompt context from campaign state. Builds prompt layers in order per the architecture spec.

```typescript
// AI Context Builder — Assembles prompt layers from campaign state
// Layers 1-4 are prompt-cached (90% cost reduction)

import type { Campaign, Character, Companion, GameMode } from '@/types/game';
import { DM_SYSTEM_PROMPT, MECHANICAL_ENFORCEMENT } from './prompts/dm-system';

/**
 * Mode-specific instruction sets
 */
const MODE_INSTRUCTIONS: Record<GameMode, string> = {
  exploration: `MODE: EXPLORATION
- Present the environment with rich sensory detail
- Offer 3-4 meaningful choices (not just directions)
- Include at least one option requiring a skill check
- Companions comment on surroundings based on personality
- Advance plot threads when appropriate`,

  combat: `MODE: COMBAT
- Describe the battlefield vividly
- Include enemy_intentions for EVERY enemy each round
- Present tactical choices (attack, defend, use environment, flee)
- Companions suggest tactics based on personality
- Track position and terrain effects narratively
- NEVER resolve attacks yourself — use dice_requests`,

  social: `MODE: SOCIAL ENCOUNTER
- NPCs have distinct voices, motivations, and tells
- Offer diplomatic, deceptive, intimidating, and creative approaches
- Include skill checks for persuasion, deception, insight
- Companions react to NPC interactions with approval/disapproval
- Social failures have consequences but don't end conversation`,

  rest: `MODE: SHORT/LONG REST
- Describe the rest environment (campfire, inn room, etc.)
- Companions share personal stories at rest points
- Allow character maintenance (identify items, prepare spells)
- Random encounters possible during rest (tension)
- Healing happens via game engine, not narration`,

  camp: `MODE: CAMP
- Warm, intimate atmosphere
- Companions available for deep conversation
- Allow: Talk, Rest, Train, Browse supplies
- Personal quests can advance through camp dialogue
- Approval scores influence available dialogue options`,

  threshold: `MODE: THE THRESHOLD (Death Hub)
- Ethereal, liminal atmosphere — muted colors, echoing silence
- The Keeper speaks in riddles and half-truths
- Death is not failure — it's progression
- Each death reveals something new about the world
- Player can explore, gain insight, then return to life`,
};

/**
 * Build companion context with personalities and approval
 */
function buildCompanionContext(companions: Companion[]): string {
  if (companions.length === 0) return '';

  const lines = companions.map(c => {
    const stage = c.relationshipStage;
    return `- ${c.name} (${c.className}, Lv${c.level}): Approval ${c.approvalScore}/100 [${stage}]
  Approves: ${c.personality.approves.join(', ')}
  Disapproves: ${c.personality.disapproves.join(', ')}
  Voice: ${c.personality.voice}
  HP: ${c.hp}/${c.maxHp}, AC: ${c.ac}`;
  });

  return `PARTY COMPANIONS:\n${lines.join('\n')}`;
}

/**
 * Build quest context
 */
function buildQuestContext(campaign: Campaign): string {
  const active = campaign.questLog.filter(q => q.status === 'active');
  if (active.length === 0) return '';

  const lines = active.map(q => {
    const objectives = q.objectives
      .map(o => `  ${o.completed ? '[x]' : '[ ]'} ${o.description}`)
      .join('\n');
    return `- ${q.name}${q.isPersonalQuest ? ' (PERSONAL)' : ''}\n${objectives}`;
  });

  return `ACTIVE QUESTS:\n${lines.join('\n')}`;
}

/**
 * Build character context
 */
function buildCharacterContext(character: Character): string {
  const conditions = character.conditions.length > 0
    ? `Conditions: ${character.conditions.join(', ')}`
    : 'Conditions: none';

  return `PLAYER CHARACTER:
- ${character.name}, ${character.race} ${character.className} (Lv${character.level})
- HP: ${character.hp}/${character.maxHp}, AC: ${character.ac}
- STR ${character.abilityScores.strength} DEX ${character.abilityScores.dexterity} CON ${character.abilityScores.constitution} INT ${character.abilityScores.intelligence} WIS ${character.abilityScores.wisdom} CHA ${character.abilityScores.charisma}
- ${conditions}
- Origin: ${character.originStory || 'Unknown'}`;
}

/**
 * Build difficulty context
 */
function buildDifficultyContext(campaign: Campaign): string {
  const dp = campaign.difficultyProfile;
  return `DIFFICULTY PROFILE:
- Preference: ${dp.preference}
- Recent win rate: ${Math.round(dp.winRateLast10 * 100)}%
- Avg HP at combat end: ${Math.round(dp.avgHpAtCombatEnd * 100)}%
- Deaths: ${dp.deaths}
Adjust difficulty naturally. NEVER mention difficulty adjustment to the player.`;
}

/**
 * Build enemy context for combat mode
 */
function buildEnemyContext(campaign: Campaign): string {
  if (!campaign.combatState.isActive) return '';

  const enemies = campaign.combatState.enemies
    .filter(e => e.hp > 0)
    .map(e => `- ${e.name}: HP ${e.hp}/${e.maxHp}, AC ${e.ac}${e.conditions.length > 0 ? `, ${e.conditions.join(', ')}` : ''}`)
    .join('\n');

  return `ENEMIES IN COMBAT:\n${enemies}\nRound: ${campaign.combatState.round}`;
}

export interface ContextOptions {
  campaign: Campaign;
  character: Character;
  mechanicalResults?: string[];
  recentTurns?: { role: 'user' | 'assistant'; content: string }[];
  playerAction?: string;
}

/**
 * Build the complete system prompt from campaign state
 * Returns layers organized for prompt caching
 */
export function buildSystemPrompt(options: ContextOptions): string {
  const { campaign, character } = options;

  // Layers 1-2: Always cached (core behavior + mechanical rules)
  const coreLayers = [
    DM_SYSTEM_PROMPT,
    MECHANICAL_ENFORCEMENT,
  ].join('\n\n');

  // Layer 3: Mode-specific (cached per mode)
  const modeLayer = MODE_INSTRUCTIONS[campaign.currentMode];

  // Layers 4+: Dynamic context
  const dynamicLayers = [
    `CURRENT LOCATION: ${campaign.currentLocation}`,
    `STORY SO FAR: ${campaign.storySummary || 'The adventure begins...'}`,
    buildQuestContext(campaign),
    buildCharacterContext(character),
    buildCompanionContext(campaign.companions),
    buildDifficultyContext(campaign),
    buildEnemyContext(campaign),
  ].filter(Boolean);

  return [coreLayers, modeLayer, ...dynamicLayers].join('\n\n---\n\n');
}

/**
 * Build the messages array for the Claude API call
 */
export function buildMessages(options: ContextOptions): {
  system: string;
  messages: { role: 'user' | 'assistant'; content: string }[];
} {
  const system = buildSystemPrompt(options);
  const messages: { role: 'user' | 'assistant'; content: string }[] = [];

  // Add recent turns for conversation context
  if (options.recentTurns) {
    messages.push(...options.recentTurns);
  }

  // Add mechanical results if any (from resolved dice)
  if (options.mechanicalResults && options.mechanicalResults.length > 0) {
    const resultsBlock = options.mechanicalResults.join('\n');
    messages.push({
      role: 'user',
      content: `[GAME ENGINE RESULTS]\n${resultsBlock}\n\nNarrate these outcomes. Do NOT recalculate any numbers.`,
    });
  }

  // Add player's current action
  if (options.playerAction) {
    messages.push({
      role: 'user',
      content: options.playerAction,
    });
  }

  return { system, messages };
}

/**
 * Determine which Claude model to use based on context
 * Haiku for simple turns, Sonnet for complex scenes
 */
export function selectModel(campaign: Campaign): 'haiku' | 'sonnet' {
  // Use Sonnet for combat, social, threshold, and boss moods
  if (campaign.currentMode === 'combat') return 'sonnet';
  if (campaign.currentMode === 'social') return 'sonnet';
  if (campaign.currentMode === 'threshold') return 'sonnet';
  if (campaign.currentMood === 'boss') return 'sonnet';

  // Haiku for exploration, rest, camp
  return 'haiku';
}
```

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit src/ai/context-builder.ts 2>&1 | head -10
```

**Step 3: Commit**

```bash
git add src/ai/context-builder.ts
git commit -m "Add AI context builder with prompt layers and model routing"
```

---

### Task 3: Create AI Response Parser

**Files:**
- Create: `src/ai/parser.ts`

**Step 1: Create src/ai/parser.ts**

Parses Claude's JSON response with fallbacks. Never crashes — always returns a valid AIResponse.

```typescript
// AI Response Parser — Parses Claude's JSON with fallbacks
// Never crashes. Always returns a valid AIResponse structure.

import type { AIResponse, GameMode } from '@/types/game';

/**
 * Default empty response — used as fallback
 */
const EMPTY_RESPONSE: AIResponse = {
  mode: 'exploration',
  narration: '',
};

/**
 * Attempt to extract JSON from a string that may contain markdown code blocks
 */
function extractJSON(raw: string): string {
  // Try to find JSON in markdown code block
  const codeBlockMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }

  // Try to find raw JSON object
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return jsonMatch[0];
  }

  return raw;
}

/**
 * Validate and normalize the mode field
 */
function normalizeMode(mode: unknown): GameMode {
  const validModes: GameMode[] = ['exploration', 'combat', 'social', 'rest', 'camp', 'threshold'];
  if (typeof mode === 'string' && validModes.includes(mode as GameMode)) {
    return mode as GameMode;
  }
  return 'exploration';
}

/**
 * Map snake_case keys from Claude's JSON to camelCase for our types
 */
function mapResponseKeys(raw: Record<string, unknown>): Partial<AIResponse> {
  const mapped: Partial<AIResponse> = {};

  // Direct mappings
  if (raw.mode) mapped.mode = normalizeMode(raw.mode);
  if (raw.narration) mapped.narration = String(raw.narration);
  if (raw.narrative) mapped.narration = String(raw.narrative); // alternate key
  if (raw.location) mapped.location = String(raw.location);
  if (raw.mood) mapped.mood = raw.mood as AIResponse['mood'];
  if (raw.ambient_hint || raw.ambientHint) {
    mapped.ambientHint = String(raw.ambient_hint || raw.ambientHint);
  }

  // Arrays — snake_case to camelCase
  if (Array.isArray(raw.companion_actions || raw.companionActions)) {
    mapped.companionActions = (raw.companion_actions || raw.companionActions) as AIResponse['companionActions'];
  }

  if (Array.isArray(raw.choices)) {
    mapped.choices = (raw.choices as any[]).map(c => ({
      text: String(c.text || ''),
      type: String(c.type || 'action'),
      icon: String(c.icon || ''),
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
    mapped.diceRequests = ((raw.dice_requests || raw.diceRequests) as any[]).map(d => ({
      type: d.type,
      roller: String(d.roller || ''),
      ability: d.ability ? String(d.ability) : undefined,
      target: d.target ? String(d.target) : undefined,
      dc: d.dc ? Number(d.dc) : undefined,
      formula: d.formula ? String(d.formula) : undefined,
    }));
  }

  if (Array.isArray(raw.state_changes || raw.stateChanges)) {
    mapped.stateChanges = (raw.state_changes || raw.stateChanges) as AIResponse['stateChanges'];
  }

  if (Array.isArray(raw.approval_changes || raw.approvalChanges)) {
    mapped.approvalChanges = ((raw.approval_changes || raw.approvalChanges) as any[]).map(a => ({
      companion: String(a.companion || ''),
      delta: Number(a.delta) || 0,
      reason: String(a.reason || ''),
    }));
  }

  if (Array.isArray(raw.enemy_intentions || raw.enemyIntentions)) {
    mapped.enemyIntentions = ((raw.enemy_intentions || raw.enemyIntentions) as any[]).map(e => ({
      target: String(e.target || ''),
      action: String(e.action || ''),
      predictedDamage: String(e.predicted_damage || e.predictedDamage || ''),
      special: e.special ? String(e.special) : undefined,
      description: String(e.description || ''),
    }));
  }

  if (Array.isArray(raw.thread_updates || raw.threadUpdates)) {
    mapped.threadUpdates = ((raw.thread_updates || raw.threadUpdates) as any[]).map(t => ({
      threadId: String(t.thread_id || t.threadId || ''),
      action: t.action || 'advance',
      detail: String(t.detail || ''),
    }));
  }

  return mapped;
}

/**
 * Parse Claude's response string into a typed AIResponse
 * Never throws — always returns a valid response
 */
export function parseAIResponse(raw: string): AIResponse {
  if (!raw || raw.trim().length === 0) {
    console.warn('[AI Parser] Empty response received');
    return { ...EMPTY_RESPONSE, narration: 'The world falls silent for a moment...' };
  }

  try {
    const jsonStr = extractJSON(raw);
    const parsed = JSON.parse(jsonStr);

    if (typeof parsed !== 'object' || parsed === null) {
      throw new Error('Parsed result is not an object');
    }

    const mapped = mapResponseKeys(parsed);

    // Ensure required fields
    return {
      ...EMPTY_RESPONSE,
      ...mapped,
      narration: mapped.narration || 'The world shifts around you...',
    };
  } catch (error) {
    console.warn('[AI Parser] JSON parse failed, extracting narrative from raw text:', error);

    // Fallback: treat the entire response as narration
    return {
      ...EMPTY_RESPONSE,
      narration: raw.trim(),
    };
  }
}

/**
 * Validate that a parsed response is sensible
 * Returns warnings (not errors) for issues
 */
export function validateResponse(response: AIResponse): string[] {
  const warnings: string[] = [];

  if (!response.narration || response.narration.length < 10) {
    warnings.push('Narration is very short or empty');
  }

  if (response.narration && response.narration.length > 5000) {
    warnings.push('Narration exceeds 5000 characters');
  }

  // Choices and dice_requests shouldn't both be present
  if (response.choices?.length && response.diceRequests?.length) {
    warnings.push('Response has both choices and dice_requests — should be one or the other');
  }

  // Approval changes should have valid deltas
  if (response.approvalChanges) {
    for (const change of response.approvalChanges) {
      if (Math.abs(change.delta) > 20) {
        warnings.push(`Large approval change for ${change.companion}: ${change.delta}`);
      }
    }
  }

  return warnings;
}
```

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit src/ai/parser.ts 2>&1 | head -10
```

**Step 3: Commit**

```bash
git add src/ai/parser.ts
git commit -m "Add AI response parser with JSON extraction and fallbacks"
```

---

### Task 4: Create NarrativeText Component

**Files:**
- Create: `src/components/game/NarrativeText.tsx`

**Step 1: Create src/components/game/NarrativeText.tsx**

Typewriter text effect with tap-to-complete. Uses Reanimated for smooth animation.

```tsx
// NarrativeText — Typewriter text with tap-to-complete
// Font: IM Fell English (narrative), warm off-white text on dark bg

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors } from '@/theme/colors';
import { textStyles, spacing } from '@/theme/typography';

interface NarrativeTextProps {
  text: string;
  speed?: 'instant' | 'fast' | 'normal' | 'slow';
  onComplete?: () => void;
}

const SPEED_MS: Record<string, number> = {
  instant: 0,
  fast: 15,
  normal: 30,
  slow: 50,
};

export function NarrativeText({ text, speed = 'normal', onComplete }: NarrativeTextProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const indexRef = useRef(0);
  const opacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const completeText = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setDisplayedText(text);
    setIsComplete(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onComplete?.();
  }, [text, onComplete]);

  useEffect(() => {
    // Reset on new text
    indexRef.current = 0;
    setDisplayedText('');
    setIsComplete(false);
    opacity.value = withTiming(1, { duration: 300 });

    const delayMs = SPEED_MS[speed] || SPEED_MS.normal;

    if (delayMs === 0 || !text) {
      setDisplayedText(text);
      setIsComplete(true);
      onComplete?.();
      return;
    }

    intervalRef.current = setInterval(() => {
      indexRef.current += 1;
      if (indexRef.current >= text.length) {
        setDisplayedText(text);
        setIsComplete(true);
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = null;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onComplete?.();
      } else {
        setDisplayedText(text.slice(0, indexRef.current));
      }
    }, delayMs);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [text, speed]);

  return (
    <Pressable onPress={isComplete ? undefined : completeText} style={styles.container}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View style={animatedStyle}>
          <Text style={styles.text}>{displayedText}</Text>
          {!isComplete && <Text style={styles.cursor}>|</Text>}
        </Animated.View>
      </ScrollView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  scroll: {
    flex: 1,
  },
  text: {
    ...textStyles.narrative,
    color: colors.text.primary,
  },
  cursor: {
    ...textStyles.narrative,
    color: colors.gold.primary,
    opacity: 0.6,
  },
});
```

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit src/components/game/NarrativeText.tsx 2>&1 | head -10
```

**Step 3: Commit**

```bash
git add src/components/game/NarrativeText.tsx
git commit -m "Add NarrativeText component with typewriter effect"
```

---

### Task 5: Create ChoiceButton Component

**Files:**
- Create: `src/components/game/ChoiceButton.tsx`

**Step 1: Create src/components/game/ChoiceButton.tsx**

Choice buttons with skill check display and press animation.

```tsx
// ChoiceButton — Interactive choice with skill check display
// Format: "Choice text [Persuasion — 65%]"

import React from 'react';
import { Text, StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '@/theme/colors';
import { textStyles, spacing, fonts } from '@/theme/typography';
import type { Choice } from '@/types/game';

interface ChoiceButtonProps {
  choice: Choice;
  onPress: (choice: Choice) => void;
  disabled?: boolean;
}

export function ChoiceButton({ choice, onPress, disabled }: ChoiceButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    if (disabled) return;
    scale.value = withSequence(
      withTiming(0.96, { duration: 80 }),
      withTiming(1, { duration: 120 })
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress(choice);
  };

  const hasSkillCheck = !!choice.skillCheck;
  const borderColor = hasSkillCheck ? colors.gold.primary : colors.gold.dim;

  return (
    <Pressable onPress={handlePress} disabled={disabled}>
      <Animated.View
        style={[
          styles.container,
          { borderColor, opacity: disabled ? 0.4 : 1 },
          animatedStyle,
        ]}
      >
        <View style={styles.row}>
          {choice.icon ? <Text style={styles.icon}>{choice.icon}</Text> : null}
          <Text style={[styles.text, hasSkillCheck && styles.textGold]}>
            {choice.text}
          </Text>
        </View>

        {hasSkillCheck && choice.skillCheck && (
          <View style={styles.skillCheckRow}>
            <Text style={styles.skillLabel}>
              {formatSkillName(choice.skillCheck.skill)}
            </Text>
            <Text style={[
              styles.chance,
              { color: getChanceColor(choice.skillCheck.successChance) },
            ]}>
              {choice.skillCheck.successChance}%
            </Text>
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

function formatSkillName(skill: string): string {
  return skill
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

function getChanceColor(chance: number): string {
  if (chance >= 75) return colors.approval.friendly;
  if (chance >= 50) return colors.gold.primary;
  if (chance >= 25) return colors.approval.cold;
  return colors.combat.red;
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: colors.bg.tertiary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  text: {
    ...textStyles.choiceText,
    color: colors.text.primary,
    flex: 1,
  },
  textGold: {
    color: colors.gold.bright,
  },
  skillCheckRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.gold.border,
  },
  skillLabel: {
    ...textStyles.skillCheckLabel,
    color: colors.text.tertiary,
  },
  chance: {
    fontFamily: fonts.heading,
    fontSize: 12,
    letterSpacing: 1,
  },
});
```

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit src/components/game/ChoiceButton.tsx 2>&1 | head -10
```

**Step 3: Commit**

```bash
git add src/components/game/ChoiceButton.tsx
git commit -m "Add ChoiceButton component with skill check display"
```

---

### Task 6: Create HpBar Component

**Files:**
- Create: `src/components/game/HpBar.tsx`

**Step 1: Create src/components/game/HpBar.tsx**

Animated HP bar with color transitions and damage/heal flash effects.

```tsx
// HpBar — Animated health bar with color transitions
// Green >50%, yellow 20-50%, red <20%

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  interpolateColor,
  Easing,
} from 'react-native-reanimated';
import { colors } from '@/theme/colors';
import { fonts, spacing } from '@/theme/typography';

interface HpBarProps {
  current: number;
  max: number;
  label?: string;
  showLabel?: boolean;
}

function getHpColor(ratio: number): string {
  if (ratio > 0.5) return '#4a8c3c';   // Green — healthy
  if (ratio > 0.2) return '#b48c3c';   // Gold/yellow — wounded
  return colors.combat.red;             // Red — critical
}

export function HpBar({ current, max, label, showLabel = true }: HpBarProps) {
  const ratio = max > 0 ? Math.max(0, Math.min(1, current / max)) : 0;
  const widthAnim = useSharedValue(ratio);
  const flashOpacity = useSharedValue(0);
  const prevCurrent = useSharedValue(current);

  useEffect(() => {
    const delta = current - prevCurrent.value;
    prevCurrent.value = current;

    // Animate width
    widthAnim.value = withTiming(ratio, { duration: 400, easing: Easing.out(Easing.cubic) });

    // Flash on change
    if (delta !== 0) {
      flashOpacity.value = withSequence(
        withTiming(0.6, { duration: 100 }),
        withTiming(0, { duration: 400 })
      );
    }
  }, [current, max]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${widthAnim.value * 100}%`,
    backgroundColor: getHpColor(widthAnim.value),
  }));

  const flashStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
    backgroundColor: current < prevCurrent.value
      ? colors.combat.damageFlash
      : colors.combat.healFlash,
  }));

  return (
    <View style={styles.container}>
      {label && showLabel && (
        <Text style={styles.label}>{label}</Text>
      )}
      <View style={styles.track}>
        <Animated.View style={[styles.fill, barStyle]} />
        <Animated.View style={[styles.flash, flashStyle]} />
        <Text style={styles.hpText}>
          {current}/{max}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    fontFamily: fonts.headingRegular,
    fontSize: 9,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.text.tertiary,
    marginBottom: 2,
  },
  track: {
    height: 18,
    borderRadius: 4,
    backgroundColor: colors.bg.secondary,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 4,
  },
  flash: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 4,
  },
  hpText: {
    fontFamily: fonts.heading,
    fontSize: 10,
    color: colors.text.primary,
    textAlign: 'center',
    letterSpacing: 1,
  },
});
```

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit src/components/game/HpBar.tsx 2>&1 | head -10
```

**Step 3: Commit**

```bash
git add src/components/game/HpBar.tsx
git commit -m "Add HpBar component with animated color transitions"
```

---

### Task 7: Create PartyCard Component

**Files:**
- Create: `src/components/game/PartyCard.tsx`

**Step 1: Create src/components/game/PartyCard.tsx**

Shows character portrait, name, HP, AC, conditions, and companion approval stage.

```tsx
// PartyCard — Character/companion card with HP bar and status
// Shows portrait, name, HP, AC, conditions, relationship stage

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors } from '@/theme/colors';
import { fonts, textStyles, spacing } from '@/theme/typography';
import { HpBar } from './HpBar';
import type { Condition, RelationshipStage, ClassName } from '@/types/game';

interface PartyCardProps {
  name: string;
  className: ClassName;
  level: number;
  currentHp: number;
  maxHp: number;
  ac: number;
  conditions: Condition[];
  isCompanion?: boolean;
  approvalScore?: number;
  relationshipStage?: RelationshipStage;
  onPress?: () => void;
}

const STAGE_LABELS: Record<RelationshipStage, string> = {
  hostile: 'Hostile',
  cold: 'Cold',
  neutral: 'Neutral',
  friendly: 'Friendly',
  trusted: 'Trusted',
  bonded: 'Bonded',
  devoted: 'Devoted',
};

export function PartyCard({
  name,
  className,
  level,
  currentHp,
  maxHp,
  ac,
  conditions,
  isCompanion,
  approvalScore,
  relationshipStage,
  onPress,
}: PartyCardProps) {
  const classColor = colors.class[className] || colors.gold.muted;

  return (
    <Pressable onPress={onPress} style={[styles.card, { borderColor: classColor }]}>
      {/* Portrait placeholder */}
      <View style={[styles.portrait, { backgroundColor: classColor + '30' }]}>
        <Text style={styles.portraitText}>
          {name.charAt(0).toUpperCase()}
        </Text>
      </View>

      {/* Info */}
      <View style={styles.info}>
        <View style={styles.headerRow}>
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
          <View style={styles.acBadge}>
            <Text style={styles.acText}>{ac}</Text>
          </View>
        </View>

        <Text style={styles.classLabel}>
          Lv{level} {formatClassName(className)}
        </Text>

        <HpBar current={currentHp} max={maxHp} showLabel={false} />

        {/* Conditions */}
        {conditions.length > 0 && (
          <View style={styles.conditionRow}>
            {conditions.map(c => (
              <View key={c} style={styles.conditionBadge}>
                <Text style={styles.conditionText}>{formatCondition(c)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Companion approval */}
        {isCompanion && relationshipStage && (
          <Text style={[
            styles.stageLabel,
            { color: colors.approval[relationshipStage] || colors.text.tertiary },
          ]}>
            {STAGE_LABELS[relationshipStage]}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

function formatClassName(cn: string): string {
  return cn.charAt(0).toUpperCase() + cn.slice(1);
}

function formatCondition(c: string): string {
  return c.replace(/_\d+$/, '').replace(/_/g, ' ');
}

const styles = StyleSheet.create({
  card: {
    width: 140,
    backgroundColor: colors.bg.tertiary,
    borderRadius: 10,
    borderWidth: 1,
    padding: spacing.sm,
    marginRight: spacing.sm,
  },
  portrait: {
    width: '100%',
    height: 48,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  portraitText: {
    fontFamily: fonts.heading,
    fontSize: 22,
    color: colors.text.primary,
  },
  info: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  name: {
    ...textStyles.characterName,
    color: colors.text.primary,
    flex: 1,
    fontSize: 12,
  },
  acBadge: {
    backgroundColor: colors.bg.secondary,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.gold.border,
  },
  acText: {
    fontFamily: fonts.heading,
    fontSize: 10,
    color: colors.gold.primary,
  },
  classLabel: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.text.tertiary,
    marginBottom: spacing.xs,
  },
  conditionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.xs,
    gap: 2,
  },
  conditionBadge: {
    backgroundColor: colors.combat.redBorder,
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  conditionText: {
    fontSize: 8,
    color: colors.combat.red,
    fontFamily: fonts.body,
    textTransform: 'capitalize',
  },
  stageLabel: {
    fontFamily: fonts.headingRegular,
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: spacing.xs,
  },
});
```

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit src/components/game/PartyCard.tsx 2>&1 | head -10
```

**Step 3: Commit**

```bash
git add src/components/game/PartyCard.tsx
git commit -m "Add PartyCard component with HP bar and companion status"
```

---

### Task 8: Create AbilityCard Component

**Files:**
- Create: `src/components/game/AbilityCard.tsx`

**Step 1: Create src/components/game/AbilityCard.tsx**

Combat ability card showing name, description, resource cost, availability.

```tsx
// AbilityCard — Combat ability display
// Color-coded by type: attack (red), spell (purple), reaction (orange), bonus (blue), heal (green)

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '@/theme/colors';
import { fonts, spacing } from '@/theme/typography';

type AbilityType = 'attack' | 'spell' | 'reaction' | 'bonus' | 'heal';

interface AbilityCardProps {
  name: string;
  type: AbilityType;
  description: string;
  range?: string;
  damage?: string;
  resourceCost?: { type: string; amount: number };
  isAvailable: boolean;
  onPress?: () => void;
}

export function AbilityCard({
  name,
  type,
  description,
  range,
  damage,
  resourceCost,
  isAvailable,
  onPress,
}: AbilityCardProps) {
  const typeColors = colors.ability[type] || colors.ability.attack;

  const handlePress = () => {
    if (!isAvailable || !onPress) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Pressable onPress={handlePress} disabled={!isAvailable}>
      <View style={[
        styles.card,
        {
          backgroundColor: isAvailable ? typeColors.bg : colors.bg.secondary,
          borderColor: isAvailable ? typeColors.border : colors.gold.border,
          opacity: isAvailable ? 1 : 0.4,
        },
      ]}>
        <View style={styles.header}>
          <Text style={[styles.name, { color: isAvailable ? typeColors.glow : colors.text.disabled }]}>
            {name}
          </Text>
          <Text style={styles.typeBadge}>{type.toUpperCase()}</Text>
        </View>

        <Text style={styles.description} numberOfLines={2}>
          {description}
        </Text>

        <View style={styles.footer}>
          {range && <Text style={styles.detail}>{range}</Text>}
          {damage && <Text style={styles.detail}>{damage}</Text>}
          {resourceCost && (
            <Text style={styles.cost}>
              {resourceCost.amount} {resourceCost.type.replace(/_/g, ' ')}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing.sm,
    marginRight: spacing.sm,
    width: 150,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  name: {
    fontFamily: fonts.heading,
    fontSize: 11,
    letterSpacing: 0.5,
    flex: 1,
  },
  typeBadge: {
    fontFamily: fonts.headingRegular,
    fontSize: 7,
    letterSpacing: 1,
    color: colors.text.tertiary,
  },
  description: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.text.secondary,
    lineHeight: 14,
    marginBottom: spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  detail: {
    fontFamily: fonts.body,
    fontSize: 9,
    color: colors.text.tertiary,
  },
  cost: {
    fontFamily: fonts.headingRegular,
    fontSize: 9,
    color: colors.gold.muted,
    textTransform: 'capitalize',
  },
});
```

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit src/components/game/AbilityCard.tsx 2>&1 | head -10
```

**Step 3: Commit**

```bash
git add src/components/game/AbilityCard.tsx
git commit -m "Add AbilityCard component with type-based color coding"
```

---

### Task 9: Create ApprovalIndicator Component

**Files:**
- Create: `src/components/game/ApprovalIndicator.tsx`

**Step 1: Create src/components/game/ApprovalIndicator.tsx**

Floating approval change indicator with slide-in/fade-out animation.

```tsx
// ApprovalIndicator — Floating companion approval popup
// "▲ Sera approves" or "▼ Korrin disapproves"
// Slides in, shows for ~2s, fades out

import React, { useEffect } from 'react';
import { Text, StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors } from '@/theme/colors';
import { fonts, spacing } from '@/theme/typography';
import type { ApprovalChange } from '@/types/game';

interface ApprovalIndicatorProps {
  change: ApprovalChange;
  onDismiss?: () => void;
}

export function ApprovalIndicator({ change, onDismiss }: ApprovalIndicatorProps) {
  const translateY = useSharedValue(30);
  const opacity = useSharedValue(0);
  const isPositive = change.delta > 0;

  useEffect(() => {
    Haptics.notificationAsync(
      isPositive
        ? Haptics.NotificationFeedbackType.Success
        : Haptics.NotificationFeedbackType.Warning
    );

    translateY.value = withTiming(0, { duration: 300 });
    opacity.value = withSequence(
      withTiming(1, { duration: 300 }),
      withDelay(1700, withTiming(0, { duration: 400 }))
    );

    // Auto-dismiss after animation
    const timer = setTimeout(() => {
      onDismiss?.();
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const color = isPositive ? colors.approval.friendly : colors.combat.red;
  const arrow = isPositive ? '\u25B2' : '\u25BC';
  const verb = isPositive ? 'approves' : 'disapproves';

  return (
    <Animated.View style={[styles.container, { borderColor: color + '40' }, animatedStyle]}>
      <Text style={[styles.arrow, { color }]}>{arrow}</Text>
      <Text style={styles.text}>
        <Text style={[styles.name, { color }]}>{change.companion}</Text>
        {' '}{verb}
      </Text>
    </Animated.View>
  );
}

/**
 * Stacked list of approval changes
 */
interface ApprovalStackProps {
  changes: ApprovalChange[];
  onAllDismissed?: () => void;
}

export function ApprovalStack({ changes, onAllDismissed }: ApprovalStackProps) {
  const [remaining, setRemaining] = React.useState(changes);

  useEffect(() => {
    setRemaining(changes);
  }, [changes]);

  const handleDismiss = (index: number) => {
    setRemaining(prev => {
      const next = prev.filter((_, i) => i !== index);
      if (next.length === 0) onAllDismissed?.();
      return next;
    });
  };

  return (
    <View style={styles.stack}>
      {remaining.map((change, i) => (
        <ApprovalIndicator
          key={`${change.companion}-${i}`}
          change={change}
          onDismiss={() => handleDismiss(i)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: spacing.xs,
    pointerEvents: 'none',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.tertiary,
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  arrow: {
    fontSize: 10,
    marginRight: spacing.xs,
  },
  text: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.text.secondary,
  },
  name: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
  },
});
```

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit src/components/game/ApprovalIndicator.tsx 2>&1 | head -10
```

**Step 3: Commit**

```bash
git add src/components/game/ApprovalIndicator.tsx
git commit -m "Add ApprovalIndicator with animated slide-in/fade-out"
```

---

### Task 10: Create Game Session Screen

**Files:**
- Create: `app/game/session.tsx`
- Create: `app/game/_layout.tsx`

**Step 1: Create app/game/_layout.tsx**

Simple Stack layout for the game route group.

```tsx
import { Stack } from 'expo-router';
import { colors } from '@/theme/colors';

export default function GameLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg.primary },
        animation: 'fade',
      }}
    />
  );
}
```

**Step 2: Create app/game/session.tsx**

The main game screen tying everything together.

```tsx
// Game Session — Main gameplay screen
// Layout: Narrative (60%) → Party strip (15%) → Choices (25%)

import React, { useCallback } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, Text, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/theme/colors';
import { fonts, spacing, textStyles } from '@/theme/typography';
import { useGameStore } from '@/stores/useGameStore';
import { NarrativeText } from '@/components/game/NarrativeText';
import { ChoiceButton } from '@/components/game/ChoiceButton';
import { PartyCard } from '@/components/game/PartyCard';
import { ApprovalStack } from '@/components/game/ApprovalIndicator';
import type { Choice, Companion } from '@/types/game';

export default function GameSessionScreen() {
  const router = useRouter();
  const {
    campaign,
    character,
    isLoading,
    currentNarration,
    currentChoices,
    currentMode,
    currentMood,
    pendingApprovalChanges,
    isNarrationComplete,
    setNarrationComplete,
  } = useGameStore();

  const handleChoicePress = useCallback((choice: Choice) => {
    // TODO: Send choice to AI via Edge Function
    // For now, just set loading
    useGameStore.getState().setLoading(true);
    console.log('Choice selected:', choice.text);
  }, []);

  const handleNarrationComplete = useCallback(() => {
    setNarrationComplete(true);
  }, [setNarrationComplete]);

  const handleApprovalsDismissed = useCallback(() => {
    // Clear pending approvals from store
    // Will be implemented when AI integration is connected
  }, []);

  // Build party list: player character + companions
  const partyMembers = React.useMemo(() => {
    const members: {
      key: string;
      name: string;
      className: Companion['className'];
      level: number;
      currentHp: number;
      maxHp: number;
      ac: number;
      conditions: Companion['conditions'];
      isCompanion: boolean;
      approvalScore?: number;
      relationshipStage?: Companion['relationshipStage'];
    }[] = [];

    if (character) {
      members.push({
        key: 'player',
        name: character.name,
        className: character.className,
        level: character.level,
        currentHp: character.hp,
        maxHp: character.maxHp,
        ac: character.ac,
        conditions: character.conditions,
        isCompanion: false,
      });
    }

    if (campaign?.companions) {
      campaign.companions.forEach(c => {
        members.push({
          key: c.name,
          name: c.name,
          className: c.className,
          level: c.level,
          currentHp: c.hp,
          maxHp: c.maxHp,
          ac: c.ac,
          conditions: c.conditions,
          isCompanion: true,
          approvalScore: c.approvalScore,
          relationshipStage: c.relationshipStage,
        });
      });
    }

    return members;
  }, [character, campaign?.companions]);

  // Placeholder state for demo — shows when no campaign is loaded
  if (!campaign || !character) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>QuestForge</Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No Active Campaign</Text>
          <Text style={styles.emptySubtitle}>
            Create a character and start a campaign to begin your adventure.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{campaign.currentLocation}</Text>
        <View style={styles.headerRight}>
          <Text style={styles.turnLabel}>Turn {campaign.turnCount}</Text>
        </View>
      </View>

      {/* Narrative Area */}
      <View style={styles.narrativeArea}>
        {isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="small" color={colors.gold.primary} />
            <Text style={styles.loadingText}>The DM ponders...</Text>
          </View>
        ) : (
          <NarrativeText
            text={currentNarration}
            speed="normal"
            onComplete={handleNarrationComplete}
          />
        )}
      </View>

      {/* Party Strip */}
      <View style={styles.partyStrip}>
        <FlatList
          horizontal
          data={partyMembers}
          keyExtractor={item => item.key}
          renderItem={({ item }) => (
            <PartyCard
              name={item.name}
              className={item.className}
              level={item.level}
              currentHp={item.currentHp}
              maxHp={item.maxHp}
              ac={item.ac}
              conditions={item.conditions}
              isCompanion={item.isCompanion}
              approvalScore={item.approvalScore}
              relationshipStage={item.relationshipStage}
            />
          )}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.partyList}
        />
      </View>

      {/* Choice Area */}
      <View style={styles.choiceArea}>
        {isNarrationComplete && currentChoices.map((choice, index) => (
          <ChoiceButton
            key={index}
            choice={choice}
            onPress={handleChoicePress}
            disabled={isLoading}
          />
        ))}
      </View>

      {/* Approval Indicators */}
      {pendingApprovalChanges.length > 0 && (
        <ApprovalStack
          changes={pendingApprovalChanges}
          onAllDismissed={handleApprovalsDismissed}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gold.border,
  },
  headerTitle: {
    fontFamily: fonts.heading,
    fontSize: 14,
    letterSpacing: 1,
    color: colors.gold.primary,
    textTransform: 'uppercase',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  turnLabel: {
    fontFamily: fonts.headingRegular,
    fontSize: 10,
    color: colors.text.tertiary,
    letterSpacing: 1,
  },
  narrativeArea: {
    flex: 1,
    minHeight: '50%',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: fonts.narrative,
    fontSize: 14,
    color: colors.text.tertiary,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
  partyStrip: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.gold.border,
    paddingVertical: spacing.sm,
  },
  partyList: {
    paddingHorizontal: spacing.lg,
  },
  choiceArea: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.gold.border,
    paddingTop: spacing.sm,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  emptyTitle: {
    ...textStyles.screenTitle,
    color: colors.gold.primary,
    marginBottom: spacing.md,
    fontSize: 18,
  },
  emptySubtitle: {
    ...textStyles.narrative,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
```

**Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -20
```

**Step 4: Commit**

```bash
git add app/game/
git commit -m "Add game session screen with narrative, party, and choice layout"
```

---

### Task 11: Final Verification

**Step 1: Run full TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No errors.

**Step 2: Verify all 10 new files exist**

```bash
ls -la src/engine/combat.ts src/ai/context-builder.ts src/ai/parser.ts \
  src/components/game/NarrativeText.tsx src/components/game/ChoiceButton.tsx \
  src/components/game/HpBar.tsx src/components/game/PartyCard.tsx \
  src/components/game/AbilityCard.tsx src/components/game/ApprovalIndicator.tsx \
  app/game/session.tsx app/game/_layout.tsx
```

**Step 3: Start dev server and check for build errors**

```bash
npx expo start --web --port 8081
```

Expected: Builds without errors, app loads at localhost:8081.

**Step 4: Navigate to game screen**

Open http://localhost:8081/game/session — should see the "No Active Campaign" placeholder screen with QuestForge header and gold text.

---

## Verification Checklist

- [ ] `src/engine/combat.ts` — Combat engine with initiative, turns, attack/save/skill resolution
- [ ] `src/ai/context-builder.ts` — Prompt layer builder with model routing
- [ ] `src/ai/parser.ts` — JSON parser with snake_case→camelCase mapping and fallbacks
- [ ] `src/components/game/NarrativeText.tsx` — Typewriter text with tap-to-complete
- [ ] `src/components/game/ChoiceButton.tsx` — Choice buttons with skill check %
- [ ] `src/components/game/HpBar.tsx` — Animated HP bar with color transitions
- [ ] `src/components/game/PartyCard.tsx` — Character cards with HP, AC, conditions
- [ ] `src/components/game/AbilityCard.tsx` — Combat ability cards with type colors
- [ ] `src/components/game/ApprovalIndicator.tsx` — Floating approval popups
- [ ] `app/game/session.tsx` — Main game screen tying everything together
- [ ] `app/game/_layout.tsx` — Game route layout
- [ ] TypeScript compiles clean
- [ ] Dev server builds without errors
