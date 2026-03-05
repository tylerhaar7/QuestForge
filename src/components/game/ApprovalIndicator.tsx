// ApprovalIndicator — Floating companion approval popup
// "▲ Sera approves" or "▼ Korrin disapproves"
// Slides in, shows for ~2s, fades out

import React, { useEffect } from 'react';
import { Text, StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors } from '@/theme/colors';
import { fonts, spacing } from '@/theme/typography';
import type { ApprovalChange } from '@/types/game';

interface ApprovalIndicatorProps {
  change: ApprovalChange;
  onDismiss?: () => void;
}

export function ApprovalIndicator({ change, onDismiss }: ApprovalIndicatorProps) {
  const translateY = useSharedValue(30);
  const opacity = useSharedValue(0);
  const isPositive = change.delta > 0;

  useEffect(() => {
    Haptics.notificationAsync(
      isPositive
        ? Haptics.NotificationFeedbackType.Success
        : Haptics.NotificationFeedbackType.Warning
    );

    translateY.value = withTiming(0, { duration: 300 });
    opacity.value = withSequence(
      withTiming(1, { duration: 300 }),
      withDelay(1700, withTiming(0, { duration: 400 }))
    );

    // Auto-dismiss after animation
    const timer = setTimeout(() => {
      onDismiss?.();
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const color = isPositive ? colors.approval.friendly : colors.combat.red;
  const arrow = isPositive ? '\u25B2' : '\u25BC';
  const verb = isPositive ? 'approves' : 'disapproves';

  return (
    <Animated.View style={[styles.container, { borderColor: color + '40' }, animatedStyle]}>
      <Text style={[styles.arrow, { color }]}>{arrow}</Text>
      <Text style={styles.text}>
        <Text style={[styles.name, { color }]}>{change.companion}</Text>
        {' '}{verb}
      </Text>
    </Animated.View>
  );
}

/**
 * Stacked list of approval changes
 */
interface ApprovalStackProps {
  changes: ApprovalChange[];
  onAllDismissed?: () => void;
}

export function ApprovalStack({ changes, onAllDismissed }: ApprovalStackProps) {
  const [remaining, setRemaining] = React.useState(changes);

  useEffect(() => {
    setRemaining(changes);
  }, [changes]);

  const handleDismiss = (index: number) => {
    setRemaining(prev => {
      const next = prev.filter((_, i) => i !== index);
      if (next.length === 0) onAllDismissed?.();
      return next;
    });
  };

  return (
    <View style={styles.stack}>
      {remaining.map((change, i) => (
        <ApprovalIndicator
          key={`${change.companion}-${i}`}
          change={change}
          onDismiss={() => handleDismiss(i)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: spacing.xs,
    pointerEvents: 'none',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.tertiary,
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  arrow: {
    fontSize: 10,
    marginRight: spacing.xs,
  },
  text: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.text.secondary,
  },
  name: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
  },
});
