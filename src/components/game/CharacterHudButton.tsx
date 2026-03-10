import React from 'react';
import { Pressable, View, Text, Image, StyleSheet } from 'react-native';
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
      <View style={styles.iconFrame}>
        <Image source={CLASS_ICONS[className]} style={styles.iconImage} />
      </View>
      <Text style={styles.label}>Character</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(13, 10, 8, 0.85)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(180, 140, 60, 0.4)',
    paddingVertical: 4,
    paddingHorizontal: 6,
    gap: 5,
    marginRight: 8,
  },
  iconFrame: {
    width: 22,
    height: 22,
    borderWidth: 1.5,
    borderColor: '#b48c3c',
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconImage: {
    width: 16,
    height: 16,
    resizeMode: 'contain',
  },
  label: {
    fontFamily: fonts.heading,
    fontSize: 9,
    color: '#e8dcc8',
    letterSpacing: 1,
  },
});
