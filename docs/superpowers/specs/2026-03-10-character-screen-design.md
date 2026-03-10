# Character Screen Design Spec

## Goal
Add a character sheet screen styled as a classic parchment scroll, accessible via a persistent HUD button on the game session screen. Displays stats, gear, inventory, known spells, and class features. Display-only (no interactive casting or slot consumption).

## Access
- **HUD Button**: Rectangular button pinned top-left of game session screen. Gold-bordered class icon + "Character" label. Dark semi-transparent background, softened corners.
- **Open**: Tapping HUD button opens character scroll as full-screen modal with unroll animation.
- **Close**: X button top-right or swipe-down. Plays reverse roll-up animation.

## Visual Design: Parchment Scroll
- **Roll edges**: Curled paper rolls at top and bottom (matching reference: warm tan paper curling over itself, 3D shadow effect). Built with LinearGradient or styled Views.
- **Parchment body**: ScrollView between fixed roll edges. Warm tan background (#e8d8b4). Edge darkening on left/right via gradient overlays. Subtle aged spots (low-opacity radial gradients).
- **Typography**: Dark ink (#2a1a08) on light parchment. Gold (#8b6914) section headers. Cinzel for name/headers, Crimson Text for body, IM Fell English for feature descriptions.
- **Section dividers**: Thin lines in #b8a070.
- **Future**: Generated character portrait image as scroll background (once image gen is set up).

## Scroll Content Sections (top to bottom)
1. **Header** — Character name (Cinzel), "Level X · Race · Class" subtitle
2. **Ability Scores** — 6 diamond-rotated boxes: score inside, abbreviation below, modifier below that. Gold borders.
3. **Combat Stats** — AC, HP (current/max), Speed in bordered cards
4. **Saving Throws** — All 6 saves displayed. Proficient saves highlighted gold, non-proficient dimmed.
5. **Skills** — All 18 skills with computed modifiers. Proficient skills highlighted.
6. **Equipment** — Equipped gear with damage/AC properties. Dotted ledger-line separators.
7. **Inventory** — Consumables, quest items, treasure with quantities. Dotted ledger lines.
8. **Known Spells** — Grouped by spell level (Cantrips, 1st, 2nd...). Slot tracker (current/max) at section top. Each spell as a chip/tag showing name. Tapping a spell expands inline to show: range, casting time, duration, components, description. Shows "No spells known" for non-caster classes.
9. **Class Features** — Feature name (bold) + short description.

## Data Model Changes

### New type: `Spell`
```typescript
interface Spell {
  name: string;
  level: number;        // 0 = cantrip, 1-9
  school: string;       // "evocation", "abjuration", etc.
  castingTime: string;  // "1 action", "1 bonus action"
  range: string;        // "120 feet", "Touch", "Self"
  duration: string;     // "Instantaneous", "1 hour"
  description: string;  // What it does
  components: string;   // "V, S, M (a bit of fleece)"
}
```

### Character type additions
- Add `knownSpells: Spell[]` to Character interface (client + server types)
- Initialize as `[]` during character creation

### AI response changes
- `campaign-init`: System prompt instructs Claude to assign starting spells for caster classes. Response includes `knownSpells` array.
- `game-turn`: New optional `spellChanges` field in AIResponse: `{ learned: Spell[], removed: string[] }`. Edge function applies changes to character row.
- `ai-parser.ts`: Normalize `spell_changes`/`spellChanges` field.

### Spell source
Claude assigns all spells. No static spell data file needed. Claude provides full spell details (name, school, range, description, etc.) when granting spells.

## Animation
- **Unroll**: Reanimated shared value for scroll height (0 → full). Top/bottom rolls start together at center, animate apart. Parchment opacity fades in. ~400ms spring.
- **Roll up (close)**: Reverse of unroll.
- **Spell expand**: Layout animation when tapping a spell chip to show details.

## Haptics
- Light haptic on open/close
- Subtle tap on spell card expand

## HUD Button Design
- Rectangular, positioned absolute top-left on session screen
- Class icon (unicode/emoji placeholder, custom art later) in gold-bordered square frame
- "Character" text label to the right of icon
- Dark semi-transparent background (#0d0a08 at ~80% opacity)
- Softened/rounded corners, subtle inner glow on gold border
- Sits above narrative, doesn't block main content

## Out of Scope
- Interactive spell casting (cast button, slot consumption)
- Equipment management (equip/unequip)
- Inventory use (consume potions)
- Level up UI
- Character image generation (future feature, just note the background placeholder)
