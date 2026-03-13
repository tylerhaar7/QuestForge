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

// Maps natural language patterns to D&D skills for freeform skill check detection.
// Each entry: [regex pattern, skill name, default DC]
const SKILL_PATTERNS: [RegExp, string, number][] = [
  // Explicit skill mentions: "roll arcana", "make a stealth check", "pass a perception check"
  [/(?:roll|check|pass|make|attempt|try).*?\b(stealth)\b/i, 'stealth', 14],
  [/(?:roll|check|pass|make|attempt|try).*?\b(perception)\b/i, 'perception', 13],
  [/(?:roll|check|pass|make|attempt|try).*?\b(arcana)\b/i, 'arcana', 14],
  [/(?:roll|check|pass|make|attempt|try).*?\b(religion)\b/i, 'religion', 13],
  [/(?:roll|check|pass|make|attempt|try).*?\b(history)\b/i, 'history', 12],
  [/(?:roll|check|pass|make|attempt|try).*?\b(nature)\b/i, 'nature', 12],
  [/(?:roll|check|pass|make|attempt|try).*?\b(investigation)\b/i, 'investigation', 13],
  [/(?:roll|check|pass|make|attempt|try).*?\b(insight)\b/i, 'insight', 13],
  [/(?:roll|check|pass|make|attempt|try).*?\b(persuasion)\b/i, 'persuasion', 14],
  [/(?:roll|check|pass|make|attempt|try).*?\b(deception)\b/i, 'deception', 14],
  [/(?:roll|check|pass|make|attempt|try).*?\b(intimidation)\b/i, 'intimidation', 14],
  [/(?:roll|check|pass|make|attempt|try).*?\b(athletics)\b/i, 'athletics', 13],
  [/(?:roll|check|pass|make|attempt|try).*?\b(acrobatics)\b/i, 'acrobatics', 13],
  [/(?:roll|check|pass|make|attempt|try).*?\b(medicine)\b/i, 'medicine', 12],
  [/(?:roll|check|pass|make|attempt|try).*?\b(survival)\b/i, 'survival', 12],
  [/(?:roll|check|pass|make|attempt|try).*?\b(performance)\b/i, 'performance', 13],
  [/(?:roll|check|pass|make|attempt|try).*?\b(sleight.?of.?hand)\b/i, 'sleight_of_hand', 14],
  [/(?:roll|check|pass|make|attempt|try).*?\b(animal.?handling)\b/i, 'animal_handling', 12],
  // Action-based detection: "I try to sneak", "I attempt to persuade"
  [/\b(?:sneak|hide|creep|slip)\b/i, 'stealth', 14],
  [/\b(?:persuade|convince|talk.*into|reason with)\b/i, 'persuasion', 14],
  [/\b(?:deceive|lie|bluff|trick)\b/i, 'deception', 14],
  [/\b(?:intimidate|threaten|scare|menace)\b/i, 'intimidation', 14],
  [/\b(?:pick.*lock|lockpick|pickpocket|steal)\b/i, 'sleight_of_hand', 14],
  [/\b(?:climb|jump|swim|lift|break.*down|force.*open)\b/i, 'athletics', 13],
  [/\b(?:dodge|tumble|balance|flip)\b/i, 'acrobatics', 13],
  [/\b(?:search|look.*for|examine|inspect|investigate)\b/i, 'investigation', 13],
  [/\b(?:listen|watch|spot|notice|sense)\b/i, 'perception', 13],
  [/\b(?:heal|treat|bandage|stabilize)\b/i, 'medicine', 12],
  [/\b(?:track|forage|navigate|survive)\b/i, 'survival', 12],
  [/\b(?:read.*motive|sense.*lie|see.*through)\b/i, 'insight', 13],
  [/\b(?:recall|remember|identify.*magic|detect.*magic|commune|pray)\b/i, 'arcana', 14],
];

function detectSkillCheckFromText(text: string): { skill: string; dc: number } | null {
  const lower = text.toLowerCase();
  // Skip if the text is clearly conversational (very short or no action verbs)
  if (lower.length < 10) return null;
  // Skip if it's just dialogue or a simple statement
  if (/^["']/.test(lower) || /^i\s+say\b/i.test(lower)) return null;

  for (const [pattern, skill, dc] of SKILL_PATTERNS) {
    if (pattern.test(text)) {
      return { skill, dc };
    }
  }
  return null;
}

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

    // Pass JWT explicitly — newer SDK versions don't use global headers for getUser()
    const match = authHeader.match(/^Bearer\s+(\S+)$/);
    if (!match) return errorResponse('Invalid authorization format', 401, headers);
    const token = match[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
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
    // Detect skill check requirements and resolve dice before calling Claude.
    // Source 1: [SKILL CHECK REQUIRED: skill DC X] tag from choice buttons
    // Source 2: Freeform text that implies a skill check (e.g. "I try to sneak")
    let preRolledResults: string[] = [];
    let preRolledStructured: any[] = [];
    let cleanAction = action;

    // Long rest interception: restore HP before calling Claude
    if (action === '[LONG REST]') {
      await adminClient.from('characters').update({ hp: character.max_hp }).eq('id', character.id);
      character.hp = character.max_hp;
      cleanAction = 'The party takes a long rest.';
      preRolledResults = ['MECHANICAL RESULT: Long rest complete. All HP restored.'];
    }

    const tagMatch = action.match(/\[SKILL CHECK REQUIRED:\s*(\w+)\s+DC\s*(\d+)\]/i);

    if (tagMatch) {
      const skill = tagMatch[1].toLowerCase();
      const dc = parseInt(tagMatch[2]);
      cleanAction = action.replace(tagMatch[0], '').trim();

      const { results, structuredResults: sr } = processDiceRequests(
        [{ type: 'skill_check', roller: character.name, ability: skill, target: '', dc, formula: '' }],
        character, []
      );
      preRolledResults = results;
      preRolledStructured = sr;
    } else {
      // Detect freeform skill check intent from natural language
      const detected = detectSkillCheckFromText(action);
      if (detected) {
        const { results, structuredResults: sr } = processDiceRequests(
          [{ type: 'skill_check', roller: character.name, ability: detected.skill, target: '', dc: detected.dc, formula: '' }],
          character, []
        );
        preRolledResults = results;
        preRolledStructured = sr;
      }
    }

    // If we pre-rolled a skill check, inject the result into the user message
    if (preRolledResults.length > 0) {
      messages.push({
        role: 'user',
        content: `${cleanAction}\n\n[GAME ENGINE RESULTS]\n${preRolledResults.join('\n')}\n\nNarrate this outcome. Do NOT recalculate. Include new choices for the player.`,
      });
    } else {
      messages.push({ role: 'user', content: action });
    }

    // Select model
    const model = selectModel(campaign.current_mode, campaign.current_mood);

    // Call Claude
    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY'),
    });

    const claudeResponse = await anthropic.messages.create({
      model,
      max_tokens: 2048,
      system: systemPrompt,
      messages,
    });

    const rawText = claudeResponse.content
      .filter((block: any) => block.type === 'text')
      .map((block: any) => block.text)
      .join('');

    let aiResponse = parseAIJson(rawText);

    // Debug: log whether Claude returned dice_requests
    const rawDiceCheck = aiResponse.dice_requests || aiResponse.diceRequests || [];
    console.log('game-turn debug', {
      hasDiceRequests: rawDiceCheck.length > 0,
      diceRequestCount: rawDiceCheck.length,
      mode: aiResponse.mode,
      hasChoices: Array.isArray(aiResponse.choices) && aiResponse.choices.length > 0,
    });

    // If dice_requests present, resolve and call Claude again for narration
    const diceRequests = aiResponse.dice_requests || aiResponse.diceRequests || [];
    let diceResults: string[] = [...preRolledResults];
    let structuredResults: any[] = [...preRolledStructured];

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
        max_tokens: 2048,
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
        const { error: compUpdateErr } = await adminClient
          .from('companion_states')
          .update({ approval_score: comp?.approvalScore ?? 50 })
          .eq('campaign_id', campaignId)
          .eq('companion_name', change.companion);
        if (compUpdateErr) {
          console.error('companion_states update failed', { campaignId, companion: change.companion, error: compUpdateErr.message });
        }
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
      last_session_at: new Date().toISOString(),
    };

    if (normalized.location) campaignUpdates.current_location = normalized.location;
    if (normalized.mood) campaignUpdates.current_mood = normalized.mood;
    if (normalized.mode) campaignUpdates.current_mode = normalized.mode;
    if (campaign.combat_state?.enemies) {
      campaignUpdates.combat_state = campaign.combat_state;
    }

    // Auto-end tutorial after player responds to turn 6 (visible turn 7)
    if (campaign.is_tutorial && (normalized.tutorialComplete || campaign.turn_count + 1 >= 7)) {
      campaignUpdates.is_tutorial = false;
      normalized.tutorialComplete = true;
    }

    const { error: campUpdateErr } = await adminClient.from('campaigns').update(campaignUpdates).eq('id', campaignId);
    if (campUpdateErr) {
      console.error('campaign update failed', { campaignId, error: campUpdateErr.message });
      return errorResponse('Failed to save game state.', 500, headers);
    }

    // Apply HP changes to character if needed + death detection
    let deathMeta: any = null;
    if (normalized.stateChanges) {
      for (const change of normalized.stateChanges) {
        if (change.type === 'hp' && change.target === character.name) {
          const newHp = Math.max(0, Math.min(character.max_hp, character.hp + Number(change.value)));
          const { error: hpUpdateErr } = await adminClient.from('characters').update({ hp: newHp }).eq('id', character.id);
          if (hpUpdateErr) {
            console.error('character HP update failed', { characterId: character.id, error: hpUpdateErr.message });
          }

          // Death detection
          if (newHp <= 0) {
            const deathRecord = {
              turn: campaign.turn_count + 1,
              cause: action.substring(0, 200),
              location: campaign.current_location,
              companionsPresent: (campaign.companions || []).map((c: any) => c.name),
            };
            const newDeathCount = (campaign.death_count || 0) + 1;
            const deathHistory = [...(campaign.death_history || []), deathRecord];

            const DEATH_UNLOCK_THRESHOLDS = [
              { death: 1, unlock: 'threshold_access' },
              { death: 2, unlock: 'keeper_lore_1' },
              { death: 3, unlock: 'spectral_gift' },
              { death: 5, unlock: 'death_defiance' },
              { death: 7, unlock: 'keeper_quest' },
              { death: 10, unlock: 'threshold_companion' },
            ];
            const existingUnlocks = campaign.threshold_unlocks || [];
            const newUnlocks = DEATH_UNLOCK_THRESHOLDS
              .filter(t => newDeathCount >= t.death && !existingUnlocks.includes(t.unlock))
              .map(t => t.unlock);
            const allUnlocks = [...existingUnlocks, ...newUnlocks];

            // Update campaign with death data
            await adminClient.from('campaigns').update({
              death_count: newDeathCount,
              death_history: deathHistory,
              threshold_unlocks: allUnlocks,
              current_mode: 'threshold',
            }).eq('id', campaignId);

            normalized.mode = 'threshold';
            deathMeta = { deathCount: newDeathCount, newUnlocks, deathRecord };
          }
        }
      }
    }

    // Companion encounter handling (Discover mode)
    if (normalized.companionEncounter && campaign.recruitment_mode === 'discover') {
      const pool = campaign.companion_pool || [];
      const found = pool.find((c: any) =>
        c.name.toLowerCase() === normalized.companionEncounter.companionName.toLowerCase()
      );
      if (found && !found.introduced) {
        found.introduced = true;
        await adminClient.from('campaigns').update({ companion_pool: pool }).eq('id', campaignId);
      }
    }

    // Spell changes: update character's known spells
    if (normalized.spellChanges) {
      const currentSpells: any[] = character.known_spells || [];
      let updatedSpells = [...currentSpells];

      if (normalized.spellChanges.learned?.length > 0) {
        for (const spell of normalized.spellChanges.learned) {
          if (!updatedSpells.some((s: any) => s.name === spell.name)) {
            updatedSpells.push(spell);
          }
        }
      }

      if (normalized.spellChanges.removed?.length > 0) {
        updatedSpells = updatedSpells.filter(
          (s: any) => !normalized.spellChanges.removed.includes(s.name)
        );
      }

      await adminClient.from('characters').update({ known_spells: updatedSpells }).eq('id', character.id);
    }

    // Journal entries: write to Supabase
    if (normalized.journalEntries && normalized.journalEntries.length > 0) {
      for (const entry of normalized.journalEntries) {
        const entryType = entry.entryType || entry.entry_type || 'decision_made';
        await adminClient.from('journal_entries').insert({
          campaign_id: campaignId,
          turn_number: campaign.turn_count + 1,
          entry_type: entryType,
          title: entry.title || '',
          description: entry.description || '',
          tags: [entryType],
          related_npcs: entry.relatedNpcs || entry.related_npcs || [],
          related_locations: entry.relatedLocations || entry.related_locations || [],
        });
      }
    }

    // Return response
    return new Response(JSON.stringify({
      aiResponse: normalized,
      diceResults,
      diceRollResults: structuredResults || [],
      companions: updatedCompanions,
      turnCount: campaign.turn_count + 1,
      ...(deathMeta ? { deathMeta } : {}),
    }), {
      headers: { ...headers, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('game-turn error:', error);
    const msg = error instanceof Error ? error.message : String(error);
    return errorResponse(`Server error: ${msg}`, 500, headers);
  }
});
