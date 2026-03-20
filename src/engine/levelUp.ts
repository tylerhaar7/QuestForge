// Level-Up Choice Resolver
// Determines what choices a player gets at each level: ASI/feats, subclass,
// spells, and class features. No mechanical enforcement — just surfaces the options.

import type { ClassName } from '@/types/game';
import { getNewSpellsOnLevelUp } from '@/data/spellProgression';

// ─── ASI Levels ──────────────────────────────────────────────────────────────

/** ASI levels per class — most get [4,8,12,16,19], Fighter and Rogue get extras */
export const ASI_LEVELS: Record<ClassName, number[]> = {
  barbarian:  [4, 8, 12, 16, 19],
  bard:       [4, 8, 12, 16, 19],
  cleric:     [4, 8, 12, 16, 19],
  druid:      [4, 8, 12, 16, 19],
  fighter:    [4, 6, 8, 12, 14, 16, 19],
  monk:       [4, 8, 12, 16, 19],
  paladin:    [4, 8, 12, 16, 19],
  ranger:     [4, 8, 12, 16, 19],
  rogue:      [4, 8, 10, 12, 16, 19],
  sorcerer:   [4, 8, 12, 16, 19],
  warlock:    [4, 8, 12, 16, 19],
  wizard:     [4, 8, 12, 16, 19],
  artificer:  [4, 8, 12, 16, 19],
};

// ─── Subclass Selection Level ────────────────────────────────────────────────

/** Which level each class picks their subclass */
export const SUBCLASS_SELECTION_LEVEL: Record<ClassName, number> = {
  barbarian:  3,
  bard:       3,
  cleric:     1,
  druid:      2,
  fighter:    3,
  monk:       3,
  paladin:    3,
  ranger:     3,
  rogue:      3,
  sorcerer:   1,
  warlock:    1,
  wizard:     2,
  artificer:  3,
};

// ─── Class Features by Level ─────────────────────────────────────────────────
// Key features only — for display in the level-up UI. Not exhaustive.

const CLASS_FEATURES: Record<ClassName, Record<number, string[]>> = {
  barbarian: {
    1:  ['Rage', 'Unarmored Defense'],
    2:  ['Reckless Attack', 'Danger Sense'],
    5:  ['Extra Attack', 'Fast Movement'],
    7:  ['Feral Instinct'],
    9:  ['Brutal Critical (1 die)'],
    11: ['Relentless Rage'],
    13: ['Brutal Critical (2 dice)'],
    15: ['Persistent Rage'],
    17: ['Brutal Critical (3 dice)'],
    18: ['Indomitable Might'],
    20: ['Primal Champion'],
  },
  bard: {
    1:  ['Bardic Inspiration', 'Spellcasting'],
    2:  ['Jack of All Trades', 'Song of Rest'],
    3:  ['Expertise'],
    5:  ['Font of Inspiration'],
    6:  ['Countercharm'],
    10: ['Magical Secrets'],
    14: ['Magical Secrets'],
    18: ['Magical Secrets'],
    20: ['Superior Inspiration'],
  },
  cleric: {
    1:  ['Spellcasting', 'Divine Domain'],
    2:  ['Channel Divinity'],
    5:  ['Destroy Undead (CR 1/2)'],
    6:  ['Channel Divinity (2 uses)'],
    8:  ['Destroy Undead (CR 1)'],
    10: ['Divine Intervention'],
    11: ['Destroy Undead (CR 2)'],
    14: ['Destroy Undead (CR 3)'],
    17: ['Destroy Undead (CR 4)'],
    18: ['Channel Divinity (3 uses)'],
    20: ['Divine Intervention (auto)'],
  },
  druid: {
    1:  ['Spellcasting', 'Druidic'],
    2:  ['Wild Shape', 'Druid Circle'],
    4:  ['Wild Shape Improvement'],
    8:  ['Wild Shape Improvement'],
    18: ['Timeless Body', 'Beast Spells'],
    20: ['Archdruid'],
  },
  fighter: {
    1:  ['Fighting Style', 'Second Wind'],
    2:  ['Action Surge'],
    5:  ['Extra Attack'],
    9:  ['Indomitable (1 use)'],
    11: ['Extra Attack (2)'],
    13: ['Indomitable (2 uses)'],
    17: ['Action Surge (2 uses)', 'Indomitable (3 uses)'],
    20: ['Extra Attack (3)'],
  },
  monk: {
    1:  ['Unarmored Defense', 'Martial Arts'],
    2:  ['Ki', 'Unarmored Movement'],
    3:  ['Deflect Missiles'],
    4:  ['Slow Fall'],
    5:  ['Extra Attack', 'Stunning Strike'],
    6:  ['Ki-Empowered Strikes'],
    7:  ['Evasion', 'Stillness of Mind'],
    10: ['Purity of Body'],
    13: ['Tongue of the Sun and Moon'],
    14: ['Diamond Soul'],
    15: ['Timeless Body'],
    18: ['Empty Body'],
    20: ['Perfect Self'],
  },
  paladin: {
    1:  ['Divine Sense', 'Lay on Hands'],
    2:  ['Fighting Style', 'Spellcasting', 'Divine Smite'],
    3:  ['Divine Health'],
    5:  ['Extra Attack'],
    6:  ['Aura of Protection'],
    10: ['Aura of Courage'],
    11: ['Improved Divine Smite'],
    14: ['Cleansing Touch'],
    18: ['Aura Improvements'],
  },
  ranger: {
    1:  ['Favored Enemy', 'Natural Explorer'],
    2:  ['Fighting Style', 'Spellcasting'],
    3:  ['Primeval Awareness'],
    5:  ['Extra Attack'],
    8:  ["Land's Stride"],
    10: ['Hide in Plain Sight'],
    14: ['Vanish'],
    18: ['Feral Senses'],
    20: ['Foe Slayer'],
  },
  rogue: {
    1:  ['Sneak Attack (1d6)', 'Expertise', "Thieves' Cant"],
    2:  ['Cunning Action'],
    3:  ['Sneak Attack (2d6)'],
    5:  ['Uncanny Dodge', 'Sneak Attack (3d6)'],
    7:  ['Evasion', 'Sneak Attack (4d6)'],
    9:  ['Sneak Attack (5d6)'],
    11: ['Reliable Talent', 'Sneak Attack (6d6)'],
    13: ['Sneak Attack (7d6)'],
    14: ['Blindsense'],
    15: ['Slippery Mind', 'Sneak Attack (8d6)'],
    17: ['Sneak Attack (9d6)'],
    18: ['Elusive'],
    19: ['Sneak Attack (10d6)'],
    20: ['Stroke of Luck'],
  },
  sorcerer: {
    1:  ['Spellcasting', 'Sorcerous Origin'],
    2:  ['Font of Magic'],
    3:  ['Metamagic'],
    10: ['Metamagic Option'],
    17: ['Metamagic Option'],
    20: ['Sorcerous Restoration'],
  },
  warlock: {
    1:  ['Otherworldly Patron', 'Pact Magic'],
    2:  ['Eldritch Invocations'],
    3:  ['Pact Boon'],
    11: ['Mystic Arcanum (6th)'],
    13: ['Mystic Arcanum (7th)'],
    15: ['Mystic Arcanum (8th)'],
    17: ['Mystic Arcanum (9th)'],
    20: ['Eldritch Master'],
  },
  wizard: {
    1:  ['Spellcasting', 'Arcane Recovery'],
    2:  ['Arcane Tradition'],
    18: ['Spell Mastery'],
    20: ['Signature Spells'],
  },
  artificer: {
    1:  ['Magical Tinkering', 'Spellcasting'],
    2:  ['Infuse Item'],
    3:  ['The Right Tool for the Job'],
    6:  ['Tool Expertise'],
    7:  ['Flash of Genius'],
    10: ['Magic Item Adept'],
    11: ['Spell-Storing Item'],
    14: ['Magic Item Savant'],
    18: ['Magic Item Master'],
    20: ['Soul of Artifice'],
  },
};

// ─── Types ───────────────────────────────────────────────────────────────────

export interface LevelUpChoices {
  /** Can the player pick ASI (+2 to one / +1 to two) or a feat? */
  asiAvailable: boolean;
  /** Is this the level where subclass is chosen? */
  subclassAvailable: boolean;
  /** Spell learning info (null for non-casters or levels with no new spells) */
  newSpells: {
    canLearnNew: boolean;
    newSpellCount: number;
    canSwap: boolean;
    maxNewSpellLevel: number;
    preparedCount?: number;
  } | null;
  /** Class features gained at this level (names only, for display) */
  newFeatures: string[];
}

// ─── Main Function ───────────────────────────────────────────────────────────

/**
 * Determine all choices available at a given level for a given class.
 * abilityMod is the spellcasting ability modifier (for prepared caster formula).
 */
export function getLevelUpChoices(
  className: ClassName,
  newLevel: number,
  abilityMod: number,
): LevelUpChoices {
  // ASI / Feat availability
  const asiAvailable = ASI_LEVELS[className].includes(newLevel);

  // Subclass selection
  const subclassAvailable = SUBCLASS_SELECTION_LEVEL[className] === newLevel;

  // Spell learning
  const spellInfo = getNewSpellsOnLevelUp(className, newLevel, abilityMod);
  let newSpells: LevelUpChoices['newSpells'] = null;

  if (spellInfo.maxNewSpellLevel > 0 || spellInfo.canLearnNew) {
    newSpells = {
      canLearnNew: spellInfo.canLearnNew,
      newSpellCount: spellInfo.newSpellCount,
      canSwap: spellInfo.canSwap,
      maxNewSpellLevel: spellInfo.maxNewSpellLevel,
    };
    if (spellInfo.preparedCount !== undefined) {
      newSpells.preparedCount = spellInfo.preparedCount;
    }
  }

  // Class features at this level
  const featureMap = CLASS_FEATURES[className] ?? {};
  const newFeatures = featureMap[newLevel] ?? [];

  return {
    asiAvailable,
    subclassAvailable,
    newSpells,
    newFeatures,
  };
}
