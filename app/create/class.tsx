import React from 'react';
import {
  View, Text, Pressable, ScrollView, StyleSheet, SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/theme/colors';
import { fonts, spacing, textStyles } from '@/theme/typography';
import { useCharacterCreationStore } from '@/stores/useCharacterCreationStore';
import { CLASS_LIST, type ClassData } from '@/data/classes';
import type { ClassName } from '@/types/game';

function ClassCard({ cls, selected, onPress }: { cls: ClassData; selected: boolean; onPress: () => void }) {
  const primaryText = cls.primaryAbility.slice(0, 3).toUpperCase();
  const savesText = cls.saveProficiencies
    .map(s => s.slice(0, 3).toUpperCase())
    .join(' / ');

  return (
    <Pressable
      style={[styles.card, selected && styles.cardSelected]}
      onPress={onPress}
    >
      <View style={styles.cardHeader}>
        <Text style={[styles.cardName, selected && styles.cardNameSelected]}>{cls.name}</Text>
        <View style={styles.hitDieBadge}>
          <Text style={styles.hitDieText}>d{cls.hitDie}</Text>
        </View>
      </View>
      <Text style={styles.cardDesc}>{cls.description}</Text>
      <View style={styles.cardMeta}>
        <Text style={styles.cardMetaText}>Primary: {primaryText}</Text>
        <Text style={styles.cardMetaDivider}> · </Text>
        <Text style={styles.cardMetaText}>Saves: {savesText}</Text>
        {cls.spellcaster && (
          <>
            <Text style={styles.cardMetaDivider}> · </Text>
            <Text style={styles.spellcasterTag}>Spellcaster</Text>
          </>
        )}
      </View>
      <View style={styles.traits}>
        {cls.features.map(f => (
          <Text key={f.name} style={styles.traitName}>{f.name}</Text>
        ))}
      </View>
    </Pressable>
  );
}

export default function ClassSelectionScreen() {
  const router = useRouter();
  const { className, setClass, setStep } = useCharacterCreationStore();

  const handleSelect = (classId: ClassName) => {
    setClass(classId);
  };

  const handleNext = () => {
    if (!className) return;
    setStep(2);
    router.push('/create/abilities');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.stepLabel}>STEP 2 OF 5</Text>
        <Text style={styles.title}>Choose Your Class</Text>
      </View>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {CLASS_LIST.map(c => (
          <ClassCard
            key={c.id}
            cls={c}
            selected={className === c.id}
            onPress={() => handleSelect(c.id)}
          />
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[styles.nextButton, !className && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={!className}
        >
          <Text style={styles.nextButtonText}>CONTINUE</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },
  header: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.md },
  stepLabel: { ...textStyles.sectionLabel, color: colors.text.tertiary, marginBottom: spacing.xs },
  title: { ...textStyles.screenTitle, color: colors.gold.primary, fontSize: 22 },
  list: { flex: 1 },
  listContent: { paddingHorizontal: spacing.xl, paddingBottom: spacing.lg, gap: spacing.md },
  card: {
    borderWidth: 1,
    borderColor: colors.gold.border,
    borderRadius: 10,
    padding: spacing.lg,
    backgroundColor: colors.bg.secondary,
  },
  cardSelected: {
    borderColor: colors.gold.primary,
    backgroundColor: colors.bg.tertiary,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  cardName: { ...textStyles.characterName, color: colors.text.primary, fontSize: 16 },
  cardNameSelected: { color: colors.gold.primary },
  hitDieBadge: {
    borderWidth: 1,
    borderColor: colors.gold.border,
    borderRadius: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  hitDieText: { fontFamily: fonts.heading, fontSize: 11, color: colors.gold.muted, letterSpacing: 1 },
  cardDesc: { fontFamily: fonts.body, fontSize: 13, color: colors.text.secondary, lineHeight: 19, marginBottom: spacing.sm },
  cardMeta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginBottom: spacing.sm },
  cardMetaText: { fontFamily: fonts.heading, fontSize: 11, color: colors.gold.muted, letterSpacing: 1 },
  cardMetaDivider: { fontFamily: fonts.body, fontSize: 11, color: colors.text.tertiary },
  spellcasterTag: { fontFamily: fonts.heading, fontSize: 10, color: colors.text.tertiary, letterSpacing: 0.5 },
  traits: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  traitName: {
    fontFamily: fonts.headingRegular,
    fontSize: 10,
    color: colors.text.tertiary,
    borderWidth: 1,
    borderColor: colors.gold.border,
    borderRadius: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    letterSpacing: 0.5,
  },
  footer: { paddingHorizontal: spacing.xl, paddingBottom: spacing.lg, paddingTop: spacing.sm },
  nextButton: {
    backgroundColor: colors.gold.primary,
    paddingVertical: spacing.md + 2,
    borderRadius: 8,
    alignItems: 'center',
  },
  nextButtonDisabled: { opacity: 0.3 },
  nextButtonText: { ...textStyles.buttonLabel, color: colors.bg.primary, fontSize: 14, fontFamily: fonts.heading },
});
