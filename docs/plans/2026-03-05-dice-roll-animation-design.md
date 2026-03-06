# 3D Dice Roll Animation — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** BG3-style 3D d20 dice roll popup with customizable skins, physics tumble animation, tap-to-skip, and haptic feedback.

**Architecture:** `@react-three/fiber/native` renders a 3D icosahedron inside a compact modal overlay. Server resolves dice rolls and returns structured `DiceRollResult` objects. Client animates the d20 landing on the result, shows success/fail verdict, then dismisses to narration. Dice skins are material configs stored in settings.

**Tech Stack:** three.js, @react-three/fiber/native, expo-gl, expo-haptics, react-native-reanimated

---

### Task 1: Install 3D Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install packages**

Run:
```bash
npx expo install expo-gl three @react-three/fiber
```

**Step 2: Verify Metro can resolve the packages**

Run:
```bash
npx tsc --noEmit
```
Expected: No new errors

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add three.js and react-three-fiber for 3D dice"
```

---

### Task 2: Add DiceRollResult Type

**Files:**
- Modify: `src/types/game.ts` (after `DiceRequest` interface, ~line 299)

**Step 1: Add the type**

Add after the `DiceRequest` interface:

```ts
export interface DiceRollResult {
  type: 'skill_check' | 'attack_roll' | 'saving_throw' | 'damage';
  roller: string;
  roll: number;          // raw d20 result (1-20)
  modifier: number;
  total: number;         // roll + modifier
  dc?: number;
  success?: boolean;
  isCritical: boolean;
  isFumble: boolean;
  label: string;         // "Stealth Check", "Longsword Attack"
}
```

**Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: PASS

**Step 3: Commit**

```bash
git add src/types/game.ts
git commit -m "feat: add DiceRollResult type for structured dice data"
```

---

### Task 3: Create Dice Skins Data

**Files:**
- Create: `src/data/diceSkins.ts`

**Step 1: Write skin definitions**

```ts
export interface DiceSkin {
  id: string;
  name: string;
  faceColor: string;
  numberColor: string;
  edgeColor: string;
  metalness: number;
  roughness: number;
  emissiveColor?: string;
  emissiveIntensity?: number;
  premium: boolean;
}

export const DICE_SKINS: DiceSkin[] = [
  {
    id: 'tavern_bone',
    name: 'Tavern Bone',
    faceColor: '#d4c5a9',
    numberColor: '#2a1f0f',
    edgeColor: '#8b7d6b',
    metalness: 0.1,
    roughness: 0.8,
    premium: false,
  },
  {
    id: 'obsidian',
    name: 'Obsidian',
    faceColor: '#1a1a1a',
    numberColor: '#b48c3c',
    edgeColor: '#333333',
    metalness: 0.9,
    roughness: 0.2,
    emissiveColor: '#ff6600',
    emissiveIntensity: 0.05,
    premium: false,
  },
  {
    id: 'dragon_gold',
    name: 'Dragon Gold',
    faceColor: '#2a1f0f',
    numberColor: '#ffffff',
    edgeColor: '#b48c3c',
    metalness: 0.7,
    roughness: 0.3,
    emissiveColor: '#b48c3c',
    emissiveIntensity: 0.1,
    premium: false,
  },
];

export const DEFAULT_DICE_SKIN = 'obsidian';
```

**Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: PASS

**Step 3: Commit**

```bash
git add src/data/diceSkins.ts
git commit -m "feat: add dice skin definitions (3 free starter skins)"
```

---

### Task 4: Update Game Store for Dice Roll Queue

**Files:**
- Modify: `src/stores/useGameStore.ts`
- Modify: `src/types/game.ts` (import)

**Step 1: Replace single dice state with queue**

In `useGameStore.ts`:

1. Add `DiceRollResult` to imports from `@/types/game`

2. Replace in the interface:
```ts
// Remove these:
showDiceRoll: boolean;
lastDiceResult: number | null;
triggerDiceRoll: (result: number) => void;
clearDiceRoll: () => void;

// Replace with:
pendingDiceRolls: DiceRollResult[];
activeDiceRoll: DiceRollResult | null;
queueDiceRolls: (rolls: DiceRollResult[]) => void;
shiftDiceRoll: () => void;
clearAllDiceRolls: () => void;
```

3. Replace in initialState:
```ts
// Remove:
showDiceRoll: false,
lastDiceResult: null,

// Replace with:
pendingDiceRolls: [],
activeDiceRoll: null,
```

4. Replace action implementations:
```ts
queueDiceRolls: (rolls) => {
  if (rolls.length === 0) return;
  set({ pendingDiceRolls: rolls.slice(1), activeDiceRoll: rolls[0] });
},
shiftDiceRoll: () => {
  const { pendingDiceRolls } = get();
  if (pendingDiceRolls.length > 0) {
    set({ activeDiceRoll: pendingDiceRolls[0], pendingDiceRolls: pendingDiceRolls.slice(1) });
  } else {
    set({ activeDiceRoll: null });
  }
},
clearAllDiceRolls: () => set({ pendingDiceRolls: [], activeDiceRoll: null }),
```

**Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: May have errors in session.tsx referencing old dice state — fix in Task 8.

**Step 3: Commit**

```bash
git add src/stores/useGameStore.ts
git commit -m "feat: replace single dice state with roll queue in game store"
```

---

### Task 5: Add Dice Skin to Settings Store

**Files:**
- Modify: `src/stores/useSettingsStore.ts`

**Step 1: Add dice skin state**

Add to `SettingsState` interface:
```ts
selectedDiceSkin: string;
setDiceSkin: (skinId: string) => void;
```

Add to the store create function, after `accessibility`:
```ts
selectedDiceSkin: 'obsidian',
setDiceSkin: (selectedDiceSkin) => set({ selectedDiceSkin }),
```

The `persist` middleware will automatically save this to MMKV.

**Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: PASS

**Step 3: Commit**

```bash
git add src/stores/useSettingsStore.ts
git commit -m "feat: add dice skin selection to settings store"
```

---

### Task 6: Create 3D D20 Mesh Component

**Files:**
- Create: `src/components/game/D20Mesh.tsx`

**Step 1: Build the 3D die component**

This component renders an icosahedron with the selected skin material inside a R3F Canvas. It tumbles rapidly, then settles to show the result.

```tsx
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber/native';
import * as THREE from 'three';
import type { DiceSkin } from '@/data/diceSkins';

interface D20MeshProps {
  skin: DiceSkin;
  phase: 'tumbling' | 'landing' | 'settled';
  onSettled: () => void;
}

// Pre-computed rotation for "top face" — just needs to look like it landed
const LAND_ROTATION = new THREE.Euler(0.3, 0.5, 0.1);

export function D20Mesh({ skin, phase, onSettled }: D20MeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const tumbleSpeed = useRef({ x: 8 + Math.random() * 4, y: 6 + Math.random() * 4, z: 5 + Math.random() * 3 });
  const landingProgress = useRef(0);
  const settledCalled = useRef(false);

  const material = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(skin.faceColor),
      metalness: skin.metalness,
      roughness: skin.roughness,
      flatShading: true,
    });
    if (skin.emissiveColor) {
      mat.emissive = new THREE.Color(skin.emissiveColor);
      mat.emissiveIntensity = skin.emissiveIntensity ?? 0.1;
    }
    return mat;
  }, [skin]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    if (phase === 'tumbling') {
      meshRef.current.rotation.x += tumbleSpeed.current.x * delta;
      meshRef.current.rotation.y += tumbleSpeed.current.y * delta;
      meshRef.current.rotation.z += tumbleSpeed.current.z * delta;
      settledCalled.current = false;
      landingProgress.current = 0;
    } else if (phase === 'landing') {
      // Decelerate toward target rotation
      landingProgress.current = Math.min(1, landingProgress.current + delta * 2.5);
      const t = easeOutBounce(landingProgress.current);

      meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x % (Math.PI * 2), LAND_ROTATION.x, t);
      meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y % (Math.PI * 2), LAND_ROTATION.y, t);
      meshRef.current.rotation.z = THREE.MathUtils.lerp(meshRef.current.rotation.z % (Math.PI * 2), LAND_ROTATION.z, t);

      if (landingProgress.current >= 1 && !settledCalled.current) {
        settledCalled.current = true;
        onSettled();
      }
    }
    // 'settled' — no rotation updates
  });

  return (
    <mesh ref={meshRef} material={material}>
      <icosahedronGeometry args={[1.2, 0]} />
    </mesh>
  );
}

function easeOutBounce(t: number): number {
  if (t < 1 / 2.75) return 7.5625 * t * t;
  if (t < 2 / 2.75) { t -= 1.5 / 2.75; return 7.5625 * t * t + 0.75; }
  if (t < 2.5 / 2.75) { t -= 2.25 / 2.75; return 7.5625 * t * t + 0.9375; }
  t -= 2.625 / 2.75;
  return 7.5625 * t * t + 0.984375;
}
```

**Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: PASS

**Step 3: Commit**

```bash
git add src/components/game/D20Mesh.tsx
git commit -m "feat: add 3D D20 mesh component with tumble animation"
```

---

### Task 7: Create DiceOverlay Component

**Files:**
- Create: `src/components/game/DiceOverlay.tsx`

**Step 1: Build the full overlay**

This is the BG3-style popup: 3D die on top, result card below. Semi-transparent overlay, tap to skip.

```tsx
import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Canvas } from '@react-three/fiber/native';
import * as Haptics from 'expo-haptics';
import { colors } from '@/theme/colors';
import { fonts, spacing } from '@/theme/typography';
import { D20Mesh } from './D20Mesh';
import { DICE_SKINS, DEFAULT_DICE_SKIN } from '@/data/diceSkins';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useSettingsStore as useA11y } from '@/stores/useSettingsStore';
import type { DiceRollResult } from '@/types/game';

interface DiceOverlayProps {
  roll: DiceRollResult;
  onComplete: () => void;
}

type Phase = 'tumbling' | 'landing' | 'settled';

const TUMBLE_DURATION = 2500; // ms before landing starts
const RESULT_DISPLAY_DURATION = 1500; // ms to show result before dismissing

export function DiceOverlay({ roll, onComplete }: DiceOverlayProps) {
  const [phase, setPhase] = useState<Phase>('tumbling');
  const [showResult, setShowResult] = useState(false);
  const skinId = useSettingsStore((s) => s.selectedDiceSkin);
  const hapticsEnabled = useSettingsStore((s) => s.accessibility.hapticFeedback);
  const skin = DICE_SKINS.find((s) => s.id === skinId) || DICE_SKINS.find((s) => s.id === DEFAULT_DICE_SKIN)!;

  // Auto-advance from tumbling to landing
  useEffect(() => {
    if (phase === 'tumbling') {
      const timer = setTimeout(() => setPhase('landing'), TUMBLE_DURATION);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  // Tap to skip — immediately start landing
  const handleTapSkip = useCallback(() => {
    if (phase === 'tumbling') {
      setPhase('landing');
    } else if (showResult) {
      onComplete();
    }
  }, [phase, showResult, onComplete]);

  // Called when the D20Mesh finishes its landing animation
  const handleSettled = useCallback(() => {
    setShowResult(true);

    // Haptic feedback based on result
    if (hapticsEnabled) {
      if (roll.isCritical) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } else if (roll.success) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }

    // Auto-dismiss after delay
    setTimeout(onComplete, RESULT_DISPLAY_DURATION);
  }, [roll, hapticsEnabled, onComplete]);

  // Result styling
  const resultColor = roll.isCritical
    ? colors.gold.primary
    : roll.isFumble
      ? '#8b0000'
      : roll.success
        ? '#4a8c3c'
        : colors.combat.red;

  const verdictText = roll.isCritical
    ? 'CRITICAL SUCCESS'
    : roll.isFumble
      ? 'CRITICAL FAIL'
      : roll.success
        ? 'SUCCESS'
        : 'FAILED';

  return (
    <Pressable style={styles.overlay} onPress={handleTapSkip}>
      {/* 3D Die */}
      <View style={styles.canvasContainer}>
        <Canvas
          camera={{ position: [0, 0, 4], fov: 50 }}
          style={styles.canvas}
        >
          <ambientLight intensity={0.4} />
          <pointLight position={[3, 3, 3]} intensity={1.2} color="#ffffff" />
          <pointLight position={[-2, -1, 2]} intensity={0.4} color={resultColor} />
          <D20Mesh skin={skin} phase={phase} onSettled={handleSettled} />
        </Canvas>
      </View>

      {/* Result Card */}
      <View style={[styles.card, showResult && { borderColor: resultColor }]}>
        {/* Roll type label */}
        <Text style={styles.rollLabel}>{roll.label.toUpperCase()}</Text>

        {/* Number display */}
        <View style={styles.numberRow}>
          <Text style={[styles.rollNumber, { color: showResult ? resultColor : colors.text.primary }]}>
            {showResult ? roll.total : '?'}
          </Text>
          {roll.dc != null && showResult && (
            <Text style={styles.dcText}>vs DC {roll.dc}</Text>
          )}
        </View>

        {/* Modifier breakdown */}
        {showResult && (
          <Text style={styles.breakdown}>
            d20({roll.roll}) {roll.modifier >= 0 ? '+' : ''}{roll.modifier}
          </Text>
        )}

        {/* Verdict */}
        {showResult && (
          <Text style={[styles.verdict, { color: resultColor }]}>
            {verdictText}
          </Text>
        )}

        {/* Tap hint */}
        {!showResult && (
          <Text style={styles.tapHint}>Tap to skip</Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  canvasContainer: {
    width: 180,
    height: 180,
    marginBottom: -10,
  },
  canvas: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  card: {
    backgroundColor: colors.bg.secondary,
    borderWidth: 1,
    borderColor: colors.gold.border,
    borderRadius: 12,
    padding: spacing.lg,
    alignItems: 'center',
    minWidth: 200,
  },
  rollLabel: {
    fontFamily: fonts.headingRegular,
    fontSize: 10,
    color: colors.text.tertiary,
    letterSpacing: 2,
    marginBottom: spacing.xs,
  },
  numberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  rollNumber: {
    fontFamily: fonts.heading,
    fontSize: 48,
    color: colors.text.primary,
    letterSpacing: 1,
  },
  dcText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.text.tertiary,
  },
  breakdown: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  verdict: {
    fontFamily: fonts.heading,
    fontSize: 14,
    letterSpacing: 2,
    marginTop: spacing.sm,
  },
  tapHint: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.text.disabled,
    marginTop: spacing.sm,
  },
});
```

**Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: PASS

**Step 3: Commit**

```bash
git add src/components/game/DiceOverlay.tsx
git commit -m "feat: add BG3-style DiceOverlay with 3D die + result card"
```

---

### Task 8: Integrate DiceOverlay into Game Session

**Files:**
- Modify: `app/game/session.tsx`

**Step 1: Import DiceOverlay and update store usage**

Add imports:
```ts
import { DiceOverlay } from '@/components/game/DiceOverlay';
```

Replace old dice destructuring in the store selector with:
```ts
activeDiceRoll,
shiftDiceRoll,
```

**Step 2: Add DiceOverlay render**

After the `ApprovalStack` block (before closing `</KeyboardAvoidingView>`), add:
```tsx
{activeDiceRoll && (
  <DiceOverlay
    roll={activeDiceRoll}
    onComplete={shiftDiceRoll}
  />
)}
```

**Step 3: Remove any references to old `showDiceRoll` / `lastDiceResult` / `triggerDiceRoll` / `clearDiceRoll`**

These were replaced in Task 4. Ensure no references remain in session.tsx.

**Step 4: Verify**

Run: `npx tsc --noEmit`
Expected: PASS

**Step 5: Commit**

```bash
git add app/game/session.tsx
git commit -m "feat: integrate DiceOverlay into game session screen"
```

---

### Task 9: Return Structured Dice Results from Server

**Files:**
- Modify: `supabase/functions/_shared/dice-engine.ts`
- Modify: `supabase/functions/game-turn/index.ts`

**Step 1: Update dice-engine to return structured results**

Add a new interface and modify `processDiceRequests` to return structured `DiceRollResult` objects alongside the text results:

In `dice-engine.ts`, add to exports:

```ts
export interface StructuredDiceResult {
  type: 'skill_check' | 'attack_roll' | 'saving_throw' | 'damage';
  roller: string;
  roll: number;
  modifier: number;
  total: number;
  dc?: number;
  success?: boolean;
  isCritical: boolean;
  isFumble: boolean;
  label: string;
}
```

Update `DiceResolutionResult`:
```ts
interface DiceResolutionResult {
  results: string[];
  structuredResults: StructuredDiceResult[];
  hpChanges: { target: string; delta: number }[];
}
```

In each switch case of `processDiceRequests`, push to `structuredResults` alongside the text `results`. For example in the `attack_roll` case:

```ts
structuredResults.push({
  type: 'attack_roll',
  roller: req.roller || character.name,
  roll: d20,
  modifier: attackMod,
  total,
  dc: targetAC,
  success: hit,
  isCritical: isCrit,
  isFumble,
  label: `${req.ability || 'Attack'} vs ${req.target || 'target'}`,
});
```

Similarly for `skill_check` and `saving_throw` cases.

**Step 2: Pass structured results in game-turn response**

In `game-turn/index.ts`, after `processDiceRequests` call, extract `structuredResults`:

```ts
const { results, structuredResults, hpChanges } = processDiceRequests(diceRequests, character, enemies);
```

Add to the response body:
```ts
return new Response(JSON.stringify({
  aiResponse: normalized,
  diceResults,
  diceRollResults: structuredResults,  // NEW — for client animation
  companions: updatedCompanions,
  turnCount: campaign.turn_count + 1,
}), {
```

**Step 3: Commit**

```bash
git add supabase/functions/_shared/dice-engine.ts supabase/functions/game-turn/index.ts
git commit -m "feat: return structured dice results from game-turn for client animation"
```

---

### Task 10: Trigger Dice Rolls from Server Response on Client

**Files:**
- Modify: `src/services/campaign.ts`
- Modify: `app/game/session.tsx`

**Step 1: Update submitAction to pass dice results through**

In `src/services/campaign.ts`, update the `submitAction` return type to include `diceRollResults`:

Wherever `submitAction` parses the server response, ensure `diceRollResults` is passed through in the return value.

**Step 2: In session.tsx handleChoicePress and handleFreeformSubmit**

After receiving `result` from `submitAction`, before calling `processAIResponse`, queue dice rolls:

```ts
// Queue dice roll animations before processing narration
if (result.diceRollResults && result.diceRollResults.length > 0) {
  store.queueDiceRolls(result.diceRollResults);
}

store.processAIResponse(result.aiResponse);
```

**Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: PASS

**Step 4: Commit**

```bash
git add src/services/campaign.ts app/game/session.tsx
git commit -m "feat: trigger dice roll animations from server response"
```

---

### Task 11: Deploy Edge Functions and Full Test

**Step 1: Deploy updated edge functions**

Run:
```bash
npx supabase functions deploy game-turn
```

**Step 2: TypeScript check**

Run: `npx tsc --noEmit`
Expected: PASS

**Step 3: Test on device**

- Start a game session
- Make a choice that triggers a skill check
- Verify: 3D d20 appears, tumbles, lands, shows result card with success/fail
- Verify: tapping during tumble skips to result
- Verify: haptic feedback on result

**Step 4: Commit all remaining changes**

```bash
git add -A
git commit -m "feat: 3D dice roll animation system — complete"
```
