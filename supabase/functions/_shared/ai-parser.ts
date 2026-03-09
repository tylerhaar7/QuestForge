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
    const parsed = tryParseJson(codeBlockMatch[1].trim());
    if (parsed) return parsed;
  }

  // Strategy 2: Outermost JSON object extraction
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    const parsed = tryParseJson(jsonMatch[0]);
    if (parsed) return parsed;
  }

  // Strategy 3: Try to find a JSON array (Claude sometimes returns just choices)
  const arrayMatch = rawText.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    const arr = tryParseJson(arrayMatch[0]);
    if (Array.isArray(arr) && arr.length > 0 && arr[0].text) {
      // Looks like a choices array — wrap it
      const narrativeText = extractNarrativeText(rawText, arrayMatch.index ?? 0);
      return {
        mode: 'exploration',
        narration: narrativeText || 'The story continues...',
        choices: arr,
      };
    }
  }

  // Strategy 4: Regex extraction of individual fields from malformed JSON.
  // Claude's JSON often fails to parse due to unescaped quotes in dialogue,
  // but individual field values (especially narration) are usually intact.
  const regexExtracted = extractFieldsViaRegex(rawText);
  if (regexExtracted) return regexExtracted;

  // Strategy 5: Last resort — extract only the non-JSON prose as narration
  const cleanedNarration = stripJsonArtifacts(rawText);
  return {
    mode: 'exploration',
    narration: isNarrativeText(cleanedNarration) ? cleanedNarration : 'The world shifts around you...',
  };
}

/**
 * Attempt JSON.parse with two repair strategies for common Claude output issues:
 * 1. Remove trailing commas before closing braces/brackets
 * 2. Normalize smart quotes (curly quotes from rich-text sources) to straight quotes
 */
function tryParseJson(text: string): any | null {
  try {
    return JSON.parse(text);
  } catch {
    // Common repair: trailing commas before closing braces/brackets
    const noTrailingCommas = text.replace(/,\s*([}\]])/g, '$1');
    if (noTrailingCommas !== text) {
      try {
        return JSON.parse(noTrailingCommas);
      } catch {
        // Continue to second repair
      }
    }

    // Common repair: smart quotes copied from rich text sources
    const normalizedQuotes = noTrailingCommas
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'");
    if (normalizedQuotes !== noTrailingCommas) {
      try {
        return JSON.parse(normalizedQuotes);
      } catch {
        // Give up
      }
    }
  }
  return null;
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
 * Extract individual fields from malformed JSON using regex.
 * When Claude's JSON has unescaped quotes in dialogue (e.g. He said "hello"),
 * JSON.parse fails but the individual field values are usually intact.
 * We extract narration (and other key fields) directly via pattern matching.
 */
function extractFieldsViaRegex(rawText: string): any | null {
  // Try to extract narration — the most important field.
  // Match "narration": "..." or "narrative": "..." accounting for escaped quotes inside.
  const narrationMatch = rawText.match(/"narrat(?:ion|ive)"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  if (!narrationMatch) return null;

  let narration: string;
  try {
    // Parse the matched string value to handle escape sequences properly
    narration = JSON.parse('"' + narrationMatch[1] + '"');
  } catch {
    // If JSON.parse fails on the extracted value, manually unescape common sequences
    narration = narrationMatch[1]
      .replace(/\\n/g, '\n')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\')
      .replace(/\\\//g, '/');
  }

  if (!isNarrativeText(narration)) return null;

  const result: any = { narration };

  // Extract mode
  const modeMatch = rawText.match(/"mode"\s*:\s*"(exploration|combat|social|camp|threshold)"/);
  result.mode = modeMatch ? modeMatch[1] : 'exploration';

  // Extract location
  const locationMatch = rawText.match(/"location"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  if (locationMatch) result.location = locationMatch[1];

  // Extract mood
  const moodMatch = rawText.match(/"mood"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  if (moodMatch) result.mood = moodMatch[1];

  // Try to extract choices array — find each choice text
  const choiceTexts = [...rawText.matchAll(/"text"\s*:\s*"((?:[^"\\]|\\.)*)"/g)];
  if (choiceTexts.length > 0) {
    result.choices = choiceTexts.map((m) => ({
      text: m[1].replace(/\\"/g, '"').replace(/\\n/g, '\n'),
      type: 'action',
    }));
  }

  // Try to extract approval_changes
  const approvalMatches = [...rawText.matchAll(/"companion"\s*:\s*"((?:[^"\\]|\\.)*)"\s*,\s*"delta"\s*:\s*(-?\d+)/g)];
  if (approvalMatches.length > 0) {
    result.approval_changes = approvalMatches.map((m) => ({
      companion: m[1],
      delta: Number(m[2]),
      reason: '',
    }));
  }

  return result;
}

/**
 * Strip JSON-like content from text, returning only prose.
 * Used as a last-resort fallback to avoid showing raw JSON to users.
 */
function stripJsonArtifacts(text: string): string {
  // Remove braces/brackets while preserving prose
  let cleaned = text.replace(/[{}\[\]]/g, '');
  // Remove JSON-like key-value patterns
  cleaned = cleaned.replace(/"[\w_]+":\s*/g, '');
  // Remove standalone quoted strings that look like JSON values
  cleaned = cleaned.replace(/^\s*"[^"]*",?\s*$/gm, '');
  // Remove lines that are mostly punctuation/brackets
  cleaned = cleaned.replace(/^\s*[{}\[\],]+\s*$/gm, '');
  // Remove value-only lines (e.g. "14,", "false", "-1,") that leak from malformed JSON
  cleaned = cleaned.replace(/^\s*-?\d+(?:\.\d+)?,?\s*$/gm, '');
  cleaned = cleaned.replace(/^\s*(?:true|false|null),?\s*$/gim, '');
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
  let narration = raw.narration || raw.narrative || '';

  // Strip markdown code block wrappers from narration (Claude sometimes nests them)
  const cbMatch = narration.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (cbMatch) {
    const inner = cbMatch[1].trim();
    // Try parsing as JSON to extract real narration
    const parsed = tryParseJson(inner.match(/\{[\s\S]*\}/)?.[0] || inner);
    narration = parsed ? (parsed.narration || parsed.narrative || inner) : (inner || narration);
  }

  // Detect if narration still contains JSON
  if (narration && looksLikeJson(narration)) {
    const inner = tryParseJson(narration);
    if (inner && (inner.narration || inner.narrative)) {
      narration = inner.narration || inner.narrative;
    } else {
      const cleaned = stripJsonArtifacts(narration);
      narration = isNarrativeText(cleaned) ? cleaned : 'The story continues...';
    }
  } else if (!isNarrativeText(narration)) {
    narration = 'The story continues...';
  }

  // Light sanitization: strip residual JSON artifacts that survive even when
  // narration passes isNarrativeText (e.g. scattered quotes, commas, colons
  // from partially stripped JSON values mixed into prose).
  narration = stripNarrationResidues(narration);

  // Claude sometimes double-escapes characters in JSON string values.
  // When the response is JSON.stringify'd again for the HTTP response,
  // literal "\n" sequences survive as two characters instead of a newline.
  narration = narration
    .replace(/\\n/g, '\n')
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\')
    .replace(/\\\//g, '/');

  const result: any = {
    mode: raw.mode || 'exploration',
    narration,
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

  if (raw.tutorial_complete || raw.tutorialComplete) result.tutorialComplete = true;

  return result;
}

/**
 * Light cleanup pass for narration that is mostly prose but has scattered
 * JSON residue — quoted field values, trailing commas, key-colon patterns.
 * Unlike stripJsonArtifacts (which aggressively removes everything non-prose),
 * this preserves the narrative structure while removing obvious artifacts.
 */
function stripNarrationResidues(text: string): string {
  let cleaned = text;
  // Remove JSON key patterns like "mode": or "narration":
  cleaned = cleaned.replace(/"[\w_]+":\s*/g, '');
  // Remove isolated quoted short tokens (JSON values like "tavern", "combat")
  // but preserve longer quoted dialogue
  cleaned = cleaned.replace(/(?<!\w)"([^"]{1,20})"(?=[,\s}\]]|$)/gm, '$1');
  // Remove trailing/leading commas that aren't part of prose
  cleaned = cleaned.replace(/^\s*,\s*/gm, '');
  cleaned = cleaned.replace(/,\s*$/gm, '');
  // Remove isolated braces/brackets
  cleaned = cleaned.replace(/^\s*[{}\[\]]\s*$/gm, '');
  // Remove lines that are just numbers or booleans (leaked JSON values)
  cleaned = cleaned.replace(/^\s*-?\d+(?:\.\d+)?\s*$/gm, '');
  cleaned = cleaned.replace(/^\s*(?:true|false|null)\s*$/gim, '');
  // Collapse multiple newlines
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();
  return cleaned;
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

/**
 * Heuristic to detect whether text is actual prose vs JSON/code debris.
 * Requires: >= 20 chars, >= 45% alphabetic characters, >= 6 words.
 */
function isNarrativeText(text: string): boolean {
  if (!text) return false;
  const trimmed = text.trim();
  if (trimmed.length < 20) return false;

  const alphaChars = (trimmed.match(/[A-Za-z]/g) || []).length;
  const totalChars = trimmed.length;
  const alphaRatio = totalChars > 0 ? alphaChars / totalChars : 0;
  if (alphaRatio < 0.45) return false;

  const words = (trimmed.match(/[A-Za-z]{2,}/g) || []).length;
  return words >= 6;
}
