// ---------------------------------------------------------------------------
// Origin Feats (D&D 5e 2024 Rules)
// Level-1 feats granted by backgrounds. The game engine reads engineEffect
// to apply mechanical bonuses; the UI shows description + mechanicalEffect.
// ---------------------------------------------------------------------------

export interface FeatEngineEffect {
  type: 'stat_modifier' | 'resource' | 'proficiency' | 'special';
  hpPerLevel?: number;
  initiativeBonus?: number;
  luckPoints?: number;
  bonusSkillCount?: number;
  bonusProficiencies?: string[];
  healerKitDice?: string;
  rerollDamage?: boolean;
  toolProficiencies?: string[];
  description?: string;
}

export interface FeatData {
  id: string;
  name: string;
  description: string;
  mechanicalEffect: string;
  engineEffect: FeatEngineEffect;
}

export const FEATS: Record<string, FeatData> = {
  alert: {
    id: 'alert',
    name: 'Alert',
    description:
      'Your senses are razor-sharp. No ambush catches you off guard, and you act before most foes can even draw their weapons.',
    mechanicalEffect:
      'You cannot be surprised. +5 bonus to initiative. You can swap your initiative with a willing ally at the start of combat.',
    engineEffect: {
      type: 'stat_modifier',
      initiativeBonus: 5,
      description: 'Cannot be surprised. May swap initiative with a willing ally.',
    },
  },

  crafter: {
    id: 'crafter',
    name: 'Crafter',
    description:
      'You are a skilled artisan, comfortable with forge, loom, and workbench alike. Your practiced hands turn raw materials into reliable gear at a fraction of the usual cost.',
    mechanicalEffect:
      'Gain proficiency with three artisan tools of your choice. You craft nonmagical items at a 20% discount and can repair an item to full condition during a long rest (one item per day).',
    engineEffect: {
      type: 'proficiency',
      toolProficiencies: ['artisan_tool_1', 'artisan_tool_2', 'artisan_tool_3'],
      description:
        'Craft items at 20% discount. Repair one item to full condition per long rest.',
    },
  },

  healer: {
    id: 'healer',
    name: 'Healer',
    description:
      'You have trained in the arts of battlefield medicine. Where others see only blood and ruin, you see wounds that can be closed and lives that can be saved.',
    mechanicalEffect:
      "Use a Healer's Kit to stabilize a creature and restore 1 HP, or restore 1d6 + 4 + the target's number of Hit Dice in HP. Each creature can benefit from this healing once per short rest.",
    engineEffect: {
      type: 'resource',
      healerKitDice: '1d6+4+targetHD',
      description:
        "Healer's Kit: stabilize + 1 HP, or restore 1d6+4+target HD HP (once per short rest per creature).",
    },
  },

  lucky: {
    id: 'lucky',
    name: 'Lucky',
    description:
      'Fortune bends around you like light around a star. When fate turns against you, you simply refuse to accept the outcome.',
    mechanicalEffect:
      'You have 3 luck points that recharge on a long rest. Spend a point to gain advantage on an attack roll, ability check, or saving throw, or to impose disadvantage on an attack roll made against you.',
    engineEffect: {
      type: 'resource',
      luckPoints: 3,
      description:
        'Spend a luck point: advantage on your d20 roll, or disadvantage on an attacker targeting you.',
    },
  },

  magic_initiate_cleric: {
    id: 'magic_initiate_cleric',
    name: 'Magic Initiate (Cleric)',
    description:
      'Through quiet devotion or a brush with the divine, you have unlocked the first sparks of holy magic. Prayers that once went unanswered now carry real power.',
    mechanicalEffect:
      'Learn 2 cleric cantrips and 1 1st-level cleric spell (Wisdom casting). You can cast the 1st-level spell once per long rest without a spell slot, or with any available spell slots.',
    engineEffect: {
      type: 'special',
      description:
        'Grants 2 cleric cantrips + 1 1st-level cleric spell (WIS). Free cast 1/long rest or use spell slots.',
    },
  },

  magic_initiate_druid: {
    id: 'magic_initiate_druid',
    name: 'Magic Initiate (Druid)',
    description:
      'The natural world has whispered its secrets to you. Vines bend at your will, and the wind carries the faintest traces of primal magic in your voice.',
    mechanicalEffect:
      'Learn 2 druid cantrips and 1 1st-level druid spell (Wisdom casting). You can cast the 1st-level spell once per long rest without a spell slot, or with any available spell slots.',
    engineEffect: {
      type: 'special',
      description:
        'Grants 2 druid cantrips + 1 1st-level druid spell (WIS). Free cast 1/long rest or use spell slots.',
    },
  },

  magic_initiate_wizard: {
    id: 'magic_initiate_wizard',
    name: 'Magic Initiate (Wizard)',
    description:
      'You have pored over arcane texts and glimpsed the fundamental equations that govern reality. A handful of spells now answer to your intellect alone.',
    mechanicalEffect:
      'Learn 2 wizard cantrips and 1 1st-level wizard spell (Intelligence casting). You can cast the 1st-level spell once per long rest without a spell slot, or with any available spell slots.',
    engineEffect: {
      type: 'special',
      description:
        'Grants 2 wizard cantrips + 1 1st-level wizard spell (INT). Free cast 1/long rest or use spell slots.',
    },
  },

  musician: {
    id: 'musician',
    name: 'Musician',
    description:
      'Your melodies lift weary spirits and steel trembling resolve. After a moment of rest, your music can rouse even the most exhausted companions to face what lies ahead.',
    mechanicalEffect:
      'Gain proficiency with three musical instruments of your choice. After finishing a short or long rest, you can play a song to give Inspiration to a number of allies equal to your proficiency bonus.',
    engineEffect: {
      type: 'special',
      toolProficiencies: ['musical_instrument_1', 'musical_instrument_2', 'musical_instrument_3'],
      description:
        'After a short/long rest, grant Inspiration to PB number of allies.',
    },
  },

  savage_attacker: {
    id: 'savage_attacker',
    name: 'Savage Attacker',
    description:
      'You strike with a ferocity that borders on reckless. Each swing of your weapon seeks the most punishing angle, turning glancing blows into devastating hits.',
    mechanicalEffect:
      'Once per turn when you deal damage with a melee weapon, you can reroll the weapon damage dice and use either result.',
    engineEffect: {
      type: 'special',
      rerollDamage: true,
      description: 'Once per turn, reroll melee weapon damage dice and use either result.',
    },
  },

  skilled: {
    id: 'skilled',
    name: 'Skilled',
    description:
      'You are a quick study with a wide range of talents. Whether it is picking a lock, reading a star chart, or calming a spooked horse, you always seem to have the right knack.',
    mechanicalEffect:
      'Gain proficiency in 3 skills of your choice.',
    engineEffect: {
      type: 'proficiency',
      bonusSkillCount: 3,
      description: 'Choose 3 additional skill proficiencies.',
    },
  },

  tavern_brawler: {
    id: 'tavern_brawler',
    name: 'Tavern Brawler',
    description:
      'You have been in more fistfights than you can count, and you have learned to turn anything within arm\'s reach into a weapon. Chairs, bottles, your own bare knuckles — all equally deadly.',
    mechanicalEffect:
      'Proficiency with improvised weapons and unarmed strikes. Your unarmed strike deals 1d4 + STR modifier damage. When you roll a 1 on a damage die for an unarmed strike, you can reroll it. On a hit, you can push the target 5 feet away.',
    engineEffect: {
      type: 'proficiency',
      bonusProficiencies: ['unarmed_strike', 'improvised_weapons'],
      description:
        'Unarmed strike: 1d4+STR, reroll 1s on damage, push target 5 ft on hit.',
    },
  },

  tough: {
    id: 'tough',
    name: 'Tough',
    description:
      'You are built to endure. Where others falter and fall, you shrug off blows that would drop a lesser adventurer, standing firm through punishment that defies belief.',
    mechanicalEffect:
      'Your hit point maximum increases by 2 for every level you have. Whenever you gain a level, your HP maximum increases by an additional 2.',
    engineEffect: {
      type: 'stat_modifier',
      hpPerLevel: 2,
    },
  },
};

export const FEAT_LIST: FeatData[] = Object.values(FEATS);
