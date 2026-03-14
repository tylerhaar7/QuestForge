import React, { useState } from 'react';
import {
  View, Text, Pressable, ScrollView, StyleSheet, SafeAreaView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { colors, PARCHMENT_TEXT } from '@/theme/colors';
import { fonts, spacing, textStyles } from '@/theme/typography';
import { FantasyPanel, FantasyButton, CreationHeader } from '@/components/ui';
import { useCharacterCreationStore } from '@/stores/useCharacterCreationStore';
import { CLASS_LIST, type ClassData } from '@/data/classes';
import type { ClassName } from '@/types/game';

function ClassCard({ cls, selected, onPress }: { cls: ClassData; selected: boolean; onPress: () => void }) {
  const [expandedFeature, setExpandedFeature] = useState<string | null>(null);
  const primaryText = cls.primaryAbility.slice(0, 3).toUpperCase();
  const savesText = cls.saveProficiencies
    .map(s => s.slice(0, 3).toUpperCase())
    .join(' / ');

  const handleFeaturePress = (name: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedFeature(prev => prev === name ? null : name);
  };

  return (
    <Pressable onPress={onPress} style={{ opacity: selected ? 1 : 0.85 }}>
      <FantasyPanel variant="card">
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
            <Pressable
              key={f.name}
              onPress={(e) => { e.stopPropagation(); handleFeaturePress(f.name); }}
              style={[styles.traitPill, expandedFeature === f.name && styles.traitPillExpanded]}
            >
              <Text style={[styles.traitName, expandedFeature === f.name && styles.traitNameExpanded]}>
                {f.name}
              </Text>
            </Pressable>
          ))}
        </View>
        {expandedFeature && (
          <Text style={styles.featureDescription}>
            {cls.features.find(f => f.name === expandedFeature)?.description}
          </Text>
        )}
      </FantasyPanel>
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
      <CreationHeader step="STEP 2" title="Choose Your Class" />

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
        <FantasyButton variant="primary" label="CONTINUE" onPress={handleNext} disabled={!className} />
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
  hitDieBadge: {
    borderWidth: 1,
    borderColor: '#b8a070',
    borderRadius: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  hitDieText: { fontFamily: fonts.heading, fontSize: 11, color: PARCHMENT_TEXT.label, letterSpacing: 1 },
  cardDesc: { fontFamily: fonts.body, fontSize: 13, color: PARCHMENT_TEXT.secondary, lineHeight: 19, marginBottom: spacing.sm },
  cardMeta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginBottom: spacing.sm },
  cardMetaText: { fontFamily: fonts.heading, fontSize: 11, color: PARCHMENT_TEXT.accent, letterSpacing: 1 },
  cardMetaDivider: { fontFamily: fonts.body, fontSize: 11, color: PARCHMENT_TEXT.secondary },
  spellcasterTag: { fontFamily: fonts.heading, fontSize: 10, color: PARCHMENT_TEXT.secondary, letterSpacing: 0.5 },
  traits: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  traitPill: {
    borderWidth: 1,
    borderColor: '#b8a070',
    borderRadius: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  traitPillExpanded: {
    borderColor: PARCHMENT_TEXT.accent,
    backgroundColor: 'rgba(180,140,60,0.12)',
  },
  traitName: {
    fontFamily: fonts.headingRegular,
    fontSize: 10,
    color: PARCHMENT_TEXT.label,
    letterSpacing: 0.5,
  },
  traitNameExpanded: {
    color: PARCHMENT_TEXT.accent,
  },
  featureDescription: {
    fontFamily: fonts.bodyItalic,
    fontSize: 11,
    color: PARCHMENT_TEXT.secondary,
    fontStyle: 'italic',
    lineHeight: 16,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  footer: { paddingHorizontal: spacing.xl, paddingBottom: spacing.lg, paddingTop: spacing.sm },
});
