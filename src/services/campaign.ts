// Campaign service — calls Supabase Edge Functions and manages campaign state
import { supabase } from './supabase';
import type { Campaign, Character, Companion, AIResponse, DiceRollResult } from '@/types/game';

// ─── Edge Function callers ──────────────────────────

export interface InitCampaignParams {
  characterId: string;
  mode: 'generated' | 'custom' | 'tutorial';
  customPrompt?: string;
  campaignName?: string;
  companions?: any[];  // CompanionTemplate objects from companion selection
}

export interface InitCampaignResult {
  campaignId: string;
  aiResponse: AIResponse;
  companions: Companion[];
}

export async function initCampaign(params: InitCampaignParams): Promise<InitCampaignResult> {
  const { data, error } = await supabase.functions.invoke('campaign-init', {
    body: params,
  });

  if (error) throw new Error(`Campaign init failed: ${error.message}`);
  if (data?.error) throw new Error(data.error);
  return data;
}

export interface SubmitActionResult {
  aiResponse: AIResponse;
  diceResults: string[];
  diceRollResults?: DiceRollResult[];
  companions: Companion[];
  turnCount: number;
}

export async function submitAction(campaignId: string, action: string): Promise<SubmitActionResult> {
  const { data, error } = await supabase.functions.invoke('game-turn', {
    body: { campaignId, action },
  });

  if (error) throw new Error(`Game turn failed: ${error.message}`);
  if (data?.error) throw new Error(data.error);
  return data;
}

// ─── Supabase queries ───────────────────────────────

interface CampaignRow {
  id: string;
  user_id: string;
  character_id: string;
  name: string;
  current_location: string;
  current_mood: string;
  current_mode: string;
  companions: any;
  combat_state: any;
  quest_log: any;
  story_summary: string;
  death_count: number;
  death_history: any;
  threshold_unlocks: any;
  difficulty_profile: any;
  adventure_map: any;
  turn_count: number;
  turn_history: any;
  created_at: string;
  updated_at: string;
}

function campaignFromRow(row: CampaignRow): Campaign {
  return {
    id: row.id,
    userId: row.user_id,
    characterId: row.character_id,
    name: row.name,
    worldId: '',
    currentLocation: row.current_location || 'Unknown',
    currentMood: (row.current_mood || 'dungeon') as Campaign['currentMood'],
    currentMode: (row.current_mode || 'exploration') as Campaign['currentMode'],
    companions: row.companions || [],
    combatState: row.combat_state || { isActive: false, round: 0, turnIndex: 0, initiativeOrder: [], enemies: [] },
    questLog: row.quest_log || [],
    storySummary: row.story_summary || '',
    deathCount: row.death_count || 0,
    deathHistory: row.death_history || [],
    thresholdUnlocks: row.threshold_unlocks || [],
    difficultyProfile: row.difficulty_profile || {
      winRateLast10: 0.5,
      avgHpAtCombatEnd: 0.6,
      deaths: 0,
      sessionLengthAvg: 0,
      retryRate: 0,
      inputFrequency: 0,
      preference: 'balanced',
    },
    adventureMap: row.adventure_map || undefined,
    turnCount: row.turn_count || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getActiveCampaign(userId: string): Promise<Campaign | null> {
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;
  return campaignFromRow(data);
}

export async function getCampaign(campaignId: string): Promise<Campaign> {
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', campaignId)
    .single();

  if (error || !data) throw new Error(`Campaign not found: ${error?.message}`);
  return campaignFromRow(data);
}
