// Game Session — Main gameplay screen
// Layout: Narrative (60%) → Party strip (15%) → Choices (25%)

import React, { useCallback, useState } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, Text, SafeAreaView, TextInput, Pressable, Keyboard, ScrollView, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/theme/colors';
import { fonts, spacing, textStyles } from '@/theme/typography';
import { useGameStore } from '@/stores/useGameStore';
import { NarrativeText } from '@/components/game/NarrativeText';
import { ChoiceButton } from '@/components/game/ChoiceButton';
import { PartyCard } from '@/components/game/PartyCard';
import { ApprovalStack } from '@/components/game/ApprovalIndicator';
import { DiceOverlay2D } from '@/components/game/DiceOverlay2D';
import { submitAction, SubmitActionResult } from '@/services/campaign';
import type { Choice, Companion } from '@/types/game';
import { EnemyIntentions } from '@/components/game/EnemyIntentions';

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
    enemyIntentions,
    activeDiceRoll,
    pendingApprovalChanges,
    isNarrationComplete,
    isTutorialComplete,
    setNarrationComplete,
    shiftDiceRoll,
    resetSession,
  } = useGameStore();

  const handleDiceComplete = useCallback(() => {
    shiftDiceRoll();
  }, [shiftDiceRoll]);

  const handleDeathCheck = useCallback((result: SubmitActionResult) => {
    if ((result as any).deathMeta) {
      const store = useGameStore.getState();
      store.setDeathMeta((result as any).deathMeta);
      router.push({
        pathname: '/game/threshold',
        params: {
          deathCount: String((result as any).deathMeta.deathCount),
          newUnlocks: JSON.stringify((result as any).deathMeta.newUnlocks),
        },
      });
      return true;
    }
    return false;
  }, [router]);

  const handleChoicePress = useCallback(async (choice: Choice) => {
    if (!campaign) return;
    const store = useGameStore.getState();
    store.setLoading(true);
    store.setNarrationComplete(false);
    store.setError(null);

    try {
      // If the choice has a skill check, include it so the server can enforce dice_requests
      let actionText = choice.text;
      if (choice.skillCheck) {
        actionText += ` [SKILL CHECK REQUIRED: ${choice.skillCheck.skill} DC ${choice.skillCheck.dc}]`;
      }

      const result = await submitAction(campaign.id, actionText);

      // Update companions in campaign
      if (result.companions) {
        store.setCampaign({
          ...store.campaign!,
          companions: result.companions,
          turnCount: result.turnCount,
        });
      }

      // Check for death
      if (handleDeathCheck(result)) return;

      // Queue dice roll animations before narration
      if (result.diceRollResults && result.diceRollResults.length > 0) {
        store.queueDiceRolls(result.diceRollResults);
      }

      // Process AI response
      store.processAIResponse(result.aiResponse);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      store.setError(message);
    } finally {
      store.setLoading(false);
    }
  }, [campaign, handleDeathCheck]);

  const handleNarrationComplete = useCallback(() => {
    setNarrationComplete(true);
  }, [setNarrationComplete]);

  const handleApprovalsDismissed = useCallback(() => {
    useGameStore.getState().clearPendingApprovals();
  }, []);

  const [freeformText, setFreeformText] = React.useState('');
  const [menuVisible, setMenuVisible] = useState(false);

  const handleNewCharacter = useCallback(() => {
    setMenuVisible(false);
    resetSession();
    router.replace('/create');
  }, [resetSession, router]);

  const handleNewCampaign = useCallback(() => {
    setMenuVisible(false);
    const charId = character?.id;
    resetSession();
    router.replace({
      pathname: '/create/companions',
      params: { characterId: charId || '' },
    });
  }, [character, resetSession, router]);

  const handleTutorialCreate = useCallback(() => {
    const store = useGameStore.getState();
    store.clearTutorialComplete();
    resetSession();
    router.replace('/create/race');
  }, [resetSession, router]);

  const handleTutorialContinue = useCallback(async () => {
    const store = useGameStore.getState();
    store.clearTutorialComplete();

    // If the store already has narration + choices, the player can keep playing.
    // But if the last turn left the store empty (edge case), fire a recovery turn.
    const { currentNarration: narr, currentChoices: ch } = store;
    if ((!narr || narr === 'The story continues...') && ch.length === 0 && campaign) {
      store.setLoading(true);
      store.setError(null);
      try {
        const result = await submitAction(campaign.id, 'I look around and decide what to do next.');
        if (result.companions) {
          store.setCampaign({ ...store.campaign!, companions: result.companions, turnCount: result.turnCount });
        }
        store.processAIResponse(result.aiResponse);
      } catch (err) {
        store.setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        store.setLoading(false);
      }
    }
  }, [campaign]);

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

      // Check for death
      if (handleDeathCheck(result)) return;

      // Queue dice roll animations before narration
      if (result.diceRollResults && result.diceRollResults.length > 0) {
        store.queueDiceRolls(result.diceRollResults);
      }

      store.processAIResponse(result.aiResponse);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      store.setError(message);
    } finally {
      store.setLoading(false);
    }
  }, [campaign, freeformText, handleDeathCheck]);

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
          <Pressable onPress={() => setMenuVisible(true)} style={styles.menuButton}>
            <Text style={styles.menuIcon}>{'\u22EE'}</Text>
          </Pressable>
          <Text style={[styles.headerTitle, { flex: 1 }]}>{campaign.currentLocation}</Text>
          <View style={styles.headerRight}>
            <Text style={styles.turnLabel}>Turn {campaign.turnCount}</Text>
            <Pressable onPress={() => router.push('/settings')} style={styles.settingsButton}>
              <Text style={styles.settingsIcon}>{'\u2699'}</Text>
            </Pressable>
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

          {/* Enemy Intentions (combat only) */}
          {currentMode === 'combat' && enemyIntentions.length > 0 && (
            <EnemyIntentions intentions={enemyIntentions} />
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

            {/* Freeform hint when no choices */}
            {isNarrationComplete && !isLoading && currentChoices.length === 0 && (
              <Text style={styles.freeformHint}>
                No preset choices — type any action you want to try!
              </Text>
            )}

            {/* Freeform action input */}
            {isNarrationComplete && !isLoading && (
              <View style={styles.freeformContainer}>
                <TextInput
                  style={styles.freeformInput}
                  value={freeformText}
                  onChangeText={setFreeformText}
                  placeholder={currentChoices.length === 0 ? "What do you do?" : "Or type your own action..."}
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

        {/* Dice Roll Overlay */}
        {activeDiceRoll && (
          <DiceOverlay2D roll={activeDiceRoll} onComplete={handleDiceComplete} />
        )}
      </KeyboardAvoidingView>

      {/* Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setMenuVisible(false)}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>MENU</Text>

            <Pressable style={styles.modalOption} onPress={() => { setMenuVisible(false); router.push('/game/camp'); }}>
              <Text style={styles.modalOptionText}>Make Camp</Text>
              <Text style={styles.modalOptionDesc}>Rest, talk to companions, explore</Text>
            </Pressable>

            <Pressable style={styles.modalOption} onPress={() => { setMenuVisible(false); router.push('/game/journal'); }}>
              <Text style={styles.modalOptionText}>Journal</Text>
              <Text style={styles.modalOptionDesc}>View your adventure log</Text>
            </Pressable>

            {campaign?.adventureMap && (
              <Pressable style={styles.modalOption} onPress={() => { setMenuVisible(false); router.push('/game/map'); }}>
                <Text style={styles.modalOptionText}>Adventure Map</Text>
                <Text style={styles.modalOptionDesc}>View your path ahead</Text>
              </Pressable>
            )}

            <Pressable style={styles.modalOption} onPress={handleNewCampaign}>
              <Text style={styles.modalOptionText}>New Campaign</Text>
              <Text style={styles.modalOptionDesc}>Keep your character, start a new adventure</Text>
            </Pressable>

            <Pressable style={styles.modalOption} onPress={handleNewCharacter}>
              <Text style={styles.modalOptionText}>New Character</Text>
              <Text style={styles.modalOptionDesc}>Start over with a new character</Text>
            </Pressable>

            <Pressable style={styles.modalCancel} onPress={() => setMenuVisible(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* Tutorial Complete Modal */}
      <Modal
        visible={isTutorialComplete}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.tutorialCompleteTitle}>YOUR ADVENTURE{'\n'}BEGINS</Text>
            <Text style={styles.tutorialCompleteDesc}>
              You've learned the basics of combat, skill checks, and companion dynamics. The rest of your story is yours to write.
            </Text>

            <Pressable style={styles.tutorialCreateBtn} onPress={handleTutorialCreate}>
              <Text style={styles.tutorialCreateBtnText}>CREATE MY CHARACTER</Text>
              <Text style={styles.tutorialCreateBtnDesc}>Build a unique hero from scratch</Text>
            </Pressable>

            <Pressable style={styles.modalOption} onPress={handleTutorialContinue}>
              <Text style={styles.modalOptionText}>Continue Playing</Text>
              <Text style={styles.modalOptionDesc}>Keep this character and keep adventuring</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
  freeformHint: {
    fontFamily: fonts.narrative,
    fontSize: 14,
    fontStyle: 'italic',
    color: colors.gold.muted,
    textAlign: 'center',
    marginBottom: spacing.sm,
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
  settingsButton: {
    paddingLeft: spacing.sm,
    paddingVertical: spacing.xs,
  },
  settingsIcon: {
    fontFamily: fonts.heading,
    fontSize: 18,
    color: colors.gold.primary,
  },
  menuButton: {
    paddingRight: spacing.sm,
    paddingVertical: spacing.xs,
  },
  menuIcon: {
    fontFamily: fonts.heading,
    fontSize: 20,
    color: colors.gold.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalCard: {
    backgroundColor: colors.bg.secondary,
    borderWidth: 1,
    borderColor: colors.gold.border,
    borderRadius: 12,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 320,
  },
  modalTitle: {
    fontFamily: fonts.heading,
    fontSize: 13,
    color: colors.gold.primary,
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  modalOption: {
    borderWidth: 1,
    borderColor: colors.gold.border,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.bg.tertiary,
  },
  modalOptionText: {
    fontFamily: fonts.heading,
    fontSize: 14,
    color: colors.text.primary,
    letterSpacing: 0.5,
  },
  modalOptionDesc: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  modalCancel: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  modalCancelText: {
    fontFamily: fonts.headingRegular,
    fontSize: 13,
    color: colors.text.tertiary,
    letterSpacing: 1,
  },
  tutorialCompleteTitle: {
    fontFamily: fonts.heading,
    fontSize: 20,
    color: colors.gold.primary,
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: spacing.md,
    textTransform: 'uppercase',
  },
  tutorialCompleteDesc: {
    fontFamily: fonts.narrative,
    fontSize: 15,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  tutorialCreateBtn: {
    borderWidth: 1,
    borderColor: colors.gold.primary,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.gold.primary,
  },
  tutorialCreateBtnText: {
    fontFamily: fonts.heading,
    fontSize: 14,
    color: colors.bg.primary,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  tutorialCreateBtnDesc: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.bg.secondary,
    marginTop: 2,
    textAlign: 'center',
  },
});
