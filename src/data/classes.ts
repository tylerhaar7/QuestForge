import type { AbilityScore, ClassName, Skill } from '@/types/game';
import type { EquipmentItem } from '@/types/game';

export interface EquipmentChoiceGroup {
  label: string;
  options: EquipmentItem[][];  // Each option is an array of items (e.g., [longsword, shield] vs [greatsword])
}

export interface ClassData {
  id: ClassName;
  name: string;
  description: string;
  hitDie: number;
  primaryAbility: AbilityScore;
  saveProficiencies: AbilityScore[];
  skillChoices: { pick: number; from: Skill[] };
  startingEquipment: EquipmentItem[];
  equipmentChoices?: EquipmentChoiceGroup[];
  features: { name: string; description: string }[];
  spellcaster: boolean;
}

export const CLASSES: Record<ClassName, ClassData> = {
  barbarian: {
    id: 'barbarian',
    name: 'Barbarian',
    description: 'A fierce warrior fueled by primal rage.',
    hitDie: 12,
    primaryAbility: 'strength',
    saveProficiencies: ['strength', 'constitution'],
    skillChoices: { pick: 2, from: ['animal_handling', 'athletics', 'intimidation', 'nature', 'perception', 'survival'] },
    startingEquipment: [
      { id: 'greataxe', name: 'Greataxe', type: 'weapon', equipped: true, properties: { damage: '1d12', damageType: 'slashing' } },
      { id: 'explorer-pack', name: "Explorer's Pack", type: 'accessory', equipped: false, properties: {} },
    ],
    equipmentChoices: [
      {
        label: 'Primary Weapon',
        options: [
          [{ id: 'greataxe', name: 'Greataxe', type: 'weapon', equipped: true, properties: { damage: '1d12', damageType: 'slashing' } }],
          [{ id: 'greatsword', name: 'Greatsword', type: 'weapon', equipped: true, properties: { damage: '2d6', damageType: 'slashing' } }],
          [{ id: 'handaxe-1', name: 'Handaxe', type: 'weapon', equipped: true, properties: { damage: '1d6', damageType: 'slashing', range: '20/60' } },
           { id: 'handaxe-2', name: 'Handaxe', type: 'weapon', equipped: true, properties: { damage: '1d6', damageType: 'slashing', range: '20/60' } }],
        ],
      },
    ],
    features: [
      { name: 'Rage', description: 'Enter a battle rage for bonus damage and resistance to physical damage.' },
      { name: 'Unarmored Defense', description: 'AC = 10 + DEX mod + CON mod when not wearing armor.' },
    ],
    spellcaster: false,
  },
  bard: {
    id: 'bard',
    name: 'Bard',
    description: 'A charismatic performer whose music weaves magic.',
    hitDie: 8,
    primaryAbility: 'charisma',
    saveProficiencies: ['dexterity', 'charisma'],
    skillChoices: { pick: 3, from: ['acrobatics', 'animal_handling', 'arcana', 'athletics', 'deception', 'history', 'insight', 'intimidation', 'investigation', 'medicine', 'nature', 'perception', 'performance', 'persuasion', 'religion', 'sleight_of_hand', 'stealth', 'survival'] },
    startingEquipment: [
      { id: 'rapier', name: 'Rapier', type: 'weapon', equipped: true, properties: { damage: '1d8', damageType: 'piercing' } },
      { id: 'leather-armor', name: 'Leather Armor', type: 'armor', equipped: true, properties: { ac: 11, maxDex: Infinity } },
    ],
    equipmentChoices: [
      {
        label: 'Weapon',
        options: [
          [{ id: 'rapier', name: 'Rapier', type: 'weapon', equipped: true, properties: { damage: '1d8', damageType: 'piercing' } }],
          [{ id: 'longsword', name: 'Longsword', type: 'weapon', equipped: true, properties: { damage: '1d8', damageType: 'slashing' } }],
          [{ id: 'shortsword', name: 'Shortsword', type: 'weapon', equipped: true, properties: { damage: '1d6', damageType: 'piercing' } }],
        ],
      },
    ],
    features: [
      { name: 'Bardic Inspiration', description: 'Inspire allies with a d6 bonus die they can add to ability checks, attacks, or saves.' },
      { name: 'Spellcasting', description: 'Cast spells using Charisma as your spellcasting ability.' },
    ],
    spellcaster: true,
  },
  cleric: {
    id: 'cleric',
    name: 'Cleric',
    description: 'A holy warrior empowered by divine faith.',
    hitDie: 8,
    primaryAbility: 'wisdom',
    saveProficiencies: ['wisdom', 'charisma'],
    skillChoices: { pick: 2, from: ['history', 'insight', 'medicine', 'persuasion', 'religion'] },
    startingEquipment: [
      { id: 'mace', name: 'Mace', type: 'weapon', equipped: true, properties: { damage: '1d6', damageType: 'bludgeoning' } },
      { id: 'scale-mail', name: 'Scale Mail', type: 'armor', equipped: true, properties: { ac: 14, maxDex: 2 } },
      { id: 'shield', name: 'Shield', type: 'shield', equipped: true, properties: { acBonus: 2 } },
    ],
    equipmentChoices: [
      {
        label: 'Weapon',
        options: [
          [{ id: 'mace', name: 'Mace', type: 'weapon', equipped: true, properties: { damage: '1d6', damageType: 'bludgeoning' } }],
          [{ id: 'warhammer', name: 'Warhammer', type: 'weapon', equipped: true, properties: { damage: '1d8', damageType: 'bludgeoning' } }],
        ],
      },
      {
        label: 'Armor',
        options: [
          [{ id: 'scale-mail', name: 'Scale Mail', type: 'armor', equipped: true, properties: { ac: 14, maxDex: 2 } }],
          [{ id: 'leather-armor', name: 'Leather Armor', type: 'armor', equipped: true, properties: { ac: 11, maxDex: Infinity } }],
          [{ id: 'chain-mail', name: 'Chain Mail', type: 'armor', equipped: true, properties: { ac: 16, maxDex: 0 } }],
        ],
      },
    ],
    features: [
      { name: 'Spellcasting', description: 'Cast spells using Wisdom as your spellcasting ability.' },
      { name: 'Divine Domain', description: 'Choose a divine domain that grants bonus spells and features.' },
    ],
    spellcaster: true,
  },
  druid: {
    id: 'druid',
    name: 'Druid',
    description: 'A nature priest who shapeshifts and commands the elements.',
    hitDie: 8,
    primaryAbility: 'wisdom',
    saveProficiencies: ['intelligence', 'wisdom'],
    skillChoices: { pick: 2, from: ['arcana', 'animal_handling', 'insight', 'medicine', 'nature', 'perception', 'religion', 'survival'] },
    startingEquipment: [
      { id: 'quarterstaff', name: 'Quarterstaff', type: 'weapon', equipped: true, properties: { damage: '1d6', damageType: 'bludgeoning' } },
      { id: 'leather-armor', name: 'Leather Armor', type: 'armor', equipped: true, properties: { ac: 11, maxDex: Infinity } },
    ],
    equipmentChoices: [
      {
        label: 'Weapon',
        options: [
          [{ id: 'quarterstaff', name: 'Quarterstaff', type: 'weapon', equipped: true, properties: { damage: '1d6', damageType: 'bludgeoning' } }],
          [{ id: 'scimitar', name: 'Scimitar', type: 'weapon', equipped: true, properties: { damage: '1d6', damageType: 'slashing' } }],
        ],
      },
    ],
    features: [
      { name: 'Spellcasting', description: 'Cast spells using Wisdom as your spellcasting ability.' },
      { name: 'Wild Shape', description: 'Transform into beasts you have seen.' },
    ],
    spellcaster: true,
  },
  fighter: {
    id: 'fighter',
    name: 'Fighter',
    description: 'A master of martial combat and tactical warfare.',
    hitDie: 10,
    primaryAbility: 'strength',
    saveProficiencies: ['strength', 'constitution'],
    skillChoices: { pick: 2, from: ['acrobatics', 'animal_handling', 'athletics', 'history', 'insight', 'intimidation', 'perception', 'survival'] },
    startingEquipment: [
      { id: 'longsword', name: 'Longsword', type: 'weapon', equipped: true, properties: { damage: '1d8', damageType: 'slashing' } },
      { id: 'chain-mail', name: 'Chain Mail', type: 'armor', equipped: true, properties: { ac: 16, maxDex: 0 } },
      { id: 'shield', name: 'Shield', type: 'shield', equipped: true, properties: { acBonus: 2 } },
    ],
    equipmentChoices: [
      {
        label: 'Armor',
        options: [
          [{ id: 'chain-mail', name: 'Chain Mail', type: 'armor', equipped: true, properties: { ac: 16, maxDex: 0 } }],
          [{ id: 'leather-armor', name: 'Leather Armor', type: 'armor', equipped: true, properties: { ac: 11, maxDex: Infinity } },
           { id: 'longbow', name: 'Longbow', type: 'weapon', equipped: true, properties: { damage: '1d8', damageType: 'piercing', range: '150/600' } }],
        ],
      },
      {
        label: 'Weapon',
        options: [
          [{ id: 'longsword', name: 'Longsword', type: 'weapon', equipped: true, properties: { damage: '1d8', damageType: 'slashing' } },
           { id: 'shield', name: 'Shield', type: 'shield', equipped: true, properties: { acBonus: 2 } }],
          [{ id: 'greatsword', name: 'Greatsword', type: 'weapon', equipped: true, properties: { damage: '2d6', damageType: 'slashing' } }],
          [{ id: 'battleaxe', name: 'Battleaxe', type: 'weapon', equipped: true, properties: { damage: '1d8', damageType: 'slashing' } },
           { id: 'shield', name: 'Shield', type: 'shield', equipped: true, properties: { acBonus: 2 } }],
        ],
      },
    ],
    features: [
      { name: 'Fighting Style', description: 'Adopt a fighting style specialization.' },
      { name: 'Second Wind', description: 'Recover 1d10 + level HP as a bonus action once per short rest.' },
    ],
    spellcaster: false,
  },
  monk: {
    id: 'monk',
    name: 'Monk',
    description: 'A disciplined warrior who channels ki for supernatural feats.',
    hitDie: 8,
    primaryAbility: 'dexterity',
    saveProficiencies: ['strength', 'dexterity'],
    skillChoices: { pick: 2, from: ['acrobatics', 'athletics', 'history', 'insight', 'religion', 'stealth'] },
    startingEquipment: [
      { id: 'shortsword', name: 'Shortsword', type: 'weapon', equipped: true, properties: { damage: '1d6', damageType: 'piercing' } },
    ],
    equipmentChoices: [
      {
        label: 'Weapon',
        options: [
          [{ id: 'shortsword', name: 'Shortsword', type: 'weapon', equipped: true, properties: { damage: '1d6', damageType: 'piercing' } }],
          [{ id: 'quarterstaff', name: 'Quarterstaff', type: 'weapon', equipped: true, properties: { damage: '1d6', damageType: 'bludgeoning' } }],
        ],
      },
    ],
    features: [
      { name: 'Unarmored Defense', description: 'AC = 10 + DEX mod + WIS mod when not wearing armor.' },
      { name: 'Martial Arts', description: 'Use DEX for unarmed strikes; bonus action unarmed strike after Attack.' },
    ],
    spellcaster: false,
  },
  paladin: {
    id: 'paladin',
    name: 'Paladin',
    description: 'A holy knight bound by a sacred oath.',
    hitDie: 10,
    primaryAbility: 'charisma',
    saveProficiencies: ['wisdom', 'charisma'],
    skillChoices: { pick: 2, from: ['athletics', 'insight', 'intimidation', 'medicine', 'persuasion', 'religion'] },
    startingEquipment: [
      { id: 'longsword', name: 'Longsword', type: 'weapon', equipped: true, properties: { damage: '1d8', damageType: 'slashing' } },
      { id: 'chain-mail', name: 'Chain Mail', type: 'armor', equipped: true, properties: { ac: 16, maxDex: 0 } },
      { id: 'shield', name: 'Shield', type: 'shield', equipped: true, properties: { acBonus: 2 } },
    ],
    equipmentChoices: [
      {
        label: 'Weapon',
        options: [
          [{ id: 'longsword', name: 'Longsword', type: 'weapon', equipped: true, properties: { damage: '1d8', damageType: 'slashing' } },
           { id: 'shield', name: 'Shield', type: 'shield', equipped: true, properties: { acBonus: 2 } }],
          [{ id: 'greatsword', name: 'Greatsword', type: 'weapon', equipped: true, properties: { damage: '2d6', damageType: 'slashing' } }],
          [{ id: 'warhammer', name: 'Warhammer', type: 'weapon', equipped: true, properties: { damage: '1d8', damageType: 'bludgeoning' } },
           { id: 'shield', name: 'Shield', type: 'shield', equipped: true, properties: { acBonus: 2 } }],
        ],
      },
    ],
    features: [
      { name: 'Divine Sense', description: 'Detect celestials, fiends, and undead within 60 feet.' },
      { name: 'Lay on Hands', description: 'Heal HP from a pool equal to 5 x paladin level.' },
    ],
    spellcaster: true,
  },
  ranger: {
    id: 'ranger',
    name: 'Ranger',
    description: 'A wilderness tracker who hunts the enemies of civilization.',
    hitDie: 10,
    primaryAbility: 'dexterity',
    saveProficiencies: ['strength', 'dexterity'],
    skillChoices: { pick: 3, from: ['animal_handling', 'athletics', 'insight', 'investigation', 'nature', 'perception', 'stealth', 'survival'] },
    startingEquipment: [
      { id: 'longbow', name: 'Longbow', type: 'weapon', equipped: true, properties: { damage: '1d8', damageType: 'piercing', range: '150/600' } },
      { id: 'scale-mail', name: 'Scale Mail', type: 'armor', equipped: true, properties: { ac: 14, maxDex: 2 } },
    ],
    equipmentChoices: [
      {
        label: 'Armor',
        options: [
          [{ id: 'scale-mail', name: 'Scale Mail', type: 'armor', equipped: true, properties: { ac: 14, maxDex: 2 } }],
          [{ id: 'leather-armor', name: 'Leather Armor', type: 'armor', equipped: true, properties: { ac: 11, maxDex: Infinity } }],
        ],
      },
      {
        label: 'Weapon',
        options: [
          [{ id: 'longbow', name: 'Longbow', type: 'weapon', equipped: true, properties: { damage: '1d8', damageType: 'piercing', range: '150/600' } }],
          [{ id: 'shortsword-1', name: 'Shortsword', type: 'weapon', equipped: true, properties: { damage: '1d6', damageType: 'piercing' } },
           { id: 'shortsword-2', name: 'Shortsword', type: 'weapon', equipped: true, properties: { damage: '1d6', damageType: 'piercing' } }],
        ],
      },
    ],
    features: [
      { name: 'Favored Enemy', description: 'Advantage on Survival checks to track and Intelligence checks about a chosen enemy type.' },
      { name: 'Natural Explorer', description: 'Expertise in navigating and surviving in a favored terrain.' },
    ],
    spellcaster: true,
  },
  rogue: {
    id: 'rogue',
    name: 'Rogue',
    description: 'A cunning trickster who strikes from the shadows.',
    hitDie: 8,
    primaryAbility: 'dexterity',
    saveProficiencies: ['dexterity', 'intelligence'],
    skillChoices: { pick: 4, from: ['acrobatics', 'athletics', 'deception', 'insight', 'intimidation', 'investigation', 'perception', 'performance', 'persuasion', 'sleight_of_hand', 'stealth'] },
    startingEquipment: [
      { id: 'rapier', name: 'Rapier', type: 'weapon', equipped: true, properties: { damage: '1d8', damageType: 'piercing' } },
      { id: 'leather-armor', name: 'Leather Armor', type: 'armor', equipped: true, properties: { ac: 11, maxDex: Infinity } },
    ],
    equipmentChoices: [
      {
        label: 'Weapon',
        options: [
          [{ id: 'rapier', name: 'Rapier', type: 'weapon', equipped: true, properties: { damage: '1d8', damageType: 'piercing' } }],
          [{ id: 'shortsword', name: 'Shortsword', type: 'weapon', equipped: true, properties: { damage: '1d6', damageType: 'piercing' } }],
        ],
      },
    ],
    features: [
      { name: 'Sneak Attack', description: 'Deal extra 1d6 damage when you have advantage or an ally is adjacent to the target.' },
      { name: "Thieves' Cant", description: 'A secret language of signs, symbols, and code words.' },
    ],
    spellcaster: false,
  },
  sorcerer: {
    id: 'sorcerer',
    name: 'Sorcerer',
    description: 'A spellcaster whose magic flows from an innate bloodline.',
    hitDie: 6,
    primaryAbility: 'charisma',
    saveProficiencies: ['constitution', 'charisma'],
    skillChoices: { pick: 2, from: ['arcana', 'deception', 'insight', 'intimidation', 'persuasion', 'religion'] },
    startingEquipment: [
      { id: 'dagger', name: 'Dagger', type: 'weapon', equipped: true, properties: { damage: '1d4', damageType: 'piercing' } },
    ],
    equipmentChoices: [
      {
        label: 'Weapon',
        options: [
          [{ id: 'light-crossbow', name: 'Light Crossbow', type: 'weapon', equipped: true, properties: { damage: '1d8', damageType: 'piercing', range: '80/320' } }],
          [{ id: 'dagger', name: 'Dagger', type: 'weapon', equipped: true, properties: { damage: '1d4', damageType: 'piercing', range: '20/60' } }],
          [{ id: 'quarterstaff', name: 'Quarterstaff', type: 'weapon', equipped: true, properties: { damage: '1d6', damageType: 'bludgeoning' } }],
        ],
      },
    ],
    features: [
      { name: 'Spellcasting', description: 'Cast spells using Charisma. Your magic comes from within.' },
      { name: 'Sorcerous Origin', description: 'Choose the source of your innate magic.' },
    ],
    spellcaster: true,
  },
  warlock: {
    id: 'warlock',
    name: 'Warlock',
    description: 'A wielder of dark power granted by an otherworldly patron.',
    hitDie: 8,
    primaryAbility: 'charisma',
    saveProficiencies: ['wisdom', 'charisma'],
    skillChoices: { pick: 2, from: ['arcana', 'deception', 'history', 'intimidation', 'investigation', 'nature', 'religion'] },
    startingEquipment: [
      { id: 'quarterstaff', name: 'Quarterstaff', type: 'weapon', equipped: true, properties: { damage: '1d6', damageType: 'bludgeoning' } },
      { id: 'leather-armor', name: 'Leather Armor', type: 'armor', equipped: true, properties: { ac: 11, maxDex: Infinity } },
    ],
    equipmentChoices: [
      {
        label: 'Weapon',
        options: [
          [{ id: 'quarterstaff', name: 'Quarterstaff', type: 'weapon', equipped: true, properties: { damage: '1d6', damageType: 'bludgeoning' } }],
          [{ id: 'light-crossbow', name: 'Light Crossbow', type: 'weapon', equipped: true, properties: { damage: '1d8', damageType: 'piercing', range: '80/320' } }],
        ],
      },
    ],
    features: [
      { name: 'Otherworldly Patron', description: 'Forge a pact with an entity — Archfey, Fiend, or Great Old One.' },
      { name: 'Pact Magic', description: 'Cast spells using Charisma. Spell slots recharge on short rest.' },
    ],
    spellcaster: true,
  },
  wizard: {
    id: 'wizard',
    name: 'Wizard',
    description: 'A scholarly mage who masters the arcane through study.',
    hitDie: 6,
    primaryAbility: 'intelligence',
    saveProficiencies: ['intelligence', 'wisdom'],
    skillChoices: { pick: 2, from: ['arcana', 'history', 'insight', 'investigation', 'medicine', 'religion'] },
    startingEquipment: [
      { id: 'quarterstaff', name: 'Quarterstaff', type: 'weapon', equipped: true, properties: { damage: '1d6', damageType: 'bludgeoning' } },
    ],
    equipmentChoices: [
      {
        label: 'Weapon',
        options: [
          [{ id: 'quarterstaff', name: 'Quarterstaff', type: 'weapon', equipped: true, properties: { damage: '1d6', damageType: 'bludgeoning' } }],
          [{ id: 'dagger', name: 'Dagger', type: 'weapon', equipped: true, properties: { damage: '1d4', damageType: 'piercing', range: '20/60' } }],
        ],
      },
    ],
    features: [
      { name: 'Spellcasting', description: 'Cast spells using Intelligence. Prepare spells from your spellbook.' },
      { name: 'Arcane Recovery', description: 'Recover spell slots during a short rest once per day.' },
    ],
    spellcaster: true,
  },
};

export const CLASS_LIST = Object.values(CLASSES);
