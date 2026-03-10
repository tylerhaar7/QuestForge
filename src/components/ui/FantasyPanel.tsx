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

// Padding insets per variant — derived from measuring each asset's actual
// parchment safe-area. Sized for typical phone widths (340–375 px panels).
//
// Measured safe areas (from 512-px source images):
//   modal  → 59 % w × 45 % h  ⇒  ~20 % L/R, ~29 % T, ~27 % B
//   card   → 86 % w × 63 % h  ⇒  ~7 % L/R, ~18 % T/B
//   pinned → 82 % w × 70 % h  ⇒  ~9 % L/R, ~15 % T/B
//   button → ~80 % w × 70 % h ⇒  ~10 % L/R, ~15 % T/B
//   strip  → ~60 % w × 50 % h ⇒  large dead space
const VARIANT_PADDING: Record<PanelVariant, ViewStyle> = {
  card:   { paddingHorizontal: 32, paddingVertical: 36 },
  pinned: { paddingHorizontal: 36, paddingVertical: 40 },
  modal:  { paddingHorizontal: 64, paddingVertical: 72 },
  button: { paddingHorizontal: 40, paddingVertical: 32 },
  strip:  { paddingHorizontal: 32, paddingVertical: 24 },
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
    // No borderRadius — let the ornate frame corners render naturally
  },
  content: {
    // Base styles — variant padding applied dynamically
  },
});
