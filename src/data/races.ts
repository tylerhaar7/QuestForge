import type { AbilityScore, RaceName, Skill } from '@/types/game';

export interface RaceData {
  id: RaceName;
  name: string;
  description: string;
  abilityBonuses: Partial<Record<AbilityScore, number>>;
  speed: number;
  size: 'Small' | 'Medium';
  traits: { name: string; description: string }[];
  skillProficiencies?: Skill[];
  languages: string[];
}

export const RACES: Record<RaceName, RaceData> = {
  human: {
    id: 'human',
    name: 'Human',
    description: 'Versatile and ambitious, humans thrive everywhere.',
    abilityBonuses: { strength: 1, dexterity: 1, constitution: 1, intelligence: 1, wisdom: 1, charisma: 1 },
    speed: 30,
    size: 'Medium',
    traits: [
      { name: 'Versatile', description: '+1 to all ability scores' },
    ],
    languages: ['Common', 'One extra'],
  },
  elf: {
    id: 'elf',
    name: 'Elf',
    description: 'Graceful and long-lived, with keen senses and a love of nature.',
    abilityBonuses: { dexterity: 2 },
    speed: 30,
    size: 'Medium',
    traits: [
      { name: 'Darkvision', description: 'See in dim light within 60 feet as if bright light.' },
      { name: 'Fey Ancestry', description: 'Advantage on saves against being charmed; immune to magical sleep.' },
      { name: 'Trance', description: 'Elves meditate for 4 hours instead of sleeping 8.' },
    ],
    skillProficiencies: ['perception'],
    languages: ['Common', 'Elvish'],
  },
  dwarf: {
    id: 'dwarf',
    name: 'Dwarf',
    description: 'Stout and enduring, forged in mountain stone.',
    abilityBonuses: { constitution: 2 },
    speed: 25,
    size: 'Medium',
    traits: [
      { name: 'Darkvision', description: 'See in dim light within 60 feet as if bright light.' },
      { name: 'Dwarven Resilience', description: 'Advantage on saves against poison; resistance to poison damage.' },
      { name: 'Stonecunning', description: 'Double proficiency bonus on History checks related to stonework.' },
    ],
    languages: ['Common', 'Dwarvish'],
  },
  halfling: {
    id: 'halfling',
    name: 'Halfling',
    description: 'Small but brave, with uncanny luck.',
    abilityBonuses: { dexterity: 2 },
    speed: 25,
    size: 'Small',
    traits: [
      { name: 'Lucky', description: 'Reroll natural 1s on attack rolls, ability checks, and saving throws.' },
      { name: 'Brave', description: 'Advantage on saves against being frightened.' },
      { name: 'Halfling Nimbleness', description: 'Move through the space of creatures larger than you.' },
    ],
    languages: ['Common', 'Halfling'],
  },
  gnome: {
    id: 'gnome',
    name: 'Gnome',
    description: 'Clever and curious, with an innate gift for illusion.',
    abilityBonuses: { intelligence: 2 },
    speed: 25,
    size: 'Small',
    traits: [
      { name: 'Darkvision', description: 'See in dim light within 60 feet as if bright light.' },
      { name: 'Gnome Cunning', description: 'Advantage on INT, WIS, CHA saves against magic.' },
    ],
    languages: ['Common', 'Gnomish'],
  },
  half_elf: {
    id: 'half_elf',
    name: 'Half-Elf',
    description: 'Charismatic diplomats who walk between two worlds.',
    abilityBonuses: { charisma: 2 },
    speed: 30,
    size: 'Medium',
    traits: [
      { name: 'Darkvision', description: 'See in dim light within 60 feet as if bright light.' },
      { name: 'Fey Ancestry', description: 'Advantage on saves against being charmed; immune to magical sleep.' },
      { name: 'Versatile', description: 'Choose two additional ability scores to increase by 1.' },
    ],
    languages: ['Common', 'Elvish', 'One extra'],
  },
  half_orc: {
    id: 'half_orc',
    name: 'Half-Orc',
    description: 'Fierce warriors with savage endurance.',
    abilityBonuses: { strength: 2, constitution: 1 },
    speed: 30,
    size: 'Medium',
    traits: [
      { name: 'Darkvision', description: 'See in dim light within 60 feet as if bright light.' },
      { name: 'Relentless Endurance', description: 'Drop to 1 HP instead of 0 once per long rest.' },
      { name: 'Savage Attacks', description: 'Roll one extra damage die on melee critical hits.' },
    ],
    skillProficiencies: ['intimidation'],
    languages: ['Common', 'Orc'],
  },
  tiefling: {
    id: 'tiefling',
    name: 'Tiefling',
    description: 'Infernal heritage grants dark power and distrust from others.',
    abilityBonuses: { charisma: 2, intelligence: 1 },
    speed: 30,
    size: 'Medium',
    traits: [
      { name: 'Darkvision', description: 'See in dim light within 60 feet as if bright light.' },
      { name: 'Hellish Resistance', description: 'Resistance to fire damage.' },
      { name: 'Infernal Legacy', description: 'You know the Thaumaturgy cantrip. At 3rd level, cast Hellish Rebuke once per day.' },
    ],
    languages: ['Common', 'Infernal'],
  },
  dragonborn: {
    id: 'dragonborn',
    name: 'Dragonborn',
    description: 'Proud dragon-blooded warriors with a devastating breath weapon.',
    abilityBonuses: { strength: 2, charisma: 1 },
    speed: 30,
    size: 'Medium',
    traits: [
      { name: 'Breath Weapon', description: 'Exhale destructive energy based on your draconic ancestry.' },
      { name: 'Damage Resistance', description: 'Resistance to the damage type of your breath weapon.' },
    ],
    languages: ['Common', 'Draconic'],
  },
};

export const RACE_LIST = Object.values(RACES);
