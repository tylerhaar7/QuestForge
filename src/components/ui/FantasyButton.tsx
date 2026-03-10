// src/components/ui/FantasyButton.tsx
import React, { useCallback } from 'react';
import {
  ImageBackground,
  Pressable,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { UI_ASSETS } from '@/assets/ui';
import { fonts } from '@/theme/typography';

export type ButtonVariant = 'primary' | 'secondary' | 'danger';

interface FantasyButtonProps {
  variant?: ButtonVariant;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
}

const VARIANT_SOURCES: Record<ButtonVariant, any> = {
  primary: UI_ASSETS.panel.button,
  secondary: UI_ASSETS.panel.strip,
  danger: UI_ASSETS.panel.strip,
};

export function FantasyButton({
  variant = 'primary',
  label,
  onPress,
  disabled = false,
  style,
}: FantasyButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.96, { damping: 20, stiffness: 300 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 20, stiffness: 300 });
  }, [scale]);

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
        <ImageBackground
          source={VARIANT_SOURCES[variant]}
          resizeMode="stretch"
          style={[styles.background, disabled && styles.disabled]}
          imageStyle={styles.image}
        >
          <Text
            style={[
              styles.label,
              variant === 'danger' && styles.labelDanger,
            ]}
          >
            {label}
          </Text>
        </ImageBackground>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  background: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    borderRadius: 4,
  },
  disabled: {
    opacity: 0.4,
  },
  label: {
    fontFamily: fonts.heading,
    fontSize: 14,
    letterSpacing: 1.5,
    color: '#3a2810', // Dark ink on parchment
    textTransform: 'uppercase',
  },
  labelDanger: {
    color: '#8b1a1a',
  },
});
