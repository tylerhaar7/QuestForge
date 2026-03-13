import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors } from '@/theme/colors';
import { fonts, spacing, textStyles } from '@/theme/typography';
import type { EnemyIntention } from '@/types/game';

interface EnemyIntentionsProps {
  intentions: EnemyIntention[];
}

function IntentionRow({ intention, index }: { intention: EnemyIntention; index: number }) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    const delay = index * 200;
    const timeout = setTimeout(() => {
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
          withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      );
    }, delay);
    return () => clearTimeout(timeout);
  }, [index, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.row, animatedStyle]}>
      <View style={styles.rowContent}>
        {/* Enemy description */}
        <Text style={styles.enemyText} numberOfLines={1}>
          {intention.description}
        </Text>

        {/* Arrow */}
        <Text style={styles.arrow}>→</Text>

        {/* Target + action */}
        <View style={styles.actionBlock}>
          <Text style={styles.targetText} numberOfLines={1}>
            <Text style={styles.targetName}>{intention.target}</Text>
            <Text style={styles.actionSeparator}>: </Text>
            <Text style={styles.actionName}>{intention.action}</Text>
          </Text>

          {/* Predicted damage */}
          <Text style={styles.damageText}>{intention.predictedDamage}</Text>
        </View>
      </View>

      {/* Special badge */}
      {intention.special ? (
        <View style={styles.specialBadge}>
          <Text style={styles.specialText}>{intention.special}</Text>
        </View>
      ) : null}
    </Animated.View>
  );
}

export function EnemyIntentions({ intentions }: EnemyIntentionsProps) {
  if (!intentions || intentions.length === 0) return null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerAccent} />
        <Text style={styles.headerText}>Enemy Intentions</Text>
        <View style={styles.headerAccent} />
      </View>

      {/* Rows */}
      <View style={styles.rowsContainer}>
        {intentions.map((intention, index) => (
          <IntentionRow
            key={`${intention.description}-${index}`}
            intention={intention}
            index={index}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bg.tertiary,
    borderWidth: 1,
    borderColor: colors.combat.red,
    borderRadius: 6,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(220,50,50,0.10)',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  headerAccent: {
    flex: 1,
    height: 1,
    backgroundColor: colors.combat.red,
    opacity: 0.4,
  },
  headerText: {
    ...textStyles.sectionLabel,
    color: colors.gold.primary,
    fontSize: 10,
  },

  rowsContainer: {
    paddingVertical: spacing.xs,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },

  rowContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexWrap: 'nowrap',
  },

  enemyText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.text.secondary,
    flexShrink: 1,
    maxWidth: '35%',
  },

  arrow: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.combat.red,
    paddingHorizontal: 2,
  },

  actionBlock: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },

  targetText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.text.primary,
    flexShrink: 1,
  },
  targetName: {
    fontFamily: fonts.bodyBold,
    color: colors.text.primary,
  },
  actionSeparator: {
    color: colors.text.tertiary,
  },
  actionName: {
    color: colors.text.secondary,
    fontStyle: 'italic',
  },

  damageText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.combat.red,
    flexShrink: 0,
  },

  specialBadge: {
    backgroundColor: colors.gold.dim,
    borderWidth: 1,
    borderColor: colors.gold.muted,
    borderRadius: 3,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    flexShrink: 0,
  },
  specialText: {
    fontFamily: fonts.headingRegular,
    fontSize: 9,
    color: colors.gold.bright,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
