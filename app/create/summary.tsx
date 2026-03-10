import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors, PARCHMENT_TEXT } from '@/theme/colors';
import { fonts, spacing, textStyles } from '@/theme/typography';
import { FantasyPanel, FantasyButton } from '@/components/ui';
import { useCharacterCreationStore } from '@/stores/useCharacterCreationStore';
import { RACES } from '@/data/races';
import { CLASSES } from '@/data/classes';
import { ORIGIN_MAP } from '@/data/origins';
import { getModifier, calculateMaxHP, getProficiencyBonus } from '@/engine/character';
import { createCharacter } from '@/services/character';
import { getCurrentUserId } from '@/services/supabase';
import type { Skill, EquipmentItem } from '@/types/game';

// Ability abbreviations for display
const ABILITY_LABELS: Record<string, string> = {
  strength: 'STR',
  dexterity: 'DEX',
  constitution: 'CON',
  intelligence: 'INT',
  wisdom: 'WIS',
  charisma: 'CHA',
};

// Format skill name for display
function formatSkill(skill: Skill): string {
  return skill
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

// Format modifier with sign
function formatMod(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

// Section wrapper — uses FantasyPanel pinned variant for the whole review
function SummarySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

export default function CharacterSummaryScreen() {
  const router = useRouter();
  const {
    race,
    className,
    name,
    setName,
    originId,
    customOrigin,
    selectedSkills,
    getFinalAbilityScores,
    abilityAssignment,
  } = useCharacterCreationStore();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Guard: should not render without required selections
  if (!race || !className) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centeredError}>
          <Text style={styles.errorText}>Character data is incomplete. Please start over.</Text>
        </View>
      </SafeAreaView>
    );
  }

  // After the guard, race and className are narrowed to non-null.
  // Capture them as local const so closures (handleBeginAdventure) also see non-null types.
  const resolvedRace = race;
  const resolvedClassName = className;

  const raceData = RACES[resolvedRace];
  const classData = CLASSES[resolvedClassName];
  const originData = originId && originId !== 'custom' ? ORIGIN_MAP[originId] : null;
  const finalScores = getFinalAbilityScores();

  // All proficient skills (deduplicated)
  const raceSkills: Skill[] = raceData.skillProficiencies ?? [];
  const originSkills: Skill[] = originData?.bonusSkills ?? [];
  const allProficientSkills: Skill[] = [
    ...new Set([...selectedSkills, ...raceSkills, ...originSkills]),
  ];

  // Computed stats
  const maxHP = finalScores
    ? calculateMaxHP(className, 1, finalScores.constitution)
    : classData.hitDie;
  const profBonus = getProficiencyBonus(1);

  // AC from starting equipment
  function computeAC(): number {
    const dexScore = finalScores?.dexterity ?? 10;
    const dexMod = getModifier(dexScore);

    const armor = classData.startingEquipment.find(e => e.type === 'armor' && e.equipped);
    const shield = classData.startingEquipment.find(e => e.type === 'shield' && e.equipped);

    let ac = 10 + dexMod;

    if (armor) {
      const armorAC: number = (armor.properties.ac as number) || 10;
      const maxDex: number = (armor.properties.maxDex as number) ?? Infinity;
      const effectiveDex = isFinite(maxDex) ? Math.min(dexMod, maxDex) : dexMod;
      ac = armorAC + effectiveDex;
    }

    if (shield) {
      ac += (shield.properties.acBonus as number) || 2;
    }

    return ac;
  }

  const ac = computeAC();

  // Display label for race + class combo
  const raceClassLabel = `${raceData.name} ${classData.name}`;

  // Origin display info
  const originName = originData?.name ?? customOrigin ?? 'Custom';
  const originQuest = originData?.personalQuest ?? 'A story of your own making.';

  async function handleBeginAdventure() {
    if (!name.trim()) {
      setError('Please enter a name for your character.');
      return;
    }
    if (!finalScores) {
      setError('Ability scores are incomplete. Please go back and assign all scores.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const userId = await getCurrentUserId();

      // Build quest flags from origin
      const personalQuestFlags: Record<string, boolean> = {};
      if (originData) {
        for (const flag of originData.questFlags) {
          personalQuestFlags[flag] = true;
        }
      }

      // Build features list from class
      const features: string[] = classData.features.map(f => f.name);

      const hp = calculateMaxHP(resolvedClassName, 1, finalScores.constitution);
      const computedAC = computeAC();
      const equipment: EquipmentItem[] = classData.startingEquipment;

      const savedCharacter = await createCharacter({
        userId,
        name: name.trim(),
        race: resolvedRace,
        className: resolvedClassName,
        subclass: '',
        level: 1,
        xp: 0,
        abilityScores: finalScores,
        hp,
        maxHp: hp,
        tempHp: 0,
        ac: computedAC,
        speed: raceData.speed,
        proficiencyBonus: getProficiencyBonus(1),
        proficientSkills: allProficientSkills,
        proficientSaves: classData.saveProficiencies,
        spellSlots: [],
        maxSpellSlots: [],
        equipment,
        inventory: [],
        knownSpells: [],
        features,
        conditions: [],
        originStory: originId ?? '',
        originAiContext: originData?.aiContext ?? customOrigin ?? '',
        personalQuestFlags,
      });

      // Navigate to companion selection with character ID
      router.replace({
        pathname: '/create/companions',
        params: { characterId: savedCharacter.id },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.stepLabel}>STEP 5 OF 5</Text>
        <Text style={styles.title}>Review & Name</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Name Input */}
        <View style={styles.nameSection}>
          <Text style={styles.nameLabel}>CHARACTER NAME</Text>
          <TextInput
            style={styles.nameInput}
            value={name}
            onChangeText={setName}
            placeholder="Enter your character's name..."
            placeholderTextColor={colors.text.tertiary}
            autoCorrect={false}
            autoCapitalize="words"
            maxLength={40}
          />
        </View>

        {/* Character Review Panel — pinned variant for larger content area */}
        <FantasyPanel variant="pinned">
          {/* Race & Class */}
          <SummarySection title="Race & Class">
            <View style={styles.raceClassRow}>
              <Text style={styles.raceClassLabel}>{raceClassLabel}</Text>
              <View style={styles.hitDieBadge}>
                <Text style={styles.hitDieText}>d{classData.hitDie}</Text>
              </View>
            </View>
            <Text style={styles.bodyText}>{raceData.description}</Text>
          </SummarySection>

          {/* Ability Scores */}
          <SummarySection title="Ability Scores">
            <View style={styles.abilitiesGrid}>
              {(Object.entries(finalScores ?? {}) as [string, number][]).map(([ability, score]) => {
                const mod = getModifier(score);
                return (
                  <View key={ability} style={styles.abilityItem}>
                    <Text style={styles.abilityLabel}>{ABILITY_LABELS[ability]}</Text>
                    <Text style={styles.abilityScore}>{score}</Text>
                    <Text style={styles.abilityMod}>{formatMod(mod)}</Text>
                  </View>
                );
              })}
            </View>
          </SummarySection>

          {/* Skills */}
          <SummarySection title="Skill Proficiencies">
            {allProficientSkills.length === 0 ? (
              <Text style={styles.emptyText}>None selected</Text>
            ) : (
              <View style={styles.skillChips}>
                {allProficientSkills.map(skill => (
                  <View key={skill} style={styles.skillChip}>
                    <Text style={styles.skillChipText}>{formatSkill(skill)}</Text>
                  </View>
                ))}
              </View>
            )}
          </SummarySection>

          {/* Origin */}
          <SummarySection title="Origin">
            <Text style={styles.originName}>{originName}</Text>
            <Text style={styles.originQuest}>{originQuest}</Text>
          </SummarySection>

          {/* Starting Equipment */}
          <SummarySection title="Starting Equipment">
            {classData.startingEquipment.map(item => (
              <View key={item.id} style={styles.equipmentRow}>
                <View style={styles.equipmentTypeBadge}>
                  <Text style={styles.equipmentTypeText}>{item.type.toUpperCase()}</Text>
                </View>
                <Text style={styles.equipmentName}>{item.name}</Text>
              </View>
            ))}
          </SummarySection>

          {/* Computed Stats */}
          <SummarySection title="Starting Stats">
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statBoxValue}>{maxHP}</Text>
                <Text style={styles.statBoxLabel}>MAX HP</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statBoxValue}>{ac}</Text>
                <Text style={styles.statBoxLabel}>AC</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statBoxValue}>{`+${profBonus}`}</Text>
                <Text style={styles.statBoxLabel}>PROF</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statBoxValue}>{raceData.speed}</Text>
                <Text style={styles.statBoxLabel}>SPEED</Text>
              </View>
            </View>
          </SummarySection>
        </FantasyPanel>

        {/* Error */}
        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : null}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <FantasyButton
          variant="primary"
          label={saving ? 'SAVING...' : 'BEGIN ADVENTURE'}
          onPress={handleBeginAdventure}
          disabled={!name.trim() || saving}
        />
        {saving && (
          <ActivityIndicator
            size="small"
            color={colors.gold.primary}
            style={styles.savingIndicator}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  centeredError: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gold.border,
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },

  // Name input
  nameSection: {
    marginBottom: spacing.xs,
  },
  nameLabel: {
    ...textStyles.sectionLabel,
    color: colors.text.tertiary,
    marginBottom: spacing.sm,
  },
  nameInput: {
    borderWidth: 1.5,
    borderColor: colors.gold.primary,
    borderRadius: 8,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontFamily: fonts.heading,
    fontSize: 18,
    color: colors.text.primary,
    backgroundColor: colors.bg.secondary,
    letterSpacing: 1,
  },

  // Section (inside FantasyPanel pinned)
  section: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...textStyles.sectionLabel,
    color: PARCHMENT_TEXT.label,
    marginBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#c8a870',
    paddingBottom: spacing.xs,
  },
  sectionBody: {
    gap: spacing.sm,
  },
  emptyText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: PARCHMENT_TEXT.secondary,
    fontStyle: 'italic',
  },
  bodyText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: PARCHMENT_TEXT.secondary,
    lineHeight: 19,
  },

  // Race & class
  raceClassRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  raceClassLabel: {
    fontFamily: fonts.heading,
    fontSize: 17,
    color: PARCHMENT_TEXT.primary,
    letterSpacing: 0.5,
  },
  hitDieBadge: {
    borderWidth: 1,
    borderColor: '#b8a070',
    borderRadius: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  hitDieText: {
    fontFamily: fonts.heading,
    fontSize: 11,
    color: PARCHMENT_TEXT.label,
    letterSpacing: 1,
  },

  // Ability scores grid
  abilitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  abilityItem: {
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#c8a870',
    borderRadius: 8,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.15)',
    minWidth: 62,
  },
  abilityLabel: {
    fontFamily: fonts.heading,
    fontSize: 9,
    color: PARCHMENT_TEXT.label,
    letterSpacing: 2,
    marginBottom: 2,
  },
  abilityScore: {
    fontFamily: fonts.heading,
    fontSize: 20,
    color: PARCHMENT_TEXT.primary,
    lineHeight: 24,
  },
  abilityMod: {
    fontFamily: fonts.headingRegular,
    fontSize: 11,
    color: PARCHMENT_TEXT.accent,
    marginTop: 1,
  },

  // Skills
  skillChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  skillChip: {
    borderWidth: 1,
    borderColor: '#b8a070',
    borderRadius: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  skillChipText: {
    fontFamily: fonts.headingRegular,
    fontSize: 10,
    color: PARCHMENT_TEXT.secondary,
    letterSpacing: 0.5,
  },

  // Origin
  originName: {
    fontFamily: fonts.heading,
    fontSize: 14,
    color: PARCHMENT_TEXT.accent,
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  originQuest: {
    fontFamily: fonts.bodyItalic,
    fontSize: 13,
    color: PARCHMENT_TEXT.secondary,
    lineHeight: 19,
  },

  // Equipment
  equipmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  equipmentTypeBadge: {
    borderWidth: 1,
    borderColor: '#b8a070',
    borderRadius: 3,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 52,
    alignItems: 'center',
  },
  equipmentTypeText: {
    fontFamily: fonts.heading,
    fontSize: 8,
    color: PARCHMENT_TEXT.label,
    letterSpacing: 1,
  },
  equipmentName: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: PARCHMENT_TEXT.primary,
  },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#c8a870',
    borderRadius: 8,
    paddingVertical: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  statBoxValue: {
    fontFamily: fonts.heading,
    fontSize: 20,
    color: PARCHMENT_TEXT.accent,
    lineHeight: 24,
  },
  statBoxLabel: {
    fontFamily: fonts.heading,
    fontSize: 8,
    color: PARCHMENT_TEXT.label,
    letterSpacing: 1.5,
    marginTop: 2,
  },

  // Error
  errorText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.combat.red,
    textAlign: 'center',
    lineHeight: 18,
  },

  // Footer
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gold.border,
    gap: spacing.sm,
  },
  savingIndicator: {
    alignSelf: 'center',
  },
});
