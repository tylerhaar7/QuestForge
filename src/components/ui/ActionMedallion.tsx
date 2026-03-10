// src/components/ui/ActionMedallion.tsx
import React, { useCallback } from 'react';
import {
  ImageBackground,
  Pressable,
  Text,
  View,
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

export type MedallionVariant = 'rune' | 'ember';

interface ActionMedallionProps {
  variant?: MedallionVariant;
  icon?: string;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
}

const MEDALLION_SOURCES: Record<MedallionVariant, any> = {
  rune: UI_ASSETS.action.rune,   // Combat abilities
  ember: UI_ASSETS.action.ember,  // HUD buttons
};

export function ActionMedallion({
  variant = 'rune',
  icon,
  label,
  onPress,
  disabled = false,
  style,
}: ActionMedallionProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    if (disabled) return;
    scale.value = withSpring(0.92, { damping: 20, stiffness: 300 });
  }, [scale, disabled]);

  const handlePressOut = useCallback(() => {
    if (disabled) return;
    scale.value = withSpring(1, { damping: 20, stiffness: 300 });
  }, [scale, disabled]);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
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
          source={MEDALLION_SOURCES[variant]}
          resizeMode="contain"
          style={[styles.background, disabled && styles.disabled]}
        >
          <View style={styles.content}>
            {icon && <Text style={styles.icon}>{icon}</Text>}
            <Text style={styles.label} numberOfLines={1}>
              {label}
            </Text>
          </View>
        </ImageBackground>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  background: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.4,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 20,
    marginBottom: 2,
  },
  label: {
    fontFamily: fonts.heading,
    fontSize: 8,
    letterSpacing: 1,
    color: '#e8dcc8',
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
