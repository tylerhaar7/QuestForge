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
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/theme/colors';
import { fonts, spacing, textStyles } from '@/theme/typography';
import { useSettingsStore } from '@/stores/useSettingsStore';
import type { TextSize, TextSpeed, ColorblindMode } from '@/types/settings';

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
    backgroundColor: colors.bg.tertiary,
    borderRadius: 6,
    alignItems: 'center',
  },
  buttonActive: {
    backgroundColor: colors.gold.primary,
  },
  label: {
    fontFamily: fonts.headingRegular,
    fontSize: 12,
    color: colors.text.secondary,
    letterSpacing: 0.5,
  },
  labelActive: {
    color: colors.bg.primary,
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
    color: colors.text.primary,
  },
  description: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.text.tertiary,
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
    borderColor: colors.gold.border,
    borderRadius: 8,
    backgroundColor: colors.bg.tertiary,
    marginBottom: spacing.sm,
  },
  optionActive: {
    borderColor: colors.gold.primary,
  },
  circle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.text.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  circleActive: {
    borderColor: colors.gold.primary,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gold.primary,
  },
  label: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.text.secondary,
  },
  labelActive: {
    color: colors.text.primary,
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

          <View style={styles.settingCard}>
            <Text style={styles.settingLabel}>Text Size</Text>
            <View style={styles.settingControl}>
              <SegmentedButtons
                options={TEXT_SIZE_OPTIONS}
                selected={accessibility.textSize}
                onSelect={setTextSize}
              />
            </View>
          </View>

          <View style={styles.settingCard}>
            <ToggleRow
              label="High Contrast"
              value={accessibility.highContrast}
              onToggle={setHighContrast}
            />
          </View>

          <View style={styles.settingCard}>
            <ToggleRow
              label="Dyslexia Font"
              description="Uses OpenDyslexic font"
              value={accessibility.dyslexiaFont}
              onToggle={setDyslexiaFont}
            />
          </View>
        </View>

        {/* MOTION Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>MOTION</Text>

          <View style={styles.settingCard}>
            <ToggleRow
              label="Reduce Motion"
              description="Skips animations"
              value={accessibility.reduceMotion}
              onToggle={setReduceMotion}
            />
          </View>
        </View>

        {/* COLOR Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>COLOR</Text>

          <View style={styles.settingCard}>
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
          </View>
        </View>

        {/* INPUT Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>INPUT</Text>

          <View style={styles.settingCard}>
            <Text style={styles.settingLabel}>Text Speed</Text>
            <View style={styles.settingControl}>
              <SegmentedButtons
                options={TEXT_SPEED_OPTIONS}
                selected={accessibility.textSpeed}
                onSelect={setTextSpeed}
              />
            </View>
          </View>
        </View>

        {/* AUDIO Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>AUDIO</Text>

          <View style={styles.settingCard}>
            <ToggleRow
              label="Haptic Feedback"
              value={accessibility.hapticFeedback}
              onToggle={setHapticFeedback}
            />
          </View>
        </View>

        {/* ACCESSIBILITY Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ACCESSIBILITY</Text>

          <View style={styles.settingCard}>
            <ToggleRow
              label="Screen Reader"
              description="Adds accessibility labels"
              value={accessibility.screenReaderOptimized}
              onToggle={setScreenReaderOptimized}
            />
          </View>
        </View>

        {/* Reset Button */}
        <Pressable
          style={styles.resetButton}
          onPress={resetAccessibility}
          accessibilityRole="button"
          accessibilityLabel="Reset to defaults"
        >
          <Text style={styles.resetButtonText}>RESET TO DEFAULTS</Text>
        </Pressable>
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
    backgroundColor: colors.bg.secondary,
    borderWidth: 1,
    borderColor: colors.gold.border,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  settingLabel: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  settingControl: {
    marginTop: spacing.xs,
  },
  radioGroup: {
    marginTop: spacing.sm,
  },
  resetButton: {
    borderWidth: 1,
    borderColor: colors.gold.primary,
    borderRadius: 8,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  resetButtonText: {
    fontFamily: fonts.heading,
    fontSize: 13,
    color: colors.gold.primary,
    letterSpacing: 2,
  },
});
