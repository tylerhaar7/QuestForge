// Character mechanics — ability modifiers, proficiency, HP calculation
// All deterministic. No AI involvement.

import type { AbilityScore, AbilityScores, Character, ClassName, Skill } from '@/types/game';

/**
 * Calculate ability modifier from score
 * Score 10-11 = +0, 12-13 = +1, 8-9 = -1, etc.
 */
export function getModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

/**
 * Get proficiency bonus by level
 */
export function getProficiencyBonus(level: number): number {
  return Math.ceil(level / 4) + 1;
}

/**
 * Skill → Ability mapping
 */
export const SKILL_ABILITIES: Record<Skill, AbilityScore> = {
  acrobatics: 'dexterity',
  animal_handling: 'wisdom',
  arcana: 'intelligence',
  athletics: 'strength',
  deception: 'charisma',
  history: 'intelligence',
  insight: 'wisdom',
  intimidation: 'charisma',
  investigation: 'intelligence',
  medicine: 'wisdom',
  nature: 'intelligence',
  perception: 'wisdom',
  performance: 'charisma',
  persuasion: 'charisma',
  religion: 'intelligence',
  sleight_of_hand: 'dexterity',
  stealth: 'dexterity',
  survival: 'wisdom',
};

/**
 * Get total skill modifier for a character
 */
export function getSkillModifier(character: Character, skill: Skill): number {
  const ability = SKILL_ABILITIES[skill];
  const abilityMod = getModifier(character.abilityScores[ability]);
  const isProficient = character.proficientSkills.includes(skill);
  const profBonus = isProficient ? getProficiencyBonus(character.level) : 0;
  return abilityMod + profBonus;
}

/**
 * Get saving throw modifier
 */
export function getSaveModifier(character: Character, ability: AbilityScore): number {
  const abilityMod = getModifier(character.abilityScores[ability]);
  const isProficient = character.proficientSaves.includes(ability);
  const profBonus = isProficient ? getProficiencyBonus(character.level) : 0;
  return abilityMod + profBonus;
}

/**
 * Hit die by class
 */
export const CLASS_HIT_DIE: Record<ClassName, number> = {
  barbarian: 12,
  bard: 8,
  cleric: 8,
  druid: 8,
  fighter: 10,
  monk: 8,
  paladin: 10,
  ranger: 10,
  rogue: 8,
  sorcerer: 6,
  warlock: 8,
  wizard: 6,
  artificer: 8,
};

/**
 * Calculate max HP at a given level
 * Level 1: max hit die + CON modifier
 * Level 2+: average hit die (rounded up) + CON modifier per level
 */
export function calculateMaxHP(
  className: ClassName,
  level: number,
  constitutionScore: number
): number {
  const hitDie = CLASS_HIT_DIE[className];
  const conMod = getModifier(constitutionScore);

  // Level 1: max hit die
  let hp = hitDie + conMod;

  // Levels 2+: average (rounded up) per level
  const avgPerLevel = Math.ceil(hitDie / 2) + 1;
  for (let i = 2; i <= level; i++) {
    hp += avgPerLevel + conMod;
  }

  return Math.max(1, hp);  // Minimum 1 HP
}

/**
 * Calculate AC from equipment
 * Base AC = 10 + DEX modifier (no armor)
 */
export function calculateAC(character: Character): number {
  const dexMod = getModifier(character.abilityScores.dexterity);

  const armor = character.equipment.find(
    (e) => e.type === 'armor' && e.equipped
  );
  const shield = character.equipment.find(
    (e) => e.type === 'shield' && e.equipped
  );

  let ac = 10 + dexMod;  // Unarmored default

  if (armor) {
    const armorAC = armor.properties.ac || 10;
    const maxDex = armor.properties.maxDex ?? Infinity;
    const dexBonus = Math.min(dexMod, maxDex);

    ac = armorAC + dexBonus;
  }

  if (shield) {
    ac += shield.properties.acBonus || 2;
  }

  // TODO: Handle class-specific unarmored defense (Barbarian, Monk)

  return ac;
}
