// Settings Screen — Accessibility & Preferences
// Sections: Display, Motion, Color, Input, Audio, Accessibility

import React from 'react';
import {
  View,
  Text,
  Pressable,
  Switch,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors, PARCHMENT_TEXT } from '@/theme/colors';
import { fonts, spacing, textStyles } from '@/theme/typography';
import { useSettingsStore } from '@/stores/useSettingsStore';
import type { TextSize, TextSpeed, ColorblindMode } from '@/types/settings';
import { FantasyPanel, FantasyButton } from '@/components/ui';

// --- Segmented Button Row ---

interface SegmentedOption<T extends string> {
  label: string;
  value: T;
}

function SegmentedButtons<T extends string>({
  options,
  selected,
  onSelect,
}: {
  options: SegmentedOption<T>[];
  selected: T;
  onSelect: (value: T) => void;
}) {
  return (
    <View style={segStyles.row}>
      {options.map((opt) => {
        const active = opt.value === selected;
        return (
          <Pressable
            key={opt.value}
            style={[segStyles.button, active && segStyles.buttonActive]}
            onPress={() => onSelect(opt.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={opt.label}
          >
            <Text style={[segStyles.label, active && segStyles.labelActive]}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const segStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  button: {
    flex: 1,
    paddingVertical: spacing.sm,
    backgroundColor: 'rgba(58,40,16,0.08)',
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(58,40,16,0.2)',
  },
  buttonActive: {
    backgroundColor: PARCHMENT_TEXT.accent,
    borderColor: PARCHMENT_TEXT.accent,
  },
  label: {
    fontFamily: fonts.headingRegular,
    fontSize: 12,
    color: PARCHMENT_TEXT.secondary,
    letterSpacing: 0.5,
  },
  labelActive: {
    color: '#f5ebe0',
  },
});

// --- Toggle Row ---

function ToggleRow({
  label,
  description,
  value,
  onToggle,
}: {
  label: string;
  description?: string;
  value: boolean;
  onToggle: (v: boolean) => void;
}) {
  return (
    <View style={toggleStyles.row}>
      <View style={toggleStyles.textContainer}>
        <Text style={toggleStyles.label}>{label}</Text>
        {description ? (
          <Text style={toggleStyles.description}>{description}</Text>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.bg.tertiary, true: colors.gold.dim }}
        thumbColor={value ? colors.gold.primary : colors.text.tertiary}
        accessibilityRole="switch"
        accessibilityLabel={label}
      />
    </View>
  );
}

const toggleStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textContainer: {
    flex: 1,
    marginRight: spacing.md,
  },
  label: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: PARCHMENT_TEXT.primary,
  },
  description: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: PARCHMENT_TEXT.secondary,
    marginTop: 2,
  },
});

// --- Radio Option ---

function RadioOption<T extends string>({
  label,
  value,
  selected,
  onSelect,
}: {
  label: string;
  value: T;
  selected: T;
  onSelect: (v: T) => void;
}) {
  const active = value === selected;
  return (
    <Pressable
      style={[radioStyles.option, active && radioStyles.optionActive]}
      onPress={() => onSelect(value)}
      accessibilityRole="radio"
      accessibilityState={{ checked: active }}
      accessibilityLabel={label}
    >
      <View style={[radioStyles.circle, active && radioStyles.circleActive]}>
        {active && <View style={radioStyles.dot} />}
      </View>
      <Text style={[radioStyles.label, active && radioStyles.labelActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

const radioStyles = StyleSheet.create({
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(58,40,16,0.25)',
    borderRadius: 8,
    backgroundColor: 'rgba(58,40,16,0.08)',
    marginBottom: spacing.sm,
  },
  optionActive: {
    borderColor: PARCHMENT_TEXT.accent,
    backgroundColor: 'rgba(139,69,19,0.12)',
  },
  circle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: PARCHMENT_TEXT.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  circleActive: {
    borderColor: PARCHMENT_TEXT.accent,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: PARCHMENT_TEXT.accent,
  },
  label: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: PARCHMENT_TEXT.secondary,
  },
  labelActive: {
    color: PARCHMENT_TEXT.primary,
  },
});

// --- Settings Screen ---

const TEXT_SIZE_OPTIONS: SegmentedOption<TextSize>[] = [
  { label: 'S', value: 'small' },
  { label: 'M', value: 'medium' },
  { label: 'L', value: 'large' },
  { label: 'XL', value: 'xlarge' },
];

const TEXT_SPEED_OPTIONS: SegmentedOption<TextSpeed>[] = [
  { label: 'Instant', value: 'instant' },
  { label: 'Fast', value: 'fast' },
  { label: 'Normal', value: 'normal' },
  { label: 'Slow', value: 'slow' },
];

const COLORBLIND_OPTIONS: { label: string; value: ColorblindMode }[] = [
  { label: 'None', value: 'none' },
  { label: 'Deuteranopia', value: 'deuteranopia' },
  { label: 'Protanopia', value: 'protanopia' },
  { label: 'Tritanopia', value: 'tritanopia' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const {
    accessibility,
    setTextSize,
    setHighContrast,
    setReduceMotion,
    setColorblindMode,
    setDyslexiaFont,
    setScreenReaderOptimized,
    setTextSpeed,
    setHapticFeedback,
    resetAccessibility,
  } = useSettingsStore();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={styles.backText}>{'< BACK'}</Text>
        </Pressable>
        <Text style={styles.headerTitle}>SETTINGS</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* DISPLAY Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>DISPLAY</Text>

          <FantasyPanel variant="card" style={styles.settingCard}>
            <Text style={styles.settingLabel}>Text Size</Text>
            <View style={styles.settingControl}>
              <SegmentedButtons
                options={TEXT_SIZE_OPTIONS}
                selected={accessibility.textSize}
                onSelect={setTextSize}
              />
            </View>
          </FantasyPanel>

          <FantasyPanel variant="card" style={styles.settingCard}>
            <ToggleRow
              label="High Contrast"
              value={accessibility.highContrast}
              onToggle={setHighContrast}
            />
          </FantasyPanel>

          <FantasyPanel variant="card" style={styles.settingCard}>
            <ToggleRow
              label="Dyslexia Font"
              description="Uses OpenDyslexic font"
              value={accessibility.dyslexiaFont}
              onToggle={setDyslexiaFont}
            />
          </FantasyPanel>
        </View>

        {/* MOTION Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>MOTION</Text>

          <FantasyPanel variant="card" style={styles.settingCard}>
            <ToggleRow
              label="Reduce Motion"
              description="Skips animations"
              value={accessibility.reduceMotion}
              onToggle={setReduceMotion}
            />
          </FantasyPanel>
        </View>

        {/* COLOR Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>COLOR</Text>

          <FantasyPanel variant="card" style={styles.settingCard}>
            <Text style={styles.settingLabel}>Colorblind Mode</Text>
            <View style={styles.radioGroup}>
              {COLORBLIND_OPTIONS.map((opt) => (
                <RadioOption
                  key={opt.value}
                  label={opt.label}
                  value={opt.value}
                  selected={accessibility.colorblindMode}
                  onSelect={setColorblindMode}
                />
              ))}
            </View>
          </FantasyPanel>
        </View>

        {/* INPUT Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>INPUT</Text>

          <FantasyPanel variant="card" style={styles.settingCard}>
            <Text style={styles.settingLabel}>Text Speed</Text>
            <View style={styles.settingControl}>
              <SegmentedButtons
                options={TEXT_SPEED_OPTIONS}
                selected={accessibility.textSpeed}
                onSelect={setTextSpeed}
              />
            </View>
          </FantasyPanel>
        </View>

        {/* AUDIO Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>AUDIO</Text>

          <FantasyPanel variant="card" style={styles.settingCard}>
            <ToggleRow
              label="Haptic Feedback"
              value={accessibility.hapticFeedback}
              onToggle={setHapticFeedback}
            />
          </FantasyPanel>
        </View>

        {/* ACCESSIBILITY Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ACCESSIBILITY</Text>

          <FantasyPanel variant="card" style={styles.settingCard}>
            <ToggleRow
              label="Screen Reader"
              description="Adds accessibility labels"
              value={accessibility.screenReaderOptimized}
              onToggle={setScreenReaderOptimized}
            />
          </FantasyPanel>
        </View>

        {/* Reset Button */}
        <FantasyButton
          variant="danger"
          label="RESET TO DEFAULTS"
          onPress={resetAccessibility}
          style={styles.resetButton}
        />

        {/* Legal / Credits */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>LEGAL</Text>

          <FantasyPanel variant="card" style={styles.settingCard}>
            <Text style={styles.legalText}>
              This game uses mechanics from the{' '}
              <Text style={styles.legalItalic}>
                Systems Reference Document 5.1
              </Text>{' '}
              by Wizards of the Coast LLC, licensed under the{' '}
              <Text
                style={styles.legalLink}
                onPress={() =>
                  Linking.openURL(
                    'https://creativecommons.org/licenses/by/4.0/',
                  )
                }
              >
                Creative Commons Attribution 4.0 International License
              </Text>
              .
            </Text>
            <Text style={[styles.legalText, styles.legalSpacing]}>
              The material has been adapted and modified for use in this
              application. Original material {'\u00A9'} Wizards of the Coast LLC.
            </Text>
            <Text style={[styles.legalText, styles.legalSpacing]}>
              Dungeons & Dragons, D&D, and the Systems Reference Document are
              property of Wizards of the Coast LLC. QuestForge is not affiliated
              with, endorsed, or sponsored by Wizards of the Coast.
            </Text>
          </FantasyPanel>

          <FantasyPanel variant="card" style={styles.settingCard}>
            <Text style={styles.legalText}>
              QuestForge uses AI (Claude by Anthropic) as the Dungeon Master to
              narrate your adventure. Game mechanics are resolved
              deterministically by the app's rules engine.
            </Text>
          </FantasyPanel>

          <Text style={styles.versionText}>QuestForge v0.1.0</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gold.border,
  },
  backButton: {
    paddingVertical: spacing.xs,
    paddingRight: spacing.md,
  },
  backText: {
    fontFamily: fonts.headingRegular,
    fontSize: 12,
    color: colors.gold.primary,
    letterSpacing: 1,
  },
  headerTitle: {
    ...textStyles.screenTitle,
    color: colors.gold.primary,
    fontSize: 18,
  },
  headerSpacer: {
    width: 60, // balance the back button width
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl + spacing.xl,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    ...textStyles.sectionLabel,
    color: colors.text.tertiary,
    marginBottom: spacing.md,
  },
  settingCard: {
    marginBottom: spacing.sm,
  },
  settingLabel: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: PARCHMENT_TEXT.label,
    marginBottom: spacing.sm,
  },
  settingControl: {
    marginTop: spacing.xs,
  },
  radioGroup: {
    marginTop: spacing.sm,
  },
  resetButton: {
    marginTop: spacing.lg,
    marginBottom: spacing.xxl,
  },
  legalText: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 20,
    color: PARCHMENT_TEXT.secondary,
  },
  legalItalic: {
    fontStyle: 'italic',
  },
  legalLink: {
    color: colors.gold.primary,
    textDecorationLine: 'underline',
  },
  legalSpacing: {
    marginTop: spacing.sm,
  },
  versionText: {
    fontFamily: fonts.headingRegular,
    fontSize: 11,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: spacing.md,
    letterSpacing: 1,
  },
});
