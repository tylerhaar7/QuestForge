import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { colors } from '@/theme/colors';
import { fonts, spacing, textStyles } from '@/theme/typography';

interface CreationHeaderProps {
  step: string;       // e.g. "STEP 2" or "STEP 7 OF 8"
  title: string;      // e.g. "Choose Your Class"
  showBack?: boolean; // default true
}

export function CreationHeader({ step, title, showBack = true }: CreationHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  return (
    <View style={styles.header}>
      <View style={styles.topRow}>
        {showBack ? (
          <Pressable onPress={handleBack} style={styles.backButton} hitSlop={12}>
            <Text style={styles.backArrow}>{'\u2039'}</Text>
            <Text style={styles.backText}>Back</Text>
          </Pressable>
        ) : (
          <View style={styles.backPlaceholder} />
        )}
        <Text style={styles.stepLabel}>{step}</Text>
        <View style={styles.backPlaceholder} />
      </View>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  stepLabel: {
    ...textStyles.sectionLabel,
    color: colors.text.tertiary,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  backArrow: {
    fontFamily: fonts.heading,
    fontSize: 20,
    color: colors.gold.primary,
    lineHeight: 22,
  },
  backText: {
    fontFamily: fonts.headingRegular,
    fontSize: 12,
    color: colors.gold.primary,
    letterSpacing: 0.5,
  },
  backPlaceholder: {
    width: 50,
  },
  title: {
    ...textStyles.screenTitle,
    color: colors.gold.primary,
    fontSize: 22,
  },
});
