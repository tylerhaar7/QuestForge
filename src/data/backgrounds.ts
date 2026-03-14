import type { Skill } from '@/types/game';

export interface BackgroundData {
  id: string;
  name: string;
  description: string;
  skillProficiencies: Skill[];
  toolProficiencies: string[];
  languages: number;
  featureName: string;
  featureDescription: string;
  availableFeats: string[];
  suggestedCharacteristics: string;
}

// ─── PHB Backgrounds ──────────────────────────────

export const BACKGROUNDS: Record<string, BackgroundData> = {
  acolyte: {
    id: 'acolyte',
    name: 'Acolyte',
    description:
      'You spent years cloistered in a temple, steeped in prayer and ritual. The divine is not abstract to you — it whispers in your sleep and guides your hand.',
    skillProficiencies: ['religion', 'insight'],
    toolProficiencies: [],
    languages: 2,
    featureName: 'Shelter of the Faithful',
    featureDescription:
      'Temples and shrines of your faith will provide you and your companions with food, healing, and shelter. The clergy will support you as long as your actions honor the faith.',
    availableFeats: ['magic_initiate_cleric', 'healer'],
    suggestedCharacteristics:
      'Devout and contemplative, driven by faith or haunted by doubt. May be compassionate toward the suffering or rigidly dogmatic.',
  },

  charlatan: {
    id: 'charlatan',
    name: 'Charlatan',
    description:
      'You have always had a gift for reading people and telling them exactly what they want to hear. Every town is a stage, and every mark is an audience of one.',
    skillProficiencies: ['deception', 'sleight_of_hand'],
    toolProficiencies: ['Disguise Kit', 'Forgery Kit'],
    languages: 0,
    featureName: 'False Identity',
    featureDescription:
      'You have crafted a second identity complete with documentation, established acquaintances, and disguises. You can forge documents and switch personas with ease.',
    availableFeats: ['lucky', 'skilled'],
    suggestedCharacteristics:
      'Silver-tongued and adaptable, always working an angle. Might be a charming rogue with a heart of gold or a ruthless manipulator who trusts no one.',
  },

  criminal: {
    id: 'criminal',
    name: 'Criminal',
    description:
      'You know the underworld like the back of your hand — the dead drops, the fences, the unspoken rules. The law is just another obstacle to work around.',
    skillProficiencies: ['deception', 'stealth'],
    toolProficiencies: ["Thieves' Tools", 'Gaming Set'],
    languages: 0,
    featureName: 'Criminal Contact',
    featureDescription:
      'You have a reliable contact in the criminal underworld who can deliver messages, fence stolen goods, and connect you with other criminals across the region.',
    availableFeats: ['alert', 'lucky'],
    suggestedCharacteristics:
      'Streetwise and pragmatic, with loyalty to a personal code. May be a reformed thief seeking redemption or a cold professional who never leaves witnesses.',
  },

  entertainer: {
    id: 'entertainer',
    name: 'Entertainer',
    description:
      'You live for the roar of the crowd and the thrill of performance. Whether through song, dance, or blade-juggling, you command attention wherever you go.',
    skillProficiencies: ['acrobatics', 'performance'],
    toolProficiencies: ['Disguise Kit', 'Musical Instrument'],
    languages: 0,
    featureName: 'By Popular Demand',
    featureDescription:
      'You can always find a place to perform in any settlement. Your reputation earns you free lodging, food, and a modest income, and the crowd often shares local rumors.',
    availableFeats: ['musician', 'lucky'],
    suggestedCharacteristics:
      'Flamboyant and expressive, craving applause and connection. Might mask deep insecurity behind bravado or genuinely live to bring joy to a darkened world.',
  },

  folk_hero: {
    id: 'folk_hero',
    name: 'Folk Hero',
    description:
      'You stood against tyranny when no one else would. The common folk remember your name and whisper it with hope — a beacon in these darkening times.',
    skillProficiencies: ['animal_handling', 'survival'],
    toolProficiencies: ["Artisan's Tools", 'Vehicles (Land)'],
    languages: 0,
    featureName: 'Rustic Hospitality',
    featureDescription:
      'Common folk will shelter you, feed you, and hide you from danger. They see you as one of their own and will risk much to protect you, short of laying down their lives.',
    availableFeats: ['tough', 'savage_attacker'],
    suggestedCharacteristics:
      'Humble and steadfast, with a fierce sense of justice. Might be reluctant about the hero mantle or embrace it as a duty owed to those who cannot fight.',
  },

  guild_artisan: {
    id: 'guild_artisan',
    name: 'Guild Artisan',
    description:
      'You learned a craft from a master and earned your place in a powerful guild. Your hands create beauty and function — and your guild connections open doors that gold alone cannot.',
    skillProficiencies: ['insight', 'persuasion'],
    toolProficiencies: ["Artisan's Tools"],
    languages: 1,
    featureName: 'Guild Membership',
    featureDescription:
      'Your guild provides lodging, legal support, and political influence in cities where it operates. Members are expected to pay dues and further the guild\'s interests in return.',
    availableFeats: ['crafter', 'skilled'],
    suggestedCharacteristics:
      'Practical and business-minded, with pride in craftsmanship. May see the world through the lens of trade and value, or genuinely believe that creation is a sacred act.',
  },

  hermit: {
    id: 'hermit',
    name: 'Hermit',
    description:
      'You withdrew from the world to dwell in solitude — a cave, a forest shrine, a forgotten ruin. In that silence, you found something. A truth. A vision. A warning.',
    skillProficiencies: ['medicine', 'religion'],
    toolProficiencies: ['Herbalism Kit'],
    languages: 1,
    featureName: 'Discovery',
    featureDescription:
      'During your seclusion, you uncovered a profound truth — a forgotten secret, a cosmic insight, or a revelation that could reshape the world if shared with the right people.',
    availableFeats: ['healer', 'magic_initiate_druid'],
    suggestedCharacteristics:
      'Introspective and enigmatic, seeing patterns others miss. Might be a serene sage or an unsettling prophet haunted by what solitude revealed.',
  },

  noble: {
    id: 'noble',
    name: 'Noble',
    description:
      'Blue blood runs in your veins and a family crest adorns your signet ring. You were raised to lead, to command, and to bear the weight of your lineage\'s legacy.',
    skillProficiencies: ['history', 'persuasion'],
    toolProficiencies: ['Gaming Set'],
    languages: 1,
    featureName: 'Position of Privilege',
    featureDescription:
      'Your noble birth grants you welcome in high society. Commoners make every effort to accommodate you, and other nobles treat you as a peer — or a rival worth watching.',
    availableFeats: ['skilled', 'lucky'],
    suggestedCharacteristics:
      'Refined and commanding, accustomed to deference. Might be a compassionate ruler who serves the people or a proud aristocrat who sees the world as their inheritance.',
  },

  outlander: {
    id: 'outlander',
    name: 'Outlander',
    description:
      'Civilization is a cage you never learned to endure. You grew up in the wild places — under open sky, surrounded by predators, reading the land like others read books.',
    skillProficiencies: ['athletics', 'survival'],
    toolProficiencies: ['Musical Instrument'],
    languages: 1,
    featureName: 'Wanderer',
    featureDescription:
      'You have an excellent memory for maps and geography. You can always find food and fresh water for yourself and up to five companions, provided the land offers such resources.',
    availableFeats: ['tough', 'alert'],
    suggestedCharacteristics:
      'Self-reliant and blunt, uncomfortable with social niceties. Might be a stoic survivalist or a restless wanderer chasing the horizon.',
  },

  sage: {
    id: 'sage',
    name: 'Sage',
    description:
      'You have spent a lifetime among dusty tomes and crumbling scrolls, gathering knowledge that most would find unsettling. The answers are always in the pages — if you know where to look.',
    skillProficiencies: ['arcana', 'history'],
    toolProficiencies: [],
    languages: 2,
    featureName: 'Researcher',
    featureDescription:
      'When you cannot recall a piece of lore, you know exactly where to find it — which library, which scholar, which forbidden archive holds the knowledge you seek.',
    availableFeats: ['magic_initiate_wizard', 'skilled'],
    suggestedCharacteristics:
      'Curious and methodical, driven by an insatiable thirst for knowledge. Might be a gentle academic or an obsessive seeker willing to delve into forbidden truths.',
  },

  sailor: {
    id: 'sailor',
    name: 'Sailor',
    description:
      'Salt and wind shaped you. You earned your sea legs on merchant vessels or warships, and the ocean\'s fury taught you that nature bows to no one.',
    skillProficiencies: ['athletics', 'perception'],
    toolProficiencies: ["Navigator's Tools", 'Vehicles (Water)'],
    languages: 0,
    featureName: "Ship's Passage",
    featureDescription:
      'You can secure free passage on a sailing vessel for yourself and your companions. The crew expects you to assist during the voyage, and the captain sets the route.',
    availableFeats: ['tough', 'tavern_brawler'],
    suggestedCharacteristics:
      'Bold and weathered, with a sailor\'s superstitions and dark humor. Might be a disciplined naval officer or a restless soul who answers only to the tide.',
  },

  soldier: {
    id: 'soldier',
    name: 'Soldier',
    description:
      'You served in an army, a militia, or a mercenary company. War left its mark on you — scars on your body and memories that surface unbidden in the quiet hours.',
    skillProficiencies: ['athletics', 'intimidation'],
    toolProficiencies: ['Gaming Set', 'Vehicles (Land)'],
    languages: 0,
    featureName: 'Military Rank',
    featureDescription:
      'Soldiers loyal to your former organization still recognize your rank. You can invoke your authority to requisition simple equipment, access military camps, and command respect from enlisted troops.',
    availableFeats: ['savage_attacker', 'tough'],
    suggestedCharacteristics:
      'Disciplined and direct, shaped by camaraderie and loss. Might be a grizzled veteran haunted by past campaigns or a proud warrior seeking glory in new battles.',
  },

  urchin: {
    id: 'urchin',
    name: 'Urchin',
    description:
      'You grew up on the streets with nothing but your wits and quick fingers. Hunger was your first teacher, and the city\'s shadows became your home.',
    skillProficiencies: ['sleight_of_hand', 'stealth'],
    toolProficiencies: ['Disguise Kit', "Thieves' Tools"],
    languages: 0,
    featureName: 'City Secrets',
    featureDescription:
      'You know the hidden pathways, rooftop routes, and forgotten tunnels that thread through urban landscapes. You can travel between any two locations in a city twice as fast as normal.',
    availableFeats: ['lucky', 'alert'],
    suggestedCharacteristics:
      'Resourceful and wary, trusting few but fiercely loyal to those who earn it. Might be a scrappy survivor or a bitter soul determined to never be powerless again.',
  },

  // ─── Expansion Backgrounds ────────────────────────

  far_traveler: {
    id: 'far_traveler',
    name: 'Far Traveler',
    description:
      'You hail from a distant land that few in this region have ever heard of. Your customs, dress, and accent mark you as foreign — and foreignness invites both curiosity and suspicion.',
    skillProficiencies: ['insight', 'perception'],
    toolProficiencies: ['Musical Instrument'],
    languages: 1,
    featureName: 'All Eyes on You',
    featureDescription:
      'Your exotic origin draws attention wherever you go. Locals are curious about your homeland and eager to hear your stories, making them more willing to share information and offer aid.',
    availableFeats: ['alert', 'skilled'],
    suggestedCharacteristics:
      'Observant and culturally displaced, comparing everything to home. Might be a wide-eyed explorer embracing the new or a homesick exile searching for a way back.',
  },

  haunted_one: {
    id: 'haunted_one',
    name: 'Haunted One',
    description:
      'Something unspeakable touched your life — a monster, a curse, a glimpse behind the veil. You survived, but the darkness left its fingerprints on your soul.',
    skillProficiencies: ['investigation', 'survival'],
    toolProficiencies: [],
    languages: 0,
    featureName: 'Heart of Darkness',
    featureDescription:
      'Commoners sense the weight of what you carry and instinctively help you. They will shelter you and share what they know about local horrors, hoping you can end the threat.',
    availableFeats: ['tough', 'magic_initiate_wizard'],
    suggestedCharacteristics:
      'Grim and vigilant, carrying a burden others cannot see. Might be a tormented survivor driven to destroy evil or a fatalist walking toward the darkness that claimed them.',
  },

  knight: {
    id: 'knight',
    name: 'Knight',
    description:
      'You swore an oath of service to a lord, a cause, or an ideal. Your sword arm belongs to something greater than yourself, and your word is your unbreakable bond.',
    skillProficiencies: ['history', 'persuasion'],
    toolProficiencies: ['Gaming Set'],
    languages: 1,
    featureName: 'Retainers',
    featureDescription:
      'You have the service of three loyal retainers — a squire, a herald, and a servant. They perform mundane tasks but will not fight or follow you into obvious danger.',
    availableFeats: ['savage_attacker', 'skilled'],
    suggestedCharacteristics:
      'Honorable and duty-bound, living by a code most consider outdated. Might be a shining exemplar of chivalry or a disillusioned knight questioning the oath they swore.',
  },

  pirate: {
    id: 'pirate',
    name: 'Pirate',
    description:
      'You sailed under a black flag and took what the sea offered. The pirate\'s life is brutal and free — a rejection of every rule the landlocked world holds dear.',
    skillProficiencies: ['athletics', 'perception'],
    toolProficiencies: ["Navigator's Tools", 'Vehicles (Water)'],
    languages: 0,
    featureName: 'Bad Reputation',
    featureDescription:
      'Your infamy precedes you. In civilized settlements, people avoid crossing you. You can get away with minor criminal offenses because most folk would rather look away than confront you.',
    availableFeats: ['tavern_brawler', 'tough'],
    suggestedCharacteristics:
      'Fearless and unpredictable, living by the pirate code. Might be a swashbuckling rogue with a twisted sense of honor or a ruthless reaver who takes everything not nailed down.',
  },

  urban_bounty_hunter: {
    id: 'urban_bounty_hunter',
    name: 'Urban Bounty Hunter',
    description:
      'You hunt people for coin in the labyrinthine streets of great cities. Every face in a crowd could be your quarry, and patience is the sharpest blade you carry.',
    skillProficiencies: ['insight', 'stealth'],
    toolProficiencies: ["Thieves' Tools", 'Gaming Set'],
    languages: 0,
    featureName: 'Ear to the Ground',
    featureDescription:
      'You have a network of informants in urban centers who provide tips on bounties, criminal activity, and the movements of wanted individuals. This information comes at a price, but it is reliable.',
    availableFeats: ['alert', 'lucky'],
    suggestedCharacteristics:
      'Patient and methodical, studying prey before striking. Might be a principled hunter who only takes just contracts or a cold professional who asks no questions about the target.',
  },

  faceless: {
    id: 'faceless',
    name: 'Faceless',
    description:
      'You wear a persona like armor — a mask, a title, a legend. The face the world sees is a carefully constructed fiction, and the person beneath it is someone you guard fiercely.',
    skillProficiencies: ['deception', 'intimidation'],
    toolProficiencies: ['Disguise Kit'],
    languages: 1,
    featureName: 'Dual Personalities',
    featureDescription:
      'You maintain two distinct identities with separate reputations, appearances, and social circles. Switching between them is seamless, and no one suspects they are the same person.',
    availableFeats: ['lucky', 'skilled'],
    suggestedCharacteristics:
      'Mysterious and guarded, revealing nothing by accident. Might be a vigilante hiding behind a legend or a fugitive burying a past that could destroy them.',
  },

  courtier: {
    id: 'courtier',
    name: 'Courtier',
    description:
      'You navigated the treacherous currents of royal courts and political intrigue. Every smile hides a dagger, and you learned to read the room before the room reads you.',
    skillProficiencies: ['insight', 'persuasion'],
    toolProficiencies: [],
    languages: 2,
    featureName: 'Court Functionary',
    featureDescription:
      'You understand the inner workings of government and nobility. You can secure audiences with local rulers, navigate bureaucracy with ease, and identify who truly holds power behind the throne.',
    availableFeats: ['skilled', 'lucky'],
    suggestedCharacteristics:
      'Perceptive and politically savvy, always three moves ahead. Might be a loyal advisor seeking to serve the greater good or a cunning schemer who plays every side.',
  },
};

export const BACKGROUND_LIST: BackgroundData[] = Object.values(BACKGROUNDS);
