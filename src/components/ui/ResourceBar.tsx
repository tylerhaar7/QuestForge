// src/components/ui/ResourceBar.tsx
import React from 'react';
import { Image, View, Text, StyleSheet, ViewStyle } from 'react-native';
import { UI_ASSETS } from '@/assets/ui';
import { fonts } from '@/theme/typography';

type BarType = 'hp' | 'mana' | 'xp';

interface ResourceBarProps {
  type: BarType;
  current: number;
  max: number;
  label?: string;
  style?: ViewStyle;
}

const BAR_SOURCES: Record<BarType, any> = {
  hp: UI_ASSETS.bar.hp,
  mana: UI_ASSETS.bar.mana,
  xp: UI_ASSETS.bar.xp,
};

const FILL_COLORS: Record<BarType, string> = {
  hp: '#8b1a1a',
  mana: '#1a3a8b',
  xp: '#2a6e1e',
};

export function ResourceBar({ type, current, max, label, style }: ResourceBarProps) {
  const ratio = max > 0 ? Math.min(current / max, 1) : 0;
  const percentage = ratio * 100;

  return (
    <View style={[styles.container, style]}>
      {/* Fill layer (behind the frame) */}
      <View style={styles.fillTrack}>
        <View
          style={[
            styles.fill,
            {
              width: `${percentage}%`,
              backgroundColor: FILL_COLORS[type],
            },
          ]}
        />
      </View>

      {/* Frame image overlay */}
      <Image
        source={BAR_SOURCES[type]}
        style={styles.frameImage}
        resizeMode="stretch"
      />

      {/* Label text centered on top */}
      {label && <Text style={styles.label}>{label}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 28,
    position: 'relative',
    justifyContent: 'center',
  },
  fillTrack: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    borderRadius: 4,
    // Inset slightly so fill sits inside the frame
    marginHorizontal: 6,
    marginVertical: 4,
  },
  fill: {
    height: '100%',
    borderRadius: 2,
  },
  frameImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  label: {
    position: 'absolute',
    alignSelf: 'center',
    fontFamily: fonts.heading,
    fontSize: 9,
    letterSpacing: 1,
    color: '#e8dcc8',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
