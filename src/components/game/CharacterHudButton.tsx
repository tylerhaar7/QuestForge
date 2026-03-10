import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { fonts } from '@/theme/typography';
import { CLASS_ICONS } from '@/data/classIcons';
import type { ClassName } from '@/types/game';

interface CharacterHudButtonProps {
  className: ClassName;
  onPress: () => void;
}

export function CharacterHudButton({ className, onPress }: CharacterHudButtonProps) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Pressable style={styles.container} onPress={handlePress}>
      <Text style={styles.iconText}>{CLASS_ICONS[className]}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 30,
    height: 30,
    borderWidth: 1.5,
    borderColor: '#b48c3c',
    borderRadius: 6,
    backgroundColor: 'rgba(13, 10, 8, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 14,
  },
});
