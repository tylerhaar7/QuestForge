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
