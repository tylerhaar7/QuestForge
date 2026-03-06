import { supabase, getCurrentUserId } from './supabase';
import type { Character, AbilityScores } from '@/types/game';
import type { EquipmentItem } from '@/types/game';

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
    features: char.features,
    conditions: char.conditions,
    origin_story: char.originStory,
    origin_ai_context: char.originAiContext ?? '',
    personal_quest_flags: char.personalQuestFlags,
    portrait_url: char.portraitUrl ?? null,
  };
}

// Map Supabase row to Character object (snake_case → camelCase)
function fromRow(row: any): Character {
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

export async function getCharacters(): Promise<Character[]> {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from('characters')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch characters: ${error.message}`);
  return (data ?? []).map(fromRow);
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

export async function deleteCharacter(id: string): Promise<void> {
  const { error } = await supabase
    .from('characters')
    .delete()
    .eq('id', id);

  if (error) throw new Error(`Failed to delete character: ${error.message}`);
}
