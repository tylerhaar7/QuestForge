// src/components/ui/FantasyPanel.tsx
import React from 'react';
import { ImageBackground, StyleSheet, View, ViewStyle } from 'react-native';
import { UI_ASSETS } from '@/assets/ui';

export type PanelVariant = 'card' | 'pinned' | 'modal' | 'button' | 'strip';

interface FantasyPanelProps {
  variant: PanelVariant;
  children: React.ReactNode;
  style?: ViewStyle;
}

const VARIANT_ASSETS: Record<PanelVariant, any> = {
  card: UI_ASSETS.panel.card,
  pinned: UI_ASSETS.panel.pinned,
  modal: UI_ASSETS.panel.modal,
  button: UI_ASSETS.panel.button,
  strip: UI_ASSETS.panel.strip,
};

// Padding insets per variant — how far content should be from the image edges
// to sit inside the visible parchment area. Adjust after visual testing.
const VARIANT_PADDING: Record<PanelVariant, ViewStyle> = {
  card: { paddingHorizontal: 24, paddingVertical: 20 },
  pinned: { paddingHorizontal: 28, paddingVertical: 24 },
  modal: { paddingHorizontal: 28, paddingVertical: 28 },
  button: { paddingHorizontal: 20, paddingVertical: 12 },
  strip: { paddingHorizontal: 16, paddingVertical: 10 },
};

export function FantasyPanel({ variant, children, style }: FantasyPanelProps) {
  return (
    <ImageBackground
      source={VARIANT_ASSETS[variant]}
      resizeMode="stretch"
      style={[styles.container, style]}
      imageStyle={styles.image}
    >
      <View style={[styles.content, VARIANT_PADDING[variant]]}>
        {children}
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  image: {
    borderRadius: 4,
  },
  content: {
    // Base styles — variant padding applied dynamically
  },
});
