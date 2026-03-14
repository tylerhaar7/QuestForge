import React, { useRef, useState } from 'react';
import {
  View, Text, Pressable, ScrollView, StyleSheet, SafeAreaView,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors, PARCHMENT_TEXT } from '@/theme/colors';
import { fonts, spacing, textStyles } from '@/theme/typography';
import { FantasyPanel, FantasyButton, CreationHeader } from '@/components/ui';
import { useCharacterCreationStore } from '@/stores/useCharacterCreationStore';
import { ORIGINS, ORIGIN_MAP, type OriginData } from '@/data/origins';
import * as Haptics from 'expo-haptics';
import type { Skill } from '@/types/game';

function formatSkillName(skill: string): string {
  return skill.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// ── Suggested backstory prompt card ─────────────────────────────────────────

function BackstoryPromptCard({
  prompt,
  onPress,
}: {
  prompt: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress}>
      <View style={styles.promptCard}>
        <Text style={styles.promptCardText}>{prompt}</Text>
        <Text style={styles.promptCardHint}>Tap to use</Text>
      </View>
    </Pressable>
  );
}

const CUSTOM_ORIGIN_ID = 'custom';
const MAX_CUSTOM_LENGTH = 1200;

// ── Origin card (pre-built) ──────────────────────────────────────────────────

function OriginCard({
  origin,
  selected,
  onPress,
}: {
  origin: OriginData;
  selected: boolean;
  onPress: () => void;
}) {
  const [expandedPill, setExpandedPill] = useState<string | null>(null);

  const handlePillPress = (key: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedPill(prev => prev === key ? null : key);
  };

  return (
    <Pressable onPress={onPress} style={{ opacity: selected ? 1 : 0.85 }}>
      <FantasyPanel variant="card">
        <Text style={[styles.cardName, selected && styles.cardNameSelected]}>
          {origin.name}
        </Text>
        <Text style={styles.cardDesc}>{origin.description}</Text>

        <View style={styles.skills}>
          {/* Personal quest pill */}
          <Pressable
            onPress={(e) => { e.stopPropagation(); handlePillPress('quest'); }}
            style={[styles.pillBase, styles.questPill, expandedPill === 'quest' && styles.pillExpanded]}
          >
            <Text style={[styles.pillText, expandedPill === 'quest' && styles.pillTextExpanded]}>
              Personal Quest
            </Text>
          </Pressable>

          {/* Bonus skill pills */}
          {origin.bonusSkills.map((skill) => (
            <Pressable
              key={skill}
              onPress={(e) => { e.stopPropagation(); handlePillPress(skill); }}
              style={[styles.pillBase, expandedPill === skill && styles.pillExpanded]}
            >
              <Text style={[styles.pillText, expandedPill === skill && styles.pillTextExpanded]}>
                {formatSkillName(skill)}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Expanded descriptions */}
        {expandedPill === 'quest' && (
          <Text style={styles.pillDescription}>"{origin.personalQuest}"</Text>
        )}
        {expandedPill && expandedPill !== 'quest' && (
          <Text style={styles.pillDescription}>
            Bonus proficiency in {formatSkillName(expandedPill)}.
          </Text>
        )}
      </FantasyPanel>
    </Pressable>
  );
}

// ── Custom origin card ───────────────────────────────────────────────────────

function CustomOriginCard({
  selected,
  customText,
  onSelect,
  onChangeText,
}: {
  selected: boolean;
  customText: string;
  onSelect: () => void;
  onChangeText: (text: string) => void;
}) {
  const inputRef = useRef<TextInput>(null);

  const handlePress = () => {
    onSelect();
    // Give focus after state update so the input renders first
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  return (
    <Pressable onPress={handlePress} style={{ opacity: selected ? 1 : 0.85 }}>
      <FantasyPanel variant="card">
        <View style={styles.customHeader}>
          <Text style={[styles.cardName, selected && styles.cardNameSelected]}>
            Write Your Own
          </Text>
          <Text style={styles.customBadge}>CUSTOM</Text>
        </View>
        <Text style={styles.cardDesc}>
          Craft a unique backstory that sets your character apart. The AI Dungeon Master will weave your origin into the narrative.
        </Text>

        {selected && (
          <View style={styles.inputWrapper}>
            <TextInput
              ref={inputRef}
              style={styles.customInput}
              value={customText}
              onChangeText={onChangeText}
              placeholder="Describe your character's origin…"
              placeholderTextColor={colors.text.disabled}
              multiline
              maxLength={MAX_CUSTOM_LENGTH}
              textAlignVertical="top"
              selectionColor={colors.gold.primary}
            />
            <Text style={styles.charCount}>
              {customText.length}/{MAX_CUSTOM_LENGTH}
            </Text>
          </View>
        )}
      </FantasyPanel>
    </Pressable>
  );
}

// ── Screen ───────────────────────────────────────────────────────────────────

export default function OriginSelectionScreen() {
  const router = useRouter();
  const { originId, customOrigin, setOrigin, setCustomOrigin, setStep } =
    useCharacterCreationStore();

  const isCustomSelected = originId === CUSTOM_ORIGIN_ID;
  const customText = customOrigin ?? '';
  const selectedOriginData =
    originId && originId !== CUSTOM_ORIGIN_ID ? ORIGIN_MAP[originId] : null;

  const canContinue =
    originId !== null &&
    (originId !== CUSTOM_ORIGIN_ID || customText.trim().length > 0);

  const handleSelectOrigin = (id: string) => {
    setOrigin(id);
  };

  const handleSelectCustom = () => {
    // setCustomOrigin with current text (even empty) triggers originId = 'custom'
    setCustomOrigin(customText);
  };

  const handleCustomTextChange = (text: string) => {
    setCustomOrigin(text);
  };

  const handleBackstoryPrompt = (prompt: string) => {
    setCustomOrigin(prompt);
  };

  const handleNext = () => {
    if (!canContinue) return;
    setStep(5);
    router.push('/create/equipment');
  };

  return (
    <SafeAreaView style={styles.container}>
      <CreationHeader step="STEP 5" title="Your Character's Story" />

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
      >
        {ORIGINS.map((origin) => (
          <OriginCard
            key={origin.id}
            origin={origin}
            selected={originId === origin.id}
            onPress={() => handleSelectOrigin(origin.id)}
          />
        ))}

        {/* Suggested backstory prompts for selected pre-built origin */}
        {selectedOriginData && selectedOriginData.suggestedBackstoryPrompts.length > 0 && (
          <View style={styles.promptsSection}>
            <Text style={styles.promptsSectionLabel}>SUGGESTED BACKSTORIES</Text>
            {selectedOriginData.suggestedBackstoryPrompts.map((prompt, idx) => (
              <BackstoryPromptCard
                key={idx}
                prompt={prompt}
                onPress={() => handleBackstoryPrompt(prompt)}
              />
            ))}
          </View>
        )}

        {/* Divider before custom option */}
        <Text style={styles.orWriteLabel}>Or write your own...</Text>

        <CustomOriginCard
          selected={isCustomSelected}
          customText={customText}
          onSelect={handleSelectCustom}
          onChangeText={handleCustomTextChange}
        />
      </ScrollView>

      <View style={styles.footer}>
        <FantasyButton variant="primary" label="CONTINUE" onPress={handleNext} disabled={!canContinue} />
      </View>
    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },

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
  },

  list: { flex: 1 },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },

  cardName: {
    ...textStyles.characterName,
    color: PARCHMENT_TEXT.primary,
    fontSize: 16,
    marginBottom: spacing.xs,
  },
  cardNameSelected: { color: PARCHMENT_TEXT.accent },

  cardDesc: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: PARCHMENT_TEXT.secondary,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },

  cardQuest: {
    fontFamily: fonts.bodyItalic,
    fontSize: 13,
    color: PARCHMENT_TEXT.label,
    lineHeight: 19,
    marginBottom: spacing.sm,
  },

  skills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  pillBase: {
    borderWidth: 1,
    borderColor: '#b8a070',
    borderRadius: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  pillExpanded: {
    borderColor: PARCHMENT_TEXT.accent,
    backgroundColor: 'rgba(180,140,60,0.12)',
  },
  pillText: {
    fontFamily: fonts.headingRegular,
    fontSize: 10,
    color: PARCHMENT_TEXT.label,
    letterSpacing: 0.5,
  },
  pillTextExpanded: {
    color: PARCHMENT_TEXT.accent,
  },
  questPill: {
    borderStyle: 'dashed' as any,
  },
  pillDescription: {
    fontFamily: fonts.bodyItalic,
    fontSize: 11,
    color: PARCHMENT_TEXT.secondary,
    fontStyle: 'italic',
    lineHeight: 16,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.xs,
  },

  // Custom card additions
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  customBadge: {
    fontFamily: fonts.heading,
    fontSize: 9,
    letterSpacing: 1.5,
    color: PARCHMENT_TEXT.label,
    borderWidth: 1,
    borderColor: '#b8a070',
    borderRadius: 3,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },

  inputWrapper: {
    marginTop: spacing.sm,
  },
  customInput: {
    borderWidth: 1,
    borderColor: colors.gold.border,
    borderRadius: 6,
    backgroundColor: colors.bg.primary,
    color: colors.text.primary,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 21,
    padding: spacing.md,
    minHeight: 100,
  },
  charCount: {
    fontFamily: fonts.headingRegular,
    fontSize: 10,
    color: colors.text.disabled,
    letterSpacing: 0.5,
    textAlign: 'right',
    marginTop: spacing.xs,
  },

  // Suggested backstory prompts
  promptsSection: {
    gap: spacing.sm,
  },
  promptsSectionLabel: {
    fontFamily: fonts.heading,
    fontSize: 10,
    color: colors.text.tertiary,
    letterSpacing: 2,
    marginBottom: spacing.xs,
  },
  promptCard: {
    borderWidth: 1,
    borderColor: colors.gold.border,
    borderRadius: 8,
    backgroundColor: colors.bg.secondary,
    padding: spacing.md,
  },
  promptCardText: {
    fontFamily: fonts.bodyItalic,
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: spacing.xs,
  },
  promptCardHint: {
    fontFamily: fonts.headingRegular,
    fontSize: 9,
    color: colors.gold.muted,
    letterSpacing: 1,
    textAlign: 'right',
  },
  orWriteLabel: {
    fontFamily: fonts.bodyItalic,
    fontSize: 13,
    color: colors.text.tertiary,
    textAlign: 'center',
  },

  // Footer
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    paddingTop: spacing.sm,
  },
});
