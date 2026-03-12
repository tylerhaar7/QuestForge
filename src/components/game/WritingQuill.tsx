// WritingQuill — Animated feather quill that bobs while the DM's text types out.
// Built with Views (no images), positioned at the bottom-right of narrative panel.
import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  cancelAnimation,
  Easing,
  type SharedValue,
} from 'react-native-reanimated';

interface WritingQuillProps {
  isWriting: boolean;
  speed?: number; // char delay in ms — faster text = faster quill bob
  posX: SharedValue<number>;
  posY: SharedValue<number>;
}

const QUILL = {
  feather: '#c8a87c',
  spine: '#a08058',
  shaft: '#8b6b4a',
  nib: '#2a1a08',
  ink: '#3a2810',
};

// Offset so the nib tip aligns with the text cursor position
const NIB_OFFSET_X = -20;
const NIB_OFFSET_Y = -26;

export function WritingQuill({ isWriting, speed = 30, posX, posY }: WritingQuillProps) {
  const bobY = useSharedValue(0);
  const tilt = useSharedValue(0);
  const fade = useSharedValue(0);

  useEffect(() => {
    if (isWriting) {
      fade.value = withTiming(1, { duration: 400 });

      const bobMs = Math.max(speed * 4, 80);
      bobY.value = withRepeat(
        withSequence(
          withTiming(-2, { duration: bobMs, easing: Easing.inOut(Easing.sin) }),
          withTiming(2, { duration: bobMs, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
      );
      tilt.value = withRepeat(
        withSequence(
          withTiming(-3, { duration: bobMs * 1.4, easing: Easing.inOut(Easing.sin) }),
          withTiming(3, { duration: bobMs * 1.4, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
      );
    } else {
      fade.value = withTiming(0, { duration: 500 });
      cancelAnimation(bobY);
      cancelAnimation(tilt);
      bobY.value = withTiming(0, { duration: 200 });
      tilt.value = withTiming(0, { duration: 200 });
    }

    return () => {
      cancelAnimation(bobY);
      cancelAnimation(tilt);
      cancelAnimation(fade);
    };
  }, [isWriting, speed]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fade.value,
    left: posX.value + NIB_OFFSET_X,
    top: posY.value + NIB_OFFSET_Y,
    transform: [
      { translateY: bobY.value },
      { rotate: `${tilt.value}deg` },
    ],
  }));

  return (
    <Animated.View style={[styles.wrapper, animatedStyle]} pointerEvents="none">
      <View style={styles.quill}>
        {/* Feather vane — asymmetric rounded shape */}
        <View style={styles.feather}>
          {/* Spine ridge down the center-right */}
          <View style={styles.spine} />
          {/* Barb lines for texture */}
          <View style={[styles.barb, styles.barb1]} />
          <View style={[styles.barb, styles.barb2]} />
          <View style={[styles.barb, styles.barb3]} />
        </View>

        {/* Bare shaft below feather */}
        <View style={styles.shaft} />

        {/* Metal nib — small triangle */}
        <View style={styles.nib} />

        {/* Ink dot at the tip */}
        <View style={styles.inkDot} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
  },
  quill: {
    alignItems: 'center',
    transform: [{ rotate: '-30deg' }],
  },
  feather: {
    width: 14,
    height: 32,
    backgroundColor: QUILL.feather,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 4,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 1,
    overflow: 'hidden',
  },
  spine: {
    position: 'absolute',
    right: 4,
    top: 4,
    bottom: 0,
    width: 1.5,
    backgroundColor: QUILL.spine,
    borderRadius: 1,
  },
  barb: {
    position: 'absolute',
    height: 1,
    backgroundColor: 'rgba(160,128,88,0.4)',
    borderRadius: 0.5,
  },
  barb1: {
    top: 8,
    left: 1,
    right: 6,
    transform: [{ rotate: '-15deg' }],
  },
  barb2: {
    top: 15,
    left: 1,
    right: 6,
    transform: [{ rotate: '-12deg' }],
  },
  barb3: {
    top: 22,
    left: 2,
    right: 6,
    transform: [{ rotate: '-8deg' }],
  },
  shaft: {
    width: 3,
    height: 10,
    backgroundColor: QUILL.shaft,
    borderRadius: 1,
  },
  nib: {
    width: 0,
    height: 0,
    borderLeftWidth: 3,
    borderRightWidth: 3,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: QUILL.nib,
  },
  inkDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: QUILL.ink,
    opacity: 0.7,
    marginTop: -1,
  },
});
