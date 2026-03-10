# Fantasy UI Overhaul — Design Spec

## Goal

Replace the plain flat UI (thin gold borders on dark rectangles) with a rich, tangible fantasy RPG interface using real art assets from the Moon Tribe Medieval RPG UI Pack. Every screen should feel like a physical game board — parchment, wood, stone, metal, jewels.

## Asset Source

**Moon Tribe Fantasy RPG UI Pack** (purchased, stored at `/Users/fauni/Documents/Assets/`)
- 4K upscaled PNGs, need resizing to mobile-appropriate dimensions
- Categories: Action Buttons (20), Inventory Slots (20), Life/Mana/XP Status Bars (20 each), Menu Buttons (20), Minimap Borders (20), Portrait Frames (20), System Buttons (20)

## Selected Assets & Roles

### Panels / Content Frames
| Asset | File | Role |
|-------|------|------|
| Parchment + rounded wood frame | Menu Buttons (3) | Selection cards (race, class, skill, origin, companion) |
| Parchment pinned to board | Menu Buttons (15) | Narration area, character sheet body, large content panels |
| Parchment on wood board (6 bolts) | Menu Buttons (8) | Modals, popups, dialog boxes |
| Wood-framed parchment (clean) | Menu Buttons (10) | Continue/primary buttons, section headers |
| Loose parchment (no frame) | Menu Buttons (5) | Choice buttons, secondary action strips |

### Portrait Frames
| Asset | File | Role |
|-------|------|------|
| Gold ring with ruby gems (ornate) | Portrait Frames (15) | Party member portraits, companion portraits at camp |
| Gold ring with rubies (simpler) | Portrait Frames (10) | Player character portrait, character sheet header |

### Status Bars
| Asset | File | Role |
|-------|------|------|
| Red liquid in iron scroll frame | Life Status Bars (5) | HP bars on party cards, character sheet |
| Blue swirl in iron frame | Mana Status Bars (1) | Spell slot indicator, mana display |
| Green in gold ornate frame | XP Status Bars (5) | XP progress bar |

### Inventory / Equipment Slots
| Asset | File | Role |
|-------|------|------|
| Dark wood with iron corner bolts | Inventory Slots (5) | Equipment slots on character sheet |
| Wider dark wood frame | Inventory Slots (10) | Inventory grid items |

### Action Buttons
| Asset | File | Role |
|-------|------|------|
| Stone medallion with glowing rune | Action Buttons (1) | Ability/action buttons in combat |
| Stone circle with ember rune | Action Buttons (15) | Character HUD button replacement |

### System Buttons
| Asset | File | Role |
|-------|------|------|
| Gold frame + red X (ornate corners) | System Buttons (5) | Close button (character sheet, modals) |
| Gold frame + red X (diamond studs) | System Buttons (10) | Secondary close/cancel button |

### Map Frame
| Asset | File | Role |
|-------|------|------|
| Stone ring with compass + moss | Minimap Borders (1) | Adventure map screen border |

## Component Architecture

### Reusable Components (new, in `src/components/ui/`)

1. **`FantasyPanel`** — Wraps content in a parchment/wood-frame background image. Props: `variant` ('card' | 'pinned' | 'modal' | 'button' | 'strip'), `children`. Uses `<ImageBackground>` with the appropriate asset, content rendered on top with proper inset padding.

2. **`FantasyButton`** — Pressable with wood-framed parchment background. Props: `variant` ('primary' | 'secondary' | 'danger'), `label`, `onPress`, `disabled`. Primary = wood-framed panel (Menu 10), secondary = loose parchment (Menu 5). Reanimated scale animation on press.

3. **`PortraitFrame`** — Circular portrait frame with gold jeweled ring overlay. Props: `size` ('sm' | 'md' | 'lg'), `children` (content inside the ring — initials, icon, or future generated image). Uses the portrait frame PNG as an overlay around a circular content area.

4. **`StatusBar`** — Ornate status bar with asset background. Props: `type` ('hp' | 'mana' | 'xp'), `current`, `max`, `label`. The bar asset is the background, with a colored fill rendered at the correct percentage width underneath. Label text centered on top.

5. **`InventorySlot`** — Wood/iron frame for equipment and inventory items. Props: `icon`, `label`, `empty`. Shows the slot frame with content centered inside.

6. **`SystemButton`** — Ornate close/settings button. Props: `variant` ('close' | 'settings'), `onPress`. Uses the gold-framed system button assets.

7. **`ActionMedallion`** — Stone rune button for combat abilities. Props: `icon`, `label`, `onPress`, `disabled`. Circular stone medallion background with content centered.

### Asset Pipeline

1. Copy selected assets from `/Users/fauni/Documents/Assets/` to `assets/ui/`
2. Resize to 3 sizes for React Native density buckets:
   - `@1x`: ~25% of original (for standard screens)
   - `@2x`: ~50% of original
   - `@3x`: ~75% of original
   - Or single high-res version and let RN scale (simpler, good enough for our case)
3. Recommended single-size approach: resize to ~512px max dimension for panels, ~256px for portraits/buttons, ~512 wide for bars. React Native handles downscaling efficiently.

### Screen-by-Screen Application

**All Screens:**
- Keep existing dark background (#0d0a08) with mood-based radial gradients
- Replace flat card borders with `FantasyPanel` components
- Replace flat Pressable buttons with `FantasyButton` components
- Code-based ornamental dividers remain (gold gradient lines with center diamond) — they complement the assets well

**Game Session (`app/game/session.tsx`):**
- Narration area → `FantasyPanel variant="pinned"` (parchment pinned to board)
- Party member cards → `PortraitFrame size="sm"` with name + `StatusBar type="hp"` underneath
- Choice buttons → `FantasyPanel variant="strip"` (loose parchment) with choice text
- Header stays code-based (thin, doesn't need heavy frame)

**Character Creation (`app/create/*.tsx`):**
- Race/Class/Origin cards → `FantasyPanel variant="card"` (parchment + wood frame)
- Skill cards on abilities screen → `FantasyPanel variant="card"`
- Continue button → `FantasyButton variant="primary"`
- Recommended buttons → `FantasyButton variant="secondary"`

**Character Sheet (`app/game/character.tsx`):**
- Replace entire parchment scroll with `FantasyPanel variant="pinned"` for the body
- Header → `PortraitFrame size="md"` + character name/info
- HP/Mana/XP → `StatusBar` components
- Equipment grid → `InventorySlot` components
- Close button → `SystemButton variant="close"`

**Camp (`app/game/camp.tsx`):**
- Companion portraits → `PortraitFrame size="md"`
- Action cards (Talk, Rest, Journal, etc.) → `FantasyPanel variant="card"`
- Break Camp button → `FantasyButton variant="primary"`

**Threshold (`app/game/threshold.tsx`):**
- Death screen stays dramatic with code-based effects
- Unlock cards → `FantasyPanel variant="card"`
- Revival choices → `FantasyButton`

**Settings, Login, Welcome:**
- Light touch — `FantasyButton` for actions, `FantasyPanel variant="card"` where appropriate

## Text Styling on Parchment

When content is displayed on parchment panels, text colors shift to dark brown ink tones:
- Primary text: `#3a2810` (dark ink)
- Secondary text: `#5a4020` (faded ink)
- Accent text: `#8b4513` (highlighted ink)
- Labels: `#5a3a18` (section labels)

When content is on the dark background (not on parchment), existing text colors remain:
- Primary: `#e8dcc8`, Secondary: `#b4a888`, Tertiary: `#8a7e68`

## Performance Considerations

- All assets are PNG with transparency on black backgrounds — need to trim/remove black borders during resize
- Use `resizeMode="stretch"` for panels that need to fill variable-sized containers
- Use `resizeMode="contain"` for fixed-aspect elements (portraits, buttons, slots)
- Pre-load critical assets (panels, portraits) at app startup to avoid flicker
- Consider using `expo-asset` for preloading

## What We're NOT Doing

- No animated textures or particle effects (keep it performant)
- No replacing the existing color system — assets complement the existing palette
- No changing navigation structure or screen layout logic
- No stone/metal full-screen textures — the dark background stays, assets provide the physical feel
- No custom 9-slice implementation — we use `ImageBackground` with proper padding insets
