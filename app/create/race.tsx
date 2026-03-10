import React from 'react';
import {
  View, Text, Pressable, ScrollView, StyleSheet, SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors, PARCHMENT_TEXT } from '@/theme/colors';
import { fonts, spacing, textStyles } from '@/theme/typography';
import { FantasyPanel, FantasyButton } from '@/components/ui';
import { useCharacterCreationStore } from '@/stores/useCharacterCreationStore';
import { RACE_LIST, type RaceData } from '@/data/races';
import type { RaceName } from '@/types/game';

function RaceCard({ race, selected, onPress }: { race: RaceData; selected: boolean; onPress: () => void }) {
  const bonusText = Object.entries(race.abilityBonuses)
    .map(([ability, bonus]) => `${ability.slice(0, 3).toUpperCase()} +${bonus}`)
    .join('  ');

  return (
    <Pressable onPress={onPress} style={{ opacity: selected ? 1 : 0.85 }}>
      <FantasyPanel variant="card">
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
      </FantasyPanel>
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
        <FantasyButton variant="primary" label="CONTINUE" onPress={handleNext} disabled={!race} />
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
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  cardName: { ...textStyles.characterName, color: PARCHMENT_TEXT.primary, fontSize: 16 },
  cardNameSelected: { color: PARCHMENT_TEXT.accent },
  cardSpeed: { fontFamily: fonts.headingRegular, fontSize: 11, color: PARCHMENT_TEXT.secondary, letterSpacing: 1 },
  cardDesc: { fontFamily: fonts.body, fontSize: 13, color: PARCHMENT_TEXT.secondary, lineHeight: 19, marginBottom: spacing.sm },
  cardBonuses: { fontFamily: fonts.heading, fontSize: 11, color: PARCHMENT_TEXT.accent, letterSpacing: 1, marginBottom: spacing.sm },
  traits: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  traitName: {
    fontFamily: fonts.headingRegular,
    fontSize: 10,
    color: PARCHMENT_TEXT.label,
    borderWidth: 1,
    borderColor: '#b8a070',
    borderRadius: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    letterSpacing: 0.5,
  },
  footer: { paddingHorizontal: spacing.xl, paddingBottom: spacing.lg, paddingTop: spacing.sm },
});
