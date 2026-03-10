// Campaign Init — Creates a new campaign and generates opening narration
// Called after character creation

import { createClient } from 'npm:@supabase/supabase-js@2';
import Anthropic from 'npm:@anthropic-ai/sdk';
import { getCorsHeaders } from '../_shared/cors.ts';
import {
  buildSystemPrompt,
  CAMPAIGN_INIT_GENERATED_PROMPT,
  CAMPAIGN_INIT_DISCOVER_PROMPT,
  buildCampaignInitCustomPrompt,
} from '../_shared/prompts.ts';
import { parseAIJson, normalizeResponse } from '../_shared/ai-parser.ts';
import { validateCampaignInitInput, errorResponse, checkRateLimit } from '../_shared/guards.ts';
import type { CompanionData } from '../_shared/types.ts';

// Default fallback companions (used when client doesn't provide companions)
const DEFAULT_COMPANIONS: CompanionData[] = [
  {
    name: 'Korrin',
    className: 'fighter',
    level: 1,
    hp: 12,
    maxHp: 12,
    ac: 16,
    portrait: '',
    color: '#c4a035',
    approvalScore: 50,
    relationshipStage: 'neutral',
    personality: {
      approves: ['honor', 'protection', 'honesty', 'bravery', 'defending_innocents'],
      disapproves: ['deception', 'cowardice', 'harming_innocents', 'betrayal', 'cruelty'],
      voice: 'Steadfast and earnest. Speaks plainly. Believes in doing the right thing even when it costs.',
      backstory: 'A disgraced soldier seeking redemption through honest service.',
    },
    abilities: [
      { name: 'Second Wind', type: 'heal', description: 'Recover 1d10+1 HP', icon: '💨' },
      { name: 'Protection', type: 'reaction', description: 'Impose disadvantage on attack targeting adjacent ally', icon: '🛡️' },
    ],
    conditions: [],
  },
  {
    name: 'Sera',
    className: 'rogue',
    level: 1,
    hp: 9,
    maxHp: 9,
    ac: 14,
    portrait: '',
    color: '#8b5cf6',
    approvalScore: 50,
    relationshipStage: 'neutral',
    personality: {
      approves: ['cleverness', 'loyalty', 'street_smarts', 'pragmatism', 'wit'],
      disapproves: ['naivety', 'blind_authority', 'unnecessary_cruelty', 'stupidity'],
      voice: 'Sharp-tongued and quick. Uses humor to deflect. Fiercely loyal once trust is earned.',
      backstory: 'A former street urchin who learned that trust is a luxury.',
    },
    abilities: [
      { name: 'Sneak Attack', type: 'attack', description: 'Extra 1d6 damage with advantage', icon: '🗡️' },
      { name: 'Cunning Action', type: 'bonus', description: 'Dash, Disengage, or Hide as bonus action', icon: '💨' },
    ],
    conditions: [],
  },
  {
    name: 'Thaelen',
    className: 'druid',
    level: 1,
    hp: 9,
    maxHp: 9,
    ac: 13,
    portrait: '',
    color: '#22c55e',
    approvalScore: 50,
    relationshipStage: 'neutral',
    personality: {
      approves: ['nature_protection', 'patience', 'wisdom', 'empathy', 'balance'],
      disapproves: ['destruction', 'haste', 'fire_use', 'greed', 'waste'],
      voice: 'Thoughtful and measured. Speaks with quiet authority. Occasionally cryptic.',
      backstory: 'A wandering druid whose grove was destroyed. Seeks to understand why the natural order is breaking.',
    },
    abilities: [
      { name: 'Healing Word', type: 'heal', description: 'Heal 1d4+2 at range as bonus action', icon: '🌿' },
      { name: 'Entangle', type: 'spell', description: 'Restrain creatures in a 20ft area', icon: '🌱' },
    ],
    conditions: [],
  },
];

const TUTORIAL_OPENING_PROMPT = `You are starting a tutorial campaign called "The First Door."
This is a new player learning D&D for the first time through play.

Create an opening scene that:
1. Places the player outside a mysterious tavern at dusk — "The First Door Inn"
2. The atmosphere is welcoming but intriguing — not threatening
3. Introduce the three companions (Korrin, Sera, Thaelen) as fellow travelers who just arrived
4. Present 3 simple choices for what to do next (enter the tavern, investigate the area, talk to companions)
5. Add brief meta-hints in parentheses explaining each choice type
6. Keep it SHORT — 2 paragraphs max

Remember: NO dice rolls, NO combat. Just narrative choices.`;

/**
 * Convert a CompanionTemplate (client-side shape) to CompanionData (server-side shape).
 * Client sends: { name, className, level, maxHp, ac, portrait, color, personality, abilities }
 * Server needs: { name, className, level, hp, maxHp, ac, approvalScore, relationshipStage, personality, conditions }
 */
function templateToCompanionData(template: any): CompanionData {
  return {
    name: template.name,
    className: template.className,
    level: template.level || 1,
    hp: template.maxHp,
    maxHp: template.maxHp,
    ac: template.ac,
    portrait: template.portrait || '',
    color: template.color || '#b48c3c',
    approvalScore: 50,
    relationshipStage: 'neutral',
    personality: {
      approves: template.personality?.approves || [],
      disapproves: template.personality?.disapproves || [],
      voice: template.personality?.voice || '',
      backstory: template.personality?.backstory || '',
    },
    abilities: template.abilities || [],
    conditions: [],
  };
}

Deno.serve(async (req) => {
  const headers = getCorsHeaders(req.headers.get('origin'));
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers });
  }

  try {
    // Auth: verify JWT manually (verify_jwt disabled at gateway due to ES256 incompatibility)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return errorResponse('Missing authorization', 401, headers);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return errorResponse('Unauthorized', 401, headers);
    }

    // Parse and validate request
    const body = await req.json();
    const inputError = validateCampaignInitInput(body);
    if (inputError) return errorResponse(inputError, 400, headers);
    const { characterId, mode, customPrompt, campaignName, companions: rawCompanions, recruitmentMode: reqRecruitmentMode } = body;
    const recruitmentMode = reqRecruitmentMode === 'discover' ? 'discover' : 'choose';

    // Service role client for writes
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Rate limit: 5 campaign inits per minute per user
    const allowed = await checkRateLimit(adminClient, user.id, 'campaign-init', 5);
    if (!allowed) return errorResponse('Rate limited. Please wait a moment.', 429, headers);

    // Use provided companions or fall back to defaults
    // Tutorial mode always uses DEFAULT_COMPANIONS regardless of client input
    const campaignCompanions: CompanionData[] =
      mode === 'tutorial'
        ? DEFAULT_COMPANIONS
        : Array.isArray(rawCompanions) && rawCompanions.length > 0
          ? rawCompanions.map(templateToCompanionData)
          : DEFAULT_COMPANIONS;

    // Fetch character
    const { data: character, error: charError } = await adminClient
      .from('characters')
      .select('*')
      .eq('id', characterId)
      .eq('user_id', user.id)
      .single();

    if (charError || !character) {
      return errorResponse('Character not found', 404, headers);
    }

    // Build companion pool for discover mode
    const companionPool = recruitmentMode === 'discover'
      ? campaignCompanions.map((c, i) => ({
          ...c,
          recruited: false,
          introduced: false,
          aiGenerated: false,
          introductionTurn: [5, 15, 25, 35][i] || 5 + i * 10,
        }))
      : campaignCompanions.map(c => ({
          ...c,
          recruited: true,
          introduced: true,
          aiGenerated: false,
        }));

    // In discover mode, active party starts empty; in choose mode, all join immediately
    const activeCompanions = recruitmentMode === 'discover' ? [] : campaignCompanions;

    // Create campaign row
    const campaignData = {
      user_id: user.id,
      character_id: characterId,
      name: campaignName || `${character.name}'s Adventure`,
      is_tutorial: mode === 'tutorial',
      current_location: 'Unknown',
      current_mood: 'tavern',
      current_mode: 'exploration',
      companions: activeCompanions,
      companion_pool: companionPool,
      recruitment_mode: recruitmentMode,
      combat_state: { isActive: false, round: 0, turnIndex: 0, initiativeOrder: [], enemies: [] },
      quest_log: [],
      story_summary: '',
      death_count: 0,
      death_history: [],
      threshold_unlocks: [],
      difficulty_profile: {
        winRateLast10: 0.5,
        avgHpAtCombatEnd: 0.6,
        deaths: 0,
        sessionLengthAvg: 0,
        retryRate: 0,
        inputFrequency: 0,
        preference: 'balanced',
      },
      adventure_map: null,
      turn_count: 0,
      turn_history: [],
      last_session_at: new Date().toISOString(),
    };

    const { data: campaign, error: campaignError } = await adminClient
      .from('campaigns')
      .insert(campaignData)
      .select()
      .single();

    if (campaignError || !campaign) {
      return errorResponse('Failed to create campaign.', 500, headers);
    }

    // Create companion_states rows (only for actively recruited companions)
    for (const comp of activeCompanions) {
      const { error: compError } = await adminClient.from('companion_states').insert({
        campaign_id: campaign.id,
        companion_name: comp.name,
        approval_score: 50,
        relationship_stage: 'neutral',
        personal_quest_stage: 0,
        personal_quest_flags: {},
        memorable_moments: [],
        unlocked_abilities: [],
        gift_history: [],
      });
      if (compError) {
        return errorResponse(`Failed to create companion state for ${comp.name}.`, 500, headers);
      }
    }

    // Build prompt and call Claude for opening narration
    const systemPrompt = buildSystemPrompt(campaign, character, activeCompanions);
    const isDiscover = recruitmentMode === 'discover';
    const userMessage = mode === 'tutorial'
      ? TUTORIAL_OPENING_PROMPT
      : mode === 'custom' && customPrompt
        ? buildCampaignInitCustomPrompt(customPrompt, isDiscover)
        : isDiscover
          ? CAMPAIGN_INIT_DISCOVER_PROMPT
          : CAMPAIGN_INIT_GENERATED_PROMPT;

    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY'),
    });

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userMessage },
      ],
    });

    const rawText = response.content
      .filter((block: any) => block.type === 'text')
      .map((block: any) => block.text)
      .join('');

    // Parse and normalize AI response (shared parser handles malformed JSON)
    const parsedResponse = parseAIJson(rawText);
    const aiResponse = normalizeResponse(parsedResponse);

    // Ensure fallback choices if none provided
    if (!aiResponse.choices || aiResponse.choices.length === 0) {
      aiResponse.choices = [
        { text: 'Look around carefully', type: 'knowledge', icon: '👁️' },
        { text: 'Introduce yourself to nearby people', type: 'diplomatic', icon: '🗣️' },
        { text: 'Find a quiet corner to plan', type: 'stealth', icon: '🤔' },
      ];
    }

    // Update campaign with initial state from AI
    const updates: Record<string, any> = {
      turn_count: 1,
      story_summary: aiResponse.narration?.substring(0, 500) || '',
      turn_history: [
        { role: 'user', content: userMessage },
        { role: 'assistant', content: rawText },
      ],
    };
    if (aiResponse.location) updates.current_location = aiResponse.location;
    if (aiResponse.mood) updates.current_mood = aiResponse.mood;
    if (aiResponse.mode) updates.current_mode = aiResponse.mode;

    // Tutorial mode overrides location and mood
    if (mode === 'tutorial') {
      updates.current_location = 'The First Door Inn';
      updates.current_mood = 'tavern';
    }

    const { error: updateError } = await adminClient.from('campaigns').update(updates).eq('id', campaign.id);
    if (updateError) {
      return errorResponse('Failed to update campaign.', 500, headers);
    }

    return new Response(JSON.stringify({
      campaignId: campaign.id,
      aiResponse,
      companions: activeCompanions,
      companionPool,
      recruitmentMode,
    }), {
      headers: { ...headers, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('campaign-init error:', msg, error);
    return errorResponse(`Server error: ${msg}`, 500, headers);
  }
});
