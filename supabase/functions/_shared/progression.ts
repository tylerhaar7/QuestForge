// D&D 5e XP progression, leveling, and reward tables
// Server-side engine — no AI involvement

// Cumulative XP required to reach each level (index = level)
export const XP_THRESHOLDS: number[] = [
  0,      // Level 0 (unused)
  0,      // Level 1
  300,    // Level 2
  900,    // Level 3
  2700,   // Level 4
  6500,   // Level 5
  14000,  // Level 6
  23000,  // Level 7
  34000,  // Level 8
  48000,  // Level 9
  64000,  // Level 10
  85000,  // Level 11
  100000, // Level 12
  120000, // Level 13
  140000, // Level 14
  165000, // Level 15
  195000, // Level 16
  225000, // Level 17
  265000, // Level 18
  305000, // Level 19
  355000, // Level 20
];

// XP awarded per Challenge Rating (D&D 5e standard)
export const CR_XP_REWARDS: Record<string, number> = {
  '0': 10,
  '1/8': 25,
  '1/4': 50,
  '1/2': 100,
  '1': 200,
  '2': 450,
  '3': 700,
  '4': 1100,
  '5': 1800,
  '6': 2300,
  '7': 2900,
  '8': 3900,
  '9': 5000,
  '10': 5900,
  '11': 7200,
  '12': 8400,
  '13': 10000,
  '14': 11500,
  '15': 13000,
  '16': 15000,
  '17': 18000,
  '18': 20000,
  '19': 22000,
  '20': 25000,
};

// Hit die by class (mirrors src/engine/character.ts)
const CLASS_HIT_DIE: Record<string, number> = {
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
};

// Full caster spell slot progression (wizard, sorcerer, bard, cleric, druid)
// Index = level, value = array of slots per spell level [1st, 2nd, 3rd, ...]
const FULL_CASTER_SLOTS: number[][] = [
  [],                          // Level 0
  [2],                         // Level 1
  [3],                         // Level 2
  [4, 2],                     // Level 3
  [4, 3],                     // Level 4
  [4, 3, 2],                  // Level 5
  [4, 3, 3],                  // Level 6
  [4, 3, 3, 1],               // Level 7
  [4, 3, 3, 2],               // Level 8
  [4, 3, 3, 3, 1],            // Level 9
  [4, 3, 3, 3, 2],            // Level 10
  [4, 3, 3, 3, 2, 1],         // Level 11
  [4, 3, 3, 3, 2, 1],         // Level 12
  [4, 3, 3, 3, 2, 1, 1],      // Level 13
  [4, 3, 3, 3, 2, 1, 1],      // Level 14
  [4, 3, 3, 3, 2, 1, 1, 1],   // Level 15
  [4, 3, 3, 3, 2, 1, 1, 1],   // Level 16
  [4, 3, 3, 3, 2, 1, 1, 1, 1], // Level 17
  [4, 3, 3, 3, 3, 1, 1, 1, 1], // Level 18
  [4, 3, 3, 3, 3, 2, 1, 1, 1], // Level 19
  [4, 3, 3, 3, 3, 2, 2, 1, 1], // Level 20
];

// Half caster spell slot progression (paladin, ranger)
const HALF_CASTER_SLOTS: number[][] = [
  [],        // Level 0
  [],        // Level 1
  [2],       // Level 2
  [3],       // Level 3
  [3],       // Level 4
  [4, 2],    // Level 5
  [4, 2],    // Level 6
  [4, 3],    // Level 7
  [4, 3],    // Level 8
  [4, 3, 2], // Level 9
  [4, 3, 2], // Level 10
  [4, 3, 3], // Level 11
  [4, 3, 3], // Level 12
  [4, 3, 3, 1], // Level 13
  [4, 3, 3, 1], // Level 14
  [4, 3, 3, 2], // Level 15
  [4, 3, 3, 2], // Level 16
  [4, 3, 3, 3, 1], // Level 17
  [4, 3, 3, 3, 1], // Level 18
  [4, 3, 3, 3, 2], // Level 19
  [4, 3, 3, 3, 2], // Level 20
];

// Warlock pact magic slots (unique progression)
const WARLOCK_SLOTS: number[][] = [
  [],    // Level 0
  [1],   // Level 1 — 1 slot, 1st level
  [2],   // Level 2 — 2 slots, 1st level
  [2],   // Level 3 — 2 slots, 2nd level
  [2],   // Level 4
  [2],   // Level 5 — 2 slots, 3rd level
  [2],   // Level 6
  [2],   // Level 7 — 2 slots, 4th level
  [2],   // Level 8
  [2],   // Level 9 — 2 slots, 5th level
  [2],   // Level 10
  [3],   // Level 11 — 3 slots, 5th level
  [3],   // Level 12
  [3],   // Level 13
  [3],   // Level 14
  [3],   // Level 15
  [3],   // Level 16
  [4],   // Level 17 — 4 slots, 5th level
  [4],   // Level 18
  [4],   // Level 19
  [4],   // Level 20
];

const FULL_CASTERS = ['wizard', 'sorcerer', 'bard', 'cleric', 'druid'];
const HALF_CASTERS = ['paladin', 'ranger'];

function getSpellSlots(className: string, level: number): number[] | null {
  const cls = className.toLowerCase();
  if (cls === 'warlock') return WARLOCK_SLOTS[level] || null;
  if (FULL_CASTERS.includes(cls)) return FULL_CASTER_SLOTS[level] || null;
  if (HALF_CASTERS.includes(cls)) return HALF_CASTER_SLOTS[level] || null;
  // Non-casters (fighter, rogue, barbarian, monk) — no spell slots
  return null;
}

/**
 * Check if character should level up based on XP.
 * Returns the new level, or null if no level up.
 */
export function checkLevelUp(currentXP: number, currentLevel: number): number | null {
  if (currentLevel >= 20) return null;

  let newLevel = currentLevel;
  for (let lvl = currentLevel + 1; lvl <= 20; lvl++) {
    if (currentXP >= XP_THRESHOLDS[lvl]) {
      newLevel = lvl;
    } else {
      break;
    }
  }

  return newLevel > currentLevel ? newLevel : null;
}

/**
 * Get XP needed for the next level.
 */
export function xpForNextLevel(currentLevel: number): number {
  if (currentLevel >= 20) return XP_THRESHOLDS[20];
  return XP_THRESHOLDS[currentLevel + 1];
}

/**
 * Calculate stat changes when leveling up.
 */
export function getLevelUpChanges(
  className: string,
  currentLevel: number,
  newLevel: number,
  constitutionScore: number
): {
  newMaxHp: number;
  newProficiencyBonus: number;
  newMaxSpellSlots: number[] | null;
  levelDelta: number;
} {
  const hitDie = CLASS_HIT_DIE[className.toLowerCase()] || 8;
  const conMod = Math.floor((constitutionScore - 10) / 2);

  // Calculate new max HP (same formula as character.ts calculateMaxHP)
  let hp = hitDie + conMod; // Level 1
  const avgPerLevel = Math.ceil(hitDie / 2) + 1;
  for (let i = 2; i <= newLevel; i++) {
    hp += avgPerLevel + conMod;
  }
  const newMaxHp = Math.max(1, hp);

  const newProficiencyBonus = Math.ceil(newLevel / 4) + 1;
  const newMaxSpellSlots = getSpellSlots(className, newLevel);

  return {
    newMaxHp,
    newProficiencyBonus,
    newMaxSpellSlots,
    levelDelta: newLevel - currentLevel,
  };
}
