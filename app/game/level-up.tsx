// Level-Up Screen — Animated ceremony + interactive D&D 5e leveling choices.
// Flow: Stats reveal → ASI/Feat → Subclass → Spells → Confirm

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withDelay, withSequence,
  FadeIn, FadeInDown, Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { colors, PARCHMENT_TEXT } from '@/theme/colors';
import { fonts, spacing, textStyles } from '@/theme/typography';
import { FantasyPanel, FantasyButton } from '@/components/ui';
import { StatTicker, StatTickerRow } from '@/components/animations/StatTicker';
import { useGameStore } from '@/stores/useGameStore';
import { useAccessibility } from '@/providers/AccessibilityProvider';
import { getLevelUpChoices } from '@/engine/levelUp';
import { getFeatsForClass } from '@/data/levelUpFeats';
import { getSubclassesForClass } from '@/data/subclasses';
import { saveLevelUpChoices } from '@/services/campaign';
import type { AbilityScore, LevelUpPlayerChoices } from '@/types/game';
import type { LevelUpFeat } from '@/data/levelUpFeats';
import type { SubclassDefinition } from '@/data/subclasses';

type Phase = 'ceremony' | 'asi' | 'subclass' | 'spells' | 'confirm';

const ABILITY_LABELS: Record<AbilityScore, string> = {
  strength: 'STR', dexterity: 'DEX', constitution: 'CON',
  intelligence: 'INT', wisdom: 'WIS', charisma: 'CHA',
};

export default function LevelUpScreen() {
  const router = useRouter();
  const { skipAnimations, hapticsEnabled } = useAccessibility();

  const levelUpMeta = useGameStore((s) => s.levelUpMeta);
  const character = useGameStore((s) => s.character);
  const clearLevelUpMeta = useGameStore((s) => s.clearLevelUpMeta);
  const setCharacter = useGameStore((s) => s.setCharacter);

  const [phase, setPhase] = useState<Phase>('ceremony');
  const [ceremonyStep, setCeremonyStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Player choices
  const [asiMode, setAsiMode] = useState<'asi' | 'feat'>('asi');
  const [asiPoints, setAsiPoints] = useState<Record<AbilityScore, number>>({
    strength: 0, dexterity: 0, constitution: 0,
    intelligence: 0, wisdom: 0, charisma: 0,
  });
  const [selectedFeat, setSelectedFeat] = useState<LevelUpFeat | null>(null);
  const [selectedSubclass, setSelectedSubclass] = useState<SubclassDefinition | null>(null);

  if (!levelUpMeta || !character) {
    return null;
  }

  const { oldLevel, newLevel, newMaxHp, newProficiencyBonus } = levelUpMeta;

  // Resolve available choices
  const spellAbilityKey = useMemo(() => {
    const map: Record<string, AbilityScore> = {
      bard: 'charisma', cleric: 'wisdom', druid: 'wisdom', paladin: 'charisma',
      ranger: 'wisdom', sorcerer: 'charisma', warlock: 'charisma', wizard: 'intelligence',
      artificer: 'intelligence',
    };
    return map[character.className] || 'intelligence';
  }, [character.className]);

  const abilityMod = useMemo(
    () => Math.floor((character.abilityScores[spellAbilityKey] - 10) / 2),
    [character.abilityScores, spellAbilityKey],
  );

  const choices = useMemo(
    () => getLevelUpChoices(character.className, newLevel, abilityMod),
    [character.className, newLevel, abilityMod],
  );

  const availableFeats = useMemo(
    () => choices.asiAvailable ? getFeatsForClass(character.className, !!choices.newSpells) : [],
    [character.className, choices],
  );

  const availableSubclasses = useMemo(
    () => choices.subclassAvailable ? getSubclassesForClass(character.className) : [],
    [character.className, choices],
  );

  const totalAsiSpent = Object.values(asiPoints).reduce((s, v) => s + v, 0);

  // ─── Ceremony animation ─────────────────────────
  const titleScale = useSharedValue(0.3);
  const titleOpacity = useSharedValue(0);

  useEffect(() => {
    if (phase !== 'ceremony') return;

    if (hapticsEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Animate title
    titleOpacity.value = withDelay(200, withTiming(1, { duration: 400 }));
    titleScale.value = withDelay(200, withSequence(
      withTiming(1.2, { duration: 300, easing: Easing.out(Easing.back(1.5)) }),
      withTiming(1, { duration: 200 }),
    ));

    // Auto-advance ceremony steps
    const timers = [
      setTimeout(() => setCeremonyStep(1), skipAnimations ? 0 : 800),
      setTimeout(() => setCeremonyStep(2), skipAnimations ? 0 : 1600),
      setTimeout(() => setCeremonyStep(3), skipAnimations ? 0 : 2400),
      setTimeout(() => {
        // Move to first interactive phase
        if (choices.asiAvailable) setPhase('asi');
        else if (choices.subclassAvailable) setPhase('subclass');
        else if (choices.newSpells) setPhase('spells');
        else setPhase('confirm');
      }, skipAnimations ? 100 : 3500),
    ];

    return () => timers.forEach(clearTimeout);
  }, [phase, skipAnimations, choices]);

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ scale: titleScale.value }],
  }));

  // ─── ASI helpers ────────────────────────────────
  const handleAsiChange = useCallback((ability: AbilityScore, delta: number) => {
    setAsiPoints((prev) => {
      const newVal = prev[ability] + delta;
      const newTotal = totalAsiSpent + delta;
      if (newVal < 0 || newVal > 2 || newTotal > 2) return prev;
      const currentScore = character.abilityScores[ability] + newVal;
      if (currentScore > 20) return prev;
      return { ...prev, [ability]: newVal };
    });
  }, [totalAsiSpent, character.abilityScores]);

  // ─── Navigation between phases ──────────────────
  const advancePhase = useCallback(() => {
    if (phase === 'asi') {
      if (choices.subclassAvailable) setPhase('subclass');
      else if (choices.newSpells) setPhase('spells');
      else setPhase('confirm');
    } else if (phase === 'subclass') {
      if (choices.newSpells) setPhase('spells');
      else setPhase('confirm');
    } else if (phase === 'spells') {
      setPhase('confirm');
    }
  }, [phase, choices]);

  // ─── Save and exit ──────────────────────────────
  const handleConfirm = useCallback(async () => {
    if (saving) return;
    setSaving(true);

    try {
      const playerChoices: LevelUpPlayerChoices = {};

      if (choices.asiAvailable) {
        if (asiMode === 'asi' && totalAsiSpent > 0) {
          const abilities: Partial<Record<AbilityScore, number>> = {};
          for (const [key, val] of Object.entries(asiPoints)) {
            if (val > 0) abilities[key as AbilityScore] = val;
          }
          playerChoices.asiChoice = { type: 'asi', abilities };
        } else if (asiMode === 'feat' && selectedFeat) {
          playerChoices.asiChoice = { type: 'feat', featId: selectedFeat.id };
        }
      }

      if (selectedSubclass) {
        playerChoices.subclassId = selectedSubclass.id;
      }

      await saveLevelUpChoices(character.id, playerChoices, character);

      // Update local character state
      const updated = { ...character };
      if (playerChoices.asiChoice?.type === 'asi') {
        const scores = { ...updated.abilityScores };
        for (const [key, val] of Object.entries(playerChoices.asiChoice.abilities)) {
          scores[key as AbilityScore] += val ?? 0;
        }
        updated.abilityScores = scores;
      }
      if (playerChoices.asiChoice?.type === 'feat') {
        updated.features = [...(updated.features || []), playerChoices.asiChoice.featId];
      }
      if (playerChoices.subclassId) {
        updated.subclass = playerChoices.subclassId;
      }
      updated.level = newLevel;
      updated.maxHp = newMaxHp;
      updated.hp = newMaxHp; // Full heal on level up
      updated.proficiencyBonus = newProficiencyBonus;
      if (levelUpMeta.newMaxSpellSlots) {
        updated.maxSpellSlots = levelUpMeta.newMaxSpellSlots;
        updated.spellSlots = levelUpMeta.newMaxSpellSlots;
      }

      setCharacter(updated);
      clearLevelUpMeta();

      if (hapticsEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (err) {
      setSaving(false);
    }
  }, [saving, choices, asiMode, asiPoints, selectedFeat, selectedSubclass, character, levelUpMeta, newLevel, newMaxHp, newProficiencyBonus]);

  // ─── Render: Ceremony Phase ─────────────────────
  if (phase === 'ceremony') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.ceremonyCenter}>
          <Animated.View style={titleStyle}>
            <Text style={styles.levelUpTitle}>LEVEL UP</Text>
            <Text style={styles.levelNumber}>{oldLevel} → {newLevel}</Text>
          </Animated.View>

          {ceremonyStep >= 1 && (
            <Animated.View entering={FadeInDown.duration(300)} style={styles.statsRow}>
              <StatTickerRow label="MAX HP" oldValue={character.maxHp} newValue={newMaxHp} delay={0} />
            </Animated.View>
          )}

          {ceremonyStep >= 2 && (
            <Animated.View entering={FadeInDown.duration(300)} style={styles.statsRow}>
              <StatTickerRow label="PROFICIENCY" oldValue={character.proficiencyBonus} newValue={newProficiencyBonus} prefix="+" delay={0} />
            </Animated.View>
          )}

          {ceremonyStep >= 3 && choices.newFeatures.length > 0 && (
            <Animated.View entering={FadeInDown.duration(300)} style={styles.featuresContainer}>
              <Text style={styles.sectionLabel}>NEW FEATURES</Text>
              {choices.newFeatures.map((f, i) => (
                <Text key={i} style={styles.featureText}>{f}</Text>
              ))}
            </Animated.View>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // ─── Render: ASI / Feat Phase ───────────────────
  if (phase === 'asi') {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.phaseTitle}>ABILITY SCORE IMPROVEMENT</Text>
          <Text style={styles.phaseSubtitle}>Choose +2 to one ability or +1 to two abilities, or select a feat</Text>

          {/* Toggle: ASI vs Feat */}
          <View style={styles.toggleRow}>
            <Pressable
              style={[styles.toggleBtn, asiMode === 'asi' && styles.toggleActive]}
              onPress={() => setAsiMode('asi')}
            >
              <Text style={[styles.toggleText, asiMode === 'asi' && styles.toggleTextActive]}>
                Ability Scores
              </Text>
            </Pressable>
            <Pressable
              style={[styles.toggleBtn, asiMode === 'feat' && styles.toggleActive]}
              onPress={() => setAsiMode('feat')}
            >
              <Text style={[styles.toggleText, asiMode === 'feat' && styles.toggleTextActive]}>
                Choose a Feat
              </Text>
            </Pressable>
          </View>

          {asiMode === 'asi' && (
            <View style={styles.asiGrid}>
              <Text style={styles.pointsLeft}>Points: {2 - totalAsiSpent} / 2</Text>
              {(Object.keys(ABILITY_LABELS) as AbilityScore[]).map((ability) => {
                const current = character.abilityScores[ability];
                const bonus = asiPoints[ability];
                return (
                  <View key={ability} style={styles.asiRow}>
                    <Text style={styles.asiLabel}>{ABILITY_LABELS[ability]}</Text>
                    <Text style={styles.asiScore}>{current}{bonus > 0 ? ` (+${bonus})` : ''}</Text>
                    <View style={styles.asiButtons}>
                      <Pressable
                        style={[styles.asiBtn, bonus <= 0 && styles.asiBtnDisabled]}
                        onPress={() => handleAsiChange(ability, -1)}
                        disabled={bonus <= 0}
                      >
                        <Text style={styles.asiBtnText}>−</Text>
                      </Pressable>
                      <Pressable
                        style={[styles.asiBtn, (totalAsiSpent >= 2 || current + bonus >= 20) && styles.asiBtnDisabled]}
                        onPress={() => handleAsiChange(ability, 1)}
                        disabled={totalAsiSpent >= 2 || current + bonus >= 20}
                      >
                        <Text style={styles.asiBtnText}>+</Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {asiMode === 'feat' && (
            <View style={styles.featList}>
              {availableFeats.map((feat) => (
                <Pressable
                  key={feat.id}
                  onPress={() => {
                    setSelectedFeat(selectedFeat?.id === feat.id ? null : feat);
                    if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <FantasyPanel
                    variant="strip"
                    style={{ ...styles.featCard, ...(selectedFeat?.id === feat.id ? styles.featCardSelected : {}) }}
                  >
                    <Text style={styles.featName}>{feat.name}</Text>
                    <Text style={styles.featDesc}>{feat.mechanicalEffect}</Text>
                    {feat.prerequisite.type !== 'none' && (
                      <Text style={styles.featPrereq}>Requires: {feat.prerequisite.description || feat.prerequisite.type}</Text>
                    )}
                  </FantasyPanel>
                </Pressable>
              ))}
            </View>
          )}

          <View style={styles.navRow}>
            <FantasyButton
              variant="primary"
              label="Continue"
              onPress={advancePhase}
              disabled={(asiMode === 'asi' && totalAsiSpent === 0) || (asiMode === 'feat' && !selectedFeat)}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Render: Subclass Phase ─────────────────────
  if (phase === 'subclass') {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.phaseTitle}>CHOOSE YOUR PATH</Text>
          <Text style={styles.phaseSubtitle}>Select a subclass specialization</Text>

          {availableSubclasses.map((sc, i) => (
            <Animated.View key={sc.id} entering={FadeInDown.delay(i * 80).duration(200)}>
              <Pressable
                onPress={() => {
                  setSelectedSubclass(selectedSubclass?.id === sc.id ? null : sc);
                  if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <FantasyPanel
                  variant="card"
                  style={{ ...styles.subclassCard, ...(selectedSubclass?.id === sc.id ? styles.subclassCardSelected : {}) }}
                >
                  <Text style={styles.subclassName}>{sc.name}</Text>
                  <Text style={styles.subclassDesc}>{sc.description}</Text>
                  {sc.features.filter(f => f.level <= newLevel).slice(0, 2).map((feat, j) => (
                    <View key={j} style={styles.subclassFeature}>
                      <Text style={styles.subclassFeatureName}>{feat.name}</Text>
                      <Text style={styles.subclassFeatureDesc}>{feat.description}</Text>
                    </View>
                  ))}
                </FantasyPanel>
              </Pressable>
            </Animated.View>
          ))}

          <View style={styles.navRow}>
            <FantasyButton
              variant="primary"
              label="Continue"
              onPress={advancePhase}
              disabled={!selectedSubclass}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Render: Spells Phase (placeholder for now) ─
  if (phase === 'spells') {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.phaseTitle}>NEW SPELLS</Text>
          <Text style={styles.phaseSubtitle}>
            {choices.newSpells?.canLearnNew
              ? `You can learn ${choices.newSpells.newSpellCount} new spell${choices.newSpells.newSpellCount > 1 ? 's' : ''} (up to level ${choices.newSpells.maxNewSpellLevel})`
              : 'Your spell preparation has expanded'}
          </Text>

          {choices.newSpells?.preparedCount && (
            <Text style={styles.preparedNote}>
              You can now prepare {choices.newSpells.preparedCount} spells each day
            </Text>
          )}

          {choices.newSpells?.canSwap && (
            <Text style={styles.swapNote}>
              You may also swap one known spell for a different one
            </Text>
          )}

          <View style={styles.navRow}>
            <FantasyButton
              variant="primary"
              label="Continue"
              onPress={advancePhase}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Render: Confirm Phase ──────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.phaseTitle}>READY TO ADVANCE</Text>

        <FantasyPanel variant="pinned" style={styles.summaryPanel}>
          <Text style={styles.summaryTitle}>Level {newLevel} {character.className.charAt(0).toUpperCase() + character.className.slice(1)}</Text>

          {asiMode === 'asi' && totalAsiSpent > 0 && (
            <Text style={styles.summaryLine}>
              Ability Scores: {Object.entries(asiPoints).filter(([, v]) => v > 0).map(([k, v]) => `${ABILITY_LABELS[k as AbilityScore]} +${v}`).join(', ')}
            </Text>
          )}
          {asiMode === 'feat' && selectedFeat && (
            <Text style={styles.summaryLine}>Feat: {selectedFeat.name}</Text>
          )}
          {selectedSubclass && (
            <Text style={styles.summaryLine}>Subclass: {selectedSubclass.name}</Text>
          )}
          <Text style={styles.summaryLine}>Max HP: {newMaxHp}</Text>
          <Text style={styles.summaryLine}>Proficiency Bonus: +{newProficiencyBonus}</Text>
          {choices.newFeatures.length > 0 && (
            <Text style={styles.summaryLine}>New: {choices.newFeatures.join(', ')}</Text>
          )}
        </FantasyPanel>

        <View style={styles.navRow}>
          <FantasyButton
            variant="primary"
            label={saving ? 'Saving...' : 'CONFIRM LEVEL UP'}
            onPress={handleConfirm}
            disabled={saving}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },

  // Ceremony
  ceremonyCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  levelUpTitle: {
    fontFamily: fonts.heading,
    fontSize: 36,
    color: colors.gold.bright,
    letterSpacing: 4,
    textAlign: 'center',
    textShadowColor: 'rgba(180,140,60,0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  levelNumber: {
    fontFamily: fonts.heading,
    fontSize: 48,
    color: colors.text.primary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  statsRow: {
    marginTop: spacing.lg,
    width: '100%',
    maxWidth: 280,
  },
  featuresContainer: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  featureText: {
    fontFamily: fonts.narrative,
    fontSize: 16,
    color: colors.gold.primary,
    marginTop: spacing.xs,
  },

  // Phase headers
  phaseTitle: {
    fontFamily: fonts.heading,
    fontSize: 20,
    color: colors.gold.bright,
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  phaseSubtitle: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 20,
  },
  sectionLabel: {
    ...textStyles.sectionLabel,
    color: colors.gold.muted,
    marginBottom: spacing.sm,
  },

  // Toggle
  toggleRow: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.gold.border,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    backgroundColor: colors.bg.secondary,
  },
  toggleActive: {
    backgroundColor: colors.gold.dim,
  },
  toggleText: {
    fontFamily: fonts.headingRegular,
    fontSize: 12,
    color: colors.text.tertiary,
    letterSpacing: 1,
  },
  toggleTextActive: {
    color: colors.gold.bright,
  },

  // ASI
  asiGrid: {
    marginBottom: spacing.lg,
  },
  pointsLeft: {
    fontFamily: fonts.headingRegular,
    fontSize: 12,
    color: colors.gold.primary,
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  asiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gold.border,
  },
  asiLabel: {
    fontFamily: fonts.heading,
    fontSize: 14,
    color: colors.text.primary,
    width: 50,
    letterSpacing: 1,
  },
  asiScore: {
    fontFamily: fonts.heading,
    fontSize: 18,
    color: colors.gold.bright,
    flex: 1,
    textAlign: 'center',
  },
  asiButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  asiBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bg.tertiary,
    borderWidth: 1,
    borderColor: colors.gold.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  asiBtnDisabled: {
    opacity: 0.3,
  },
  asiBtnText: {
    fontFamily: fonts.heading,
    fontSize: 18,
    color: colors.gold.primary,
  },

  // Feats
  featList: {
    gap: spacing.sm,
  },
  featCard: {
    marginBottom: 0,
  },
  featCardSelected: {
    borderColor: colors.gold.primary,
    borderWidth: 2,
  },
  featName: {
    fontFamily: fonts.heading,
    fontSize: 14,
    color: PARCHMENT_TEXT.primary,
    letterSpacing: 0.5,
  },
  featDesc: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: PARCHMENT_TEXT.secondary,
    marginTop: 4,
    lineHeight: 18,
  },
  featPrereq: {
    fontFamily: fonts.bodyItalic,
    fontSize: 10,
    color: PARCHMENT_TEXT.accent,
    marginTop: 4,
  },

  // Subclass
  subclassCard: {
    marginBottom: spacing.sm,
  },
  subclassCardSelected: {
    borderColor: colors.gold.primary,
    borderWidth: 2,
  },
  subclassName: {
    fontFamily: fonts.heading,
    fontSize: 16,
    color: PARCHMENT_TEXT.primary,
    letterSpacing: 1,
  },
  subclassDesc: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: PARCHMENT_TEXT.secondary,
    marginTop: 4,
    lineHeight: 20,
  },
  subclassFeature: {
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(90,58,24,0.25)',
  },
  subclassFeatureName: {
    fontFamily: fonts.headingRegular,
    fontSize: 11,
    color: PARCHMENT_TEXT.accent,
    letterSpacing: 0.5,
  },
  subclassFeatureDesc: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: PARCHMENT_TEXT.secondary,
    lineHeight: 16,
    marginTop: 2,
  },

  // Spells
  preparedNote: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.gold.primary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  swapNote: {
    fontFamily: fonts.bodyItalic,
    fontSize: 13,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },

  // Summary
  summaryPanel: {
    marginBottom: spacing.xl,
  },
  summaryTitle: {
    fontFamily: fonts.heading,
    fontSize: 16,
    color: PARCHMENT_TEXT.accent,
    letterSpacing: 1,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  summaryLine: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: PARCHMENT_TEXT.primary,
    marginBottom: spacing.xs,
    lineHeight: 20,
  },

  // Nav
  navRow: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
});
