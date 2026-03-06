// Game Turn — Main turn resolution loop
// Receive player action → call Claude → resolve dice → narrate → update state

import { createClient } from 'npm:@supabase/supabase-js@2';
import Anthropic from 'npm:@anthropic-ai/sdk';
import { corsHeaders } from '../_shared/cors.ts';
import { buildSystemPrompt, selectModel } from '../_shared/prompts.ts';
import { processDiceRequests } from '../_shared/dice-engine.ts';
import type { CompanionData } from '../_shared/types.ts';

const MAX_TURN_HISTORY = 20;

const TUTORIAL_TURN_INSTRUCTIONS: Record<number, string> = {
  1: `TUTORIAL TURN 1 — TEACHING: Narrative Choices
You are running a tutorial. This is the player's FIRST turn.
- Present a simple, low-stakes situation
- Offer 3 clear choices with distinct approaches
- DO NOT include combat, dice rolls, or complex mechanics yet
- Add a brief meta-hint in parentheses after each choice
- Keep narration short (1-2 paragraphs)`,

  2: `TUTORIAL TURN 2 — TEACHING: Combat Basics
- Introduce a simple combat encounter (2-3 weak enemies like goblins)
- Set mode to "combat"
- Include enemy_intentions for each enemy
- Present 3 tactical choices (attack, use environment, defensive action)
- Include dice_requests for attacks
- Add meta-note: "Combat tip: enemies telegraph their moves so you can plan!"`,

  3: `TUTORIAL TURN 3 — TEACHING: Skill Checks
- Present a situation requiring a skill check
- Include at least 2 choices with skill_check objects (show DC, modifier, success_chance)
- Include one choice without a skill check as an alternative
- Add meta-note: "Skill tip: your abilities affect your chances. Higher is better!"`,

  4: `TUTORIAL TURN 4 — TEACHING: Companion Approval
- Create a moral or tactical dilemma where companions disagree
- Have at least 2 companions speak with distinct voices
- Include approval_changes based on the player's last choice
- Add meta-note: "Your companions remember your choices. Their approval affects their loyalty."`,

  5: `TUTORIAL TURN 5 — TEACHING: Freeform Input
- Present an open-ended situation (empty choices array)
- Narrate a moment that invites creative thinking
- Add meta-note: "You can type ANY action you want to try. Be creative!"`,

  6: `TUTORIAL TURN 6 — TEACHING: Consequences
This is the FINAL tutorial turn.
- Present a meaningful decision with real trade-offs
- After the player chooses, narrate the consequence
- End narration with: "And so your story truly begins..."
- Include "tutorial_complete": true in your JSON response
- Include choices: "Create my own character" and "Continue with this character"`,
};

function parseAIJson(rawText: string): any {
  try {
    const codeBlockMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) return JSON.parse(codeBlockMatch[1].trim());
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    return { mode: 'exploration', narration: rawText };
  } catch {
    return { mode: 'exploration', narration: rawText };
  }
}

// Map snake_case AI keys to camelCase for client
function normalizeResponse(raw: any): any {
  const result: any = {
    mode: raw.mode || 'exploration',
    narration: raw.narration || raw.narrative || '',
  };

  if (raw.location) result.location = raw.location;
  if (raw.mood) result.mood = raw.mood;
  if (raw.ambient_hint || raw.ambientHint) result.ambientHint = raw.ambient_hint || raw.ambientHint;

  if (Array.isArray(raw.companion_actions || raw.companionActions)) {
    result.companionActions = raw.companion_actions || raw.companionActions;
  }

  if (Array.isArray(raw.choices)) {
    result.choices = raw.choices.map((c: any) => ({
      text: c.text || '',
      type: c.type || 'action',
      icon: c.icon || '',
      skillCheck: c.skill_check || c.skillCheck ? {
        skill: (c.skill_check || c.skillCheck).skill,
        dc: Number((c.skill_check || c.skillCheck).dc) || 10,
        modifier: Number((c.skill_check || c.skillCheck).modifier) || 0,
        successChance: Number((c.skill_check || c.skillCheck).success_chance || (c.skill_check || c.skillCheck).successChance) || 50,
        advantage: Boolean((c.skill_check || c.skillCheck).advantage),
      } : undefined,
    }));
  }

  if (Array.isArray(raw.dice_requests || raw.diceRequests)) {
    result.diceRequests = (raw.dice_requests || raw.diceRequests).map((d: any) => ({
      type: d.type,
      roller: d.roller || '',
      ability: d.ability,
      target: d.target,
      dc: d.dc ? Number(d.dc) : undefined,
      formula: d.formula,
    }));
  }

  if (Array.isArray(raw.state_changes || raw.stateChanges)) {
    result.stateChanges = raw.state_changes || raw.stateChanges;
  }

  if (Array.isArray(raw.approval_changes || raw.approvalChanges)) {
    result.approvalChanges = (raw.approval_changes || raw.approvalChanges).map((a: any) => ({
      companion: a.companion || '',
      delta: Number(a.delta) || 0,
      reason: a.reason || '',
    }));
  }

  if (Array.isArray(raw.enemy_intentions || raw.enemyIntentions)) {
    result.enemyIntentions = (raw.enemy_intentions || raw.enemyIntentions).map((e: any) => ({
      target: e.target || '',
      action: e.action || '',
      predictedDamage: e.predicted_damage || e.predictedDamage || '',
      special: e.special,
      description: e.description || '',
    }));
  }

  if (raw.tutorial_complete) result.tutorialComplete = true;

  return result;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Auth
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
    const { campaignId, action } = await req.json();
    if (!campaignId || !action) {
      return new Response(JSON.stringify({ error: 'campaignId and action required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Fetch campaign
    const { data: campaign, error: campError } = await adminClient
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .eq('user_id', user.id)
      .single();

    if (campError || !campaign) {
      return new Response(JSON.stringify({ error: 'Campaign not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch character
    const { data: character, error: charError } = await adminClient
      .from('characters')
      .select('*')
      .eq('id', campaign.character_id)
      .single();

    if (charError || !character) {
      return new Response(JSON.stringify({ error: 'Character not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get companions from campaign
    const companions: CompanionData[] = campaign.companions || [];

    // Build system prompt
    let systemPrompt = buildSystemPrompt(campaign, character, companions);

    // Tutorial instruction injection
    if (campaign.is_tutorial) {
      const turnNum = campaign.turn_count + 1;
      const tutorialInstruction = TUTORIAL_TURN_INSTRUCTIONS[turnNum];
      if (tutorialInstruction) {
        systemPrompt += '\n\n---\n\n' + tutorialInstruction;
      }
    }

    // Build messages from turn history + current action
    const messages: { role: 'user' | 'assistant'; content: string }[] = [];
    const turnHistory = campaign.turn_history || [];
    // Include last 10 turns for context
    const recentHistory = turnHistory.slice(-10);
    for (const turn of recentHistory) {
      messages.push({ role: turn.role, content: turn.content });
    }
    messages.push({ role: 'user', content: action });

    // Select model
    const model = selectModel(campaign.current_mode, campaign.current_mood);

    // Call Claude
    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY'),
    });

    const claudeResponse = await anthropic.messages.create({
      model,
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    });

    const rawText = claudeResponse.content
      .filter((block: any) => block.type === 'text')
      .map((block: any) => block.text)
      .join('');

    let aiResponse = parseAIJson(rawText);

    // If dice_requests present, resolve and call Claude again for narration
    const diceRequests = aiResponse.dice_requests || aiResponse.diceRequests || [];
    let diceResults: string[] = [];

    if (diceRequests.length > 0) {
      // Extract enemies from combat state
      const enemies = (campaign.combat_state?.enemies || []).map((e: any) => ({
        name: e.name,
        ac: e.ac,
        hp: e.hp,
        maxHp: e.maxHp,
      }));

      const { results, hpChanges } = processDiceRequests(diceRequests, character, enemies);
      diceResults = results;

      // Apply HP changes to enemies in combat state
      if (hpChanges.length > 0 && campaign.combat_state?.enemies) {
        for (const change of hpChanges) {
          const enemy = campaign.combat_state.enemies.find((e: any) => e.name === change.target);
          if (enemy) {
            enemy.hp = Math.max(0, enemy.hp + change.delta);
          }
        }
      }

      // Call Claude again with mechanical results
      const followUpMessages = [
        ...messages,
        { role: 'assistant' as const, content: rawText },
        {
          role: 'user' as const,
          content: `[GAME ENGINE RESULTS]\n${results.join('\n')}\n\nNarrate these outcomes. Do NOT recalculate any numbers. Include new choices for the player.`,
        },
      ];

      const followUpResponse = await anthropic.messages.create({
        model,
        max_tokens: 1024,
        system: systemPrompt,
        messages: followUpMessages,
      });

      const followUpText = followUpResponse.content
        .filter((block: any) => block.type === 'text')
        .map((block: any) => block.text)
        .join('');

      aiResponse = parseAIJson(followUpText);
    }

    const normalized = normalizeResponse(aiResponse);

    // ─── Update state ────────────────────────────────

    // Update companion approval scores
    const updatedCompanions = [...companions];
    if (normalized.approvalChanges) {
      for (const change of normalized.approvalChanges) {
        const comp = updatedCompanions.find((c: any) => c.name === change.companion);
        if (comp) {
          comp.approvalScore = Math.max(0, Math.min(100, comp.approvalScore + change.delta));
        }
        // Also update companion_states table
        await adminClient
          .from('companion_states')
          .update({ approval_score: comp?.approvalScore ?? 50 })
          .eq('campaign_id', campaignId)
          .eq('companion_name', change.companion);
      }
    }

    // Build updated turn history
    const newHistory = [
      ...turnHistory,
      { role: 'user', content: action },
      { role: 'assistant', content: JSON.stringify(normalized) },
    ].slice(-MAX_TURN_HISTORY);

    // Campaign updates
    const campaignUpdates: Record<string, any> = {
      turn_count: campaign.turn_count + 1,
      companions: updatedCompanions,
      turn_history: newHistory,
    };

    if (normalized.location) campaignUpdates.current_location = normalized.location;
    if (normalized.mood) campaignUpdates.current_mood = normalized.mood;
    if (normalized.mode) campaignUpdates.current_mode = normalized.mode;
    if (campaign.combat_state?.enemies) {
      campaignUpdates.combat_state = campaign.combat_state;
    }

    await adminClient.from('campaigns').update(campaignUpdates).eq('id', campaignId);

    // Apply HP changes to character if needed
    if (normalized.stateChanges) {
      for (const change of normalized.stateChanges) {
        if (change.type === 'hp' && change.target === character.name) {
          const newHp = Math.max(0, Math.min(character.max_hp, character.hp + Number(change.value)));
          await adminClient.from('characters').update({ hp: newHp }).eq('id', character.id);
        }
      }
    }

    // Return response
    return new Response(JSON.stringify({
      aiResponse: normalized,
      diceResults,
      companions: updatedCompanions,
      turnCount: campaign.turn_count + 1,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('game-turn error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
