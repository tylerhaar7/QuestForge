// D&D 5e Spell Learning & Preparation Rules per Class
// Used by the level-up engine to determine what spells a character gains/can prepare.
// All arrays are 20 entries: index 0 = level 1, index 19 = level 20.

import type { ClassName } from '@/types/game';

// ─── Types ───────────────────────────────────────────────────────────────────

export type CastingType = 'full' | 'half' | 'third' | 'pact' | 'none';
export type LearningStyle = 'known' | 'prepared' | 'spellbook' | 'none';
export type SpellcastingAbility = 'intelligence' | 'wisdom' | 'charisma' | 'none';

export interface SpellProgressionRule {
  className: string;
  castingType: CastingType;
  spellcastingAbility: SpellcastingAbility;
  /** How this class learns spells */
  learningStyle: LearningStyle;
  /** Number of cantrips known at each level (index = level - 1) */
  cantripsKnown: number[];
  /** For 'known' casters: total spells known at each level (index = level - 1). null for prepared/spellbook casters */
  spellsKnown: number[] | null;
  /** For 'prepared' casters: number of prepared spells = level + ability modifier (or variant). This is the formula flag */
  preparedFormula: boolean;
  /** For 'spellbook' casters (wizard): learns 2 new spells per level-up (added to spellbook) */
  spellbookLearning: boolean;
  /** Can this class swap a known spell on level-up? */
  canSwapOnLevelUp: boolean;
  /** Max number of spells that can be swapped per level-up (usually 1) */
  maxSwapsPerLevel: number;
  /** Highest spell level accessible at each character level (index = level - 1) */
  maxSpellLevel: number[];
  /** School restrictions, if any (e.g., Eldritch Knight, Arcane Trickster) */
  schoolRestrictions?: { primary: string[]; freePickLevels: number[] };
  /** Notes about special rules for this class's spellcasting */
  notes?: string;
}

export interface LevelUpSpellInfo {
  /** Whether the character can learn new spells at this level */
  canLearnNew: boolean;
  /** Number of new spells gained this level */
  newSpellCount: number;
  /** Whether the character can swap out a previously known spell */
  canSwap: boolean;
  /** Highest spell level the character can learn at this level */
  maxNewSpellLevel: number;
  /** For prepared casters: how many spells they can prepare (requires abilityModifier) */
  preparedCount?: number;
  /** For spellbook: how many spells are added to the spellbook */
  spellbookAdditions?: number;
  /** New cantrips gained at this level (delta from previous level) */
  newCantrips: number;
}

// ─── Spell Progression Data ──────────────────────────────────────────────────

// BARD — Full caster, known spells, CHA
// PHB p.52-54: Starts with 4 spells known at level 1, gains per the Spells Known column
const BARD: SpellProgressionRule = {
  className: 'bard',
  castingType: 'full',
  spellcastingAbility: 'charisma',
  learningStyle: 'known',
  cantripsKnown: [
    2, 2, 2, 3, 3, 3, 3, 3, 3, 4,  // Levels 1-10
    4, 4, 4, 4, 4, 4, 4, 4, 4, 4,  // Levels 11-20
  ],
  spellsKnown: [
    4, 5, 6, 7, 8, 9, 10, 11, 12, 14,  // Levels 1-10
    15, 15, 16, 16, 17, 17, 18, 18, 19, 20,  // Levels 11-20 (Magical Secrets at 10, 14, 18)
  ],
  preparedFormula: false,
  spellbookLearning: false,
  canSwapOnLevelUp: true,
  maxSwapsPerLevel: 1,
  maxSpellLevel: [
    1, 1, 2, 2, 3, 3, 4, 4, 5, 5,  // Levels 1-10
    6, 6, 7, 7, 8, 8, 9, 9, 9, 9,  // Levels 11-20
  ],
  notes: 'Magical Secrets at levels 10, 14, 18 allow learning spells from any class list.',
};

// CLERIC — Full caster, prepared, WIS
// PHB p.58: Prepares WIS mod + cleric level spells from the full cleric list each day
const CLERIC: SpellProgressionRule = {
  className: 'cleric',
  castingType: 'full',
  spellcastingAbility: 'wisdom',
  learningStyle: 'prepared',
  cantripsKnown: [
    3, 3, 3, 4, 4, 4, 4, 4, 4, 5,  // Levels 1-10
    5, 5, 5, 5, 5, 5, 5, 5, 5, 5,  // Levels 11-20
  ],
  spellsKnown: null,
  preparedFormula: true,
  spellbookLearning: false,
  canSwapOnLevelUp: false,
  maxSwapsPerLevel: 0,
  maxSpellLevel: [
    1, 1, 2, 2, 3, 3, 4, 4, 5, 5,  // Levels 1-10
    6, 6, 7, 7, 8, 8, 9, 9, 9, 9,  // Levels 11-20
  ],
  notes: 'Prepared count = cleric level + WIS modifier (minimum 1). Domain spells are always prepared and do not count against this limit.',
};

// DRUID — Full caster, prepared, WIS
// PHB p.66: Prepares WIS mod + druid level spells from the full druid list each day
const DRUID: SpellProgressionRule = {
  className: 'druid',
  castingType: 'full',
  spellcastingAbility: 'wisdom',
  learningStyle: 'prepared',
  cantripsKnown: [
    2, 2, 2, 3, 3, 3, 3, 3, 3, 4,  // Levels 1-10
    4, 4, 4, 4, 4, 4, 4, 4, 4, 4,  // Levels 11-20
  ],
  spellsKnown: null,
  preparedFormula: true,
  spellbookLearning: false,
  canSwapOnLevelUp: false,
  maxSwapsPerLevel: 0,
  maxSpellLevel: [
    1, 1, 2, 2, 3, 3, 4, 4, 5, 5,  // Levels 1-10
    6, 6, 7, 7, 8, 8, 9, 9, 9, 9,  // Levels 11-20
  ],
  notes: 'Prepared count = druid level + WIS modifier (minimum 1). Circle spells are always prepared and do not count against this limit.',
};

// PALADIN — Half caster, prepared, CHA
// PHB p.84: Gains spellcasting at level 2. Prepares CHA mod + floor(paladin level / 2) from the paladin list.
const PALADIN: SpellProgressionRule = {
  className: 'paladin',
  castingType: 'half',
  spellcastingAbility: 'charisma',
  learningStyle: 'prepared',
  cantripsKnown: [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  // Levels 1-10
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  // Levels 11-20
  ],
  spellsKnown: null,
  preparedFormula: true,
  spellbookLearning: false,
  canSwapOnLevelUp: false,
  maxSwapsPerLevel: 0,
  maxSpellLevel: [
    0, 1, 1, 1, 2, 2, 2, 2, 3, 3,  // Levels 1-10
    3, 3, 4, 4, 4, 4, 5, 5, 5, 5,  // Levels 11-20
  ],
  notes: 'No spellcasting at level 1. Prepared count = CHA mod + floor(paladin level / 2) (minimum 1). Oath spells are always prepared.',
};

// RANGER — Half caster, known spells, WIS
// PHB p.91: Gains spellcasting at level 2 with 2 known spells. Can swap 1 per level.
const RANGER: SpellProgressionRule = {
  className: 'ranger',
  castingType: 'half',
  spellcastingAbility: 'wisdom',
  learningStyle: 'known',
  cantripsKnown: [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  // Levels 1-10
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,  // Levels 11-20
  ],
  spellsKnown: [
    0, 2, 3, 3, 4, 4, 5, 5, 6, 6,  // Levels 1-10
    7, 7, 8, 8, 9, 9, 10, 10, 11, 11,  // Levels 11-20
  ],
  preparedFormula: false,
  spellbookLearning: false,
  canSwapOnLevelUp: true,
  maxSwapsPerLevel: 1,
  maxSpellLevel: [
    0, 1, 1, 1, 2, 2, 2, 2, 3, 3,  // Levels 1-10
    3, 3, 4, 4, 4, 4, 5, 5, 5, 5,  // Levels 11-20
  ],
  notes: 'No spellcasting at level 1. Gains spellcasting at level 2.',
};

// SORCERER — Full caster, known spells, CHA
// PHB p.100: Starts with 2 spells known at level 1. Can swap 1 per level.
const SORCERER: SpellProgressionRule = {
  className: 'sorcerer',
  castingType: 'full',
  spellcastingAbility: 'charisma',
  learningStyle: 'known',
  cantripsKnown: [
    4, 4, 4, 5, 5, 5, 5, 5, 5, 6,  // Levels 1-10
    6, 6, 6, 6, 6, 6, 6, 6, 6, 6,  // Levels 11-20
  ],
  spellsKnown: [
    2, 3, 4, 5, 6, 7, 8, 9, 10, 11,  // Levels 1-10
    12, 12, 13, 13, 14, 14, 15, 15, 15, 15,  // Levels 11-20
  ],
  preparedFormula: false,
  spellbookLearning: false,
  canSwapOnLevelUp: true,
  maxSwapsPerLevel: 1,
  maxSpellLevel: [
    1, 1, 2, 2, 3, 3, 4, 4, 5, 5,  // Levels 1-10
    6, 6, 7, 7, 8, 8, 9, 9, 9, 9,  // Levels 11-20
  ],
};

// WARLOCK — Pact caster, known spells, CHA
// PHB p.106-107: Starts with 2 spells known. Pact slots recharge on short rest.
// All warlock spell slots are cast at the same (highest available) level.
const WARLOCK: SpellProgressionRule = {
  className: 'warlock',
  castingType: 'pact',
  spellcastingAbility: 'charisma',
  learningStyle: 'known',
  cantripsKnown: [
    2, 2, 2, 3, 3, 3, 3, 3, 3, 4,  // Levels 1-10
    4, 4, 4, 4, 4, 4, 4, 4, 4, 4,  // Levels 11-20
  ],
  spellsKnown: [
    2, 3, 4, 5, 6, 7, 8, 9, 10, 10,  // Levels 1-10
    11, 11, 12, 12, 13, 13, 14, 14, 15, 15,  // Levels 11-20
  ],
  preparedFormula: false,
  spellbookLearning: false,
  canSwapOnLevelUp: true,
  maxSwapsPerLevel: 1,
  maxSpellLevel: [
    1, 1, 2, 2, 3, 3, 4, 4, 5, 5,  // Levels 1-10  (pact slot level caps at 5th)
    5, 5, 5, 5, 5, 5, 5, 5, 5, 5,  // Levels 11-20 (Mystic Arcanum for 6-9 are separate)
  ],
  notes: 'Pact slots cap at 5th level. Mystic Arcanum (levels 11, 13, 15, 17) grant one casting each of 6th, 7th, 8th, 9th level spells respectively — these are not spell slots.',
};

// WIZARD — Full caster, spellbook, INT
// PHB p.114: Starts with 6 1st-level spells in spellbook. Gains 2 per level.
// Prepares INT mod + wizard level spells from spellbook each day.
const WIZARD: SpellProgressionRule = {
  className: 'wizard',
  castingType: 'full',
  spellcastingAbility: 'intelligence',
  learningStyle: 'spellbook',
  cantripsKnown: [
    3, 3, 3, 4, 4, 4, 4, 4, 4, 5,  // Levels 1-10
    5, 5, 5, 5, 5, 5, 5, 5, 5, 5,  // Levels 11-20
  ],
  spellsKnown: null,
  preparedFormula: true,
  spellbookLearning: true,
  canSwapOnLevelUp: false,
  maxSwapsPerLevel: 0,
  maxSpellLevel: [
    1, 1, 2, 2, 3, 3, 4, 4, 5, 5,  // Levels 1-10
    6, 6, 7, 7, 8, 8, 9, 9, 9, 9,  // Levels 11-20
  ],
  notes: 'Starts with 6 spells in spellbook at level 1. Gains 2 free spells per level-up (must be of a level for which the wizard has spell slots). Can also copy found spells into the spellbook. Prepared count = INT mod + wizard level (minimum 1).',
};

// ARTIFICER — Half caster (unique: starts at level 1), prepared, INT
// Tasha's Cauldron p.9-10: Prepares INT mod + floor(artificer level / 2) spells.
// Unique among half casters: gains spell slots at level 1 (cantrips + 1st-level spells).
const ARTIFICER: SpellProgressionRule = {
  className: 'artificer',
  castingType: 'half',
  spellcastingAbility: 'intelligence',
  learningStyle: 'prepared',
  cantripsKnown: [
    2, 2, 2, 2, 2, 2, 2, 2, 2, 3,  // Levels 1-10
    3, 3, 3, 4, 4, 4, 4, 4, 4, 4,  // Levels 11-20
  ],
  spellsKnown: null,
  preparedFormula: true,
  spellbookLearning: false,
  canSwapOnLevelUp: false,
  maxSwapsPerLevel: 0,
  maxSpellLevel: [
    1, 1, 1, 1, 2, 2, 2, 2, 3, 3,  // Levels 1-10
    3, 3, 4, 4, 4, 4, 5, 5, 5, 5,  // Levels 11-20
  ],
  notes: 'Unique half caster: gains spellcasting at level 1 (not level 2). Prepared count = INT mod + floor(artificer level / 2) (minimum 1). Uses tools as a spellcasting focus.',
};

// ELDRITCH KNIGHT (Fighter subclass) — 1/3 caster, known spells, INT
// PHB p.75: Gains spellcasting at level 3. Restricted to abjuration and evocation except
// at levels 3, 8, 14, 20 where any wizard school is available.
const ELDRITCH_KNIGHT: SpellProgressionRule = {
  className: 'eldritch_knight',
  castingType: 'third',
  spellcastingAbility: 'intelligence',
  learningStyle: 'known',
  cantripsKnown: [
    0, 0, 2, 2, 2, 2, 2, 2, 2, 3,  // Levels 1-10
    3, 3, 3, 3, 3, 3, 3, 3, 3, 3,  // Levels 11-20
  ],
  spellsKnown: [
    0, 0, 3, 4, 4, 4, 5, 6, 6, 7,  // Levels 1-10
    8, 8, 9, 10, 10, 11, 11, 11, 12, 13,  // Levels 11-20
  ],
  preparedFormula: false,
  spellbookLearning: false,
  canSwapOnLevelUp: true,
  maxSwapsPerLevel: 1,
  maxSpellLevel: [
    0, 0, 1, 1, 1, 1, 2, 2, 2, 2,  // Levels 1-10
    2, 2, 3, 3, 3, 3, 3, 3, 4, 4,  // Levels 11-20
  ],
  schoolRestrictions: {
    primary: ['Abjuration', 'Evocation'],
    freePickLevels: [3, 8, 14, 20],  // At these levels, the new spell can be from any wizard school
  },
  notes: 'Fighter subclass. Gains spellcasting at level 3. Most spells must be from the Abjuration or Evocation schools (wizard list). At levels 3, 8, 14, and 20, the newly learned spell can be from any school on the wizard list.',
};

// ARCANE TRICKSTER (Rogue subclass) — 1/3 caster, known spells, INT
// PHB p.98: Gains spellcasting at level 3. Restricted to enchantment and illusion except
// at levels 3, 8, 14, 20 where any wizard school is available.
const ARCANE_TRICKSTER: SpellProgressionRule = {
  className: 'arcane_trickster',
  castingType: 'third',
  spellcastingAbility: 'intelligence',
  learningStyle: 'known',
  cantripsKnown: [
    0, 0, 3, 3, 3, 3, 3, 3, 3, 4,  // Levels 1-10
    4, 4, 4, 4, 4, 4, 4, 4, 4, 4,  // Levels 11-20
  ],
  spellsKnown: [
    0, 0, 3, 4, 4, 4, 5, 6, 6, 7,  // Levels 1-10
    8, 8, 9, 10, 10, 11, 11, 11, 12, 13,  // Levels 11-20
  ],
  preparedFormula: false,
  spellbookLearning: false,
  canSwapOnLevelUp: true,
  maxSwapsPerLevel: 1,
  maxSpellLevel: [
    0, 0, 1, 1, 1, 1, 2, 2, 2, 2,  // Levels 1-10
    2, 2, 3, 3, 3, 3, 3, 3, 4, 4,  // Levels 11-20
  ],
  schoolRestrictions: {
    primary: ['Enchantment', 'Illusion'],
    freePickLevels: [3, 8, 14, 20],
  },
  notes: 'Rogue subclass. Gains spellcasting at level 3. Most spells must be from the Enchantment or Illusion schools (wizard list). At levels 3, 8, 14, and 20, the newly learned spell can be from any school on the wizard list. Mage Hand is a mandatory cantrip (not counted in the 3 cantrips).',
};

// Non-caster classes
const NON_CASTER: SpellProgressionRule = {
  className: 'none',
  castingType: 'none',
  spellcastingAbility: 'none',
  learningStyle: 'none',
  cantripsKnown: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  spellsKnown: null,
  preparedFormula: false,
  spellbookLearning: false,
  canSwapOnLevelUp: false,
  maxSwapsPerLevel: 0,
  maxSpellLevel: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
};

// ─── Lookup Table ────────────────────────────────────────────────────────────

const SPELL_PROGRESSION: Record<string, SpellProgressionRule> = {
  bard: BARD,
  cleric: CLERIC,
  druid: DRUID,
  paladin: PALADIN,
  ranger: RANGER,
  sorcerer: SORCERER,
  warlock: WARLOCK,
  wizard: WIZARD,
  artificer: ARTIFICER,
  eldritch_knight: ELDRITCH_KNIGHT,
  arcane_trickster: ARCANE_TRICKSTER,
  // Non-casters
  barbarian: { ...NON_CASTER, className: 'barbarian' },
  fighter: { ...NON_CASTER, className: 'fighter' },
  monk: { ...NON_CASTER, className: 'monk' },
  rogue: { ...NON_CASTER, className: 'rogue' },
};

// ─── Helper Functions ────────────────────────────────────────────────────────

/**
 * Get the full spell progression rules for a class (or subclass like eldritch_knight).
 * Falls back to non-caster if not found.
 */
export function getSpellProgressionForClass(className: string): SpellProgressionRule {
  return SPELL_PROGRESSION[className.toLowerCase()] ?? { ...NON_CASTER, className };
}

/**
 * Calculate what spells a character gains on level-up.
 *
 * @param className - The class (or subclass) name
 * @param newLevel - The level the character just reached (1-20)
 * @param abilityModifier - The relevant spellcasting ability modifier (INT/WIS/CHA)
 * @returns Details about spell learning for this level-up
 */
export function getNewSpellsOnLevelUp(
  className: string,
  newLevel: number,
  abilityModifier: number
): LevelUpSpellInfo {
  const rule = getSpellProgressionForClass(className);
  const idx = newLevel - 1; // Convert to 0-based index
  const prevIdx = newLevel >= 2 ? newLevel - 2 : -1;

  // Non-casters get nothing
  if (rule.castingType === 'none') {
    return { canLearnNew: false, newSpellCount: 0, canSwap: false, maxNewSpellLevel: 0, newCantrips: 0 };
  }

  const maxNewSpellLevel = rule.maxSpellLevel[idx];

  // No spellcasting yet (e.g., paladin/ranger level 1, or fighter/rogue before level 3)
  if (maxNewSpellLevel === 0) {
    return { canLearnNew: false, newSpellCount: 0, canSwap: false, maxNewSpellLevel: 0, newCantrips: 0 };
  }

  // Calculate new cantrips gained at this level
  const currentCantrips = rule.cantripsKnown[idx];
  const prevCantrips = prevIdx >= 0 ? rule.cantripsKnown[prevIdx] : 0;
  const newCantrips = currentCantrips - prevCantrips;

  // --- Known casters (bard, ranger, sorcerer, warlock, eldritch knight, arcane trickster) ---
  if (rule.learningStyle === 'known' && rule.spellsKnown) {
    const currentKnown = rule.spellsKnown[idx];
    const prevKnown = prevIdx >= 0 ? rule.spellsKnown[prevIdx] : 0;
    const newSpellCount = currentKnown - prevKnown;

    return {
      canLearnNew: newSpellCount > 0,
      newSpellCount: Math.max(0, newSpellCount),
      canSwap: rule.canSwapOnLevelUp && newLevel >= 2,
      maxNewSpellLevel,
      newCantrips,
    };
  }

  // --- Spellbook casters (wizard) ---
  if (rule.learningStyle === 'spellbook') {
    // Level 1: wizard starts with 6 spells in spellbook (handled by character creation)
    // Every subsequent level: gains 2 free spells
    const spellbookAdditions = newLevel === 1 ? 6 : 2;

    // Prepared count = wizard level + INT mod (minimum 1)
    const preparedCount = Math.max(1, newLevel + abilityModifier);

    return {
      canLearnNew: true,
      newSpellCount: spellbookAdditions,
      canSwap: false, // Wizards don't swap; they prepare from spellbook daily
      maxNewSpellLevel,
      preparedCount,
      spellbookAdditions,
      newCantrips,
    };
  }

  // --- Prepared casters (cleric, druid, paladin, artificer) ---
  if (rule.learningStyle === 'prepared') {
    let preparedCount: number;

    const cls = className.toLowerCase();
    if (cls === 'paladin') {
      // Paladin: CHA mod + floor(paladin level / 2), minimum 1
      preparedCount = Math.max(1, abilityModifier + Math.floor(newLevel / 2));
    } else if (cls === 'artificer') {
      // Artificer: INT mod + floor(artificer level / 2), minimum 1
      preparedCount = Math.max(1, abilityModifier + Math.floor(newLevel / 2));
    } else {
      // Cleric, Druid: ability mod + class level, minimum 1
      preparedCount = Math.max(1, abilityModifier + newLevel);
    }

    // Prepared casters always "can learn new" because they pick from the full class list
    // The actual number they can prepare changes with level
    return {
      canLearnNew: true,
      newSpellCount: 0, // They don't learn fixed spells; they prepare from the full list
      canSwap: false, // They re-prepare daily; there's nothing to "swap"
      maxNewSpellLevel,
      preparedCount,
      newCantrips,
    };
  }

  // Fallback
  return { canLearnNew: false, newSpellCount: 0, canSwap: false, maxNewSpellLevel: 0, newCantrips: 0 };
}

/**
 * Returns which spell levels (1-9) are available to a class at a given character level.
 * Does not include cantrips (level 0). Returns an empty array for non-casters.
 *
 * @param className - The class or subclass name
 * @param level - Character level (1-20)
 * @returns Array of spell level numbers the class can access (e.g., [1, 2, 3])
 */
export function getSpellsAvailableAtLevel(className: string, level: number): number[] {
  const rule = getSpellProgressionForClass(className);
  const idx = level - 1;

  if (rule.castingType === 'none' || idx < 0 || idx >= 20) {
    return [];
  }

  const maxLevel = rule.maxSpellLevel[idx];
  if (maxLevel === 0) return [];

  const levels: number[] = [];
  for (let i = 1; i <= maxLevel; i++) {
    levels.push(i);
  }
  return levels;
}

/**
 * Get the total number of spells in a wizard's spellbook at a given level.
 * Level 1 = 6 spells, each subsequent level adds 2.
 * This does not include spells copied from scrolls/other sources.
 */
export function getWizardSpellbookSize(level: number): number {
  if (level < 1) return 0;
  // 6 at level 1, +2 for each level after that
  return 6 + (level - 1) * 2;
}

/**
 * Check if a class has spellcasting ability at a given level.
 * Returns false for non-casters and for half/third casters before their spellcasting level.
 */
export function hasSpellcastingAtLevel(className: string, level: number): boolean {
  const rule = getSpellProgressionForClass(className);
  if (rule.castingType === 'none') return false;
  const idx = level - 1;
  if (idx < 0 || idx >= 20) return false;
  return rule.maxSpellLevel[idx] > 0;
}

/**
 * For warlock Mystic Arcanum: returns which arcanum spell levels are gained at this level.
 * Warlocks gain one Mystic Arcanum spell at levels 11 (6th), 13 (7th), 15 (8th), 17 (9th).
 */
export function getWarlockMysticArcanum(level: number): number | null {
  switch (level) {
    case 11: return 6;
    case 13: return 7;
    case 15: return 8;
    case 17: return 9;
    default: return null;
  }
}

/**
 * Get the pact magic spell slot level for a warlock at a given level.
 * All warlock pact slots are at the same level.
 */
export function getWarlockPactSlotLevel(level: number): number {
  if (level < 1) return 0;
  if (level <= 2) return 1;
  if (level <= 4) return 2;
  if (level <= 6) return 3;
  if (level <= 8) return 4;
  return 5; // Levels 9-20: all pact slots are 5th level
}

// ─── Exports ─────────────────────────────────────────────────────────────────

export { SPELL_PROGRESSION };
