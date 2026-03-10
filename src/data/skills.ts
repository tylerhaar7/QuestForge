import type { Skill, AbilityScore } from '@/types/game';

export interface SkillData {
  id: Skill;
  name: string;
  ability: AbilityScore;
  description: string;
}

export const SKILLS: Record<Skill, SkillData> = {
  acrobatics: {
    id: 'acrobatics',
    name: 'Acrobatics',
    ability: 'dexterity',
    description: 'Stay on your feet in tricky situations — balance on a narrow ledge, tumble past enemies, or land gracefully from a fall.',
  },
  animal_handling: {
    id: 'animal_handling',
    name: 'Animal Handling',
    ability: 'wisdom',
    description: 'Calm a frightened horse, sense an animal\'s intentions, or convince a beast not to attack.',
  },
  arcana: {
    id: 'arcana',
    name: 'Arcana',
    ability: 'intelligence',
    description: 'Recall lore about spells, magic items, planes of existence, and the symbols and traditions of arcane practitioners.',
  },
  athletics: {
    id: 'athletics',
    name: 'Athletics',
    ability: 'strength',
    description: 'Climb a sheer cliff, cling to a surface while something tries to knock you off, or swim against a powerful current.',
  },
  deception: {
    id: 'deception',
    name: 'Deception',
    ability: 'charisma',
    description: 'Convincingly hide the truth — whether through misleading words, disguise, or fast-talking your way out of trouble.',
  },
  history: {
    id: 'history',
    name: 'History',
    ability: 'intelligence',
    description: 'Recall lore about historical events, legendary figures, ancient kingdoms, past disputes, and forgotten civilizations.',
  },
  insight: {
    id: 'insight',
    name: 'Insight',
    ability: 'wisdom',
    description: 'Read body language and speech to determine someone\'s true intentions — detect lies, predict behavior, or sense hidden motives.',
  },
  intimidation: {
    id: 'intimidation',
    name: 'Intimidation',
    ability: 'charisma',
    description: 'Influence others through threats, hostile actions, or sheer physical presence to force them to back down or comply.',
  },
  investigation: {
    id: 'investigation',
    name: 'Investigation',
    ability: 'intelligence',
    description: 'Search for clues, make deductions, and piece together information — find hidden doors, identify weaknesses, or solve puzzles.',
  },
  medicine: {
    id: 'medicine',
    name: 'Medicine',
    ability: 'wisdom',
    description: 'Stabilize a dying companion, diagnose an illness, or determine the cause of death from examining a body.',
  },
  nature: {
    id: 'nature',
    name: 'Nature',
    ability: 'intelligence',
    description: 'Recall lore about terrain, plants, animals, weather, and natural cycles — identify herbs, predict storms, or track beasts.',
  },
  perception: {
    id: 'perception',
    name: 'Perception',
    ability: 'wisdom',
    description: 'Spot, hear, or otherwise detect the presence of something — notice hidden enemies, eavesdrop on conversations, or spot traps.',
  },
  performance: {
    id: 'performance',
    name: 'Performance',
    ability: 'charisma',
    description: 'Delight an audience with music, dance, acting, storytelling, or some other form of entertainment.',
  },
  persuasion: {
    id: 'persuasion',
    name: 'Persuasion',
    ability: 'charisma',
    description: 'Influence others with tact, social graces, or good nature — negotiate peace, convince a guard, or inspire a crowd.',
  },
  religion: {
    id: 'religion',
    name: 'Religion',
    ability: 'intelligence',
    description: 'Recall lore about deities, rites, prayers, holy symbols, and the practices of secret cults and religious orders.',
  },
  sleight_of_hand: {
    id: 'sleight_of_hand',
    name: 'Sleight of Hand',
    ability: 'dexterity',
    description: 'Pick a pocket, conceal an object on your person, or perform other acts of manual trickery and legerdemain.',
  },
  stealth: {
    id: 'stealth',
    name: 'Stealth',
    ability: 'dexterity',
    description: 'Move silently, hide in shadows, slip past guards, or blend into a crowd without being noticed.',
  },
  survival: {
    id: 'survival',
    name: 'Survival',
    ability: 'wisdom',
    description: 'Follow tracks, hunt wild game, guide your party through wastelands, predict the weather, or avoid natural hazards.',
  },
};
