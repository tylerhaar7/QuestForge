// Camp Screen — BG3-inspired rest/companion hub
// Warm amber mood: rest, talk, banter, explore activities

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  Pressable,
  ActivityIndicator,
  Modal,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { colors, PARCHMENT_TEXT } from '@/theme/colors';
import { fonts, spacing, textStyles } from '@/theme/typography';
import { useGameStore } from '@/stores/useGameStore';
import { submitAction } from '@/services/campaign';
import { NarrativeText } from '@/components/game/NarrativeText';
import { FantasyPanel, FantasyButton, PortraitFrame } from '@/components/ui';
import type { Companion } from '@/types/game';

// ─── Types ───────────────────────────────────────────

type CampView = 'activities' | 'narrative';

interface ActivityDef {
  id: string;
  icon: string;
  label: string;
  description: string;
  action: 'talk' | 'rest' | 'banter' | 'explore' | 'journal' | 'break';
}

// ─── Constants ───────────────────────────────────────

const CAMP_ACTIVITIES: ActivityDef[] = [
  {
    id: 'talk',
    icon: '🗣️',
    label: 'Talk to Companion',
    description: 'Speak privately with one of your companions',
    action: 'talk',
  },
  {
    id: 'rest',
    icon: '🌙',
    label: 'Rest',
    description: 'Take a long rest — recover HP and spell slots',
    action: 'rest',
  },
  {
    id: 'banter',
    icon: '🎭',
    label: 'Companion Banter',
    description: 'Listen as your companions talk amongst themselves',
    action: 'banter',
  },
  {
    id: 'explore',
    icon: '👁️',
    label: 'Explore Camp',
    description: 'Look around the campsite for secrets or supplies',
    action: 'explore',
  },
  {
    id: 'journal',
    icon: '📖',
    label: 'Journal',
    description: 'Review your quest log and adventure notes',
    action: 'journal',
  },
  {
    id: 'break',
    icon: '→',
    label: 'Break Camp',
    description: 'Return to your adventure',
    action: 'break',
  },
];

// ─── Companion Portrait ───────────────────────────────

function CompanionPortrait({ companion }: { companion: Companion }) {
  const initial = companion.name.charAt(0).toUpperCase();
  return (
    <View style={styles.companionCard}>
      <PortraitFrame size="sm" variant="ornate">
        <Text style={styles.companionInitial}>{initial}</Text>
      </PortraitFrame>
      <Text style={styles.companionName} numberOfLines={1}>
        {companion.name}
      </Text>
      <Text style={styles.companionClass} numberOfLines={1}>
        {companion.className}
      </Text>
    </View>
  );
}

// ─── Activity Button ──────────────────────────────────

interface ActivityButtonProps {
  activity: ActivityDef;
  onPress: (activity: ActivityDef) => void;
  disabled: boolean;
}

function ActivityButton({ activity, onPress, disabled }: ActivityButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.97, { damping: 20, stiffness: 300 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 20, stiffness: 300 });
  }, [scale]);

  const isBreak = activity.action === 'break';

  if (isBreak) {
    return (
      <Animated.View style={[animatedStyle, styles.breakButtonWrapper]}>
        <FantasyButton
          variant="primary"
          label="BREAK CAMP"
          onPress={() => onPress(activity)}
          disabled={disabled}
        />
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[animatedStyle, styles.activityWrapper, disabled && styles.activityButtonDisabled]}>
      <Pressable
        onPress={() => onPress(activity)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
      >
        <FantasyPanel variant="card" style={styles.activityPanelOverride}>
          <View style={styles.activityInner}>
            <Text style={styles.activityIcon}>{activity.icon}</Text>
            <View style={styles.activityText}>
              <Text style={styles.activityLabel}>{activity.label}</Text>
              <Text style={styles.activityDesc}>{activity.description}</Text>
            </View>
          </View>
        </FantasyPanel>
      </Pressable>
    </Animated.View>
  );
}

// ─── Companion Picker Modal ───────────────────────────

interface CompanionPickerProps {
  visible: boolean;
  companions: Companion[];
  onSelect: (companion: Companion) => void;
  onClose: () => void;
}

function CompanionPicker({ visible, companions, onSelect, onClose }: CompanionPickerProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <FantasyPanel variant="modal" style={styles.pickerCard}>
          <Text style={styles.pickerTitle}>TALK TO WHOM?</Text>
          {companions.length === 0 ? (
            <Text style={styles.pickerEmpty}>No companions at camp.</Text>
          ) : (
            companions.map((c) => (
              <Pressable
                key={c.name}
                style={styles.pickerOption}
                onPress={() => onSelect(c)}
              >
                <PortraitFrame size="sm" variant="ornate" style={styles.pickerPortrait}>
                  <Text style={styles.pickerPortraitInitial}>{c.name.charAt(0).toUpperCase()}</Text>
                </PortraitFrame>
                <View style={styles.pickerOptionText}>
                  <Text style={styles.pickerOptionName}>{c.name}</Text>
                  <Text style={styles.pickerOptionClass}>{c.className}</Text>
                </View>
              </Pressable>
            ))
          )}
          <Pressable style={styles.pickerCancel} onPress={onClose}>
            <Text style={styles.pickerCancelText}>Cancel</Text>
          </Pressable>
        </FantasyPanel>
      </Pressable>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────

export default function CampScreen() {
  const router = useRouter();
  const {
    campaign,
    character,
    isLoading,
    currentNarration,
    setLoading,
    setError,
    processAIResponse,
    setNarrationComplete,
  } = useGameStore();

  const [campView, setCampView] = useState<CampView>('activities');
  const [showCompanionPicker, setShowCompanionPicker] = useState(false);

  // Amber tint overlay opacity animation
  const ambientOpacity = useSharedValue(1);
  const ambientStyle = useAnimatedStyle(() => ({
    opacity: ambientOpacity.value,
  }));

  const companions = campaign?.companions ?? [];

  // ─── Action handler ───────────────────────────────

  const sendCampAction = useCallback(async (actionText: string) => {
    if (!campaign) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCampView('narrative');
    setLoading(true);
    setError(null);
    setNarrationComplete(false);

    try {
      const result = await submitAction(campaign.id, actionText);

      const store = useGameStore.getState();
      if (result.companions) {
        store.setCampaign({
          ...store.campaign!,
          companions: result.companions,
          turnCount: result.turnCount,
        });
      }

      processAIResponse(result.aiResponse);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setError(message);
      setCampView('activities');
    } finally {
      setLoading(false);
    }
  }, [campaign, setLoading, setError, setNarrationComplete, processAIResponse]);

  // ─── Activity dispatch ────────────────────────────

  const handleActivityPress = useCallback((activity: ActivityDef) => {
    if (!campaign) return;

    switch (activity.action) {
      case 'talk':
        if (companions.length === 0) {
          sendCampAction('I look around camp. There is no one to talk to.');
        } else if (companions.length === 1) {
          sendCampAction(`Talk to ${companions[0].name} at camp`);
        } else {
          setShowCompanionPicker(true);
        }
        break;

      case 'rest':
        sendCampAction('[LONG REST]');
        break;

      case 'banter':
        sendCampAction('Watch companion banter at camp');
        break;

      case 'explore':
        sendCampAction('Explore the campsite');
        break;

      case 'journal':
        router.push('/game/journal');
        break;

      case 'break':
        router.back();
        break;
    }
  }, [campaign, companions, sendCampAction, router]);

  const handleCompanionSelect = useCallback((companion: Companion) => {
    setShowCompanionPicker(false);
    sendCampAction(`Talk to ${companion.name} at camp`);
  }, [sendCampAction]);

  const handleNarrationComplete = useCallback(() => {
    setNarrationComplete(true);
  }, [setNarrationComplete]);

  const handleBackToActivities = useCallback(() => {
    setCampView('activities');
    setNarrationComplete(false);
  }, [setNarrationComplete]);

  // ─── Empty state ──────────────────────────────────

  if (!campaign || !character) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No Active Campaign</Text>
          <Text style={styles.emptySubtitle}>
            Start a campaign to access the camp.
          </Text>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>GO BACK</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Render ───────────────────────────────────────

  return (
    <SafeAreaView style={styles.container}>
      {/* Warm amber ambient overlay */}
      <Animated.View style={[styles.ambientOverlay, ambientStyle]} pointerEvents="none" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>CAMP</Text>
          <Text style={styles.headerLocation}>{campaign.currentLocation}</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.campFireIcon}>🔥</Text>
        </View>
      </View>

      {/* Companion Row */}
      {companions.length > 0 && (
        <View style={styles.companionRow}>
          <Text style={styles.companionRowLabel}>AT CAMP</Text>
          <FlatList
            horizontal
            data={companions}
            keyExtractor={(item) => item.name}
            renderItem={({ item }) => <CompanionPortrait companion={item} />}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.companionList}
          />
        </View>
      )}

      {/* Divider */}
      <View style={styles.divider} />

      {/* Main content area */}
      {campView === 'activities' ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.activitiesContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionLabel}>WHAT WOULD YOU DO?</Text>
          {CAMP_ACTIVITIES.map((activity) => (
            <ActivityButton
              key={activity.id}
              activity={activity}
              onPress={handleActivityPress}
              disabled={isLoading}
            />
          ))}
        </ScrollView>
      ) : (
        <View style={styles.flex}>
          {isLoading ? (
            <View style={styles.loadingArea}>
              <ActivityIndicator size="small" color={colors.gold.primary} />
              <Text style={styles.loadingText}>The fire crackles as the story unfolds...</Text>
            </View>
          ) : (
            <>
              <NarrativeText
                text={currentNarration}
                onComplete={handleNarrationComplete}
              />
              <View style={styles.narrativeFooter}>
                <Pressable style={styles.returnButton} onPress={handleBackToActivities}>
                  <Text style={styles.returnButtonText}>← RETURN TO CAMP</Text>
                </Pressable>
              </View>
            </>
          )}
        </View>
      )}

      {/* Companion Picker Modal */}
      <CompanionPicker
        visible={showCompanionPicker}
        companions={companions}
        onSelect={handleCompanionSelect}
        onClose={() => setShowCompanionPicker(false)}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  flex: {
    flex: 1,
  },

  // Warm amber ambient overlay using camp mood tint
  ambientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.mood.camp.accent,
    pointerEvents: 'none',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gold.border,
    backgroundColor: colors.mood.camp.secondary,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: fonts.heading,
    fontSize: 22,
    letterSpacing: 3,
    color: colors.gold.bright,
    textTransform: 'uppercase',
  },
  headerLocation: {
    fontFamily: fonts.headingRegular,
    fontSize: 11,
    letterSpacing: 1.5,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  headerRight: {
    paddingLeft: spacing.sm,
  },
  campFireIcon: {
    fontSize: 24,
  },

  // Companion row
  companionRow: {
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.mood.camp.secondary,
  },
  companionRowLabel: {
    fontFamily: fonts.heading,
    fontSize: 9,
    letterSpacing: 3,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  companionList: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  companionCard: {
    alignItems: 'center',
    backgroundColor: colors.bg.tertiary,
    borderWidth: 1,
    borderColor: colors.gold.border,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minWidth: 72,
    marginRight: spacing.sm,
  },
  companionInitial: {
    fontFamily: fonts.heading,
    fontSize: 16,
    color: '#e8dcc8',
  },
  companionName: {
    fontFamily: fonts.headingRegular,
    fontSize: 11,
    color: colors.text.primary,
    letterSpacing: 0.5,
    textAlign: 'center',
    maxWidth: 72,
  },
  companionClass: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: 1,
  },

  // Divider
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.gold.border,
  },

  // Activities
  activitiesContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  sectionLabel: {
    ...textStyles.sectionLabel,
    color: colors.text.tertiary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  activityWrapper: {
    marginBottom: spacing.sm,
  },
  activityPanelOverride: {
    // FantasyPanel handles border/bg via parchment image
  },
  activityInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breakButtonWrapper: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  activityButtonDisabled: {
    opacity: 0.5,
  },
  activityIcon: {
    fontSize: 22,
    marginRight: spacing.md,
    width: 32,
    textAlign: 'center',
  },
  activityText: {
    flex: 1,
  },
  activityLabel: {
    fontFamily: fonts.headingRegular,
    fontSize: 14,
    letterSpacing: 0.5,
    color: PARCHMENT_TEXT.primary,
  },
  activityDesc: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: PARCHMENT_TEXT.secondary,
    marginTop: 2,
    lineHeight: 17,
  },

  // Narrative view
  loadingArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  loadingText: {
    fontFamily: fonts.narrative,
    fontSize: 14,
    fontStyle: 'italic',
    color: colors.text.tertiary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  narrativeFooter: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.gold.border,
    backgroundColor: colors.mood.camp.secondary,
  },
  returnButton: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  returnButtonText: {
    fontFamily: fonts.headingRegular,
    fontSize: 12,
    letterSpacing: 1.5,
    color: colors.gold.muted,
    textTransform: 'uppercase',
  },

  // Empty state
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  emptyTitle: {
    ...textStyles.screenTitle,
    color: colors.gold.primary,
    fontSize: 18,
    marginBottom: spacing.md,
  },
  emptySubtitle: {
    fontFamily: fonts.narrative,
    fontSize: 15,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  backButton: {
    borderWidth: 1,
    borderColor: colors.gold.border,
    borderRadius: 8,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  backButtonText: {
    fontFamily: fonts.headingRegular,
    fontSize: 12,
    letterSpacing: 2,
    color: colors.gold.primary,
  },

  // Companion picker modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  pickerCard: {
    width: '100%',
    maxWidth: 320,
  },
  pickerTitle: {
    fontFamily: fonts.heading,
    fontSize: 13,
    letterSpacing: 2,
    color: PARCHMENT_TEXT.label,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  pickerEmpty: {
    fontFamily: fonts.narrative,
    fontSize: 14,
    fontStyle: 'italic',
    color: PARCHMENT_TEXT.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  pickerPortrait: {
    marginRight: spacing.md,
  },
  pickerPortraitInitial: {
    fontFamily: fonts.heading,
    fontSize: 14,
    color: '#e8dcc8',
  },
  pickerOptionText: {
    flex: 1,
  },
  pickerOptionName: {
    fontFamily: fonts.headingRegular,
    fontSize: 14,
    color: PARCHMENT_TEXT.primary,
    letterSpacing: 0.5,
  },
  pickerOptionClass: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: PARCHMENT_TEXT.secondary,
    marginTop: 1,
  },
  pickerCancel: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  pickerCancelText: {
    fontFamily: fonts.headingRegular,
    fontSize: 13,
    color: PARCHMENT_TEXT.secondary,
    letterSpacing: 1,
  },
});
