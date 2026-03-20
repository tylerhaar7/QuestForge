// LootReveal — Full-screen overlay for item drops.
// Items stagger in from below with spring animations.
// Legendary items get an animated gold border glow.

import React, { useEffect } from 'react';
import {
  Text,
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  Dimensions,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors } from '@/theme/colors';
import { fonts, spacing } from '@/theme/typography';
import { REWARDS } from '@/constants/animations';
import { useAccessibility } from '@/providers/AccessibilityProvider';

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface LootItem {
  name: string;
  type: string; // weapon, armor, shield, accessory, consumable, quest_item, misc
  rarity?: 'common' | 'uncommon' | 'rare' | 'legendary';
  description?: string;
}

interface LootRevealProps {
  items: LootItem[];
  onDismiss: () => void;
}

// ─── Constants ──────────────────────────────────────────────────────────────────

const SCREEN_HEIGHT = Dimensions.get('window').height;
const LIST_MAX_HEIGHT = SCREEN_HEIGHT * 0.6;

const TYPE_ICONS: Record<string, string> = {
  weapon: '\u2694\uFE0F',
  armor: '\uD83D\uDEE1\uFE0F',
  shield: '\uD83D\uDEE1\uFE0F',
  accessory: '\uD83D\uDC8D',
  consumable: '\uD83E\uDDEA',
  quest_item: '\uD83D\uDCDC',
  misc: '\uD83D\uDCE6',
};

const RARITY_COLORS: Record<string, string> = {
  common: colors.text.tertiary,
  uncommon: '#4a8c3c',
  rare: '#4a90d9',
  legendary: colors.gold.bright,
};

// ─── Legendary Glow Wrapper ─────────────────────────────────────────────────────

function LegendaryGlow({ children }: { children: React.ReactNode }) {
  const glowOpacity = useSharedValue(0.4);

  useEffect(() => {
    glowOpacity.value = withRepeat(
      withTiming(1, { duration: 1200 }),
      -1,
      true,
    );
  }, [glowOpacity]);

  const animatedBorder = useAnimatedStyle(() => ({
    borderColor: `rgba(212,168,67,${glowOpacity.value * 0.6})`,
    shadowOpacity: glowOpacity.value * 0.5,
  }));

  return (
    <Animated.View style={[styles.legendaryWrapper, animatedBorder]}>
      {children}
    </Animated.View>
  );
}

// ─── Single Loot Card ───────────────────────────────────────────────────────────

interface LootCardProps {
  item: LootItem;
  index: number;
  skipAnimations: boolean;
}

function LootCard({ item, index, skipAnimations }: LootCardProps) {
  const icon = TYPE_ICONS[item.type] ?? TYPE_ICONS.misc;
  const rarityColor = RARITY_COLORS[item.rarity ?? 'common'];
  const isLegendary = item.rarity === 'legendary';

  const entering = skipAnimations
    ? undefined
    : FadeInDown
        .delay(index * REWARDS.LOOT_STAGGER)
        .springify()
        .damping(18)
        .stiffness(200);

  const card = (
    <View style={styles.cardRow}>
      {/* Rarity strip */}
      <View style={[styles.rarityStrip, { backgroundColor: rarityColor }]} />

      {/* Icon */}
      <Text style={styles.typeIcon}>{icon}</Text>

      {/* Text content */}
      <View style={styles.cardTextContainer}>
        <Text style={styles.itemName} numberOfLines={1}>
          {item.name}
        </Text>
        {item.description ? (
          <Text style={styles.itemDescription} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}
      </View>
    </View>
  );

  return (
    <Animated.View entering={entering} style={styles.cardOuter}>
      {isLegendary ? (
        <LegendaryGlow>{card}</LegendaryGlow>
      ) : (
        <View style={styles.cardContainer}>{card}</View>
      )}
    </Animated.View>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────

export function LootReveal({ items, onDismiss }: LootRevealProps) {
  const { skipAnimations, hapticsEnabled } = useAccessibility();

  useEffect(() => {
    if (hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [hapticsEnabled]);

  const backdropEntering = skipAnimations ? undefined : FadeIn.duration(200);
  const headerEntering = skipAnimations
    ? undefined
    : FadeInDown.duration(300).springify().damping(16).stiffness(180);
  const hintEntering = skipAnimations
    ? undefined
    : FadeIn.delay(items.length * REWARDS.LOOT_STAGGER + 300).duration(400);

  return (
    <Animated.View entering={backdropEntering} style={styles.overlay}>
      <Pressable
        style={styles.pressArea}
        onPress={onDismiss}
        accessibilityRole="button"
        accessibilityLabel="Dismiss loot"
      >
        {/* Header */}
        <Animated.Text entering={headerEntering} style={styles.header}>
          LOOT FOUND
        </Animated.Text>

        {/* Item list */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {items.map((item, index) => (
            <LootCard
              key={`${item.name}-${index}`}
              item={item}
              index={index}
              skipAnimations={skipAnimations}
            />
          ))}
        </ScrollView>

        {/* Hint */}
        <Animated.Text entering={hintEntering} style={styles.hint}>
          Tap to continue
        </Animated.Text>
      </Pressable>
    </Animated.View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  pressArea: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  header: {
    fontFamily: fonts.heading,
    fontSize: 22,
    letterSpacing: 4,
    color: colors.gold.bright,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  scrollView: {
    maxHeight: LIST_MAX_HEIGHT,
    width: '100%',
  },
  scrollContent: {
    paddingBottom: spacing.sm,
  },
  cardOuter: {
    marginBottom: spacing.sm,
  },
  cardContainer: {
    backgroundColor: colors.bg.tertiary,
    borderWidth: 1,
    borderColor: colors.gold.border,
    borderRadius: 8,
    overflow: 'hidden',
  },
  legendaryWrapper: {
    backgroundColor: colors.bg.tertiary,
    borderWidth: 1.5,
    borderColor: colors.gold.bright,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: colors.gold.bright,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  rarityStrip: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  typeIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  cardTextContainer: {
    flex: 1,
  },
  itemName: {
    fontFamily: fonts.headingRegular,
    fontSize: 14,
    color: colors.text.primary,
  },
  itemDescription: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  hint: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
