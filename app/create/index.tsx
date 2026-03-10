import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/theme/colors';
import { fonts, spacing, textStyles } from '@/theme/typography';
import { FantasyButton } from '@/components/ui';
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
      <Pressable
        style={styles.settingsGear}
        onPress={() => router.push('/settings')}
        accessibilityRole="button"
        accessibilityLabel="Settings"
      >
        <Text style={styles.settingsGearText}>{'\u2699'}</Text>
      </Pressable>
      <View style={styles.content}>
        <Text style={styles.title}>Create Your{'\n'}Character</Text>
        <Text style={styles.subtitle}>
          Every legend begins with a single choice.
        </Text>

        <View style={styles.buttons}>
          <FantasyButton
            variant="primary"
            label="I KNOW D&D"
            onPress={() => handleStart('veteran')}
          />
          <FantasyButton
            variant="secondary"
            label="I'M NEW"
            onPress={() => handleStart('new')}
          />
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
  settingsGear: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.xl,
    padding: spacing.sm,
    zIndex: 1,
  },
  settingsGearText: {
    fontFamily: fonts.heading,
    fontSize: 18,
    color: colors.gold.muted,
  },
});
