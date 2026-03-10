// Adventure Map — Slay the Spire-style node navigation
// Bottom-to-top layout with branching paths and animated current node

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  Modal,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { colors } from '@/theme/colors';
import { fonts, spacing, textStyles } from '@/theme/typography';
import { useGameStore } from '@/stores/useGameStore';
import { submitAction } from '@/services/campaign';
import type { MapNode, MapNodeType } from '@/types/game';

// ─── Constants ──────────────────────────────────────

const NODE_SIZE = 48;
const NODE_ICON_FALLBACK: Record<MapNodeType, string> = {
  combat:    '\u2694\uFE0F',
  elite:     '\uD83D\uDC80',
  boss:      '\uD83D\uDC51',
  rest:      '\uD83C\uDFF5\uFE0F',
  merchant:  '\uD83E\uDE99',
  mystery:   '\u2753',
  social:    '\uD83D\uDDE3\uFE0F',
  treasure:  '\uD83D\uDC8E',
  companion: '\u2B50',
};

const DIFFICULTY_STARS = (d: 1 | 2 | 3) => '\u2605'.repeat(d) + '\u2606'.repeat(3 - d);

// ─── Animated current-node glow ─────────────────────

function GlowPulse({ children }: { children: React.ReactNode }) {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.4, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View style={styles.glowWrapper}>
      <Animated.View style={[styles.glowRing, glowStyle]} />
      {children}
    </View>
  );
}

// ─── Single map node ────────────────────────────────

interface MapNodeViewProps {
  node: MapNode;
  state: 'current' | 'available' | 'completed' | 'locked';
  onPress: (node: MapNode) => void;
}

function MapNodeView({ node, state, onPress }: MapNodeViewProps) {
  const icon = node.icon || NODE_ICON_FALLBACK[node.type] || '?';
  const isInteractive = state === 'available';
  const isCurrent = state === 'current';
  const isCompleted = state === 'completed';

  const containerStyle = [
    styles.nodeContainer,
    isCurrent && styles.nodeContainerCurrent,
    isInteractive && styles.nodeContainerAvailable,
    isCompleted && styles.nodeContainerCompleted,
    state === 'locked' && styles.nodeContainerLocked,
  ];

  const inner = (
    <View style={containerStyle}>
      <Text style={[styles.nodeIcon, isCompleted && styles.nodeIconDimmed]}>{icon}</Text>
    </View>
  );

  if (isCurrent) {
    return (
      <GlowPulse>
        {inner}
      </GlowPulse>
    );
  }

  return (
    <Pressable
      onPress={isInteractive ? () => onPress(node) : undefined}
      style={styles.nodePressable}
      disabled={!isInteractive}
    >
      {inner}
    </Pressable>
  );
}

// ─── Helpers ────────────────────────────────────────

/** Group nodes into rows (layers) by BFS depth from the first node. */
function buildDepthMap(nodes: MapNode[]): Map<string, number> {
  const idToNode = new Map(nodes.map(n => [n.id, n]));
  const depth = new Map<string, number>();

  // Seed: any node with no parent (not referenced as a connection by others)
  const allTargets = new Set(nodes.flatMap(n => n.connections));
  const roots = nodes.filter(n => !allTargets.has(n.id));

  const queue: string[] = roots.length > 0 ? roots.map(n => n.id) : [nodes[0]?.id].filter(Boolean);
  queue.forEach(id => depth.set(id, 0));

  while (queue.length) {
    const id = queue.shift()!;
    const node = idToNode.get(id);
    if (!node) continue;
    const d = depth.get(id)!;
    for (const child of node.connections) {
      if (!depth.has(child)) {
        depth.set(child, d + 1);
        queue.push(child);
      }
    }
  }

  // Assign remaining disconnected nodes incrementally
  let maxDepth = Math.max(0, ...depth.values());
  for (const node of nodes) {
    if (!depth.has(node.id)) {
      depth.set(node.id, ++maxDepth);
    }
  }

  return depth;
}

function groupByDepth(nodes: MapNode[], depthMap: Map<string, number>): MapNode[][] {
  const buckets = new Map<number, MapNode[]>();
  for (const node of nodes) {
    const d = depthMap.get(node.id) ?? 0;
    if (!buckets.has(d)) buckets.set(d, []);
    buckets.get(d)!.push(node);
  }
  // Sort ascending so row 0 is rendered at the bottom (we reverse for display)
  const maxD = Math.max(0, ...buckets.keys());
  const rows: MapNode[][] = [];
  for (let i = 0; i <= maxD; i++) {
    rows.push(buckets.get(i) ?? []);
  }
  return rows;
}

// ─── Main Screen ────────────────────────────────────

export default function AdventureMapScreen() {
  const router = useRouter();
  const { campaign } = useGameStore();
  const [selectedNode, setSelectedNode] = useState<MapNode | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const adventureMap = campaign?.adventureMap;

  // Compute node states
  const { depthMap, rows, nodeStateMap } = useMemo(() => {
    if (!adventureMap) return { depthMap: new Map(), rows: [], nodeStateMap: new Map() };

    const { nodes, currentNodeId } = adventureMap;
    const dm = buildDepthMap(nodes);
    const r = groupByDepth(nodes, dm);

    // Find current node's connections
    const currentNode = nodes.find(n => n.id === currentNodeId);
    const reachableFromCurrent = new Set(currentNode?.connections ?? []);

    const stateMap = new Map<string, 'current' | 'available' | 'completed' | 'locked'>();
    for (const node of nodes) {
      if (node.id === currentNodeId) {
        stateMap.set(node.id, 'current');
      } else if (node.completed) {
        stateMap.set(node.id, 'completed');
      } else if (reachableFromCurrent.has(node.id)) {
        stateMap.set(node.id, 'available');
      } else {
        stateMap.set(node.id, 'locked');
      }
    }

    return { depthMap: dm, rows: r, nodeStateMap: stateMap };
  }, [adventureMap]);

  const handleNodePress = useCallback((node: MapNode) => {
    setSubmitError(null);
    setSelectedNode(node);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!selectedNode || !campaign) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await submitAction(
        campaign.id,
        `Travel to node ${selectedNode.id}: ${selectedNode.teaser}`,
      );
      setSelectedNode(null);
      router.back();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedNode, campaign, router]);

  const handleCancel = useCallback(() => {
    setSelectedNode(null);
    setSubmitError(null);
  }, []);

  // ── No map state ──────────────────────────────────

  if (!adventureMap) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backIcon}>{'<'}</Text>
            <Text style={styles.backLabel}>Back</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Adventure Map</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>{'?'}</Text>
          <Text style={styles.emptyTitle}>Paths Undiscovered</Text>
          <Text style={styles.emptyBody}>
            No map available yet. Continue your adventure to discover new paths.
          </Text>
          <Pressable style={styles.emptyButton} onPress={() => router.back()}>
            <Text style={styles.emptyButtonText}>Return to Adventure</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ── Map render ────────────────────────────────────

  // Rows are ordered 0 = start, n = end. We want bottom = start, top = end.
  // Reverse rows so we render from top (deepest / boss) to bottom (roots).
  const displayRows = [...rows].reverse();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>{'<'}</Text>
          <Text style={styles.backLabel}>Back</Text>
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {adventureMap.chapterTitle}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {displayRows.map((row, rowIdx) => {
          // The actual depth for connector drawing: reverse index back to original depth
          const actualDepth = rows.length - 1 - rowIdx;

          return (
            <View key={`row-${rowIdx}`} style={styles.rowWrapper}>
              {/* Connection lines to children (next row down in display = actualDepth + 1) */}
              {rowIdx < displayRows.length - 1 && (
                <View style={styles.connectorsRow}>
                  {row.map(node =>
                    node.connections.map(childId => {
                      const childRow = displayRows[rowIdx + 1] ?? [];
                      const childIndex = childRow.findIndex(n => n.id === childId);
                      const parentIndex = row.indexOf(node);
                      if (childIndex === -1) return null;

                      // Simple vertical connector line (no horizontal offset for now)
                      return (
                        <View
                          key={`conn-${node.id}-${childId}`}
                          style={[
                            styles.connectorLine,
                            nodeStateMap.get(node.id) === 'completed'
                              ? styles.connectorCompleted
                              : styles.connectorDefault,
                          ]}
                        />
                      );
                    })
                  )}
                </View>
              )}

              {/* Node row */}
              <View style={styles.nodeRow}>
                {row.map(node => (
                  <View key={node.id} style={styles.nodeCell}>
                    <MapNodeView
                      node={node}
                      state={nodeStateMap.get(node.id) ?? 'locked'}
                      onPress={handleNodePress}
                    />
                    <Text
                      style={[
                        styles.nodeLabel,
                        nodeStateMap.get(node.id) === 'locked' && styles.nodeLabelDimmed,
                      ]}
                      numberOfLines={1}
                    >
                      {node.type.charAt(0).toUpperCase() + node.type.slice(1)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          );
        })}

        {/* Bottom legend */}
        <View style={styles.legend}>
          <Text style={styles.legendTitle}>Current Chapter</Text>
          <View style={styles.legendRow}>
            {(['current', 'available', 'completed', 'locked'] as const).map(s => (
              <View key={s} style={styles.legendItem}>
                <View
                  style={[
                    styles.legendDot,
                    s === 'current' && styles.legendDotCurrent,
                    s === 'available' && styles.legendDotAvailable,
                    s === 'completed' && styles.legendDotCompleted,
                    s === 'locked' && styles.legendDotLocked,
                  ]}
                />
                <Text style={styles.legendLabel}>{s.charAt(0).toUpperCase() + s.slice(1)}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Confirmation Modal */}
      <Modal
        visible={selectedNode !== null}
        transparent
        animationType="fade"
        onRequestClose={handleCancel}
      >
        <Pressable style={styles.modalOverlay} onPress={isSubmitting ? undefined : handleCancel}>
          <Pressable style={styles.modalCard} onPress={e => e.stopPropagation()}>
            {selectedNode && (
              <>
                <Text style={styles.modalIcon}>
                  {selectedNode.icon || NODE_ICON_FALLBACK[selectedNode.type]}
                </Text>
                <Text style={styles.modalQuestion}>
                  Travel to...
                </Text>
                <Text style={styles.modalTeaser}>{selectedNode.teaser}</Text>

                <View style={styles.modalMeta}>
                  <Text style={styles.modalType}>
                    {selectedNode.type.charAt(0).toUpperCase() + selectedNode.type.slice(1)}
                  </Text>
                  <Text style={styles.modalDifficulty}>
                    {DIFFICULTY_STARS(selectedNode.difficulty)}
                  </Text>
                </View>

                {submitError && (
                  <Text style={styles.modalError}>{submitError}</Text>
                )}

                <View style={styles.modalButtons}>
                  <Pressable
                    style={styles.modalCancel}
                    onPress={handleCancel}
                    disabled={isSubmitting}
                  >
                    <Text style={styles.modalCancelText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.modalConfirm, isSubmitting && styles.modalConfirmDisabled]}
                    onPress={handleConfirm}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator size="small" color={colors.bg.primary} />
                    ) : (
                      <Text style={styles.modalConfirmText}>Confirm</Text>
                    )}
                  </Pressable>
                </View>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────

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
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: spacing.md,
  },
  backIcon: {
    fontFamily: fonts.heading,
    fontSize: 18,
    color: colors.gold.primary,
    marginRight: 4,
  },
  backLabel: {
    fontFamily: fonts.headingRegular,
    fontSize: 12,
    color: colors.gold.primary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  headerTitle: {
    flex: 1,
    fontFamily: fonts.heading,
    fontSize: 16,
    letterSpacing: 1.5,
    color: colors.gold.primary,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 60, // mirror backButton width for centering
  },

  // Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },

  // Row wrappers
  rowWrapper: {
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  nodeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xl,
  },
  nodeCell: {
    alignItems: 'center',
    width: NODE_SIZE + spacing.lg,
  },

  // Connectors
  connectorsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: spacing.xxl,
    gap: spacing.xl,
  },
  connectorLine: {
    width: 2,
    height: spacing.xxl,
    borderRadius: 1,
  },
  connectorCompleted: {
    backgroundColor: colors.gold.muted,
  },
  connectorDefault: {
    backgroundColor: colors.gold.dim,
  },

  // Node base
  nodePressable: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowRing: {
    position: 'absolute',
    width: NODE_SIZE + 16,
    height: NODE_SIZE + 16,
    borderRadius: (NODE_SIZE + 16) / 2,
    backgroundColor: colors.gold.glow,
    borderWidth: 1,
    borderColor: colors.gold.primary,
  },
  nodeContainer: {
    width: NODE_SIZE,
    height: NODE_SIZE,
    borderRadius: NODE_SIZE / 2,
    borderWidth: 1.5,
    borderColor: colors.text.disabled,
    backgroundColor: colors.bg.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeContainerCurrent: {
    borderColor: colors.gold.primary,
    backgroundColor: colors.bg.tertiary,
    borderWidth: 2,
  },
  nodeContainerAvailable: {
    borderColor: colors.gold.primary,
    backgroundColor: colors.bg.tertiary,
  },
  nodeContainerCompleted: {
    borderColor: colors.gold.dim,
    opacity: 0.4,
  },
  nodeContainerLocked: {
    borderColor: colors.text.disabled,
  },
  nodeIcon: {
    fontSize: 22,
  },
  nodeIconDimmed: {
    opacity: 0.6,
  },
  nodeLabel: {
    fontFamily: fonts.headingRegular,
    fontSize: 9,
    color: colors.text.tertiary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: spacing.xs,
  },
  nodeLabelDimmed: {
    color: colors.text.disabled,
  },

  // Legend
  legend: {
    marginTop: spacing.xxl,
    paddingTop: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.gold.border,
    alignItems: 'center',
  },
  legendTitle: {
    fontFamily: fonts.headingRegular,
    fontSize: 9,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.text.tertiary,
    marginBottom: spacing.sm,
  },
  legendRow: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.text.disabled,
  },
  legendDotCurrent: {
    backgroundColor: colors.gold.primary,
    borderColor: colors.gold.primary,
  },
  legendDotAvailable: {
    backgroundColor: 'transparent',
    borderColor: colors.gold.primary,
  },
  legendDotCompleted: {
    backgroundColor: colors.gold.dim,
    borderColor: colors.gold.dim,
    opacity: 0.4,
  },
  legendDotLocked: {
    backgroundColor: 'transparent',
    borderColor: colors.text.disabled,
  },
  legendLabel: {
    fontFamily: fonts.headingRegular,
    fontSize: 9,
    color: colors.text.tertiary,
    letterSpacing: 0.5,
  },

  // Empty state
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.lg,
    color: colors.gold.muted,
  },
  emptyTitle: {
    ...textStyles.screenTitle,
    color: colors.gold.primary,
    marginBottom: spacing.md,
    fontSize: 20,
  },
  emptyBody: {
    fontFamily: fonts.narrative,
    fontSize: 15,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xxl,
  },
  emptyButton: {
    borderWidth: 1,
    borderColor: colors.gold.primary,
    borderRadius: 8,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  emptyButtonText: {
    fontFamily: fonts.headingRegular,
    fontSize: 13,
    color: colors.gold.primary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.bg.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalCard: {
    backgroundColor: colors.bg.secondary,
    borderWidth: 1,
    borderColor: colors.gold.border,
    borderRadius: 12,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  modalIcon: {
    fontSize: 40,
    marginBottom: spacing.md,
  },
  modalQuestion: {
    fontFamily: fonts.headingRegular,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.text.tertiary,
    marginBottom: spacing.xs,
  },
  modalTeaser: {
    fontFamily: fonts.narrative,
    fontSize: 16,
    color: colors.text.primary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.md,
  },
  modalMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  modalType: {
    fontFamily: fonts.headingRegular,
    fontSize: 11,
    color: colors.gold.muted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  modalDifficulty: {
    fontSize: 13,
    color: colors.gold.primary,
  },
  modalError: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.combat.red,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
  },
  modalCancel: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gold.border,
    alignItems: 'center',
  },
  modalCancelText: {
    fontFamily: fonts.headingRegular,
    fontSize: 13,
    color: colors.text.secondary,
    letterSpacing: 1,
  },
  modalConfirm: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 8,
    backgroundColor: colors.gold.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmDisabled: {
    opacity: 0.6,
  },
  modalConfirmText: {
    fontFamily: fonts.heading,
    fontSize: 13,
    color: colors.bg.primary,
    letterSpacing: 1,
  },
});
