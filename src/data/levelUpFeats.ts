// ---------------------------------------------------------------------------
// Level-Up Feats (D&D 5e 2024 Rules)
// General feats available at ASI levels (4, 8, 12, 16, 19). These are NOT
// origin feats — they are the standard feats players choose instead of an
// Ability Score Increase.
// ---------------------------------------------------------------------------

import type { FeatData, FeatEngineEffect } from './feats';

export interface LevelUpFeat extends FeatData {
  prerequisite: {
    type: 'spellcaster' | 'heavy_armor' | 'martial_weapon' | 'none';
    description?: string;
  };
}

// Classes that have heavy armor proficiency by default
const HEAVY_ARMOR_CLASSES = ['fighter', 'paladin', 'cleric'];

// Classes flagged as spellcasters in classes.ts
const SPELLCASTER_CLASSES = [
  'bard',
  'cleric',
  'druid',
  'paladin',
  'ranger',
  'sorcerer',
  'warlock',
  'wizard',
  'artificer',
];

// Classes with martial weapon proficiency
const MARTIAL_WEAPON_CLASSES = [
  'barbarian',
  'fighter',
  'paladin',
  'ranger',
];

export const LEVEL_UP_FEATS: LevelUpFeat[] = [
  // ---- 1. Great Weapon Master ----
  {
    id: 'great_weapon_master',
    name: 'Great Weapon Master',
    description:
      'You have learned to channel the momentum of massive weapons into devastating strikes that cleave through armor and bone alike.',
    mechanicalEffect:
      'When you score a critical hit or reduce a creature to 0 HP with a melee weapon, you can make one melee weapon attack as a bonus action. Before making a melee attack with a heavy weapon you are proficient with, you can choose to take a -5 penalty to the attack roll. If the attack hits, you add +10 to the damage.',
    engineEffect: {
      type: 'special',
      description:
        'Crit/kill grants bonus action melee attack. Opt -5 attack / +10 damage with heavy weapons.',
    } as FeatEngineEffect,
    prerequisite: { type: 'martial_weapon', description: 'Proficiency with a martial weapon' },
  },

  // ---- 2. Sharpshooter ----
  {
    id: 'sharpshooter',
    name: 'Sharpshooter',
    description:
      'Your arrows fly true even when the odds say otherwise. Cover means nothing to you, and distance is merely a suggestion.',
    mechanicalEffect:
      'Attacking at long range does not impose disadvantage on your ranged weapon attack rolls. Your ranged weapon attacks ignore half cover and three-quarters cover. Before making a ranged weapon attack with a weapon you are proficient with, you can choose to take a -5 penalty to the attack roll. If the attack hits, you add +10 to the damage.',
    engineEffect: {
      type: 'special',
      description:
        'No disadvantage at long range. Ignore half/three-quarters cover. Opt -5 attack / +10 damage with ranged weapons.',
    } as FeatEngineEffect,
    prerequisite: { type: 'none' },
  },

  // ---- 3. War Caster ----
  {
    id: 'war_caster',
    name: 'War Caster',
    description:
      'You have trained to maintain your spells amidst the chaos of battle, weaving arcane gestures even with a blade and shield in hand.',
    mechanicalEffect:
      'You have advantage on Constitution saving throws to maintain concentration on a spell. You can perform somatic components of spells even when you have weapons or a shield in one or both hands. When a hostile creature provokes an opportunity attack from you, you can use your reaction to cast a spell at the creature instead of making a melee attack.',
    engineEffect: {
      type: 'special',
      description:
        'Advantage on concentration saves. Somatic components with hands full. Cast a spell as opportunity attack.',
    } as FeatEngineEffect,
    prerequisite: { type: 'spellcaster', description: 'The ability to cast at least one spell' },
  },

  // ---- 4. Resilient ----
  {
    id: 'resilient',
    name: 'Resilient',
    description:
      'Through relentless discipline you have hardened a weakness into a strength, shoring up a gap in your defenses that once left you vulnerable.',
    mechanicalEffect:
      'Increase one ability score of your choice by 1 (max 20). You gain proficiency in saving throws using the chosen ability.',
    engineEffect: {
      type: 'stat_modifier',
      description:
        '+1 to a chosen ability score. Gain saving throw proficiency in that ability.',
    } as FeatEngineEffect,
    prerequisite: { type: 'none' },
  },

  // ---- 5. Sentinel ----
  {
    id: 'sentinel',
    name: 'Sentinel',
    description:
      'You have mastered the art of locking down the battlefield. Enemies who try to slip past you or threaten your allies learn quickly that you do not let anything pass unchallenged.',
    mechanicalEffect:
      'When you hit a creature with an opportunity attack, its speed becomes 0 for the rest of the turn. Creatures within your reach provoke opportunity attacks from you even if they take the Disengage action. When a creature within 5 feet of you makes an attack against a target other than you, you can use your reaction to make a melee weapon attack against the attacking creature.',
    engineEffect: {
      type: 'special',
      description:
        'Opportunity attacks reduce target speed to 0. Disengage does not prevent your opportunity attacks. Reaction attack when adjacent creature attacks an ally.',
    } as FeatEngineEffect,
    prerequisite: { type: 'none' },
  },

  // ---- 6. Polearm Master ----
  {
    id: 'polearm_master',
    name: 'Polearm Master',
    description:
      'You keep foes at bay with sweeping strikes and punishing thrusts, turning the full length of your weapon into a deadly perimeter that few dare to cross.',
    mechanicalEffect:
      'When you take the Attack action with a glaive, halberd, quarterstaff, or spear, you can use a bonus action to make a melee attack with the butt end of the weapon (1d4 bludgeoning). When a creature enters the reach you have with a glaive, halberd, quarterstaff, or spear, you can use your reaction to make an opportunity attack against that creature.',
    engineEffect: {
      type: 'special',
      description:
        'Bonus action butt-end attack (1d4 bludgeoning). Opportunity attack when creatures enter your reach.',
    } as FeatEngineEffect,
    prerequisite: { type: 'none' },
  },

  // ---- 7. Crossbow Expert ----
  {
    id: 'crossbow_expert',
    name: 'Crossbow Expert',
    description:
      'Hours of drilling have made loading a crossbow second nature. You fire with lethal speed even when enemies are close enough to touch.',
    mechanicalEffect:
      'You ignore the loading property of crossbows you are proficient with. Being within 5 feet of a hostile creature does not impose disadvantage on your ranged attack rolls. When you use the Attack action with a one-handed weapon, you can use a bonus action to attack with a hand crossbow you are holding.',
    engineEffect: {
      type: 'special',
      description:
        'Ignore crossbow loading. No disadvantage on ranged attacks in melee. Bonus action hand crossbow attack.',
    } as FeatEngineEffect,
    prerequisite: { type: 'none' },
  },

  // ---- 8. Shield Master ----
  {
    id: 'shield_master',
    name: 'Shield Master',
    description:
      'Your shield is not just protection — it is a weapon. You slam foes off balance and hunker behind it when the world explodes around you.',
    mechanicalEffect:
      'If you take the Attack action, you can use a bonus action to shove a creature within 5 feet with your shield. If you are subjected to an effect that allows a DEX saving throw for half damage, you can use your reaction to add your shield\'s AC bonus to the save. On a successful save you take no damage instead of half.',
    engineEffect: {
      type: 'special',
      description:
        'Bonus action shield shove after Attack. Add shield AC bonus to DEX saves; success = no damage.',
    } as FeatEngineEffect,
    prerequisite: { type: 'none' },
  },

  // ---- 9. Spell Sniper ----
  {
    id: 'spell_sniper',
    name: 'Spell Sniper',
    description:
      'You have honed your combat spells for maximum reach and precision, threading bolts of energy through gaps in cover that would shield lesser casters\' targets.',
    mechanicalEffect:
      'When you cast a spell that requires an attack roll, the spell\'s range is doubled. Your ranged spell attacks ignore half cover and three-quarters cover. You learn one cantrip that requires an attack roll from any spell list (your choice of casting ability).',
    engineEffect: {
      type: 'special',
      description:
        'Double range on attack-roll spells. Ignore half/three-quarters cover. Learn one attack-roll cantrip.',
    } as FeatEngineEffect,
    prerequisite: { type: 'spellcaster', description: 'The ability to cast at least one spell' },
  },

  // ---- 10. Defensive Duelist ----
  {
    id: 'defensive_duelist',
    name: 'Defensive Duelist',
    description:
      'Your blade is never still. When an enemy swings, you parry with practiced grace, turning a killing blow into a narrow miss.',
    mechanicalEffect:
      'When you are wielding a finesse weapon with which you are proficient and another creature hits you with a melee attack, you can use your reaction to add your proficiency bonus to your AC for that attack, potentially causing it to miss.',
    engineEffect: {
      type: 'special',
      description:
        'Reaction: add proficiency bonus to AC against one melee attack (requires finesse weapon).',
    } as FeatEngineEffect,
    prerequisite: { type: 'none' },
  },

  // ---- 11. Dual Wielder ----
  {
    id: 'dual_wielder',
    name: 'Dual Wielder',
    description:
      'Two blades are better than one — you fight with a weapon in each hand, weaving offense and defense into a deadly dance of steel.',
    mechanicalEffect:
      'You gain +1 bonus to AC while you are wielding a separate melee weapon in each hand. You can use two-weapon fighting even when the one-handed melee weapons you are wielding are not light. You can draw or stow two one-handed weapons at once instead of only one.',
    engineEffect: {
      type: 'stat_modifier',
      description:
        '+1 AC when dual wielding. Two-weapon fighting with non-light one-handed melee weapons. Draw/stow two weapons at once.',
    } as FeatEngineEffect,
    prerequisite: { type: 'none' },
  },

  // ---- 12. Heavy Armor Master ----
  {
    id: 'heavy_armor_master',
    name: 'Heavy Armor Master',
    description:
      'Clad in steel, you shrug off blows that would fell lesser warriors. Mundane weapons barely scratch the surface of your impenetrable defenses.',
    mechanicalEffect:
      'While you are wearing heavy armor, bludgeoning, piercing, and slashing damage that you take from nonmagical weapons is reduced by 3.',
    engineEffect: {
      type: 'special',
      description:
        'Reduce nonmagical bludgeoning, piercing, and slashing damage by 3 while wearing heavy armor.',
    } as FeatEngineEffect,
    prerequisite: { type: 'heavy_armor', description: 'Proficiency with heavy armor' },
  },

  // ---- 13. Mage Slayer ----
  {
    id: 'mage_slayer',
    name: 'Mage Slayer',
    description:
      'You have trained to exploit the vulnerabilities of spellcasters. The moment arcane words leave their lips, your blade is already in motion.',
    mechanicalEffect:
      'When a creature within 5 feet of you casts a spell, you can use your reaction to make a melee weapon attack against that creature. When you damage a creature that is concentrating on a spell, that creature has disadvantage on the saving throw to maintain concentration. You have advantage on saving throws against spells cast by creatures within 5 feet of you.',
    engineEffect: {
      type: 'special',
      description:
        'Reaction melee attack when adjacent creature casts. Impose disadvantage on their concentration saves. Advantage on saves vs adjacent casters.',
    } as FeatEngineEffect,
    prerequisite: { type: 'none' },
  },

  // ---- 14. Mobile ----
  {
    id: 'mobile',
    name: 'Mobile',
    description:
      'You are exceptionally fleet of foot. You dart in, strike, and vanish before your enemies can retaliate — a blur of motion on the battlefield.',
    mechanicalEffect:
      'Your speed increases by 10 feet. When you use the Dash action, difficult terrain does not cost you extra movement. When you make a melee attack against a creature, you do not provoke opportunity attacks from that creature for the rest of the turn, whether you hit or not.',
    engineEffect: {
      type: 'stat_modifier',
      description:
        '+10 ft speed. Dash ignores difficult terrain. No opportunity attacks from creatures you melee attack.',
    } as FeatEngineEffect,
    prerequisite: { type: 'none' },
  },

  // ---- 15. Observant ----
  {
    id: 'observant',
    name: 'Observant',
    description:
      'Nothing escapes your notice. You read body language like an open book and catch whispered conversations across a crowded tavern with ease.',
    mechanicalEffect:
      'Increase your Intelligence or Wisdom score by 1 (max 20). You gain a +5 bonus to your passive Wisdom (Perception) and passive Intelligence (Investigation) scores. If you can see a creature\'s mouth while it is speaking a language you understand, you can read its lips.',
    engineEffect: {
      type: 'stat_modifier',
      description:
        '+1 INT or WIS. +5 passive Perception and Investigation. Can read lips.',
    } as FeatEngineEffect,
    prerequisite: { type: 'none' },
  },

  // ---- 16. Ritual Caster ----
  {
    id: 'ritual_caster',
    name: 'Ritual Caster',
    description:
      'You have unearthed the secrets of ritual magic, inscribing careful circles and chanting ancient invocations that bend reality without spending precious magical reserves.',
    mechanicalEffect:
      'You acquire a ritual book holding two 1st-level ritual spells of your choice from any class spell list (INT or WIS casting, chosen when you take the feat). You can cast these spells as rituals. When you find a spell with the ritual tag, you can add it to your book if it is of a level you can cast (up to half your level, rounded up).',
    engineEffect: {
      type: 'special',
      description:
        'Gain a ritual book with two 1st-level ritual spells. Can add more ritual spells found during adventures.',
    } as FeatEngineEffect,
    prerequisite: { type: 'none' },
  },

  // ---- 17. Actor ----
  {
    id: 'actor',
    name: 'Actor',
    description:
      'A born performer, you slip into other identities as easily as changing a cloak. Your silver tongue and uncanny mimicry make you a master of deception.',
    mechanicalEffect:
      'Increase your Charisma score by 1 (max 20). You have advantage on Charisma (Deception) and Charisma (Performance) checks when trying to pass yourself off as a different person. You can mimic the speech of another person or the sounds made by other creatures, requiring a successful Wisdom (Insight) check to identify as false.',
    engineEffect: {
      type: 'stat_modifier',
      description:
        '+1 CHA. Advantage on Deception/Performance to impersonate. Mimic voices and creature sounds.',
    } as FeatEngineEffect,
    prerequisite: { type: 'none' },
  },

  // ---- 18. Athlete ----
  {
    id: 'athlete',
    name: 'Athlete',
    description:
      'Years of physical training have honed your body into a finely tuned instrument. You vault over obstacles that halt others and leap distances that defy common sense.',
    mechanicalEffect:
      'Increase your Strength or Dexterity score by 1 (max 20). Standing up from prone costs only 5 feet of movement instead of half your speed. Climbing does not cost you extra movement. You can make a running long jump or running high jump after moving only 5 feet on foot rather than 10.',
    engineEffect: {
      type: 'stat_modifier',
      description:
        '+1 STR or DEX. Stand from prone costs 5 ft. No extra movement for climbing. Running jumps after 5 ft.',
    } as FeatEngineEffect,
    prerequisite: { type: 'none' },
  },

  // ---- 19. Inspiring Leader ----
  {
    id: 'inspiring_leader',
    name: 'Inspiring Leader',
    description:
      'Your words carry a weight that steel cannot match. A rousing speech from you fills your companions with courage so fierce it manifests as tangible resilience.',
    mechanicalEffect:
      'You can spend 10 minutes inspiring your companions, bolstering their resolve. When you do so, choose up to six friendly creatures (which can include yourself) within 30 feet of you who can see or hear you. Each creature gains temporary hit points equal to your level + your Charisma modifier. A creature cannot gain temporary hit points from this feat again until it finishes a short or long rest.',
    engineEffect: {
      type: 'resource',
      description:
        '10-min speech: up to 6 creatures gain temp HP = your level + CHA mod. Recharges per creature on short/long rest.',
    } as FeatEngineEffect,
    prerequisite: { type: 'none' },
  },

  // ---- 20. Tough ----
  {
    id: 'tough_levelup',
    name: 'Tough',
    description:
      'You are built to endure. Where others falter and fall, you shrug off blows that would drop a lesser adventurer, standing firm through punishment that defies belief.',
    mechanicalEffect:
      'Your hit point maximum increases by 2 for every level you have. Whenever you gain a level, your HP maximum increases by an additional 2.',
    engineEffect: {
      type: 'stat_modifier',
      hpPerLevel: 2,
    } as FeatEngineEffect,
    prerequisite: { type: 'none' },
  },
];

/** Filter feats to those the character qualifies for */
export function getFeatsForClass(
  className: string,
  isSpellcaster: boolean,
): LevelUpFeat[] {
  const classLower = className.toLowerCase();

  return LEVEL_UP_FEATS.filter((feat) => {
    switch (feat.prerequisite.type) {
      case 'spellcaster':
        return isSpellcaster || SPELLCASTER_CLASSES.includes(classLower);
      case 'heavy_armor':
        return HEAVY_ARMOR_CLASSES.includes(classLower);
      case 'martial_weapon':
        return MARTIAL_WEAPON_CLASSES.includes(classLower);
      case 'none':
        return true;
      default:
        return true;
    }
  });
}
