import React from 'react';
import { View, Text, Pressable, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/theme/colors';
import { fonts, spacing, textStyles } from '@/theme/typography';
import { useCharacterCreationStore } from '@/stores/useCharacterCreationStore';

export default function CreateWelcomeScreen() {
  const router = useRouter();
  const reset = useCharacterCreationStore(s => s.reset);

  const handleStart = (track: 'new' | 'veteran') => {
    reset();  // Clear any previous creation state
    if (track === 'new') {
      router.push('/create/tutorial');
    } else {
      router.push('/create/race');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Create Your{'\n'}Character</Text>
        <Text style={styles.subtitle}>
          Every legend begins with a single choice.
        </Text>

        <View style={styles.buttons}>
          <Pressable
            style={styles.trackButton}
            onPress={() => handleStart('veteran')}
          >
            <Text style={styles.trackTitle}>I KNOW D&D</Text>
            <Text style={styles.trackDesc}>
              Jump straight into character creation.
            </Text>
          </Pressable>

          <Pressable
            style={[styles.trackButton, styles.trackButtonAlt]}
            onPress={() => handleStart('new')}
          >
            <Text style={styles.trackTitle}>I'M NEW</Text>
            <Text style={styles.trackDesc}>
              A guided tutorial will teach you as you play.
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  title: {
    ...textStyles.screenTitle,
    color: colors.gold.primary,
    textAlign: 'center',
    fontSize: 28,
    lineHeight: 38,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontFamily: fonts.narrative,
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xxl + spacing.lg,
  },
  buttons: {
    gap: spacing.lg,
  },
  trackButton: {
    borderWidth: 1,
    borderColor: colors.gold.primary,
    borderRadius: 12,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.bg.secondary,
  },
  trackButtonAlt: {
    borderColor: colors.gold.dim,
  },
  trackTitle: {
    ...textStyles.buttonLabel,
    color: colors.gold.primary,
    fontSize: 14,
    marginBottom: spacing.xs,
  },
  trackDesc: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },
});
