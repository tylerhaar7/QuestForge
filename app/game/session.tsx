// Game Session — Main gameplay screen
// Layout: Narrative (60%) → Party strip (15%) → Choices (25%)

import React, { useCallback } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, Text, SafeAreaView, TextInput, Pressable, Keyboard, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/theme/colors';
import { fonts, spacing, textStyles } from '@/theme/typography';
import { useGameStore } from '@/stores/useGameStore';
import { NarrativeText } from '@/components/game/NarrativeText';
import { ChoiceButton } from '@/components/game/ChoiceButton';
import { PartyCard } from '@/components/game/PartyCard';
import { ApprovalStack } from '@/components/game/ApprovalIndicator';
import { submitAction } from '@/services/campaign';
import type { Choice, Companion } from '@/types/game';

export default function GameSessionScreen() {
  const router = useRouter();
  const {
    campaign,
    character,
    isLoading,
    error,
    currentNarration,
    currentChoices,
    currentMode,
    currentMood,
    pendingApprovalChanges,
    isNarrationComplete,
    setNarrationComplete,
  } = useGameStore();

  const handleChoicePress = useCallback(async (choice: Choice) => {
    if (!campaign) return;
    const store = useGameStore.getState();
    store.setLoading(true);
    store.setNarrationComplete(false);
    store.setError(null);

    try {
      const result = await submitAction(campaign.id, choice.text);

      // Update companions in campaign
      if (result.companions) {
        store.setCampaign({
          ...store.campaign!,
          companions: result.companions,
          turnCount: result.turnCount,
        });
      }

      // Process AI response
      store.processAIResponse(result.aiResponse);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      store.setError(message);
    } finally {
      store.setLoading(false);
    }
  }, [campaign]);

  const handleNarrationComplete = useCallback(() => {
    setNarrationComplete(true);
  }, [setNarrationComplete]);

  const handleApprovalsDismissed = useCallback(() => {
    // Clear pending approvals from store
  }, []);

  const [freeformText, setFreeformText] = React.useState('');

  const handleFreeformSubmit = useCallback(async () => {
    if (!campaign || !freeformText.trim()) return;
    Keyboard.dismiss();
    const text = freeformText.trim();
    setFreeformText('');

    const store = useGameStore.getState();
    store.setLoading(true);
    store.setNarrationComplete(false);
    store.setError(null);

    try {
      const result = await submitAction(campaign.id, text);

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
  }, [campaign, freeformText]);

  // Build party list: player character + companions
  const partyMembers = React.useMemo(() => {
    const members: {
      key: string;
      name: string;
      className: Companion['className'];
      level: number;
      currentHp: number;
      maxHp: number;
      ac: number;
      conditions: Companion['conditions'];
      isCompanion: boolean;
      approvalScore?: number;
      relationshipStage?: Companion['relationshipStage'];
    }[] = [];

    if (character) {
      members.push({
        key: 'player',
        name: character.name,
        className: character.className,
        level: character.level,
        currentHp: character.hp,
        maxHp: character.maxHp,
        ac: character.ac,
        conditions: character.conditions,
        isCompanion: false,
      });
    }

    if (campaign?.companions) {
      campaign.companions.forEach(c => {
        members.push({
          key: c.name,
          name: c.name,
          className: c.className,
          level: c.level,
          currentHp: c.hp,
          maxHp: c.maxHp,
          ac: c.ac,
          conditions: c.conditions,
          isCompanion: true,
          approvalScore: c.approvalScore,
          relationshipStage: c.relationshipStage,
        });
      });
    }

    return members;
  }, [character, campaign?.companions]);

  // Placeholder state — shows when no campaign is loaded
  if (!campaign || !character) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>QuestForge</Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No Active Campaign</Text>
          <Text style={styles.emptySubtitle}>
            Create a character and start a campaign to begin your adventure.
          </Text>
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
          <Text style={styles.headerTitle}>{campaign.currentLocation}</Text>
          <View style={styles.headerRight}>
            <Text style={styles.turnLabel}>Turn {campaign.turnCount}</Text>
          </View>
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Narrative Area */}
          <View style={styles.narrativeArea}>
            {isLoading ? (
              <View style={styles.loading}>
                <ActivityIndicator size="small" color={colors.gold.primary} />
                <Text style={styles.loadingText}>The DM ponders...</Text>
              </View>
            ) : (
              <NarrativeText
                text={currentNarration}
                speed="normal"
                onComplete={handleNarrationComplete}
              />
            )}
          </View>

          {/* Party Strip */}
          <View style={styles.partyStrip}>
            <FlatList
              horizontal
              data={partyMembers}
              keyExtractor={item => item.key}
              renderItem={({ item }) => (
                <PartyCard
                  name={item.name}
                  className={item.className}
                  level={item.level}
                  currentHp={item.currentHp}
                  maxHp={item.maxHp}
                  ac={item.ac}
                  conditions={item.conditions}
                  isCompanion={item.isCompanion}
                  approvalScore={item.approvalScore}
                  relationshipStage={item.relationshipStage}
                />
              )}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.partyList}
            />
          </View>

          {/* Error display */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Choice Area */}
          <View style={styles.choiceArea}>
            {isNarrationComplete && currentChoices.map((choice, index) => (
              <ChoiceButton
                key={index}
                choice={choice}
                onPress={handleChoicePress}
                disabled={isLoading}
              />
            ))}

            {/* Freeform action input */}
            {isNarrationComplete && !isLoading && (
              <View style={styles.freeformContainer}>
                <TextInput
                  style={styles.freeformInput}
                  value={freeformText}
                  onChangeText={setFreeformText}
                  placeholder="Or type your own action..."
                  placeholderTextColor={colors.text.tertiary}
                  onSubmitEditing={handleFreeformSubmit}
                  returnKeyType="send"
                  editable={!isLoading}
                />
                {freeformText.trim().length > 0 && (
                  <Pressable style={styles.freeformSend} onPress={handleFreeformSubmit}>
                    <Text style={styles.freeformSendText}>→</Text>
                  </Pressable>
                )}
              </View>
            )}
          </View>
        </ScrollView>

        {/* Approval Indicators */}
        {pendingApprovalChanges.length > 0 && (
          <ApprovalStack
            changes={pendingApprovalChanges}
            onAllDismissed={handleApprovalsDismissed}
          />
        )}
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
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gold.border,
  },
  headerTitle: {
    fontFamily: fonts.heading,
    fontSize: 14,
    letterSpacing: 1,
    color: colors.gold.primary,
    textTransform: 'uppercase',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  turnLabel: {
    fontFamily: fonts.headingRegular,
    fontSize: 10,
    color: colors.text.tertiary,
    letterSpacing: 1,
  },
  narrativeArea: {
    minHeight: 200,
  },
  loading: {
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
  partyStrip: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.gold.border,
    paddingVertical: spacing.sm,
  },
  partyList: {
    paddingHorizontal: spacing.lg,
  },
  choiceArea: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.gold.border,
    paddingTop: spacing.sm,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  emptyTitle: {
    ...textStyles.screenTitle,
    color: colors.gold.primary,
    marginBottom: spacing.md,
    fontSize: 18,
  },
  emptySubtitle: {
    ...textStyles.narrative,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  freeformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gold.border,
    borderRadius: 8,
    backgroundColor: colors.bg.secondary,
  },
  freeformInput: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.text.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  freeformSend: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  freeformSendText: {
    fontFamily: fonts.heading,
    fontSize: 18,
    color: colors.gold.primary,
  },
  errorContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  errorText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.combat.red,
    textAlign: 'center',
  },
});
