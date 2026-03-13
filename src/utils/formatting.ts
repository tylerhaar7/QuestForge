// Shared formatting utilities

/** Convert a snake_case string to Title Case (e.g. "animal_handling" → "Animal Handling") */
export function formatSnakeCase(s: string): string {
  return s
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}
