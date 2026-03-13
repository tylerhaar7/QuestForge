import React, { useEffect } from 'react';
import {
  View, Text, Pressable, ScrollView, StyleSheet, SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors, PARCHMENT_TEXT } from '@/theme/colors';
import { fonts, spacing, textStyles } from '@/theme/typography';
import { FantasyPanel, FantasyButton } from '@/components/ui';
import { useCharacterCreationStore } from '@/stores/useCharacterCreationStore';
import { CLASS_SPELLS } from '@/data/spells';
import type { Spell } from '@/types/game';

function SpellCard({
  spell,
  selected,
  onPress,
}: {
  spell: Spell;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={{ opacity: selected ? 1 : 0.75 }}>
      <FantasyPanel variant="card">
        <View style={styles.spellHeader}>
          <Text style={[styles.spellName, selected && styles.spellNameSelected]}>
            {spell.name}
          </Text>
          {selected && <Text style={styles.selectedBadge}>SELECTED</Text>}
        </View>
        <View style={styles.spellMeta}>
          <Text style={styles.metaText}>{spell.school}</Text>
          <Text style={styles.metaDot}>{'\u00B7'}</Text>
          <Text style={styles.metaText}>{spell.castingTime}</Text>
          <Text style={styles.metaDot}>{'\u00B7'}</Text>
          <Text style={styles.metaText}>{spell.range}</Text>
        </View>
        <Text style={styles.spellDesc}>{spell.description}</Text>
        <Text style={styles.spellComponents}>{spell.components}</Text>
      </FantasyPanel>
    </Pressable>
  );
}

export default function SpellSelectionScreen() {
  const router = useRouter();
  const {
    className,
    selectedCantrips,
    selectedSpells,
    setSelectedCantrips,
    setSelectedSpells,
    setStep,
    isSpellcasterWithSpells,
    getRequiredSpellCount,
  } = useCharacterCreationStore();

  // Auto-advance if not a spellcaster
  useEffect(() => {
    if (!isSpellcasterWithSpells()) {
      router.replace('/create/summary');
    }
  }, []);

  if (!className) return null;
  const config = CLASS_SPELLS[className];
  if (!config) return null;

  const requiredSpellCount = getRequiredSpellCount();
  const cantripsDone = selectedCantrips.length === config.cantripCount;
  const spellsDone = selectedSpells.length === requiredSpellCount;
  const canContinue = cantripsDone && spellsDone;

  const toggleCantrip = (spell: Spell) => {
    const exists = selectedCantrips.some(s => s.name === spell.name);
    if (exists) {
      setSelectedCantrips(selectedCantrips.filter(s => s.name !== spell.name));
    } else if (selectedCantrips.length < config.cantripCount) {
      setSelectedCantrips([...selectedCantrips, spell]);
    }
  };

  const toggleSpell = (spell: Spell) => {
    const exists = selectedSpells.some(s => s.name === spell.name);
    if (exists) {
      setSelectedSpells(selectedSpells.filter(s => s.name !== spell.name));
    } else if (selectedSpells.length < requiredSpellCount) {
      setSelectedSpells([...selectedSpells, spell]);
    }
  };

  const fillRecommended = () => {
    // Fill cantrips
    const recCantrips = config.cantrips
      .filter(s => config.recommendedCantrips.includes(s.name))
      .slice(0, config.cantripCount);
    setSelectedCantrips(recCantrips);

    // Fill spells
    const recSpells = config.spells
      .filter(s => config.recommendedSpells.includes(s.name))
      .slice(0, requiredSpellCount);
    setSelectedSpells(recSpells);
  };

  const handleNext = () => {
    if (!canContinue) return;
    setStep(6);
    router.push('/create/summary');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.stepLabel}>STEP 6 OF 7</Text>
        <Text style={styles.title}>Choose Spells</Text>
        <Pressable onPress={fillRecommended} style={styles.recommendedBtn}>
          <Text style={styles.recommendedText}>RECOMMENDED</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {/* Cantrips section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>CANTRIPS</Text>
          <Text style={[
            styles.counter,
            cantripsDone && styles.counterDone,
          ]}>
            {selectedCantrips.length} / {config.cantripCount}
          </Text>
        </View>

        {config.cantrips.map((spell) => (
          <SpellCard
            key={spell.name}
            spell={spell}
            selected={selectedCantrips.some(s => s.name === spell.name)}
            onPress={() => toggleCantrip(spell)}
          />
        ))}

        {/* 1st-level spells section */}
        <View style={[styles.sectionHeader, { marginTop: spacing.lg }]}>
          <Text style={styles.sectionTitle}>1ST-LEVEL SPELLS</Text>
          <Text style={[
            styles.counter,
            spellsDone && styles.counterDone,
          ]}>
            {selectedSpells.length} / {requiredSpellCount}
          </Text>
        </View>

        {config.isPreparedCaster && (
          <Text style={styles.preparedNote}>
            As a prepared caster, you can change your spell selection during camp rests.
          </Text>
        )}

        {config.spells.map((spell) => (
          <SpellCard
            key={spell.name}
            spell={spell}
            selected={selectedSpells.some(s => s.name === spell.name)}
            onPress={() => toggleSpell(spell)}
          />
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <FantasyButton
          variant="primary"
          label="CONTINUE"
          onPress={handleNext}
          disabled={!canContinue}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },

  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  stepLabel: {
    ...textStyles.sectionLabel,
    color: colors.text.tertiary,
    marginBottom: spacing.xs,
  },
  title: {
    ...textStyles.screenTitle,
    color: colors.gold.primary,
    fontSize: 22,
  },
  recommendedBtn: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gold.border,
    borderRadius: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  recommendedText: {
    fontFamily: fonts.heading,
    fontSize: 10,
    color: colors.gold.primary,
    letterSpacing: 1.5,
  },

  list: { flex: 1 },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    fontFamily: fonts.heading,
    fontSize: 12,
    color: colors.text.tertiary,
    letterSpacing: 2,
  },
  counter: {
    fontFamily: fonts.heading,
    fontSize: 12,
    color: colors.text.tertiary,
    letterSpacing: 1,
  },
  counterDone: {
    color: colors.gold.primary,
  },

  preparedNote: {
    fontFamily: fonts.bodyItalic,
    fontSize: 12,
    color: colors.text.tertiary,
    marginBottom: spacing.sm,
    lineHeight: 18,
  },

  spellHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  spellName: {
    fontFamily: fonts.heading,
    fontSize: 14,
    color: PARCHMENT_TEXT.primary,
    letterSpacing: 0.3,
    flex: 1,
  },
  spellNameSelected: {
    color: PARCHMENT_TEXT.accent,
  },
  selectedBadge: {
    fontFamily: fonts.heading,
    fontSize: 8,
    color: colors.gold.primary,
    letterSpacing: 1.5,
    borderWidth: 1,
    borderColor: colors.gold.primary,
    borderRadius: 3,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },

  spellMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  metaText: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: PARCHMENT_TEXT.secondary,
  },
  metaDot: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: PARCHMENT_TEXT.label,
  },

  spellDesc: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: PARCHMENT_TEXT.secondary,
    lineHeight: 18,
    marginBottom: spacing.xs,
  },
  spellComponents: {
    fontFamily: fonts.headingRegular,
    fontSize: 10,
    color: PARCHMENT_TEXT.label,
    letterSpacing: 0.5,
  },

  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    paddingTop: spacing.sm,
  },
});
