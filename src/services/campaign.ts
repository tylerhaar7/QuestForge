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
  recruitmentMode?: 'choose' | 'discover';
}

export interface InitCampaignResult {
  campaignId: string;
  aiResponse: AIResponse;
  companions: Companion[];
}

export async function initCampaign(params: InitCampaignParams): Promise<InitCampaignResult> {
  return invokeEdgeFunction<InitCampaignResult>('campaign-init', params, 'Campaign init failed');
}

export interface SubmitActionResult {
  aiResponse: AIResponse;
  diceResults: string[];
  diceRollResults?: DiceRollResult[];
  companions: Companion[];
  turnCount: number;
}

export async function submitAction(campaignId: string, action: string): Promise<SubmitActionResult> {
  return invokeEdgeFunction<SubmitActionResult>('game-turn', { campaignId, action }, 'Game turn failed');
}

async function invokeEdgeFunction<T>(
  fnName: 'campaign-init' | 'game-turn' | 'session-recap',
  body: Record<string, any>,
  failurePrefix: string
): Promise<T> {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !sessionData.session) {
    throw new Error(`${failurePrefix}: Not authenticated. Please sign in again.`);
  }

  let accessToken = sessionData.session.access_token;
  const expiresAt = sessionData.session.expires_at ?? 0;
  const now = Math.floor(Date.now() / 1000);

  if (expiresAt > 0 && expiresAt - now < 90) {
    const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
    if (!refreshError && refreshed.session?.access_token) {
      accessToken = refreshed.session.access_token;
    }
  }

  let data: any;
  let error: any;
  try {
    const result = await supabase.functions.invoke(fnName, {
      body,
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    data = result.data;
    error = result.error;
  } catch (fetchErr: any) {
    throw new Error(`${failurePrefix}: Network error — ${fetchErr?.message || 'check your connection'}`);
  }

  if (error) {
    let message = error.message;
    try {
      const errorBody = await (error as any).context?.json();
      if (errorBody?.error) message = errorBody.error;
    } catch {}
    throw new Error(`${failurePrefix}: ${message}`);
  }

  if ((data as any)?.error) throw new Error((data as any).error);
  return data as T;
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
  companion_pool: any;
  recruitment_mode: string;
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
  last_session_at: string;
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
    companionPool: row.companion_pool || [],
    recruitmentMode: (row.recruitment_mode || 'choose') as 'choose' | 'discover',
    lastSessionAt: row.last_session_at || undefined,
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

// ─── Session Recap ────────────────────────────────

export async function getSessionRecap(campaignId: string): Promise<string> {
  const result = await invokeEdgeFunction<{ recap: string }>('session-recap', { campaignId }, 'Recap failed');
  return result.recap;
}

// ─── Journal ──────────────────────────────────────

export interface JournalRow {
  id: string;
  campaign_id: string;
  turn_number: number;
  entry_type: string;
  title: string;
  description: string;
  tags: string[];
  related_npcs: string[];
  related_locations: string[];
  is_pinned: boolean;
  created_at: string;
}

export async function getJournalEntries(campaignId: string, filter?: string): Promise<JournalRow[]> {
  let query = supabase
    .from('journal_entries')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: false });
  if (filter && filter !== 'all') {
    query = query.eq('entry_type', filter);
  }
  const { data, error } = await query;
  if (error) throw new Error(`Journal fetch failed: ${error.message}`);
  return data || [];
}
