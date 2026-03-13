// Session Recap — Generate a dramatic "Previously on..." summary using Claude Haiku
// Fetches the last 10-15 turns of a campaign and produces a short narrative recap.

import { createClient } from 'npm:@supabase/supabase-js@2';
import Anthropic from 'npm:@anthropic-ai/sdk';
import { getCorsHeaders } from '../_shared/cors.ts';
import { errorResponse, checkRateLimit } from '../_shared/guards.ts';

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

    // Parse request body
    const body = await req.json();
    if (!body || typeof body !== 'object' || typeof body.campaignId !== 'string') {
      return errorResponse('campaignId is required', 400, headers);
    }
    const { campaignId } = body;

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Rate limit: 5 requests per minute per user for session-recap
    const allowed = await checkRateLimit(adminClient, user.id, 'session-recap', 5);
    if (!allowed) return errorResponse('Rate limited. Please wait a moment.', 429, headers);

    // Fetch campaign — enforce ownership so users can only recap their own campaigns
    const { data: campaign, error: campError } = await adminClient
      .from('campaigns')
      .select('turn_history, name, current_location')
      .eq('id', campaignId)
      .eq('user_id', user.id)
      .single();

    if (campError || !campaign) {
      return errorResponse('Campaign not found', 404, headers);
    }

    // Extract last 10-15 turns from turn_history
    const turnHistory: { role: string; content: string }[] = campaign.turn_history || [];
    const recentTurns = turnHistory.slice(-15);

    // Build readable event list from the turn history pairs
    const eventTexts: string[] = [];
    for (let i = 0; i < recentTurns.length; i++) {
      const turn = recentTurns[i];
      if (turn.role === 'user') {
        eventTexts.push(`Player action: ${turn.content}`);
      } else if (turn.role === 'assistant') {
        // Assistant turns are JSON — try to extract the narration field
        try {
          const parsed = JSON.parse(turn.content);
          const narration = parsed.narration || parsed.description || '';
          if (narration) {
            eventTexts.push(`Narration: ${narration}`);
          }
        } catch {
          // If not JSON, include as-is (legacy plain text turns)
          if (turn.content && turn.content.length > 10) {
            eventTexts.push(`Narration: ${turn.content}`);
          }
        }
      }
    }

    // If there's nothing to recap yet, return a default message
    if (eventTexts.length === 0) {
      return new Response(JSON.stringify({ recap: 'Your adventure is just beginning...' }), {
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    // Call Claude Haiku for the recap
    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY'),
    });

    const claudeResponse = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: 'You are a narrator for a fantasy RPG. Summarize recent events as a dramatic "Previously on..." narration. Write in second person (you/your). Be vivid and concise — like the cold open of a fantasy TV series.',
      messages: [
        {
          role: 'user',
          content: `Summarize these events in 3-4 sentences. Focus on: the last major decision, current threat, and emotional state of the party. Second person, vivid but concise.\n\nRecent events:\n${eventTexts.join('\n')}`,
        },
      ],
    });

    const recap = claudeResponse.content
      .filter((block: any) => block.type === 'text')
      .map((block: any) => block.text)
      .join('')
      .trim();

    return new Response(JSON.stringify({ recap }), {
      headers: { ...headers, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('session-recap error:', error);
    const msg = error instanceof Error ? error.message : String(error);
    return errorResponse(`Server error: ${msg}`, 500, headers);
  }
});
