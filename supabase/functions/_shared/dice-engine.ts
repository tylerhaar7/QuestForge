// Dice engine for Edge Functions — mirrors src/engine/dice.ts + combat.ts
// Deterministic mechanics, no AI

import type { AbilityScore, AbilityScores, CharacterRow, DiceRequest, Skill } from './types.ts';

export interface StructuredDiceResult {
  type: 'skill_check' | 'attack_roll' | 'saving_throw' | 'damage';
  roller: string;
  roll: number;
  modifier: number;
  total: number;
  dc?: number;
  success?: boolean;
  isCritical: boolean;
  isFumble: boolean;
  label: string;
}

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
  structuredResults: StructuredDiceResult[];
  hpChanges: { target: string; delta: number }[];
}

export function processDiceRequests(
  requests: DiceRequest[],
  character: CharacterRow,
  enemies: { name: string; ac: number; hp: number; maxHp: number }[]
): DiceResolutionResult {
  const results: string[] = [];
  const structuredResults: StructuredDiceResult[] = [];
  const hpChanges: { target: string; delta: number }[] = [];

  for (const req of requests) {
    switch (req.type) {
      case 'attack_roll': {
        // Determine if this is an enemy attacking the player or the player attacking an enemy
        const isEnemyAttack = req.roller !== character.name && !enemies.find(e => e.name === req.target);
        const isPlayerTarget = req.target === character.name || req.target === 'Player';

        if (isEnemyAttack || isPlayerTarget) {
          // Enemy attacking the player — use DC from request as attack bonus, roll against player AC
          const enemyAttackMod = req.dc || 3; // AI can pass enemy attack bonus via dc field
          const targetAC = character.ac;
          const d20 = rollD20();
          const isCrit = d20 === 20;
          const isFumble = d20 === 1;
          const total = d20 + enemyAttackMod;
          const hit = isCrit || (!isFumble && total >= targetAC);

          if (hit) {
            const formula = req.formula || '1d6+2';
            const dmg = rollFormula(formula, isCrit ? 2 : 1);
            results.push(
              `MECHANICAL RESULT: ${req.roller}'s ${req.ability || 'attack'} ${isCrit ? 'CRITS' : 'hits'} ${character.name} (rolled ${total} vs AC ${targetAC}) for ${dmg.total} damage. ${character.name} HP: ${Math.max(0, character.hp - dmg.total)}/${character.max_hp}.`
            );
            hpChanges.push({ target: character.name, delta: -dmg.total });
          } else {
            results.push(
              `MECHANICAL RESULT: ${req.roller}'s ${req.ability || 'attack'} misses ${character.name} (rolled ${total} vs AC ${targetAC}).`
            );
          }
          structuredResults.push({
            type: 'attack_roll',
            roller: req.roller || 'Enemy',
            roll: d20,
            modifier: enemyAttackMod,
            total,
            dc: targetAC,
            success: hit,
            isCritical: isCrit,
            isFumble,
            label: `${req.ability || 'Attack'} vs ${character.name}`,
          });
        } else {
          // Player (or companion) attacking an enemy
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
          structuredResults.push({
            type: 'attack_roll',
            roller: req.roller || character.name,
            roll: d20,
            modifier: attackMod,
            total,
            dc: targetAC,
            success: hit,
            isCritical: isCrit,
            isFumble,
            label: `${req.ability || 'Attack'} vs ${req.target || 'target'}`,
          });
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
        structuredResults.push({
          type: 'saving_throw',
          roller: req.roller || character.name,
          roll: d20,
          modifier: saveMod,
          total,
          dc,
          success,
          isCritical: d20 === 20,
          isFumble: d20 === 1,
          label: `${req.ability || 'Constitution'} Save`,
        });
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
        structuredResults.push({
          type: 'skill_check',
          roller: req.roller || character.name,
          roll: d20,
          modifier: skillMod,
          total,
          dc,
          success,
          isCritical: d20 === 20,
          isFumble: d20 === 1,
          label: `${req.ability || 'Perception'} Check`,
        });
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

      case 'initiative': {
        const roller = req.roller || character.name;
        const isPlayer = roller === character.name || roller === 'Player';
        const dexMod = isPlayer ? getModifier(character.ability_scores.dexterity) : (req.dc || 1);
        const d20 = rollD20();
        const total = d20 + dexMod;
        results.push(
          `MECHANICAL RESULT: ${roller} rolls initiative: ${total} (rolled ${d20} + ${dexMod}).`
        );
        structuredResults.push({
          type: 'skill_check',
          roller,
          roll: d20,
          modifier: dexMod,
          total,
          success: true,
          isCritical: d20 === 20,
          isFumble: d20 === 1,
          label: `${roller} Initiative`,
        });
        break;
      }
    }
  }

  return { results, structuredResults, hpChanges };
}
