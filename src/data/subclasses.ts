// ---------------------------------------------------------------------------
// D&D 5e Subclass Definitions
// Comprehensive subclass data for all 13 classes. The game engine reads
// mechanicalEffect to apply bonuses; the UI shows name + description.
// ---------------------------------------------------------------------------

import type { ClassName } from '@/types/game';

export interface SubclassFeature {
  name: string;
  level: number;
  description: string;
  mechanicalEffect?: {
    type: 'damage_bonus' | 'ac_bonus' | 'spell_access' | 'resource' | 'proficiency' | 'resistance' | 'special';
    [key: string]: any;
  };
}

export interface SubclassDefinition {
  id: string;
  name: string;
  className: ClassName;
  description: string;
  features: SubclassFeature[];
}

// ─── Subclass Selection Levels ────────────────────────────────────────────
// The level at which each class chooses their subclass.
export const SUBCLASS_SELECTION_LEVEL: Record<ClassName, number> = {
  barbarian: 3,
  bard: 3,
  cleric: 1,
  druid: 2,
  fighter: 3,
  monk: 3,
  paladin: 3,
  ranger: 3,
  rogue: 3,
  sorcerer: 1,
  warlock: 1,
  wizard: 2,
  artificer: 3,
};

// ─── Barbarian Subclasses ─────────────────────────────────────────────────

const barbarianSubclasses: SubclassDefinition[] = [
  {
    id: 'path-of-the-berserker',
    name: 'Path of the Berserker',
    className: 'barbarian',
    description:
      'A barbarian who channels pure, unbridled fury. Berserkers enter a frenzied state that lets them attack with reckless abandon, though the toll on their body is severe.',
    features: [
      {
        name: 'Frenzy',
        level: 3,
        description:
          'When you rage, you can enter a frenzy. While frenzied, you can make a single melee weapon attack as a bonus action on each of your turns. When the rage ends, you suffer one level of exhaustion.',
        mechanicalEffect: {
          type: 'special',
          bonusAction: 'melee_attack',
          condition: 'raging',
          exhaustionOnEnd: 1,
        },
      },
      {
        name: 'Mindless Rage',
        level: 6,
        description:
          'You cannot be charmed or frightened while raging. If you are charmed or frightened when you enter rage, the effect is suspended for the duration.',
        mechanicalEffect: {
          type: 'resistance',
          immunities: ['charmed', 'frightened'],
          condition: 'raging',
        },
      },
      {
        name: 'Intimidating Presence',
        level: 10,
        description:
          'You can use your action to frighten a creature within 30 feet. The target must succeed on a Wisdom saving throw (DC 8 + proficiency + CHA mod) or be frightened until the end of your next turn.',
      },
      {
        name: 'Retaliation',
        level: 14,
        description:
          'When you take damage from a creature within 5 feet of you, you can use your reaction to make a melee weapon attack against that creature.',
        mechanicalEffect: {
          type: 'special',
          reaction: 'melee_attack_on_hit',
        },
      },
    ],
  },
  {
    id: 'path-of-the-totem-warrior',
    name: 'Path of the Totem Warrior',
    className: 'barbarian',
    description:
      'A barbarian who draws on the spiritual power of nature, channeling the essence of sacred animals. Each totem grants different strengths, allowing for versatile combat roles.',
    features: [
      {
        name: 'Spirit Seeker',
        level: 3,
        description:
          'You gain the ability to cast Beast Sense and Speak with Animals as rituals.',
        mechanicalEffect: {
          type: 'spell_access',
          ritualSpells: ['beast_sense', 'speak_with_animals'],
        },
      },
      {
        name: 'Totem Spirit',
        level: 3,
        description:
          'Choose a totem animal spirit. Bear: while raging, you have resistance to all damage except psychic. Eagle: while raging, opportunity attacks against you have disadvantage and you can Dash as a bonus action. Wolf: while raging, your allies have advantage on melee attacks against any creature within 5 feet of you.',
        mechanicalEffect: {
          type: 'resistance',
          options: {
            bear: { resistAll: true, except: 'psychic', condition: 'raging' },
            eagle: { dashBonusAction: true, oppAttackDisadvantage: true, condition: 'raging' },
            wolf: { allyAdvantageAdjacent: true, condition: 'raging' },
          },
        },
      },
      {
        name: 'Aspect of the Beast',
        level: 6,
        description:
          'Choose a totem animal for a passive benefit. Bear: carrying capacity doubles and you have advantage on STR checks to push, pull, lift, or break. Eagle: you can see up to 1 mile clearly and dim light does not impose disadvantage on Perception. Wolf: you can track at a fast pace and move stealthily at a normal pace.',
      },
      {
        name: 'Spirit Walker',
        level: 10,
        description:
          'You can cast Commune with Nature as a ritual. The spell manifests as a spiritual version of your totem animal.',
        mechanicalEffect: {
          type: 'spell_access',
          ritualSpells: ['commune_with_nature'],
        },
      },
      {
        name: 'Totemic Attunement',
        level: 14,
        description:
          'Choose a totem animal for a combat enhancement. Bear: creatures within 5 feet have disadvantage on attacks against your allies. Eagle: you gain a flying speed equal to your walking speed while raging. Wolf: when you hit a Large or smaller creature, you can knock it prone as a bonus action.',
      },
    ],
  },
  {
    id: 'path-of-the-zealot',
    name: 'Path of the Zealot',
    className: 'barbarian',
    description:
      'A barbarian fueled by divine wrath, fighting as an instrument of the gods. Zealots are nearly impossible to kill and deal devastating radiant or necrotic damage.',
    features: [
      {
        name: 'Divine Fury',
        level: 3,
        description:
          'While raging, the first creature you hit on each of your turns takes an extra 1d6 + half your barbarian level in radiant or necrotic damage (your choice).',
        mechanicalEffect: {
          type: 'damage_bonus',
          damage: '1d6+halfLevel',
          damageType: 'radiant_or_necrotic',
          condition: 'raging',
          frequency: 'first_hit_per_turn',
        },
      },
      {
        name: 'Warrior of the Gods',
        level: 3,
        description:
          'If a spell would restore you to life, the caster does not need to provide material components for the spell.',
        mechanicalEffect: {
          type: 'special',
          freeResurrection: true,
        },
      },
      {
        name: 'Fanatical Focus',
        level: 6,
        description:
          'If you fail a saving throw while raging, you can reroll it and must use the new roll. You can use this once per rage.',
        mechanicalEffect: {
          type: 'special',
          saveReroll: 1,
          condition: 'raging',
        },
      },
      {
        name: 'Zealous Presence',
        level: 10,
        description:
          'As a bonus action, you unleash a battle cry. Up to 10 creatures of your choice within 60 feet gain advantage on attack rolls and saving throws until the start of your next turn. Once per long rest.',
      },
      {
        name: 'Rage Beyond Death',
        level: 14,
        description:
          'While raging, dropping to 0 HP does not knock you unconscious. You still make death saving throws, and you only die if you fail three or your rage ends while at 0 HP.',
        mechanicalEffect: {
          type: 'special',
          rageAtZeroHp: true,
        },
      },
    ],
  },
];

// ─── Bard Subclasses ──────────────────────────────────────────────────────

const bardSubclasses: SubclassDefinition[] = [
  {
    id: 'college-of-lore',
    name: 'College of Lore',
    className: 'bard',
    description:
      'Bards of the College of Lore are masters of knowledge, collecting bits of lore from every source. They use their wide learning to undermine foes and bolster allies with razor-sharp wit.',
    features: [
      {
        name: 'Bonus Proficiencies',
        level: 3,
        description:
          'You gain proficiency in three skills of your choice.',
        mechanicalEffect: {
          type: 'proficiency',
          bonusSkillCount: 3,
        },
      },
      {
        name: 'Cutting Words',
        level: 3,
        description:
          'When a creature you can see within 60 feet makes an attack roll, ability check, or damage roll, you can expend a Bardic Inspiration die to subtract the result from the roll.',
        mechanicalEffect: {
          type: 'special',
          reaction: 'subtract_inspiration_die',
          targets: 'enemy_roll',
        },
      },
      {
        name: 'Additional Magical Secrets',
        level: 6,
        description:
          'You learn two spells from any class spell list. These count as bard spells for you.',
        mechanicalEffect: {
          type: 'spell_access',
          bonusSpells: 2,
          source: 'any_class',
        },
      },
      {
        name: 'Peerless Skill',
        level: 14,
        description:
          'When you make an ability check, you can expend a Bardic Inspiration die and add the result to the check. You can do this after rolling but before knowing if it succeeds.',
        mechanicalEffect: {
          type: 'special',
          selfInspiration: 'ability_check',
        },
      },
    ],
  },
  {
    id: 'college-of-valor',
    name: 'College of Valor',
    className: 'bard',
    description:
      'Bards of the College of Valor are bold skalds who keep the tales of great heroes alive. They wade into battle alongside warriors, their music steeling allies for the fight.',
    features: [
      {
        name: 'Bonus Proficiencies',
        level: 3,
        description:
          'You gain proficiency with medium armor, shields, and martial weapons.',
        mechanicalEffect: {
          type: 'proficiency',
          armorProficiencies: ['medium_armor', 'shields'],
          weaponProficiencies: ['martial_weapons'],
        },
      },
      {
        name: 'Combat Inspiration',
        level: 3,
        description:
          'A creature with your Bardic Inspiration die can add it to a weapon damage roll or to their AC against one attack, expending the die.',
        mechanicalEffect: {
          type: 'special',
          inspirationUse: ['damage_roll', 'ac_reaction'],
        },
      },
      {
        name: 'Extra Attack',
        level: 6,
        description:
          'You can attack twice instead of once when you take the Attack action on your turn.',
        mechanicalEffect: {
          type: 'special',
          extraAttack: 1,
        },
      },
      {
        name: 'Battle Magic',
        level: 14,
        description:
          'When you use your action to cast a bard spell, you can make one weapon attack as a bonus action.',
        mechanicalEffect: {
          type: 'special',
          bonusAction: 'weapon_attack_after_spell',
        },
      },
    ],
  },
  {
    id: 'college-of-glamour',
    name: 'College of Glamour',
    className: 'bard',
    description:
      'Bards of the College of Glamour learned their craft in the Feywild or under a fey tutor. Their performances are laced with enchanting fey magic that beguiles and inspires.',
    features: [
      {
        name: 'Mantle of Inspiration',
        level: 3,
        description:
          'As a bonus action, expend a Bardic Inspiration die. Up to 5 creatures you choose within 60 feet gain temporary HP equal to the die roll + your CHA modifier, and can immediately move up to their speed without provoking opportunity attacks.',
        mechanicalEffect: {
          type: 'special',
          tempHp: 'inspiration_die+CHA',
          targets: 5,
          freeMovement: true,
        },
      },
      {
        name: 'Enthralling Performance',
        level: 3,
        description:
          'After performing for at least 1 minute, you can charm a number of humanoids equal to your CHA modifier (minimum 1) who watched. They are charmed for 1 hour and regard you as a trusted friend.',
      },
      {
        name: 'Mantle of Majesty',
        level: 6,
        description:
          'As a bonus action, you take on a fey appearance for 1 minute. During this time, you can cast Command as a bonus action each turn without expending a spell slot. Once per long rest.',
        mechanicalEffect: {
          type: 'spell_access',
          freeSpell: 'command',
          castAs: 'bonus_action',
          duration: '1_minute',
          usesPerLongRest: 1,
        },
      },
      {
        name: 'Unbreakable Majesty',
        level: 14,
        description:
          'As a bonus action, you assume a magisterial presence for 1 minute. Any creature that attacks you for the first time on a turn must make a CHA save or choose a different target. On a failed save, the creature also has disadvantage on saves against your spells until end of your next turn.',
      },
    ],
  },
];

// ─── Cleric Subclasses ────────────────────────────────────────────────────

const clericSubclasses: SubclassDefinition[] = [
  {
    id: 'life-domain',
    name: 'Life Domain',
    className: 'cleric',
    description:
      'The Life Domain focuses on the positive energy that sustains all living things. Life clerics are unmatched healers, able to mend wounds with divine power.',
    features: [
      {
        name: 'Bonus Proficiency',
        level: 1,
        description:
          'You gain proficiency with heavy armor.',
        mechanicalEffect: {
          type: 'proficiency',
          armorProficiencies: ['heavy_armor'],
        },
      },
      {
        name: 'Disciple of Life',
        level: 1,
        description:
          'Your healing spells are more effective. Whenever you restore HP with a spell of 1st level or higher, the creature regains additional HP equal to 2 + the spell\'s level.',
        mechanicalEffect: {
          type: 'special',
          healingBonus: '2+spellLevel',
        },
      },
      {
        name: 'Domain Spells',
        level: 1,
        description:
          'You always have Bless and Cure Wounds prepared. At higher levels: Lesser Restoration, Spiritual Weapon (3rd), Beacon of Hope, Revivify (5th), Death Ward, Guardian of Faith (7th), Mass Cure Wounds, Raise Dead (9th).',
        mechanicalEffect: {
          type: 'spell_access',
          alwaysPrepared: {
            1: ['bless', 'cure_wounds'],
            3: ['lesser_restoration', 'spiritual_weapon'],
            5: ['beacon_of_hope', 'revivify'],
            7: ['death_ward', 'guardian_of_faith'],
            9: ['mass_cure_wounds', 'raise_dead'],
          },
        },
      },
      {
        name: 'Channel Divinity: Preserve Life',
        level: 2,
        description:
          'As an action, present your holy symbol and restore a total of 5 x cleric level HP, divided among creatures within 30 feet. You cannot restore a creature above half its max HP.',
        mechanicalEffect: {
          type: 'resource',
          healing: '5xLevel',
          range: 30,
          usesChannelDivinity: true,
        },
      },
      {
        name: 'Blessed Healer',
        level: 6,
        description:
          'When you cast a spell of 1st level or higher that restores HP to another creature, you also regain HP equal to 2 + the spell\'s level.',
        mechanicalEffect: {
          type: 'special',
          selfHealOnHeal: '2+spellLevel',
        },
      },
      {
        name: 'Divine Strike',
        level: 8,
        description:
          'Once per turn, when you hit a creature with a weapon attack, you deal an extra 1d8 radiant damage. This increases to 2d8 at level 14.',
        mechanicalEffect: {
          type: 'damage_bonus',
          damage: '1d8',
          damageType: 'radiant',
          frequency: 'once_per_turn',
          scalesAt: { 14: '2d8' },
        },
      },
      {
        name: 'Supreme Healing',
        level: 17,
        description:
          'When you would roll dice to restore HP with a healing spell, you instead use the maximum number for each die.',
        mechanicalEffect: {
          type: 'special',
          maxHealingDice: true,
        },
      },
    ],
  },
  {
    id: 'light-domain',
    name: 'Light Domain',
    className: 'cleric',
    description:
      'The Light Domain emphasizes the divine power of fire and radiance. Light clerics are aggressive spellcasters who burn away darkness and evil with scorching holy fire.',
    features: [
      {
        name: 'Bonus Cantrip',
        level: 1,
        description:
          'You learn the Light cantrip if you do not already know it.',
        mechanicalEffect: {
          type: 'spell_access',
          cantrips: ['light'],
        },
      },
      {
        name: 'Warding Flare',
        level: 1,
        description:
          'When a creature you can see within 30 feet attacks you or another creature, you can use your reaction to impose disadvantage on the attack. You can use this a number of times equal to your WIS modifier per long rest.',
        mechanicalEffect: {
          type: 'special',
          reaction: 'impose_disadvantage_on_attack',
          usesPerLongRest: 'WIS_modifier',
        },
      },
      {
        name: 'Domain Spells',
        level: 1,
        description:
          'You always have Burning Hands and Faerie Fire prepared. At higher levels: Flaming Sphere, Scorching Ray (3rd), Daylight, Fireball (5th), Guardian of Faith, Wall of Fire (7th), Flame Strike, Scrying (9th).',
        mechanicalEffect: {
          type: 'spell_access',
          alwaysPrepared: {
            1: ['burning_hands', 'faerie_fire'],
            3: ['flaming_sphere', 'scorching_ray'],
            5: ['daylight', 'fireball'],
            7: ['guardian_of_faith', 'wall_of_fire'],
            9: ['flame_strike', 'scrying'],
          },
        },
      },
      {
        name: 'Channel Divinity: Radiance of the Dawn',
        level: 2,
        description:
          'As an action, dispel magical darkness within 30 feet. Each hostile creature within 30 feet must make a CON save or take 2d10 + cleric level radiant damage, half on a success.',
        mechanicalEffect: {
          type: 'damage_bonus',
          damage: '2d10+level',
          damageType: 'radiant',
          save: 'constitution',
          usesChannelDivinity: true,
        },
      },
      {
        name: 'Improved Flare',
        level: 6,
        description:
          'You can use Warding Flare when a creature you can see within 30 feet attacks a creature other than you.',
      },
      {
        name: 'Potent Spellcasting',
        level: 8,
        description:
          'You add your WIS modifier to the damage of any cleric cantrip you cast.',
        mechanicalEffect: {
          type: 'damage_bonus',
          damage: 'WIS_modifier',
          appliesTo: 'cantrips',
        },
      },
      {
        name: 'Corona of Light',
        level: 17,
        description:
          'You can use an action to create a 60-foot aura of bright light. Enemies in the aura have disadvantage on saving throws against fire and radiant damage spells.',
      },
    ],
  },
  {
    id: 'war-domain',
    name: 'War Domain',
    className: 'cleric',
    description:
      'The War Domain grants power for decisive strikes and battlefield dominance. War clerics are armored champions of their god, equally skilled with prayer and blade.',
    features: [
      {
        name: 'Bonus Proficiencies',
        level: 1,
        description:
          'You gain proficiency with heavy armor and martial weapons.',
        mechanicalEffect: {
          type: 'proficiency',
          armorProficiencies: ['heavy_armor'],
          weaponProficiencies: ['martial_weapons'],
        },
      },
      {
        name: 'War Priest',
        level: 1,
        description:
          'When you use the Attack action, you can make one weapon attack as a bonus action. You can use this a number of times equal to your WIS modifier per long rest.',
        mechanicalEffect: {
          type: 'special',
          bonusAction: 'weapon_attack',
          usesPerLongRest: 'WIS_modifier',
        },
      },
      {
        name: 'Domain Spells',
        level: 1,
        description:
          'You always have Divine Favor and Shield of Faith prepared. At higher levels: Magic Weapon, Spiritual Weapon (3rd), Crusader\'s Mantle, Spirit Guardians (5th), Freedom of Movement, Stoneskin (7th), Flame Strike, Hold Monster (9th).',
        mechanicalEffect: {
          type: 'spell_access',
          alwaysPrepared: {
            1: ['divine_favor', 'shield_of_faith'],
            3: ['magic_weapon', 'spiritual_weapon'],
            5: ['crusaders_mantle', 'spirit_guardians'],
            7: ['freedom_of_movement', 'stoneskin'],
            9: ['flame_strike', 'hold_monster'],
          },
        },
      },
      {
        name: 'Channel Divinity: Guided Strike',
        level: 2,
        description:
          'When you make an attack roll, you can add +10 to the roll. You make this choice after seeing the roll but before the DM says whether it hits.',
        mechanicalEffect: {
          type: 'special',
          attackBonus: 10,
          usesChannelDivinity: true,
        },
      },
      {
        name: 'Channel Divinity: War God\'s Blessing',
        level: 6,
        description:
          'When a creature within 30 feet makes an attack roll, you can use your reaction to grant +10 to the roll, using your Channel Divinity.',
        mechanicalEffect: {
          type: 'special',
          reaction: 'grant_attack_bonus_10',
          usesChannelDivinity: true,
        },
      },
      {
        name: 'Divine Strike',
        level: 8,
        description:
          'Once per turn, when you hit a creature with a weapon attack, you deal an extra 1d8 damage of the weapon\'s type. This increases to 2d8 at level 14.',
        mechanicalEffect: {
          type: 'damage_bonus',
          damage: '1d8',
          damageType: 'weapon',
          frequency: 'once_per_turn',
          scalesAt: { 14: '2d8' },
        },
      },
      {
        name: 'Avatar of Battle',
        level: 17,
        description:
          'You have resistance to bludgeoning, piercing, and slashing damage from nonmagical attacks.',
        mechanicalEffect: {
          type: 'resistance',
          damageTypes: ['bludgeoning', 'piercing', 'slashing'],
          condition: 'nonmagical',
        },
      },
    ],
  },
  {
    id: 'tempest-domain',
    name: 'Tempest Domain',
    className: 'cleric',
    description:
      'The Tempest Domain channels the fury of storms, sea, and sky. Tempest clerics command thunder and lightning, punishing those who dare strike them with nature\'s wrath.',
    features: [
      {
        name: 'Bonus Proficiencies',
        level: 1,
        description:
          'You gain proficiency with heavy armor and martial weapons.',
        mechanicalEffect: {
          type: 'proficiency',
          armorProficiencies: ['heavy_armor'],
          weaponProficiencies: ['martial_weapons'],
        },
      },
      {
        name: 'Wrath of the Storm',
        level: 1,
        description:
          'When a creature within 5 feet hits you with an attack, you can use your reaction to force it to make a DEX save. It takes 2d8 lightning or thunder damage on a failure, half on a success. Uses equal to WIS modifier per long rest.',
        mechanicalEffect: {
          type: 'damage_bonus',
          damage: '2d8',
          damageType: 'lightning_or_thunder',
          trigger: 'reaction_when_hit',
          save: 'dexterity',
          usesPerLongRest: 'WIS_modifier',
        },
      },
      {
        name: 'Domain Spells',
        level: 1,
        description:
          'You always have Fog Cloud and Thunderwave prepared. At higher levels: Gust of Wind, Shatter (3rd), Call Lightning, Sleet Storm (5th), Control Water, Ice Storm (7th), Destructive Wave, Insect Plague (9th).',
        mechanicalEffect: {
          type: 'spell_access',
          alwaysPrepared: {
            1: ['fog_cloud', 'thunderwave'],
            3: ['gust_of_wind', 'shatter'],
            5: ['call_lightning', 'sleet_storm'],
            7: ['control_water', 'ice_storm'],
            9: ['destructive_wave', 'insect_plague'],
          },
        },
      },
      {
        name: 'Channel Divinity: Destructive Wrath',
        level: 2,
        description:
          'When you roll lightning or thunder damage, you can use Channel Divinity to deal maximum damage instead of rolling.',
        mechanicalEffect: {
          type: 'special',
          maxDamage: true,
          damageTypes: ['lightning', 'thunder'],
          usesChannelDivinity: true,
        },
      },
      {
        name: 'Thunderbolt Strike',
        level: 6,
        description:
          'When you deal lightning damage to a Large or smaller creature, you can push it up to 10 feet away from you.',
        mechanicalEffect: {
          type: 'special',
          pushOnLightning: 10,
          maxSize: 'large',
        },
      },
      {
        name: 'Divine Strike',
        level: 8,
        description:
          'Once per turn, when you hit a creature with a weapon attack, you deal an extra 1d8 thunder damage. This increases to 2d8 at level 14.',
        mechanicalEffect: {
          type: 'damage_bonus',
          damage: '1d8',
          damageType: 'thunder',
          frequency: 'once_per_turn',
          scalesAt: { 14: '2d8' },
        },
      },
      {
        name: 'Stormborn',
        level: 17,
        description:
          'You have a flying speed equal to your walking speed whenever you are outdoors and not underground.',
        mechanicalEffect: {
          type: 'special',
          flyingSpeed: 'walking_speed',
          condition: 'outdoors',
        },
      },
    ],
  },
];

// ─── Druid Subclasses ─────────────────────────────────────────────────────

const druidSubclasses: SubclassDefinition[] = [
  {
    id: 'circle-of-the-land',
    name: 'Circle of the Land',
    className: 'druid',
    description:
      'Druids of the Circle of the Land are mystics and sages who safeguard ancient knowledge. They draw extra power from the terrain they are attuned to, gaining access to an expanded spell list.',
    features: [
      {
        name: 'Bonus Cantrip',
        level: 2,
        description:
          'You learn one additional druid cantrip of your choice.',
        mechanicalEffect: {
          type: 'spell_access',
          bonusCantrips: 1,
        },
      },
      {
        name: 'Natural Recovery',
        level: 2,
        description:
          'During a short rest, you can recover spell slots with a combined level equal to or less than half your druid level (rounded up). You cannot recover slots of 6th level or higher. Once per long rest.',
        mechanicalEffect: {
          type: 'resource',
          spellSlotRecovery: 'halfLevel_rounded_up',
          maxSlotLevel: 5,
          usesPerLongRest: 1,
        },
      },
      {
        name: 'Circle Spells',
        level: 2,
        description:
          'Your mystical connection to the land grants you access to certain spells based on the terrain you are attuned to (Arctic, Coast, Desert, Forest, Grassland, Mountain, Swamp, or Underdark). These spells are always prepared and do not count against your prepared spell limit.',
        mechanicalEffect: {
          type: 'spell_access',
          terrainBased: true,
          alwaysPrepared: true,
        },
      },
      {
        name: 'Land\'s Stride',
        level: 6,
        description:
          'Moving through nonmagical difficult terrain costs you no extra movement. You can also pass through nonmagical plants without being slowed or taking damage. You have advantage on saves against magically created or manipulated plants.',
      },
      {
        name: 'Nature\'s Ward',
        level: 10,
        description:
          'You cannot be charmed or frightened by elementals or fey, and you are immune to poison and disease.',
        mechanicalEffect: {
          type: 'resistance',
          immunities: ['charmed_by_fey_elemental', 'frightened_by_fey_elemental', 'poison', 'disease'],
        },
      },
      {
        name: 'Nature\'s Sanctuary',
        level: 14,
        description:
          'Beasts and plant creatures that attack you must make a WIS save against your spell save DC. On a failure, the creature must choose a different target or the attack misses. On a success, the creature is immune to this effect for 24 hours.',
      },
    ],
  },
  {
    id: 'circle-of-the-moon',
    name: 'Circle of the Moon',
    className: 'druid',
    description:
      'Druids of the Circle of the Moon are fierce shapeshifters. They can transform into powerful beasts in the heat of battle, making them formidable frontline combatants.',
    features: [
      {
        name: 'Combat Wild Shape',
        level: 2,
        description:
          'You can use Wild Shape as a bonus action rather than an action. While in beast form, you can expend a spell slot to regain 1d8 HP per level of the spell slot expended.',
        mechanicalEffect: {
          type: 'special',
          wildShapeAs: 'bonus_action',
          healInWildShape: '1d8_per_slot_level',
        },
      },
      {
        name: 'Circle Forms',
        level: 2,
        description:
          'You can transform into beasts with a CR as high as 1 (no flying or swimming speed restriction). At 6th level this increases to CR equal to druid level divided by 3, rounded down.',
        mechanicalEffect: {
          type: 'special',
          maxWildShapeCR: 1,
          scalesAt: { 6: 'level/3' },
        },
      },
      {
        name: 'Primal Strike',
        level: 6,
        description:
          'Your attacks in beast form count as magical for the purpose of overcoming resistance and immunity to nonmagical attacks.',
        mechanicalEffect: {
          type: 'special',
          magicalBeastAttacks: true,
        },
      },
      {
        name: 'Elemental Wild Shape',
        level: 10,
        description:
          'You can expend two uses of Wild Shape to transform into an air, earth, fire, or water elemental.',
        mechanicalEffect: {
          type: 'special',
          elementalForms: ['air_elemental', 'earth_elemental', 'fire_elemental', 'water_elemental'],
          wildShapeCost: 2,
        },
      },
      {
        name: 'Thousand Forms',
        level: 14,
        description:
          'You can cast Alter Self at will without expending a spell slot.',
        mechanicalEffect: {
          type: 'spell_access',
          atWill: ['alter_self'],
        },
      },
    ],
  },
  {
    id: 'circle-of-the-shepherd',
    name: 'Circle of the Shepherd',
    className: 'druid',
    description:
      'Druids of the Circle of the Shepherd commune with the spirits of nature, calling upon totemic animal spirits to aid and protect their allies and summoned creatures.',
    features: [
      {
        name: 'Speech of the Woods',
        level: 2,
        description:
          'You learn Sylvan and can communicate with beasts. Beasts can understand your speech and you can decipher their noises and motions.',
        mechanicalEffect: {
          type: 'proficiency',
          languages: ['sylvan'],
          beastCommunication: true,
        },
      },
      {
        name: 'Spirit Totem',
        level: 2,
        description:
          'As a bonus action, you summon an incorporeal spirit to a point within 60 feet, creating a 30-foot aura for 1 minute. Bear Spirit: you and allies gain temp HP equal to 5 + druid level, and allies have advantage on STR checks and saves. Hawk Spirit: allies have advantage on attack rolls against targets in the aura. Unicorn Spirit: allies have advantage on ability checks to detect creatures, and healing spells you cast heal each creature in the aura for your druid level in HP.',
        mechanicalEffect: {
          type: 'special',
          bonusAction: 'summon_spirit_totem',
          options: {
            bear: { tempHp: '5+druidLevel', allyStrAdvantage: true },
            hawk: { allyAttackAdvantage: true },
            unicorn: { bonusHealing: 'druidLevel' },
          },
        },
      },
      {
        name: 'Mighty Summoner',
        level: 6,
        description:
          'Beasts and fey you conjure with spells gain +2 HP per Hit Die and their natural weapons count as magical.',
        mechanicalEffect: {
          type: 'special',
          summonBonus: { hpPerHD: 2, magicalAttacks: true },
        },
      },
      {
        name: 'Guardian Spirit',
        level: 10,
        description:
          'Beasts and fey you have summoned or created with spells regain HP equal to half your druid level at the end of each of their turns in your spirit totem aura.',
        mechanicalEffect: {
          type: 'special',
          summonRegeneration: 'halfDruidLevel',
          condition: 'in_totem_aura',
        },
      },
      {
        name: 'Faithful Summons',
        level: 14,
        description:
          'If you are reduced to 0 HP or incapacitated, you can immediately summon four beasts of CR 2 or lower within 20 feet. They act on your initiative and defend you. Once per long rest.',
        mechanicalEffect: {
          type: 'special',
          emergencySummon: { count: 4, maxCR: 2 },
          trigger: 'reduced_to_0hp',
          usesPerLongRest: 1,
        },
      },
    ],
  },
];

// ─── Fighter Subclasses ───────────────────────────────────────────────────

const fighterSubclasses: SubclassDefinition[] = [
  {
    id: 'champion',
    name: 'Champion',
    className: 'fighter',
    description:
      'The Champion focuses on raw physical power honed to deadly perfection. Champions rely on simple but devastating improvements to their martial prowess.',
    features: [
      {
        name: 'Improved Critical',
        level: 3,
        description:
          'Your weapon attacks score a critical hit on a roll of 19 or 20.',
        mechanicalEffect: {
          type: 'special',
          critRange: 19,
        },
      },
      {
        name: 'Remarkable Athlete',
        level: 7,
        description:
          'Add half your proficiency bonus (rounded up) to any STR, DEX, or CON check you make that does not already use your proficiency bonus. Your running long jump distance increases by a number of feet equal to your STR modifier.',
        mechanicalEffect: {
          type: 'special',
          halfProfBonus: ['strength_check', 'dexterity_check', 'constitution_check'],
        },
      },
      {
        name: 'Additional Fighting Style',
        level: 10,
        description:
          'You gain a second Fighting Style of your choice.',
        mechanicalEffect: {
          type: 'special',
          additionalFightingStyle: true,
        },
      },
      {
        name: 'Superior Critical',
        level: 15,
        description:
          'Your weapon attacks score a critical hit on a roll of 18, 19, or 20.',
        mechanicalEffect: {
          type: 'special',
          critRange: 18,
        },
      },
      {
        name: 'Survivor',
        level: 18,
        description:
          'At the start of each of your turns, you regain HP equal to 5 + your CON modifier if you have no more than half your max HP and at least 1 HP.',
        mechanicalEffect: {
          type: 'special',
          regeneration: '5+CON_modifier',
          condition: 'below_half_hp',
        },
      },
    ],
  },
  {
    id: 'battle-master',
    name: 'Battle Master',
    className: 'fighter',
    description:
      'Battle Masters are expert tacticians who use special combat maneuvers to control the battlefield. Every strike is calculated, every movement deliberate.',
    features: [
      {
        name: 'Combat Superiority',
        level: 3,
        description:
          'You learn three maneuvers of your choice (e.g., Trip Attack, Riposte, Precision Attack). You gain four superiority dice (d8) that fuel these maneuvers. You regain all expended dice on a short or long rest. You learn two additional maneuvers at 7th, 10th, and 15th level. Dice become d10 at 10th level and d12 at 18th.',
        mechanicalEffect: {
          type: 'resource',
          superiorityDice: 4,
          dieSize: 'd8',
          maneuvers: 3,
          rechargeOn: 'short_rest',
          scalesAt: {
            7: { maneuvers: 5, dice: 5 },
            10: { maneuvers: 7, dice: 5, dieSize: 'd10' },
            15: { maneuvers: 9, dice: 6, dieSize: 'd10' },
            18: { maneuvers: 9, dice: 6, dieSize: 'd12' },
          },
        },
      },
      {
        name: 'Student of War',
        level: 3,
        description:
          'You gain proficiency with one type of artisan\'s tools of your choice.',
        mechanicalEffect: {
          type: 'proficiency',
          toolProficiencies: ['artisan_tools_choice'],
        },
      },
      {
        name: 'Know Your Enemy',
        level: 7,
        description:
          'If you spend 1 minute observing or interacting with a creature outside combat, you learn if it is your equal, superior, or inferior in two characteristics of your choice (STR, DEX, CON, AC, current HP, total class levels, or fighter levels).',
      },
      {
        name: 'Improved Combat Superiority',
        level: 10,
        description:
          'Your superiority dice become d10s.',
        mechanicalEffect: {
          type: 'resource',
          dieSize: 'd10',
        },
      },
      {
        name: 'Relentless',
        level: 15,
        description:
          'When you roll initiative and have no superiority dice remaining, you regain one superiority die.',
        mechanicalEffect: {
          type: 'resource',
          regainOnInitiative: 1,
        },
      },
    ],
  },
  {
    id: 'eldritch-knight',
    name: 'Eldritch Knight',
    className: 'fighter',
    description:
      'Eldritch Knights combine martial prowess with arcane magic. They use wizard spells to enhance their combat abilities, protecting themselves with abjuration and striking with evocation.',
    features: [
      {
        name: 'Spellcasting',
        level: 3,
        description:
          'You learn two cantrips and three 1st-level spells from the wizard spell list (primarily abjuration and evocation). You use Intelligence as your spellcasting ability. You learn additional spells as you level.',
        mechanicalEffect: {
          type: 'spell_access',
          spellList: 'wizard',
          castingAbility: 'intelligence',
          cantrips: 2,
          knownSpells: 3,
          schools: ['abjuration', 'evocation'],
        },
      },
      {
        name: 'Weapon Bond',
        level: 3,
        description:
          'You bond with up to two weapons through a 1-hour ritual. You cannot be disarmed of a bonded weapon and can summon it to your hand as a bonus action from any distance, as long as it is on the same plane.',
        mechanicalEffect: {
          type: 'special',
          bondedWeapons: 2,
          cannotBeDisarmed: true,
        },
      },
      {
        name: 'War Magic',
        level: 7,
        description:
          'When you use your action to cast a cantrip, you can make one weapon attack as a bonus action.',
        mechanicalEffect: {
          type: 'special',
          bonusAction: 'weapon_attack_after_cantrip',
        },
      },
      {
        name: 'Eldritch Strike',
        level: 10,
        description:
          'When you hit a creature with a weapon attack, the creature has disadvantage on its next saving throw against a spell you cast before the end of your next turn.',
        mechanicalEffect: {
          type: 'special',
          saveDisadvantageOnHit: true,
        },
      },
      {
        name: 'Arcane Charge',
        level: 15,
        description:
          'When you use Action Surge, you can teleport up to 30 feet to an unoccupied space you can see. You can teleport before or after the additional action.',
        mechanicalEffect: {
          type: 'special',
          teleportOnActionSurge: 30,
        },
      },
      {
        name: 'Improved War Magic',
        level: 18,
        description:
          'When you use your action to cast a spell (not just a cantrip), you can make one weapon attack as a bonus action.',
        mechanicalEffect: {
          type: 'special',
          bonusAction: 'weapon_attack_after_spell',
        },
      },
    ],
  },
];

// ─── Monk Subclasses ──────────────────────────────────────────────────────

const monkSubclasses: SubclassDefinition[] = [
  {
    id: 'way-of-the-open-hand',
    name: 'Way of the Open Hand',
    className: 'monk',
    description:
      'Monks of the Way of the Open Hand are the ultimate masters of martial arts combat. They use ki-powered strikes to knock enemies prone, push them away, or prevent them from reacting.',
    features: [
      {
        name: 'Open Hand Technique',
        level: 3,
        description:
          'When you hit a creature with a Flurry of Blows attack, you can impose one effect: it must succeed on a DEX save or be knocked prone; it must make a STR save or be pushed up to 15 feet away; or it cannot take reactions until the end of your next turn.',
        mechanicalEffect: {
          type: 'special',
          flurryEffect: {
            options: ['knockProne_DEX', 'push15_STR', 'noReactions'],
          },
        },
      },
      {
        name: 'Wholeness of Body',
        level: 6,
        description:
          'As an action, you regain HP equal to three times your monk level. Once per long rest.',
        mechanicalEffect: {
          type: 'resource',
          selfHeal: '3xMonkLevel',
          usesPerLongRest: 1,
        },
      },
      {
        name: 'Tranquility',
        level: 11,
        description:
          'At the end of a long rest, you gain the effect of a Sanctuary spell that lasts until the start of your next long rest. The saving throw DC equals 8 + WIS modifier + proficiency bonus.',
      },
      {
        name: 'Quivering Palm',
        level: 17,
        description:
          'When you hit a creature with an unarmed strike, you can spend 3 ki points to set up lethal vibrations. At any point within a number of days equal to your monk level, you can use an action to end the vibrations. The creature must make a CON save or drop to 0 HP. On a success, it takes 10d10 necrotic damage.',
        mechanicalEffect: {
          type: 'special',
          kiCost: 3,
          effect: 'quivering_palm',
          failDamage: 'reduce_to_0',
          successDamage: '10d10_necrotic',
        },
      },
    ],
  },
  {
    id: 'way-of-shadow',
    name: 'Way of Shadow',
    className: 'monk',
    description:
      'Monks of the Way of Shadow follow a tradition of stealth and subterfuge. They are ninja-like warriors who strike from darkness and vanish without a trace.',
    features: [
      {
        name: 'Shadow Arts',
        level: 3,
        description:
          'You can spend 2 ki points to cast Darkness, Darkvision, Pass without Trace, or Silence without material components. You also learn the Minor Illusion cantrip.',
        mechanicalEffect: {
          type: 'spell_access',
          kiSpells: {
            cost: 2,
            spells: ['darkness', 'darkvision', 'pass_without_trace', 'silence'],
          },
          cantrips: ['minor_illusion'],
        },
      },
      {
        name: 'Shadow Step',
        level: 6,
        description:
          'When you are in dim light or darkness, as a bonus action you can teleport up to 60 feet to an unoccupied space you can see that is also in dim light or darkness. You then have advantage on the first melee attack you make before the end of the turn.',
        mechanicalEffect: {
          type: 'special',
          bonusAction: 'teleport_60ft_shadows',
          advantageAfter: true,
        },
      },
      {
        name: 'Cloak of Shadows',
        level: 11,
        description:
          'When you are in dim light or darkness, you can use your action to become invisible. You remain invisible until you attack, cast a spell, or are in an area of bright light.',
        mechanicalEffect: {
          type: 'special',
          invisibility: true,
          condition: 'dim_light_or_darkness',
        },
      },
      {
        name: 'Opportunist',
        level: 17,
        description:
          'When a creature within 5 feet of you is hit by an attack made by a creature other than you, you can use your reaction to make a melee attack against that creature.',
        mechanicalEffect: {
          type: 'special',
          reaction: 'melee_attack_when_ally_hits_adjacent',
        },
      },
    ],
  },
  {
    id: 'way-of-the-four-elements',
    name: 'Way of the Four Elements',
    className: 'monk',
    description:
      'Monks of the Way of the Four Elements harness the power of the primal forces. They channel ki into devastating elemental attacks and defensive techniques.',
    features: [
      {
        name: 'Disciple of the Elements',
        level: 3,
        description:
          'You learn elemental disciplines that let you spend ki to cast spells and produce elemental effects. You start with Elemental Attunement and one other discipline of your choice (e.g., Fangs of the Fire Snake, Fist of Unbroken Air, Water Whip). You learn additional disciplines at 6th, 11th, and 17th level.',
        mechanicalEffect: {
          type: 'spell_access',
          kiCasting: true,
          disciplines: 2,
          scalesAt: { 6: 3, 11: 4, 17: 5 },
        },
      },
      {
        name: 'Elemental Attunement',
        level: 3,
        description:
          'You can use your action to create minor elemental effects: a harmless sensory effect, light or snuff a small flame, chill or warm up to 1 pound of material, or cause earth, fire, water, or mist to shape itself into a crude form for 1 minute.',
      },
      {
        name: 'Expanded Disciplines',
        level: 6,
        description:
          'You can choose from more powerful disciplines, including Clench of the North Wind (Hold Person, 3 ki), Gong of the Summit (Shatter, 3 ki), and others. Some disciplines can be empowered by spending additional ki points.',
        mechanicalEffect: {
          type: 'spell_access',
          additionalDisciplines: true,
          examples: ['hold_person', 'shatter'],
        },
      },
      {
        name: 'Greater Elemental Disciplines',
        level: 11,
        description:
          'You gain access to powerful disciplines such as Flames of the Phoenix (Fireball, 4 ki), Ride the Wind (Fly, 4 ki), and Mist Stance (Gaseous Form, 4 ki).',
        mechanicalEffect: {
          type: 'spell_access',
          additionalDisciplines: true,
          examples: ['fireball', 'fly', 'gaseous_form'],
        },
      },
      {
        name: 'Master of the Elements',
        level: 17,
        description:
          'You gain access to the most powerful elemental disciplines, including Breath of Winter (Cone of Cold, 6 ki), River of Hungry Flame (Wall of Fire, 5 ki), and Wave of Rolling Earth (Wall of Stone, 6 ki).',
        mechanicalEffect: {
          type: 'spell_access',
          additionalDisciplines: true,
          examples: ['cone_of_cold', 'wall_of_fire', 'wall_of_stone'],
        },
      },
    ],
  },
];

// ─── Paladin Subclasses ───────────────────────────────────────────────────

const paladinSubclasses: SubclassDefinition[] = [
  {
    id: 'oath-of-devotion',
    name: 'Oath of Devotion',
    className: 'paladin',
    description:
      'Paladins of the Oath of Devotion are the idealized knight, sworn to uphold justice, virtue, and order. They are holy champions who smite evil with divine radiance.',
    features: [
      {
        name: 'Oath Spells',
        level: 3,
        description:
          'You always have Protection from Evil and Good and Sanctuary prepared. At higher levels: Lesser Restoration, Zone of Truth (5th), Beacon of Hope, Dispel Magic (9th), Freedom of Movement, Guardian of Faith (13th), Commune, Flame Strike (17th).',
        mechanicalEffect: {
          type: 'spell_access',
          alwaysPrepared: {
            3: ['protection_from_evil_and_good', 'sanctuary'],
            5: ['lesser_restoration', 'zone_of_truth'],
            9: ['beacon_of_hope', 'dispel_magic'],
            13: ['freedom_of_movement', 'guardian_of_faith'],
            17: ['commune', 'flame_strike'],
          },
        },
      },
      {
        name: 'Channel Divinity: Sacred Weapon',
        level: 3,
        description:
          'As an action, imbue one weapon with holy energy for 1 minute. Add your CHA modifier to attack rolls with it, and the weapon emits 20 feet of bright light. The weapon counts as magical.',
        mechanicalEffect: {
          type: 'special',
          attackBonus: 'CHA_modifier',
          duration: '1_minute',
          magicalWeapon: true,
          usesChannelDivinity: true,
        },
      },
      {
        name: 'Channel Divinity: Turn the Unholy',
        level: 3,
        description:
          'As an action, each fiend and undead within 30 feet must make a WIS save or be turned for 1 minute.',
        mechanicalEffect: {
          type: 'special',
          turn: ['fiend', 'undead'],
          usesChannelDivinity: true,
        },
      },
      {
        name: 'Aura of Devotion',
        level: 7,
        description:
          'You and friendly creatures within 10 feet cannot be charmed while you are conscious. The range increases to 30 feet at 18th level.',
        mechanicalEffect: {
          type: 'resistance',
          immunities: ['charmed'],
          auraRange: 10,
          scalesAt: { 18: 30 },
        },
      },
      {
        name: 'Purity of Spirit',
        level: 15,
        description:
          'You are always under the effect of Protection from Evil and Good.',
        mechanicalEffect: {
          type: 'special',
          permanentEffect: 'protection_from_evil_and_good',
        },
      },
      {
        name: 'Holy Nimbus',
        level: 20,
        description:
          'As an action, you emanate an aura of sunlight for 1 minute. You emit 30 feet of bright light and 30 feet of dim light beyond that. Whenever an enemy starts its turn in the bright light, it takes 10 radiant damage. You have advantage on saves against spells cast by fiends and undead. Once per long rest.',
        mechanicalEffect: {
          type: 'damage_bonus',
          damage: 10,
          damageType: 'radiant',
          aura: 30,
          usesPerLongRest: 1,
        },
      },
    ],
  },
  {
    id: 'oath-of-vengeance',
    name: 'Oath of Vengeance',
    className: 'paladin',
    description:
      'Paladins of the Oath of Vengeance are relentless hunters of the wicked. They pursue sinners and monsters with single-minded focus, willing to sacrifice their own comfort to destroy great evil.',
    features: [
      {
        name: 'Oath Spells',
        level: 3,
        description:
          'You always have Bane and Hunter\'s Mark prepared. At higher levels: Hold Person, Misty Step (5th), Haste, Protection from Energy (9th), Banishment, Dimension Door (13th), Hold Monster, Scrying (17th).',
        mechanicalEffect: {
          type: 'spell_access',
          alwaysPrepared: {
            3: ['bane', 'hunters_mark'],
            5: ['hold_person', 'misty_step'],
            9: ['haste', 'protection_from_energy'],
            13: ['banishment', 'dimension_door'],
            17: ['hold_monster', 'scrying'],
          },
        },
      },
      {
        name: 'Channel Divinity: Abjure Enemy',
        level: 3,
        description:
          'As an action, choose one creature within 60 feet. It must make a WIS save or be frightened for 1 minute (0 speed). Fiends and undead have disadvantage on this save.',
        mechanicalEffect: {
          type: 'special',
          frighten: true,
          speed: 0,
          disadvantage: ['fiend', 'undead'],
          usesChannelDivinity: true,
        },
      },
      {
        name: 'Channel Divinity: Vow of Enmity',
        level: 3,
        description:
          'As a bonus action, choose a creature within 10 feet. You gain advantage on attack rolls against it for 1 minute.',
        mechanicalEffect: {
          type: 'special',
          advantageOnTarget: true,
          duration: '1_minute',
          usesChannelDivinity: true,
        },
      },
      {
        name: 'Relentless Avenger',
        level: 7,
        description:
          'When you hit a creature with an opportunity attack, you can move up to half your speed immediately after as part of the same reaction. This movement does not provoke opportunity attacks.',
      },
      {
        name: 'Soul of Vengeance',
        level: 15,
        description:
          'When a creature under your Vow of Enmity makes an attack, you can use your reaction to make a melee weapon attack against it.',
        mechanicalEffect: {
          type: 'special',
          reaction: 'attack_when_vow_target_attacks',
        },
      },
      {
        name: 'Avenging Angel',
        level: 20,
        description:
          'As an action, you transform for 1 hour. You gain a 60-foot flying speed, and an aura of menace in a 30-foot radius. Enemies that enter or start their turn in the aura must make a WIS save or be frightened for 1 minute. Once per long rest.',
        mechanicalEffect: {
          type: 'special',
          flyingSpeed: 60,
          frightenAura: 30,
          usesPerLongRest: 1,
        },
      },
    ],
  },
  {
    id: 'oath-of-the-ancients',
    name: 'Oath of the Ancients',
    className: 'paladin',
    description:
      'Paladins of the Oath of the Ancients are champions of the light against darkness, sworn to protect the beauty and vitality of the living world. They draw on the oldest forces of nature.',
    features: [
      {
        name: 'Oath Spells',
        level: 3,
        description:
          'You always have Ensnaring Strike and Speak with Animals prepared. At higher levels: Moonbeam, Misty Step (5th), Plant Growth, Protection from Energy (9th), Ice Storm, Stoneskin (13th), Commune with Nature, Tree Stride (17th).',
        mechanicalEffect: {
          type: 'spell_access',
          alwaysPrepared: {
            3: ['ensnaring_strike', 'speak_with_animals'],
            5: ['moonbeam', 'misty_step'],
            9: ['plant_growth', 'protection_from_energy'],
            13: ['ice_storm', 'stoneskin'],
            17: ['commune_with_nature', 'tree_stride'],
          },
        },
      },
      {
        name: 'Channel Divinity: Nature\'s Wrath',
        level: 3,
        description:
          'As an action, spectral vines spring up around a creature within 10 feet. It must succeed on a STR or DEX save (its choice) or be restrained. It repeats the save at the end of each of its turns.',
        mechanicalEffect: {
          type: 'special',
          restrain: true,
          save: 'strength_or_dexterity',
          usesChannelDivinity: true,
        },
      },
      {
        name: 'Channel Divinity: Turn the Faithless',
        level: 3,
        description:
          'As an action, each fey and fiend within 30 feet must make a WIS save or be turned for 1 minute.',
        mechanicalEffect: {
          type: 'special',
          turn: ['fey', 'fiend'],
          usesChannelDivinity: true,
        },
      },
      {
        name: 'Aura of Warding',
        level: 7,
        description:
          'You and friendly creatures within 10 feet have resistance to damage from spells. The range increases to 30 feet at 18th level.',
        mechanicalEffect: {
          type: 'resistance',
          damageTypes: ['spell_damage'],
          auraRange: 10,
          scalesAt: { 18: 30 },
        },
      },
      {
        name: 'Undying Sentinel',
        level: 15,
        description:
          'When you are reduced to 0 HP and not killed outright, you drop to 1 HP instead. Once per long rest. Additionally, you suffer no penalties of old age and cannot be aged magically.',
        mechanicalEffect: {
          type: 'special',
          dropTo1: true,
          usesPerLongRest: 1,
        },
      },
      {
        name: 'Elder Champion',
        level: 20,
        description:
          'As an action, you transform into a force of nature for 1 minute. You regain 10 HP at the start of each turn. Paladin spells you cast have no material components. Enemies within 10 feet have disadvantage on saves against your paladin spells and Channel Divinity. Once per long rest.',
        mechanicalEffect: {
          type: 'special',
          regeneration: 10,
          auraDisadvantage: 10,
          usesPerLongRest: 1,
        },
      },
    ],
  },
];

// ─── Ranger Subclasses ────────────────────────────────────────────────────

const rangerSubclasses: SubclassDefinition[] = [
  {
    id: 'hunter',
    name: 'Hunter',
    className: 'ranger',
    description:
      'Hunters are rangers who accept the grim duty of being civilization\'s first line of defense against the terrors of the wilderness. They specialize in hunting the most dangerous prey.',
    features: [
      {
        name: 'Hunter\'s Prey',
        level: 3,
        description:
          'Choose one: Colossus Slayer (once per turn, deal an extra 1d8 damage to a creature below its max HP), Giant Killer (use your reaction to attack a Large or larger creature within 5 feet that attacks you), or Horde Breaker (once per turn, make an additional attack against a different creature within 5 feet of the original target).',
        mechanicalEffect: {
          type: 'damage_bonus',
          options: {
            colossus_slayer: { damage: '1d8', condition: 'target_below_max_hp', frequency: 'once_per_turn' },
            giant_killer: { reaction: 'attack_large_attacker' },
            horde_breaker: { bonusAttack: 'different_adjacent_target', frequency: 'once_per_turn' },
          },
        },
      },
      {
        name: 'Defensive Tactics',
        level: 7,
        description:
          'Choose one: Escape the Horde (opportunity attacks against you are made with disadvantage), Multiattack Defense (when a creature hits you, you gain +4 AC against subsequent attacks from that creature for the rest of the turn), or Steel Will (you have advantage on saves against being frightened).',
        mechanicalEffect: {
          type: 'special',
          options: {
            escape_the_horde: { oppAttackDisadvantage: true },
            multiattack_defense: { acBonus: 4, condition: 'after_first_hit_same_creature' },
            steel_will: { advantageVsFrightened: true },
          },
        },
      },
      {
        name: 'Multiattack',
        level: 11,
        description:
          'Choose one: Volley (use your action to make a ranged attack against any number of creatures within 10 feet of a point you can see within range, making a separate attack roll for each) or Whirlwind Attack (use your action to make a melee attack against any number of creatures within 5 feet, making a separate attack roll for each).',
        mechanicalEffect: {
          type: 'special',
          options: {
            volley: { aoeRangedAttack: 10 },
            whirlwind: { aoeMeleeAttack: 5 },
          },
        },
      },
      {
        name: 'Superior Hunter\'s Defense',
        level: 15,
        description:
          'Choose one: Evasion (DEX saves for half damage instead deal no damage on success, half on failure), Stand Against the Tide (when a hostile creature misses you with a melee attack, you can redirect the attack to another creature within 5 feet), or Uncanny Dodge (when an attacker you can see hits you, you halve the attack\'s damage).',
        mechanicalEffect: {
          type: 'special',
          options: {
            evasion: { evasion: true },
            stand_against_tide: { redirectMiss: true },
            uncanny_dodge: { halveDamage: true },
          },
        },
      },
    ],
  },
  {
    id: 'beast-master',
    name: 'Beast Master',
    className: 'ranger',
    description:
      'Beast Masters form an extraordinary bond with a beast companion. Together, ranger and beast fight as one, the beast obeying the ranger\'s commands in perfect harmony.',
    features: [
      {
        name: 'Ranger\'s Companion',
        level: 3,
        description:
          'You gain a beast companion of CR 1/4 or lower (e.g., wolf, panther, hawk). It obeys your commands, acts on your turn, and adds your proficiency bonus to its AC, attack rolls, damage rolls, saves, and skills. Its HP equals its normal max or 4 times your ranger level, whichever is higher.',
        mechanicalEffect: {
          type: 'special',
          beastCompanion: true,
          maxCR: 0.25,
          hpFormula: 'max(normalHP, 4xRangerLevel)',
          addProfBonus: ['ac', 'attacks', 'damage', 'saves', 'skills'],
        },
      },
      {
        name: 'Exceptional Training',
        level: 7,
        description:
          'Your companion can Dash, Disengage, Dodge, or Help as a bonus action on its turn. Its attacks now count as magical for the purpose of overcoming resistance and immunity.',
        mechanicalEffect: {
          type: 'special',
          companionBonusActions: ['dash', 'disengage', 'dodge', 'help'],
          magicalAttacks: true,
        },
      },
      {
        name: 'Bestial Fury',
        level: 11,
        description:
          'Your companion can make two attacks when you command it to use the Attack action.',
        mechanicalEffect: {
          type: 'special',
          companionExtraAttack: 1,
        },
      },
      {
        name: 'Share Spells',
        level: 15,
        description:
          'When you cast a spell targeting yourself, you can also affect your companion if it is within 30 feet of you.',
        mechanicalEffect: {
          type: 'special',
          shareSpells: true,
          range: 30,
        },
      },
    ],
  },
  {
    id: 'gloom-stalker',
    name: 'Gloom Stalker',
    className: 'ranger',
    description:
      'Gloom Stalkers are at home in the darkest places. They ambush foes in the first round of combat and are nearly invisible in darkness, making them deadly scouts and ambushers.',
    features: [
      {
        name: 'Dread Ambusher',
        level: 3,
        description:
          'At the start of your first turn of each combat, your walking speed increases by 10 feet until the end of that turn. If you take the Attack action, you can make one additional weapon attack. If that attack hits, the target takes an extra 1d8 damage of the weapon\'s type.',
        mechanicalEffect: {
          type: 'damage_bonus',
          firstTurnSpeedBonus: 10,
          firstTurnBonusAttack: true,
          bonusDamage: '1d8',
          damageType: 'weapon',
        },
      },
      {
        name: 'Umbral Sight',
        level: 3,
        description:
          'You gain darkvision out to 60 feet (or +30 feet if you already have darkvision). You are also invisible to creatures that rely on darkvision to see you in darkness.',
        mechanicalEffect: {
          type: 'special',
          darkvision: 60,
          darkvisionBonus: 30,
          invisibleInDarkness: true,
        },
      },
      {
        name: 'Gloom Stalker Spells',
        level: 3,
        description:
          'You learn Disguise Self at 3rd, Rope Trick at 5th, Fear at 9th, Greater Invisibility at 13th, and Seeming at 17th level. These are always prepared and do not count against known spells.',
        mechanicalEffect: {
          type: 'spell_access',
          alwaysPrepared: {
            3: ['disguise_self'],
            5: ['rope_trick'],
            9: ['fear'],
            13: ['greater_invisibility'],
            17: ['seeming'],
          },
        },
      },
      {
        name: 'Iron Mind',
        level: 7,
        description:
          'You gain proficiency in WIS saving throws. If you already have it, you gain proficiency in INT or CHA saves instead.',
        mechanicalEffect: {
          type: 'proficiency',
          saveProficiency: 'wisdom',
        },
      },
      {
        name: 'Stalker\'s Flurry',
        level: 11,
        description:
          'Once per turn, when you miss with a weapon attack, you can make another weapon attack as part of the same action.',
        mechanicalEffect: {
          type: 'special',
          reattackOnMiss: true,
          frequency: 'once_per_turn',
        },
      },
      {
        name: 'Shadowy Dodge',
        level: 15,
        description:
          'When a creature makes an attack roll against you and does not have advantage, you can use your reaction to impose disadvantage on the roll.',
        mechanicalEffect: {
          type: 'special',
          reaction: 'impose_disadvantage_on_attack',
        },
      },
    ],
  },
];

// ─── Rogue Subclasses ─────────────────────────────────────────────────────

const rogueSubclasses: SubclassDefinition[] = [
  {
    id: 'thief',
    name: 'Thief',
    className: 'rogue',
    description:
      'Thieves are the classic rogues, focusing on stealth, agility, and deft hands. They are expert burglars and dungeon delvers who can use items faster than anyone else.',
    features: [
      {
        name: 'Fast Hands',
        level: 3,
        description:
          'You can use the bonus action granted by Cunning Action to make a Sleight of Hand check, use thieves\' tools to disarm a trap or open a lock, or take the Use an Object action.',
        mechanicalEffect: {
          type: 'special',
          bonusAction: ['sleight_of_hand', 'thieves_tools', 'use_object'],
        },
      },
      {
        name: 'Second-Story Work',
        level: 3,
        description:
          'Climbing no longer costs you extra movement. In addition, when you make a running jump, the distance you cover increases by a number of feet equal to your DEX modifier.',
        mechanicalEffect: {
          type: 'special',
          climbSpeed: 'normal',
          jumpBonus: 'DEX_modifier',
        },
      },
      {
        name: 'Supreme Sneak',
        level: 9,
        description:
          'You have advantage on Stealth checks if you move no more than half your speed on the same turn.',
        mechanicalEffect: {
          type: 'special',
          stealthAdvantage: true,
          condition: 'half_speed_or_less',
        },
      },
      {
        name: 'Use Magic Device',
        level: 13,
        description:
          'You can ignore all class, race, and level requirements on the use of magic items.',
        mechanicalEffect: {
          type: 'special',
          ignoreMagicItemRestrictions: true,
        },
      },
      {
        name: 'Thief\'s Reflexes',
        level: 17,
        description:
          'If you are not surprised, you can take two turns during the first round of any combat. You take your first turn at your normal initiative and your second turn at your initiative minus 10.',
        mechanicalEffect: {
          type: 'special',
          extraFirstRoundTurn: true,
          secondTurnInitiative: 'initiative-10',
        },
      },
    ],
  },
  {
    id: 'assassin',
    name: 'Assassin',
    className: 'rogue',
    description:
      'Assassins are masters of the lethal strike, trained in the arts of poison and disguise. They excel at eliminating targets before the fight even begins.',
    features: [
      {
        name: 'Bonus Proficiencies',
        level: 3,
        description:
          'You gain proficiency with the disguise kit and the poisoner\'s kit.',
        mechanicalEffect: {
          type: 'proficiency',
          toolProficiencies: ['disguise_kit', 'poisoner_kit'],
        },
      },
      {
        name: 'Assassinate',
        level: 3,
        description:
          'You have advantage on attack rolls against any creature that has not yet taken a turn in combat. In addition, any hit you score against a creature that is surprised is a critical hit.',
        mechanicalEffect: {
          type: 'special',
          advantageBeforeTargetTurn: true,
          autoCritOnSurprise: true,
        },
      },
      {
        name: 'Infiltration Expertise',
        level: 9,
        description:
          'You can spend seven days and 25 gp to create an ironclad false identity, complete with documentation, established acquaintances, and disguises.',
      },
      {
        name: 'Impostor',
        level: 13,
        description:
          'After spending at least three hours studying a person\'s speech, handwriting, and behavior, you can mimic them convincingly. Other creatures have disadvantage on checks to detect the deception.',
      },
      {
        name: 'Death Strike',
        level: 17,
        description:
          'When you hit a surprised creature, it must make a CON save (DC 8 + DEX modifier + proficiency bonus). On a failure, double the damage of your attack.',
        mechanicalEffect: {
          type: 'damage_bonus',
          doubleDamage: true,
          condition: 'target_surprised',
          save: 'constitution',
        },
      },
    ],
  },
  {
    id: 'arcane-trickster',
    name: 'Arcane Trickster',
    className: 'rogue',
    description:
      'Arcane Tricksters enhance their larcenous abilities with enchantment and illusion magic. They use invisible mage hands and subtle spells to outwit their foes.',
    features: [
      {
        name: 'Spellcasting',
        level: 3,
        description:
          'You learn three wizard spells (two must be enchantment or illusion) and two cantrips including Mage Hand. You use Intelligence as your spellcasting ability.',
        mechanicalEffect: {
          type: 'spell_access',
          spellList: 'wizard',
          castingAbility: 'intelligence',
          cantrips: 2,
          knownSpells: 3,
          schools: ['enchantment', 'illusion'],
          requiredCantrip: 'mage_hand',
        },
      },
      {
        name: 'Mage Hand Legerdemain',
        level: 3,
        description:
          'When you cast Mage Hand, you can make the hand invisible. You can use it to stow or retrieve objects from a creature\'s container, pick locks, or disarm traps at range. You can use the hand as a bonus action.',
        mechanicalEffect: {
          type: 'special',
          invisibleMageHand: true,
          bonusAction: 'mage_hand',
        },
      },
      {
        name: 'Magical Ambush',
        level: 9,
        description:
          'If you are hidden from a creature when you cast a spell on it, the creature has disadvantage on any saving throw it makes against the spell.',
        mechanicalEffect: {
          type: 'special',
          saveDisadvantageFromHidden: true,
        },
      },
      {
        name: 'Versatile Trickster',
        level: 13,
        description:
          'As a bonus action, you can designate a creature within 5 feet of your Mage Hand. You have advantage on attack rolls against that creature until the end of the turn.',
        mechanicalEffect: {
          type: 'special',
          bonusAction: 'mage_hand_advantage',
        },
      },
      {
        name: 'Spell Thief',
        level: 17,
        description:
          'When a creature casts a spell targeting you or including you in its area, you can use your reaction to force a save against your spell save DC. On a failure, the spell has no effect on you, and you steal the spell for 8 hours. Once per long rest.',
        mechanicalEffect: {
          type: 'special',
          stealSpell: true,
          duration: '8_hours',
          usesPerLongRest: 1,
        },
      },
    ],
  },
];

// ─── Sorcerer Subclasses ──────────────────────────────────────────────────

const sorcererSubclasses: SubclassDefinition[] = [
  {
    id: 'draconic-bloodline',
    name: 'Draconic Bloodline',
    className: 'sorcerer',
    description:
      'Your innate magic comes from draconic ancestry. Perhaps a dragon ancestor mingled with your bloodline, or you were blessed by a dragon god. Your power manifests as draconic features and elemental affinity.',
    features: [
      {
        name: 'Dragon Ancestor',
        level: 1,
        description:
          'Choose a type of dragon as your ancestor (e.g., Red/Gold for fire, Blue/Bronze for lightning, White/Silver for cold). You can speak, read, and write Draconic. Your CHA checks gain double proficiency bonus when interacting with dragons.',
        mechanicalEffect: {
          type: 'proficiency',
          languages: ['draconic'],
          doubleProficiency: 'charisma_dragons',
        },
      },
      {
        name: 'Draconic Resilience',
        level: 1,
        description:
          'Your HP maximum increases by 1 for each sorcerer level. Additionally, when you are not wearing armor, your AC equals 13 + your DEX modifier.',
        mechanicalEffect: {
          type: 'ac_bonus',
          unarmoredAC: '13+DEX',
          hpPerLevel: 1,
        },
      },
      {
        name: 'Elemental Affinity',
        level: 6,
        description:
          'When you cast a spell that deals damage of the type associated with your draconic ancestor, add your CHA modifier to one damage roll. You can also spend 1 sorcery point to gain resistance to that damage type for 1 hour.',
        mechanicalEffect: {
          type: 'damage_bonus',
          damage: 'CHA_modifier',
          damageType: 'draconic_ancestry',
          resistanceCost: 1,
        },
      },
      {
        name: 'Dragon Wings',
        level: 14,
        description:
          'You gain the ability to sprout dragon wings from your back as a bonus action. You gain a flying speed equal to your current speed. The wings last until you dismiss them.',
        mechanicalEffect: {
          type: 'special',
          flyingSpeed: 'walking_speed',
          bonusAction: 'sprout_wings',
        },
      },
      {
        name: 'Draconic Presence',
        level: 18,
        description:
          'As an action, spend 5 sorcery points to exude a 60-foot aura of awe or fear. Each hostile creature in the aura must make a WIS save or be charmed (awe) or frightened (fear) until the aura ends. The aura lasts for 1 minute and requires concentration.',
      },
    ],
  },
  {
    id: 'wild-magic',
    name: 'Wild Magic',
    className: 'sorcerer',
    description:
      'Your innate magic is untamed chaos. Wild Magic sorcerers draw power from the raw forces of reality, but their spells often trigger unpredictable and bizarre side effects.',
    features: [
      {
        name: 'Wild Magic Surge',
        level: 1,
        description:
          'Immediately after you cast a sorcerer spell of 1st level or higher, the DM can have you roll a d20. On a 1, you roll on the Wild Magic Surge table, creating a random magical effect.',
        mechanicalEffect: {
          type: 'special',
          surgeChance: '1_on_d20',
          trigger: 'after_casting',
        },
      },
      {
        name: 'Tides of Chaos',
        level: 1,
        description:
          'You can gain advantage on one attack roll, ability check, or saving throw. Once used, you regain this ability after a long rest, or when the DM triggers a Wild Magic Surge.',
        mechanicalEffect: {
          type: 'resource',
          advantage: true,
          usesPerLongRest: 1,
          rechargeOnSurge: true,
        },
      },
      {
        name: 'Bend Luck',
        level: 6,
        description:
          'When another creature you can see makes an attack roll, ability check, or saving throw, you can spend 2 sorcery points to roll 1d4 and add or subtract the result from the creature\'s roll.',
        mechanicalEffect: {
          type: 'special',
          sorceryPointCost: 2,
          modify: '1d4_add_or_subtract',
          reaction: true,
        },
      },
      {
        name: 'Controlled Chaos',
        level: 14,
        description:
          'Whenever you roll on the Wild Magic Surge table, you can roll twice and choose which effect occurs.',
        mechanicalEffect: {
          type: 'special',
          doubleSurgeRoll: true,
        },
      },
      {
        name: 'Spell Bombardment',
        level: 18,
        description:
          'When you roll damage for a spell and roll the highest number on any of the dice, you can roll that die again and add the additional roll to the damage. You can use this once per turn.',
        mechanicalEffect: {
          type: 'damage_bonus',
          explodingDice: true,
          frequency: 'once_per_turn',
        },
      },
    ],
  },
  {
    id: 'divine-soul',
    name: 'Divine Soul',
    className: 'sorcerer',
    description:
      'Your magic springs from a divine source, a blessed lineage, a celestial intervention, or an inner spark of the divine. You have access to both sorcerer and cleric spells.',
    features: [
      {
        name: 'Divine Magic',
        level: 1,
        description:
          'Your link to the divine allows you to learn spells from the cleric spell list in addition to the sorcerer spell list. When your Spellcasting feature lets you learn a sorcerer spell, you can also choose from the cleric spell list. You also learn an additional spell based on your affinity (Good: Cure Wounds, Evil: Inflict Wounds, Law: Bless, Chaos: Bane, Neutrality: Protection from Evil and Good).',
        mechanicalEffect: {
          type: 'spell_access',
          additionalSpellList: 'cleric',
          affinitySpell: {
            good: 'cure_wounds',
            evil: 'inflict_wounds',
            law: 'bless',
            chaos: 'bane',
            neutrality: 'protection_from_evil_and_good',
          },
        },
      },
      {
        name: 'Favored by the Gods',
        level: 1,
        description:
          'If you fail a saving throw or miss with an attack roll, you can add 2d4 to the total, potentially turning a failure into a success. Once per short or long rest.',
        mechanicalEffect: {
          type: 'special',
          bonus: '2d4',
          trigger: 'failed_save_or_missed_attack',
          usesPerShortRest: 1,
        },
      },
      {
        name: 'Empowered Healing',
        level: 6,
        description:
          'When you or an ally within 5 feet rolls dice to restore HP with a spell, you can spend 1 sorcery point to reroll any number of those dice once.',
        mechanicalEffect: {
          type: 'special',
          sorceryPointCost: 1,
          rerollHealing: true,
        },
      },
      {
        name: 'Otherworldly Wings',
        level: 14,
        description:
          'You can use a bonus action to manifest spectral wings that grant a flying speed of 30 feet. The wings can appear as eagle wings, bat wings, or dragonfly wings, reflecting your divine affinity.',
        mechanicalEffect: {
          type: 'special',
          flyingSpeed: 30,
          bonusAction: 'manifest_wings',
        },
      },
      {
        name: 'Unearthly Recovery',
        level: 18,
        description:
          'As a bonus action when you have less than half your max HP, you regain HP equal to half your max HP. Once per long rest.',
        mechanicalEffect: {
          type: 'resource',
          selfHeal: 'halfMaxHp',
          condition: 'below_half_hp',
          usesPerLongRest: 1,
        },
      },
    ],
  },
];

// ─── Warlock Subclasses ───────────────────────────────────────────────────

const warlockSubclasses: SubclassDefinition[] = [
  {
    id: 'the-fiend',
    name: 'The Fiend',
    className: 'warlock',
    description:
      'You have made a pact with a fiend from the Lower Planes of existence. Your patron might be a demon lord, an archdevil, or a pit fiend, granting you power drawn from dark and destructive forces.',
    features: [
      {
        name: 'Expanded Spell List',
        level: 1,
        description:
          'The Fiend lets you choose from an expanded spell list: Burning Hands, Command (1st), Blindness/Deafness, Scorching Ray (2nd), Fireball, Stinking Cloud (3rd), Fire Shield, Wall of Fire (4th), Flame Strike, Hallow (5th).',
        mechanicalEffect: {
          type: 'spell_access',
          expandedSpells: {
            1: ['burning_hands', 'command'],
            2: ['blindness_deafness', 'scorching_ray'],
            3: ['fireball', 'stinking_cloud'],
            4: ['fire_shield', 'wall_of_fire'],
            5: ['flame_strike', 'hallow'],
          },
        },
      },
      {
        name: 'Dark One\'s Blessing',
        level: 1,
        description:
          'When you reduce a hostile creature to 0 HP, you gain temporary HP equal to your CHA modifier + your warlock level (minimum 1).',
        mechanicalEffect: {
          type: 'special',
          tempHpOnKill: 'CHA+warlockLevel',
        },
      },
      {
        name: 'Dark One\'s Own Luck',
        level: 6,
        description:
          'When you make an ability check or saving throw, you can add a d10 to the roll. You can do this after seeing the initial roll but before the outcome is determined. Once per short or long rest.',
        mechanicalEffect: {
          type: 'special',
          bonus: '1d10',
          appliesTo: ['ability_check', 'saving_throw'],
          usesPerShortRest: 1,
        },
      },
      {
        name: 'Fiendish Resilience',
        level: 10,
        description:
          'When you finish a short or long rest, you can choose one damage type. You gain resistance to that type until you choose a different one. Damage from magical weapons or silver weapons ignores this resistance.',
        mechanicalEffect: {
          type: 'resistance',
          chooseOne: true,
          changesOnRest: true,
          ignoredBy: ['magical', 'silver'],
        },
      },
      {
        name: 'Hurl Through Hell',
        level: 14,
        description:
          'When you hit a creature with an attack, you can instantly transport it through the Lower Planes. The creature disappears and hurtles through a nightmare landscape. At the end of your next turn, it returns and takes 10d10 psychic damage if it is not a fiend. Once per long rest.',
        mechanicalEffect: {
          type: 'damage_bonus',
          damage: '10d10',
          damageType: 'psychic',
          removeFromPlay: true,
          usesPerLongRest: 1,
        },
      },
    ],
  },
  {
    id: 'the-archfey',
    name: 'The Archfey',
    className: 'warlock',
    description:
      'Your patron is a lord or lady of the fey, a being of immense power that resides in the twilight realm. Your magic is infused with the beguiling, enchanting power of the Feywild.',
    features: [
      {
        name: 'Expanded Spell List',
        level: 1,
        description:
          'The Archfey lets you choose from an expanded spell list: Faerie Fire, Sleep (1st), Calm Emotions, Phantasmal Force (2nd), Blink, Plant Growth (3rd), Dominate Beast, Greater Invisibility (4th), Dominate Person, Seeming (5th).',
        mechanicalEffect: {
          type: 'spell_access',
          expandedSpells: {
            1: ['faerie_fire', 'sleep'],
            2: ['calm_emotions', 'phantasmal_force'],
            3: ['blink', 'plant_growth'],
            4: ['dominate_beast', 'greater_invisibility'],
            5: ['dominate_person', 'seeming'],
          },
        },
      },
      {
        name: 'Fey Presence',
        level: 1,
        description:
          'As an action, you can cause each creature in a 10-foot cube originating from you to make a WIS save. On a failure, they are charmed or frightened by you (your choice) until the end of your next turn. Once per short or long rest.',
        mechanicalEffect: {
          type: 'special',
          aoe: '10ft_cube',
          effect: 'charmed_or_frightened',
          save: 'wisdom',
          usesPerShortRest: 1,
        },
      },
      {
        name: 'Misty Escape',
        level: 6,
        description:
          'When you take damage, you can use your reaction to turn invisible and teleport up to 60 feet. You remain invisible until the start of your next turn or until you attack or cast a spell. Once per short or long rest.',
        mechanicalEffect: {
          type: 'special',
          reaction: 'teleport_invisible',
          distance: 60,
          trigger: 'take_damage',
          usesPerShortRest: 1,
        },
      },
      {
        name: 'Beguiling Defenses',
        level: 10,
        description:
          'You are immune to being charmed. When another creature attempts to charm you, you can use your reaction to turn the charm back on them. The creature must succeed on a WIS save or be charmed by you for 1 minute.',
        mechanicalEffect: {
          type: 'resistance',
          immunities: ['charmed'],
          reflectCharm: true,
        },
      },
      {
        name: 'Dark Delirium',
        level: 14,
        description:
          'As an action, choose a creature within 60 feet. It must make a WIS save or be charmed or frightened for 1 minute. While affected, the creature believes it is lost in a misty realm, perceiving only the illusion. Once per short or long rest.',
        mechanicalEffect: {
          type: 'special',
          effect: 'charmed_or_frightened',
          illusoryRealm: true,
          save: 'wisdom',
          usesPerShortRest: 1,
        },
      },
    ],
  },
  {
    id: 'the-great-old-one',
    name: 'The Great Old One',
    className: 'warlock',
    description:
      'Your patron is a mysterious entity from the Far Realm or the spaces between the stars. Its motives are incomprehensible, and its knowledge is so alien that even the greatest scholars struggle to grasp it.',
    features: [
      {
        name: 'Expanded Spell List',
        level: 1,
        description:
          'The Great Old One lets you choose from an expanded spell list: Dissonant Whispers, Tasha\'s Hideous Laughter (1st), Detect Thoughts, Phantasmal Force (2nd), Clairvoyance, Sending (3rd), Dominate Beast, Evard\'s Black Tentacles (4th), Dominate Person, Telekinesis (5th).',
        mechanicalEffect: {
          type: 'spell_access',
          expandedSpells: {
            1: ['dissonant_whispers', 'tashas_hideous_laughter'],
            2: ['detect_thoughts', 'phantasmal_force'],
            3: ['clairvoyance', 'sending'],
            4: ['dominate_beast', 'evards_black_tentacles'],
            5: ['dominate_person', 'telekinesis'],
          },
        },
      },
      {
        name: 'Awakened Mind',
        level: 1,
        description:
          'You can telepathically speak to any creature you can see within 30 feet. You do not need to share a language, but the creature must understand at least one language.',
        mechanicalEffect: {
          type: 'special',
          telepathy: 30,
        },
      },
      {
        name: 'Entropic Ward',
        level: 6,
        description:
          'When a creature makes an attack roll against you, you can use your reaction to impose disadvantage on the roll. If the attack misses, your next attack roll against the creature has advantage, lasting until the end of your next turn. Once per short or long rest.',
        mechanicalEffect: {
          type: 'special',
          reaction: 'impose_disadvantage',
          advantageOnMiss: true,
          usesPerShortRest: 1,
        },
      },
      {
        name: 'Thought Shield',
        level: 10,
        description:
          'Your thoughts cannot be read by telepathy or other means unless you allow it. You also have resistance to psychic damage, and whenever a creature deals psychic damage to you, that creature takes the same amount.',
        mechanicalEffect: {
          type: 'resistance',
          damageTypes: ['psychic'],
          reflectDamage: 'psychic',
          telepathyImmunity: true,
        },
      },
      {
        name: 'Create Thrall',
        level: 14,
        description:
          'You can use your action to touch an incapacitated humanoid. It is charmed by you until a Remove Curse spell is cast, the condition is removed, or you use this feature again. You can communicate telepathically with the thrall across any distance (same plane).',
        mechanicalEffect: {
          type: 'special',
          charmThrall: true,
          telepathyUnlimited: true,
          condition: 'incapacitated_humanoid',
        },
      },
    ],
  },
];

// ─── Wizard Subclasses ────────────────────────────────────────────────────

const wizardSubclasses: SubclassDefinition[] = [
  {
    id: 'school-of-evocation',
    name: 'School of Evocation',
    className: 'wizard',
    description:
      'Evokers are masters of destructive arcane energy. They specialize in spells that create powerful elemental effects — fireballs, lightning bolts, and cones of cold that can reshape a battlefield.',
    features: [
      {
        name: 'Evocation Savant',
        level: 2,
        description:
          'The gold and time you must spend to copy an evocation spell into your spellbook is halved.',
        mechanicalEffect: {
          type: 'special',
          copyDiscount: 0.5,
          school: 'evocation',
        },
      },
      {
        name: 'Sculpt Spells',
        level: 2,
        description:
          'When you cast an evocation spell that affects other creatures you can see, you can choose a number of them equal to 1 + the spell\'s level. The chosen creatures automatically succeed on their saves against the spell and take no damage from it.',
        mechanicalEffect: {
          type: 'special',
          friendlyFire: false,
          protectedCreatures: '1+spellLevel',
        },
      },
      {
        name: 'Potent Cantrip',
        level: 6,
        description:
          'When a creature succeeds on a saving throw against your cantrip, the creature takes half the cantrip\'s damage (if any) but suffers no additional effect.',
        mechanicalEffect: {
          type: 'damage_bonus',
          cantripSaveHalfDamage: true,
        },
      },
      {
        name: 'Empowered Evocation',
        level: 10,
        description:
          'You add your INT modifier to one damage roll of any wizard evocation spell you cast.',
        mechanicalEffect: {
          type: 'damage_bonus',
          damage: 'INT_modifier',
          appliesTo: 'evocation_spells',
        },
      },
      {
        name: 'Overchannel',
        level: 14,
        description:
          'When you cast a wizard spell of 1st through 5th level that deals damage, you can deal maximum damage with that spell. The first time you use this, you suffer no ill effect. Each subsequent use before a long rest causes 2d12 necrotic damage per spell level (ignores resistance and immunity).',
        mechanicalEffect: {
          type: 'special',
          maxDamage: true,
          maxSpellLevel: 5,
          selfDamageOnReuse: '2d12_per_level',
        },
      },
    ],
  },
  {
    id: 'school-of-abjuration',
    name: 'School of Abjuration',
    className: 'wizard',
    description:
      'Abjurers are masters of protective magic. They specialize in wards, barriers, and banishment spells, shielding their allies and nullifying hostile magic.',
    features: [
      {
        name: 'Abjuration Savant',
        level: 2,
        description:
          'The gold and time you must spend to copy an abjuration spell into your spellbook is halved.',
        mechanicalEffect: {
          type: 'special',
          copyDiscount: 0.5,
          school: 'abjuration',
        },
      },
      {
        name: 'Arcane Ward',
        level: 2,
        description:
          'When you cast an abjuration spell of 1st level or higher, you create a magical ward that has HP equal to twice your wizard level + your INT modifier. Whenever you take damage, the ward takes the damage instead. When you cast an abjuration spell, the ward regains HP equal to twice the spell\'s level.',
        mechanicalEffect: {
          type: 'resource',
          wardHp: '2xWizardLevel+INT',
          wardRecharge: '2xSpellLevel',
          absorbsDamage: true,
        },
      },
      {
        name: 'Projected Ward',
        level: 6,
        description:
          'When a creature within 30 feet takes damage, you can use your reaction to cause your Arcane Ward to absorb the damage instead.',
        mechanicalEffect: {
          type: 'special',
          reaction: 'ward_absorb_ally_damage',
          range: 30,
        },
      },
      {
        name: 'Improved Abjuration',
        level: 10,
        description:
          'When you cast an abjuration spell that requires you to make an ability check (such as Counterspell or Dispel Magic), you add your proficiency bonus to the check.',
        mechanicalEffect: {
          type: 'special',
          profBonusToAbjurationChecks: true,
        },
      },
      {
        name: 'Spell Resistance',
        level: 14,
        description:
          'You have advantage on saving throws against spells. You have resistance to damage from spells.',
        mechanicalEffect: {
          type: 'resistance',
          advantageVsSpells: true,
          damageTypes: ['spell_damage'],
        },
      },
    ],
  },
  {
    id: 'school-of-divination',
    name: 'School of Divination',
    className: 'wizard',
    description:
      'Diviners peer into the future, uncovering secrets hidden from lesser minds. Their ability to manipulate fate makes them invaluable allies and unpredictable foes.',
    features: [
      {
        name: 'Divination Savant',
        level: 2,
        description:
          'The gold and time you must spend to copy a divination spell into your spellbook is halved.',
        mechanicalEffect: {
          type: 'special',
          copyDiscount: 0.5,
          school: 'divination',
        },
      },
      {
        name: 'Portent',
        level: 2,
        description:
          'When you finish a long rest, roll two d20s and record the numbers. You can replace any attack roll, saving throw, or ability check made by you or a creature you can see with one of these rolls. You must do so before the roll. Each portent roll can be used only once.',
        mechanicalEffect: {
          type: 'resource',
          portentDice: 2,
          replacesRoll: true,
          rechargeOn: 'long_rest',
          scalesAt: { 14: 3 },
        },
      },
      {
        name: 'Expert Divination',
        level: 6,
        description:
          'When you cast a divination spell of 2nd level or higher using a spell slot, you regain one expended spell slot. The slot must be of a level lower than the spell you cast and cannot be higher than 5th level.',
        mechanicalEffect: {
          type: 'resource',
          slotRecovery: 'lower_than_cast',
          maxRecoveredLevel: 5,
          trigger: 'divination_spell',
        },
      },
      {
        name: 'The Third Eye',
        level: 10,
        description:
          'As an action, you gain one of the following benefits until you take a short or long rest: Darkvision (60 feet), Ethereal Sight (see into the Ethereal Plane within 60 feet), Greater Comprehension (read any language), or See Invisibility (see invisible creatures and objects within 10 feet).',
        mechanicalEffect: {
          type: 'special',
          options: {
            darkvision: { range: 60 },
            etherealSight: { range: 60 },
            readLanguages: true,
            seeInvisibility: { range: 10 },
          },
        },
      },
      {
        name: 'Greater Portent',
        level: 14,
        description:
          'You roll three d20s for your Portent feature instead of two.',
        mechanicalEffect: {
          type: 'resource',
          portentDice: 3,
        },
      },
    ],
  },
];

// ─── Artificer Subclasses ─────────────────────────────────────────────────

const artificerSubclasses: SubclassDefinition[] = [
  {
    id: 'alchemist',
    name: 'Alchemist',
    className: 'artificer',
    description:
      'Alchemists are masters of chemical concoctions, brewing potions and elixirs that heal, transform, and empower. Their experimental elixirs provide versatile support on and off the battlefield.',
    features: [
      {
        name: 'Tool Proficiency',
        level: 3,
        description:
          'You gain proficiency with alchemist\'s supplies. If you already have this proficiency, you gain proficiency with another type of artisan\'s tools.',
        mechanicalEffect: {
          type: 'proficiency',
          toolProficiencies: ['alchemist_supplies'],
        },
      },
      {
        name: 'Alchemist Spells',
        level: 3,
        description:
          'You always have Healing Word and Ray of Sickness prepared. At higher levels: Flaming Sphere, Melf\'s Acid Arrow (5th), Gaseous Form, Mass Healing Word (9th), Blight, Death Ward (13th), Cloudkill, Raise Dead (17th).',
        mechanicalEffect: {
          type: 'spell_access',
          alwaysPrepared: {
            3: ['healing_word', 'ray_of_sickness'],
            5: ['flaming_sphere', 'melfs_acid_arrow'],
            9: ['gaseous_form', 'mass_healing_word'],
            13: ['blight', 'death_ward'],
            17: ['cloudkill', 'raise_dead'],
          },
        },
      },
      {
        name: 'Experimental Elixir',
        level: 3,
        description:
          'At the end of a long rest, you produce a magical elixir (random or chosen by spending a spell slot). Elixir effects include: Healing (2d4+INT HP), Swiftness (+10 ft speed for 1 hour), Resilience (+1 AC for 10 minutes), Boldness (1d4 bonus on attack rolls and saves for 1 minute), Flight (10-minute flying speed of 10 ft), or Transformation (change appearance as Alter Self for 10 minutes).',
        mechanicalEffect: {
          type: 'resource',
          elixirs: 1,
          rechargeOn: 'long_rest',
          options: ['healing', 'swiftness', 'resilience', 'boldness', 'flight', 'transformation'],
        },
      },
      {
        name: 'Alchemical Savant',
        level: 5,
        description:
          'When you cast a spell using alchemist\'s supplies as your focus, you add your INT modifier to one roll of the spell that restores HP or deals acid, fire, necrotic, or poison damage.',
        mechanicalEffect: {
          type: 'damage_bonus',
          damage: 'INT_modifier',
          appliesTo: ['healing', 'acid', 'fire', 'necrotic', 'poison'],
        },
      },
      {
        name: 'Restorative Reagents',
        level: 9,
        description:
          'You can cast Lesser Restoration without a spell slot a number of times equal to your INT modifier per long rest. Whenever a creature drinks an elixir you created, it gains temporary HP equal to 2d6 + your INT modifier.',
        mechanicalEffect: {
          type: 'special',
          freeCasts: { spell: 'lesser_restoration', uses: 'INT_modifier' },
          elixirTempHp: '2d6+INT',
        },
      },
      {
        name: 'Chemical Mastery',
        level: 15,
        description:
          'You gain resistance to acid and poison damage and immunity to the poisoned condition. You can cast Greater Restoration and Heal once each per long rest without a spell slot.',
        mechanicalEffect: {
          type: 'resistance',
          damageTypes: ['acid', 'poison'],
          immunities: ['poisoned'],
          freeCasts: ['greater_restoration', 'heal'],
        },
      },
    ],
  },
  {
    id: 'battle-smith',
    name: 'Battle Smith',
    className: 'artificer',
    description:
      'Battle Smiths are artificers who fight alongside a steel defender, a loyal construct companion. They combine martial prowess with arcane crafting, using Intelligence for their weapon attacks.',
    features: [
      {
        name: 'Tool Proficiency',
        level: 3,
        description:
          'You gain proficiency with smith\'s tools. If you already have this proficiency, you gain proficiency with another type of artisan\'s tools.',
        mechanicalEffect: {
          type: 'proficiency',
          toolProficiencies: ['smiths_tools'],
        },
      },
      {
        name: 'Battle Smith Spells',
        level: 3,
        description:
          'You always have Heroism and Shield prepared. At higher levels: Branding Smite, Warding Bond (5th), Aura of Vitality, Conjure Barrage (9th), Aura of Purity, Fire Shield (13th), Banishing Smite, Mass Cure Wounds (17th).',
        mechanicalEffect: {
          type: 'spell_access',
          alwaysPrepared: {
            3: ['heroism', 'shield'],
            5: ['branding_smite', 'warding_bond'],
            9: ['aura_of_vitality', 'conjure_barrage'],
            13: ['aura_of_purity', 'fire_shield'],
            17: ['banishing_smite', 'mass_cure_wounds'],
          },
        },
      },
      {
        name: 'Battle Ready',
        level: 3,
        description:
          'You gain proficiency with martial weapons. When you attack with a magic weapon, you can use your INT modifier instead of STR or DEX for attack and damage rolls.',
        mechanicalEffect: {
          type: 'proficiency',
          weaponProficiencies: ['martial_weapons'],
          intForAttacks: true,
          condition: 'magic_weapon',
        },
      },
      {
        name: 'Steel Defender',
        level: 3,
        description:
          'You construct a Steel Defender companion. It is friendly, obeys your commands, and acts on your initiative. It can use Deflect Attack as a reaction to impose disadvantage on an attack roll against a creature within 5 feet of it. Its HP equals 2 + INT modifier + 5 times your artificer level.',
        mechanicalEffect: {
          type: 'special',
          steelDefender: true,
          hpFormula: '2+INT+5xArtificerLevel',
          reaction: 'deflect_attack',
        },
      },
      {
        name: 'Extra Attack',
        level: 5,
        description:
          'You can attack twice instead of once when you take the Attack action on your turn.',
        mechanicalEffect: {
          type: 'special',
          extraAttack: 1,
        },
      },
      {
        name: 'Arcane Jolt',
        level: 9,
        description:
          'When you or your Steel Defender hits a target with a magic weapon attack, you can channel magical energy to deal an extra 2d6 force damage, or heal an ally within 30 feet for 2d6 HP. You can use this a number of times equal to your INT modifier per long rest.',
        mechanicalEffect: {
          type: 'damage_bonus',
          damage: '2d6',
          damageType: 'force',
          alternateHeal: '2d6',
          usesPerLongRest: 'INT_modifier',
          scalesAt: { 15: '4d6' },
        },
      },
      {
        name: 'Improved Defender',
        level: 15,
        description:
          'Your Arcane Jolt damage and healing increase to 4d6. Your Steel Defender gains a +2 bonus to AC, and its Deflect Attack deals 1d4 + INT modifier force damage to the attacker.',
        mechanicalEffect: {
          type: 'special',
          defenderAcBonus: 2,
          deflectDamage: '1d4+INT',
        },
      },
    ],
  },
  {
    id: 'artillerist',
    name: 'Artillerist',
    className: 'artificer',
    description:
      'Artillerists are masters of arcane artillery, specializing in destructive force channeled through magical cannons. They bring overwhelming firepower to the battlefield.',
    features: [
      {
        name: 'Tool Proficiency',
        level: 3,
        description:
          'You gain proficiency with woodcarver\'s tools. If you already have this proficiency, you gain proficiency with another type of artisan\'s tools.',
        mechanicalEffect: {
          type: 'proficiency',
          toolProficiencies: ['woodcarvers_tools'],
        },
      },
      {
        name: 'Artillerist Spells',
        level: 3,
        description:
          'You always have Shield and Thunderwave prepared. At higher levels: Scorching Ray, Shatter (5th), Fireball, Wind Wall (9th), Ice Storm, Wall of Fire (13th), Cone of Cold, Wall of Force (17th).',
        mechanicalEffect: {
          type: 'spell_access',
          alwaysPrepared: {
            3: ['shield', 'thunderwave'],
            5: ['scorching_ray', 'shatter'],
            9: ['fireball', 'wind_wall'],
            13: ['ice_storm', 'wall_of_fire'],
            17: ['cone_of_cold', 'wall_of_force'],
          },
        },
      },
      {
        name: 'Eldritch Cannon',
        level: 3,
        description:
          'As an action, you create a Small or Tiny magical cannon in an unoccupied space within 5 feet. It has AC 18 and HP equal to 5 times your artificer level. Choose its type: Flamethrower (15-ft cone, DEX save, 2d8 fire), Force Ballista (ranged attack, 2d8 force, push 5 ft), or Protector (1d8 + INT temp HP to allies within 10 ft). You can activate it as a bonus action on each turn.',
        mechanicalEffect: {
          type: 'special',
          cannon: true,
          options: {
            flamethrower: { damage: '2d8', damageType: 'fire', aoe: '15ft_cone', save: 'dexterity' },
            force_ballista: { damage: '2d8', damageType: 'force', push: 5 },
            protector: { tempHp: '1d8+INT', aoe: '10ft_radius' },
          },
          bonusAction: 'activate_cannon',
        },
      },
      {
        name: 'Arcane Firearm',
        level: 5,
        description:
          'You can use a wand, staff, or rod as your arcane firearm. When you cast an artificer spell through it, roll a d8 and add the result to one of the spell\'s damage rolls.',
        mechanicalEffect: {
          type: 'damage_bonus',
          damage: '1d8',
          appliesTo: 'artificer_spells',
        },
      },
      {
        name: 'Explosive Cannon',
        level: 9,
        description:
          'Your Eldritch Cannon damage increases by 1d8 (to 3d8 for Flamethrower and Force Ballista, 2d8+INT for Protector). You can also command the cannon to detonate as an action, dealing 3d8 force damage to creatures within 20 feet (DEX save for half).',
        mechanicalEffect: {
          type: 'damage_bonus',
          cannonDamageIncrease: '1d8',
          detonateDamage: '3d8',
          detonateRange: 20,
        },
      },
      {
        name: 'Fortified Position',
        level: 15,
        description:
          'You can now create two Eldritch Cannons with one action. You and allies within 10 feet of a cannon gain half cover (+2 AC and DEX saves).',
        mechanicalEffect: {
          type: 'ac_bonus',
          halfCover: true,
          acBonus: 2,
          dexSaveBonus: 2,
          range: 10,
          doubleCannon: true,
        },
      },
    ],
  },
];

// ─── Master Data Export ───────────────────────────────────────────────────

export const SUBCLASS_DATA: Record<string, SubclassDefinition[]> = {
  barbarian: barbarianSubclasses,
  bard: bardSubclasses,
  cleric: clericSubclasses,
  druid: druidSubclasses,
  fighter: fighterSubclasses,
  monk: monkSubclasses,
  paladin: paladinSubclasses,
  ranger: rangerSubclasses,
  rogue: rogueSubclasses,
  sorcerer: sorcererSubclasses,
  warlock: warlockSubclasses,
  wizard: wizardSubclasses,
  artificer: artificerSubclasses,
};

// ─── Helpers ──────────────────────────────────────────────────────────────

/**
 * Get all available subclass options for a given class.
 */
export function getSubclassesForClass(className: string): SubclassDefinition[] {
  return SUBCLASS_DATA[className] ?? [];
}

/**
 * Look up a single subclass by its ID across all classes.
 */
export function getSubclassById(subclassId: string): SubclassDefinition | undefined {
  for (const subclasses of Object.values(SUBCLASS_DATA)) {
    const found = subclasses.find((s) => s.id === subclassId);
    if (found) return found;
  }
  return undefined;
}

/**
 * Get features a character should have unlocked for their subclass at a given level.
 */
export function getUnlockedSubclassFeatures(
  subclassId: string,
  characterLevel: number,
): SubclassFeature[] {
  const subclass = getSubclassById(subclassId);
  if (!subclass) return [];
  return subclass.features.filter((f) => f.level <= characterLevel);
}
