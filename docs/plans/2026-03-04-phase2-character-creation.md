# Phase 2: Character Creation + Auth Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the complete character creation flow — from auth login through race/class/abilities/origin selection to saving a character in Supabase — so a player can create a D&D 5e character and start a campaign.

**Architecture:** Expo Router file-based routing with a multi-step wizard pattern. Zustand store (`useCharacterCreationStore`) holds in-progress creation state across screens. Each creation screen reads/writes to the store. Final summary screen calls Supabase to persist. Auth uses Supabase email/password. Root `index.tsx` routes based on session state (no auth → login, no character → create, has campaign → game).

**Tech Stack:** React Native + Expo Router, TypeScript, Zustand, Supabase Auth, @supabase/supabase-js, react-native-reanimated, expo-haptics

**Source docs:**
- `QuestForge MDs/questforge-features-v2.md` — Origin stories, onboarding flow, accessibility
- `src/types/game.ts` — All type definitions (Character, RaceName, ClassName, etc.)
- `src/engine/character.ts` — getModifier, calculateMaxHP, calculateAC, CLASS_HIT_DIE
- `src/theme/colors.ts` + `src/theme/typography.ts` — Design system
- `src/services/supabase.ts` — Supabase client + getCurrentUserId

**Existing infrastructure:**
- 9 Supabase tables with RLS (profiles, characters, campaigns, etc.)
- Auto-create profile trigger fires on auth.users insert
- characters table: id, user_id, name, race, class_name, ability_scores (JSONB), hp, max_hp, ac, proficient_skills, proficient_saves, origin_story, etc.

**Note on testing:** This project does not have Jest configured. Verification is via `npx tsc --noEmit --skipLibCheck` and visual confirmation in the Expo dev server. UI components are verified by rendering in the browser.

---

### Task 1: Race Data File

**Files:**
- Create: `src/data/races.ts`

**Step 1: Create the race data file**

This file defines all 9 playable races with their D&D 5e stats. Each race has: display name, ability score bonuses, speed, size, traits (flavor descriptions), and a one-line description for the selection card.

```typescript
import type { AbilityScore, RaceName, Skill } from '@/types/game';

export interface RaceData {
  id: RaceName;
  name: string;
  description: string;         // One-line for selection card
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
    abilityBonuses: { charisma: 2 },  // +1 to two others (chosen at creation)
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
```

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit --skipLibCheck 2>&1 | head -20
```

Expected: No errors related to races.ts

**Step 3: Commit**

```bash
git add src/data/races.ts
git commit -m "Add race data definitions for 9 D&D 5e races"
```

---

### Task 2: Class Data File

**Files:**
- Create: `src/data/classes.ts`

**Step 1: Create the class data file**

Defines all 12 classes with hit die, saving throw proficiencies, skill choices, starting equipment, and a description. References `CLASS_HIT_DIE` from `src/engine/character.ts` for hit die values.

```typescript
import type { AbilityScore, ClassName, Skill } from '@/types/game';
import type { EquipmentItem } from '@/types/game';

export interface ClassData {
  id: ClassName;
  name: string;
  description: string;
  hitDie: number;
  primaryAbility: AbilityScore;
  saveProficiencies: AbilityScore[];
  skillChoices: { pick: number; from: Skill[] };
  startingEquipment: EquipmentItem[];
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
    features: [
      { name: 'Divine Sense', description: 'Detect celestials, fiends, and undead within 60 feet.' },
      { name: 'Lay on Hands', description: 'Heal HP from a pool equal to 5 × paladin level.' },
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
    features: [
      { name: 'Sneak Attack', description: 'Deal extra 1d6 damage when you have advantage or an ally is adjacent to the target.' },
      { name: 'Thieves\' Cant', description: 'A secret language of signs, symbols, and code words.' },
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
    features: [
      { name: 'Spellcasting', description: 'Cast spells using Intelligence. Prepare spells from your spellbook.' },
      { name: 'Arcane Recovery', description: 'Recover spell slots during a short rest once per day.' },
    ],
    spellcaster: true,
  },
};

export const CLASS_LIST = Object.values(CLASSES);
```

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit --skipLibCheck 2>&1 | head -20
```

**Step 3: Commit**

```bash
git add src/data/classes.ts
git commit -m "Add class data definitions for 12 D&D 5e classes"
```

---

### Task 3: Origin Story Data File

**Files:**
- Create: `src/data/origins.ts`

**Step 1: Create the origin story data file**

6 pre-built origins from the features doc, each with personal quest, AI context, bonus skills, and dialogue tags.

```typescript
import type { Skill } from '@/types/game';

export interface OriginData {
  id: string;
  name: string;
  description: string;
  personalQuest: string;
  questFlags: string[];
  bonusSkills: Skill[];
  uniqueDialogueTags: string[];
  aiContext: string;
}

export const ORIGINS: OriginData[] = [
  {
    id: 'exiled_noble',
    name: 'Exiled Noble',
    description: 'You were born to privilege, but betrayal stripped you of title, land, and family. Someone close to you orchestrated your fall.',
    personalQuest: 'Uncover the betrayer and reclaim — or reject — your birthright',
    questFlags: ['betrayer_identity_unknown', 'noble_house_fallen'],
    bonusSkills: ['persuasion', 'history'],
    uniqueDialogueTags: ['noble_speech', 'recognize_heraldry', 'political_knowledge'],
    aiContext: "The player is an exiled noble. NPCs of high station may recognize their family name. The betrayer's identity should be slowly revealed through clues planted across the campaign.",
  },
  {
    id: 'haunted_scholar',
    name: 'Haunted Scholar',
    description: "You opened a book you shouldn't have. Now something whispers in your dreams, and you understand languages that haven't been spoken in centuries.",
    personalQuest: 'Discover what entity is feeding you knowledge — and what it wants in return',
    questFlags: ['entity_unnamed', 'forbidden_knowledge_1'],
    bonusSkills: ['arcana', 'investigation'],
    uniqueDialogueTags: ['ancient_languages', 'forbidden_lore', 'dream_visions'],
    aiContext: 'The player hears whispers from an unknown entity. Occasionally feed them a vision or piece of forbidden knowledge. The entity should slowly reveal itself over the campaign as something more complex than good or evil.',
  },
  {
    id: 'debt_runner',
    name: 'Debt Runner',
    description: 'You owe a very dangerous person a very large sum. Every city has their agents. Every tavern might be a trap.',
    personalQuest: 'Pay the debt, kill the creditor, or find leverage to make it disappear',
    questFlags: ['debt_amount_large', 'creditor_unknown_faction'],
    bonusSkills: ['deception', 'sleight_of_hand'],
    uniqueDialogueTags: ['street_knowledge', 'recognize_thugs', 'haggling'],
    aiContext: 'The player is being hunted by debt collectors. Occasionally introduce agents looking for them. The debt should tie into the larger plot. Give the player multiple paths to resolution.',
  },
  {
    id: 'oathbound',
    name: 'Oathbound',
    description: "You made a promise to someone who died. You don't know exactly how to fulfill it, only that you must.",
    personalQuest: 'Fulfill the oath — whatever it costs',
    questFlags: ['oath_target_unclear', 'oath_origin_traumatic'],
    bonusSkills: ['survival', 'perception'],
    uniqueDialogueTags: ['oath_references', 'death_awareness', 'honor_code'],
    aiContext: "The player carries an oath to a dead person. The oath's true meaning should unfold gradually — what they think they promised and what the oath actually requires may be different. Build to a climactic choice.",
  },
  {
    id: 'reformed_cultist',
    name: 'Reformed Cultist',
    description: "You were part of something terrible. You left — or were cast out. Your former 'family' hasn't forgotten you.",
    personalQuest: "Stop the cult's plan — or be tempted back into the fold",
    questFlags: ['cult_active', 'cult_agent_tracking'],
    bonusSkills: ['religion', 'intimidation'],
    uniqueDialogueTags: ['cult_recognition', 'dark_rituals', 'symbol_reading'],
    aiContext: "The player is a former cultist. Occasionally introduce cult symbols, agents, or temptations. The cult should be connected to the main plot. Give the player moments where their dark knowledge is useful — and moments where it disturbs their companions.",
  },
  {
    id: 'last_of_the_order',
    name: 'Last of the Order',
    description: 'Your mentor, your allies, your entire order — gone in a single night. You survived because you weren\'t there.',
    personalQuest: 'Find out who destroyed the order and why — then decide what justice looks like',
    questFlags: ['order_destroyed', 'survivor_guilt', 'destroyer_unknown'],
    bonusSkills: ['athletics', 'medicine'],
    uniqueDialogueTags: ['order_training', 'recognize_techniques', 'mentor_memories'],
    aiContext: "The player is the sole survivor of a destroyed order. Plant clues about the destroyers across the campaign. Former members may have survived in hiding. The destruction should connect to the world's larger threats.",
  },
];

export const ORIGIN_MAP = Object.fromEntries(ORIGINS.map(o => [o.id, o]));
```

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit --skipLibCheck 2>&1 | head -20
```

**Step 3: Commit**

```bash
git add src/data/origins.ts
git commit -m "Add 6 origin story definitions"
```

---

### Task 4: Character Creation Store

**Files:**
- Create: `src/stores/useCharacterCreationStore.ts`

**Step 1: Create the Zustand store for character creation wizard state**

This store holds the in-progress character creation state. Each creation screen reads/writes to it. On completion, the `finalize()` action assembles the full Character object.

```typescript
import { create } from 'zustand';
import type { AbilityScore, AbilityScores, ClassName, RaceName, Skill } from '@/types/game';
import type { EquipmentItem } from '@/types/game';
import { RACES } from '@/data/races';
import { CLASSES } from '@/data/classes';
import { ORIGIN_MAP } from '@/data/origins';
import { getModifier, calculateMaxHP, calculateAC, getProficiencyBonus } from '@/engine/character';

// Standard Array for ability score assignment
export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];

interface CharacterCreationState {
  // Step state
  step: number;   // 0=race, 1=class, 2=abilities, 3=origin, 4=name/summary

  // Selections
  race: RaceName | null;
  className: ClassName | null;
  abilityAssignment: Partial<Record<AbilityScore, number>>;  // ability -> base score (before race bonus)
  selectedSkills: Skill[];
  originId: string | null;
  customOrigin: string | null;  // If player writes their own
  name: string;

  // Actions
  setStep: (step: number) => void;
  setRace: (race: RaceName) => void;
  setClass: (className: ClassName) => void;
  setAbilityScore: (ability: AbilityScore, score: number) => void;
  clearAbilityScore: (ability: AbilityScore) => void;
  setSelectedSkills: (skills: Skill[]) => void;
  setOrigin: (originId: string) => void;
  setCustomOrigin: (text: string) => void;
  setName: (name: string) => void;
  reset: () => void;

  // Derived
  getFinalAbilityScores: () => AbilityScores | null;
  getAssignedScores: () => number[];
  getAvailableScores: () => number[];
  canProceedFromAbilities: () => boolean;
}

const ABILITIES: AbilityScore[] = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];

const initialState = {
  step: 0,
  race: null as RaceName | null,
  className: null as ClassName | null,
  abilityAssignment: {} as Partial<Record<AbilityScore, number>>,
  selectedSkills: [] as Skill[],
  originId: null as string | null,
  customOrigin: null as string | null,
  name: '',
};

export const useCharacterCreationStore = create<CharacterCreationState>((set, get) => ({
  ...initialState,

  setStep: (step) => set({ step }),
  setRace: (race) => set({ race }),
  setClass: (className) => set({ className, selectedSkills: [] }),  // Reset skills when class changes
  setAbilityScore: (ability, score) => set((state) => ({
    abilityAssignment: { ...state.abilityAssignment, [ability]: score },
  })),
  clearAbilityScore: (ability) => set((state) => {
    const next = { ...state.abilityAssignment };
    delete next[ability];
    return { abilityAssignment: next };
  }),
  setSelectedSkills: (skills) => set({ selectedSkills: skills }),
  setOrigin: (originId) => set({ originId, customOrigin: null }),
  setCustomOrigin: (text) => set({ customOrigin: text, originId: 'custom' }),
  setName: (name) => set({ name }),
  reset: () => set(initialState),

  getAssignedScores: () => Object.values(get().abilityAssignment),

  getAvailableScores: () => {
    const assigned = Object.values(get().abilityAssignment);
    const available = [...STANDARD_ARRAY];
    for (const score of assigned) {
      const idx = available.indexOf(score);
      if (idx !== -1) available.splice(idx, 1);
    }
    return available;
  },

  canProceedFromAbilities: () => {
    const { abilityAssignment, className } = get();
    const allAssigned = ABILITIES.every(a => abilityAssignment[a] !== undefined);
    const classData = className ? CLASSES[className] : null;
    const skillCount = get().selectedSkills.length;
    const requiredSkills = classData?.skillChoices.pick ?? 0;
    return allAssigned && skillCount === requiredSkills;
  },

  getFinalAbilityScores: () => {
    const { race, abilityAssignment } = get();
    if (!race) return null;
    const raceData = RACES[race];
    const allAssigned = ABILITIES.every(a => abilityAssignment[a] !== undefined);
    if (!allAssigned) return null;

    const scores: AbilityScores = { strength: 0, dexterity: 0, constitution: 0, intelligence: 0, wisdom: 0, charisma: 0 };
    for (const ability of ABILITIES) {
      const base = abilityAssignment[ability] ?? 10;
      const raceBonus = raceData.abilityBonuses[ability] ?? 0;
      scores[ability] = base + raceBonus;
    }
    return scores;
  },
}));
```

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit --skipLibCheck 2>&1 | head -20
```

**Step 3: Commit**

```bash
git add src/stores/useCharacterCreationStore.ts
git commit -m "Add character creation wizard store with standard array"
```

---

### Task 5: Character Service (Supabase CRUD)

**Files:**
- Create: `src/services/character.ts`

**Step 1: Create the character service**

Handles saving a new character to Supabase and fetching characters for the current user. Maps TypeScript camelCase field names to Supabase snake_case column names.

```typescript
import { supabase, getCurrentUserId } from './supabase';
import type { Character, AbilityScores } from '@/types/game';
import type { EquipmentItem } from '@/types/game';

// Map Character object to Supabase row (camelCase → snake_case)
function toRow(char: Omit<Character, 'id' | 'createdAt' | 'updatedAt'>) {
  return {
    user_id: char.userId,
    name: char.name,
    race: char.race,
    class_name: char.className,
    subclass: char.subclass,
    level: char.level,
    xp: char.xp,
    ability_scores: char.abilityScores,
    hp: char.hp,
    max_hp: char.maxHp,
    temp_hp: char.tempHp,
    ac: char.ac,
    speed: char.speed,
    proficiency_bonus: char.proficiencyBonus,
    proficient_skills: char.proficientSkills,
    proficient_saves: char.proficientSaves,
    spell_slots: char.spellSlots,
    max_spell_slots: char.maxSpellSlots,
    equipment: char.equipment,
    inventory: char.inventory,
    features: char.features,
    conditions: char.conditions,
    origin_story: char.originStory,
    personal_quest_flags: char.personalQuestFlags,
    portrait_url: char.portraitUrl ?? null,
  };
}

// Map Supabase row to Character object (snake_case → camelCase)
function fromRow(row: any): Character {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    race: row.race,
    className: row.class_name,
    subclass: row.subclass ?? '',
    level: row.level,
    xp: row.xp,
    abilityScores: row.ability_scores as AbilityScores,
    hp: row.hp,
    maxHp: row.max_hp,
    tempHp: row.temp_hp ?? 0,
    ac: row.ac,
    speed: row.speed,
    proficiencyBonus: row.proficiency_bonus,
    proficientSkills: row.proficient_skills ?? [],
    proficientSaves: row.proficient_saves ?? [],
    spellSlots: row.spell_slots ?? [],
    maxSpellSlots: row.max_spell_slots ?? [],
    equipment: row.equipment ?? [],
    inventory: row.inventory ?? [],
    features: row.features ?? [],
    conditions: row.conditions ?? [],
    originStory: row.origin_story ?? '',
    personalQuestFlags: row.personal_quest_flags ?? {},
    portraitUrl: row.portrait_url ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createCharacter(
  char: Omit<Character, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Character> {
  const { data, error } = await supabase
    .from('characters')
    .insert(toRow(char))
    .select()
    .single();

  if (error) throw new Error(`Failed to create character: ${error.message}`);
  return fromRow(data);
}

export async function getCharacters(): Promise<Character[]> {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from('characters')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch characters: ${error.message}`);
  return (data ?? []).map(fromRow);
}

export async function getCharacter(id: string): Promise<Character> {
  const { data, error } = await supabase
    .from('characters')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(`Failed to fetch character: ${error.message}`);
  return fromRow(data);
}

export async function deleteCharacter(id: string): Promise<void> {
  const { error } = await supabase
    .from('characters')
    .delete()
    .eq('id', id);

  if (error) throw new Error(`Failed to delete character: ${error.message}`);
}
```

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit --skipLibCheck 2>&1 | head -20
```

**Step 3: Commit**

```bash
git add src/services/character.ts
git commit -m "Add character Supabase CRUD service"
```

---

### Task 6: Auth Layout and Login Screen

**Files:**
- Create: `app/(auth)/_layout.tsx`
- Create: `app/(auth)/login.tsx`

**Step 1: Create the auth layout**

Simple Stack layout with dark theme.

```typescript
// app/(auth)/_layout.tsx
import { Stack } from 'expo-router';
import { colors } from '@/theme/colors';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg.primary },
        animation: 'fade',
      }}
    />
  );
}
```

**Step 2: Create the login screen**

Combined login/register screen. Uses Supabase Auth with email + password. Styled in dark fantasy theme. Toggle between "Sign In" and "Create Account" modes.

```typescript
// app/(auth)/login.tsx
import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/services/supabase';
import { colors } from '@/theme/colors';
import { fonts, spacing, textStyles } from '@/theme/typography';

export default function LoginScreen() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async () => {
    if (!email.trim() || !password.trim()) {
      setError('Email and password are required.');
      return;
    }
    setLoading(true);
    setError(null);

    if (isRegister) {
      const { error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }
    }

    setLoading(false);
    router.replace('/');
  }, [email, password, isRegister, router]);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.inner}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Text style={styles.title}>QuestForge</Text>
        <Text style={styles.subtitle}>
          {isRegister ? 'Begin your legend' : 'Welcome back, adventurer'}
        </Text>

        <View style={styles.form}>
          <Text style={styles.label}>EMAIL</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="adventurer@questforge.com"
            placeholderTextColor={colors.text.disabled}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={[styles.label, { marginTop: spacing.lg }]}>PASSWORD</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={colors.text.disabled}
            secureTextEntry
          />

          {error && <Text style={styles.error}>{error}</Text>}

          <Pressable
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.bg.primary} />
            ) : (
              <Text style={styles.buttonText}>
                {isRegister ? 'CREATE ACCOUNT' : 'SIGN IN'}
              </Text>
            )}
          </Pressable>

          <Pressable
            style={styles.toggle}
            onPress={() => { setIsRegister(!isRegister); setError(null); }}
          >
            <Text style={styles.toggleText}>
              {isRegister ? 'Already have an account? Sign in' : "New adventurer? Create account"}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  title: {
    ...textStyles.screenTitle,
    color: colors.gold.primary,
    textAlign: 'center',
    fontSize: 32,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontFamily: fonts.narrative,
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },
  form: {
    width: '100%',
  },
  label: {
    ...textStyles.sectionLabel,
    color: colors.text.tertiary,
    marginBottom: spacing.xs,
  },
  input: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.gold.border,
    borderRadius: 8,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.bg.secondary,
  },
  error: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.combat.red,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  button: {
    backgroundColor: colors.gold.primary,
    paddingVertical: spacing.md + 2,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    ...textStyles.buttonLabel,
    color: colors.bg.primary,
    fontSize: 14,
    fontFamily: fonts.heading,
  },
  toggle: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  toggleText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.gold.muted,
  },
});
```

**Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit --skipLibCheck 2>&1 | head -20
```

**Step 4: Commit**

```bash
git add app/\(auth\)/
git commit -m "Add auth layout and login/register screen"
```

---

### Task 7: Update Root Index with Auth Routing

**Files:**
- Modify: `app/index.tsx`

**Step 1: Replace index.tsx with auth-aware router**

The root screen checks auth state. If not logged in, redirect to login. If logged in but no character, redirect to character creation. If has character, redirect to game session.

```typescript
// app/index.tsx
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/services/supabase';
import { colors } from '@/theme/colors';

export default function IndexScreen() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkAuthAndRoute();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.replace('/(auth)/login');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function checkAuthAndRoute() {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.replace('/(auth)/login');
        return;
      }

      // Check if user has any characters
      const { data: characters } = await supabase
        .from('characters')
        .select('id')
        .eq('user_id', session.user.id)
        .limit(1);

      if (!characters || characters.length === 0) {
        router.replace('/create');
        return;
      }

      // Has character — go to game
      router.replace('/game/session');
    } catch {
      router.replace('/(auth)/login');
    } finally {
      setChecking(false);
    }
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg.primary }}>
      <ActivityIndicator size="large" color={colors.gold.primary} />
    </View>
  );
}
```

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit --skipLibCheck 2>&1 | head -20
```

**Step 3: Commit**

```bash
git add app/index.tsx
git commit -m "Add auth-aware routing to root index"
```

---

### Task 8: Character Creation Layout

**Files:**
- Create: `app/create/_layout.tsx`

**Step 1: Create the creation flow layout**

Stack layout for the creation wizard. Includes a progress indicator header showing step 1-5.

```typescript
// app/create/_layout.tsx
import { Stack } from 'expo-router';
import { colors } from '@/theme/colors';

export default function CreateLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg.primary },
        animation: 'slide_from_right',
      }}
    />
  );
}
```

**Step 2: Commit**

```bash
git add app/create/_layout.tsx
git commit -m "Add character creation layout"
```

---

### Task 9: Welcome / Onboarding Screen

**Files:**
- Create: `app/create/index.tsx`

**Step 1: Create the welcome screen (dual-track onboarding)**

Two buttons: "I'm new to D&D" (tutorial — placeholder for now, routes to race selection) and "I'm a D&D veteran" (routes directly to race selection). Both paths currently lead to the same place; the tutorial campaign will be added in Phase 3.

```typescript
// app/create/index.tsx
import React from 'react';
import { View, Text, Pressable, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/theme/colors';
import { fonts, spacing, textStyles } from '@/theme/typography';
import { useCharacterCreationStore } from '@/stores/useCharacterCreationStore';

export default function CreateWelcomeScreen() {
  const router = useRouter();
  const reset = useCharacterCreationStore(s => s.reset);

  const handleStart = (track: 'new' | 'veteran') => {
    reset();  // Clear any previous creation state
    // Both tracks go to race selection for now
    // Tutorial ("The First Door") will be added in Phase 3
    router.push('/create/race');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Create Your{'\n'}Character</Text>
        <Text style={styles.subtitle}>
          Every legend begins with a single choice.
        </Text>

        <View style={styles.buttons}>
          <Pressable
            style={styles.trackButton}
            onPress={() => handleStart('veteran')}
          >
            <Text style={styles.trackTitle}>I KNOW D&D</Text>
            <Text style={styles.trackDesc}>
              Jump straight into character creation.
            </Text>
          </Pressable>

          <Pressable
            style={[styles.trackButton, styles.trackButtonAlt]}
            onPress={() => handleStart('new')}
          >
            <Text style={styles.trackTitle}>I'M NEW</Text>
            <Text style={styles.trackDesc}>
              A guided tutorial will teach you as you play.
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  title: {
    ...textStyles.screenTitle,
    color: colors.gold.primary,
    textAlign: 'center',
    fontSize: 28,
    lineHeight: 38,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontFamily: fonts.narrative,
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xxl + spacing.lg,
  },
  buttons: {
    gap: spacing.lg,
  },
  trackButton: {
    borderWidth: 1,
    borderColor: colors.gold.primary,
    borderRadius: 12,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.bg.secondary,
  },
  trackButtonAlt: {
    borderColor: colors.gold.dim,
  },
  trackTitle: {
    ...textStyles.buttonLabel,
    color: colors.gold.primary,
    fontSize: 14,
    marginBottom: spacing.xs,
  },
  trackDesc: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },
});
```

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit --skipLibCheck 2>&1 | head -20
```

**Step 3: Commit**

```bash
git add app/create/index.tsx
git commit -m "Add welcome/onboarding screen with dual-track selection"
```

---

### Task 10: Race Selection Screen

**Files:**
- Create: `app/create/race.tsx`

**Step 1: Create the race selection screen**

Scrollable list of 9 race cards. Each card shows the race name, description, ability bonuses, and traits. Tapping selects and navigates to class selection.

```typescript
// app/create/race.tsx
import React from 'react';
import {
  View, Text, Pressable, ScrollView, StyleSheet, SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/theme/colors';
import { fonts, spacing, textStyles } from '@/theme/typography';
import { useCharacterCreationStore } from '@/stores/useCharacterCreationStore';
import { RACE_LIST, type RaceData } from '@/data/races';
import type { RaceName } from '@/types/game';

function RaceCard({ race, selected, onPress }: { race: RaceData; selected: boolean; onPress: () => void }) {
  const bonusText = Object.entries(race.abilityBonuses)
    .map(([ability, bonus]) => `${ability.slice(0, 3).toUpperCase()} +${bonus}`)
    .join('  ');

  return (
    <Pressable
      style={[styles.card, selected && styles.cardSelected]}
      onPress={onPress}
    >
      <View style={styles.cardHeader}>
        <Text style={[styles.cardName, selected && styles.cardNameSelected]}>{race.name}</Text>
        <Text style={styles.cardSpeed}>{race.speed}ft</Text>
      </View>
      <Text style={styles.cardDesc}>{race.description}</Text>
      {bonusText ? <Text style={styles.cardBonuses}>{bonusText}</Text> : null}
      <View style={styles.traits}>
        {race.traits.map(t => (
          <Text key={t.name} style={styles.traitName}>{t.name}</Text>
        ))}
      </View>
    </Pressable>
  );
}

export default function RaceSelectionScreen() {
  const router = useRouter();
  const { race, setRace, setStep } = useCharacterCreationStore();

  const handleSelect = (raceId: RaceName) => {
    setRace(raceId);
  };

  const handleNext = () => {
    if (!race) return;
    setStep(1);
    router.push('/create/class');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.stepLabel}>STEP 1 OF 5</Text>
        <Text style={styles.title}>Choose Your Race</Text>
      </View>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {RACE_LIST.map(r => (
          <RaceCard
            key={r.id}
            race={r}
            selected={race === r.id}
            onPress={() => handleSelect(r.id)}
          />
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[styles.nextButton, !race && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={!race}
        >
          <Text style={styles.nextButtonText}>CONTINUE</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },
  header: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.md },
  stepLabel: { ...textStyles.sectionLabel, color: colors.text.tertiary, marginBottom: spacing.xs },
  title: { ...textStyles.screenTitle, color: colors.gold.primary, fontSize: 22 },
  list: { flex: 1 },
  listContent: { paddingHorizontal: spacing.xl, paddingBottom: spacing.lg, gap: spacing.md },
  card: {
    borderWidth: 1,
    borderColor: colors.gold.border,
    borderRadius: 10,
    padding: spacing.lg,
    backgroundColor: colors.bg.secondary,
  },
  cardSelected: {
    borderColor: colors.gold.primary,
    backgroundColor: colors.bg.tertiary,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  cardName: { ...textStyles.characterName, color: colors.text.primary, fontSize: 16 },
  cardNameSelected: { color: colors.gold.primary },
  cardSpeed: { fontFamily: fonts.headingRegular, fontSize: 11, color: colors.text.tertiary, letterSpacing: 1 },
  cardDesc: { fontFamily: fonts.body, fontSize: 13, color: colors.text.secondary, lineHeight: 19, marginBottom: spacing.sm },
  cardBonuses: { fontFamily: fonts.heading, fontSize: 11, color: colors.gold.muted, letterSpacing: 1, marginBottom: spacing.sm },
  traits: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  traitName: {
    fontFamily: fonts.headingRegular,
    fontSize: 10,
    color: colors.text.tertiary,
    borderWidth: 1,
    borderColor: colors.gold.border,
    borderRadius: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    letterSpacing: 0.5,
  },
  footer: { paddingHorizontal: spacing.xl, paddingBottom: spacing.lg, paddingTop: spacing.sm },
  nextButton: {
    backgroundColor: colors.gold.primary,
    paddingVertical: spacing.md + 2,
    borderRadius: 8,
    alignItems: 'center',
  },
  nextButtonDisabled: { opacity: 0.3 },
  nextButtonText: { ...textStyles.buttonLabel, color: colors.bg.primary, fontSize: 14, fontFamily: fonts.heading },
});
```

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit --skipLibCheck 2>&1 | head -20
```

**Step 3: Commit**

```bash
git add app/create/race.tsx
git commit -m "Add race selection screen with 9 race cards"
```

---

### Task 11: Class Selection Screen

**Files:**
- Create: `app/create/class.tsx`

**Step 1: Create the class selection screen**

Same pattern as race selection — scrollable cards for 12 classes showing name, description, hit die, primary ability, save proficiencies, and starting features.

The card should display: class name, description, hit die (e.g., "d10"), primary ability, save proficiencies, whether spellcaster, and level 1 features.

Follow the exact same component structure as `race.tsx`: SafeAreaView with header (STEP 2 OF 5 + title), ScrollView of cards, footer with CONTINUE button. Cards use the same styling patterns. Selected card uses `cardSelected` style.

Navigation: Back goes to race, forward goes to abilities.

**Important references:**
- `src/data/classes.ts` for `CLASS_LIST` and `ClassData`
- Store: `useCharacterCreationStore` → `className`, `setClass`, `setStep`
- Style patterns: Copy from `race.tsx` — same header/footer/card layout

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit --skipLibCheck 2>&1 | head -20
```

**Step 3: Commit**

```bash
git add app/create/class.tsx
git commit -m "Add class selection screen with 12 class cards"
```

---

### Task 12: Ability Score Assignment Screen

**Files:**
- Create: `app/create/abilities.tsx`

**Step 1: Create the ability score assignment screen**

Uses Standard Array (15, 14, 13, 12, 10, 8). Player assigns each score to an ability (STR, DEX, CON, INT, WIS, CHA). Shows race bonuses applied.

**Layout:**
- Header: "STEP 3 OF 5" + "Assign Ability Scores"
- Subtext: "Standard Array: 15, 14, 13, 12, 10, 8 — tap a score, then tap an ability."
- Available scores row: chips showing remaining unassigned values from the standard array
- 6 ability rows, each showing: ability name, assigned base score (or "—"), race bonus (e.g., "+2"), final total
- Tapping an ability row when a score chip is selected assigns that score; tapping an assigned ability clears it
- Skill selection section below: "Choose N skills" based on class `skillChoices.pick` and `skillChoices.from`
- Footer: CONTINUE button (enabled when all 6 scores assigned + correct number of skills selected)

**Key references:**
- `useCharacterCreationStore`: `abilityAssignment`, `setAbilityScore`, `clearAbilityScore`, `getAvailableScores`, `getFinalAbilityScores`, `selectedSkills`, `setSelectedSkills`, `canProceedFromAbilities`
- `RACES[race].abilityBonuses` for race bonus display
- `CLASSES[className].skillChoices` for skill selection
- `getModifier()` from `src/engine/character.ts` for showing modifier next to final score
- Store's `STANDARD_ARRAY` export

**Navigation:** Back → class, Forward → origin

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit --skipLibCheck 2>&1 | head -20
```

**Step 3: Commit**

```bash
git add app/create/abilities.tsx
git commit -m "Add ability score assignment screen with standard array"
```

---

### Task 13: Origin Story Selection Screen

**Files:**
- Create: `app/create/origin.tsx`

**Step 1: Create the origin story selection screen**

Displays 6 origin story cards plus a "Custom" option. Each card shows the origin name, description, and personal quest. Custom option shows a text input.

**Layout:**
- Header: "STEP 4 OF 5" + "Choose Your Origin"
- ScrollView of origin cards
- Each card: origin name (heading), description (body), personal quest line (italic), bonus skills tags
- "Write Your Own" card at the bottom with a TextInput
- Footer: CONTINUE button

**Key references:**
- `ORIGINS` from `src/data/origins.ts`
- `useCharacterCreationStore`: `originId`, `setOrigin`, `customOrigin`, `setCustomOrigin`
- Style patterns from `race.tsx`

**Navigation:** Back → abilities, Forward → summary

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit --skipLibCheck 2>&1 | head -20
```

**Step 3: Commit**

```bash
git add app/create/origin.tsx
git commit -m "Add origin story selection screen with 6 origins + custom"
```

---

### Task 14: Character Summary & Create Screen

**Files:**
- Create: `app/create/summary.tsx`

**Step 1: Create the summary/confirm screen**

Shows a review of the complete character before saving. Displays: name input field, race, class, ability scores with modifiers, selected skills, origin story, and starting equipment.

**Layout:**
- Header: "STEP 5 OF 5" + "Review & Name"
- Name input field (TextInput, gold-bordered, prominent)
- Summary sections: Race & Class, Ability Scores (6-column grid showing score + modifier), Skills, Origin, Starting Equipment, HP/AC
- Footer: "BEGIN ADVENTURE" button that saves the character to Supabase

**On submit ("BEGIN ADVENTURE"):**
1. Assemble full `Character` object using store state:
   - `getFinalAbilityScores()` for scores with race bonuses
   - `calculateMaxHP(className, 1, constitution)` for HP
   - `calculateAC(character)` for AC
   - `CLASSES[className].startingEquipment` for equipment
   - `CLASSES[className].saveProficiencies` for saves
   - `selectedSkills` for proficient skills (add race skill proficiencies too)
   - `getProficiencyBonus(1)` for proficiency bonus
   - Origin's `questFlags` mapped to `personalQuestFlags`
2. Call `createCharacter()` from `src/services/character.ts`
3. On success, navigate to `/game/session` (or `index` which routes there)
4. Show error toast on failure

**Key references:**
- `useCharacterCreationStore` for all creation state
- `src/services/character.ts` → `createCharacter()`
- `src/engine/character.ts` → `calculateMaxHP`, `calculateAC`, `getModifier`, `getProficiencyBonus`
- `src/data/races.ts` → `RACES` for race bonuses + skill proficiencies
- `src/data/classes.ts` → `CLASSES` for equipment, saves, skills
- `src/data/origins.ts` → `ORIGIN_MAP` for quest flags
- `getCurrentUserId()` from `src/services/supabase.ts`

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit --skipLibCheck 2>&1 | head -20
```

**Step 3: Commit**

```bash
git add app/create/summary.tsx
git commit -m "Add character summary screen with save to Supabase"
```

---

### Task 15: Final Verification

**Step 1: Verify all files exist**

```bash
echo "=== Data files ===" && ls -la src/data/*.ts
echo "=== Store ===" && ls -la src/stores/useCharacterCreationStore.ts
echo "=== Service ===" && ls -la src/services/character.ts
echo "=== Auth screens ===" && ls -la app/\(auth\)/*.tsx
echo "=== Create screens ===" && ls -la app/create/*.tsx
```

Expected: 3 data files, 1 store, 1 service, 2 auth files, 6 create files = **13 new files total**

**Step 2: Full TypeScript check**

```bash
npx tsc --noEmit --skipLibCheck 2>&1
```

Expected: No errors from our code

**Step 3: Visual verification in browser**

```bash
npx expo start --web
```

Navigate to `/` → should redirect to `/login` (since no auth session)
Navigate to `/create` → should show welcome screen
Navigate to `/create/race` → should show 9 race cards

**Step 4: Final commit if needed**

---

## Verification Checklist

- [ ] 3 data files (races, classes, origins) with complete D&D 5e data
- [ ] Character creation store with standard array assignment
- [ ] Character CRUD service with Supabase mapping
- [ ] Auth login/register screen with Supabase email auth
- [ ] Root index routing (auth → create → game)
- [ ] 5-step character creation flow (welcome → race → class → abilities → origin → summary)
- [ ] Character saved to Supabase on completion
- [ ] TypeScript compiles cleanly
- [ ] All files committed
