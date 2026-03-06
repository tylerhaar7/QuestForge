import type { ClassName, AbilityScores, EquipmentItem, Skill, AbilityScore } from '@/types/game';

export interface TutorialClassOption {
  className: ClassName;
  defaultName: string;
  description: string;
  icon: string;
  abilityScores: AbilityScores;
  hp: number;
  maxHp: number;
  ac: number;
  speed: number;
  proficientSkills: Skill[];
  proficientSaves: AbilityScore[];
  equipment: EquipmentItem[];
  features: string[];
}

export const TUTORIAL_CLASSES: TutorialClassOption[] = [
  {
    className: 'fighter',
    defaultName: 'Aldric',
    description: 'A sturdy warrior. Simple and strong.',
    icon: '\u2694\uFE0F',
    abilityScores: { strength: 16, dexterity: 12, constitution: 14, intelligence: 10, wisdom: 13, charisma: 8 },
    hp: 12, maxHp: 12, ac: 16, speed: 30,
    proficientSkills: ['athletics', 'intimidation'],
    proficientSaves: ['strength', 'constitution'],
    equipment: [
      { id: 'longsword', name: 'Longsword', type: 'weapon', equipped: true, properties: {} },
      { id: 'chain_mail', name: 'Chain Mail', type: 'armor', equipped: true, properties: {} },
      { id: 'shield', name: 'Shield', type: 'shield', equipped: true, properties: {} },
    ],
    features: ['Fighting Style: Defense', 'Second Wind'],
  },
  {
    className: 'rogue',
    defaultName: 'Kael',
    description: 'Quick and cunning. Strikes from the shadows.',
    icon: '\uD83D\uDDE1\uFE0F',
    abilityScores: { strength: 10, dexterity: 16, constitution: 12, intelligence: 13, wisdom: 8, charisma: 14 },
    hp: 9, maxHp: 9, ac: 14, speed: 30,
    proficientSkills: ['stealth', 'acrobatics', 'deception', 'sleight_of_hand'],
    proficientSaves: ['dexterity', 'intelligence'],
    equipment: [
      { id: 'shortsword', name: 'Shortsword', type: 'weapon', equipped: true, properties: {} },
      { id: 'leather_armor', name: 'Leather Armor', type: 'armor', equipped: true, properties: {} },
    ],
    features: ['Sneak Attack', 'Expertise'],
  },
  {
    className: 'wizard',
    defaultName: 'Lywen',
    description: 'A scholar of the arcane. Powerful but fragile.',
    icon: '\uD83E\uDDD9',
    abilityScores: { strength: 8, dexterity: 13, constitution: 12, intelligence: 16, wisdom: 14, charisma: 10 },
    hp: 7, maxHp: 7, ac: 12, speed: 30,
    proficientSkills: ['arcana', 'investigation'],
    proficientSaves: ['intelligence', 'wisdom'],
    equipment: [
      { id: 'quarterstaff', name: 'Quarterstaff', type: 'weapon', equipped: true, properties: {} },
    ],
    features: ['Arcane Recovery', 'Spellcasting'],
  },
  {
    className: 'cleric',
    defaultName: 'Miriel',
    description: 'A healer and protector. Fights and mends.',
    icon: '\u2728',
    abilityScores: { strength: 14, dexterity: 10, constitution: 13, intelligence: 8, wisdom: 16, charisma: 12 },
    hp: 10, maxHp: 10, ac: 16, speed: 30,
    proficientSkills: ['medicine', 'religion'],
    proficientSaves: ['wisdom', 'charisma'],
    equipment: [
      { id: 'mace', name: 'Mace', type: 'weapon', equipped: true, properties: {} },
      { id: 'chain_mail', name: 'Chain Mail', type: 'armor', equipped: true, properties: {} },
      { id: 'shield', name: 'Shield', type: 'shield', equipped: true, properties: {} },
    ],
    features: ['Spellcasting', 'Divine Domain'],
  },
];

/** Tutorial turn instructions -- injected server-side into system prompt */
export const TUTORIAL_TURN_INSTRUCTIONS: Record<number, string> = {
  1: `TUTORIAL TURN 1 — TEACHING: Narrative Choices
You are running a tutorial. This is the player's FIRST turn.
- Present a simple, low-stakes situation (arriving at a location, meeting someone)
- Offer 3 clear choices with distinct approaches
- DO NOT include combat, dice rolls, or complex mechanics yet
- Add a brief meta-hint in parentheses after each choice explaining what type it is
- Keep narration short (1-2 paragraphs) and welcoming`,

  2: `TUTORIAL TURN 2 — TEACHING: Combat Basics
- Introduce a simple combat encounter (2-3 weak enemies like goblins)
- Set mode to "combat"
- Include enemy_intentions for each enemy
- Present 3 tactical choices (attack, use environment, defensive action)
- Include dice_requests for attacks
- Add meta-note: "Combat tip: enemies telegraph their moves so you can plan!"`,

  3: `TUTORIAL TURN 3 — TEACHING: Skill Checks
- Present a situation requiring a skill check (locked door, suspicious NPC, climbing)
- Include at least 2 choices with skill_check objects (show DC, modifier, success_chance)
- Include one choice without a skill check as an alternative
- Add meta-note: "Skill tip: your abilities affect your chances. Higher is better!"`,

  4: `TUTORIAL TURN 4 — TEACHING: Companion Approval
- Create a moral or tactical dilemma where companions disagree
- Have at least 2 companions speak with distinct voices
- Include approval_changes based on the player's last choice
- Add meta-note: "Your companions remember your choices. Their approval affects their loyalty."`,

  5: `TUTORIAL TURN 5 — TEACHING: Freeform Input
- Present an open-ended situation (empty choices array)
- Narrate a moment that invites creative thinking
- Add meta-note: "You can type ANY action you want to try. Be creative!"
- Companions react naturally to whatever the player does`,

  6: `TUTORIAL TURN 6 — TEACHING: Consequences
This is the FINAL tutorial turn.
- Present a meaningful decision with real trade-offs
- After the player chooses, narrate the consequence
- End narration with: "And so your story truly begins..."
- Include "tutorial_complete": true in your JSON response
- Include choices: "Create my own character" and "Continue with this character"`,
};

export const TUTORIAL_OPENING_PROMPT = `You are starting a tutorial campaign called "The First Door."
This is a new player learning D&D for the first time through play.

Create an opening scene that:
1. Places the player outside a mysterious tavern at dusk -- "The First Door Inn"
2. The atmosphere is welcoming but intriguing -- not threatening
3. Introduce the three companions (Korrin the fighter, Sera the rogue, Thaelen the druid) as fellow travelers who just arrived
4. Present 3 simple choices for what to do next (enter the tavern, investigate the area, talk to companions)
5. Add brief meta-hints in parentheses explaining each choice type
6. Keep it SHORT -- 2 paragraphs max

Remember: NO dice rolls, NO combat. Just narrative choices.`;
