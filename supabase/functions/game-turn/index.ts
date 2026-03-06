// Game Turn — Main turn resolution loop
// Receive player action → call Claude → resolve dice → narrate → update state

import { createClient } from 'npm:@supabase/supabase-js@2';
import Anthropic from 'npm:@anthropic-ai/sdk';
import { getCorsHeaders } from '../_shared/cors.ts';
import { buildSystemPrompt, selectModel } from '../_shared/prompts.ts';
import { processDiceRequests } from '../_shared/dice-engine.ts';
import { parseAIJson, normalizeResponse } from '../_shared/ai-parser.ts';
import { validateGameTurnInput, errorResponse, checkRateLimit } from '../_shared/guards.ts';
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


Deno.serve(async (req) => {
  const headers = getCorsHeaders(req.headers.get('origin'));
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers });
  }

  try {
    // Auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return errorResponse('Missing authorization', 401, headers);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return errorResponse('Unauthorized', 401, headers);
    }

    // Parse and validate request
    const body = await req.json();
    const inputError = validateGameTurnInput(body);
    if (inputError) return errorResponse(inputError, 400, headers);
    const { campaignId, action } = body;

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Rate limit: 10 requests per minute per user
    const allowed = await checkRateLimit(adminClient, user.id, 'game-turn', 10);
    if (!allowed) return errorResponse('Rate limited. Please wait a moment.', 429, headers);

    // Fetch campaign
    const { data: campaign, error: campError } = await adminClient
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .eq('user_id', user.id)
      .single();

    if (campError || !campaign) {
      return errorResponse('Campaign not found', 404, headers);
    }

    // Fetch character
    const { data: character, error: charError } = await adminClient
      .from('characters')
      .select('*')
      .eq('id', campaign.character_id)
      .single();

    if (charError || !character) {
      return errorResponse('Character not found', 404, headers);
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
    let structuredResults: any[] = [];

    if (diceRequests.length > 0) {
      // Extract enemies from combat state
      const enemies = (campaign.combat_state?.enemies || []).map((e: any) => ({
        name: e.name,
        ac: e.ac,
        hp: e.hp,
        maxHp: e.maxHp,
      }));

      const { results, structuredResults: sr, hpChanges } = processDiceRequests(diceRequests, character, enemies);
      diceResults = results;
      structuredResults = sr;

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

    // Auto-end tutorial after turn 6 or if AI signals completion
    if (campaign.is_tutorial && (normalized.tutorialComplete || campaign.turn_count + 1 >= 6)) {
      campaignUpdates.is_tutorial = false;
      normalized.tutorialComplete = true;
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
      diceRollResults: structuredResults || [],
      companions: updatedCompanions,
      turnCount: campaign.turn_count + 1,
    }), {
      headers: { ...headers, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('game-turn error:', error);
    return errorResponse('An unexpected error occurred. Please try again.', 500, headers);
  }
});
