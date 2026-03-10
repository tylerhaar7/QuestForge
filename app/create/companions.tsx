// Companion Selection — Choose 3 party members from roster or create custom
// Step 6 of character creation flow

import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors } from '@/theme/colors';
import { fonts, spacing, textStyles } from '@/theme/typography';
import {
  COMPANION_ROSTER,
  RECOMMENDED_COMPANION_PERSONALITY,
  COMPANION_DEFAULT_STATS,
  COMPANION_DEFAULT_ABILITIES,
} from '@/data/companions';
import type { CompanionTemplate } from '@/data/companions';
import type { ClassName } from '@/types/game';

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_COMPANIONS = 3;

type Tab = 'roster' | 'create';

const ALL_CLASSES: ClassName[] = [
  'artificer', 'barbarian', 'bard', 'cleric', 'druid', 'fighter', 'monk',
  'paladin', 'ranger', 'rogue', 'sorcerer', 'warlock', 'wizard',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function CompanionSelectionScreen() {
  const router = useRouter();
  const { characterId } = useLocalSearchParams<{ characterId: string }>();

  // ── Tab state ──
  const [activeTab, setActiveTab] = useState<Tab>('roster');

  // ── Selected companions (up to 3) ──
  const [selectedCompanions, setSelectedCompanions] = useState<CompanionTemplate[]>([]);

  // ── Custom companion roster additions ──
  const [customCompanions, setCustomCompanions] = useState<CompanionTemplate[]>([]);

  // ── Create form state ──
  const [formName, setFormName] = useState('');
  const [formClass, setFormClass] = useState<ClassName | null>(null);
  const [formVoice, setFormVoice] = useState('');
  const [formBackstory, setFormBackstory] = useState('');
  const [formApproves, setFormApproves] = useState('');
  const [formDisapproves, setFormDisapproves] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Combine pre-built and custom companions into full roster
  const fullRoster = [...COMPANION_ROSTER, ...customCompanions];

  // ── Handlers: Roster tab ──────────────────────────────────────────────────

  const isSelected = (companion: CompanionTemplate) =>
    selectedCompanions.some(
      (c) => c.name === companion.name && c.className === companion.className,
    );

  const handleToggleCompanion = (companion: CompanionTemplate) => {
    if (isSelected(companion)) {
      // Deselect
      setSelectedCompanions((prev) =>
        prev.filter(
          (c) => !(c.name === companion.name && c.className === companion.className),
        ),
      );
    } else if (selectedCompanions.length < MAX_COMPANIONS) {
      // Select
      setSelectedCompanions((prev) => [...prev, companion]);
    }
    // At cap and not already selected: do nothing
  };

  const handleRemoveCompanion = (companion: CompanionTemplate) => {
    setSelectedCompanions((prev) =>
      prev.filter(
        (c) => !(c.name === companion.name && c.className === companion.className),
      ),
    );
  };

  // ── Handlers: Create tab ──────────────────────────────────────────────────

  const handleRecommended = () => {
    if (!formClass) return;
    const rec = RECOMMENDED_COMPANION_PERSONALITY[formClass];
    setFormVoice(rec.voice);
    setFormBackstory(rec.backstory);
    setFormApproves(rec.approves.join(', '));
    setFormDisapproves(rec.disapproves.join(', '));
  };

  const handleAddToParty = () => {
    setFormError(null);

    const trimmedName = formName.trim();
    if (!trimmedName) {
      setFormError('Name is required.');
      return;
    }
    if (!formClass) {
      setFormError('Please select a class.');
      return;
    }

    // Check for duplicate name in roster + custom companions
    const allCompanions = [...COMPANION_ROSTER, ...customCompanions];
    if (allCompanions.some(c => c.name.toLowerCase() === trimmedName.toLowerCase())) {
      setFormError('A companion with this name already exists.');
      return;
    }

    const stats = COMPANION_DEFAULT_STATS[formClass];
    const abilities = COMPANION_DEFAULT_ABILITIES[formClass];

    const approvesTags = formApproves
      .split(',')
      .map((t) => t.trim().toLowerCase().replace(/\s+/g, '_'))
      .filter(Boolean);
    const disapprovesTags = formDisapproves
      .split(',')
      .map((t) => t.trim().toLowerCase().replace(/\s+/g, '_'))
      .filter(Boolean);

    const newCompanion: CompanionTemplate = {
      name: trimmedName,
      className: formClass,
      level: 1,
      maxHp: stats.maxHp,
      ac: stats.ac,
      portrait: '',
      color: colors.class[formClass],
      personality: {
        voice: formVoice.trim() || `A ${formClass} of few words.`,
        backstory: formBackstory.trim() || `A wandering ${formClass} seeking adventure.`,
        approves: approvesTags.length > 0 ? approvesTags : ['honor', 'bravery'],
        disapproves:
          disapprovesTags.length > 0 ? disapprovesTags : ['cruelty', 'deception'],
      },
      abilities: [...abilities],
    };

    // Add to custom roster and auto-select if under cap
    setCustomCompanions((prev) => [...prev, newCompanion]);
    if (selectedCompanions.length < MAX_COMPANIONS) {
      setSelectedCompanions((prev) => [...prev, newCompanion]);
    }

    // Reset form
    setFormName('');
    setFormClass(null);
    setFormVoice('');
    setFormBackstory('');
    setFormApproves('');
    setFormDisapproves('');
    setFormError(null);

    // Switch to roster to see the new companion
    setActiveTab('roster');
  };

  // ── Handler: Continue ─────────────────────────────────────────────────────

  const canContinue = selectedCompanions.length === MAX_COMPANIONS;

  const handleContinue = () => {
    if (!canContinue || !characterId) return;
    router.push({
      pathname: '/create/campaign-start',
      params: {
        characterId,
        companions: JSON.stringify(selectedCompanions),
      },
    });
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.stepLabel}>STEP 6 OF 6</Text>
          <Text style={styles.title}>Choose Your Party</Text>
          <Text style={styles.subtitle}>Select 3 companions to join your adventure</Text>
        </View>

        {/* Tab pills */}
        <View style={styles.tabRow}>
          <Pressable
            style={[styles.tabPill, activeTab === 'roster' && styles.tabPillActive]}
            onPress={() => setActiveTab('roster')}
          >
            <Text
              style={[
                styles.tabPillText,
                activeTab === 'roster' && styles.tabPillTextActive,
              ]}
            >
              ROSTER
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tabPill, activeTab === 'create' && styles.tabPillActive]}
            onPress={() => setActiveTab('create')}
          >
            <Text
              style={[
                styles.tabPillText,
                activeTab === 'create' && styles.tabPillTextActive,
              ]}
            >
              CREATE CUSTOM
            </Text>
          </Pressable>
        </View>

        {/* Main content */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {activeTab === 'roster' ? (
            // ── ROSTER TAB ──────────────────────────────────────────────
            <View style={styles.rosterContainer}>
              {fullRoster.map((companion, index) => {
                const selected = isSelected(companion);
                return (
                  <Pressable
                    key={`${companion.name}-${companion.className}-${index}`}
                    style={[styles.companionCard, selected && styles.companionCardSelected]}
                    onPress={() => handleToggleCompanion(companion)}
                  >
                    {/* Name + class */}
                    <View style={styles.cardHeader}>
                      <View style={styles.cardNameRow}>
                        <View
                          style={[
                            styles.classColorDot,
                            { backgroundColor: companion.color },
                          ]}
                        />
                        <Text style={styles.cardName}>{companion.name}</Text>
                      </View>
                      <Text style={styles.cardClass}>
                        {capitalize(companion.className)}
                      </Text>
                    </View>

                    {/* Stats row */}
                    <View style={styles.cardStatsRow}>
                      <View style={styles.cardStat}>
                        <Text style={styles.cardStatLabel}>HP</Text>
                        <Text style={styles.cardStatValue}>{companion.maxHp}</Text>
                      </View>
                      <View style={styles.cardStat}>
                        <Text style={styles.cardStatLabel}>AC</Text>
                        <Text style={styles.cardStatValue}>{companion.ac}</Text>
                      </View>
                    </View>

                    {/* Voice snippet */}
                    <Text style={styles.cardVoice} numberOfLines={2}>
                      {truncate(companion.personality.voice, 100)}
                    </Text>

                    {/* Abilities */}
                    <View style={styles.cardAbilitiesRow}>
                      {companion.abilities.slice(0, 2).map((ability) => (
                        <View key={ability.name} style={styles.abilityTag}>
                          <Text style={styles.abilityTagText}>{ability.name}</Text>
                        </View>
                      ))}
                    </View>

                    {/* Selected badge */}
                    {selected && (
                      <View style={styles.selectedBadge}>
                        <Text style={styles.selectedBadgeText}>SELECTED</Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          ) : (
            // ── CREATE CUSTOM TAB ───────────────────────────────────────
            <View style={styles.createContainer}>
              {/* Name */}
              <Text style={styles.fieldLabel}>COMPANION NAME</Text>
              <TextInput
                style={styles.textInput}
                value={formName}
                onChangeText={(text) => setFormName(text.slice(0, 30))}
                placeholder="Enter companion name"
                placeholderTextColor={colors.text.tertiary}
                maxLength={30}
              />
              <Text style={styles.charCount}>{formName.length}/30</Text>

              {/* Class picker */}
              <Text style={[styles.fieldLabel, { marginTop: spacing.lg }]}>CLASS</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.classScrollView}
                contentContainerStyle={styles.classScrollContent}
              >
                {ALL_CLASSES.map((cls) => {
                  const isClassSelected = formClass === cls;
                  return (
                    <Pressable
                      key={cls}
                      style={[
                        styles.classPill,
                        isClassSelected && styles.classPillSelected,
                      ]}
                      onPress={() => setFormClass(cls)}
                    >
                      <Text
                        style={[
                          styles.classPillText,
                          isClassSelected && styles.classPillTextSelected,
                        ]}
                      >
                        {capitalize(cls)}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {/* Stats preview when class is selected */}
              {formClass && (
                <View style={styles.statsPreview}>
                  <Text style={styles.statsPreviewText}>
                    HP {COMPANION_DEFAULT_STATS[formClass].maxHp} / AC{' '}
                    {COMPANION_DEFAULT_STATS[formClass].ac} {'\u2014'}{' '}
                    {COMPANION_DEFAULT_ABILITIES[formClass]
                      .map((a) => a.name)
                      .join(', ')}
                  </Text>
                </View>
              )}

              {/* Recommended button */}
              <Pressable
                style={[
                  styles.recommendedButton,
                  !formClass && styles.recommendedButtonDisabled,
                ]}
                onPress={handleRecommended}
                disabled={!formClass}
              >
                <Text style={styles.recommendedButtonText}>RECOMMENDED</Text>
              </Pressable>

              {/* Voice */}
              <Text style={[styles.fieldLabel, { marginTop: spacing.lg }]}>
                PERSONALITY VOICE
              </Text>
              <TextInput
                style={[styles.textInput, styles.multilineInput]}
                value={formVoice}
                onChangeText={(text) => setFormVoice(text.slice(0, 200))}
                placeholder="Short personality description"
                placeholderTextColor={colors.text.tertiary}
                multiline
                maxLength={200}
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>{formVoice.length}/200</Text>

              {/* Backstory */}
              <Text style={[styles.fieldLabel, { marginTop: spacing.lg }]}>BACKSTORY</Text>
              <TextInput
                style={[styles.textInput, styles.multilineInput]}
                value={formBackstory}
                onChangeText={(text) => setFormBackstory(text.slice(0, 300))}
                placeholder="A brief backstory for your companion"
                placeholderTextColor={colors.text.tertiary}
                multiline
                maxLength={300}
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>{formBackstory.length}/300</Text>

              {/* Approves */}
              <Text style={[styles.fieldLabel, { marginTop: spacing.lg }]}>APPROVES</Text>
              <TextInput
                style={styles.textInput}
                value={formApproves}
                onChangeText={setFormApproves}
                placeholder="e.g., honor, bravery, kindness"
                placeholderTextColor={colors.text.tertiary}
                maxLength={200}
              />

              {/* Disapproves */}
              <Text style={[styles.fieldLabel, { marginTop: spacing.lg }]}>
                DISAPPROVES
              </Text>
              <TextInput
                style={styles.textInput}
                value={formDisapproves}
                onChangeText={setFormDisapproves}
                placeholder="e.g., cruelty, deception, cowardice"
                placeholderTextColor={colors.text.tertiary}
                maxLength={200}
              />

              {/* Form error */}
              {formError && <Text style={styles.formError}>{formError}</Text>}

              {/* Add to party button */}
              <Pressable style={styles.addButton} onPress={handleAddToParty}>
                <Text style={styles.addButtonText}>ADD TO PARTY</Text>
              </Pressable>
            </View>
          )}

          <View style={styles.scrollBottom} />
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          {/* Selected companion pills */}
          {selectedCompanions.length > 0 && (
            <View style={styles.selectedPillsRow}>
              {selectedCompanions.map((companion, index) => (
                <Pressable
                  key={`selected-${companion.name}-${index}`}
                  style={styles.selectedPill}
                  onPress={() => handleRemoveCompanion(companion)}
                >
                  <Text style={styles.selectedPillText}>{companion.name}</Text>
                  <Text style={styles.selectedPillRemove}>x</Text>
                </Pressable>
              ))}
            </View>
          )}

          {/* Selection count */}
          <Text style={styles.selectionCount}>
            {selectedCompanions.length} / {MAX_COMPANIONS} selected
          </Text>

          {/* Continue button */}
          <Pressable
            style={[styles.continueButton, !canContinue && styles.continueButtonDisabled]}
            onPress={handleContinue}
            disabled={!canContinue}
          >
            <Text style={styles.continueButtonText}>CONTINUE</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  flex: {
    flex: 1,
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
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontFamily: fonts.narrative,
    fontSize: 15,
    color: colors.text.secondary,
    fontStyle: 'italic',
  },

  // Tabs
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  tabPill: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.gold.border,
    backgroundColor: colors.bg.secondary,
  },
  tabPillActive: {
    borderColor: colors.gold.primary,
    backgroundColor: colors.gold.glow,
  },
  tabPillText: {
    fontFamily: fonts.heading,
    fontSize: 11,
    letterSpacing: 1.5,
    color: colors.text.tertiary,
  },
  tabPillTextActive: {
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

  // ── ROSTER TAB ────────────────────────────────────────────────────────────

  rosterContainer: {
    gap: spacing.md,
  },
  companionCard: {
    borderWidth: 1,
    borderColor: colors.gold.border,
    borderRadius: 12,
    padding: spacing.lg,
    backgroundColor: colors.bg.tertiary,
  },
  companionCardSelected: {
    borderColor: colors.gold.primary,
    backgroundColor: colors.bg.secondary,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cardNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  classColorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  cardName: {
    ...textStyles.characterName,
    color: colors.text.primary,
  },
  cardClass: {
    fontFamily: fonts.headingRegular,
    fontSize: 11,
    letterSpacing: 1,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
  },
  cardStatsRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.sm,
  },
  cardStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  cardStatLabel: {
    ...textStyles.statLabel,
    color: colors.text.tertiary,
  },
  cardStatValue: {
    fontFamily: fonts.heading,
    fontSize: 14,
    color: colors.gold.primary,
  },
  cardVoice: {
    fontFamily: fonts.bodyItalic,
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 19,
    marginBottom: spacing.sm,
  },
  cardAbilitiesRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  abilityTag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.gold.border,
    backgroundColor: colors.bg.secondary,
  },
  abilityTagText: {
    fontFamily: fonts.headingRegular,
    fontSize: 10,
    letterSpacing: 0.5,
    color: colors.text.secondary,
  },
  selectedBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: colors.gold.primary,
  },
  selectedBadgeText: {
    fontFamily: fonts.heading,
    fontSize: 9,
    letterSpacing: 1,
    color: colors.bg.primary,
  },

  // ── CREATE CUSTOM TAB ─────────────────────────────────────────────────────

  createContainer: {
    gap: 0,
  },
  fieldLabel: {
    ...textStyles.sectionLabel,
    color: colors.text.tertiary,
    marginBottom: spacing.sm,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.gold.border,
    borderRadius: 8,
    padding: spacing.md,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.text.primary,
    backgroundColor: colors.bg.secondary,
  },
  multilineInput: {
    minHeight: 80,
    lineHeight: 20,
  },
  charCount: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.text.tertiary,
    textAlign: 'right',
    marginTop: spacing.xs,
  },

  // Class picker
  classScrollView: {
    marginBottom: spacing.sm,
  },
  classScrollContent: {
    gap: spacing.sm,
    paddingRight: spacing.md,
  },
  classPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.gold.border,
    backgroundColor: colors.bg.secondary,
  },
  classPillSelected: {
    borderColor: colors.gold.primary,
    backgroundColor: colors.gold.glow,
  },
  classPillText: {
    fontFamily: fonts.headingRegular,
    fontSize: 11,
    letterSpacing: 0.5,
    color: colors.text.secondary,
  },
  classPillTextSelected: {
    color: colors.gold.primary,
  },

  // Stats preview
  statsPreview: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    backgroundColor: colors.bg.tertiary,
    marginBottom: spacing.sm,
  },
  statsPreviewText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.text.secondary,
    lineHeight: 18,
  },

  // Recommended button
  recommendedButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    backgroundColor: colors.gold.primary,
    alignSelf: 'flex-start',
    marginBottom: spacing.sm,
  },
  recommendedButtonDisabled: {
    opacity: 0.3,
  },
  recommendedButtonText: {
    fontFamily: fonts.heading,
    fontSize: 11,
    letterSpacing: 1.5,
    color: colors.bg.primary,
  },

  // Form error
  formError: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.combat.red,
    marginTop: spacing.sm,
  },

  // Add to party button
  addButton: {
    marginTop: spacing.lg,
    paddingVertical: spacing.md + 2,
    borderRadius: 8,
    backgroundColor: colors.gold.primary,
    alignItems: 'center',
  },
  addButtonText: {
    ...textStyles.buttonLabel,
    color: colors.bg.primary,
    fontSize: 14,
    fontFamily: fonts.heading,
    letterSpacing: 2,
  },

  // ── FOOTER ────────────────────────────────────────────────────────────────

  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gold.border,
  },
  selectedPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  selectedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.gold.primary,
  },
  selectedPillText: {
    fontFamily: fonts.headingRegular,
    fontSize: 11,
    letterSpacing: 0.5,
    color: colors.gold.primary,
  },
  selectedPillRemove: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.gold.muted,
    marginLeft: 2,
  },
  selectionCount: {
    fontFamily: fonts.headingRegular,
    fontSize: 11,
    color: colors.text.tertiary,
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  continueButton: {
    backgroundColor: colors.gold.primary,
    paddingVertical: spacing.md + 2,
    borderRadius: 8,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    opacity: 0.3,
  },
  continueButtonText: {
    ...textStyles.buttonLabel,
    color: colors.bg.primary,
    fontSize: 14,
    fontFamily: fonts.heading,
    letterSpacing: 2,
  },
});
