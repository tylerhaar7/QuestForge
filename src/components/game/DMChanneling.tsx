// DMChanneling — Atmospheric loading animation that replaces the plain spinner
// while waiting for the AI DM to respond. Shows the WritingQuill bobbing with
// ink drops falling from the nib and a rotating set of flavor messages.

import React, { useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  cancelAnimation,
  Easing,
  runOnJS,
  type SharedValue,
} from 'react-native-reanimated';
import { WritingQuill } from '@/components/game/WritingQuill';
import { useAccessibility } from '@/providers/AccessibilityProvider';
import { PARCHMENT_TEXT } from '@/theme/colors';
import { fonts, spacing } from '@/theme/typography';

const MESSAGES = [
  'The DM consults ancient tomes...',
  'Fate is being woven...',
  'The quill awaits inspiration...',
  'Destinies intertwine...',
  'The threads of story gather...',
  'Arcane ink swirls with purpose...',
  'The tale takes shape...',
];

const INK_COLOR = '#3a2810';
const INK_SIZE = 4;
const INK_DRIFT = 25;
const INK_DURATION = 2000;
const INK_STAGGER = 600;
const MESSAGE_INTERVAL = 3000;
const MESSAGE_FADE_DURATION = 400;

export function DMChanneling() {
  const { skipAnimations, font } = useAccessibility();

  // Constant shared values to center the quill in the container.
  // WritingQuill applies its own NIB_OFFSET internally, so we position
  // so the quill ends up roughly centered horizontally, upper area vertically.
  const posX = useSharedValue(0);
  const posY = useSharedValue(0);

  // --- Ink drops ---
  const ink0Y = useSharedValue(0);
  const ink0Opacity = useSharedValue(0);
  const ink1Y = useSharedValue(0);
  const ink1Opacity = useSharedValue(0);
  const ink2Y = useSharedValue(0);
  const ink2Opacity = useSharedValue(0);

  // --- Message rotation ---
  const [messageIndex, setMessageIndex] = React.useState(0);
  const messageFade = useSharedValue(1);

  const advanceMessage = useCallback(() => {
    setMessageIndex((prev) => (prev + 1) % MESSAGES.length);
  }, []);

  useEffect(() => {
    if (skipAnimations) return;

    // Start ink drop loops — each drop fades in, drifts down, fades out, resets.
    const startInkDrop = (
      y: SharedValue<number>,
      opacity: SharedValue<number>,
      delay: number,
    ) => {
      y.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(0, { duration: 0 }),
            withTiming(INK_DRIFT, {
              duration: INK_DURATION,
              easing: Easing.out(Easing.quad),
            }),
          ),
          -1,
        ),
      );
      opacity.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(0.7, { duration: 200 }),
            withTiming(0.7, { duration: INK_DURATION - 600 }),
            withTiming(0, { duration: 400 }),
          ),
          -1,
        ),
      );
    };

    startInkDrop(ink0Y, ink0Opacity, 0);
    startInkDrop(ink1Y, ink1Opacity, INK_STAGGER);
    startInkDrop(ink2Y, ink2Opacity, INK_STAGGER * 2);

    // Message rotation interval
    const interval = setInterval(() => {
      // Fade out
      messageFade.value = withTiming(0, { duration: MESSAGE_FADE_DURATION }, () => {
        runOnJS(advanceMessage)();
        // Fade in (after state updates)
        messageFade.value = withTiming(1, { duration: MESSAGE_FADE_DURATION });
      });
    }, MESSAGE_INTERVAL);

    return () => {
      clearInterval(interval);
      cancelAnimation(ink0Y);
      cancelAnimation(ink0Opacity);
      cancelAnimation(ink1Y);
      cancelAnimation(ink1Opacity);
      cancelAnimation(ink2Y);
      cancelAnimation(ink2Opacity);
      cancelAnimation(messageFade);
    };
  }, [skipAnimations]);

  // Animated styles for ink drops
  const inkDrop0Style = useAnimatedStyle(() => ({
    opacity: ink0Opacity.value,
    transform: [{ translateY: ink0Y.value }],
  }));
  const inkDrop1Style = useAnimatedStyle(() => ({
    opacity: ink1Opacity.value,
    transform: [{ translateY: ink1Y.value }],
  }));
  const inkDrop2Style = useAnimatedStyle(() => ({
    opacity: ink2Opacity.value,
    transform: [{ translateY: ink2Y.value }],
  }));

  const messageStyle = useAnimatedStyle(() => ({
    opacity: skipAnimations ? 1 : messageFade.value,
  }));

  const narrativeFont = font('narrativeItalic');

  return (
    <View style={styles.container}>
      {/* Quill area — centered, with relative positioning for ink drops */}
      <View style={styles.quillArea}>
        <View style={styles.quillAnchor}>
          <WritingQuill
            isWriting={true}
            posX={posX}
            posY={posY}
          />
        </View>

        {/* Ink drops below the quill nib */}
        {!skipAnimations && (
          <View style={styles.inkDropContainer}>
            <Animated.View style={[styles.inkDrop, inkDrop0Style, { left: -4 }]} />
            <Animated.View style={[styles.inkDrop, inkDrop1Style, { left: 0 }]} />
            <Animated.View style={[styles.inkDrop, inkDrop2Style, { left: 4 }]} />
          </View>
        )}
      </View>

      {/* Rotating message */}
      <Animated.Text
        style={[
          styles.message,
          messageStyle,
          { fontFamily: narrativeFont },
        ]}
      >
        {MESSAGES[messageIndex]}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  quillArea: {
    alignItems: 'center',
    height: 90,
    justifyContent: 'flex-start',
    marginBottom: spacing.md,
  },
  quillAnchor: {
    // The WritingQuill is absolutely positioned; this view provides
    // a reference frame. We size it so the quill sits visually centered.
    width: 40,
    height: 60,
    position: 'relative',
  },
  inkDropContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginTop: -4,
  },
  inkDrop: {
    width: INK_SIZE,
    height: INK_SIZE,
    borderRadius: INK_SIZE / 2,
    backgroundColor: INK_COLOR,
    marginHorizontal: 2,
  },
  message: {
    fontSize: 14,
    color: PARCHMENT_TEXT.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
