// Campaign Start — Choose generated or custom adventure
// Shown after character creation, before first game turn

import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors } from '@/theme/colors';
import { fonts, spacing, textStyles } from '@/theme/typography';
import { initCampaign } from '@/services/campaign';
import { useGameStore } from '@/stores/useGameStore';
import { getCharacter } from '@/services/character';

type CampaignMode = 'generated' | 'custom';

export default function CampaignStartScreen() {
  const router = useRouter();
  const { characterId, companions: companionsJson } = useLocalSearchParams<{ characterId: string; companions?: string }>();
  const [mode, setMode] = useState<CampaignMode | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStart() {
    if (!characterId) {
      setError('No character found. Please go back and try again.');
      return;
    }
    if (mode === 'custom' && !customPrompt.trim()) {
      setError('Please describe what kind of adventure you want.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Parse companions from route params if provided
      const parsedCompanions = companionsJson ? JSON.parse(companionsJson) : undefined;

      // Call campaign-init Edge Function
      const result = await initCampaign({
        characterId,
        mode: mode!,
        customPrompt: mode === 'custom' ? customPrompt.trim() : undefined,
        companions: parsedCompanions,
      });

      // Load character and hydrate game store
      const character = await getCharacter(characterId);
      const store = useGameStore.getState();
      store.setCharacter(character);

      // Build campaign object for store
      const campaign = {
        id: result.campaignId,
        userId: character.userId,
        characterId: character.id,
        name: `${character.name}'s Adventure`,
        worldId: '',
        currentLocation: result.aiResponse.location || 'Unknown',
        currentMood: result.aiResponse.mood || 'tavern' as any,
        currentMode: result.aiResponse.mode || 'exploration' as any,
        companions: result.companions,
        combatState: { isActive: false, round: 0, turnIndex: 0, initiativeOrder: [], enemies: [] },
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
          preference: 'balanced' as const,
        },
        turnCount: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      store.setCampaign(campaign);
      store.processAIResponse(result.aiResponse);
      store.setNarrationComplete(false);

      // Navigate to game
      router.replace('/game/session');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start campaign';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.gold.primary} />
          <Text style={styles.loadingText}>
            {mode === 'custom' ? 'Crafting your adventure...' : 'Generating your world...'}
          </Text>
          <Text style={styles.loadingSubtext}>The Dungeon Master prepares...</Text>
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
          <Text style={styles.title}>Begin Your Adventure</Text>
          <Text style={styles.subtitle}>How would you like to start?</Text>
        </View>

        {/* Options */}
        <View style={styles.options}>
          <Pressable
            style={[styles.optionCard, mode === 'generated' && styles.optionCardSelected]}
            onPress={() => setMode('generated')}
          >
            <Text style={styles.optionIcon}>🎲</Text>
            <Text style={styles.optionTitle}>GENERATE FOR ME</Text>
            <Text style={styles.optionDesc}>
              The DM creates a unique adventure based on your character's race, class, and origin.
            </Text>
          </Pressable>

          <Pressable
            style={[styles.optionCard, mode === 'custom' && styles.optionCardSelected]}
            onPress={() => setMode('custom')}
          >
            <Text style={styles.optionIcon}>✍️</Text>
            <Text style={styles.optionTitle}>CUSTOM ADVENTURE</Text>
            <Text style={styles.optionDesc}>
              Describe the adventure you want and the DM will bring it to life.
            </Text>
          </Pressable>
        </View>

        {/* Custom prompt input */}
        {mode === 'custom' && (
          <View style={styles.promptSection}>
            <Text style={styles.promptLabel}>DESCRIBE YOUR ADVENTURE</Text>
            <TextInput
              style={styles.promptInput}
              value={customPrompt}
              onChangeText={setCustomPrompt}
              placeholder='e.g., "A heist in a floating city" or "Investigate disappearances in a cursed swamp"'
              placeholderTextColor={colors.text.tertiary}
              multiline
              maxLength={300}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{customPrompt.length}/300</Text>
          </View>
        )}

        {/* Error */}
        {error && <Text style={styles.errorText}>{error}</Text>}

        {/* Start button */}
        <View style={styles.footer}>
          <Pressable
            style={[styles.startButton, !mode && styles.startButtonDisabled]}
            onPress={handleStart}
            disabled={!mode}
          >
            <Text style={styles.startButtonText}>BEGIN</Text>
          </Pressable>
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
    fontStyle: 'italic',
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
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
  options: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  optionCard: {
    borderWidth: 1.5,
    borderColor: colors.gold.border,
    borderRadius: 12,
    padding: spacing.lg,
    backgroundColor: colors.bg.tertiary,
  },
  optionCardSelected: {
    borderColor: colors.gold.primary,
    backgroundColor: colors.bg.secondary,
  },
  optionIcon: {
    fontSize: 28,
    marginBottom: spacing.sm,
  },
  optionTitle: {
    fontFamily: fonts.heading,
    fontSize: 13,
    color: colors.gold.primary,
    letterSpacing: 2,
    marginBottom: spacing.xs,
  },
  optionDesc: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 19,
  },
  promptSection: {
    paddingHorizontal: spacing.xl,
    marginTop: spacing.lg,
  },
  promptLabel: {
    ...textStyles.sectionLabel,
    color: colors.text.tertiary,
    marginBottom: spacing.sm,
  },
  promptInput: {
    borderWidth: 1,
    borderColor: colors.gold.border,
    borderRadius: 8,
    padding: spacing.md,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.text.primary,
    backgroundColor: colors.bg.secondary,
    minHeight: 100,
    lineHeight: 20,
  },
  charCount: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.text.tertiary,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  errorText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.combat.red,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
    marginTop: spacing.md,
  },
  footer: {
    marginTop: 'auto',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    paddingTop: spacing.md,
  },
  startButton: {
    backgroundColor: colors.gold.primary,
    paddingVertical: spacing.lg,
    borderRadius: 8,
    alignItems: 'center',
  },
  startButtonDisabled: {
    opacity: 0.4,
  },
  startButtonText: {
    ...textStyles.buttonLabel,
    color: colors.bg.primary,
    fontSize: 15,
    fontFamily: fonts.heading,
    letterSpacing: 2,
  },
});
