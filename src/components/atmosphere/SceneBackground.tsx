// SceneBackground — Mood-driven atmospheric backdrop with ambient light effects.
// Sits behind MoodParticles. Crossfades between moods over 500ms.
// Uses plain Views with backgroundColor (no LinearGradient — compatible with Expo Go).

import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import { useGameStore } from '@/stores/useGameStore';
import { useAccessibility } from '@/providers/AccessibilityProvider';
import { ATMOSPHERE } from '@/constants/animations';
import type { MoodType } from '@/types/game';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// ─── Mood Atmosphere Configs ────────────────────────────

interface MoodAtmosphere {
  /** Base background color (middle of the would-be gradient) */
  bgColor: string;
  /** Slightly different top tint */
  topColor: string;
  /** Ambient overlay type */
  ambient: 'firelight' | 'fog' | 'rays' | 'vignette' | 'shimmer' | 'pulse' | 'none';
  /** Ambient overlay color */
  ambientColor: string;
  /** Ambient intensity (opacity ceiling) */
  ambientIntensity: number;
  /** Ambient cycle speed in ms */
  ambientSpeed: number;
}

const MOOD_ATMOSPHERES: Record<MoodType, MoodAtmosphere> = {
  tavern: {
    bgColor: '#1a1510',
    topColor: '#1a1208',
    ambient: 'firelight',
    ambientColor: 'rgba(220,150,50,0.08)',
    ambientIntensity: 0.12,
    ambientSpeed: 3000,
  },
  camp: {
    bgColor: '#1a1208',
    topColor: '#1a1208',
    ambient: 'firelight',
    ambientColor: 'rgba(240,140,40,0.10)',
    ambientIntensity: 0.15,
    ambientSpeed: 2500,
  },
  dungeon: {
    bgColor: '#0f0e0c',
    topColor: '#0a0a0a',
    ambient: 'fog',
    ambientColor: 'rgba(140,135,125,0.06)',
    ambientIntensity: 0.08,
    ambientSpeed: 8000,
  },
  forest: {
    bgColor: '#101a10',
    topColor: '#0a100a',
    ambient: 'rays',
    ambientColor: 'rgba(140,200,80,0.05)',
    ambientIntensity: 0.08,
    ambientSpeed: 6000,
  },
  combat: {
    bgColor: '#1a0f0f',
    topColor: '#1a0808',
    ambient: 'vignette',
    ambientColor: 'rgba(200,30,30,0.10)',
    ambientIntensity: 0.15,
    ambientSpeed: 2000,
  },
  boss: {
    bgColor: '#1a0a0a',
    topColor: '#1a0505',
    ambient: 'pulse',
    ambientColor: 'rgba(220,30,20,0.12)',
    ambientIntensity: 0.18,
    ambientSpeed: 1500,
  },
  town: {
    bgColor: '#1a1815',
    topColor: '#12100e',
    ambient: 'none',
    ambientColor: 'transparent',
    ambientIntensity: 0,
    ambientSpeed: 0,
  },
  threshold: {
    bgColor: '#0f0f1a',
    topColor: '#08081a',
    ambient: 'shimmer',
    ambientColor: 'rgba(100,80,200,0.06)',
    ambientIntensity: 0.10,
    ambientSpeed: 4000,
  },
};

// ─── Ambient Overlay ──────────────────────────────────

function AmbientOverlay({ config, skipAnimations }: { config: MoodAtmosphere; skipAnimations: boolean }) {
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (skipAnimations || config.ambient === 'none') {
      opacity.value = 0;
      return;
    }

    const { ambientIntensity: peak, ambientSpeed: speed } = config;

    switch (config.ambient) {
      case 'firelight':
        opacity.value = withRepeat(
          withSequence(
            withTiming(peak, { duration: speed * 0.3, easing: Easing.inOut(Easing.sin) }),
            withTiming(peak * 0.5, { duration: speed * 0.2, easing: Easing.inOut(Easing.sin) }),
            withTiming(peak * 0.85, { duration: speed * 0.25, easing: Easing.inOut(Easing.sin) }),
            withTiming(peak * 0.4, { duration: speed * 0.25, easing: Easing.inOut(Easing.sin) }),
          ), -1,
        );
        translateX.value = withRepeat(
          withSequence(
            withTiming(8, { duration: speed * 0.6, easing: Easing.inOut(Easing.sin) }),
            withTiming(-8, { duration: speed * 0.6, easing: Easing.inOut(Easing.sin) }),
          ), -1,
        );
        break;
      case 'fog':
        opacity.value = withRepeat(
          withSequence(
            withTiming(peak, { duration: speed * 0.4, easing: Easing.inOut(Easing.sin) }),
            withTiming(peak * 0.3, { duration: speed * 0.6, easing: Easing.inOut(Easing.sin) }),
          ), -1,
        );
        translateX.value = withRepeat(
          withSequence(
            withTiming(20, { duration: speed, easing: Easing.inOut(Easing.sin) }),
            withTiming(-20, { duration: speed, easing: Easing.inOut(Easing.sin) }),
          ), -1,
        );
        break;
      case 'rays':
        opacity.value = withRepeat(
          withSequence(
            withTiming(peak, { duration: speed * 0.5, easing: Easing.inOut(Easing.sin) }),
            withTiming(peak * 0.2, { duration: speed * 0.5, easing: Easing.inOut(Easing.sin) }),
          ), -1,
        );
        translateY.value = withRepeat(
          withSequence(
            withTiming(-15, { duration: speed * 0.7, easing: Easing.inOut(Easing.sin) }),
            withTiming(15, { duration: speed * 0.7, easing: Easing.inOut(Easing.sin) }),
          ), -1,
        );
        break;
      case 'vignette':
        opacity.value = withRepeat(
          withSequence(
            withTiming(peak, { duration: speed * 0.4, easing: Easing.inOut(Easing.sin) }),
            withTiming(peak * 0.6, { duration: speed * 0.6, easing: Easing.inOut(Easing.sin) }),
          ), -1,
        );
        break;
      case 'pulse':
        opacity.value = withRepeat(
          withSequence(
            withTiming(peak, { duration: speed * 0.3, easing: Easing.out(Easing.quad) }),
            withTiming(peak * 0.3, { duration: speed * 0.7, easing: Easing.in(Easing.quad) }),
          ), -1,
        );
        scale.value = withRepeat(
          withSequence(
            withTiming(1.03, { duration: speed * 0.3, easing: Easing.out(Easing.quad) }),
            withTiming(1, { duration: speed * 0.7, easing: Easing.in(Easing.quad) }),
          ), -1,
        );
        break;
      case 'shimmer':
        opacity.value = withRepeat(
          withSequence(
            withTiming(peak, { duration: speed * 0.5, easing: Easing.inOut(Easing.sin) }),
            withTiming(peak * 0.2, { duration: speed * 0.5, easing: Easing.inOut(Easing.sin) }),
          ), -1,
        );
        translateY.value = withRepeat(
          withSequence(
            withTiming(-10, { duration: speed * 0.8, easing: Easing.inOut(Easing.sin) }),
            withTiming(10, { duration: speed * 0.8, easing: Easing.inOut(Easing.sin) }),
          ), -1,
        );
        break;
    }

    return () => {
      cancelAnimation(opacity);
      cancelAnimation(translateX);
      cancelAnimation(translateY);
      cancelAnimation(scale);
    };
  }, [config, skipAnimations]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  if (config.ambient === 'none') return null;

  // Vignette/pulse: tinted edges using absolute positioned Views
  if (config.ambient === 'vignette' || config.ambient === 'pulse') {
    return (
      <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]} pointerEvents="none">
        <View style={[styles.edgeTop, { backgroundColor: config.ambientColor }]} />
        <View style={[styles.edgeBottom, { backgroundColor: config.ambientColor }]} />
        <View style={[styles.edgeLeft, { backgroundColor: config.ambientColor }]} />
        <View style={[styles.edgeRight, { backgroundColor: config.ambientColor }]} />
      </Animated.View>
    );
  }

  // All other ambient types: a single tinted overlay that drifts
  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, { backgroundColor: config.ambientColor }, animatedStyle]}
      pointerEvents="none"
    />
  );
}

// ─── SceneBackground ──────────────────────────────────

export function SceneBackground() {
  const currentMood = useGameStore((s) => s.currentMood);
  const { skipAnimations } = useAccessibility();

  const config = MOOD_ATMOSPHERES[currentMood] || MOOD_ATMOSPHERES.dungeon;

  // Crossfade on mood change
  const fadeOpacity = useSharedValue(1);

  useEffect(() => {
    fadeOpacity.value = 0;
    fadeOpacity.value = withTiming(1, {
      duration: ATMOSPHERE.SCENE_CROSSFADE,
      easing: Easing.inOut(Easing.quad),
    });
  }, [currentMood]);

  const fadeStyle = useAnimatedStyle(() => ({
    opacity: fadeOpacity.value,
  }));

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Two-tone background: top half slightly different from bottom */}
      <Animated.View style={[StyleSheet.absoluteFill, fadeStyle]}>
        <View style={[styles.topHalf, { backgroundColor: config.topColor }]} />
        <View style={[styles.bottomHalf, { backgroundColor: config.bgColor }]} />
      </Animated.View>

      {/* Animated ambient overlay */}
      <AmbientOverlay key={currentMood} config={config} skipAnimations={skipAnimations} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  topHalf: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  bottomHalf: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  edgeTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: SCREEN_H * 0.25,
  },
  edgeBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_H * 0.25,
  },
  edgeLeft: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: SCREEN_W * 0.2,
  },
  edgeRight: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: SCREEN_W * 0.2,
  },
});
