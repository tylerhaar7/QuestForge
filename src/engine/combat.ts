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
        const abilityKey = (['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'] as const)
          .find(a => ability.includes(a)) || 'constitution';
        const saveMod = getSaveModifier(character, abilityKey);
        const result = resolveSave(req, saveMod);
        results.push(`MECHANICAL RESULT: ${result.description}`);
        break;
      }
      case 'skill_check': {
        const skill = req.ability?.toLowerCase().replace(/ /g, '_') || 'perception';
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
