import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useDerivedValue,
  useAnimatedStyle,
  useAnimatedReaction,
  withTiming,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { colors } from '@/theme/colors';
import { fonts, spacing } from '@/theme/typography';
import { REWARDS } from '@/constants/animations';
import { useAccessibility } from '@/providers/AccessibilityProvider';

// ─── Types ──────────────────────────────────────────────

interface StatTickerProps {
  label: string;
  oldValue: number;
  newValue: number;
  delay?: number;
  prefix?: string;
  onComplete?: () => void;
}

// ─── Haptic helper (runs on JS thread) ──────────────────

function fireTickHaptic() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

// ─── StatTicker (vertical / hero layout) ────────────────

export function StatTicker({
  label,
  oldValue,
  newValue,
  delay = 0,
  prefix = '',
  onComplete,
}: StatTickerProps) {
  const { skipAnimations, hapticsEnabled } = useAccessibility();

  const displayed = useSharedValue(oldValue);
  const arrowOpacity = useSharedValue(1);
  const animationDone = useSharedValue(false);

  // Round to integer for display
  const displayedInt = useDerivedValue(() => Math.round(displayed.value));

  // Fire haptic on each integer change
  useAnimatedReaction(
    () => displayedInt.value,
    (current, previous) => {
      if (previous !== null && current !== previous && hapticsEnabled) {
        runOnJS(fireTickHaptic)();
      }
    },
  );

  useEffect(() => {
    if (skipAnimations || oldValue === newValue) {
      displayed.value = newValue;
      arrowOpacity.value = 0;
      animationDone.value = true;
      onComplete?.();
      return;
    }

    const duration = Math.abs(newValue - oldValue) * REWARDS.LEVEL_UP_STAT_TICK;

    displayed.value = withDelay(
      delay,
      withTiming(newValue, { duration }, (finished) => {
        if (finished) {
          animationDone.value = true;
          if (onComplete) {
            runOnJS(onComplete)();
          }
        }
      }),
    );

    // Fade out the old value and arrow after animation completes
    arrowOpacity.value = withDelay(delay + duration, withTiming(0, { duration: 300 }));
  }, [oldValue, newValue, delay, skipAnimations]);

  // Animated style for the old-value / arrow group
  const oldValueStyle = useAnimatedStyle(() => ({
    opacity: arrowOpacity.value * 0.5,
  }));

  return (
    <View style={styles.verticalContainer}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.valueRow}>
        <Animated.View style={[styles.oldValueGroup, oldValueStyle]}>
          <Text style={styles.oldValue}>{prefix}{oldValue}</Text>
          <Text style={styles.arrow}>{' \u2192 '}</Text>
        </Animated.View>

        <AnimatedIntegerText
          value={displayedInt}
          style={styles.heroValue}
          prefix={prefix}
        />
      </View>
    </View>
  );
}

// ─── StatTickerRow (horizontal / compact layout) ────────

export function StatTickerRow({
  label,
  oldValue,
  newValue,
  delay = 0,
  prefix = '',
  onComplete,
}: StatTickerProps) {
  const { skipAnimations, hapticsEnabled } = useAccessibility();

  const displayed = useSharedValue(oldValue);
  const arrowOpacity = useSharedValue(1);
  const animationDone = useSharedValue(false);

  const displayedInt = useDerivedValue(() => Math.round(displayed.value));

  useAnimatedReaction(
    () => displayedInt.value,
    (current, previous) => {
      if (previous !== null && current !== previous && hapticsEnabled) {
        runOnJS(fireTickHaptic)();
      }
    },
  );

  useEffect(() => {
    if (skipAnimations || oldValue === newValue) {
      displayed.value = newValue;
      arrowOpacity.value = 0;
      animationDone.value = true;
      onComplete?.();
      return;
    }

    const duration = Math.abs(newValue - oldValue) * REWARDS.LEVEL_UP_STAT_TICK;

    displayed.value = withDelay(
      delay,
      withTiming(newValue, { duration }, (finished) => {
        if (finished) {
          animationDone.value = true;
          if (onComplete) {
            runOnJS(onComplete)();
          }
        }
      }),
    );

    arrowOpacity.value = withDelay(delay + duration, withTiming(0, { duration: 300 }));
  }, [oldValue, newValue, delay, skipAnimations]);

  const oldValueStyle = useAnimatedStyle(() => ({
    opacity: arrowOpacity.value * 0.5,
  }));

  return (
    <View style={styles.rowContainer}>
      <Text style={styles.rowLabel}>{label}</Text>

      <View style={styles.rowRight}>
        <Animated.View style={[styles.rowOldGroup, oldValueStyle]}>
          <Text style={styles.rowOldValue}>{prefix}{oldValue}</Text>
          <Text style={styles.rowArrow}>{' \u2192 '}</Text>
        </Animated.View>

        <AnimatedIntegerText
          value={displayedInt}
          style={styles.rowValue}
          prefix={prefix}
        />
      </View>
    </View>
  );
}

// ─── Animated text helper ───────────────────────────────
// Renders a Reanimated-driven integer as text.
// We use useAnimatedReaction + setState because
// Animated.Text cannot directly consume shared values.

function AnimatedIntegerText({
  value,
  style,
  prefix,
}: {
  value: { value: number };
  style: object;
  prefix: string;
}) {
  const [display, setDisplay] = React.useState(value.value);

  useAnimatedReaction(
    () => value.value,
    (current) => {
      runOnJS(setDisplay)(current);
    },
    [value],
  );

  return (
    <Text style={style}>
      {prefix}{display}
    </Text>
  );
}

// ─── Styles ─────────────────────────────────────────────

const styles = StyleSheet.create({
  // Vertical (hero) layout
  verticalContainer: {
    alignItems: 'center',
  },
  label: {
    fontFamily: fonts.headingRegular,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.gold.muted,
    marginBottom: spacing.xs,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  oldValueGroup: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  oldValue: {
    fontFamily: fonts.heading,
    fontSize: 18,
    color: colors.text.tertiary,
  },
  arrow: {
    fontFamily: fonts.headingRegular,
    fontSize: 16,
    color: colors.text.tertiary,
  },
  heroValue: {
    fontFamily: fonts.heading,
    fontSize: 32,
    color: colors.gold.bright,
    textShadowColor: 'rgba(212, 168, 67, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },

  // Horizontal (row) layout
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  rowLabel: {
    fontFamily: fonts.headingRegular,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.gold.muted,
    flex: 1,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  rowOldGroup: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  rowOldValue: {
    fontFamily: fonts.heading,
    fontSize: 14,
    color: colors.text.tertiary,
  },
  rowArrow: {
    fontFamily: fonts.headingRegular,
    fontSize: 12,
    color: colors.text.tertiary,
  },
  rowValue: {
    fontFamily: fonts.heading,
    fontSize: 20,
    color: colors.gold.bright,
    textShadowColor: 'rgba(212, 168, 67, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
});
