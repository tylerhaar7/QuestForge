// Campaign Init — Creates a new campaign and generates opening narration
// Called after character creation

import { createClient } from 'npm:@supabase/supabase-js@2';
import Anthropic from 'npm:@anthropic-ai/sdk';
import { corsHeaders } from '../_shared/cors.ts';
import {
  buildSystemPrompt,
  CAMPAIGN_INIT_GENERATED_PROMPT,
  buildCampaignInitCustomPrompt,
} from '../_shared/prompts.ts';
import type { CompanionData } from '../_shared/types.ts';

// Starter companions (server-side copy)
const STARTER_COMPANIONS: CompanionData[] = [
  {
    name: 'Korrin',
    className: 'fighter',
    level: 1,
    hp: 12,
    maxHp: 12,
    ac: 16,
    approvalScore: 50,
    relationshipStage: 'neutral',
    personality: {
      approves: ['honor', 'protection', 'honesty', 'bravery', 'defending_innocents'],
      disapproves: ['deception', 'cowardice', 'harming_innocents', 'betrayal', 'cruelty'],
      voice: 'Steadfast and earnest. Speaks plainly. Believes in doing the right thing even when it costs.',
    },
    conditions: [],
  },
  {
    name: 'Sera',
    className: 'rogue',
    level: 1,
    hp: 9,
    maxHp: 9,
    ac: 14,
    approvalScore: 50,
    relationshipStage: 'neutral',
    personality: {
      approves: ['cleverness', 'loyalty', 'street_smarts', 'pragmatism', 'wit'],
      disapproves: ['naivety', 'blind_authority', 'unnecessary_cruelty', 'stupidity'],
      voice: 'Sharp-tongued and quick. Uses humor to deflect. Fiercely loyal once trust is earned.',
    },
    conditions: [],
  },
  {
    name: 'Thaelen',
    className: 'druid',
    level: 1,
    hp: 9,
    maxHp: 9,
    ac: 13,
    approvalScore: 50,
    relationshipStage: 'neutral',
    personality: {
      approves: ['nature_protection', 'patience', 'wisdom', 'empathy', 'balance'],
      disapproves: ['destruction', 'haste', 'fire_use', 'greed', 'waste'],
      voice: 'Thoughtful and measured. Speaks with quiet authority. Occasionally cryptic.',
    },
    conditions: [],
  },
];

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Auth: get user from JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request
    const { characterId, mode, customPrompt, campaignName } = await req.json();
    if (!characterId) {
      return new Response(JSON.stringify({ error: 'characterId required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Service role client for writes
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Fetch character
    const { data: character, error: charError } = await adminClient
      .from('characters')
      .select('*')
      .eq('id', characterId)
      .eq('user_id', user.id)
      .single();

    if (charError || !character) {
      return new Response(JSON.stringify({ error: 'Character not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create campaign row
    const campaignData = {
      user_id: user.id,
      character_id: characterId,
      name: campaignName || `${character.name}'s Adventure`,
      current_location: 'Unknown',
      current_mood: 'tavern',
      current_mode: 'exploration',
      companions: STARTER_COMPANIONS,
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
    };

    const { data: campaign, error: campaignError } = await adminClient
      .from('campaigns')
      .insert(campaignData)
      .select()
      .single();

    if (campaignError || !campaign) {
      return new Response(JSON.stringify({ error: `Failed to create campaign: ${campaignError?.message}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create companion_states rows
    for (const comp of STARTER_COMPANIONS) {
      await adminClient.from('companion_states').insert({
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
    }

    // Build prompt and call Claude for opening narration
    const systemPrompt = buildSystemPrompt(campaign, character, STARTER_COMPANIONS);
    const userMessage = mode === 'custom' && customPrompt
      ? buildCampaignInitCustomPrompt(customPrompt)
      : CAMPAIGN_INIT_GENERATED_PROMPT;

    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY'),
    });

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });

    // Extract text from response
    const rawText = response.content
      .filter((block: any) => block.type === 'text')
      .map((block: any) => block.text)
      .join('');

    // Parse AI response (simple JSON extraction)
    let aiResponse;
    try {
      const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/) || rawText.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]).trim() : rawText;
      aiResponse = JSON.parse(jsonStr);
    } catch {
      // Fallback: treat as narration
      aiResponse = {
        mode: 'exploration',
        narration: rawText,
        choices: [
          { text: 'Look around carefully', type: 'knowledge', icon: '👁️' },
          { text: 'Introduce yourself to nearby people', type: 'diplomatic', icon: '🗣️' },
          { text: 'Find a quiet corner to plan', type: 'stealth', icon: '🤔' },
        ],
        mood: 'tavern',
      };
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

    await adminClient.from('campaigns').update(updates).eq('id', campaign.id);

    // Return to client
    return new Response(JSON.stringify({
      campaignId: campaign.id,
      aiResponse,
      companions: STARTER_COMPANIONS,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('campaign-init error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
