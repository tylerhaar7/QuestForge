# Fantasy UI Overhaul Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the plain flat UI (thin gold borders on dark rectangles) with a rich fantasy RPG interface using real art assets from the Moon Tribe Medieval RPG UI Pack.

**Architecture:** Seven reusable `ImageBackground`-based components (`FantasyPanel`, `FantasyButton`, `PortraitFrame`, `ResourceBar`, `InventorySlot`, `SystemButton`, `ActionMedallion`) wrap Moon Tribe PNG assets around existing content. Each component uses `resizeMode="stretch"` for variable-sized containers or `resizeMode="contain"` for fixed-aspect elements, with appropriate padding insets so child content sits within the asset's visible area. Screens are updated one at a time, swapping `View`/`Pressable` wrappers for the new fantasy components while preserving all existing logic.

**Tech Stack:** React Native `ImageBackground`, react-native-reanimated (press animations), expo-haptics, ImageMagick (asset resize pipeline)

**Spec:** `docs/superpowers/specs/2026-03-10-fantasy-ui-overhaul-design.md`

---

## Chunk 1: Asset Pipeline + Core Components

### Task 1: Asset Pipeline — Copy & Resize Moon Tribe PNGs

**Files:**
- Create: `assets/ui/panel-card.png`
- Create: `assets/ui/panel-pinned.png`
- Create: `assets/ui/panel-modal.png`
- Create: `assets/ui/panel-button.png`
- Create: `assets/ui/panel-strip.png`
- Create: `assets/ui/portrait-ornate.png`
- Create: `assets/ui/portrait-simple.png`
- Create: `assets/ui/bar-hp.png`
- Create: `assets/ui/bar-mana.png`
- Create: `assets/ui/bar-xp.png`
- Create: `assets/ui/slot-square.png`
- Create: `assets/ui/slot-wide.png`
- Create: `assets/ui/action-rune.png`
- Create: `assets/ui/action-ember.png`
- Create: `assets/ui/system-close-ornate.png`
- Create: `assets/ui/system-close-diamond.png`
- Create: `assets/ui/map-border.png`

**Context:** The Moon Tribe pack is at `/Users/fauni/Documents/Assets/upscayl_png_upscayl-standard-4x_4x/`. All assets are 4K upscaled PNGs (3072x3072 for square, 4096x1024 for bars). They need to be resized to mobile-appropriate dimensions. Assets have transparency on black backgrounds — the black needs to be trimmed during resize.

The asset-to-file mapping from the design spec:
| Source File | Target | Max Dimension |
|------------|--------|---------------|
| `Menu Buttons (3).png` | `panel-card.png` | 512px |
| `Menu Buttons (15).png` | `panel-pinned.png` | 512px |
| `Menu Buttons (8).png` | `panel-modal.png` | 512px |
| `Menu Buttons (10).png` | `panel-button.png` | 512px |
| `Menu Buttons (5).png` | `panel-strip.png` | 512px |
| `Portrait Frames (15).png` | `portrait-ornate.png` | 256px |
| `Portrait Frames (10).png` | `portrait-simple.png` | 256px |
| `Life Status Bars (5).png` | `bar-hp.png` | 512w |
| `Mana Status Bars (1).png` | `bar-mana.png` | 512w |
| `XP Status Bars (5).png` | `bar-xp.png` | 512w |
| `Inventory Slots (5).png` | `slot-square.png` | 128px |
| `Inventory Slots (10).png` | `slot-wide.png` | 192px |
| `Action Buttons (1).png` | `action-rune.png` | 128px |
| `Action Buttons (15).png` | `action-ember.png` | 128px |
| `System Buttons (5).png` | `system-close-ornate.png` | 64px |
| `System Buttons (10).png` | `system-close-diamond.png` | 64px |
| `Minimap Borders (1).png` | `map-border.png` | 512px |

- [ ] **Step 1: Create the assets/ui/ directory**

```bash
mkdir -p assets/ui
```

- [ ] **Step 2: Resize and copy all panel assets (512px max dimension)**

Use ImageMagick to trim black borders and resize. Run these commands:

```bash
SRC="/Users/fauni/Documents/Assets/upscayl_png_upscayl-standard-4x_4x"
DEST="assets/ui"

# Panels (512px max)
magick "$SRC/Menu Buttons (3).png" -trim +repage -resize 512x512 "$DEST/panel-card.png"
magick "$SRC/Menu Buttons (15).png" -trim +repage -resize 512x512 "$DEST/panel-pinned.png"
magick "$SRC/Menu Buttons (8).png" -trim +repage -resize 512x512 "$DEST/panel-modal.png"
magick "$SRC/Menu Buttons (10).png" -trim +repage -resize 512x512 "$DEST/panel-button.png"
magick "$SRC/Menu Buttons (5).png" -trim +repage -resize 512x512 "$DEST/panel-strip.png"
```

- [ ] **Step 3: Resize and copy portrait frames (256px)**

```bash
magick "$SRC/Portrait Frames (15).png" -trim +repage -resize 256x256 "$DEST/portrait-ornate.png"
magick "$SRC/Portrait Frames (10).png" -trim +repage -resize 256x256 "$DEST/portrait-simple.png"
```

- [ ] **Step 4: Resize and copy status bars (512px wide)**

```bash
magick "$SRC/Life Status Bars (5).png" -trim +repage -resize 512x "$DEST/bar-hp.png"
magick "$SRC/Mana Status Bars (1).png" -trim +repage -resize 512x "$DEST/bar-mana.png"
magick "$SRC/XP Status Bars (5).png" -trim +repage -resize 512x "$DEST/bar-xp.png"
```

- [ ] **Step 5: Resize and copy inventory slots, action buttons, system buttons, map border**

```bash
# Inventory slots
magick "$SRC/Inventory Slots (5).png" -trim +repage -resize 128x128 "$DEST/slot-square.png"
magick "$SRC/Inventory Slots (10).png" -trim +repage -resize 192x192 "$DEST/slot-wide.png"

# Action buttons
magick "$SRC/Action Buttons (1).png" -trim +repage -resize 128x128 "$DEST/action-rune.png"
magick "$SRC/Action Buttons (15).png" -trim +repage -resize 128x128 "$DEST/action-ember.png"

# System buttons
magick "$SRC/System Buttons (5).png" -trim +repage -resize 64x64 "$DEST/system-close-ornate.png"
magick "$SRC/System Buttons (10).png" -trim +repage -resize 64x64 "$DEST/system-close-diamond.png"

# Map border
magick "$SRC/Minimap Borders (1).png" -trim +repage -resize 512x512 "$DEST/map-border.png"
```

- [ ] **Step 6: Verify all 17 assets exist and check sizes**

```bash
ls -la assets/ui/
```

Expected: 17 PNG files, each well under 1MB.

- [ ] **Step 7: Commit**

```bash
git add assets/ui/
git commit -m "chore: add resized Moon Tribe RPG UI assets"
```

---

### Task 2: Asset Index — Central require() Map

**Files:**
- Create: `src/assets/ui.ts`

**Context:** React Native requires static `require()` calls for images. Create a central asset map so all components import from one place. This avoids scattered require() calls and makes it easy to swap assets later.

- [ ] **Step 1: Create the asset index file**

```typescript
// src/assets/ui.ts
// Central index of all fantasy UI art assets (Moon Tribe RPG Pack).
// Components import from here instead of using require() directly.

import { ImageSourcePropType } from 'react-native';

export const UI_ASSETS = {
  // Panels / Content Frames
  panel: {
    card: require('../../assets/ui/panel-card.png') as ImageSourcePropType,
    pinned: require('../../assets/ui/panel-pinned.png') as ImageSourcePropType,
    modal: require('../../assets/ui/panel-modal.png') as ImageSourcePropType,
    button: require('../../assets/ui/panel-button.png') as ImageSourcePropType,
    strip: require('../../assets/ui/panel-strip.png') as ImageSourcePropType,
  },

  // Portrait Frames
  portrait: {
    ornate: require('../../assets/ui/portrait-ornate.png') as ImageSourcePropType,
    simple: require('../../assets/ui/portrait-simple.png') as ImageSourcePropType,
  },

  // Status Bars
  bar: {
    hp: require('../../assets/ui/bar-hp.png') as ImageSourcePropType,
    mana: require('../../assets/ui/bar-mana.png') as ImageSourcePropType,
    xp: require('../../assets/ui/bar-xp.png') as ImageSourcePropType,
  },

  // Inventory / Equipment Slots
  slot: {
    square: require('../../assets/ui/slot-square.png') as ImageSourcePropType,
    wide: require('../../assets/ui/slot-wide.png') as ImageSourcePropType,
  },

  // Action Buttons
  action: {
    rune: require('../../assets/ui/action-rune.png') as ImageSourcePropType,
    ember: require('../../assets/ui/action-ember.png') as ImageSourcePropType,
  },

  // System Buttons
  system: {
    closeOrnate: require('../../assets/ui/system-close-ornate.png') as ImageSourcePropType,
    closeDiamond: require('../../assets/ui/system-close-diamond.png') as ImageSourcePropType,
  },

  // Map
  map: {
    border: require('../../assets/ui/map-border.png') as ImageSourcePropType,
  },
} as const;
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit src/assets/ui.ts 2>&1 | head -20
```

If tsc errors on the require() calls (common in strict mode), that's fine — Metro bundler handles require() at build time. The important thing is the file structure is correct.

- [ ] **Step 3: Commit**

```bash
git add src/assets/ui.ts
git commit -m "feat: add central UI asset index for fantasy components"
```

---

### Task 3: FantasyPanel Component

**Files:**
- Create: `src/components/ui/FantasyPanel.tsx`

**Context:** This is the most-used component. It wraps any content in a parchment/wood-frame background image using `ImageBackground`. Five variants map to different panel assets. Content is rendered on top with inset padding so it doesn't overlap the frame edges.

The design spec says text on parchment should use dark ink tones (`#3a2810` primary, `#5a4020` secondary). The component doesn't enforce text colors (that's the consumer's job), but it exposes the variant so screens can conditionally apply parchment text colors.

- [ ] **Step 1: Create FantasyPanel component**

```typescript
// src/components/ui/FantasyPanel.tsx
import React from 'react';
import { ImageBackground, StyleSheet, View, ViewStyle } from 'react-native';
import { UI_ASSETS } from '@/assets/ui';

export type PanelVariant = 'card' | 'pinned' | 'modal' | 'button' | 'strip';

interface FantasyPanelProps {
  variant: PanelVariant;
  children: React.ReactNode;
  style?: ViewStyle;
}

const VARIANT_ASSETS: Record<PanelVariant, any> = {
  card: UI_ASSETS.panel.card,
  pinned: UI_ASSETS.panel.pinned,
  modal: UI_ASSETS.panel.modal,
  button: UI_ASSETS.panel.button,
  strip: UI_ASSETS.panel.strip,
};

// Padding insets per variant — how far content should be from the image edges
// to sit inside the visible parchment area. Adjust after visual testing.
const VARIANT_PADDING: Record<PanelVariant, ViewStyle> = {
  card: { paddingHorizontal: 24, paddingVertical: 20 },
  pinned: { paddingHorizontal: 28, paddingVertical: 24 },
  modal: { paddingHorizontal: 28, paddingVertical: 28 },
  button: { paddingHorizontal: 20, paddingVertical: 12 },
  strip: { paddingHorizontal: 16, paddingVertical: 10 },
};

export function FantasyPanel({ variant, children, style }: FantasyPanelProps) {
  return (
    <ImageBackground
      source={VARIANT_ASSETS[variant]}
      resizeMode="stretch"
      style={[styles.container, style]}
      imageStyle={styles.image}
    >
      <View style={[styles.content, VARIANT_PADDING[variant]]}>
        {children}
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  image: {
    borderRadius: 4,
  },
  content: {
    // Base styles — variant padding applied dynamically
  },
});
```

- [ ] **Step 2: Verify it compiles**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/FantasyPanel.tsx
git commit -m "feat: add FantasyPanel component with 5 panel variants"
```

---

### Task 4: FantasyButton Component

**Files:**
- Create: `src/components/ui/FantasyButton.tsx`

**Context:** Replaces all flat `Pressable` buttons. Uses the `panel-button` asset (wood-framed parchment) for primary, `panel-strip` (loose parchment) for secondary. Includes Reanimated scale animation on press and haptic feedback. The text should use dark ink colors since it's on parchment.

- [ ] **Step 1: Create FantasyButton component**

```typescript
// src/components/ui/FantasyButton.tsx
import React, { useCallback } from 'react';
import {
  ImageBackground,
  Pressable,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { UI_ASSETS } from '@/assets/ui';
import { fonts } from '@/theme/typography';

export type ButtonVariant = 'primary' | 'secondary' | 'danger';

interface FantasyButtonProps {
  variant?: ButtonVariant;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
}

const VARIANT_SOURCES: Record<ButtonVariant, any> = {
  primary: UI_ASSETS.panel.button,
  secondary: UI_ASSETS.panel.strip,
  danger: UI_ASSETS.panel.strip,
};

export function FantasyButton({
  variant = 'primary',
  label,
  onPress,
  disabled = false,
  style,
}: FantasyButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.96, { damping: 20, stiffness: 300 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 20, stiffness: 300 });
  }, [scale]);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  }, [onPress]);

  return (
    <Animated.View style={[animatedStyle, style]}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
      >
        <ImageBackground
          source={VARIANT_SOURCES[variant]}
          resizeMode="stretch"
          style={[styles.background, disabled && styles.disabled]}
          imageStyle={styles.image}
        >
          <Text
            style={[
              styles.label,
              variant === 'danger' && styles.labelDanger,
            ]}
          >
            {label}
          </Text>
        </ImageBackground>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  background: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    borderRadius: 4,
  },
  disabled: {
    opacity: 0.4,
  },
  label: {
    fontFamily: fonts.heading,
    fontSize: 14,
    letterSpacing: 1.5,
    color: '#3a2810', // Dark ink on parchment
    textTransform: 'uppercase',
  },
  labelDanger: {
    color: '#8b1a1a',
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/FantasyButton.tsx
git commit -m "feat: add FantasyButton component with press animation"
```

---

### Task 5: PortraitFrame Component

**Files:**
- Create: `src/components/ui/PortraitFrame.tsx`

**Context:** Circular portrait frame with gold jeweled ring overlay. The portrait frame PNG is placed as an overlay around a circular content area. Children (initials, icon, or future AI-generated portrait) are rendered inside the ring. Two variants: ornate (for companions) and simple (for player character).

- [ ] **Step 1: Create PortraitFrame component**

```typescript
// src/components/ui/PortraitFrame.tsx
import React from 'react';
import { Image, View, StyleSheet, ViewStyle } from 'react-native';
import { UI_ASSETS } from '@/assets/ui';

type PortraitSize = 'sm' | 'md' | 'lg';
type PortraitVariant = 'ornate' | 'simple';

interface PortraitFrameProps {
  size?: PortraitSize;
  variant?: PortraitVariant;
  children: React.ReactNode;
  style?: ViewStyle;
}

const SIZE_MAP: Record<PortraitSize, number> = {
  sm: 48,
  md: 72,
  lg: 96,
};

// Content area is smaller than the frame to sit inside the ring
const CONTENT_RATIO = 0.62;

export function PortraitFrame({
  size = 'md',
  variant = 'ornate',
  children,
  style,
}: PortraitFrameProps) {
  const frameSize = SIZE_MAP[size];
  const contentSize = Math.round(frameSize * CONTENT_RATIO);

  const source =
    variant === 'ornate'
      ? UI_ASSETS.portrait.ornate
      : UI_ASSETS.portrait.simple;

  return (
    <View style={[styles.container, { width: frameSize, height: frameSize }, style]}>
      {/* Content area (circular, centered) */}
      <View
        style={[
          styles.content,
          {
            width: contentSize,
            height: contentSize,
            borderRadius: contentSize / 2,
          },
        ]}
      >
        {children}
      </View>

      {/* Frame overlay */}
      <Image
        source={source}
        style={[styles.frame, { width: frameSize, height: frameSize }]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1510',
  },
  frame: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/PortraitFrame.tsx
git commit -m "feat: add PortraitFrame component with ornate/simple variants"
```

---

### Task 6: ResourceBar Component

**Files:**
- Create: `src/components/ui/ResourceBar.tsx`

**Context:** Ornate status bar using HP/Mana/XP bar assets as the background frame. A colored fill is rendered at the correct percentage width underneath the frame image. Named `ResourceBar` (not `StatusBar`) to avoid shadowing React Native's built-in `StatusBar` component. The existing `HpBar` component in `src/components/game/HpBar.tsx` handles animated HP changes in the game session — this new `ResourceBar` is for static display contexts (character sheet, party cards). The game's `HpBar` can optionally be updated to use this as its base later.

- [ ] **Step 1: Create ResourceBar component**

```typescript
// src/components/ui/ResourceBar.tsx
import React from 'react';
import { Image, View, Text, StyleSheet, ViewStyle } from 'react-native';
import { UI_ASSETS } from '@/assets/ui';
import { fonts } from '@/theme/typography';

type BarType = 'hp' | 'mana' | 'xp';

interface StatusBarProps {
  type: BarType;
  current: number;
  max: number;
  label?: string;
  style?: ViewStyle;
}

const BAR_SOURCES: Record<BarType, any> = {
  hp: UI_ASSETS.bar.hp,
  mana: UI_ASSETS.bar.mana,
  xp: UI_ASSETS.bar.xp,
};

const FILL_COLORS: Record<BarType, string> = {
  hp: '#8b1a1a',
  mana: '#1a3a8b',
  xp: '#2a6e1e',
};

export function ResourceBar({ type, current, max, label, style }: StatusBarProps) {
  const ratio = max > 0 ? Math.min(current / max, 1) : 0;
  const percentage = ratio * 100;

  return (
    <View style={[styles.container, style]}>
      {/* Fill layer (behind the frame) */}
      <View style={styles.fillTrack}>
        <View
          style={[
            styles.fill,
            {
              width: `${percentage}%`,
              backgroundColor: FILL_COLORS[type],
            },
          ]}
        />
      </View>

      {/* Frame image overlay */}
      <Image
        source={BAR_SOURCES[type]}
        style={styles.frameImage}
        resizeMode="stretch"
      />

      {/* Label text centered on top */}
      {label && <Text style={styles.label}>{label}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 28,
    position: 'relative',
    justifyContent: 'center',
  },
  fillTrack: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    borderRadius: 4,
    // Inset slightly so fill sits inside the frame
    marginHorizontal: 6,
    marginVertical: 4,
  },
  fill: {
    height: '100%',
    borderRadius: 2,
  },
  frameImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  label: {
    position: 'absolute',
    alignSelf: 'center',
    fontFamily: fonts.heading,
    fontSize: 9,
    letterSpacing: 1,
    color: '#e8dcc8',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/ResourceBar.tsx
git commit -m "feat: add ResourceBar component with HP/Mana/XP bar assets"
```

---

### Task 7: InventorySlot, SystemButton, ActionMedallion Components

**Files:**
- Create: `src/components/ui/InventorySlot.tsx`
- Create: `src/components/ui/SystemButton.tsx`
- Create: `src/components/ui/ActionMedallion.tsx`
- Create: `src/components/ui/index.ts`

**Context:** The remaining three components from the spec. InventorySlot = wood/iron frame for equipment grid. SystemButton = ornate close/settings button. ActionMedallion = stone rune button for combat abilities. Also create a barrel export index.

- [ ] **Step 1: Create InventorySlot component**

```typescript
// src/components/ui/InventorySlot.tsx
import React from 'react';
import { ImageBackground, Text, StyleSheet, ViewStyle } from 'react-native';
import { UI_ASSETS } from '@/assets/ui';
import { fonts } from '@/theme/typography';

interface InventorySlotProps {
  icon?: string;
  label?: string;
  empty?: boolean;
  variant?: 'square' | 'wide';
  children?: React.ReactNode;
  style?: ViewStyle;
}

export function InventorySlot({
  icon,
  label,
  empty = false,
  variant = 'square',
  children,
  style,
}: InventorySlotProps) {
  const source =
    variant === 'square' ? UI_ASSETS.slot.square : UI_ASSETS.slot.wide;
  const size = variant === 'square' ? 64 : 80;

  return (
    <ImageBackground
      source={source}
      resizeMode="contain"
      style={[styles.container, { width: size, height: size }, style]}
      imageStyle={styles.image}
    >
      {children ? (
        children
      ) : (
        <>
          {icon && <Text style={styles.icon}>{icon}</Text>}
          {label && (
            <Text style={styles.label} numberOfLines={1}>
              {label}
            </Text>
          )}
          {empty && <Text style={styles.emptyText}>—</Text>}
        </>
      )}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {},
  icon: {
    fontSize: 20,
  },
  label: {
    fontFamily: fonts.body,
    fontSize: 8,
    color: '#e8dcc8',
    textAlign: 'center',
    marginTop: 2,
  },
  emptyText: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: '#5a4a2a',
  },
});
```

- [ ] **Step 2: Create SystemButton component**

```typescript
// src/components/ui/SystemButton.tsx
import React, { useCallback } from 'react';
import { Image, Pressable, StyleSheet, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { UI_ASSETS } from '@/assets/ui';

type SystemButtonVariant = 'close' | 'settings';

interface SystemButtonProps {
  variant?: SystemButtonVariant;
  onPress: () => void;
  size?: number;
  style?: ViewStyle;
}

export function SystemButton({
  variant = 'close',
  onPress,
  size = 44,
  style,
}: SystemButtonProps) {
  const source =
    variant === 'close'
      ? UI_ASSETS.system.closeOrnate
      : UI_ASSETS.system.closeDiamond;

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }, [onPress]);

  return (
    <Pressable onPress={handlePress} style={[styles.container, { width: size, height: size }, style]}>
      <Image
        source={source}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
```

- [ ] **Step 3: Create ActionMedallion component**

```typescript
// src/components/ui/ActionMedallion.tsx
import React, { useCallback } from 'react';
import {
  ImageBackground,
  Pressable,
  Text,
  View,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { UI_ASSETS } from '@/assets/ui';
import { fonts } from '@/theme/typography';

type MedallionVariant = 'rune' | 'ember';

interface ActionMedallionProps {
  variant?: MedallionVariant;
  icon?: string;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
}

const MEDALLION_SOURCES: Record<MedallionVariant, any> = {
  rune: UI_ASSETS.action.rune,   // Combat abilities
  ember: UI_ASSETS.action.ember,  // HUD buttons
};

export function ActionMedallion({
  variant = 'rune',
  icon,
  label,
  onPress,
  disabled = false,
  style,
}: ActionMedallionProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.92, { damping: 20, stiffness: 300 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 20, stiffness: 300 });
  }, [scale]);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onPress();
  }, [onPress]);

  return (
    <Animated.View style={[animatedStyle, style]}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
      >
        <ImageBackground
          source={MEDALLION_SOURCES[variant]}
          resizeMode="contain"
          style={[styles.background, disabled && styles.disabled]}
        >
          <View style={styles.content}>
            {icon && <Text style={styles.icon}>{icon}</Text>}
            <Text style={styles.label} numberOfLines={1}>
              {label}
            </Text>
          </View>
        </ImageBackground>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  background: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.4,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 20,
    marginBottom: 2,
  },
  label: {
    fontFamily: fonts.heading,
    fontSize: 8,
    letterSpacing: 1,
    color: '#e8dcc8',
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
```

- [ ] **Step 4: Create barrel export index**

```typescript
// src/components/ui/index.ts
export { FantasyPanel } from './FantasyPanel';
export type { PanelVariant } from './FantasyPanel';
export { FantasyButton } from './FantasyButton';
export type { ButtonVariant } from './FantasyButton';
export { PortraitFrame } from './PortraitFrame';
export { ResourceBar } from './ResourceBar';
export { InventorySlot } from './InventorySlot';
export { SystemButton } from './SystemButton';
export { ActionMedallion } from './ActionMedallion';
export type { MedallionVariant } from './ActionMedallion';
```

- [ ] **Step 5: Verify compilation**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/
git commit -m "feat: add InventorySlot, SystemButton, ActionMedallion + barrel export"
```

---

## Chunk 2: Screen Integration — Character Creation Flow

### Task 8: Apply Fantasy UI to Race Selection Screen

**Files:**
- Modify: `src/theme/colors.ts` (add parchment text colors)
- Modify: `app/create/race.tsx`

**Context:** Replace plain bordered cards with `FantasyPanel variant="card"`. Replace the Continue button with `FantasyButton variant="primary"`. Text on FantasyPanel cards should use dark ink tones. The header (step label + title) stays code-based per spec.

First, add shared parchment text colors to the theme so all screens can use them consistently (spec defines: primary `#3a2810`, secondary `#5a4020`, accent `#8b4513`, labels `#5a3a18`).

- [ ] **Step 1: Add parchment text colors to theme**

In `src/theme/colors.ts`, add a `parchmentText` section to the exported `colors` object:

```typescript
export const PARCHMENT_TEXT = {
  primary: '#3a2810',    // Dark ink — main text on parchment
  secondary: '#5a4020',  // Faded ink — secondary text on parchment
  accent: '#8b4513',     // Highlighted ink — selected/active text
  label: '#5a3a18',      // Section labels on parchment
};
```

- [ ] **Step 2: Add imports and update RaceCard to use FantasyPanel**

At the top of `app/create/race.tsx`, add imports:
```typescript
import { FantasyPanel, FantasyButton } from '@/components/ui';
import { PARCHMENT_TEXT } from '@/theme/colors';
```

Replace the `RaceCard` component's outer `Pressable` to wrap content in a `FantasyPanel`:
```typescript
function RaceCard({ race, selected, onPress }: { race: RaceData; selected: boolean; onPress: () => void }) {
  const bonusText = Object.entries(race.abilityBonuses)
    .map(([ability, bonus]) => `${ability.slice(0, 3).toUpperCase()} +${bonus}`)
    .join('  ');

  return (
    <Pressable onPress={onPress}>
      <FantasyPanel
        variant="card"
        style={[styles.card, selected && styles.cardSelected]}
      >
        <View style={styles.cardHeader}>
          <Text style={[styles.cardName, selected && styles.cardNameSelected]}>{race.name}</Text>
          <Text style={styles.cardSpeed}>{race.speed}ft</Text>
        </View>
        <Text style={styles.cardDesc}>{race.description}</Text>
        {bonusText ? <Text style={styles.cardBonuses}>{bonusText}</Text> : null}
        <View style={styles.traits}>
          {race.traits.map(t => (
            <Text key={t.name} style={styles.traitName}>{t.name}</Text>
          ))}
        </View>
      </FantasyPanel>
    </Pressable>
  );
}
```

- [ ] **Step 2: Replace Continue button with FantasyButton**

Replace the footer in the main component:
```typescript
<View style={styles.footer}>
  <FantasyButton
    variant="primary"
    label="CONTINUE"
    onPress={handleNext}
    disabled={!race}
  />
</View>
```

- [ ] **Step 3: Update text colors for parchment context**

Update styles to use dark ink colors on card content (these are now displayed on parchment):
```typescript
const styles = StyleSheet.create({
  // ... keep container, header, stepLabel, title, list, listContent unchanged
  card: {
    // Remove old borderWidth, borderColor, borderRadius, padding, backgroundColor
    // FantasyPanel handles the frame. Just add selection glow.
    opacity: 0.85,
  },
  cardSelected: {
    opacity: 1,
  },
  // ... Update text colors to dark ink using shared constants:
  cardName: { ...textStyles.characterName, color: PARCHMENT_TEXT.primary, fontSize: 16 },
  cardNameSelected: { color: PARCHMENT_TEXT.accent },
  cardSpeed: { fontFamily: fonts.headingRegular, fontSize: 11, color: PARCHMENT_TEXT.secondary, letterSpacing: 1 },
  cardDesc: { fontFamily: fonts.body, fontSize: 13, color: PARCHMENT_TEXT.secondary, lineHeight: 19, marginBottom: spacing.sm },
  cardBonuses: { fontFamily: fonts.heading, fontSize: 11, color: PARCHMENT_TEXT.accent, letterSpacing: 1, marginBottom: spacing.sm },
  // ... trait pills stay with dark ink tones
  traitName: {
    fontFamily: fonts.headingRegular, fontSize: 10, color: PARCHMENT_TEXT.label,
    borderWidth: 1, borderColor: '#b8a070', borderRadius: 4,
    paddingHorizontal: spacing.sm, paddingVertical: 2, letterSpacing: 0.5,
  },
  // Remove old nextButton/nextButtonDisabled/nextButtonText — FantasyButton handles those
});
```

- [ ] **Step 4: Test on device/simulator**

```bash
npx expo start
```

Open the race selection screen and verify:
- Cards show parchment/wood frame backgrounds
- Text is readable (dark ink on parchment)
- Selected card has visual distinction (full opacity)
- Continue button shows wood-framed parchment
- Layout doesn't break

- [ ] **Step 5: Commit**

```bash
git add app/create/race.tsx
git commit -m "feat: apply FantasyPanel and FantasyButton to race selection"
```

---

### Task 9: Apply Fantasy UI to Class, Origin, Companions, Summary, Tutorial, Campaign Start Screens

**Files:**
- Modify: `app/create/class.tsx`
- Modify: `app/create/origin.tsx`
- Modify: `app/create/companions.tsx`
- Modify: `app/create/summary.tsx`
- Modify: `app/create/abilities.tsx`
- Modify: `app/create/index.tsx`
- Modify: `app/create/tutorial.tsx`
- Modify: `app/create/campaign-start.tsx`

**Context:** These screens all follow the same pattern as race selection: selection cards → `FantasyPanel variant="card"`, continue buttons → `FantasyButton variant="primary"`, secondary actions → `FantasyButton variant="secondary"`. Apply the same treatment as Task 8. The `abilities.tsx` screen already has skill cards — wrap them in FantasyPanel too. The `tutorial.tsx` and `campaign-start.tsx` screens also have cards/buttons that should receive the fantasy treatment.

**Important:** Preserve existing ornamental dividers (gold gradient lines with center diamond) — they complement the assets per spec.

Use the shared parchment text colors (see `PARCHMENT_TEXT` in `src/theme/colors.ts` added in Task 8) for all text rendered on top of FantasyPanel backgrounds.

For each screen:
1. Import `FantasyPanel` and `FantasyButton` from `@/components/ui`
2. Import `PARCHMENT_TEXT` from `@/theme/colors` for ink text colors
3. Wrap card components in `FantasyPanel variant="card"`
4. Replace action buttons with `FantasyButton`
5. Update text colors to `PARCHMENT_TEXT` for content on parchment
6. Remove old border/background styles that the FantasyPanel replaces
7. Preserve all existing ornamental dividers

- [ ] **Step 1: Update `app/create/class.tsx`**

Same pattern as race.tsx — wrap class cards in FantasyPanel, replace Continue with FantasyButton. Update text colors to dark ink.

- [ ] **Step 2: Update `app/create/origin.tsx`**

Wrap origin/background cards in FantasyPanel variant="card", replace Continue with FantasyButton.

- [ ] **Step 3: Update `app/create/companions.tsx`**

Wrap companion selection cards in FantasyPanel variant="card". Use PortraitFrame for companion portraits. Replace buttons with FantasyButton.

- [ ] **Step 4: Update `app/create/summary.tsx`**

Wrap the summary card/review panel in FantasyPanel variant="pinned". Replace action buttons with FantasyButton.

- [ ] **Step 5: Update `app/create/abilities.tsx`**

Wrap existing skill cards in FantasyPanel variant="card". Replace Continue button with FantasyButton. Existing ability score cards can optionally be wrapped too.

- [ ] **Step 6: Update `app/create/index.tsx`**

The welcome screen with "I KNOW D&D" / "I'M NEW" buttons — replace with FantasyButton variant="primary" and variant="secondary".

- [ ] **Step 7: Update `app/create/tutorial.tsx`**

Wrap tutorial content panels in FantasyPanel variant="pinned". Replace navigation buttons with FantasyButton.

- [ ] **Step 8: Update `app/create/campaign-start.tsx`**

Wrap campaign initialization content in FantasyPanel variant="card". Replace the start button with FantasyButton variant="primary".

- [ ] **Step 9: Test all creation screens on device**

Navigate through all creation steps including welcome, tutorial, and campaign start. Verify parchment panels render correctly, buttons work, text is legible, ornamental dividers are preserved.

- [ ] **Step 10: Commit**

```bash
git add app/create/
git commit -m "feat: apply fantasy UI to entire character creation flow"
```

---

## Chunk 3: Screen Integration — Game Screens

### Task 10: Apply Fantasy UI to Game Session Screen

**Files:**
- Modify: `app/game/session.tsx`

**Context:** The main gameplay screen. Per the design spec:
- Narration area → `FantasyPanel variant="pinned"` (parchment pinned to board)
- Choice buttons → `FantasyPanel variant="strip"` (loose parchment) wrapping choice text
- The existing `ChoiceButton` component handles its own press logic, so we wrap it rather than replace it
- Modals (menu modal, tutorial complete modal) → `FantasyPanel variant="modal"` for the card
- Header stays code-based (spec says it doesn't need heavy frame)
- Party strip stays as-is for now (PartyCard gets PortraitFrame in a separate task)
- **Preserve existing ornamental dividers** (gold gradient lines with center diamond) — they complement the assets per spec

- [ ] **Step 1: Import fantasy components**

```typescript
import { FantasyPanel, FantasyButton } from '@/components/ui';
```

- [ ] **Step 2: Wrap narration area in FantasyPanel**

Replace the plain `narrativeArea` View:
```typescript
<FantasyPanel variant="pinned" style={styles.narrativeArea}>
  {isLoading ? (
    <View style={styles.loading}>
      <ActivityIndicator size="small" color="#8b4513" />
      <Text style={styles.loadingText}>The DM ponders...</Text>
    </View>
  ) : (
    <NarrativeText
      text={currentNarration}
      onComplete={handleNarrationComplete}
    />
  )}
</FantasyPanel>
```

Note: NarrativeText uses IM Fell English font which is already dark/serif. It may need a color adjustment since it's now on parchment (change from light text to dark ink `#3a2810`). This requires a `parchmentMode` prop or context — evaluate during implementation and adjust NarrativeText if needed.

- [ ] **Step 3: Update menu modal to use FantasyPanel**

Replace `modalCard` View with:
```typescript
<FantasyPanel variant="modal" style={styles.modalCard}>
  <Text style={styles.modalTitle}>MENU</Text>
  {/* ... modal options stay the same but text colors update to ink tones */}
</FantasyPanel>
```

Replace modal buttons with FantasyButton where appropriate.

- [ ] **Step 4: Update tutorial complete modal similarly**

Wrap in FantasyPanel variant="modal". Replace "CREATE MY CHARACTER" button with FantasyButton.

- [ ] **Step 5: Update freeform input styling**

The freeform text input area at the bottom can be wrapped in a subtle FantasyPanel variant="strip" for visual consistency.

- [ ] **Step 6: Update styles — remove old border styles, adjust text colors**

Remove `borderWidth`, `borderColor`, `backgroundColor` from styles that FantasyPanel now handles. Update text colors in modal content to dark ink tones.

- [ ] **Step 7: Test gameplay session**

Run app, verify narration renders on parchment, choices work, modals look right, freeform input is usable.

- [ ] **Step 8: Commit**

```bash
git add app/game/session.tsx
git commit -m "feat: apply fantasy UI to game session screen"
```

---

### Task 11: Apply Fantasy UI to Character Sheet

**Files:**
- Modify: `app/game/character.tsx`

**Context:** The character sheet already has a parchment aesthetic (code-based). Now we upgrade it:
- Replace the code-based parchment body with `FantasyPanel variant="pinned"` for the scrollable body
- Add `PortraitFrame size="md"` around the character header area
- Replace the close button with `SystemButton variant="close"`
- HP/Mana/XP display → `ResourceBar` components (if the sheet shows status bars)
- Equipment items → `InventorySlot` components for the equipment grid

The existing parchment curl components (`ParchmentCurlTop`/`ParchmentCurlBottom`) can be kept as they add nice top/bottom scroll effects, or replaced — evaluate during implementation.

- [ ] **Step 1: Import fantasy components**

```typescript
import { FantasyPanel, PortraitFrame, ResourceBar, InventorySlot, SystemButton } from '@/components/ui';
```

- [ ] **Step 2: Replace close button with SystemButton**

```typescript
<SystemButton variant="close" onPress={handleClose} style={styles.closeButton} />
```

Remove the old closeButton/closeButtonText styles.

- [ ] **Step 3: Add PortraitFrame to character header**

In `CharacterHeader`, wrap the character initial/name area:
```typescript
function CharacterHeader({ character }: { character: Character }) {
  const raceName = getRaceDisplayName(character.race);
  const className = getClassDisplayName(character.className);
  const initial = character.name.charAt(0).toUpperCase();

  return (
    <View style={styles.header}>
      <PortraitFrame size="md" variant="simple">
        <Text style={styles.portraitInitial}>{initial}</Text>
      </PortraitFrame>
      <Text style={styles.headerName}>{character.name}</Text>
      <Text style={styles.headerSubtitle}>
        Level {character.level} · {raceName} · {className}
      </Text>
      <View style={styles.headerBorder} />
    </View>
  );
}
```

- [ ] **Step 4: Replace equipment rendering with InventorySlot**

In `EquipmentSection`, wrap each equipment item display in an InventorySlot:
```typescript
<View style={styles.equipmentGrid}>
  {equipped.map((item) => (
    <InventorySlot
      key={item.id}
      icon={EQUIPMENT_ICONS[item.type]}
      label={item.name}
      variant="square"
    />
  ))}
</View>
```

- [ ] **Step 5: Test character sheet**

Open character sheet from game session. Verify portrait frame renders, close button works, equipment slots display correctly.

- [ ] **Step 6: Commit**

```bash
git add app/game/character.tsx
git commit -m "feat: apply fantasy UI to character sheet"
```

---

### Task 12: Apply Fantasy UI to Camp Screen

**Files:**
- Modify: `app/game/camp.tsx`

**Context:** Per the design spec:
- Companion portraits → `PortraitFrame size="md"` (replacing plain colored dots)
- Activity cards → `FantasyPanel variant="card"`
- Break Camp button → `FantasyButton variant="primary"`
- Companion picker modal → `FantasyPanel variant="modal"`

- [ ] **Step 1: Import fantasy components**

```typescript
import { FantasyPanel, FantasyButton, PortraitFrame } from '@/components/ui';
```

- [ ] **Step 2: Update CompanionPortrait to use PortraitFrame**

```typescript
function CompanionPortrait({ companion }: { companion: Companion }) {
  const initial = companion.name.charAt(0).toUpperCase();
  return (
    <View style={styles.companionCard}>
      <PortraitFrame size="sm" variant="ornate">
        <Text style={styles.companionInitial}>{initial}</Text>
      </PortraitFrame>
      <Text style={styles.companionName} numberOfLines={1}>
        {companion.name}
      </Text>
      <Text style={styles.companionClass} numberOfLines={1}>
        {companion.className}
      </Text>
    </View>
  );
}
```

- [ ] **Step 3: Wrap activity buttons in FantasyPanel**

Replace the plain `activityButton` style with FantasyPanel:
```typescript
<FantasyPanel variant={isBreak ? 'button' : 'card'} style={styles.activityButton}>
  <Text style={styles.activityIcon}>{activity.icon}</Text>
  <View style={styles.activityText}>
    <Text style={styles.activityLabel}>{activity.label}</Text>
    <Text style={styles.activityDesc}>{activity.description}</Text>
  </View>
</FantasyPanel>
```

For the "Break Camp" button, use FantasyButton:
```typescript
// In CAMP_ACTIVITIES, handle 'break' separately:
<FantasyButton variant="primary" label="BREAK CAMP" onPress={() => router.back()} />
```

- [ ] **Step 4: Update companion picker modal**

Wrap `pickerCard` in FantasyPanel variant="modal". Update text colors.

- [ ] **Step 5: Update text colors on parchment panels to dark ink**

Activity labels and descriptions should use `#3a2810` and `#5a4020` since they're on parchment.

- [ ] **Step 6: Test camp screen**

Navigate to camp, verify companion portraits, activity cards, and modal styling.

- [ ] **Step 7: Commit**

```bash
git add app/game/camp.tsx
git commit -m "feat: apply fantasy UI to camp screen"
```

---

### Task 13: Apply Fantasy UI to Threshold, Map, Journal, Recap Screens

**Files:**
- Modify: `app/game/threshold.tsx`
- Modify: `app/game/map.tsx`
- Modify: `app/game/journal.tsx`
- Modify: `app/game/recap.tsx`

**Context:**
- **Threshold:** Unlock cards → `FantasyPanel variant="card"`, revival choices → `FantasyButton`. Keep the dramatic dark purple background and intro effects.
- **Map:** Add `map-border.png` asset as a decorative frame around the map area. Node cards can optionally use FantasyPanel.
- **Journal:** Wrap journal entries in `FantasyPanel variant="pinned"`.
- **Recap:** Wrap recap content in `FantasyPanel variant="pinned"`, action buttons → FantasyButton.

- [ ] **Step 1: Update threshold.tsx**

Import components, wrap UnlockCard in FantasyPanel variant="card", wrap choices area buttons.

- [ ] **Step 2: Update map.tsx**

Light touch — add the map border asset as a decorative element. Wrap node info cards if applicable.

- [ ] **Step 3: Update journal.tsx**

Wrap journal entries in FantasyPanel variant="pinned".

- [ ] **Step 4: Update recap.tsx**

Wrap recap content, replace buttons with FantasyButton.

- [ ] **Step 5: Test all four screens**

Navigate to each screen and verify visual changes look correct.

- [ ] **Step 6: Commit**

```bash
git add app/game/threshold.tsx app/game/map.tsx app/game/journal.tsx app/game/recap.tsx
git commit -m "feat: apply fantasy UI to threshold, map, journal, recap screens"
```

---

## Chunk 4: Screen Integration — Auth, Settings, PartyCard

### Task 14: Apply Fantasy UI to Login & Settings Screens

**Files:**
- Modify: `app/(auth)/login.tsx`
- Modify: `app/settings.tsx`

**Context:** Light touch per spec:
- **Login:** FantasyButton for login/register actions, FantasyPanel variant="card" for the form container if appropriate.
- **Settings:** FantasyButton for reset button, FantasyPanel variant="card" for setting card sections. Keep the functional settings UI intact — just add visual flair.

- [ ] **Step 1: Update login.tsx**

Import FantasyButton, replace login/register buttons. Optionally wrap form in FantasyPanel.

- [ ] **Step 2: Update settings.tsx**

Replace `settingCard` wrappers with `FantasyPanel variant="card"`. Replace `resetButton` with `FantasyButton variant="danger"`. Update text colors on cards.

- [ ] **Step 3: Test login and settings**

Verify both screens render correctly, buttons work, settings persist.

- [ ] **Step 4: Commit**

```bash
git add app/(auth)/login.tsx app/settings.tsx
git commit -m "feat: apply fantasy UI to login and settings screens"
```

---

### Task 15: Update PartyCard with PortraitFrame

**Files:**
- Modify: `src/components/game/PartyCard.tsx`

**Context:** Party cards in the game session show character/companion info. Currently they use a plain colored circle for the portrait area. Replace with `PortraitFrame size="sm"` containing the class initial. This makes party cards feel more like physical game pieces.

- [ ] **Step 1: Import PortraitFrame**

```typescript
import { PortraitFrame } from '@/components/ui';
```

- [ ] **Step 2: Replace portrait circle with PortraitFrame**

Find the portrait/initial rendering area in PartyCard and wrap in:
```typescript
<PortraitFrame size="sm" variant="ornate">
  <Text style={styles.initial}>{name.charAt(0)}</Text>
</PortraitFrame>
```

Remove the old `portraitCircle` / `initialText` styles that the PortraitFrame replaces.

- [ ] **Step 3: Test in game session**

Verify party strip shows ornate portrait frames around character initials.

- [ ] **Step 4: Commit**

```bash
git add src/components/game/PartyCard.tsx
git commit -m "feat: add PortraitFrame to party cards"
```

---

### Task 16: Final Visual Polish & Consistency Pass

**Files:**
- Modify: Any screens needing tweaks after testing
- Modify: `src/components/ui/*.tsx` (padding/sizing adjustments)

**Context:** After integrating all screens, do a visual consistency pass:
1. Check all FantasyPanel inset paddings look right — content shouldn't overlap frame edges
2. Check text readability — dark ink on parchment should be legible in all contexts
3. Check button disabled states — FantasyButton opacity should clearly indicate disabled
4. Check portrait frame sizes — sm should fit in party strip, md in camp/character sheet
5. Adjust any padding values in VARIANT_PADDING constants as needed
6. Verify the app still performs well (no noticeable image loading lag)

- [ ] **Step 1: Run full app walkthrough**

Create a character, play through a session, visit camp, check character sheet, open settings. Note any visual issues.

- [ ] **Step 2: Fix padding/sizing issues**

Adjust `VARIANT_PADDING` in FantasyPanel.tsx and `CONTENT_RATIO`/`SIZE_MAP` in PortraitFrame.tsx based on visual testing.

- [ ] **Step 3: Fix any text readability issues**

Ensure all text on parchment backgrounds uses dark ink colors and has sufficient contrast.

- [ ] **Step 4: Test on both iOS and Android if possible**

Verify `ImageBackground` renders correctly on both platforms. Check `resizeMode="stretch"` works as expected.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/ app/ src/theme/
git commit -m "fix: visual polish and consistency pass for fantasy UI"
```
