// D&D 5e starting spell lists for character creation
// SRD-based cantrips and 1st-level spells per spellcasting class

import type { Spell, ClassName } from '@/types/game';

export interface ClassSpellConfig {
  cantripCount: number;       // How many cantrips to pick
  spellCount: number;         // How many 1st-level spells to pick (0 = computed for prepared casters)
  isPreparedCaster: boolean;  // Cleric/Druid: count = ability mod + level
  primaryAbility: 'wisdom' | 'intelligence' | 'charisma';
  cantrips: Spell[];
  spells: Spell[];
  recommendedCantrips: string[];  // Names of recommended cantrips
  recommendedSpells: string[];    // Names of recommended spells
}

// ── Shared cantrips (used by multiple classes) ────────────────────────────────

const LIGHT: Spell = { name: 'Light', level: 0, school: 'Evocation', castingTime: '1 action', range: 'Touch', duration: '1 hour', description: 'An object you touch sheds bright light in a 20-foot radius.', components: 'V, M' };
const MENDING: Spell = { name: 'Mending', level: 0, school: 'Transmutation', castingTime: '1 minute', range: 'Touch', duration: 'Instantaneous', description: 'Repair a single break or tear in an object you touch.', components: 'V, S, M' };
const PRESTIDIGITATION: Spell = { name: 'Prestidigitation', level: 0, school: 'Transmutation', castingTime: '1 action', range: '10 feet', duration: '1 hour', description: 'A minor magical trick — light, clean, warm, flavor, color, or small illusion.', components: 'V, S' };
const MINOR_ILLUSION: Spell = { name: 'Minor Illusion', level: 0, school: 'Illusion', castingTime: '1 action', range: '30 feet', duration: '1 minute', description: 'Create a sound or image of an object within range.', components: 'S, M' };
const FIRE_BOLT: Spell = { name: 'Fire Bolt', level: 0, school: 'Evocation', castingTime: '1 action', range: '120 feet', duration: 'Instantaneous', description: 'Hurl a mote of fire at a creature. 1d10 fire damage on hit.', components: 'V, S' };
const RAY_OF_FROST: Spell = { name: 'Ray of Frost', level: 0, school: 'Evocation', castingTime: '1 action', range: '60 feet', duration: 'Instantaneous', description: '1d8 cold damage and reduce target speed by 10 feet until your next turn.', components: 'V, S' };
const SHOCKING_GRASP: Spell = { name: 'Shocking Grasp', level: 0, school: 'Evocation', castingTime: '1 action', range: 'Touch', duration: 'Instantaneous', description: '1d8 lightning damage. Advantage vs targets in metal armor. No reactions until next turn.', components: 'V, S' };
const MAGE_HAND: Spell = { name: 'Mage Hand', level: 0, school: 'Conjuration', castingTime: '1 action', range: '30 feet', duration: '1 minute', description: 'A spectral hand appears that can manipulate objects up to 10 lbs.', components: 'V, S' };
const POISON_SPRAY: Spell = { name: 'Poison Spray', level: 0, school: 'Conjuration', castingTime: '1 action', range: '10 feet', duration: 'Instantaneous', description: 'Target makes CON save or takes 1d12 poison damage.', components: 'V, S' };
const SACRED_FLAME: Spell = { name: 'Sacred Flame', level: 0, school: 'Evocation', castingTime: '1 action', range: '60 feet', duration: 'Instantaneous', description: 'Target makes DEX save or takes 1d8 radiant damage. No cover benefit.', components: 'V, S' };
const THAUMATURGY: Spell = { name: 'Thaumaturgy', level: 0, school: 'Transmutation', castingTime: '1 action', range: '30 feet', duration: '1 minute', description: 'Minor divine wonder — boom your voice, flicker flames, tremor the ground.', components: 'V' };
const GUIDANCE: Spell = { name: 'Guidance', level: 0, school: 'Divination', castingTime: '1 action', range: 'Touch', duration: 'Concentration, 1 minute', description: 'Target adds 1d4 to one ability check before the spell ends.', components: 'V, S' };
const RESISTANCE: Spell = { name: 'Resistance', level: 0, school: 'Abjuration', castingTime: '1 action', range: 'Touch', duration: 'Concentration, 1 minute', description: 'Target adds 1d4 to one saving throw before the spell ends.', components: 'V, S, M' };
const SPARE_THE_DYING: Spell = { name: 'Spare the Dying', level: 0, school: 'Necromancy', castingTime: '1 action', range: 'Touch', duration: 'Instantaneous', description: 'Stabilize a creature at 0 HP.', components: 'V, S' };
const DRUIDCRAFT: Spell = { name: 'Druidcraft', level: 0, school: 'Transmutation', castingTime: '1 action', range: '30 feet', duration: 'Instantaneous', description: 'Minor nature effect — predict weather, bloom a flower, snuff a flame.', components: 'V, S' };
const PRODUCE_FLAME: Spell = { name: 'Produce Flame', level: 0, school: 'Conjuration', castingTime: '1 action', range: 'Self', duration: '10 minutes', description: 'A flame in your hand sheds light. Hurl it for 1d8 fire damage.', components: 'V, S' };
const SHILLELAGH: Spell = { name: 'Shillelagh', level: 0, school: 'Transmutation', castingTime: '1 bonus action', range: 'Touch', duration: '1 minute', description: 'Your club or staff uses your spellcasting ability and deals 1d8 damage.', components: 'V, S, M' };
const THORN_WHIP: Spell = { name: 'Thorn Whip', level: 0, school: 'Transmutation', castingTime: '1 action', range: '30 feet', duration: 'Instantaneous', description: '1d6 piercing damage and pull Large or smaller target 10 feet toward you.', components: 'V, S, M' };
const ELDRITCH_BLAST: Spell = { name: 'Eldritch Blast', level: 0, school: 'Evocation', castingTime: '1 action', range: '120 feet', duration: 'Instantaneous', description: 'A beam of crackling energy. 1d10 force damage.', components: 'V, S' };
const CHILL_TOUCH: Spell = { name: 'Chill Touch', level: 0, school: 'Necromancy', castingTime: '1 action', range: '120 feet', duration: '1 round', description: '1d8 necrotic damage. Target cannot regain HP until your next turn.', components: 'V, S' };
const BLADE_WARD: Spell = { name: 'Blade Ward', level: 0, school: 'Abjuration', castingTime: '1 action', range: 'Self', duration: '1 round', description: 'Resistance to bludgeoning, piercing, and slashing damage until next turn.', components: 'V, S' };
const TRUE_STRIKE: Spell = { name: 'True Strike', level: 0, school: 'Divination', castingTime: '1 action', range: '30 feet', duration: 'Concentration, 1 round', description: 'Gain advantage on your next attack roll against the target.', components: 'S' };
const FRIENDS: Spell = { name: 'Friends', level: 0, school: 'Enchantment', castingTime: '1 action', range: 'Self', duration: 'Concentration, 1 minute', description: 'Advantage on CHA checks against one creature. It knows you charmed it afterward.', components: 'S, M' };
const VICIOUS_MOCKERY: Spell = { name: 'Vicious Mockery', level: 0, school: 'Enchantment', castingTime: '1 action', range: '60 feet', duration: 'Instantaneous', description: '1d4 psychic damage and disadvantage on next attack roll. WIS save.', components: 'V' };
const MESSAGE: Spell = { name: 'Message', level: 0, school: 'Transmutation', castingTime: '1 action', range: '120 feet', duration: '1 round', description: 'Whisper a message to a creature. It can reply in a whisper.', components: 'V, S, M' };
const DANCING_LIGHTS: Spell = { name: 'Dancing Lights', level: 0, school: 'Evocation', castingTime: '1 action', range: '120 feet', duration: 'Concentration, 1 minute', description: 'Create up to four torch-sized lights that hover and move.', components: 'V, S, M' };
const ACID_SPLASH: Spell = { name: 'Acid Splash', level: 0, school: 'Conjuration', castingTime: '1 action', range: '60 feet', duration: 'Instantaneous', description: '1d6 acid damage (DEX save). Can target two adjacent creatures.', components: 'V, S' };

// ── 1st-Level Spells ─────────────────────────────────────────────────────────

// Wizard / Sorcerer / Bard shared
const MAGIC_MISSILE: Spell = { name: 'Magic Missile', level: 1, school: 'Evocation', castingTime: '1 action', range: '120 feet', duration: 'Instantaneous', description: 'Three darts of force hit targets automatically. 1d4+1 each.', components: 'V, S' };
const SHIELD: Spell = { name: 'Shield', level: 1, school: 'Abjuration', castingTime: '1 reaction', range: 'Self', duration: '1 round', description: '+5 AC until your next turn, including against the triggering attack.', components: 'V, S' };
const MAGE_ARMOR: Spell = { name: 'Mage Armor', level: 1, school: 'Abjuration', castingTime: '1 action', range: 'Touch', duration: '8 hours', description: 'AC becomes 13 + DEX modifier for a creature not wearing armor.', components: 'V, S, M' };
const BURNING_HANDS: Spell = { name: 'Burning Hands', level: 1, school: 'Evocation', castingTime: '1 action', range: 'Self (15-foot cone)', duration: 'Instantaneous', description: '3d6 fire damage in a 15-foot cone. DEX save for half.', components: 'V, S' };
const SLEEP: Spell = { name: 'Sleep', level: 1, school: 'Enchantment', castingTime: '1 action', range: '90 feet', duration: '1 minute', description: 'Roll 5d8; creatures in a 20-foot radius fall unconscious starting from lowest HP.', components: 'V, S, M' };
const DETECT_MAGIC: Spell = { name: 'Detect Magic', level: 1, school: 'Divination', castingTime: '1 action', range: 'Self', duration: 'Concentration, 10 minutes', description: 'Sense the presence and school of magic within 30 feet.', components: 'V, S' };
const THUNDERWAVE: Spell = { name: 'Thunderwave', level: 1, school: 'Evocation', castingTime: '1 action', range: 'Self (15-foot cube)', duration: 'Instantaneous', description: '2d8 thunder damage and push creatures 10 feet. CON save for half, no push.', components: 'V, S' };
const FEATHER_FALL: Spell = { name: 'Feather Fall', level: 1, school: 'Transmutation', castingTime: '1 reaction', range: '60 feet', duration: '1 minute', description: 'Up to five falling creatures descend at 60 feet/round, taking no fall damage.', components: 'V, M' };
const COMPREHEND_LANGUAGES: Spell = { name: 'Comprehend Languages', level: 1, school: 'Divination', castingTime: '1 action', range: 'Self', duration: '1 hour', description: 'Understand any spoken or written language you see or hear.', components: 'V, S, M' };
const CHARM_PERSON: Spell = { name: 'Charm Person', level: 1, school: 'Enchantment', castingTime: '1 action', range: '30 feet', duration: '1 hour', description: 'A humanoid regards you as a friendly acquaintance. WIS save.', components: 'V, S' };
const IDENTIFY: Spell = { name: 'Identify', level: 1, school: 'Divination', castingTime: '1 minute', range: 'Touch', duration: 'Instantaneous', description: 'Learn the properties and how to use a magic item or affected object.', components: 'V, S, M' };
const FIND_FAMILIAR: Spell = { name: 'Find Familiar', level: 1, school: 'Conjuration', castingTime: '1 hour', range: '10 feet', duration: 'Instantaneous', description: 'Summon a spirit in animal form as your familiar. It can scout and deliver touch spells.', components: 'V, S, M' };
const CHROMATIC_ORB: Spell = { name: 'Chromatic Orb', level: 1, school: 'Evocation', castingTime: '1 action', range: '90 feet', duration: 'Instantaneous', description: '3d8 damage of a type you choose (acid, cold, fire, lightning, poison, or thunder).', components: 'V, S, M' };
const FOG_CLOUD: Spell = { name: 'Fog Cloud', level: 1, school: 'Conjuration', castingTime: '1 action', range: '120 feet', duration: 'Concentration, 1 hour', description: 'A 20-foot sphere of fog heavily obscures the area.', components: 'V, S' };
const DISGUISE_SELF: Spell = { name: 'Disguise Self', level: 1, school: 'Illusion', castingTime: '1 action', range: 'Self', duration: '1 hour', description: 'Change your appearance including clothing, armor, and body shape.', components: 'V, S' };
const GREASE: Spell = { name: 'Grease', level: 1, school: 'Conjuration', castingTime: '1 action', range: '60 feet', duration: '1 minute', description: 'A 10-foot square becomes difficult terrain. Creatures must DEX save or fall prone.', components: 'V, S, M' };
const COLOR_SPRAY: Spell = { name: 'Color Spray', level: 1, school: 'Illusion', castingTime: '1 action', range: 'Self (15-foot cone)', duration: '1 round', description: 'Roll 6d10; blind creatures starting from lowest HP.', components: 'V, S, M' };
const WITCH_BOLT: Spell = { name: 'Witch Bolt', level: 1, school: 'Evocation', castingTime: '1 action', range: '30 feet', duration: 'Concentration, 1 minute', description: '1d12 lightning damage. Use action on subsequent turns for automatic 1d12 damage.', components: 'V, S, M' };
const EXPEDITIOUS_RETREAT: Spell = { name: 'Expeditious Retreat', level: 1, school: 'Transmutation', castingTime: '1 bonus action', range: 'Self', duration: 'Concentration, 10 minutes', description: 'Dash as a bonus action on each of your turns.', components: 'V, S' };

// Cleric-specific 1st-level
const BLESS: Spell = { name: 'Bless', level: 1, school: 'Enchantment', castingTime: '1 action', range: '30 feet', duration: 'Concentration, 1 minute', description: 'Up to three creatures add 1d4 to attack rolls and saving throws.', components: 'V, S, M' };
const CURE_WOUNDS: Spell = { name: 'Cure Wounds', level: 1, school: 'Evocation', castingTime: '1 action', range: 'Touch', duration: 'Instantaneous', description: 'Heal 1d8 + spellcasting modifier HP.', components: 'V, S' };
const HEALING_WORD: Spell = { name: 'Healing Word', level: 1, school: 'Evocation', castingTime: '1 bonus action', range: '60 feet', duration: 'Instantaneous', description: 'Heal 1d4 + spellcasting modifier HP at range.', components: 'V' };
const GUIDING_BOLT: Spell = { name: 'Guiding Bolt', level: 1, school: 'Evocation', castingTime: '1 action', range: '120 feet', duration: '1 round', description: '4d6 radiant damage. Next attack against the target has advantage.', components: 'V, S' };
const INFLICT_WOUNDS: Spell = { name: 'Inflict Wounds', level: 1, school: 'Necromancy', castingTime: '1 action', range: 'Touch', duration: 'Instantaneous', description: '3d10 necrotic damage on a melee spell attack.', components: 'V, S' };
const SHIELD_OF_FAITH: Spell = { name: 'Shield of Faith', level: 1, school: 'Abjuration', castingTime: '1 bonus action', range: '60 feet', duration: 'Concentration, 10 minutes', description: '+2 AC to a creature for the duration.', components: 'V, S, M' };
const SANCTUARY: Spell = { name: 'Sanctuary', level: 1, school: 'Abjuration', castingTime: '1 bonus action', range: '30 feet', duration: '1 minute', description: 'Creatures must make WIS save to target the warded creature.', components: 'V, S, M' };
const COMMAND: Spell = { name: 'Command', level: 1, school: 'Enchantment', castingTime: '1 action', range: '60 feet', duration: '1 round', description: 'Speak a one-word command. Target obeys on its next turn (WIS save).', components: 'V' };
const DETECT_EVIL: Spell = { name: 'Detect Evil and Good', level: 1, school: 'Divination', castingTime: '1 action', range: 'Self', duration: 'Concentration, 10 minutes', description: 'Know the location of aberrations, celestials, fiends, undead within 30 feet.', components: 'V, S' };
const PROTECTION_EVIL: Spell = { name: 'Protection from Evil and Good', level: 1, school: 'Abjuration', castingTime: '1 action', range: 'Touch', duration: 'Concentration, 10 minutes', description: 'Protection against aberrations, celestials, elementals, fey, fiends, and undead.', components: 'V, S, M' };

// Druid-specific 1st-level
const ENTANGLE: Spell = { name: 'Entangle', level: 1, school: 'Conjuration', castingTime: '1 action', range: '90 feet', duration: 'Concentration, 1 minute', description: 'Grasping weeds restrain creatures in a 20-foot square. STR save.', components: 'V, S' };
const FAERIE_FIRE: Spell = { name: 'Faerie Fire', level: 1, school: 'Evocation', castingTime: '1 action', range: '60 feet', duration: 'Concentration, 1 minute', description: 'Outline creatures in light. Attacks against them have advantage. DEX save.', components: 'V' };
const GOODBERRY: Spell = { name: 'Goodberry', level: 1, school: 'Transmutation', castingTime: '1 action', range: 'Touch', duration: 'Instantaneous', description: 'Create 10 berries. Each heals 1 HP and provides a day of nourishment.', components: 'V, S, M' };
const SPEAK_WITH_ANIMALS: Spell = { name: 'Speak with Animals', level: 1, school: 'Divination', castingTime: '1 action', range: 'Self', duration: '10 minutes', description: 'Communicate with beasts for the duration.', components: 'V, S' };
const THUNDERWAVE_DRUID: Spell = { ...THUNDERWAVE };
const HEALING_WORD_DRUID: Spell = { ...HEALING_WORD };
const CURE_WOUNDS_DRUID: Spell = { ...CURE_WOUNDS };
const FOG_CLOUD_DRUID: Spell = { ...FOG_CLOUD };
const DETECT_MAGIC_DRUID: Spell = { ...DETECT_MAGIC };
const ANIMAL_FRIENDSHIP: Spell = { name: 'Animal Friendship', level: 1, school: 'Enchantment', castingTime: '1 action', range: '30 feet', duration: '24 hours', description: 'Convince a beast you mean no harm. WIS save.', components: 'V, S, M' };

// Bard-specific 1st-level
const DISSONANT_WHISPERS: Spell = { name: 'Dissonant Whispers', level: 1, school: 'Enchantment', castingTime: '1 action', range: '60 feet', duration: 'Instantaneous', description: '3d6 psychic damage and target must use reaction to flee. WIS save for half.', components: 'V' };
const HEROISM: Spell = { name: 'Heroism', level: 1, school: 'Enchantment', castingTime: '1 action', range: 'Touch', duration: 'Concentration, 1 minute', description: 'Target is immune to being frightened. Gains temp HP = spellcasting mod each turn.', components: 'V, S' };
const FAERIE_FIRE_BARD: Spell = { ...FAERIE_FIRE };
const HEALING_WORD_BARD: Spell = { ...HEALING_WORD };
const CURE_WOUNDS_BARD: Spell = { ...CURE_WOUNDS };
const CHARM_PERSON_BARD: Spell = { ...CHARM_PERSON };
const SLEEP_BARD: Spell = { ...SLEEP };
const THUNDERWAVE_BARD: Spell = { ...THUNDERWAVE };
const DETECT_MAGIC_BARD: Spell = { ...DETECT_MAGIC };
const DISGUISE_SELF_BARD: Spell = { ...DISGUISE_SELF };
const FEATHER_FALL_BARD: Spell = { ...FEATHER_FALL };
const SPEAK_WITH_ANIMALS_BARD: Spell = { ...SPEAK_WITH_ANIMALS };
const SILENT_IMAGE: Spell = { name: 'Silent Image', level: 1, school: 'Illusion', castingTime: '1 action', range: '60 feet', duration: 'Concentration, 10 minutes', description: 'Create a visual illusion up to a 15-foot cube. No sound, smell, or texture.', components: 'V, S, M' };
const TASHAS_HIDEOUS_LAUGHTER: Spell = { name: "Tasha's Hideous Laughter", level: 1, school: 'Enchantment', castingTime: '1 action', range: '30 feet', duration: 'Concentration, 1 minute', description: 'Target falls prone laughing and is incapacitated. WIS save.', components: 'V, S, M' };

// Warlock-specific 1st-level
const HEX: Spell = { name: 'Hex', level: 1, school: 'Enchantment', castingTime: '1 bonus action', range: '90 feet', duration: 'Concentration, 1 hour', description: 'Deal extra 1d6 necrotic damage on each hit. Target has disadvantage on one ability check.', components: 'V, S, M' };
const HELLISH_REBUKE: Spell = { name: 'Hellish Rebuke', level: 1, school: 'Evocation', castingTime: '1 reaction', range: '60 feet', duration: 'Instantaneous', description: '2d10 fire damage to a creature that damaged you. DEX save for half.', components: 'V, S' };
const ARMS_OF_HADAR: Spell = { name: 'Arms of Hadar', level: 1, school: 'Conjuration', castingTime: '1 action', range: 'Self (10-foot radius)', duration: 'Instantaneous', description: '2d6 necrotic damage. Targets cannot take reactions. STR save for half.', components: 'V, S' };
const WITCH_BOLT_WARLOCK: Spell = { ...WITCH_BOLT };
const CHARM_PERSON_WARLOCK: Spell = { ...CHARM_PERSON };
const EXPEDITIOUS_RETREAT_WARLOCK: Spell = { ...EXPEDITIOUS_RETREAT };
const PROTECTION_EVIL_WARLOCK: Spell = { ...PROTECTION_EVIL };
const UNSEEN_SERVANT: Spell = { name: 'Unseen Servant', level: 1, school: 'Conjuration', castingTime: '1 action', range: '60 feet', duration: '1 hour', description: 'An invisible force performs simple tasks — fetch, clean, mend, fold clothes.', components: 'V, S, M' };

// Sorcerer shares many wizard spells
const CHAOS_BOLT: Spell = { name: 'Chaos Bolt', level: 1, school: 'Evocation', castingTime: '1 action', range: '120 feet', duration: 'Instantaneous', description: '2d8+1d6 damage of a random type. Doubles can bounce to another target.', components: 'V, S' };

// ── Class Spell Configs ──────────────────────────────────────────────────────

export const CLASS_SPELLS: Partial<Record<ClassName, ClassSpellConfig>> = {
  wizard: {
    cantripCount: 3,
    spellCount: 6,
    isPreparedCaster: false,
    primaryAbility: 'intelligence',
    cantrips: [FIRE_BOLT, RAY_OF_FROST, SHOCKING_GRASP, MAGE_HAND, MINOR_ILLUSION, PRESTIDIGITATION, LIGHT, MENDING, POISON_SPRAY, CHILL_TOUCH, DANCING_LIGHTS, ACID_SPLASH, BLADE_WARD, MESSAGE, TRUE_STRIKE],
    spells: [MAGIC_MISSILE, SHIELD, MAGE_ARMOR, BURNING_HANDS, SLEEP, DETECT_MAGIC, THUNDERWAVE, FEATHER_FALL, COMPREHEND_LANGUAGES, CHARM_PERSON, IDENTIFY, FIND_FAMILIAR, CHROMATIC_ORB, FOG_CLOUD, DISGUISE_SELF, GREASE, COLOR_SPRAY, WITCH_BOLT, EXPEDITIOUS_RETREAT],
    recommendedCantrips: ['Fire Bolt', 'Mage Hand', 'Minor Illusion'],
    recommendedSpells: ['Magic Missile', 'Shield', 'Mage Armor', 'Detect Magic', 'Sleep', 'Find Familiar'],
  },
  sorcerer: {
    cantripCount: 4,
    spellCount: 2,
    isPreparedCaster: false,
    primaryAbility: 'charisma',
    cantrips: [FIRE_BOLT, RAY_OF_FROST, SHOCKING_GRASP, MAGE_HAND, MINOR_ILLUSION, PRESTIDIGITATION, LIGHT, POISON_SPRAY, CHILL_TOUCH, ACID_SPLASH, BLADE_WARD, MESSAGE, DANCING_LIGHTS, TRUE_STRIKE, FRIENDS],
    spells: [MAGIC_MISSILE, SHIELD, MAGE_ARMOR, BURNING_HANDS, SLEEP, DETECT_MAGIC, THUNDERWAVE, CHROMATIC_ORB, FOG_CLOUD, DISGUISE_SELF, COLOR_SPRAY, CHARM_PERSON, CHAOS_BOLT, EXPEDITIOUS_RETREAT, FEATHER_FALL],
    recommendedCantrips: ['Fire Bolt', 'Mage Hand', 'Prestidigitation', 'Ray of Frost'],
    recommendedSpells: ['Shield', 'Magic Missile'],
  },
  bard: {
    cantripCount: 2,
    spellCount: 4,
    isPreparedCaster: false,
    primaryAbility: 'charisma',
    cantrips: [VICIOUS_MOCKERY, LIGHT, MENDING, PRESTIDIGITATION, MINOR_ILLUSION, MESSAGE, DANCING_LIGHTS, FRIENDS, MAGE_HAND, BLADE_WARD, TRUE_STRIKE],
    spells: [DISSONANT_WHISPERS, HEALING_WORD_BARD, CURE_WOUNDS_BARD, HEROISM, FAERIE_FIRE_BARD, CHARM_PERSON_BARD, SLEEP_BARD, THUNDERWAVE_BARD, DETECT_MAGIC_BARD, DISGUISE_SELF_BARD, FEATHER_FALL_BARD, SILENT_IMAGE, TASHAS_HIDEOUS_LAUGHTER, SPEAK_WITH_ANIMALS_BARD],
    recommendedCantrips: ['Vicious Mockery', 'Light'],
    recommendedSpells: ['Healing Word', 'Dissonant Whispers', 'Faerie Fire', 'Heroism'],
  },
  cleric: {
    cantripCount: 3,
    spellCount: 0, // Prepared caster: WIS mod + level
    isPreparedCaster: true,
    primaryAbility: 'wisdom',
    cantrips: [SACRED_FLAME, GUIDANCE, LIGHT, MENDING, RESISTANCE, SPARE_THE_DYING, THAUMATURGY],
    spells: [BLESS, CURE_WOUNDS, HEALING_WORD, GUIDING_BOLT, INFLICT_WOUNDS, SHIELD_OF_FAITH, SANCTUARY, COMMAND, DETECT_MAGIC, DETECT_EVIL, PROTECTION_EVIL],
    recommendedCantrips: ['Sacred Flame', 'Guidance', 'Light'],
    recommendedSpells: ['Bless', 'Cure Wounds', 'Guiding Bolt', 'Healing Word'],
  },
  druid: {
    cantripCount: 2,
    spellCount: 0, // Prepared caster: WIS mod + level
    isPreparedCaster: true,
    primaryAbility: 'wisdom',
    cantrips: [DRUIDCRAFT, PRODUCE_FLAME, SHILLELAGH, THORN_WHIP, GUIDANCE, MENDING, RESISTANCE, POISON_SPRAY],
    spells: [ENTANGLE, FAERIE_FIRE, GOODBERRY, HEALING_WORD_DRUID, CURE_WOUNDS_DRUID, THUNDERWAVE_DRUID, SPEAK_WITH_ANIMALS, FOG_CLOUD_DRUID, DETECT_MAGIC_DRUID, ANIMAL_FRIENDSHIP],
    recommendedCantrips: ['Produce Flame', 'Guidance'],
    recommendedSpells: ['Entangle', 'Healing Word', 'Goodberry', 'Faerie Fire'],
  },
  warlock: {
    cantripCount: 2,
    spellCount: 2,
    isPreparedCaster: false,
    primaryAbility: 'charisma',
    cantrips: [ELDRITCH_BLAST, CHILL_TOUCH, MAGE_HAND, MINOR_ILLUSION, POISON_SPRAY, PRESTIDIGITATION, BLADE_WARD, FRIENDS, TRUE_STRIKE],
    spells: [HEX, HELLISH_REBUKE, ARMS_OF_HADAR, WITCH_BOLT_WARLOCK, CHARM_PERSON_WARLOCK, EXPEDITIOUS_RETREAT_WARLOCK, PROTECTION_EVIL_WARLOCK, UNSEEN_SERVANT],
    recommendedCantrips: ['Eldritch Blast', 'Minor Illusion'],
    recommendedSpells: ['Hex', 'Hellish Rebuke'],
  },

  artificer: {
    cantripCount: 2,
    spellCount: 0,  // Prepared caster — uses INT mod + half level
    isPreparedCaster: true,
    primaryAbility: 'intelligence',
    cantrips: [ACID_SPLASH, FIRE_BOLT, GUIDANCE, LIGHT, MAGE_HAND, MENDING, PRESTIDIGITATION, THORN_WHIP, SPARE_THE_DYING],
    spells: [CURE_WOUNDS, DETECT_MAGIC, FAERIE_FIRE, GREASE, IDENTIFY],
    recommendedCantrips: ['Mending', 'Fire Bolt'],
    recommendedSpells: ['Cure Wounds', 'Detect Magic'],
  },
};

// ── Spell slot helper ────────────────────────────────────────────────────────

/** Returns starting spell slots array for a class at level 1. Index 0 unused, index 1 = 1st level. */
export function getStartingSpellSlots(className: ClassName): number[] {
  const SLOTS: Partial<Record<ClassName, number[]>> = {
    bard: [0, 2],
    cleric: [0, 2],
    druid: [0, 2],
    sorcerer: [0, 2],
    warlock: [0, 1], // Pact magic
    wizard: [0, 2],
    artificer: [0, 2],
  };
  return SLOTS[className] ?? [];
}
