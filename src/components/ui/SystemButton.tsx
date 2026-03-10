// src/components/ui/SystemButton.tsx
import React, { useCallback } from 'react';
import { Image, Pressable, StyleSheet, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { UI_ASSETS } from '@/assets/ui';

type SystemButtonVariant = 'close' | 'settings';

interface SystemButtonProps {
  variant?: SystemButtonVariant;
  onPress: () => void;
  size?: number;
  style?: ViewStyle;
}

export function SystemButton({
  variant = 'close',
  onPress,
  size = 44,
  style,
}: SystemButtonProps) {
  const source =
    variant === 'close'
      ? UI_ASSETS.system.closeOrnate
      : UI_ASSETS.system.closeDiamond;

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }, [onPress]);

  return (
    <Pressable onPress={handlePress} style={[styles.container, { width: size, height: size }, style]}>
      <Image
        source={source}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
