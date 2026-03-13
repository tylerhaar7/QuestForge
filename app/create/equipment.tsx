import React, { useEffect } from 'react';
import {
  View, Text, Pressable, ScrollView, StyleSheet, SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors, PARCHMENT_TEXT } from '@/theme/colors';
import { fonts, spacing, textStyles } from '@/theme/typography';
import { FantasyPanel, FantasyButton } from '@/components/ui';
import { useCharacterCreationStore } from '@/stores/useCharacterCreationStore';
import { CLASSES } from '@/data/classes';
import type { EquipmentItem } from '@/types/game';

function formatProperty(key: string, value: string | number): string {
  if (key === 'damage') return `${value} damage`;
  if (key === 'damageType') return '';
  if (key === 'ac') return `AC ${value}`;
  if (key === 'acBonus') return `+${value} AC`;
  if (key === 'range') return `Range ${value}`;
  if (key === 'maxDex') return '';
  return '';
}

function ItemSummary({ items }: { items: EquipmentItem[] }) {
  return (
    <View style={styles.itemList}>
      {items.map((item, idx) => {
        const props = Object.entries(item.properties)
          .map(([k, v]) => formatProperty(k, v))
          .filter(Boolean)
          .join(' | ');
        return (
          <View key={`${item.id}-${idx}`} style={styles.itemRow}>
            <View style={styles.typeBadge}>
              <Text style={styles.typeText}>{item.type.toUpperCase()}</Text>
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.name}</Text>
              {props ? <Text style={styles.itemProps}>{props}</Text> : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

export default function EquipmentSelectionScreen() {
  const router = useRouter();
  const {
    className,
    selectedEquipmentChoices,
    setEquipmentChoice,
    setStep,
    isSpellcasterWithSpells,
  } = useCharacterCreationStore();

  const classData = className ? CLASSES[className] : null;
  const choices = classData?.equipmentChoices;
  const hasChoices = choices && choices.length > 0;

  // Auto-advance if no choices to make
  useEffect(() => {
    if (classData && !hasChoices) {
      const nextRoute = isSpellcasterWithSpells() ? '/create/spells' : '/create/summary';
      router.replace(nextRoute as any);
    }
  }, [classData, hasChoices]);

  if (!classData || !hasChoices) return null;

  const allSelected = choices.every((_, i) => selectedEquipmentChoices[i] !== undefined);

  const handleNext = () => {
    if (!allSelected) return;
    setStep(5);
    const nextRoute = isSpellcasterWithSpells() ? '/create/spells' : '/create/summary';
    router.push(nextRoute as any);
  };

  const totalSteps = isSpellcasterWithSpells() ? 7 : 6;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.stepLabel}>STEP 5 OF {totalSteps}</Text>
        <Text style={styles.title}>Choose Equipment</Text>
      </View>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {choices.map((group, groupIdx) => (
          <View key={group.label} style={styles.choiceGroup}>
            <Text style={styles.groupLabel}>{group.label.toUpperCase()}</Text>

            {group.options.map((option, optionIdx) => {
              const selected = selectedEquipmentChoices[groupIdx] === optionIdx;
              return (
                <Pressable
                  key={optionIdx}
                  onPress={() => setEquipmentChoice(groupIdx, optionIdx)}
                  style={{ opacity: selected ? 1 : 0.8 }}
                >
                  <FantasyPanel variant="card">
                    <View style={[styles.optionHeader, selected && styles.optionHeaderSelected]}>
                      <View style={[styles.radio, selected && styles.radioSelected]}>
                        {selected && <View style={styles.radioInner} />}
                      </View>
                      <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                        {option.map(i => i.name).join(' + ')}
                      </Text>
                    </View>
                    <ItemSummary items={option} />
                  </FantasyPanel>
                </Pressable>
              );
            })}
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <FantasyButton
          variant="primary"
          label="CONTINUE"
          onPress={handleNext}
          disabled={!allSelected}
        />
      </View>
    </SafeAreaView>
  );
}

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
    gap: spacing.lg,
  },

  choiceGroup: {
    gap: spacing.sm,
  },
  groupLabel: {
    fontFamily: fonts.heading,
    fontSize: 11,
    color: colors.text.tertiary,
    letterSpacing: 2,
    marginBottom: spacing.xs,
  },

  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  optionHeaderSelected: {},
  optionLabel: {
    fontFamily: fonts.heading,
    fontSize: 15,
    color: PARCHMENT_TEXT.primary,
    letterSpacing: 0.3,
  },
  optionLabelSelected: {
    color: PARCHMENT_TEXT.accent,
  },

  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#b8a070',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: colors.gold.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.gold.primary,
  },

  itemList: {
    gap: spacing.xs,
    marginLeft: 26,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  typeBadge: {
    borderWidth: 1,
    borderColor: '#b8a070',
    borderRadius: 3,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 52,
    alignItems: 'center',
  },
  typeText: {
    fontFamily: fonts.heading,
    fontSize: 8,
    color: PARCHMENT_TEXT.label,
    letterSpacing: 1,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: PARCHMENT_TEXT.primary,
  },
  itemProps: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: PARCHMENT_TEXT.secondary,
    marginTop: 1,
  },

  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    paddingTop: spacing.sm,
  },
});
