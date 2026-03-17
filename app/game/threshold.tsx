// Threshold — Hades-inspired death screen
// The Keeper greets the player between lives; unlocks are revealed here.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors, PARCHMENT_TEXT } from '@/theme/colors';
import { fonts, spacing } from '@/theme/typography';
import { useGameStore } from '@/stores/useGameStore';
import { useShallow } from 'zustand/react/shallow';
import { submitAction } from '@/services/campaign';
import { NarrativeText } from '@/components/game/NarrativeText';
import { ChoiceButton } from '@/components/game/ChoiceButton';
import { FantasyPanel } from '@/components/ui';
import type { Choice } from '@/types/game';

// ─── Unlock display map ──────────────────────────────────────────────────────

const UNLOCK_LABELS: Record<string, string> = {
  threshold_access:      'The Keeper awaits',
  keeper_lore_1:         'The Keeper shares world secrets',
  spectral_gift:         'Spectral Candle — light the way',
  death_defiance:        'Death Defiance — cheat death once',
  keeper_quest:          "The Keeper's personal quest",
  threshold_companion:   'A ghostly companion awaits',
};

// ─── Animated unlock card ────────────────────────────────────────────────────

interface UnlockCardProps {
  unlockId: string;
  index: number;
}

function UnlockCard({ unlockId, index }: UnlockCardProps) {
  const glow = useSharedValue(0);

  useEffect(() => {
    // Stagger each card's glow start slightly
    const timer = setTimeout(() => {
      glow.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.3, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      );
    }, index * 200);
    return () => clearTimeout(timer);
  }, [glow, index]);

  const glowStyle = useAnimatedStyle(() => ({
    shadowOpacity: glow.value * 0.6,
    shadowRadius: glow.value * 12,
  }));

  const label = UNLOCK_LABELS[unlockId] ?? unlockId;

  return (
    <Animated.View style={[styles.unlockCardWrapper, glowStyle]}>
      <FantasyPanel variant="card" style={styles.unlockCard}>
        <View style={styles.unlockCardInner}>
          <Text style={styles.unlockIcon}>✦</Text>
          <Text style={styles.unlockLabel}>{label}</Text>
        </View>
      </FantasyPanel>
    </Animated.View>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function ThresholdScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ deathCount?: string; newUnlocks?: string }>();

  const deathCount = Number(params.deathCount ?? 1);
  const newUnlocks: string[] = React.useMemo(() => {
    try {
      return params.newUnlocks ? JSON.parse(params.newUnlocks) : [];
    } catch {
      return [];
    }
  }, [params.newUnlocks]);

  const {
    campaign,
    isLoading,
    currentNarration,
    currentChoices,
    isNarrationComplete,
  } = useGameStore(
    useShallow((s) => ({
      campaign: s.campaign,
      isLoading: s.isLoading,
      currentNarration: s.currentNarration,
      currentChoices: s.currentChoices,
      isNarrationComplete: s.isNarrationComplete,
    })),
  );
  const setNarrationComplete = useGameStore((s) => s.setNarrationComplete);

  // Phase: 'intro' → show death fade text; 'keeper' → show Keeper narration
  const [phase, setPhase] = useState<'intro' | 'keeper'>('intro');

  // Intro fade animation
  const introOpacity = useSharedValue(0);
  const introStyle = useAnimatedStyle(() => ({ opacity: introOpacity.value }));

  const hasCalledKeeper = useRef(false);

  const fetchKeeperGreeting = useCallback(async () => {
    if (!campaign || hasCalledKeeper.current) return;
    hasCalledKeeper.current = true;

    const store = useGameStore.getState();
    store.setLoading(true);
    store.setNarrationComplete(false);
    store.setError(null);

    // Build a context-rich message so the AI knows what to reference
    const allUnlocks = campaign.thresholdUnlocks || [];
    const unlockList = allUnlocks.length > 0 ? allUnlocks.join(', ') : 'none';
    const hasKeeperQuest = allUnlocks.includes('keeper_quest');

    let actionMessage = `I have died and arrived at the Threshold. This is visit #${deathCount}. My unlocks: [${unlockList}].`;
    if (hasKeeperQuest) {
      actionMessage += ' I am searching for the Keeper\'s true name.';
    }

    try {
      const result = await submitAction(campaign.id, actionMessage);

      if (result.companions) {
        store.setCampaign({
          ...store.campaign!,
          companions: result.companions,
          turnCount: result.turnCount,
        });
      }

      store.processAIResponse(result.aiResponse);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      store.setError(message);
    } finally {
      store.setLoading(false);
    }
  }, [campaign, deathCount]);

  // On mount: fade in intro text, then after 2 s transition to Keeper phase
  useEffect(() => {
    introOpacity.value = withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) });

    const timer = setTimeout(() => {
      setPhase('keeper');
      fetchKeeperGreeting();
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleNarrationComplete = useCallback(() => {
    setNarrationComplete(true);
  }, [setNarrationComplete]);

  const handleChoice = useCallback(
    async (choice: Choice) => {
      if (!campaign) return;

      // "Return to the world" — reset mood and mode, then navigate back
      const text = choice.text.toLowerCase();
      if (text.includes('return') && (text.includes('world') || text.includes('living'))) {
        const store = useGameStore.getState();
        // Reset mood and mode so the session screen isn't stuck on threshold
        if (store.campaign) {
          store.setCampaign({ ...store.campaign, currentMood: 'town', currentMode: 'exploration' });
        }
        store.processAIResponse({
          narration: 'You open your eyes. The world rushes back — color, sound, the ache of living. You are alive again.',
          choices: [],
          mode: 'exploration',
          mood: 'town',
        });
        router.replace('/game/session');
        return;
      }

      const store = useGameStore.getState();
      store.setLoading(true);
      store.setNarrationComplete(false);
      store.setError(null);

      try {
        const result = await submitAction(campaign.id, choice.text);

        if (result.companions) {
          store.setCampaign({
            ...store.campaign!,
            companions: result.companions,
            turnCount: result.turnCount,
          });
        }

        store.processAIResponse(result.aiResponse);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Something went wrong';
        store.setError(message);
      } finally {
        store.setLoading(false);
      }
    },
    [campaign, router],
  );

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container}>
      {/* Visit counter — top-right */}
      <View style={styles.visitBadge}>
        <Text style={styles.visitText}>Visit #{deathCount}</Text>
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro phase — fading death text */}
        {phase === 'intro' && (
          <Animated.View style={[styles.introContainer, introStyle]}>
            <Text style={styles.introText}>The darkness takes you...</Text>
            <Text style={styles.introSubText}>
              You feel yourself drawn toward a pale light.
            </Text>
          </Animated.View>
        )}

        {/* Keeper phase — narration + choices */}
        {phase === 'keeper' && (
          <>
            {/* Section label */}
            <Text style={styles.sectionLabel}>The Threshold</Text>

            {/* Keeper narration */}
            <View style={styles.narrativeArea}>
              {isLoading ? (
                <View style={styles.loading}>
                  <ActivityIndicator size="small" color={colors.gold.primary} />
                  <Text style={styles.loadingText}>
                    The Keeper stirs from the mist...
                  </Text>
                </View>
              ) : (
                <NarrativeText
                  text={currentNarration}
                  onComplete={handleNarrationComplete}
                />
              )}
            </View>

            {/* New unlocks */}
            {newUnlocks.length > 0 && (
              <View style={styles.unlocksSection}>
                <Text style={styles.unlocksSectionLabel}>Unlocked</Text>
                {newUnlocks.map((id, i) => (
                  <UnlockCard key={id} unlockId={id} index={i} />
                ))}
              </View>
            )}

            {/* Choices */}
            {isNarrationComplete && !isLoading && currentChoices.length > 0 && (
              <View style={styles.choiceArea}>
                {currentChoices.map((choice, index) => (
                  <ChoiceButton
                    key={index}
                    choice={choice}
                    onPress={handleChoice}
                    disabled={isLoading}
                  />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const THRESHOLD_BG = '#0e0818';       // Deep purple-black
const THRESHOLD_PANEL = '#130d22';    // Slightly lighter panel
const THRESHOLD_CARD_BG = '#1a0a2e'; // Per spec

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THRESHOLD_BG,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.xxl,
  },

  // ── Visit badge ──────────────────────────────────────────────────────────
  visitBadge: {
    alignSelf: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  visitText: {
    fontFamily: fonts.headingRegular,
    fontSize: 11,
    letterSpacing: 1.5,
    color: colors.gold.muted,
    textTransform: 'uppercase',
  },

  // ── Intro phase ──────────────────────────────────────────────────────────
  introContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    paddingTop: 80,
  },
  introText: {
    fontFamily: fonts.narrative,
    fontSize: 22,
    color: '#c8b8e8',           // Soft ethereal lavender-white
    textAlign: 'center',
    lineHeight: 34,
    marginBottom: spacing.lg,
  },
  introSubText: {
    fontFamily: fonts.narrativeItalic,
    fontSize: 15,
    color: '#8070a0',           // Dim purple-grey
    textAlign: 'center',
    lineHeight: 24,
    fontStyle: 'italic',
  },

  // ── Keeper section ───────────────────────────────────────────────────────
  sectionLabel: {
    fontFamily: fonts.heading,
    fontSize: 11,
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: colors.gold.muted,
    textAlign: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  narrativeArea: {
    minHeight: 200,
    backgroundColor: THRESHOLD_PANEL,
    marginHorizontal: spacing.lg,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(180,140,60,0.12)',
    overflow: 'hidden',
  },
  loading: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontFamily: fonts.narrativeItalic,
    fontSize: 14,
    color: '#8070a0',
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },

  // ── Unlocks ──────────────────────────────────────────────────────────────
  unlocksSection: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
  },
  unlocksSectionLabel: {
    fontFamily: fonts.heading,
    fontSize: 10,
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: colors.gold.muted,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  unlockCardWrapper: {
    marginBottom: spacing.sm,
    // Glow shadow (animated opacity set in component)
    shadowColor: colors.gold.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 8,
    elevation: 4,
  },
  unlockCard: {
    width: '100%',
  },
  unlockCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unlockIcon: {
    fontSize: 14,
    color: PARCHMENT_TEXT.accent,
    marginRight: spacing.sm,
  },
  unlockLabel: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: PARCHMENT_TEXT.primary,
    flex: 1,
    lineHeight: 22,
  },

  // ── Choices ──────────────────────────────────────────────────────────────
  choiceArea: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
});
