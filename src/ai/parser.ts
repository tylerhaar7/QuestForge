// AI Response Parser — Parses Claude's JSON with fallbacks
// Never crashes. Always returns a valid AIResponse structure.

import type { AIResponse, GameMode } from '@/types/game';

/**
 * Default empty response — used as fallback
 */
const EMPTY_RESPONSE: AIResponse = {
  mode: 'exploration',
  narration: '',
};

/**
 * Attempt to extract JSON from a string that may contain markdown code blocks
 */
function extractJSON(raw: string): string {
  // Try to find JSON in markdown code block
  const codeBlockMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }

  // Try to find raw JSON object
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return jsonMatch[0];
  }

  return raw;
}

/**
 * Validate and normalize the mode field
 */
function normalizeMode(mode: unknown): GameMode {
  const validModes: GameMode[] = ['exploration', 'combat', 'social', 'rest', 'camp', 'threshold'];
  if (typeof mode === 'string' && validModes.includes(mode as GameMode)) {
    return mode as GameMode;
  }
  return 'exploration';
}

/**
 * Map snake_case keys from Claude's JSON to camelCase for our types
 */
function mapResponseKeys(raw: Record<string, unknown>): Partial<AIResponse> {
  const mapped: Partial<AIResponse> = {};

  // Direct mappings
  if (raw.mode) mapped.mode = normalizeMode(raw.mode);
  if (raw.narration) mapped.narration = String(raw.narration);
  if (raw.narrative) mapped.narration = String(raw.narrative); // alternate key
  if (raw.location) mapped.location = String(raw.location);
  if (raw.mood) mapped.mood = raw.mood as AIResponse['mood'];
  if (raw.ambient_hint || raw.ambientHint) {
    mapped.ambientHint = String(raw.ambient_hint || raw.ambientHint);
  }

  // Arrays — snake_case to camelCase
  if (Array.isArray(raw.companion_actions || raw.companionActions)) {
    mapped.companionActions = (raw.companion_actions || raw.companionActions) as AIResponse['companionActions'];
  }

  if (Array.isArray(raw.choices)) {
    mapped.choices = (raw.choices as any[]).map(c => ({
      text: String(c.text || ''),
      type: String(c.type || 'action'),
      icon: String(c.icon || ''),
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
    mapped.diceRequests = ((raw.dice_requests || raw.diceRequests) as any[]).map(d => ({
      type: d.type,
      roller: String(d.roller || ''),
      ability: d.ability ? String(d.ability) : undefined,
      target: d.target ? String(d.target) : undefined,
      dc: d.dc ? Number(d.dc) : undefined,
      formula: d.formula ? String(d.formula) : undefined,
    }));
  }

  if (Array.isArray(raw.state_changes || raw.stateChanges)) {
    mapped.stateChanges = (raw.state_changes || raw.stateChanges) as AIResponse['stateChanges'];
  }

  if (Array.isArray(raw.approval_changes || raw.approvalChanges)) {
    mapped.approvalChanges = ((raw.approval_changes || raw.approvalChanges) as any[]).map(a => ({
      companion: String(a.companion || ''),
      delta: Number(a.delta) || 0,
      reason: String(a.reason || ''),
    }));
  }

  if (Array.isArray(raw.enemy_intentions || raw.enemyIntentions)) {
    mapped.enemyIntentions = ((raw.enemy_intentions || raw.enemyIntentions) as any[]).map(e => ({
      target: String(e.target || ''),
      action: String(e.action || ''),
      predictedDamage: String(e.predicted_damage || e.predictedDamage || ''),
      special: e.special ? String(e.special) : undefined,
      description: String(e.description || ''),
    }));
  }

  if (Array.isArray(raw.thread_updates || raw.threadUpdates)) {
    mapped.threadUpdates = ((raw.thread_updates || raw.threadUpdates) as any[]).map(t => ({
      threadId: String(t.thread_id || t.threadId || ''),
      action: t.action || 'advance',
      detail: String(t.detail || ''),
    }));
  }

  return mapped;
}

/**
 * Parse Claude's response string into a typed AIResponse
 * Never throws — always returns a valid response
 */
export function parseAIResponse(raw: string): AIResponse {
  if (!raw || raw.trim().length === 0) {
    console.warn('[AI Parser] Empty response received');
    return { ...EMPTY_RESPONSE, narration: 'The world falls silent for a moment...' };
  }

  try {
    const jsonStr = extractJSON(raw);
    const parsed = JSON.parse(jsonStr);

    if (typeof parsed !== 'object' || parsed === null) {
      throw new Error('Parsed result is not an object');
    }

    const mapped = mapResponseKeys(parsed);

    // Ensure narration doesn't contain JSON
    let narration = mapped.narration || 'The world shifts around you...';
    const trimmedNarration = narration.trim();
    if (trimmedNarration.startsWith('{') || trimmedNarration.startsWith('[')) {
      narration = 'The world shifts around you...';
    }

    return {
      ...EMPTY_RESPONSE,
      ...mapped,
      narration,
    };
  } catch (error) {
    console.warn('[AI Parser] JSON parse failed, extracting narrative from raw text:', error);

    // Fallback: strip JSON artifacts instead of dumping raw text
    const cleaned = raw
      .replace(/\{[\s\S]*\}/g, '')
      .replace(/\[[\s\S]*\]/g, '')
      .replace(/```[\s\S]*?```/g, '')
      .trim();

    return {
      ...EMPTY_RESPONSE,
      narration: cleaned.length > 20 ? cleaned : 'The world shifts around you...',
    };
  }
}

/**
 * Validate that a parsed response is sensible
 * Returns warnings (not errors) for issues
 */
export function validateResponse(response: AIResponse): string[] {
  const warnings: string[] = [];

  if (!response.narration || response.narration.length < 10) {
    warnings.push('Narration is very short or empty');
  }

  if (response.narration && response.narration.length > 5000) {
    warnings.push('Narration exceeds 5000 characters');
  }

  // Choices and dice_requests shouldn't both be present
  if (response.choices?.length && response.diceRequests?.length) {
    warnings.push('Response has both choices and dice_requests — should be one or the other');
  }

  // Approval changes should have valid deltas
  if (response.approvalChanges) {
    for (const change of response.approvalChanges) {
      if (Math.abs(change.delta) > 20) {
        warnings.push(`Large approval change for ${change.companion}: ${change.delta}`);
      }
    }
  }

  return warnings;
}
