// Tutorial Class Picker — "The First Door"
// Quick-start tutorial with pre-built classes

import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors, PARCHMENT_TEXT } from '@/theme/colors';
import { fonts, spacing, textStyles } from '@/theme/typography';
import { FantasyPanel, FantasyButton } from '@/components/ui';
import { TUTORIAL_CLASSES, type TutorialClassOption } from '@/data/tutorial';
import { createCharacter } from '@/services/character';
import { initCampaign } from '@/services/campaign';
import { getCurrentUserId } from '@/services/supabase';
import { useGameStore } from '@/stores/useGameStore';
import type { ClassName } from '@/types/game';

function ClassCard({
  cls,
  selected,
  onPress,
}: {
  cls: TutorialClassOption;
  selected: boolean;
  onPress: () => void;
}) {
  const classColor = colors.class[cls.className];

  return (
    <Pressable onPress={onPress} style={{ opacity: selected ? 1 : 0.85 }}>
      <FantasyPanel variant="card">
        <View style={styles.cardTop}>
          <Text style={[styles.cardIcon, { color: classColor }]}>{cls.icon}</Text>
          <View style={styles.cardInfo}>
            <Text style={[styles.cardName, selected && styles.cardNameSelected]}>
              {cls.className.toUpperCase()}
            </Text>
            <Text style={styles.cardDesc}>{cls.description}</Text>
          </View>
        </View>
        <View style={styles.cardStats}>
          <View style={styles.statBadge}>
            <Text style={styles.statLabel}>HP</Text>
            <Text style={styles.statValue}>{cls.hp}</Text>
          </View>
          <View style={styles.statBadge}>
            <Text style={styles.statLabel}>AC</Text>
            <Text style={styles.statValue}>{cls.ac}</Text>
          </View>
          <View style={styles.statBadge}>
            <Text style={styles.statLabel}>SPD</Text>
            <Text style={styles.statValue}>{cls.speed}</Text>
          </View>
        </View>
      </FantasyPanel>
    </Pressable>
  );
}

export default function TutorialScreen() {
  const router = useRouter();
  const [selectedClass, setSelectedClass] = useState<TutorialClassOption | null>(null);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSelectClass(cls: TutorialClassOption) {
    setSelectedClass(cls);
    setName(cls.defaultName);
    setError(null);
  }

  async function handleBegin() {
    if (!selectedClass) return;

    setSaving(true);
    setError(null);

    try {
      const userId = await getCurrentUserId();

      // Create character from selected tutorial class
      const savedChar = await createCharacter({
        userId,
        name: name.trim() || selectedClass.defaultName,
        race: 'human',
        className: selectedClass.className,
        subclass: '',
        level: 1,
        xp: 0,
        abilityScores: selectedClass.abilityScores,
        hp: selectedClass.hp,
        maxHp: selectedClass.maxHp,
        tempHp: 0,
        ac: selectedClass.ac,
        speed: selectedClass.speed,
        proficiencyBonus: 2,
        proficientSkills: selectedClass.proficientSkills,
        proficientSaves: selectedClass.proficientSaves,
        spellSlots: [],
        maxSpellSlots: [],
        equipment: selectedClass.equipment,
        inventory: [],
        features: selectedClass.features,
        conditions: [],
        originStory: 'tutorial',
        originAiContext: '',
        personalQuestFlags: {},
      });

      // Initialize tutorial campaign
      const result = await initCampaign({
        characterId: savedChar.id,
        mode: 'tutorial',
      });

      // Hydrate game store
      const store = useGameStore.getState();
      store.setCharacter(savedChar);

      store.setCampaign({
        id: result.campaignId,
        userId: savedChar.userId,
        characterId: savedChar.id,
        name: 'The First Door',
        worldId: '',
        currentLocation: result.aiResponse.location || 'The First Door Inn',
        currentMood: result.aiResponse.mood || 'tavern',
        currentMode: result.aiResponse.mode || 'exploration',
        companions: result.companions,
        combatState: {
          isActive: false,
          round: 0,
          turnIndex: 0,
          initiativeOrder: [],
          enemies: [],
        },
        questLog: [],
        storySummary: '',
        deathCount: 0,
        deathHistory: [],
        thresholdUnlocks: [],
        difficultyProfile: {
          winRateLast10: 0.5,
          avgHpAtCombatEnd: 0.6,
          deaths: 0,
          sessionLengthAvg: 0,
          retryRate: 0,
          inputFrequency: 0,
          preference: 'balanced',
        },
        turnCount: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      store.processAIResponse(result.aiResponse);

      // Navigate to game session
      router.replace('/game/session');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start tutorial';
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  if (saving) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.gold.primary} />
          <Text style={styles.loadingText}>Preparing your adventure...</Text>
          <Text style={styles.loadingSubtext}>The Dungeon Master awaits</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>THE FIRST DOOR</Text>
          <Text style={styles.subtitle}>Choose your path</Text>
        </View>

        {/* Class cards */}
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
        >
          {TUTORIAL_CLASSES.map((cls) => (
            <ClassCard
              key={cls.className}
              cls={cls}
              selected={selectedClass?.className === cls.className}
              onPress={() => handleSelectClass(cls)}
            />
          ))}

          {/* Name input */}
          {selectedClass && (
            <View style={styles.nameSection}>
              <Text style={styles.nameLabel}>CHARACTER NAME</Text>
              <TextInput
                style={styles.nameInput}
                value={name}
                onChangeText={setName}
                placeholder={selectedClass.defaultName}
                placeholderTextColor={colors.text.tertiary}
                maxLength={30}
                autoCorrect={false}
              />
            </View>
          )}
        </ScrollView>

        {/* Error */}
        {error && <Text style={styles.errorText}>{error}</Text>}

        {/* Begin button */}
        <View style={styles.footer}>
          <FantasyButton
            variant="primary"
            label="BEGIN YOUR ADVENTURE"
            onPress={handleBegin}
            disabled={!selectedClass || saving}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  flex: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  loadingText: {
    fontFamily: fonts.heading,
    fontSize: 16,
    color: colors.gold.primary,
    marginTop: spacing.lg,
    letterSpacing: 1,
  },
  loadingSubtext: {
    fontFamily: fonts.narrative,
    fontSize: 14,
    color: colors.text.tertiary,
    marginTop: spacing.sm,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
    alignItems: 'center',
  },
  title: {
    ...textStyles.screenTitle,
    color: colors.gold.primary,
    fontSize: 26,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontFamily: fonts.narrative,
    fontSize: 16,
    color: colors.text.secondary,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cardIcon: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontFamily: fonts.heading,
    fontSize: 16,
    color: PARCHMENT_TEXT.primary,
    letterSpacing: 2,
    marginBottom: spacing.xs,
  },
  cardNameSelected: {
    color: PARCHMENT_TEXT.accent,
  },
  cardDesc: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: PARCHMENT_TEXT.secondary,
    lineHeight: 19,
  },
  cardStats: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statLabel: {
    fontFamily: fonts.heading,
    fontSize: 10,
    color: PARCHMENT_TEXT.label,
    letterSpacing: 1,
  },
  statValue: {
    fontFamily: fonts.heading,
    fontSize: 14,
    color: PARCHMENT_TEXT.accent,
  },
  nameSection: {
    marginTop: spacing.sm,
  },
  nameLabel: {
    ...textStyles.sectionLabel,
    color: colors.text.tertiary,
    marginBottom: spacing.sm,
  },
  nameInput: {
    borderWidth: 1,
    borderColor: colors.gold.border,
    borderRadius: 8,
    padding: spacing.md,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.text.primary,
    backgroundColor: colors.bg.secondary,
  },
  errorText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.combat.red,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.sm,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    paddingTop: spacing.md,
  },
});
