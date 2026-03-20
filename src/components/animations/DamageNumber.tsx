import React, { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

import { colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';
import { COMBAT } from '@/constants/animations';

type DamageNumberProps = {
  value: number;
  type: 'damage' | 'heal' | 'critical';
  onComplete?: () => void;
};

const TYPE_CONFIG = {
  damage: {
    color: colors.combat.red,
    fontSize: 24,
    scalePeak: 1.2,
    prefix: '',
  },
  heal: {
    color: '#4a8c3c',
    fontSize: 24,
    scalePeak: 1.2,
    prefix: '+',
  },
  critical: {
    color: colors.gold.bright,
    fontSize: 32,
    scalePeak: 1.4,
    prefix: '',
  },
} as const;

export function DamageNumber({ value, type, onComplete }: DamageNumberProps) {
  const config = TYPE_CONFIG[type];

  const translateY = useSharedValue(0);
  const scale = useSharedValue(0.5);
  const opacity = useSharedValue(1);

  useEffect(() => {
    // Float upward over the full duration
    translateY.value = withTiming(-COMBAT.DAMAGE_FLOAT_DISTANCE, {
      duration: COMBAT.DAMAGE_FLOAT_DURATION,
      easing: Easing.out(Easing.cubic),
    });

    // Scale: 0.5 -> peak over 150ms, then peak -> 1.0 over 150ms
    scale.value = withSequence(
      withTiming(config.scalePeak, { duration: 150, easing: Easing.out(Easing.cubic) }),
      withTiming(1.0, { duration: 150, easing: Easing.inOut(Easing.cubic) }),
    );

    // Opacity: hold at 1 for 400ms, then fade to 0 over 200ms
    opacity.value = withDelay(
      400,
      withTiming(0, {
        duration: 200,
        easing: Easing.out(Easing.quad),
      }, (finished) => {
        if (finished && onComplete) {
          runOnJS(onComplete)();
        }
      }),
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]} pointerEvents="none">
      <Text style={[styles.text, { color: config.color, fontSize: config.fontSize }]}>
        {config.prefix}{value}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: fonts.heading,
    fontWeight: '900',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
});
