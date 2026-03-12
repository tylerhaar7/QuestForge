// src/components/ui/FantasyButton.tsx
// Fantasy-themed button using CSS Views (consistent with FantasyPanel approach).
import React, { useCallback } from 'react';
import { Pressable, Text, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { PARCHMENT_TEXT } from '@/theme/colors';
import { fonts } from '@/theme/typography';

export type ButtonVariant = 'primary' | 'secondary' | 'danger';

interface FantasyButtonProps {
  variant?: ButtonVariant;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
}

interface ButtonConfig {
  frameWidth: number;
  frameColor: string;
  frameRadius: number;
  parchmentColor: string;
  innerRadius: number;
  textColor: string;
}

const BUTTON_VARIANTS: Record<ButtonVariant, ButtonConfig> = {
  primary: {
    frameWidth: 5,
    frameColor: '#2e1e10',
    frameRadius: 8,
    parchmentColor: '#d4c4a0',
    innerRadius: 4,
    textColor: PARCHMENT_TEXT.primary,
  },
  secondary: {
    frameWidth: 3,
    frameColor: '#3a2a18',
    frameRadius: 6,
    parchmentColor: '#ddd0b4',
    innerRadius: 3,
    textColor: PARCHMENT_TEXT.primary,
  },
  danger: {
    frameWidth: 3,
    frameColor: '#3a2a18',
    frameRadius: 6,
    parchmentColor: '#ddd0b4',
    innerRadius: 3,
    textColor: '#8b1a1a',
  },
};

export function FantasyButton({
  variant = 'primary',
  label,
  onPress,
  disabled = false,
  style,
}: FantasyButtonProps) {
  const scale = useSharedValue(1);
  const config = BUTTON_VARIANTS[variant];

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    if (disabled) return;
    scale.value = withSpring(0.96, { damping: 20, stiffness: 300 });
  }, [scale, disabled]);

  const handlePressOut = useCallback(() => {
    if (disabled) return;
    scale.value = withSpring(1, { damping: 20, stiffness: 300 });
  }, [scale, disabled]);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  }, [onPress]);

  return (
    <Animated.View style={[animatedStyle, style]}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
      >
        <View
          style={[
            styles.frame,
            {
              backgroundColor: config.frameColor,
              borderRadius: config.frameRadius,
              padding: config.frameWidth,
            },
            disabled && styles.disabled,
          ]}
        >
          <View
            style={[
              styles.parchment,
              {
                backgroundColor: config.parchmentColor,
                borderRadius: config.innerRadius,
                borderWidth: 1,
                borderColor: 'rgba(90,58,24,0.15)',
              },
            ]}
          >
            <Text style={[styles.label, { color: config.textColor }]}>
              {label}
            </Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  frame: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  parchment: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  disabled: {
    opacity: 0.4,
  },
  label: {
    fontFamily: fonts.heading,
    fontSize: 14,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});
