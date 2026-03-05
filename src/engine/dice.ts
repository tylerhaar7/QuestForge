// D&D 5e Dice Engine — Deterministic, never AI-generated
// All randomness happens HERE, not in Claude's responses

import { DieType, DiceRoll, DiceResult } from '@/types/game';

const DIE_MAX: Record<DieType, number> = {
  d4: 4, d6: 6, d8: 8, d10: 10, d12: 12, d20: 20, d100: 100,
};

/**
 * Roll a single die
 */
export function rollDie(die: DieType): number {
  return Math.floor(Math.random() * DIE_MAX[die]) + 1;
}

/**
 * Roll multiple dice with modifier, advantage/disadvantage
 */
export function rollDice(roll: DiceRoll): DiceResult {
  const { die, count, modifier, advantage, disadvantage } = roll;

  let rolls: number[] = [];

  if (die === 'd20' && (advantage || disadvantage)) {
    // Roll twice for advantage/disadvantage
    const roll1 = rollDie(die);
    const roll2 = rollDie(die);
    const chosen = advantage
      ? Math.max(roll1, roll2)
      : Math.min(roll1, roll2);
    rolls = [chosen];
    // Store both for display: [chosen, other]
  } else {
    for (let i = 0; i < count; i++) {
      rolls.push(rollDie(die));
    }
  }

  const subtotal = rolls.reduce((sum, r) => sum + r, 0);
  const total = subtotal + modifier;
  const isCritical = die === 'd20' && rolls[0] === 20;
  const isFumble = die === 'd20' && rolls[0] === 1;

  const formula = `${count}${die}${modifier >= 0 ? '+' : ''}${modifier !== 0 ? modifier : ''}`;

  return { rolls, total, isCritical, isFumble, formula };
}

/**
 * Parse a dice formula string like "2d6+3" into a DiceRoll
 */
export function parseFormula(formula: string): DiceRoll {
  const match = formula.match(/^(\d+)d(\d+)([+-]\d+)?$/);
  if (!match) {
    throw new Error(`Invalid dice formula: ${formula}`);
  }

  const count = parseInt(match[1], 10);
  const sides = parseInt(match[2], 10);
  const modifier = match[3] ? parseInt(match[3], 10) : 0;
  const die = `d${sides}` as DieType;

  if (!DIE_MAX[die]) {
    throw new Error(`Invalid die type: d${sides}`);
  }

  return { die, count, modifier };
}

/**
 * Roll an attack: d20 + modifier vs AC
 */
export function rollAttack(
  attackModifier: number,
  targetAC: number,
  advantage = false,
  disadvantage = false
): { hit: boolean; roll: DiceResult; damageMultiplier: number } {
  const roll = rollDice({
    die: 'd20',
    count: 1,
    modifier: attackModifier,
    advantage,
    disadvantage,
  });

  // Natural 20 always hits, natural 1 always misses
  const hit = roll.isCritical || (!roll.isFumble && roll.total >= targetAC);
  const damageMultiplier = roll.isCritical ? 2 : 1;

  return { hit, roll, damageMultiplier };
}

/**
 * Roll a saving throw: d20 + modifier vs DC
 */
export function rollSavingThrow(
  saveModifier: number,
  dc: number,
  advantage = false,
  disadvantage = false
): { success: boolean; roll: DiceResult } {
  const roll = rollDice({
    die: 'd20',
    count: 1,
    modifier: saveModifier,
    advantage,
    disadvantage,
  });

  // Nat 20 always succeeds on death saves, nat 1 always fails
  const success = roll.isCritical || (!roll.isFumble && roll.total >= dc);

  return { success, roll };
}

/**
 * Roll a skill check: d20 + modifier vs DC
 */
export function rollSkillCheck(
  skillModifier: number,
  dc: number,
  advantage = false,
  disadvantage = false
): { success: boolean; roll: DiceResult; margin: number } {
  const roll = rollDice({
    die: 'd20',
    count: 1,
    modifier: skillModifier,
    advantage,
    disadvantage,
  });

  const success = roll.total >= dc;
  const margin = roll.total - dc; // Positive = succeeded by, negative = failed by

  return { success, roll, margin };
}

/**
 * Roll initiative for a combatant
 */
export function rollInitiative(dexModifier: number): number {
  const roll = rollDice({ die: 'd20', count: 1, modifier: dexModifier });
  return roll.total;
}

/**
 * Roll damage with optional crit multiplier
 */
export function rollDamage(
  formula: string,
  critMultiplier: number = 1
): DiceResult {
  const parsed = parseFormula(formula);

  if (critMultiplier > 1) {
    // On crit, double the dice count (not the modifier)
    parsed.count *= critMultiplier;
  }

  return rollDice(parsed);
}

/**
 * Calculate success probability for display in skill check UI
 */
export function calculateSuccessChance(modifier: number, dc: number): number {
  // Need to roll (dc - modifier) or higher on d20
  const needed = dc - modifier;
  if (needed <= 1) return 100;  // Auto-succeed (even nat 1 passes)
  if (needed > 20) return 5;    // Only nat 20 succeeds
  return Math.round(((21 - needed) / 20) * 100);
}
