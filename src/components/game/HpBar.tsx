// HpBar — Animated health bar with color transitions
// Green >50%, yellow 20-50%, red <20%

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { colors } from '@/theme/colors';
import { fonts, spacing } from '@/theme/typography';

interface HpBarProps {
  current: number;
  max: number;
  label?: string;
  showLabel?: boolean;
}

function getHpColor(ratio: number): string {
  if (ratio > 0.5) return '#4a8c3c';   // Green — healthy
  if (ratio > 0.2) return '#b48c3c';   // Gold/yellow — wounded
  return colors.combat.red;             // Red — critical
}

export function HpBar({ current, max, label, showLabel = true }: HpBarProps) {
  const ratio = max > 0 ? Math.max(0, Math.min(1, current / max)) : 0;
  const widthAnim = useSharedValue(ratio);
  const flashOpacity = useSharedValue(0);
  const prevCurrent = useSharedValue(current);

  useEffect(() => {
    const delta = current - prevCurrent.value;
    prevCurrent.value = current;

    // Animate width
    widthAnim.value = withTiming(ratio, { duration: 400, easing: Easing.out(Easing.cubic) });

    // Flash on change
    if (delta !== 0) {
      flashOpacity.value = withSequence(
        withTiming(0.6, { duration: 100 }),
        withTiming(0, { duration: 400 })
      );
    }
  }, [current, max]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${widthAnim.value * 100}%`,
    backgroundColor: getHpColor(widthAnim.value),
  }));

  const flashStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
    backgroundColor: current < prevCurrent.value
      ? colors.combat.damageFlash
      : colors.combat.healFlash,
  }));

  return (
    <View style={styles.container}>
      {label && showLabel && (
        <Text style={styles.label}>{label}</Text>
      )}
      <View style={styles.track}>
        <Animated.View style={[styles.fill, barStyle]} />
        <Animated.View style={[styles.flash, flashStyle]} />
        <Text style={styles.hpText}>
          {current}/{max}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    fontFamily: fonts.headingRegular,
    fontSize: 9,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.text.tertiary,
    marginBottom: 2,
  },
  track: {
    height: 18,
    borderRadius: 4,
    backgroundColor: colors.bg.secondary,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 4,
  },
  flash: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 4,
  },
  hpText: {
    fontFamily: fonts.heading,
    fontSize: 10,
    color: colors.text.primary,
    textAlign: 'center',
    letterSpacing: 1,
  },
});
