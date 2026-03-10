// Companion roster — 13 pre-built companions, one per D&D 5e class
// Plus recommended personality/stats/abilities maps for all 13 classes

import type { Companion, ClassName, CompanionAbility } from '@/types/game';

export interface CompanionTemplate {
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

// ─── Pre-built Companion Roster (13 companions, one per class) ──

export const COMPANION_ROSTER: CompanionTemplate[] = [
  // 1. Korrin — Fighter
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
  // 2. Sera — Rogue
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
  // 3. Thaelen — Druid
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
  // 4. Lyra — Bard
  {
    name: 'Lyra',
    className: 'bard',
    level: 1,
    maxHp: 9,
    ac: 13,
    portrait: '',
    color: '#e879f9',
    personality: {
      approves: ['creativity', 'kindness', 'music', 'romance', 'artistic_expression'],
      disapproves: ['cruelty', 'censorship', 'close_mindedness', 'vandalism'],
      voice: 'Warm and theatrical. Speaks with passion and flair. Sees beauty in everything.',
      backstory: 'A traveling bard who lost her troupe to bandits and seeks to rebuild through new companions.',
    },
    abilities: [
      { name: 'Bardic Inspiration', type: 'bonus', description: 'Grant 1d6 to ally\'s next roll', icon: '🎵' },
      { name: 'Vicious Mockery', type: 'spell', description: '1d4 psychic + disadvantage on next attack', icon: '🎭' },
    ],
  },
  // 5. Brother Aldric — Cleric
  {
    name: 'Brother Aldric',
    className: 'cleric',
    level: 1,
    maxHp: 9,
    ac: 16,
    portrait: '',
    color: '#f59e0b',
    personality: {
      approves: ['mercy', 'faith', 'healing', 'charity', 'protecting_weak'],
      disapproves: ['undead_creation', 'blasphemy', 'needless_violence', 'greed'],
      voice: 'Gentle but firm. Speaks with quiet conviction and often references ancient texts.',
      backstory: 'A temple healer who left his monastery when dark omens began appearing.',
    },
    abilities: [
      { name: 'Healing Word', type: 'heal', description: 'Heal 1d4+3 at range as bonus action', icon: '✨' },
      { name: 'Sacred Flame', type: 'spell', description: 'Dex save or 1d8 radiant', icon: '🔥' },
    ],
  },
  // 6. Zara — Wizard
  {
    name: 'Zara',
    className: 'wizard',
    level: 1,
    maxHp: 7,
    ac: 12,
    portrait: '',
    color: '#3b82f6',
    personality: {
      approves: ['knowledge', 'puzzles', 'research', 'experimentation', 'ancient_lore'],
      disapproves: ['ignorance', 'book_burning', 'anti_intellectualism', 'recklessness'],
      voice: 'Endlessly curious and slightly absent-minded. Gets excited about arcane discoveries.',
      backstory: 'An academy dropout who believes forbidden knowledge holds the key to saving the world.',
    },
    abilities: [
      { name: 'Magic Missile', type: 'attack', description: '3 darts of 1d4+1 force each auto-hit', icon: '⚡' },
      { name: 'Shield', type: 'reaction', description: '+5 AC until next turn', icon: '🛡️' },
    ],
  },
  // 7. Fenwick — Ranger
  {
    name: 'Fenwick',
    className: 'ranger',
    level: 1,
    maxHp: 11,
    ac: 14,
    portrait: '',
    color: '#65a30d',
    personality: {
      approves: ['nature_respect', 'tracking', 'survival', 'animal_care', 'patience'],
      disapproves: ['urban_waste', 'animal_cruelty', 'deforestation', 'carelessness'],
      voice: 'Quiet and observant. Speaks rarely but precisely. More comfortable with animals than people.',
      backstory: 'A former poacher turned protector of the wilds after a life-changing encounter with a dying forest spirit.',
    },
    abilities: [
      { name: 'Hunter\'s Mark', type: 'bonus', description: 'Extra 1d6 damage to marked target', icon: '🎯' },
      { name: 'Colossus Slayer', type: 'attack', description: 'Extra 1d8 to injured target', icon: '⚔️' },
    ],
  },
  // 8. Elara — Paladin
  {
    name: 'Elara',
    className: 'paladin',
    level: 1,
    maxHp: 12,
    ac: 16,
    portrait: '',
    color: '#dc2626',
    personality: {
      approves: ['justice', 'sacrifice', 'oath_keeping', 'protecting_innocents', 'honor'],
      disapproves: ['oath_breaking', 'tyranny', 'corruption', 'cowardice', 'lies'],
      voice: 'Noble and resolute. Speaks with unwavering conviction. Carries the weight of her oath with pride.',
      backstory: 'A knight whose order was betrayed from within, now seeking to bring the traitors to justice.',
    },
    abilities: [
      { name: 'Divine Smite', type: 'attack', description: 'Extra 2d8 radiant on hit', icon: '⚔️' },
      { name: 'Lay on Hands', type: 'heal', description: 'Heal 5 HP by touch', icon: '🤲' },
    ],
  },
  // 9. Kael — Barbarian
  {
    name: 'Kael',
    className: 'barbarian',
    level: 1,
    maxHp: 13,
    ac: 14,
    portrait: '',
    color: '#ef4444',
    personality: {
      approves: ['strength', 'direct_action', 'loyalty', 'courage', 'honesty'],
      disapproves: ['cowardice', 'manipulation', 'over_thinking', 'weakness', 'deception'],
      voice: 'Blunt and fierce. Speaks with raw emotion and acts on instinct. Respects strength but values loyalty above all.',
      backstory: 'An exile from a northern tribe, driven out after refusing to participate in a dishonorable raid against a defenseless village.',
    },
    abilities: [
      { name: 'Reckless Attack', type: 'attack', description: 'Gain advantage on attack, enemies gain advantage on you', icon: '⚔️' },
      { name: 'Rage', type: 'bonus', description: 'Resistance to physical damage, +2 melee damage for 1 minute', icon: '🔥' },
    ],
  },
  // 10. Shen — Monk
  {
    name: 'Shen',
    className: 'monk',
    level: 1,
    maxHp: 9,
    ac: 14,
    portrait: '',
    color: '#06b6d4',
    personality: {
      approves: ['discipline', 'self_improvement', 'meditation', 'restraint', 'inner_peace'],
      disapproves: ['excess', 'chaos', 'materialism', 'impatience', 'wanton_destruction'],
      voice: 'Serene and contemplative. Chooses words carefully. Finds meaning in silence and action alike. Occasionally unsettling in his calm.',
      backstory: 'A wandering ascetic who left the monastery to test his teachings against the trials of the world after a vision showed him the monastery burning.',
    },
    abilities: [
      { name: 'Flurry of Blows', type: 'attack', description: 'Two unarmed strikes as bonus action for 1 ki', icon: '👊' },
      { name: 'Patient Defense', type: 'bonus', description: 'Dodge as bonus action for 1 ki', icon: '🧘' },
    ],
  },
  // 11. Vex — Sorcerer
  {
    name: 'Vex',
    className: 'sorcerer',
    level: 1,
    maxHp: 7,
    ac: 12,
    portrait: '',
    color: '#a855f7',
    personality: {
      approves: ['magic_use', 'self_expression', 'freedom', 'boldness', 'embracing_power'],
      disapproves: ['magic_suppression', 'conformity', 'rigid_rules', 'fear_of_change', 'denial'],
      voice: 'Intense and unpredictable. Power crackles beneath the surface. Oscillates between giddy confidence and genuine fear of losing control.',
      backstory: 'Born with wild magic in their blood, cast out by a fearful village. Now learning to master the storm within before it consumes everything.',
    },
    abilities: [
      { name: 'Chaos Bolt', type: 'attack', description: '2d8+1d6 random element, can bounce on doubles', icon: '🌀' },
      { name: 'Shield', type: 'reaction', description: '+5 AC until next turn', icon: '🛡️' },
    ],
  },
  // 12. Mordecai — Warlock
  {
    name: 'Mordecai',
    className: 'warlock',
    level: 1,
    maxHp: 9,
    ac: 13,
    portrait: '',
    color: '#6366f1',
    personality: {
      approves: ['ambition', 'cunning', 'knowledge_seeking', 'pragmatic_deals', 'self_reliance'],
      disapproves: ['blind_trust', 'servitude', 'wasted_potential', 'piety', 'naivety'],
      voice: 'Cryptic and sardonic. Speaks in half-truths. Haunted by a bargain he refuses to discuss, yet wields its power without hesitation.',
      backstory: 'Bound to a mysterious patron by a desperate pact made to save someone he loved. Now walks the razor edge between power and damnation.',
    },
    abilities: [
      { name: 'Eldritch Blast', type: 'attack', description: '1d10 force ranged attack', icon: '💀' },
      { name: 'Hex', type: 'bonus', description: 'Extra 1d6 necrotic on hit + disadvantage on one ability check', icon: '🔮' },
    ],
  },
  // 13. Pip — Artificer
  {
    name: 'Pip',
    className: 'artificer',
    level: 1,
    maxHp: 9,
    ac: 14,
    portrait: '',
    color: '#f97316',
    personality: {
      approves: ['invention', 'problem_solving', 'curiosity', 'practicality', 'tinkering'],
      disapproves: ['luddism', 'wastefulness', 'anti_intellectualism', 'destroying_creations', 'rigid_tradition'],
      voice: 'Excitable and inventive. Talks fast when inspired. Sees every problem as a puzzle waiting for the right gadget. Pockets always full of spare parts.',
      backstory: 'A brilliant tinkerer expelled from the Artificers\' Guild for unauthorized experiments. Convinced their inventions can change the world — if they can keep them from exploding.',
    },
    abilities: [
      { name: 'Flash of Genius', type: 'reaction', description: 'Add INT mod to ally\'s ability check or save', icon: '💡' },
      { name: 'Infuse Item', type: 'bonus', description: 'Imbue an item with magical properties', icon: '🔧' },
    ],
  },
];

// ─── Recommended Companion Personality (all 12 classes) ─────────
// Generic class-level defaults for CUSTOM-CREATED companions.
// Pre-built roster entries above have their own unique personalities.

export const RECOMMENDED_COMPANION_PERSONALITY: Record<
  ClassName,
  { voice: string; approves: string[]; disapproves: string[]; backstory: string }
> = {
  artificer: {
    voice: 'Excitable and inventive. Talks fast when inspired. Sees every problem as a puzzle waiting for the right gadget.',
    approves: ['invention', 'problem_solving', 'curiosity', 'practicality', 'tinkering'],
    disapproves: ['luddism', 'wastefulness', 'anti_intellectualism', 'destroying_creations', 'rigid_tradition'],
    backstory: 'A restless inventor who left the workshop behind, convinced that true discovery happens in the field, not the laboratory.',
  },
  barbarian: {
    voice: 'Blunt and fierce. Speaks with raw emotion and acts on instinct. Respects strength but values loyalty above all.',
    approves: ['strength', 'direct_action', 'loyalty', 'courage', 'honesty'],
    disapproves: ['cowardice', 'manipulation', 'over_thinking', 'weakness', 'deception'],
    backstory: 'An exile from a northern tribe, driven out after refusing to participate in a dishonorable raid.',
  },
  bard: {
    voice: 'Warm and theatrical. Speaks with passion and flair. Sees beauty in everything.',
    approves: ['creativity', 'kindness', 'music', 'romance', 'artistic_expression'],
    disapproves: ['cruelty', 'censorship', 'close_mindedness', 'vandalism'],
    backstory: 'A traveling performer who collects stories from every corner of the realm, believing the right tale can change the world.',
  },
  cleric: {
    voice: 'Gentle but firm. Speaks with quiet conviction and often references ancient texts.',
    approves: ['mercy', 'faith', 'healing', 'charity', 'protecting_weak'],
    disapproves: ['undead_creation', 'blasphemy', 'needless_violence', 'greed'],
    backstory: 'A devoted healer who serves a deity of light, called to adventure by a divine vision of encroaching darkness.',
  },
  druid: {
    voice: 'Thoughtful and measured. Speaks with quiet authority. Sees patterns others miss. Occasionally cryptic.',
    approves: ['nature_protection', 'patience', 'wisdom', 'empathy', 'balance'],
    disapproves: ['destruction', 'haste', 'fire_use', 'greed', 'waste'],
    backstory: 'A guardian of the old ways whose sacred grove was defiled, now wandering in search of answers.',
  },
  fighter: {
    voice: 'Steadfast and earnest. Speaks plainly. Believes in doing the right thing even when it costs. Occasional dry humor.',
    approves: ['honor', 'protection', 'honesty', 'bravery', 'defending_innocents'],
    disapproves: ['deception', 'cowardice', 'harming_innocents', 'betrayal', 'cruelty'],
    backstory: 'A veteran soldier seeking purpose beyond the battlefield, haunted by the cost of past wars.',
  },
  monk: {
    voice: 'Serene and contemplative. Chooses words carefully. Finds meaning in silence and action alike.',
    approves: ['discipline', 'self_improvement', 'meditation', 'restraint', 'inner_peace'],
    disapproves: ['excess', 'chaos', 'materialism', 'impatience', 'wanton_destruction'],
    backstory: 'A wandering ascetic who left the monastery to test teachings against the trials of the real world.',
  },
  paladin: {
    voice: 'Noble and resolute. Speaks with unwavering conviction. Carries the weight of duty with pride.',
    approves: ['justice', 'sacrifice', 'oath_keeping', 'protecting_innocents', 'honor'],
    disapproves: ['oath_breaking', 'tyranny', 'corruption', 'cowardice', 'lies'],
    backstory: 'A sworn knight whose faith was shaken by injustice, now seeking to forge a new path of righteousness.',
  },
  ranger: {
    voice: 'Quiet and observant. Speaks rarely but precisely. More comfortable with animals than people.',
    approves: ['nature_respect', 'tracking', 'survival', 'animal_care', 'patience'],
    disapproves: ['urban_waste', 'animal_cruelty', 'deforestation', 'carelessness'],
    backstory: 'A solitary warden of the wilds who follows ancient trails and guards borders most have forgotten.',
  },
  rogue: {
    voice: 'Sharp-tongued and quick. Uses humor to deflect. Fiercely loyal once trust is earned. Hides vulnerability behind sarcasm.',
    approves: ['cleverness', 'loyalty', 'street_smarts', 'pragmatism', 'wit'],
    disapproves: ['naivety', 'blind_authority', 'unnecessary_cruelty', 'stupidity', 'self_righteousness'],
    backstory: 'A survivor of the back alleys who learned that the world rewards those who stay sharp and keep moving.',
  },
  sorcerer: {
    voice: 'Intense and unpredictable. Power crackles beneath the surface. Oscillates between confidence and fear of losing control.',
    approves: ['magic_use', 'self_expression', 'freedom', 'boldness', 'embracing_power'],
    disapproves: ['magic_suppression', 'conformity', 'rigid_rules', 'fear_of_change', 'denial'],
    backstory: 'Born with wild magic in their blood, cast out by a fearful village, now learning to master the storm within.',
  },
  warlock: {
    voice: 'Cryptic and sardonic. Speaks in half-truths. Haunted by the bargain but wields its power without hesitation.',
    approves: ['ambition', 'cunning', 'knowledge_seeking', 'pragmatic_deals', 'self_reliance'],
    disapproves: ['blind_trust', 'servitude', 'wasted_potential', 'piety', 'naivety'],
    backstory: 'Bound to a mysterious patron by a desperate pact, now walking the razor edge between power and damnation.',
  },
  wizard: {
    voice: 'Endlessly curious and slightly absent-minded. Gets excited about arcane discoveries.',
    approves: ['knowledge', 'puzzles', 'research', 'experimentation', 'ancient_lore'],
    disapproves: ['ignorance', 'book_burning', 'anti_intellectualism', 'recklessness'],
    backstory: 'A scholar who left the academy to seek knowledge that no library contains, convinced that truth lies in the field.',
  },
};

// ─── Default Stats per Class (Level 1, 12 CON assumed) ──────────

export const COMPANION_DEFAULT_STATS: Record<ClassName, { maxHp: number; ac: number }> = {
  artificer: { maxHp: 9,  ac: 14 },   // d8+1, scale mail
  barbarian: { maxHp: 13, ac: 14 },   // d12+1, unarmored + shield
  bard:      { maxHp: 9,  ac: 13 },   // d8+1, leather + dex
  cleric:    { maxHp: 9,  ac: 16 },   // d8+1, chain mail + shield
  druid:     { maxHp: 9,  ac: 13 },   // d8+1, hide
  fighter:   { maxHp: 11, ac: 16 },   // d10+1, chain mail
  monk:      { maxHp: 9,  ac: 14 },   // d8+1, unarmored
  paladin:   { maxHp: 11, ac: 16 },   // d10+1, chain mail
  ranger:    { maxHp: 11, ac: 14 },   // d10+1, scale mail
  rogue:     { maxHp: 9,  ac: 14 },   // d8+1, leather + dex
  sorcerer:  { maxHp: 7,  ac: 12 },   // d6+1, dex
  warlock:   { maxHp: 9,  ac: 13 },   // d8+1, leather
  wizard:    { maxHp: 7,  ac: 12 },   // d6+1, dex
};

// ─── Default Abilities per Class (2 signature abilities) ────────

export const COMPANION_DEFAULT_ABILITIES: Record<ClassName, CompanionAbility[]> = {
  artificer: [
    { name: 'Flash of Genius', type: 'reaction', description: 'Add INT mod to ally\'s ability check or save', icon: '💡' },
    { name: 'Infuse Item', type: 'bonus', description: 'Imbue an item with magical properties', icon: '🔧' },
  ],
  barbarian: [
    { name: 'Reckless Attack', type: 'attack', description: 'Gain advantage on attack, enemies gain advantage on you', icon: '⚔️' },
    { name: 'Rage', type: 'bonus', description: 'Resistance to physical damage, +2 melee damage for 1 minute', icon: '🔥' },
  ],
  bard: [
    { name: 'Bardic Inspiration', type: 'bonus', description: 'Grant 1d6 to ally\'s next roll', icon: '🎵' },
    { name: 'Vicious Mockery', type: 'spell', description: '1d4 psychic + disadvantage on next attack', icon: '🎭' },
  ],
  cleric: [
    { name: 'Healing Word', type: 'heal', description: 'Heal 1d4+3 at range as bonus action', icon: '✨' },
    { name: 'Sacred Flame', type: 'spell', description: 'Dex save or 1d8 radiant', icon: '🔥' },
  ],
  druid: [
    { name: 'Healing Word', type: 'heal', description: 'Heal 1d4+2 at range as bonus action', icon: '🌿' },
    { name: 'Entangle', type: 'spell', description: 'Restrain creatures in a 20ft area', icon: '🌱' },
  ],
  fighter: [
    { name: 'Second Wind', type: 'heal', description: 'Recover 1d10+1 HP', icon: '💨' },
    { name: 'Protection', type: 'reaction', description: 'Impose disadvantage on attack targeting adjacent ally', icon: '🛡️' },
  ],
  monk: [
    { name: 'Flurry of Blows', type: 'attack', description: 'Two unarmed strikes as bonus action for 1 ki', icon: '👊' },
    { name: 'Patient Defense', type: 'bonus', description: 'Dodge as bonus action for 1 ki', icon: '🧘' },
  ],
  paladin: [
    { name: 'Divine Smite', type: 'attack', description: 'Extra 2d8 radiant on hit', icon: '⚔️' },
    { name: 'Lay on Hands', type: 'heal', description: 'Heal 5 HP by touch', icon: '🤲' },
  ],
  ranger: [
    { name: 'Hunter\'s Mark', type: 'bonus', description: 'Extra 1d6 damage to marked target', icon: '🎯' },
    { name: 'Colossus Slayer', type: 'attack', description: 'Extra 1d8 to injured target', icon: '⚔️' },
  ],
  rogue: [
    { name: 'Sneak Attack', type: 'attack', description: 'Extra 1d6 damage with advantage', icon: '🗡️' },
    { name: 'Cunning Action', type: 'bonus', description: 'Dash, Disengage, or Hide as bonus action', icon: '💨' },
  ],
  sorcerer: [
    { name: 'Chaos Bolt', type: 'attack', description: '2d8+1d6 random element, can bounce on doubles', icon: '🌀' },
    { name: 'Shield', type: 'reaction', description: '+5 AC until next turn', icon: '🛡️' },
  ],
  warlock: [
    { name: 'Eldritch Blast', type: 'attack', description: '1d10 force ranged attack', icon: '💀' },
    { name: 'Hex', type: 'bonus', description: 'Extra 1d6 necrotic on hit + disadvantage on one ability check', icon: '🔮' },
  ],
  wizard: [
    { name: 'Magic Missile', type: 'attack', description: '3 darts of 1d4+1 force each auto-hit', icon: '⚡' },
    { name: 'Shield', type: 'reaction', description: '+5 AC until next turn', icon: '🛡️' },
  ],
};

// ─── Build Companion ────────────────────────────────────────────

/**
 * Build a full Companion object from starter data for a new campaign
 */
export function buildCompanion(starter: CompanionTemplate): Companion {
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

/** Look up a roster companion by class */
export function getCompanionByClass(className: ClassName): CompanionTemplate | undefined {
  return COMPANION_ROSTER.find(c => c.className === className);
}

/** Look up roster companions by names */
export function getCompanionsByNames(names: string[]): CompanionTemplate[] {
  const nameSet = new Set(names.map(n => n.toLowerCase()));
  return COMPANION_ROSTER.filter(c => nameSet.has(c.name.toLowerCase()));
}
