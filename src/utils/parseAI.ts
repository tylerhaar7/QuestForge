export function parseAIContent(content: string): any | null {
  try {
    const direct = JSON.parse(content);
    if (typeof direct.narration === 'string' && direct.narration.includes('```')) {
      const inner = extractJson(direct.narration);
      if (inner?.narration) return inner;
    }
    if (direct.narration || direct.narrative) return direct;
    return direct;
  } catch {
    return extractJson(content);
  }
}

export function extractJson(text: string): any | null {
  try {
    const codeBlock = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlock) return JSON.parse(codeBlock[1].trim());
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch {}
  return null;
}