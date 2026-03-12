// src/components/ui/PortraitFrame.tsx
import React from 'react';
import { Image, View, StyleSheet, ViewStyle } from 'react-native';
import { UI_ASSETS } from '@/assets/ui';
import { colors } from '@/theme/colors';

type PortraitSize = 'sm' | 'md' | 'lg';
type PortraitVariant = 'ornate' | 'simple';

interface PortraitFrameProps {
  size?: PortraitSize;
  variant?: PortraitVariant;
  children: React.ReactNode;
  style?: ViewStyle;
}

const SIZE_MAP: Record<PortraitSize, number> = {
  sm: 48,
  md: 72,
  lg: 96,
};

// Content area is smaller than the frame to sit inside the ring
const CONTENT_RATIO = 0.62;

export function PortraitFrame({
  size = 'md',
  variant = 'ornate',
  children,
  style,
}: PortraitFrameProps) {
  const frameSize = SIZE_MAP[size];
  const contentSize = Math.round(frameSize * CONTENT_RATIO);

  const source =
    variant === 'ornate'
      ? UI_ASSETS.portrait.ornate
      : UI_ASSETS.portrait.simple;

  return (
    <View style={[styles.container, { width: frameSize, height: frameSize }, style]}>
      {/* Content area (circular, centered) */}
      <View
        style={[
          styles.content,
          {
            width: contentSize,
            height: contentSize,
            borderRadius: contentSize / 2,
          },
        ]}
      >
        {children}
      </View>

      {/* Frame overlay */}
      <Image
        source={source}
        style={[styles.frame, { width: frameSize, height: frameSize }]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg.secondary,
  },
  frame: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
