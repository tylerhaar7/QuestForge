import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Canvas } from '@react-three/fiber/native';
import * as Haptics from 'expo-haptics';
import { colors } from '@/theme/colors';
import { fonts, spacing } from '@/theme/typography';
import { D20Mesh } from './D20Mesh';
import { DICE_SKINS, DEFAULT_DICE_SKIN } from '@/data/diceSkins';
import { useSettingsStore } from '@/stores/useSettingsStore';
import type { DiceRollResult } from '@/types/game';

// TODO(feature-flag): Feature-staged for combat UI. Not yet wired into game session. See docs/tech-debt.md.

interface DiceOverlayProps {
  roll: DiceRollResult;
  onComplete: () => void;
}

type Phase = 'tumbling' | 'landing' | 'settled';

const TUMBLE_DURATION = 2500;
const RESULT_DISPLAY_DURATION = 1500;

export function DiceOverlay({ roll, onComplete }: DiceOverlayProps) {
  const [phase, setPhase] = useState<Phase>('tumbling');
  const [showResult, setShowResult] = useState(false);
  const skinId = useSettingsStore((s) => s.selectedDiceSkin);
  const hapticsEnabled = useSettingsStore((s) => s.accessibility.hapticFeedback);
  const skin = DICE_SKINS.find((s) => s.id === skinId) || DICE_SKINS.find((s) => s.id === DEFAULT_DICE_SKIN)!;

  useEffect(() => {
    if (phase === 'tumbling') {
      const timer = setTimeout(() => setPhase('landing'), TUMBLE_DURATION);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  const handleTapSkip = useCallback(() => {
    if (phase === 'tumbling') {
      setPhase('landing');
    } else if (showResult) {
      onComplete();
    }
  }, [phase, showResult, onComplete]);

  const handleSettled = useCallback(() => {
    setShowResult(true);

    if (hapticsEnabled) {
      if (roll.isCritical) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } else if (roll.success) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }

    setTimeout(onComplete, RESULT_DISPLAY_DURATION);
  }, [roll, hapticsEnabled, onComplete]);

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
      <View style={styles.canvasContainer}>
        <Canvas
          camera={{ position: [0, 0, 4], fov: 50 }}
          style={styles.canvas}
        >
          <ambientLight intensity={0.4} />
          <pointLight position={[3, 3, 3]} intensity={1.2} />
          <pointLight position={[-2, -1, 2]} intensity={0.4} color={resultColor} />
          <D20Mesh skin={skin} phase={phase} onSettled={handleSettled} />
        </Canvas>
      </View>

      <View style={[styles.card, showResult && { borderColor: resultColor }]}>
        <Text style={styles.rollLabel}>{roll.label.toUpperCase()}</Text>

        <View style={styles.numberRow}>
          <Text style={[styles.rollNumber, { color: showResult ? resultColor : colors.text.primary }]}>
            {showResult ? roll.total : '?'}
          </Text>
          {roll.dc != null && showResult && (
            <Text style={styles.dcText}>vs DC {roll.dc}</Text>
          )}
        </View>

        {showResult && (
          <Text style={styles.breakdown}>
            d20({roll.roll}) {roll.modifier >= 0 ? '+' : ''}{roll.modifier}
          </Text>
        )}

        {showResult && (
          <Text style={[styles.verdict, { color: resultColor }]}>
            {verdictText}
          </Text>
        )}

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
