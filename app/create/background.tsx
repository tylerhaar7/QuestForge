import React, { useState } from 'react';
import {
  View, Text, Pressable, ScrollView, StyleSheet, SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { colors, PARCHMENT_TEXT } from '@/theme/colors';
import { fonts, spacing, textStyles } from '@/theme/typography';
import { FantasyPanel, FantasyButton, CreationHeader } from '@/components/ui';
import { useCharacterCreationStore } from '@/stores/useCharacterCreationStore';
import { BACKGROUND_LIST } from '@/data/backgrounds';
import type { BackgroundData } from '@/data/backgrounds';
import { FEATS } from '@/data/feats';
import type { FeatData } from '@/data/feats';
import { MoodParticles } from '@/components/game/MoodParticles';

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatSkillName(skill: string): string {
  return skill.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// ── Background Card ──────────────────────────────────────────────────────────

function BackgroundCard({
  background,
  selected,
  onPress,
}: {
  background: BackgroundData;
  selected: boolean;
  onPress: () => void;
}) {
  const [expandedPill, setExpandedPill] = useState<string | null>(null);

  const handlePillPress = (key: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedPill(prev => prev === key ? null : key);
  };

  return (
    <Pressable onPress={onPress} style={{ opacity: selected ? 1 : 0.85 }}>
      <FantasyPanel variant={selected ? 'card' : 'strip'}>
        <Text style={[styles.cardName, selected && styles.cardNameSelected]}>
          {background.name}
        </Text>
        <Text style={styles.cardDesc}>{background.description}</Text>

        {/* Skill proficiency pills + Feature pill */}
        <View style={styles.skills}>
          {background.skillProficiencies.map((skill) => (
            <Pressable
              key={skill}
              onPress={(e) => { e.stopPropagation(); handlePillPress(skill); }}
              style={[styles.pillBase, expandedPill === skill && styles.pillExpanded]}
            >
              <Text style={[styles.pillText, expandedPill === skill && styles.pillTextExpanded]}>
                {formatSkillName(skill)}
              </Text>
            </Pressable>
          ))}
          <Pressable
            onPress={(e) => { e.stopPropagation(); handlePillPress('feature'); }}
            style={[styles.pillBase, styles.featurePill, expandedPill === 'feature' && styles.pillExpanded]}
          >
            <Text style={[styles.pillText, expandedPill === 'feature' && styles.pillTextExpanded]}>
              {background.featureName}
            </Text>
          </Pressable>
        </View>

        {/* Expanded description */}
        {expandedPill === 'feature' && (
          <Text style={styles.pillDescription}>{background.featureDescription}</Text>
        )}
        {expandedPill && expandedPill !== 'feature' && (
          <Text style={styles.pillDescription}>
            Proficiency in {formatSkillName(expandedPill)} — added to your skill list.
          </Text>
        )}

        {/* Tool proficiencies */}
        {background.toolProficiencies.length > 0 && (
          <Text style={styles.detailText}>
            Tools: {background.toolProficiencies.join(', ')}
          </Text>
        )}

        {/* Languages */}
        {background.languages > 0 && (
          <Text style={styles.detailText}>
            Languages: {background.languages}
          </Text>
        )}
      </FantasyPanel>
    </Pressable>
  );
}

// ── Feat Card ────────────────────────────────────────────────────────────────

function FeatCard({
  feat,
  selected,
  onPress,
}: {
  feat: FeatData;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={{ opacity: selected ? 1 : 0.85 }}>
      <FantasyPanel variant={selected ? 'card' : 'strip'}>
        <Text style={[styles.featName, selected && styles.featNameSelected]}>
          {feat.name}
        </Text>
        <Text style={styles.featDesc}>{feat.description}</Text>
        <Text style={styles.featMechanical}>{feat.mechanicalEffect}</Text>
      </FantasyPanel>
    </Pressable>
  );
}

// ── Screen ───────────────────────────────────────────────────────────────────

export default function BackgroundSelectionScreen() {
  const router = useRouter();
  const { backgroundId, selectedFeatId, setBackground, setFeat, setStep } =
    useCharacterCreationStore();

  const selectedBackground = backgroundId
    ? BACKGROUND_LIST.find((bg) => bg.id === backgroundId) ?? null
    : null;

  const availableFeats: FeatData[] = selectedBackground
    ? selectedBackground.availableFeats
        .map((featId) => FEATS[featId])
        .filter(Boolean)
    : [];

  const canContinue = backgroundId !== null && selectedFeatId !== null;

  const handleSelectBackground = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setBackground(id);
  };

  const handleSelectFeat = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFeat(id);
  };

  const handleNext = () => {
    if (!canContinue) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStep(4);
    router.push('/create/origin');
  };

  return (
    <SafeAreaView style={styles.container}>
      <MoodParticles />

      <CreationHeader step="STEP 4" title="Choose Your Background" />

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {BACKGROUND_LIST.map((bg) => (
          <BackgroundCard
            key={bg.id}
            background={bg}
            selected={backgroundId === bg.id}
            onPress={() => handleSelectBackground(bg.id)}
          />
        ))}

        {/* Feat selection — shown once a background is picked */}
        {selectedBackground && (
          <View style={styles.featSection}>
            <Text style={styles.featSectionLabel}>CHOOSE YOUR FEAT</Text>

            {availableFeats.map((feat) => (
              <FeatCard
                key={feat.id}
                feat={feat}
                selected={selectedFeatId === feat.id}
                onPress={() => handleSelectFeat(feat.id)}
              />
            ))}
          </View>
        )}
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

// ── Styles ───────────────────────────────────────────────────────────────────

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

  list: { flex: 1 },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },

  // ── Background cards ───────────────────────────────────
  cardName: {
    ...textStyles.characterName,
    color: PARCHMENT_TEXT.primary,
    fontSize: 16,
    marginBottom: spacing.xs,
  },
  cardNameSelected: { color: PARCHMENT_TEXT.accent },

  cardDesc: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: PARCHMENT_TEXT.secondary,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },

  skills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  pillBase: {
    borderWidth: 1,
    borderColor: '#b8a070',
    borderRadius: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  pillExpanded: {
    borderColor: PARCHMENT_TEXT.accent,
    backgroundColor: 'rgba(180,140,60,0.12)',
  },
  pillText: {
    fontFamily: fonts.headingRegular,
    fontSize: 10,
    color: PARCHMENT_TEXT.label,
    letterSpacing: 0.5,
  },
  pillTextExpanded: {
    color: PARCHMENT_TEXT.accent,
  },
  featurePill: {
    borderStyle: 'dashed' as any,
  },
  pillDescription: {
    fontFamily: fonts.bodyItalic,
    fontSize: 11,
    color: PARCHMENT_TEXT.secondary,
    fontStyle: 'italic',
    lineHeight: 16,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },

  detailText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: PARCHMENT_TEXT.secondary,
    lineHeight: 18,
    marginBottom: spacing.xs,
  },

  // ── Feat section ───────────────────────────────────────
  featSection: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  featSectionLabel: {
    ...textStyles.sectionLabel,
    color: colors.gold.primary,
    marginBottom: spacing.xs,
  },

  featName: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: PARCHMENT_TEXT.primary,
    marginBottom: spacing.xs,
  },
  featNameSelected: { color: PARCHMENT_TEXT.accent },

  featDesc: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: PARCHMENT_TEXT.secondary,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },

  featMechanical: {
    fontFamily: fonts.bodyItalic,
    fontSize: 12,
    color: '#8b6914',
    lineHeight: 18,
  },

  // ── Footer ─────────────────────────────────────────────
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    paddingTop: spacing.sm,
  },
});
