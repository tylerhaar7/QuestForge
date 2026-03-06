// ChoiceButton — Interactive choice with skill check display
// Format: "Choice text [Persuasion — 65%]"

import React from 'react';
import { Text, StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '@/theme/colors';
import { textStyles, spacing, fonts } from '@/theme/typography';
import { useAccessibility } from '@/providers/AccessibilityProvider';
import type { Choice } from '@/types/game';

interface ChoiceButtonProps {
  choice: Choice;
  onPress: (choice: Choice) => void;
  disabled?: boolean;
}

export function ChoiceButton({ choice, onPress, disabled }: ChoiceButtonProps) {
  const { font: getFont, fontSize: scaleFontSize } = useAccessibility();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    if (disabled) return;
    scale.value = withSequence(
      withTiming(0.96, { duration: 80 }),
      withTiming(1, { duration: 120 })
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress(choice);
  };

  const hasSkillCheck = !!choice.skillCheck;
  const borderColor = hasSkillCheck ? colors.gold.primary : colors.gold.dim;

  return (
    <Pressable onPress={handlePress} disabled={disabled} accessibilityRole="button" accessibilityLabel={choice.text}>
      <Animated.View
        style={[
          styles.container,
          { borderColor, opacity: disabled ? 0.4 : 1 },
          animatedStyle,
        ]}
      >
        <View style={styles.row}>
          {choice.icon ? <Text style={styles.icon}>{choice.icon}</Text> : null}
          <Text style={[styles.text, hasSkillCheck && styles.textGold, { fontFamily: getFont('body'), fontSize: scaleFontSize(15) }]}>
            {choice.text}
          </Text>
        </View>

        {hasSkillCheck && choice.skillCheck && (
          <View style={styles.skillCheckRow}>
            <Text style={styles.skillLabel}>
              {formatSkillName(choice.skillCheck.skill)}
            </Text>
            <Text style={[
              styles.chance,
              { color: getChanceColor(choice.skillCheck.successChance) },
            ]}>
              {choice.skillCheck.successChance}%
            </Text>
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

function formatSkillName(skill: string): string {
  return skill
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

function getChanceColor(chance: number): string {
  if (chance >= 75) return colors.approval.friendly;
  if (chance >= 50) return colors.gold.primary;
  if (chance >= 25) return colors.approval.cold;
  return colors.combat.red;
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: colors.bg.tertiary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  text: {
    ...textStyles.choiceText,
    color: colors.text.primary,
    flex: 1,
  },
  textGold: {
    color: colors.gold.bright,
  },
  skillCheckRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.gold.border,
  },
  skillLabel: {
    ...textStyles.skillCheckLabel,
    color: colors.text.tertiary,
  },
  chance: {
    fontFamily: fonts.heading,
    fontSize: 12,
    letterSpacing: 1,
  },
});
