import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  runOnJS,
  Easing,
} from 'react-native-reanimated';

import { colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';
import { COMBAT } from '@/constants/animations';
import { DamageNumber } from './DamageNumber';
import type { CombatAnimationStep } from '@/types/game';

interface CombatAnimationQueueProps {
  steps: CombatAnimationStep[];
  onComplete: () => void;
  /** Callback when a shake step plays — parent handles actual shake */
  onShake?: (intensity: 'light' | 'heavy') => void;
}

// ─── Text Flash ─────────────────────────────────────────

const FADE_IN_MS = 150;
const FADE_OUT_MS = 150;
const DEFAULT_HOLD_MS = 600;

function TextFlash({
  text,
  duration = DEFAULT_HOLD_MS,
  onComplete,
}: {
  text: string;
  duration?: number;
  onComplete: () => void;
}) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Fade in -> hold -> fade out
    opacity.value = withSequence(
      withTiming(1, { duration: FADE_IN_MS, easing: Easing.out(Easing.quad) }),
      withDelay(
        duration,
        withTiming(0, { duration: FADE_OUT_MS, easing: Easing.in(Easing.quad) }, (finished) => {
          if (finished) {
            runOnJS(onComplete)();
          }
        }),
      ),
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.textFlashContainer, animatedStyle]}>
      <Text style={styles.textFlashLabel}>{text}</Text>
    </Animated.View>
  );
}

// ─── Queue ──────────────────────────────────────────────

export function CombatAnimationQueue({
  steps,
  onComplete,
  onShake,
}: CombatAnimationQueueProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const advance = useCallback(() => {
    setCurrentIndex((prev) => prev + 1);
  }, []);

  // Handle completion and immediate-advance steps (shake, pause, empty queue)
  useEffect(() => {
    if (steps.length === 0) {
      onComplete();
      return;
    }

    if (currentIndex >= steps.length) {
      onComplete();
      return;
    }

    const step = steps[currentIndex];

    if (step.type === 'shake') {
      onShake?.(step.intensity);
      advance();
      return;
    }

    if (step.type === 'pause') {
      const timer = setTimeout(advance, step.duration);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, steps, onComplete, onShake, advance]);

  // Nothing to render
  if (steps.length === 0 || currentIndex >= steps.length) {
    return null;
  }

  const step = steps[currentIndex];

  // Shake and pause render nothing (handled by useEffect above)
  if (step.type === 'shake' || step.type === 'pause') {
    return null;
  }

  return (
    <Animated.View style={styles.overlay} pointerEvents="none">
      {step.type === 'text_flash' && (
        <TextFlash
          key={currentIndex}
          text={step.text}
          duration={step.duration}
          onComplete={advance}
        />
      )}

      {step.type === 'damage' && (
        <DamageNumber
          key={currentIndex}
          value={step.value}
          type={step.damageType}
          onComplete={advance}
        />
      )}
    </Animated.View>
  );
}

// ─── Styles ─────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  textFlashContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textFlashLabel: {
    fontFamily: fonts.heading,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.gold.bright,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
});
