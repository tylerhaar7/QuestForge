// MoodParticles — Ambient floating particles behind the game UI, styled per mood.
// Each particle manages its own reanimated shared values for continuous drift.

import React, { useEffect, useMemo } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  cancelAnimation,
  Easing,
  type SharedValue,
} from 'react-native-reanimated';
import { useGameStore } from '@/stores/useGameStore';
import { useAccessibility } from '@/providers/AccessibilityProvider';
import type { MoodType } from '@/types/game';

// ─── Particle Config per Mood ─────────────────────────────

interface ParticleConfig {
  count: number;
  colors: string[];
  sizeRange: [number, number];
  speedRange: [number, number]; // Y travel duration in ms
  opacityRange: [number, number];
  direction: 'down' | 'up' | 'diagonal';
  driftX: number; // max horizontal wobble in px
}

const MOOD_CONFIGS: Record<MoodType, ParticleConfig> = {
  dungeon: {
    count: 30,
    colors: ['rgba(160,150,135,0.8)', 'rgba(140,130,115,0.7)', 'rgba(120,110,95,0.75)'],
    sizeRange: [3, 6],
    speedRange: [6000, 10000],
    opacityRange: [0.4, 0.7],
    direction: 'down',
    driftX: 20,
  },
  combat: {
    count: 35,
    colors: ['rgba(240,90,30,0.85)', 'rgba(220,60,20,0.8)', 'rgba(255,140,50,0.75)'],
    sizeRange: [3, 6],
    speedRange: [3000, 5500],
    opacityRange: [0.5, 0.8],
    direction: 'up',
    driftX: 15,
  },
  tavern: {
    count: 28,
    colors: ['rgba(220,180,90,0.75)', 'rgba(210,170,70,0.7)', 'rgba(200,155,60,0.65)'],
    sizeRange: [3, 5],
    speedRange: [7000, 11000],
    opacityRange: [0.35, 0.65],
    direction: 'down',
    driftX: 25,
  },
  forest: {
    count: 30,
    colors: ['rgba(130,200,70,0.75)', 'rgba(190,210,70,0.7)', 'rgba(110,175,60,0.65)'],
    sizeRange: [3, 6],
    speedRange: [6000, 9000],
    opacityRange: [0.4, 0.7],
    direction: 'diagonal',
    driftX: 40,
  },
  town: {
    count: 25,
    colors: ['rgba(180,170,150,0.7)', 'rgba(160,150,130,0.6)', 'rgba(190,180,160,0.55)'],
    sizeRange: [3, 5],
    speedRange: [8000, 12000],
    opacityRange: [0.3, 0.6],
    direction: 'down',
    driftX: 15,
  },
  camp: {
    count: 30,
    colors: ['rgba(240,150,50,0.8)', 'rgba(220,130,40,0.75)', 'rgba(210,110,30,0.7)'],
    sizeRange: [3, 5],
    speedRange: [4000, 7000],
    opacityRange: [0.45, 0.75],
    direction: 'up',
    driftX: 20,
  },
  threshold: {
    count: 32,
    colors: ['rgba(120,90,220,0.8)', 'rgba(100,70,200,0.75)', 'rgba(160,120,240,0.7)'],
    sizeRange: [3, 6],
    speedRange: [5000, 8000],
    opacityRange: [0.4, 0.7],
    direction: 'down',
    driftX: 30,
  },
  boss: {
    count: 40,
    colors: ['rgba(240,50,20,0.85)', 'rgba(220,40,15,0.8)', 'rgba(255,100,40,0.75)'],
    sizeRange: [3, 7],
    speedRange: [2500, 4500],
    opacityRange: [0.55, 0.85],
    direction: 'up',
    driftX: 18,
  },
};

// ─── Helpers ──────────────────────────────────────────────

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

// ─── Single Particle ─────────────────────────────────────

interface ParticleProps {
  config: ParticleConfig;
  index: number;
  containerOpacity: SharedValue<number>;
}

const Particle = React.memo(function Particle({ config, index, containerOpacity }: ParticleProps) {
  const size = useMemo(
    () => randomBetween(config.sizeRange[0], config.sizeRange[1]),
    [config.sizeRange[0], config.sizeRange[1]],
  );
  const color = useMemo(
    () => config.colors[index % config.colors.length],
    [config.colors, index],
  );
  const startX = useMemo(() => randomBetween(0, SCREEN_W), []);
  const speed = useMemo(
    () => randomBetween(config.speedRange[0], config.speedRange[1]),
    [config.speedRange[0], config.speedRange[1]],
  );
  const delay = useMemo(() => randomBetween(0, speed * 0.6), [speed]);

  // Shared values
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const travelDistance = SCREEN_H + 40;
    const isRising = config.direction === 'up';

    // Y drift: travel full screen height then reset
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0, { duration: 0 }),
          withTiming(
            isRising ? -travelDistance : travelDistance,
            { duration: speed, easing: Easing.linear },
          ),
        ),
        -1,
      ),
    );

    // X wobble: gentle side-to-side
    const xDrift = config.driftX;
    const diagonal = config.direction === 'diagonal';
    translateX.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(diagonal ? xDrift * 1.5 : xDrift, {
            duration: speed * 0.5,
            easing: Easing.inOut(Easing.sin),
          }),
          withTiming(diagonal ? xDrift * 0.3 : -xDrift, {
            duration: speed * 0.5,
            easing: Easing.inOut(Easing.sin),
          }),
        ),
        -1,
        true,
      ),
    );

    // Opacity pulse: fade in, hold, fade out per cycle
    const opacityTarget = randomBetween(config.opacityRange[0], config.opacityRange[1]);
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(opacityTarget, { duration: speed * 0.15 }),
          withTiming(opacityTarget, { duration: speed * 0.65 }),
          withTiming(0, { duration: speed * 0.2 }),
          withTiming(0, { duration: 0 }),
        ),
        -1,
      ),
    );

    return () => {
      cancelAnimation(translateY);
      cancelAnimation(translateX);
      cancelAnimation(opacity);
    };
  }, [config, speed, delay]);

  const isRising = config.direction === 'up';
  const startY = isRising ? SCREEN_H + 20 : -20;

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value * containerOpacity.value,
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
    ],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: startX,
          top: startY,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        animatedStyle,
      ]}
    />
  );
});

// ─── MoodParticles Container ──────────────────────────────

export function MoodParticles() {
  const currentMood = useGameStore((s) => s.currentMood);
  const { skipAnimations } = useAccessibility();
  const containerOpacity = useSharedValue(1);

  const config = MOOD_CONFIGS[currentMood] || MOOD_CONFIGS.dungeon;

  // Generate particle keys that remount on mood change
  const particles = useMemo(() => {
    return Array.from({ length: config.count }, (_, i) => i);
  }, [currentMood, config.count]);

  // Fade out/in when mood changes
  useEffect(() => {
    containerOpacity.value = withSequence(
      withTiming(0, { duration: 300 }),
      withTiming(1, { duration: 500 }),
    );
  }, [currentMood]);

  if (skipAnimations) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.map((i) => (
        <Particle
          key={`${currentMood}-${i}`}
          config={config}
          index={i}
          containerOpacity={containerOpacity}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
});
