// NarrativeText — Typewriter text with tap-to-complete
// Font: IM Fell English (narrative), warm off-white text on dark bg

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors } from '@/theme/colors';
import { textStyles, spacing } from '@/theme/typography';

interface NarrativeTextProps {
  text: string;
  speed?: 'instant' | 'fast' | 'normal' | 'slow';
  onComplete?: () => void;
}

const SPEED_MS: Record<string, number> = {
  instant: 0,
  fast: 15,
  normal: 30,
  slow: 50,
};

export function NarrativeText({ text, speed = 'normal', onComplete }: NarrativeTextProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const indexRef = useRef(0);
  const opacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const completeText = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setDisplayedText(text);
    setIsComplete(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onComplete?.();
  }, [text, onComplete]);

  useEffect(() => {
    // Reset on new text
    indexRef.current = 0;
    setDisplayedText('');
    setIsComplete(false);
    opacity.value = withTiming(1, { duration: 300 });

    const delayMs = SPEED_MS[speed] || SPEED_MS.normal;

    if (delayMs === 0 || !text) {
      setDisplayedText(text);
      setIsComplete(true);
      onComplete?.();
      return;
    }

    intervalRef.current = setInterval(() => {
      indexRef.current += 1;
      if (indexRef.current >= text.length) {
        setDisplayedText(text);
        setIsComplete(true);
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = null;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onComplete?.();
      } else {
        setDisplayedText(text.slice(0, indexRef.current));
      }
    }, delayMs);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [text, speed]);

  return (
    <Pressable onPress={isComplete ? undefined : completeText} style={styles.container}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View style={animatedStyle}>
          <Text style={styles.text}>{displayedText}</Text>
          {!isComplete && <Text style={styles.cursor}>|</Text>}
        </Animated.View>
      </ScrollView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  scroll: {
    flex: 1,
  },
  text: {
    ...textStyles.narrative,
    color: colors.text.primary,
  },
  cursor: {
    ...textStyles.narrative,
    color: colors.gold.primary,
    opacity: 0.6,
  },
});
