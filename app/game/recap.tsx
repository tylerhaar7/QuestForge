// Session Recap Screen — "Previously on..." dramatic summary before resuming a campaign
// Fetches AI-generated recap text and displays it with typewriter narration + fade-in header.

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  Pressable,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { colors } from '@/theme/colors';
import { fonts, spacing } from '@/theme/typography';
import { useGameStore } from '@/stores/useGameStore';
import { getSessionRecap } from '@/services/campaign';
import { NarrativeText } from '@/components/game/NarrativeText';
import { FantasyPanel, FantasyButton } from '@/components/ui';

export default function RecapScreen() {
  const router = useRouter();
  const { campaign } = useGameStore();

  const [recap, setRecap] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [narrationComplete, setNarrationComplete] = useState(false);

  // Fade-in animation for the "Previously on..." header
  const headerOpacity = useSharedValue(0);
  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  // Fade-in for the continue button (appears after narration completes)
  const buttonOpacity = useSharedValue(0);
  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
  }));

  const handleContinue = useCallback(() => {
    router.replace('/game/session');
  }, [router]);

  const handleNarrationComplete = useCallback(() => {
    setNarrationComplete(true);
    buttonOpacity.value = withTiming(1, { duration: 600 });
  }, [buttonOpacity]);

  useEffect(() => {
    if (!campaign) {
      // No campaign — skip straight to session
      router.replace('/game/session');
      return;
    }

    let cancelled = false;

    async function fetchRecap() {
      setIsLoading(true);
      setError(null);

      try {
        const text = await getSessionRecap(campaign!.id);
        if (!cancelled) {
          setRecap(text);
          setIsLoading(false);
          // Fade in header once content is ready
          headerOpacity.value = withDelay(200, withTiming(1, { duration: 800 }));
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Could not load recap';
          setError(message);
          setIsLoading(false);
          // Still show header even on error
          headerOpacity.value = withDelay(200, withTiming(1, { duration: 800 }));
        }
      }
    }

    fetchRecap();

    return () => {
      cancelled = true;
    };
  }, [campaign?.id]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Skip button — top-right corner */}
      <Pressable style={styles.skipButton} onPress={handleContinue}>
        <Text style={styles.skipText}>Skip</Text>
      </Pressable>

      {/* "Previously on..." header */}
      <Animated.View style={[styles.headerContainer, headerAnimatedStyle]}>
        <Text style={styles.headerLabel}>Previously on...</Text>
        {campaign?.name ? (
          <Text style={styles.campaignName}>{campaign.name}</Text>
        ) : null}
      </Animated.View>

      {/* Content area */}
      <View style={styles.contentArea}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.gold.primary} />
            <Text style={styles.loadingText}>Recalling your tale...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <FantasyButton
              label="Continue Your Adventure"
              onPress={handleContinue}
              style={styles.errorButton}
            />
          </View>
        ) : (
          <FantasyPanel variant="pinned" style={styles.recapPanel}>
            <NarrativeText
              text={recap}
              onComplete={handleNarrationComplete}
            />
          </FantasyPanel>
        )}
      </View>

      {/* Continue button — shown after narration finishes */}
      {!isLoading && !error && (
        <Animated.View style={[styles.continueContainer, buttonAnimatedStyle]}>
          <FantasyButton
            label="Continue Your Adventure"
            onPress={handleContinue}
            disabled={!narrationComplete}
            style={!narrationComplete ? styles.continueButtonHidden : undefined}
          />
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },

  // Skip button
  skipButton: {
    position: 'absolute',
    top: spacing.xl,
    right: spacing.lg,
    zIndex: 10,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  skipText: {
    fontFamily: fonts.headingRegular,
    fontSize: 13,
    color: colors.text.tertiary,
    letterSpacing: 1,
  },

  // "Previously on..." header
  headerContainer: {
    alignItems: 'center',
    paddingTop: spacing.xxl + spacing.xl,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  headerLabel: {
    fontFamily: fonts.heading,
    fontSize: 22,
    letterSpacing: 3,
    color: colors.gold.primary,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  campaignName: {
    fontFamily: fonts.narrativeItalic ?? fonts.narrative,
    fontSize: 15,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },

  // Narration area
  contentArea: {
    flex: 1,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: fonts.narrative,
    fontSize: 14,
    color: colors.text.tertiary,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },

  // Error
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  errorText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.combat.red,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  errorButton: {
    alignSelf: 'stretch',
  },

  // Recap narration panel
  recapPanel: {
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
  },

  // Continue button
  continueContainer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  continueButtonHidden: {
    opacity: 0,
  },
});
