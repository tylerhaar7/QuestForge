// NarrativeText — Variable-speed typewriter with paragraph queuing,
// punctuation pauses, blinking cursor, and tap-to-skip.
// Font: IM Fell English (narrative), warm off-white text on dark bg.

import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import { Text, Pressable, StyleSheet, ScrollView, View, type TextStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  cancelAnimation,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, PARCHMENT_TEXT } from '@/theme/colors';
import { textStyles, spacing, fonts } from '@/theme/typography';
import { useAccessibility } from '@/providers/AccessibilityProvider';
import { WritingQuill } from './WritingQuill';
import { useTypewriter } from '@/hooks/useTypewriter';
import { TYPEWRITER } from '@/constants/animations';

type FontKey = keyof typeof fonts;

interface NarrativeTextProps {
  text: string;
  speed?: 'instant' | 'fast' | 'normal' | 'slow';
  onComplete?: () => void;
}

// Parse **bold** and *italic* markdown into styled Text spans
function renderMarkdown(
  text: string,
  baseStyle: TextStyle,
  getFont: (key: FontKey) => string,
): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    if (match[2]) {
      // Bold: **text**
      parts.push(
        <Text key={key++} style={{ fontFamily: getFont('headingRegular') }}>
          {match[2]}
        </Text>
      );
    } else if (match[3]) {
      // Italic: *text*
      parts.push(
        <Text key={key++} style={{ fontStyle: 'italic' }}>
          {match[3]}
        </Text>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

export function NarrativeText({ text, speed, onComplete }: NarrativeTextProps) {
  const {
    textSpeed: settingsSpeed,
    skipAnimations,
    hapticsEnabled,
    font: getFont,
    fontSize: scaleFontSize,
  } = useAccessibility();

  const effectiveSpeed = speed ?? settingsSpeed;
  const scrollRef = useRef<ScrollView>(null);
  const quillX = useSharedValue(0);
  const quillY = useSharedValue(0);

  // ─── Typewriter hook ──────────────────────────────────
  const handleComplete = useCallback(() => {
    if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onComplete?.();
  }, [hapticsEnabled, onComplete]);

  const { displayedText, isComplete, isTyping, skip } = useTypewriter({
    text,
    speed: effectiveSpeed,
    skipAnimations,
    onComplete: handleComplete,
  });

  // ─── Container fade-in ────────────────────────────────
  const opacity = useSharedValue(0);
  useEffect(() => {
    if (skipAnimations) {
      opacity.value = 1;
    } else {
      opacity.value = withTiming(1, { duration: TYPEWRITER.FADE_IN_MS });
    }
  }, [text, skipAnimations]);

  const fadeStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  // ─── Blinking cursor ─────────────────────────────────
  const cursorOpacity = useSharedValue(1);

  useEffect(() => {
    if (isComplete || skipAnimations) {
      // Fade out cursor after completion
      cancelAnimation(cursorOpacity);
      cursorOpacity.value = withTiming(0, { duration: 400 });
      return;
    }

    // Blink while typing
    cursorOpacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: TYPEWRITER.CURSOR_BLINK_MS }),
        withTiming(1, { duration: TYPEWRITER.CURSOR_BLINK_MS }),
      ),
      -1,
    );

    return () => cancelAnimation(cursorOpacity);
  }, [isComplete, skipAnimations]);

  const cursorStyle = useAnimatedStyle(() => ({
    opacity: cursorOpacity.value,
  }));

  // ─── Quill position tracking ──────────────────────────
  const handleTextLayout = useCallback(
    (e: { nativeEvent: { lines: { x: number; y: number; width: number; height: number }[] } }) => {
      const { lines } = e.nativeEvent;
      if (lines.length > 0) {
        const lastLine = lines[lines.length - 1];
        quillX.value = lastLine.x + lastLine.width;
        quillY.value = lastLine.y;
      }
    },
    [],
  );

  // ─── Auto-scroll ─────────────────────────────────────
  useEffect(() => {
    if (displayedText && !isComplete) {
      scrollRef.current?.scrollToEnd({ animated: false });
    }
  }, [displayedText, isComplete]);

  // ─── Text style ──────────────────────────────────────
  const baseTextStyle: TextStyle = useMemo(
    () => ({
      ...textStyles.narrative,
      color: PARCHMENT_TEXT.primary,
      fontFamily: getFont('narrative'),
      fontSize: scaleFontSize(16),
    }),
    [getFont, scaleFontSize],
  );

  const renderedText = useMemo(
    () => renderMarkdown(displayedText, baseTextStyle, getFont),
    [displayedText, baseTextStyle, getFont],
  );

  // ─── Speed for quill ─────────────────────────────────
  const delayMs = skipAnimations
    ? 0
    : (TYPEWRITER.CHAR_MIN_MS + TYPEWRITER.CHAR_MAX_MS) / 2 *
      (TYPEWRITER.SPEED_MULTIPLIER[effectiveSpeed] ?? 1);

  return (
    <Pressable onPress={isComplete ? undefined : skip} style={styles.container}>
      <ScrollView ref={scrollRef} style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View style={[fadeStyle, styles.textContainer]}>
          <Text style={baseTextStyle} onTextLayout={handleTextLayout}>
            {renderedText}
            {/* Inline blinking cursor */}
            {!isComplete && displayedText.length > 0 && (
              <Animated.Text style={[styles.cursor, cursorStyle]}>
                {'\u258E'}
              </Animated.Text>
            )}
          </Text>
          <WritingQuill
            isWriting={isTyping && delayMs > 0}
            speed={delayMs}
            posX={quillX}
            posY={quillY}
          />
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
  textContainer: {
    overflow: 'visible',
  },
  cursor: {
    color: PARCHMENT_TEXT.accent,
    fontSize: 16,
  },
});
