import { supabase } from './supabase';
import type { Character, AbilityScores, RaceName, ClassName, Skill, AbilityScore, EquipmentItem, InventoryItem, Spell, Condition } from '@/types/game';

interface CharacterRow {
  id: string;
  user_id: string;
  name: string;
  race: RaceName;
  class_name: ClassName;
  subclass: string | null;
  level: number;
  xp: number;
  ability_scores: AbilityScores;
  hp: number;
  max_hp: number;
  temp_hp: number | null;
  ac: number;
  speed: number;
  proficiency_bonus: number;
  proficient_skills: Skill[] | null;
  proficient_saves: AbilityScore[] | null;
  spell_slots: number[] | null;
  max_spell_slots: number[] | null;
  equipment: EquipmentItem[] | null;
  inventory: InventoryItem[] | null;
  known_spells: Spell[] | null;
  features: string[] | null;
  conditions: Condition[] | null;
  origin_story: string | null;
  origin_ai_context: string | null;
  personal_quest_flags: Record<string, boolean> | null;
  portrait_url: string | null;
  created_at: string;
  updated_at: string;
}

// Map Character object to Supabase row (camelCase → snake_case)
function toRow(char: Omit<Character, 'id' | 'createdAt' | 'updatedAt'>) {
  return {
    user_id: char.userId,
    name: char.name,
    race: char.race,
    class_name: char.className,
    subclass: char.subclass,
    level: char.level,
    xp: char.xp,
    ability_scores: char.abilityScores,
    hp: char.hp,
    max_hp: char.maxHp,
    temp_hp: char.tempHp,
    ac: char.ac,
    speed: char.speed,
    proficiency_bonus: char.proficiencyBonus,
    proficient_skills: char.proficientSkills,
    proficient_saves: char.proficientSaves,
    spell_slots: char.spellSlots,
    max_spell_slots: char.maxSpellSlots,
    equipment: char.equipment,
    inventory: char.inventory,
    known_spells: char.knownSpells,
    features: char.features,
    conditions: char.conditions,
    origin_story: char.originStory,
    origin_ai_context: char.originAiContext ?? '',
    personal_quest_flags: char.personalQuestFlags,
    portrait_url: char.portraitUrl ?? null,
  };
}

// Map Supabase row to Character object (snake_case → camelCase)
function fromRow(row: CharacterRow): Character {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    race: row.race,
    className: row.class_name,
    subclass: row.subclass ?? '',
    level: row.level,
    xp: row.xp,
    abilityScores: row.ability_scores as AbilityScores,
    hp: row.hp,
    maxHp: row.max_hp,
    tempHp: row.temp_hp ?? 0,
    ac: row.ac,
    speed: row.speed,
    proficiencyBonus: row.proficiency_bonus,
    proficientSkills: row.proficient_skills ?? [],
    proficientSaves: row.proficient_saves ?? [],
    spellSlots: row.spell_slots ?? [],
    maxSpellSlots: row.max_spell_slots ?? [],
    equipment: row.equipment ?? [],
    inventory: row.inventory ?? [],
    knownSpells: row.known_spells ?? [],
    features: row.features ?? [],
    conditions: row.conditions ?? [],
    originStory: row.origin_story ?? '',
    originAiContext: row.origin_ai_context ?? '',
    personalQuestFlags: row.personal_quest_flags ?? {},
    portraitUrl: row.portrait_url ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createCharacter(
  char: Omit<Character, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Character> {
  const { data, error } = await supabase
    .from('characters')
    .insert(toRow(char))
    .select()
    .single();

  if (error) throw new Error(`Failed to create character: ${error.message}`);
  return fromRow(data);
}

export async function getCharacter(id: string): Promise<Character> {
  const { data, error } = await supabase
    .from('characters')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(`Failed to fetch character: ${error.message}`);
  return fromRow(data);
}
