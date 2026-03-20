// useScreenShake — Applies a horizontal screen shake for combat feedback.
// Light shake for regular hits, heavy for crits/boss attacks.

import { useCallback } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { COMBAT } from '@/constants/animations';

type ShakeIntensity = 'light' | 'heavy';

const SHAKE_CONFIG = {
  light: COMBAT.SCREEN_SHAKE_LIGHT,
  heavy: COMBAT.SCREEN_SHAKE_HEAVY,
} as const;

export function useScreenShake() {
  const translateX = useSharedValue(0);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const triggerShake = useCallback(
    (intensity: ShakeIntensity) => {
      const { distance, cycles, duration } = SHAKE_CONFIG[intensity];
      const segmentDuration = duration / (cycles * 2);

      const segments: Parameters<typeof withSequence> = [
        withTiming(distance, { duration: segmentDuration }),
      ];

      for (let i = 0; i < cycles; i++) {
        if (i > 0) segments.push(withTiming(distance, { duration: segmentDuration }));
        segments.push(withTiming(-distance, { duration: segmentDuration }));
      }

      // Return to rest
      segments.push(withTiming(0, { duration: segmentDuration }));

      translateX.value = withSequence(...segments) as unknown as number;
    },
    [translateX],
  );

  return { shakeStyle, triggerShake };
}
