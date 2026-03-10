import React, { useState } from 'react';
import {
  View, Text, Pressable, ScrollView, StyleSheet, SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors, PARCHMENT_TEXT } from '@/theme/colors';
import { fonts, spacing, textStyles } from '@/theme/typography';
import { FantasyPanel, FantasyButton } from '@/components/ui';
import {
  useCharacterCreationStore,
  STANDARD_ARRAY,
} from '@/stores/useCharacterCreationStore';
import { RACES } from '@/data/races';
import { CLASSES } from '@/data/classes';
import { getModifier } from '@/engine/character';
import type { AbilityScore, ClassName, Skill } from '@/types/game';
import { SKILLS } from '@/data/skills';

// ─── Constants ────────────────────────────────────────────────────────────────

const ABILITY_KEYS: AbilityScore[] = [
  'strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma',
];

// Recommended standard array distributions per class (15, 14, 13, 12, 10, 8)
const RECOMMENDED_SCORES: Record<ClassName, Record<AbilityScore, number>> = {
  barbarian:  { strength: 15, constitution: 14, dexterity: 13, wisdom: 12, charisma: 10, intelligence: 8 },
  bard:       { charisma: 15, dexterity: 14, constitution: 13, wisdom: 12, intelligence: 10, strength: 8 },
  cleric:     { wisdom: 15, constitution: 14, strength: 13, charisma: 12, dexterity: 10, intelligence: 8 },
  druid:      { wisdom: 15, constitution: 14, dexterity: 13, intelligence: 12, charisma: 10, strength: 8 },
  fighter:    { strength: 15, constitution: 14, dexterity: 13, wisdom: 12, charisma: 10, intelligence: 8 },
  monk:       { dexterity: 15, wisdom: 14, constitution: 13, strength: 12, charisma: 10, intelligence: 8 },
  paladin:    { strength: 15, charisma: 14, constitution: 13, wisdom: 12, dexterity: 10, intelligence: 8 },
  ranger:     { dexterity: 15, wisdom: 14, constitution: 13, intelligence: 12, strength: 10, charisma: 8 },
  rogue:      { dexterity: 15, constitution: 14, charisma: 13, wisdom: 12, intelligence: 10, strength: 8 },
  sorcerer:   { charisma: 15, constitution: 14, dexterity: 13, wisdom: 12, intelligence: 10, strength: 8 },
  warlock:    { charisma: 15, constitution: 14, dexterity: 13, wisdom: 12, intelligence: 10, strength: 8 },
  wizard:     { intelligence: 15, constitution: 14, dexterity: 13, wisdom: 12, charisma: 10, strength: 8 },
  artificer:  { intelligence: 15, constitution: 14, dexterity: 13, wisdom: 12, charisma: 10, strength: 8 },
};

// Recommended skill picks per class (first N from this list, where N = skillChoices.pick)
const RECOMMENDED_SKILLS: Record<ClassName, Skill[]> = {
  barbarian:  ['athletics', 'perception'],
  bard:       ['persuasion', 'performance', 'deception'],
  cleric:     ['insight', 'medicine'],
  druid:      ['perception', 'nature'],
  fighter:    ['athletics', 'perception'],
  monk:       ['acrobatics', 'stealth'],
  paladin:    ['athletics', 'persuasion'],
  ranger:     ['perception', 'stealth', 'survival'],
  rogue:      ['stealth', 'perception', 'deception', 'acrobatics'],
  sorcerer:   ['persuasion', 'arcana'],
  warlock:    ['arcana', 'deception'],
  wizard:     ['arcana', 'investigation'],
  artificer:  ['arcana', 'investigation'],
};

const ABILITY_LABELS: Record<AbilityScore, string> = {
  strength: 'Strength',
  dexterity: 'Dexterity',
  constitution: 'Constitution',
  intelligence: 'Intelligence',
  wisdom: 'Wisdom',
  charisma: 'Charisma',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatSkillLabel(skill: Skill): string {
  return skill
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function formatModifier(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

/**
 * Map each position in STANDARD_ARRAY to whether it is still available.
 * Handles duplicate values correctly (e.g., two 10s: if one is used, one stays).
 */
function buildChipAvailability(available: number[]): boolean[] {
  const remaining = [...available];
  return STANDARD_ARRAY.map(score => {
    const idx = remaining.indexOf(score);
    if (idx !== -1) {
      remaining.splice(idx, 1);
      return true;
    }
    return false;
  });
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function AbilityScoreScreen() {
  const router = useRouter();

  const {
    race,
    className,
    abilityAssignment,
    setAbilityScore,
    clearAbilityScore,
    getAvailableScores,
    selectedSkills,
    setSelectedSkills,
    canProceedFromAbilities,
    setStep,
  } = useCharacterCreationStore();

  // The score value currently "held" by the player (selected from the chips row)
  const [selectedScore, setSelectedScore] = useState<number | null>(null);

  const raceData = race ? RACES[race] : null;
  const classData = className ? CLASSES[className] : null;
  const availableScores = getAvailableScores();
  const chipAvailability = buildChipAvailability(availableScores);
  const canProceed = canProceedFromAbilities();

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleScoreChipPress = (score: number) => {
    if (selectedScore === score) {
      setSelectedScore(null);
    } else {
      setSelectedScore(score);
    }
  };

  const handleAbilityRowPress = (ability: AbilityScore) => {
    const isAssigned = abilityAssignment[ability] !== undefined;

    if (isAssigned) {
      // Tapping an assigned row clears it and returns the score to the pool
      clearAbilityScore(ability);
    } else if (selectedScore !== null) {
      // Assign the held score to this ability
      setAbilityScore(ability, selectedScore);
      setSelectedScore(null);
    }
  };

  const handleSkillToggle = (skill: Skill) => {
    const isSelected = selectedSkills.includes(skill);
    const pickCount = classData?.skillChoices.pick ?? 0;

    if (isSelected) {
      setSelectedSkills(selectedSkills.filter(s => s !== skill));
    } else if (selectedSkills.length < pickCount) {
      setSelectedSkills([...selectedSkills, skill]);
    }
    // At cap and skill not selected — ignore tap
  };

  const handleRecommended = () => {
    if (!className) return;
    const recommended = RECOMMENDED_SCORES[className];
    for (const ability of ABILITY_KEYS) {
      setAbilityScore(ability, recommended[ability]);
    }
  };

  const handleRecommendedSkills = () => {
    if (!className || !classData) return;
    const recommended = RECOMMENDED_SKILLS[className];
    const validSkills = recommended
      .filter(s => classData.skillChoices.from.includes(s))
      .slice(0, classData.skillChoices.pick);
    setSelectedSkills(validSkills);
  };

  const handleContinue = () => {
    if (!canProceed) return;
    setStep(3);
    router.push('/create/origin');
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.stepLabel}>STEP 3 OF 5</Text>
        <Text style={styles.title}>Assign Ability Scores</Text>
        <Text style={styles.subtext}>
          Distribute the standard array values across your six abilities.
          Race bonuses are applied automatically.
        </Text>
        {className && (
          <Pressable style={styles.recommendedButton} onPress={handleRecommended}>
            <Text style={styles.recommendedButtonText}>
              RECOMMENDED FOR {CLASSES[className].name.toUpperCase()}
            </Text>
          </Pressable>
        )}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>

        {/* ── Available scores row ── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionLabel}>Available Scores</Text>
          {selectedScore !== null && (
            <Text style={styles.selectedHint}>
              Tap an ability to assign {selectedScore}
            </Text>
          )}
        </View>
        <View style={styles.scoresRow}>
          {STANDARD_ARRAY.map((score, idx) => {
            const isAvailable = chipAvailability[idx];
            const isSelected = isAvailable && selectedScore === score;

            if (!isAvailable) {
              return (
                <View key={idx} style={[styles.scoreChip, styles.scoreChipUsed]}>
                  <Text style={styles.scoreChipTextUsed}>{score}</Text>
                </View>
              );
            }

            return (
              <Pressable
                key={idx}
                style={[styles.scoreChip, isSelected && styles.scoreChipSelected]}
                onPress={() => handleScoreChipPress(score)}
              >
                <Text style={[styles.scoreChipText, isSelected && styles.scoreChipTextSelected]}>
                  {score}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* ── Ability rows ── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionLabel}>Ability Scores</Text>
        </View>
        <View style={styles.abilitiesContainer}>
          {ABILITY_KEYS.map(ability => {
            const baseScore = abilityAssignment[ability];
            const isAssigned = baseScore !== undefined;
            const raceBonus = raceData?.abilityBonuses[ability] ?? 0;
            const finalScore = isAssigned ? (baseScore + raceBonus) : null;
            const modifier = finalScore !== null ? getModifier(finalScore) : null;

            // Row is interactive if it's already assigned (clear) or a score is held (assign)
            const isTappable = isAssigned || selectedScore !== null;

            return (
              <Pressable
                key={ability}
                style={[
                  styles.abilityRow,
                  isAssigned && styles.abilityRowAssigned,
                  !isTappable && styles.abilityRowInactive,
                ]}
                onPress={() => handleAbilityRowPress(ability)}
                disabled={!isTappable}
              >
                {/* Left: ability name */}
                <Text style={styles.abilityName}>
                  {ABILITY_LABELS[ability].toUpperCase()}
                </Text>

                {/* Right: base | bonus | = | total | modifier */}
                <View style={styles.abilityRight}>
                  <View style={styles.abilityScoreBox}>
                    <Text style={[
                      styles.abilityBaseScore,
                      isAssigned ? styles.abilityBaseScoreSet : styles.abilityBaseScoreEmpty,
                    ]}>
                      {isAssigned ? String(baseScore) : '—'}
                    </Text>
                  </View>

                  {raceBonus > 0 ? (
                    <Text style={styles.abilityRaceBonus}>+{raceBonus}</Text>
                  ) : (
                    <View style={styles.abilityRaceBonusPlaceholder} />
                  )}

                  <Text style={styles.abilityEquals}>=</Text>

                  <Text style={[
                    styles.abilityTotal,
                    finalScore === null && styles.abilityTotalEmpty,
                  ]}>
                    {finalScore !== null ? String(finalScore) : '—'}
                  </Text>

                  <Text style={[
                    styles.abilityModifier,
                    modifier === null && styles.abilityModifierEmpty,
                  ]}>
                    {modifier !== null ? `(${formatModifier(modifier)})` : ''}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* ── Skill selection ── */}
        {classData && (
          <>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionLabel}>
                Choose {classData.skillChoices.pick} Skill
                {classData.skillChoices.pick !== 1 ? 's' : ''}
              </Text>
              <Text style={styles.skillCount}>
                {selectedSkills.length} / {classData.skillChoices.pick}
              </Text>
            </View>
            <Pressable style={[styles.recommendedButton, { marginBottom: spacing.sm }]} onPress={handleRecommendedSkills}>
              <Text style={styles.recommendedButtonText}>RECOMMENDED SKILLS</Text>
            </Pressable>
            <View style={styles.skillsGrid}>
              {classData.skillChoices.from.map(skill => {
                const isSelected = selectedSkills.includes(skill);
                const atCap = selectedSkills.length >= classData.skillChoices.pick;
                const isDisabled = !isSelected && atCap;
                const skillData = SKILLS[skill];
                const abilityAbbr = skillData.ability.slice(0, 3).toUpperCase();

                return (
                  <Pressable
                    key={skill}
                    style={{ opacity: isDisabled ? 0.3 : 1 }}
                    onPress={() => handleSkillToggle(skill)}
                    disabled={isDisabled}
                  >
                    <FantasyPanel variant="card">
                      <View style={styles.skillCardHeader}>
                        <Text style={[
                          styles.skillCardName,
                          isSelected && styles.skillCardNameSelected,
                        ]}>
                          {skillData.name}
                        </Text>
                        <Text style={[
                          styles.skillCardAbility,
                          isSelected && styles.skillCardAbilitySelected,
                        ]}>
                          {abilityAbbr}
                        </Text>
                      </View>
                      <Text
                        style={styles.skillCardDesc}
                        numberOfLines={2}
                      >
                        {skillData.description}
                      </Text>
                    </FantasyPanel>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}

        <View style={styles.scrollBottom} />
      </ScrollView>

      {/* ── Footer ── */}
      <View style={styles.footer}>
        <FantasyButton variant="primary" label="CONTINUE" onPress={handleContinue} disabled={!canProceed} />
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },

  // Header
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
    marginBottom: spacing.sm,
  },
  subtext: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  recommendedButton: {
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gold.primary,
    backgroundColor: colors.gold.glow,
    alignSelf: 'flex-start',
  },
  recommendedButtonText: {
    fontFamily: fonts.heading,
    fontSize: 11,
    letterSpacing: 1.5,
    color: colors.gold.primary,
  },

  // Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  scrollBottom: {
    height: spacing.xxl,
  },

  // Section header row
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  sectionLabel: {
    ...textStyles.sectionLabel,
    color: colors.text.tertiary,
  },
  selectedHint: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.gold.muted,
    fontStyle: 'italic',
  },

  // Available score chips
  scoresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  scoreChip: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gold.border,
    backgroundColor: colors.bg.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreChipSelected: {
    borderColor: colors.gold.primary,
    backgroundColor: colors.gold.glow,
  },
  scoreChipUsed: {
    opacity: 0.2,
  },
  scoreChipText: {
    fontFamily: fonts.heading,
    fontSize: 14,
    color: colors.text.primary,
  },
  scoreChipTextSelected: {
    color: colors.gold.primary,
  },
  scoreChipTextUsed: {
    fontFamily: fonts.heading,
    fontSize: 14,
    color: colors.text.disabled,
  },

  // Ability rows
  abilitiesContainer: {
    gap: spacing.xs,
  },
  abilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gold.border,
    backgroundColor: colors.bg.secondary,
  },
  abilityRowAssigned: {
    borderColor: colors.gold.borderHover,
    backgroundColor: colors.bg.tertiary,
  },
  abilityRowInactive: {
    opacity: 0.55,
  },
  abilityName: {
    fontFamily: fonts.headingRegular,
    fontSize: 10,
    letterSpacing: 1.5,
    color: colors.text.secondary,
    width: 90,
  },
  abilityRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  abilityScoreBox: {
    width: 32,
    alignItems: 'center',
  },
  abilityBaseScore: {
    fontFamily: fonts.heading,
    fontSize: 18,
  },
  abilityBaseScoreEmpty: {
    color: colors.text.disabled,
    fontSize: 20,
  },
  abilityBaseScoreSet: {
    color: colors.text.primary,
  },
  abilityRaceBonus: {
    fontFamily: fonts.headingRegular,
    fontSize: 12,
    color: colors.gold.muted,
    width: 24,
    textAlign: 'right',
  },
  abilityRaceBonusPlaceholder: {
    width: 24,
  },
  abilityEquals: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.text.tertiary,
  },
  abilityTotal: {
    fontFamily: fonts.heading,
    fontSize: 20,
    color: colors.gold.primary,
    width: 28,
    textAlign: 'center',
  },
  abilityTotalEmpty: {
    color: colors.text.disabled,
    fontSize: 16,
  },
  abilityModifier: {
    fontFamily: fonts.headingRegular,
    fontSize: 12,
    color: colors.text.secondary,
    width: 36,
    textAlign: 'right',
  },
  abilityModifierEmpty: {
    color: colors.text.disabled,
  },

  // Skill section
  skillCount: {
    fontFamily: fonts.headingRegular,
    fontSize: 11,
    color: colors.gold.muted,
    letterSpacing: 1,
  },
  skillsGrid: {
    gap: spacing.sm,
  },
  skillCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  skillCardName: {
    fontFamily: fonts.heading,
    fontSize: 14,
    color: PARCHMENT_TEXT.primary,
  },
  skillCardNameSelected: {
    color: PARCHMENT_TEXT.accent,
  },
  skillCardAbility: {
    fontFamily: fonts.headingRegular,
    fontSize: 10,
    letterSpacing: 1,
    color: PARCHMENT_TEXT.label,
    borderWidth: 1,
    borderColor: '#b8a070',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  skillCardAbilitySelected: {
    borderColor: '#8b4513',
    color: PARCHMENT_TEXT.accent,
  },
  skillCardDesc: {
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 17,
    color: PARCHMENT_TEXT.secondary,
  },

  // Footer
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    paddingTop: spacing.sm,
  },
});
