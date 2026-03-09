// AbilityCard — Combat ability display
// Color-coded by type: attack (red), spell (purple), reaction (orange), bonus (blue), heal (green)

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '@/theme/colors';
import { fonts, spacing } from '@/theme/typography';

// TODO(feature-flag): Feature-staged for combat UI. Not yet wired into game session. See docs/tech-debt.md.

type AbilityType = 'attack' | 'spell' | 'reaction' | 'bonus' | 'heal';

interface AbilityCardProps {
  name: string;
  type: AbilityType;
  description: string;
  range?: string;
  damage?: string;
  resourceCost?: { type: string; amount: number };
  isAvailable: boolean;
  onPress?: () => void;
}

export function AbilityCard({
  name,
  type,
  description,
  range,
  damage,
  resourceCost,
  isAvailable,
  onPress,
}: AbilityCardProps) {
  const typeColors = colors.ability[type] || colors.ability.attack;

  const handlePress = () => {
    if (!isAvailable || !onPress) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Pressable onPress={handlePress} disabled={!isAvailable}>
      <View style={[
        styles.card,
        {
          backgroundColor: isAvailable ? typeColors.bg : colors.bg.secondary,
          borderColor: isAvailable ? typeColors.border : colors.gold.border,
          opacity: isAvailable ? 1 : 0.4,
        },
      ]}>
        <View style={styles.header}>
          <Text style={[styles.name, { color: isAvailable ? typeColors.glow : colors.text.disabled }]}>
            {name}
          </Text>
          <Text style={styles.typeBadge}>{type.toUpperCase()}</Text>
        </View>

        <Text style={styles.description} numberOfLines={2}>
          {description}
        </Text>

        <View style={styles.footer}>
          {range && <Text style={styles.detail}>{range}</Text>}
          {damage && <Text style={styles.detail}>{damage}</Text>}
          {resourceCost && (
            <Text style={styles.cost}>
              {resourceCost.amount} {resourceCost.type.replace(/_/g, ' ')}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing.sm,
    marginRight: spacing.sm,
    width: 150,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  name: {
    fontFamily: fonts.heading,
    fontSize: 11,
    letterSpacing: 0.5,
    flex: 1,
  },
  typeBadge: {
    fontFamily: fonts.headingRegular,
    fontSize: 7,
    letterSpacing: 1,
    color: colors.text.tertiary,
  },
  description: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.text.secondary,
    lineHeight: 14,
    marginBottom: spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  detail: {
    fontFamily: fonts.body,
    fontSize: 9,
    color: colors.text.tertiary,
  },
  cost: {
    fontFamily: fonts.headingRegular,
    fontSize: 9,
    color: colors.gold.muted,
    textTransform: 'capitalize',
  },
});
