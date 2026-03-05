// Minimal types for Edge Functions — mirrors src/types/game.ts

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
  | 'warlock' | 'wizard';

export type GameMode = 'exploration' | 'combat' | 'social' | 'rest' | 'camp' | 'threshold';
export type MoodType = 'dungeon' | 'combat' | 'tavern' | 'forest' | 'town' | 'camp' | 'threshold' | 'boss';

export interface AbilityScores {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

export interface DiceRequest {
  type: 'attack_roll' | 'saving_throw' | 'skill_check' | 'damage' | 'initiative';
  roller: string;
  ability?: string;
  target?: string;
  dc?: number;
  formula?: string;
}

export interface CharacterRow {
  id: string;
  name: string;
  race: string;
  class_name: ClassName;
  level: number;
  ability_scores: AbilityScores;
  hp: number;
  max_hp: number;
  ac: number;
  speed: number;
  proficiency_bonus: number;
  proficient_skills: Skill[];
  proficient_saves: AbilityScore[];
  equipment: any[];
  conditions: string[];
  origin_story: string;
}

export interface CampaignRow {
  id: string;
  user_id: string;
  character_id: string;
  name: string;
  current_location: string;
  current_mood: MoodType;
  current_mode: GameMode;
  companions: any;
  combat_state: any;
  quest_log: any;
  story_summary: string;
  death_count: number;
  difficulty_profile: any;
  turn_count: number;
  turn_history: any[];
}

export interface CompanionData {
  name: string;
  className: ClassName;
  level: number;
  hp: number;
  maxHp: number;
  ac: number;
  approvalScore: number;
  relationshipStage: string;
  personality: {
    approves: string[];
    disapproves: string[];
    voice: string;
  };
  conditions: string[];
}
