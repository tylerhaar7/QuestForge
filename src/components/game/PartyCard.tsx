// PartyCard — Character/companion card with HP bar and status
// Shows portrait, name, HP, AC, conditions, relationship stage

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors } from '@/theme/colors';
import { fonts, textStyles, spacing } from '@/theme/typography';
import { useAccessibility } from '@/providers/AccessibilityProvider';
import { getColorblindColor } from '@/theme/accessibility';
import { HpBar } from './HpBar';
import { PortraitFrame } from '@/components/ui';
import { formatSnakeCase } from '@/utils/formatting';
import type { Condition, RelationshipStage, ClassName } from '@/types/game';

interface PartyCardProps {
  name: string;
  className: ClassName;
  level: number;
  currentHp: number;
  maxHp: number;
  ac: number;
  conditions: Condition[];
  isCompanion?: boolean;
  approvalScore?: number;
  relationshipStage?: RelationshipStage;
  onPress?: () => void;
}

const STAGE_LABELS: Record<RelationshipStage, string> = {
  hostile: 'Hostile',
  cold: 'Cold',
  neutral: 'Neutral',
  friendly: 'Friendly',
  trusted: 'Trusted',
  bonded: 'Bonded',
  devoted: 'Devoted',
};

export function PartyCard({
  name,
  className,
  level,
  currentHp,
  maxHp,
  ac,
  conditions,
  isCompanion,
  approvalScore,
  relationshipStage,
  onPress,
}: PartyCardProps) {
  const { font: getFont, fontSize: scaleFontSize, settings } = useAccessibility();
  const classColor = colors.class[className] || colors.gold.muted;

  const accessibilityLabel = `${name}, ${formatSnakeCase(className)} Level ${level}, HP ${currentHp}/${maxHp}, AC ${ac}${
    conditions.length > 0 ? `, ${conditions.map(formatCondition).join(', ')}` : ''
  }${relationshipStage ? `, ${STAGE_LABELS[relationshipStage]}` : ''}`;

  return (
    <Pressable onPress={onPress} style={[styles.card, { borderColor: classColor }]} accessibilityLabel={accessibilityLabel}>
      {/* Portrait placeholder */}
      <PortraitFrame size="sm" variant="ornate">
        <Text style={styles.portraitInitial}>{name.charAt(0).toUpperCase()}</Text>
      </PortraitFrame>

      {/* Info */}
      <View style={styles.info}>
        <View style={styles.headerRow}>
          <Text style={[styles.name, { fontFamily: getFont('heading'), fontSize: scaleFontSize(12) }]} numberOfLines={1}>{name}</Text>
          <View style={styles.acBadge}>
            <Text style={[styles.acText, { fontFamily: getFont('heading'), fontSize: scaleFontSize(10) }]}>{ac}</Text>
          </View>
        </View>

        <Text style={[styles.classLabel, { fontFamily: getFont('body'), fontSize: scaleFontSize(10) }]}>
          Lv{level} {formatSnakeCase(className)}
        </Text>

        <HpBar current={currentHp} max={maxHp} showLabel={false} />

        {/* Conditions */}
        {conditions.length > 0 && (
          <View style={styles.conditionRow}>
            {conditions.map(c => (
              <View key={c} style={[styles.conditionBadge, { backgroundColor: getColorblindColor('red', settings.colorblindMode) + '20' }]}>
                <Text style={[styles.conditionText, { fontFamily: getFont('body'), fontSize: scaleFontSize(8), color: getColorblindColor('red', settings.colorblindMode) }]}>{formatCondition(c)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Companion approval */}
        {isCompanion && relationshipStage && (
          <Text style={[
            styles.stageLabel,
            { color: colors.approval[relationshipStage] || colors.text.tertiary, fontFamily: getFont('headingRegular'), fontSize: scaleFontSize(9) },
          ]}>
            {STAGE_LABELS[relationshipStage]}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

function formatCondition(c: string): string {
  return c.replace(/_\d+$/, '').replace(/_/g, ' ');
}

const styles = StyleSheet.create({
  card: {
    width: 140,
    backgroundColor: colors.bg.tertiary,
    borderRadius: 10,
    borderWidth: 1,
    padding: spacing.sm,
    marginRight: spacing.sm,
  },
  portraitInitial: {
    fontFamily: fonts.heading,
    fontSize: 14,
    color: '#e8dcc8',
  },
  info: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  name: {
    ...textStyles.characterName,
    color: colors.text.primary,
    flex: 1,
    fontSize: 12,
  },
  acBadge: {
    backgroundColor: colors.bg.secondary,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.gold.border,
  },
  acText: {
    fontFamily: fonts.heading,
    fontSize: 10,
    color: colors.gold.primary,
  },
  classLabel: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.text.tertiary,
    marginBottom: spacing.xs,
  },
  conditionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.xs,
    gap: 2,
  },
  conditionBadge: {
    backgroundColor: colors.combat.redBorder,
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  conditionText: {
    fontSize: 8,
    color: colors.combat.red,
    fontFamily: fonts.body,
    textTransform: 'capitalize',
  },
  stageLabel: {
    fontFamily: fonts.headingRegular,
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: spacing.xs,
  },
});
