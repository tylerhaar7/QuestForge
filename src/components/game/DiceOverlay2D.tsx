// 2D Dice Roll Overlay — Reanimated-based fallback for Expo Go / reduceMotion
// Shows animated dice roll with result card, haptics, and tap-to-skip

import React, { useEffect, useCallback, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors } from '@/theme/colors';
import { fonts, spacing } from '@/theme/typography';
import { useSettingsStore } from '@/stores/useSettingsStore';
import type { DiceRollResult } from '@/types/game';

interface DiceOverlay2DProps {
  roll: DiceRollResult;
  onComplete: () => void;
}

const TUMBLE_DURATION = 1800;
const RESULT_DISPLAY_DURATION = 1500;

export function DiceOverlay2D({ roll, onComplete }: DiceOverlay2DProps) {
  const [settled, setSettled] = useState(false);
  const hapticsEnabled = useSettingsStore((s) => s.accessibility.hapticFeedback);

  // Animation values
  const dieRotation = useSharedValue(0);
  const dieScale = useSharedValue(0.3);
  const dieOpacity = useSharedValue(0);
  const resultOpacity = useSharedValue(0);
  const resultTranslateY = useSharedValue(20);
  const overlayOpacity = useSharedValue(0);
  const numberScale = useSharedValue(0.5);

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

  useEffect(() => {
    // Fade in overlay
    overlayOpacity.value = withTiming(1, { duration: 200 });

    // Start die entrance + tumble
    dieOpacity.value = withTiming(1, { duration: 200 });
    dieScale.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.back(1.5)) });

    // Shake rotation back and forth
    dieRotation.value = withRepeat(
      withSequence(
        withTiming(-15, { duration: 80, easing: Easing.inOut(Easing.quad) }),
        withTiming(15, { duration: 80, easing: Easing.inOut(Easing.quad) }),
      ),
      -1, // infinite
      true,
    );

    // After tumble duration, settle
    const timer = setTimeout(() => {
      settle();
    }, TUMBLE_DURATION);

    return () => clearTimeout(timer);
  }, []);

  const settle = useCallback(() => {
    if (settled) return;
    setSettled(true);

    // Stop shaking — snap to 0
    dieRotation.value = withTiming(0, { duration: 200, easing: Easing.out(Easing.cubic) });

    // Bounce scale on land
    dieScale.value = withSequence(
      withTiming(1.3, { duration: 100 }),
      withTiming(0.9, { duration: 100 }),
      withTiming(1.05, { duration: 100 }),
      withTiming(1, { duration: 80 }),
    );

    // Reveal number
    numberScale.value = withSequence(
      withTiming(1.4, { duration: 150, easing: Easing.out(Easing.cubic) }),
      withTiming(1, { duration: 150 }),
    );

    // Show result card
    resultOpacity.value = withDelay(200, withTiming(1, { duration: 300 }));
    resultTranslateY.value = withDelay(200, withTiming(0, { duration: 300, easing: Easing.out(Easing.cubic) }));

    // Haptic feedback
    if (hapticsEnabled) {
      if (roll.isCritical) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } else if (roll.success) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }

    // No auto-advance — player taps to dismiss
  }, [settled, roll, hapticsEnabled]);

  const handleTap = useCallback(() => {
    if (!settled) {
      settle();
    } else {
      onComplete();
    }
  }, [settled, settle, onComplete]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const dieStyle = useAnimatedStyle(() => ({
    opacity: dieOpacity.value,
    transform: [
      { scale: dieScale.value },
      { rotate: `${dieRotation.value}deg` },
    ],
  }));

  const numberStyle = useAnimatedStyle(() => ({
    transform: [{ scale: numberScale.value }],
  }));

  const resultStyle = useAnimatedStyle(() => ({
    opacity: resultOpacity.value,
    transform: [{ translateY: resultTranslateY.value }],
  }));

  return (
    <Pressable style={StyleSheet.absoluteFill} onPress={handleTap}>
      <Animated.View style={[styles.overlay, overlayStyle]}>
        {/* Die face */}
        <Animated.View style={[styles.dieContainer, dieStyle]}>
          <View style={[styles.dieFace, settled && { borderColor: resultColor }]}>
            <Animated.View style={numberStyle}>
              <Text style={[styles.dieNumber, settled && { color: resultColor }]}>
                {settled ? roll.roll : '?'}
              </Text>
            </Animated.View>
          </View>
          <Text style={styles.dieLabel}>D20</Text>
        </Animated.View>

        {/* Result card */}
        <Animated.View style={[styles.resultCard, resultStyle, settled && { borderColor: resultColor }]}>
          <Text style={styles.rollLabel}>{roll.label.toUpperCase()}</Text>

          <View style={styles.numberRow}>
            <Text style={[styles.totalNumber, { color: resultColor }]}>
              {roll.total}
            </Text>
            {roll.dc != null && (
              <Text style={styles.dcText}>vs DC {roll.dc}</Text>
            )}
          </View>

          <Text style={styles.breakdown}>
            d20({roll.roll}) {roll.modifier >= 0 ? '+' : ''}{roll.modifier}
          </Text>

          <Text style={[styles.verdict, { color: resultColor }]}>
            {verdictText}
          </Text>
        </Animated.View>

        <Text style={styles.tapHint}>
          {settled ? 'Tap to continue' : 'Tap to skip'}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  dieContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  dieFace: {
    width: 120,
    height: 120,
    borderRadius: 16,
    backgroundColor: colors.bg.secondary,
    borderWidth: 2,
    borderColor: colors.gold.border,
    justifyContent: 'center',
    alignItems: 'center',
    // Diamond rotation to look like a die face
    transform: [{ rotate: '45deg' }],
  },
  dieNumber: {
    fontFamily: fonts.heading,
    fontSize: 48,
    color: colors.text.primary,
    // Counter-rotate so text is readable
    transform: [{ rotate: '-45deg' }],
  },
  dieLabel: {
    fontFamily: fonts.headingRegular,
    fontSize: 10,
    color: colors.text.tertiary,
    letterSpacing: 2,
    marginTop: spacing.sm,
  },
  resultCard: {
    backgroundColor: colors.bg.secondary,
    borderWidth: 1,
    borderColor: colors.gold.border,
    borderRadius: 12,
    padding: spacing.lg,
    alignItems: 'center',
    minWidth: 220,
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
  totalNumber: {
    fontFamily: fonts.heading,
    fontSize: 48,
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
    marginTop: spacing.xl,
  },
});
