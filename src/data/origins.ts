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
  suggestedBackstoryPrompts: string[];
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
    suggestedBackstoryPrompts: [
      "The night of the coup, a servant smuggled you through the kitchens. You still carry the ring bearing your family's seal — the only proof of who you were.",
      "Your younger sibling was the one who sold your house to the usurper. You saw their face in the throne room window as the gates closed behind you.",
      "A travelling merchant found you half-dead on the road and nursed you back to health. You repaid them by vanishing before your enemies could follow your trail to their door.",
      "You remember the exact words your mother spoke as the guards dragged her away. You swore you would hear her voice again — free, and in your family's hall.",
    ],
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
    suggestedBackstoryPrompts: [
      "The book was bound in something that wasn't leather. When you opened it, a voice spoke your true name — one you'd never told anyone.",
      "Your mentor warned you about the restricted archive. You went anyway. The next morning, your mentor was gone and the archive was empty — except for the words now burned into your memory.",
      "You can read inscriptions that others see as blank stone. The whispers grow louder near ruins, and sometimes they finish your sentences before you speak.",
      "The dreams started with a library that has no walls. Each night you read a little further. Each morning you remember a little less of who you were before.",
    ],
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
    suggestedBackstoryPrompts: [
      "You borrowed the gold to save someone's life. They never learned the price you paid, and you intend to keep it that way.",
      "The deal seemed fair at the time — a fortune in exchange for a simple delivery. You never made the delivery. Now you know why no one else would take the job.",
      "Three cities, three names, three lives abandoned when the collectors got too close. You're running out of places to hide.",
      "The debt wasn't yours to begin with. But the person who owed it is dead, and the creditor doesn't care about the difference.",
    ],
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
    suggestedBackstoryPrompts: [
      "They died in your arms on a battlefield neither of you chose. Their last words were a place name you've never found on any map.",
      "You promised a dying stranger you would carry a sealed letter to the capital. That was two years ago. The seal is still unbroken, and you've walked past the capital twice.",
      "Your oath was to protect someone who no longer exists — not dead, but changed beyond recognition. You wonder if the promise still holds.",
    ],
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
    suggestedBackstoryPrompts: [
      "You still remember the chant. Some nights your lips move on their own, forming syllables that taste like smoke and iron.",
      "It was the children that broke you. When the inner circle revealed the next ritual, you walked into the night and never looked back — but they marked you before you reached the treeline.",
      "Your former brothers and sisters send gifts on your birthday. Small things left on your doorstep — a candle, a feather, a tooth. They want you to know they remember.",
      "You joined willingly. That's the part no one would understand. For a time, the cult felt more like family than anything you'd known before.",
    ],
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
    suggestedBackstoryPrompts: [
      "You were three days' ride away when the fire started. By the time you crested the hill, there was nothing left but ash and the smell of something unnatural.",
      "Your mentor sent you on a pointless errand the morning of the attack. You've spent every night since wondering if they knew what was coming.",
      "You found one body wearing the wrong armor — an infiltrator among your own. Someone inside the order opened the gates.",
      "A child in a market town recognized your order's sigil on your belt. They said their parent wore one just like it — and that they'd seen them alive, two months ago, heading north.",
    ],
  },
];

export const ORIGIN_MAP = Object.fromEntries(ORIGINS.map(o => [o.id, o]));
