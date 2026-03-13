// Core game type definitions

// ─── Dice ───────────────────────────────────────────
export type DieType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100';

export interface DiceRoll {
  die: DieType;
  count: number;
  modifier: number;
  advantage?: boolean;
  disadvantage?: boolean;
}

export interface DiceResult {
  rolls: number[];
  total: number;
  isCritical: boolean;
  isFumble: boolean;
  formula: string;
}

// ─── Character ──────────────────────────────────────
export type AbilityScore = 'strength' | 'dexterity' | 'constitution' | 'intelligence' | 'wisdom' | 'charisma';
export type Skill =
  | 'acrobatics' | 'animal_handling' | 'arcana' | 'athletics'
  | 'deception' | 'history' | 'insight' | 'intimidation'
  | 'investigation' | 'medicine' | 'nature' | 'perception'
  | 'performance' | 'persuasion' | 'religion' | 'sleight_of_hand'
  | 'stealth' | 'survival';

export type ClassName =
  | 'barbarian' | 'bard' | 'cleric' | 'druid' | 'fighter'
  | 'monk' | 'paladin' | 'ranger' | 'rogue' | 'sorcerer'
  | 'warlock' | 'wizard' | 'artificer';

export type RaceName =
  | 'human' | 'elf' | 'dwarf' | 'halfling' | 'gnome'
  | 'half_elf' | 'half_orc' | 'tiefling' | 'dragonborn';

export interface AbilityScores {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

export interface Character {
  id: string;
  userId: string;
  name: string;
  race: RaceName;
  className: ClassName;
  subclass: string;
  level: number;
  xp: number;
  abilityScores: AbilityScores;
  hp: number;
  maxHp: number;
  tempHp: number;
  ac: number;
  speed: number;
  proficiencyBonus: number;
  proficientSkills: Skill[];
  proficientSaves: AbilityScore[];
  spellSlots: number[];        // Index = slot level (1-9), value = remaining
  maxSpellSlots: number[];
  equipment: EquipmentItem[];
  inventory: InventoryItem[];
  knownSpells: Spell[];
  features: string[];          // Class/race feature IDs
  conditions: Condition[];
  originStory: string;         // Origin story ID
  originAiContext: string;     // AI prompt context for origin
  personalQuestFlags: Record<string, boolean>;
  portraitUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EquipmentItem {
  id: string;
  name: string;
  type: 'weapon' | 'armor' | 'shield' | 'accessory';
  equipped: boolean;
  properties: Record<string, string | number>;
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  description: string;
  type: 'consumable' | 'quest' | 'treasure' | 'material' | 'misc';
}

export interface Spell {
  name: string;
  level: number;        // 0 = cantrip, 1-9
  school: string;       // "evocation", "abjuration", etc.
  castingTime: string;  // "1 action", "1 bonus action"
  range: string;        // "120 feet", "Touch", "Self"
  duration: string;     // "Instantaneous", "1 hour"
  description: string;
  components: string;   // "V, S, M (a bit of fleece)"
}

export type Condition =
  | 'blinded' | 'charmed' | 'deafened' | 'frightened'
  | 'grappled' | 'incapacitated' | 'invisible' | 'paralyzed'
  | 'petrified' | 'poisoned' | 'prone' | 'restrained'
  | 'stunned' | 'unconscious' | 'exhaustion_1' | 'exhaustion_2'
  | 'exhaustion_3' | 'exhaustion_4' | 'exhaustion_5';

// ─── Companion ──────────────────────────────────────
export interface Companion {
  name: string;
  className: ClassName;
  level: number;
  hp: number;
  maxHp: number;
  ac: number;
  portrait: string;
  color: string;
  approvalScore: number;       // 0-100
  relationshipStage: RelationshipStage;
  personality: CompanionPersonality;
  abilities: CompanionAbility[];
  conditions: Condition[];
}

export type RelationshipStage =
  | 'hostile' | 'cold' | 'neutral' | 'friendly'
  | 'trusted' | 'bonded' | 'devoted';

export interface CompanionPersonality {
  approves: string[];          // Tags: ['nature_protection', 'patience']
  disapproves: string[];       // Tags: ['destruction', 'deception']
  voice: string;               // Brief personality descriptor for AI
  backstory: string;
}

export interface CompanionAbility {
  name: string;
  type: 'attack' | 'spell' | 'reaction' | 'bonus' | 'heal';
  description: string;
  icon: string;
}

// ─── Combat ─────────────────────────────────────────
export interface CombatState {
  isActive: boolean;
  round: number;
  turnIndex: number;
  initiativeOrder: InitiativeEntry[];
  enemies: Enemy[];
}

export interface InitiativeEntry {
  name: string;
  initiative: number;
  side: 'party' | 'enemy';
  index: number;               // Index into party or enemies array
}

export interface Enemy {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  ac: number;
  portrait: string;
  intention?: EnemyIntention;
  conditions: Condition[];
}

export interface EnemyIntention {
  target: string;              // Name of the target
  action: string;              // "Aimed Shot", "Reckless Charge"
  predictedDamage: string;     // "1d8+2 (avg 6)"
  special?: string;            // "knockback 10ft"
  description: string;
}

// ─── Campaign ───────────────────────────────────────
export type GameMode = 'exploration' | 'combat' | 'social' | 'rest' | 'camp' | 'threshold';
export type MoodType = 'dungeon' | 'combat' | 'tavern' | 'forest' | 'town' | 'camp' | 'threshold' | 'boss';

export interface Campaign {
  id: string;
  userId: string;
  characterId: string;
  name: string;
  worldId: string;
  currentLocation: string;
  currentMood: MoodType;
  currentMode: GameMode;
  companions: Companion[];
  combatState: CombatState;
  questLog: Quest[];
  storySummary: string;
  deathCount: number;
  deathHistory: DeathRecord[];
  thresholdUnlocks: string[];
  difficultyProfile: DifficultyProfile;
  adventureMap?: AdventureMap;
  turnCount: number;
  companionPool?: CompanionPoolEntry[];
  recruitmentMode: 'choose' | 'discover';
  lastSessionAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Quest {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'completed' | 'failed';
  isPersonalQuest: boolean;
  objectives: QuestObjective[];
}

export interface QuestObjective {
  description: string;
  completed: boolean;
}

export interface DeathRecord {
  turn: number;
  cause: string;
  location: string;
  enemy?: string;
  companionsPresent: string[];
}

export interface DifficultyProfile {
  winRateLast10: number;
  avgHpAtCombatEnd: number;
  deaths: number;
  sessionLengthAvg: number;
  retryRate: number;
  inputFrequency: number;
  preference: 'story' | 'balanced' | 'hardcore';
}

// ─── Adventure Map (Slay the Spire) ────────────────
export type MapNodeType =
  | 'combat' | 'elite' | 'boss' | 'rest'
  | 'merchant' | 'mystery' | 'social' | 'treasure' | 'companion';

export interface MapNode {
  id: string;
  type: MapNodeType;
  connections: string[];
  completed: boolean;
  difficulty: 1 | 2 | 3;
  teaser: string;
  icon: string;
}

export interface AdventureMap {
  nodes: MapNode[];
  currentNodeId: string;
  chapterTitle: string;
}

// ─── AI Response ────────────────────────────────────
export interface AIResponse {
  mode: GameMode;
  narration: string;
  location?: string;
  companionActions?: CompanionAction[];
  choices?: Choice[];
  diceRequests?: DiceRequest[];
  stateChanges?: StateChange[];
  approvalChanges?: ApprovalChange[];
  enemyIntentions?: EnemyIntention[];
  threadUpdates?: ThreadUpdate[];
  mood?: MoodType;
  ambientHint?: string;
  tutorialComplete?: boolean;
  companionEncounter?: CompanionEncounter;
  journalEntries?: JournalEntry[];
  spellChanges?: { learned: Spell[]; removed: string[] };
}

export interface CompanionAction {
  companion: string;
  action: string;
  dialogue?: string;
}

export interface Choice {
  text: string;
  type: string;
  icon: string;
  skillCheck?: SkillCheck;
}

export interface SkillCheck {
  skill: Skill;
  dc: number;
  modifier: number;
  successChance: number;
  advantage: boolean;
}

export interface DiceRequest {
  type: 'attack_roll' | 'saving_throw' | 'skill_check' | 'damage' | 'initiative';
  roller: string;
  ability?: string;
  target?: string;
  dc?: number;
  formula?: string;
}

export interface DiceRollResult {
  type: 'skill_check' | 'attack_roll' | 'saving_throw' | 'damage';
  roller: string;
  roll: number;          // raw d20 result (1-20)
  modifier: number;
  total: number;         // roll + modifier
  dc?: number;
  success?: boolean;
  isCritical: boolean;
  isFumble: boolean;
  label: string;         // "Stealth Check", "Longsword Attack"
}

export interface StateChange {
  type: 'hp' | 'condition' | 'item' | 'xp' | 'spell_slot' | 'quest' | 'location';
  target: string;
  value: string | number | boolean | Record<string, unknown>;
}

export interface ApprovalChange {
  companion: string;
  delta: number;
  reason: string;
}

export interface ThreadUpdate {
  threadId: string;
  action: 'advance' | 'resolve' | 'introduce';
  detail: string;
}

// ─── Companion Pool ────────────────────────────────
export interface CompanionPoolEntry extends Companion {
  recruited: boolean;
  introduced: boolean;
  aiGenerated: boolean;
  introductionTurn?: number;
}

export interface CompanionEncounter {
  companionName: string;
  hook: string;
  miniQuestHint: string;
}

// ─── Journal ───────────────────────────────────────
export type JournalEntryType =
  | 'npc_met' | 'quest_accepted' | 'quest_completed'
  | 'location_discovered' | 'item_found' | 'lore_learned'
  | 'decision_made' | 'companion_event'
  | 'combat_victory' | 'combat_defeat';

export interface JournalEntry {
  entryType: JournalEntryType;
  title: string;
  description: string;
  relatedNpcs?: string[];
  relatedLocations?: string[];
}
