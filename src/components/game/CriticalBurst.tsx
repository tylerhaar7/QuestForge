// CriticalBurst — One-shot gold particle burst for critical hits (nat 20).
// 24 particles arranged radially, flying outward while fading. Fires once on mount.

import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';

interface CriticalBurstProps {
  centerX: number;
  centerY: number;
}

const PARTICLE_COUNT = 24;
const ANGLE_STEP = 360 / PARTICLE_COUNT; // 15 degrees
const BURST_DURATION = 600;

// Gold tones for the burst particles
const GOLD_COLORS = [
  '#d4a843',
  '#b48c3c',
  '#e8c54a',
  '#c9a22e',
  '#dbb84d',
];

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

interface BurstParticleProps {
  angleDeg: number;
  index: number;
}

const BurstParticle = React.memo(function BurstParticle({ angleDeg, index }: BurstParticleProps) {
  // Per-particle random variation for organic feel
  const distance = useMemo(() => randomBetween(100, 160), []);
  const duration = useMemo(() => randomBetween(450, BURST_DURATION), []);
  const size = useMemo(() => randomBetween(4, 6), []);
  const delayMs = useMemo(() => randomBetween(0, 60), []);
  const color = useMemo(() => GOLD_COLORS[index % GOLD_COLORS.length], [index]);

  // Convert angle to radians for target position
  const angleRad = (angleDeg * Math.PI) / 180;
  const targetX = Math.cos(angleRad) * distance;
  const targetY = Math.sin(angleRad) * distance;

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);

  useEffect(() => {
    const easing = Easing.out(Easing.cubic);

    translateX.value = withDelay(
      delayMs,
      withTiming(targetX, { duration, easing }),
    );
    translateY.value = withDelay(
      delayMs,
      withTiming(targetY, { duration, easing }),
    );
    opacity.value = withDelay(
      delayMs,
      withTiming(0, { duration, easing: Easing.in(Easing.quad) }),
    );
    scale.value = withDelay(
      delayMs,
      withTiming(0.3, { duration, easing }),
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
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

export function CriticalBurst({ centerX, centerY }: CriticalBurstProps) {
  const particles = useMemo(
    () => Array.from({ length: PARTICLE_COUNT }, (_, i) => i),
    [],
  );

  return (
    <View
      style={[styles.container, { left: centerX, top: centerY }]}
      pointerEvents="none"
    >
      {particles.map((i) => (
        <BurstParticle
          key={i}
          index={i}
          angleDeg={i * ANGLE_STEP}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: 0,
    height: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
