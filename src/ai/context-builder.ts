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
