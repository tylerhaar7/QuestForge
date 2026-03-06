// Shared AI response parser for Edge Functions
// Extracts JSON from Claude's output and normalizes keys to camelCase

/**
 * Parse Claude's raw text output into a JSON object.
 * Tries multiple extraction strategies before falling back.
 * NEVER returns raw JSON text as narration.
 */
export function parseAIJson(rawText: string): any {
  if (!rawText || rawText.trim().length === 0) {
    return { mode: 'exploration', narration: 'The world falls silent for a moment...' };
  }

  // Strategy 1: Code block extraction
  const codeBlockMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1].trim());
    } catch {
      // Code block found but invalid JSON — continue to next strategy
    }
  }

  // Strategy 2: Outermost JSON object extraction
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch {
      // Matched braces but invalid JSON — continue
    }
  }

  // Strategy 3: Try to find a JSON array (Claude sometimes returns just choices)
  const arrayMatch = rawText.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    try {
      const arr = JSON.parse(arrayMatch[0]);
      if (Array.isArray(arr) && arr.length > 0 && arr[0].text) {
        // Looks like a choices array — wrap it
        const narrativeText = extractNarrativeText(rawText, arrayMatch.index ?? 0);
        return {
          mode: 'exploration',
          narration: narrativeText || 'The story continues...',
          choices: arr,
        };
      }
    } catch {
      // Continue to fallback
    }
  }

  // Strategy 4: Fallback — extract only the non-JSON prose as narration
  const cleanedNarration = stripJsonArtifacts(rawText);
  return {
    mode: 'exploration',
    narration: cleanedNarration || 'The world shifts around you...',
  };
}

/**
 * Extract narrative prose from text that precedes a JSON block
 */
function extractNarrativeText(rawText: string, jsonStartIndex: number): string {
  const before = rawText.substring(0, jsonStartIndex).trim();
  if (before.length > 20) {
    return before;
  }
  return '';
}

/**
 * Strip JSON-like content from text, returning only prose.
 * Used as a last-resort fallback to avoid showing raw JSON to users.
 */
function stripJsonArtifacts(text: string): string {
  // Remove JSON objects and arrays
  let cleaned = text.replace(/[{[\]]/g, '').replace(/[}\]]/g, '');
  // Remove JSON-like key-value patterns
  cleaned = cleaned.replace(/"[\w_]+":\s*/g, '');
  // Remove standalone quoted strings that look like JSON values
  cleaned = cleaned.replace(/^\s*"[^"]*",?\s*$/gm, '');
  // Remove lines that are mostly punctuation/brackets
  cleaned = cleaned.replace(/^\s*[{}\[\],]+\s*$/gm, '');
  // Collapse multiple newlines
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();

  // If after cleaning there's very little text, it was all JSON
  if (cleaned.length < 20) {
    return '';
  }
  return cleaned;
}

/**
 * Normalize Claude's JSON response to camelCase keys for the client.
 * Handles both snake_case and camelCase input.
 */
export function normalizeResponse(raw: any): any {
  const result: any = {
    mode: raw.mode || 'exploration',
    narration: raw.narration || raw.narrative || '',
  };

  // Detect if narration accidentally contains JSON
  if (result.narration && looksLikeJson(result.narration)) {
    try {
      const inner = JSON.parse(result.narration);
      if (inner.narration || inner.narrative) {
        result.narration = inner.narration || inner.narrative;
      } else {
        result.narration = 'The story continues...';
      }
    } catch {
      // Not valid JSON — strip artifacts
      const cleaned = stripJsonArtifacts(result.narration);
      result.narration = cleaned || 'The story continues...';
    }
  }

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

  if (raw.tutorial_complete || raw.tutorialComplete) result.tutorialComplete = true;

  return result;
}

/**
 * Check if a string looks like it contains JSON rather than prose
 */
function looksLikeJson(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) return true;
  // Check for high density of JSON-like patterns
  const jsonPatterns = (text.match(/"[\w_]+":\s*["{[\d]/g) || []).length;
  return jsonPatterns >= 3;
}
