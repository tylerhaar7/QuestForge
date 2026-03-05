import React from 'react';
import {
  View, Text, Pressable, ScrollView, StyleSheet, SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/theme/colors';
import { fonts, spacing, textStyles } from '@/theme/typography';
import { useCharacterCreationStore } from '@/stores/useCharacterCreationStore';
import { RACE_LIST, type RaceData } from '@/data/races';
import type { RaceName } from '@/types/game';

function RaceCard({ race, selected, onPress }: { race: RaceData; selected: boolean; onPress: () => void }) {
  const bonusText = Object.entries(race.abilityBonuses)
    .map(([ability, bonus]) => `${ability.slice(0, 3).toUpperCase()} +${bonus}`)
    .join('  ');

  return (
    <Pressable
      style={[styles.card, selected && styles.cardSelected]}
      onPress={onPress}
    >
      <View style={styles.cardHeader}>
        <Text style={[styles.cardName, selected && styles.cardNameSelected]}>{race.name}</Text>
        <Text style={styles.cardSpeed}>{race.speed}ft</Text>
      </View>
      <Text style={styles.cardDesc}>{race.description}</Text>
      {bonusText ? <Text style={styles.cardBonuses}>{bonusText}</Text> : null}
      <View style={styles.traits}>
        {race.traits.map(t => (
          <Text key={t.name} style={styles.traitName}>{t.name}</Text>
        ))}
      </View>
    </Pressable>
  );
}

export default function RaceSelectionScreen() {
  const router = useRouter();
  const { race, setRace, setStep } = useCharacterCreationStore();

  const handleSelect = (raceId: RaceName) => {
    setRace(raceId);
  };

  const handleNext = () => {
    if (!race) return;
    setStep(1);
    router.push('/create/class');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.stepLabel}>STEP 1 OF 5</Text>
        <Text style={styles.title}>Choose Your Race</Text>
      </View>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {RACE_LIST.map(r => (
          <RaceCard
            key={r.id}
            race={r}
            selected={race === r.id}
            onPress={() => handleSelect(r.id)}
          />
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[styles.nextButton, !race && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={!race}
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
  cardSpeed: { fontFamily: fonts.headingRegular, fontSize: 11, color: colors.text.tertiary, letterSpacing: 1 },
  cardDesc: { fontFamily: fonts.body, fontSize: 13, color: colors.text.secondary, lineHeight: 19, marginBottom: spacing.sm },
  cardBonuses: { fontFamily: fonts.heading, fontSize: 11, color: colors.gold.muted, letterSpacing: 1, marginBottom: spacing.sm },
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
