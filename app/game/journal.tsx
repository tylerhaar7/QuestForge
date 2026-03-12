// Journal Screen — Auto-journaling of notable campaign events
// Displays parchment-styled entries with filtering by event type

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  ListRenderItemInfo,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors, PARCHMENT_TEXT } from '@/theme/colors';
import { fonts, spacing, textStyles } from '@/theme/typography';
import { useGameStore } from '@/stores/useGameStore';
import { getJournalEntries, JournalRow } from '@/services/campaign';
import { FantasyPanel } from '@/components/ui';

// ─── Constants ────────────────────────────────────────────────────────────────

const ENTRY_TYPE_ICONS: Record<string, string> = {
  npc_met: '👤',
  quest_accepted: '📜',
  quest_completed: '✅',
  location_discovered: '🗺️',
  item_found: '💎',
  lore_learned: '📚',
  decision_made: '⚖️',
  companion_event: '🤝',
  combat_victory: '⚔️',
  combat_defeat: '💀',
};

type FilterKey =
  | 'all'
  | 'npc_met'
  | 'quest_accepted'
  | 'quest_completed'
  | 'location_discovered'
  | 'lore_learned'
  | 'decision_made';

interface FilterTab {
  key: FilterKey;
  label: string;
}

const FILTER_TABS: FilterTab[] = [
  { key: 'all', label: 'All' },
  { key: 'npc_met', label: 'NPCs' },
  { key: 'quest_accepted', label: 'Quests' },
  { key: 'quest_completed', label: 'Completed' },
  { key: 'location_discovered', label: 'Locations' },
  { key: 'lore_learned', label: 'Lore' },
  { key: 'decision_made', label: 'Decisions' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getEntryIcon(entryType: string): string {
  return ENTRY_TYPE_ICONS[entryType] ?? '📖';
}

function formatDate(createdAt: string): string {
  try {
    const date = new Date(createdAt);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface JournalEntryCardProps {
  entry: JournalRow;
}

function JournalEntryCard({ entry }: JournalEntryCardProps) {
  const icon = getEntryIcon(entry.entry_type);
  const tags = [
    ...(entry.related_npcs ?? []),
    ...(entry.related_locations ?? []),
  ];

  return (
    <FantasyPanel variant="pinned" style={styles.card}>
      {/* Card header: icon + title + turn */}
      <View style={styles.cardHeader}>
        <Text style={styles.cardIcon}>{icon}</Text>
        <View style={styles.cardTitleBlock}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {entry.title}
          </Text>
          <Text style={styles.cardTurn}>Turn {entry.turn_number}</Text>
        </View>
        {entry.is_pinned && (
          <View style={styles.pinnedBadge}>
            <Text style={styles.pinnedBadgeText}>PINNED</Text>
          </View>
        )}
      </View>

      {/* Description */}
      {!!entry.description && (
        <Text style={styles.cardDescription}>{entry.description}</Text>
      )}

      {/* Related tags */}
      {tags.length > 0 && (
        <View style={styles.tagsRow}>
          {tags.map((tag, idx) => (
            <View key={`${tag}-${idx}`} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      )}
    </FantasyPanel>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function JournalScreen() {
  const router = useRouter();
  const campaign = useGameStore((s) => s.campaign);

  const [entries, setEntries] = useState<JournalRow[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEntries = useCallback(
    async (filter: FilterKey, refreshing = false) => {
      if (!campaign?.id) return;
      if (refreshing) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);
      try {
        const data = await getJournalEntries(
          campaign.id,
          filter === 'all' ? undefined : filter,
        );
        setEntries(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load journal.',
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [campaign?.id],
  );

  useEffect(() => {
    fetchEntries(activeFilter);
  }, [activeFilter, fetchEntries]);

  const handleFilterPress = useCallback(
    (filter: FilterKey) => {
      if (filter === activeFilter) return;
      setActiveFilter(filter);
    },
    [activeFilter],
  );

  const handleRefresh = useCallback(() => {
    fetchEntries(activeFilter, true);
  }, [activeFilter, fetchEntries]);

  // ── Render helpers ────────────────────────────────────────────────────────

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<JournalRow>) => (
      <JournalEntryCard entry={item} />
    ),
    [],
  );

  const keyExtractor = useCallback((item: JournalRow) => item.id, []);

  const renderEmptyState = () => {
    if (isLoading) return null;
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>
          Your journal is empty. Notable events will be recorded here.
        </Text>
      </View>
    );
  };

  // ── Layout ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Journal</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Filter tabs */}
      {/* Filter tabs */}
      <View style={styles.filtersScroll}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContent}
        >
          {FILTER_TABS.map((tab) => {
            const isActive = tab.key === activeFilter;
            return (
              <Pressable
                key={tab.key}
                style={[styles.filterPill, isActive && styles.filterPillActive]}
                onPress={() => handleFilterPress(tab.key)}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    isActive && styles.filterPillTextActive,
                  ]}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Loading indicator */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.gold.primary} />
        </View>
      )}

      {/* Error message */}
      {!!error && !isLoading && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Entry list */}
      {!isLoading && (
        <FlatList
          data={entries}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.gold.primary}
              colors={[colors.gold.primary]}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gold.border,
  },
  backButton: {
    paddingVertical: spacing.xs,
    paddingRight: spacing.sm,
  },
  backIcon: {
    fontFamily: fonts.heading,
    fontSize: 20,
    color: colors.gold.primary,
  },
  headerTitle: {
    ...textStyles.screenTitle,
    color: colors.gold.primary,
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 28, // mirrors back button width to keep title centered
  },

  // Filter tabs
  filtersScroll: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gold.border,
  },
  filtersContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  filterPill: {
    height: 30,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(180,140,60,0.3)',
    backgroundColor: colors.bg.secondary,
    marginRight: spacing.sm,
  },
  filterPillActive: {
    backgroundColor: colors.gold.primary,
    borderColor: colors.gold.primary,
  },
  filterPillText: {
    fontFamily: fonts.headingRegular,
    fontSize: 11,
    letterSpacing: 1.5,
    color: colors.text.secondary,
    textTransform: 'uppercase',
  },
  filterPillTextActive: {
    color: colors.bg.primary,
  },

  // Loading / Error
  loadingContainer: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  errorContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  errorText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.combat.red,
    textAlign: 'center',
  },

  // List
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    flexGrow: 1,
  },

  // Entry card
  card: {
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  cardIcon: {
    fontSize: 20,
    lineHeight: 26,
  },
  cardTitleBlock: {
    flex: 1,
  },
  cardTitle: {
    fontFamily: fonts.heading,
    fontSize: 13,
    letterSpacing: 0.5,
    color: PARCHMENT_TEXT.primary,
    marginBottom: 2,
  },
  cardTurn: {
    fontFamily: fonts.headingRegular,
    fontSize: 10,
    letterSpacing: 1,
    color: PARCHMENT_TEXT.accent,
    textTransform: 'uppercase',
  },
  pinnedBadge: {
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: colors.gold.dim,
  },
  pinnedBadgeText: {
    fontFamily: fonts.heading,
    fontSize: 8,
    letterSpacing: 1,
    color: colors.gold.bright,
  },
  cardDescription: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 22,
    color: PARCHMENT_TEXT.secondary,
    marginBottom: spacing.sm,
  },

  // Related tags
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  tag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(90,58,24,0.4)',
    backgroundColor: 'rgba(90,58,24,0.12)',
  },
  tagText: {
    fontFamily: fonts.headingRegular,
    fontSize: 10,
    letterSpacing: 0.5,
    color: PARCHMENT_TEXT.primary,
  },

  // Empty state
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xxl * 2,
  },
  emptyText: {
    fontFamily: fonts.narrativeItalic,
    fontSize: 16,
    lineHeight: 26,
    color: colors.text.tertiary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
