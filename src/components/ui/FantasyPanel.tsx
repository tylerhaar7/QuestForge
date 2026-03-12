// src/components/ui/FantasyPanel.tsx
// Fantasy-themed panel: wood frame + parchment + corner studs.
// Uses styled Views instead of ImageBackground to avoid stretch distortion.
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

export type PanelVariant = 'card' | 'pinned' | 'modal' | 'button' | 'strip';

interface FantasyPanelProps {
  variant: PanelVariant;
  children: React.ReactNode;
  style?: ViewStyle;
}

// ─── Variant configs ──────────────────────────────────────────────────────────

interface VariantConfig {
  frameWidth: number;
  frameColor: string;
  frameRadius: number;
  parchmentColor: string;
  innerRadius: number;
  studSize: number;
  contentPadding: ViewStyle;
  showStuds: boolean;
}

const VARIANTS: Record<PanelVariant, VariantConfig> = {
  card: {
    frameWidth: 6,
    frameColor: '#2e1e10',
    frameRadius: 10,
    parchmentColor: '#d4c4a0',
    innerRadius: 5,
    studSize: 10,
    contentPadding: { paddingHorizontal: 14, paddingVertical: 12 },
    showStuds: true,
  },
  pinned: {
    frameWidth: 4,
    frameColor: '#3a2a18',
    frameRadius: 8,
    parchmentColor: '#d8caa6',
    innerRadius: 4,
    studSize: 12,
    contentPadding: { paddingHorizontal: 16, paddingVertical: 14 },
    showStuds: true,
  },
  modal: {
    frameWidth: 8,
    frameColor: '#2e1e10',
    frameRadius: 12,
    parchmentColor: '#d4c4a0',
    innerRadius: 5,
    studSize: 12,
    contentPadding: { paddingHorizontal: 18, paddingVertical: 16 },
    showStuds: true,
  },
  button: {
    frameWidth: 5,
    frameColor: '#2e1e10',
    frameRadius: 8,
    parchmentColor: '#d4c4a0',
    innerRadius: 4,
    studSize: 8,
    contentPadding: { paddingHorizontal: 16, paddingVertical: 10 },
    showStuds: true,
  },
  strip: {
    frameWidth: 3,
    frameColor: '#3a2a18',
    frameRadius: 6,
    parchmentColor: '#ddd0b4',
    innerRadius: 3,
    studSize: 0,
    contentPadding: { paddingHorizontal: 12, paddingVertical: 8 },
    showStuds: false,
  },
};

// ─── Precomputed stud styles (avoids fresh objects per render) ────────────────

const STUD_BASE = {
  position: 'absolute' as const,
  backgroundColor: '#3a3028',
  borderWidth: 1,
  borderTopColor: '#6a5a48',
  borderLeftColor: '#5a4a38',
  borderBottomColor: '#1a1208',
  borderRightColor: '#2a2018',
};

interface PrecomputedStuds {
  size: ViewStyle;
  topLeft: ViewStyle;
  topRight: ViewStyle;
  bottomLeft: ViewStyle;
  bottomRight: ViewStyle;
}

const PRECOMPUTED_STUDS: Partial<Record<PanelVariant, PrecomputedStuds>> = {};

for (const [key, v] of Object.entries(VARIANTS)) {
  if (!v.showStuds) continue;
  const offset = -(v.studSize / 2 - v.frameWidth / 2);
  const sizeStyle = { width: v.studSize, height: v.studSize, borderRadius: v.studSize / 2 };
  PRECOMPUTED_STUDS[key as PanelVariant] = {
    size: sizeStyle,
    topLeft: { top: offset, left: offset },
    topRight: { top: offset, right: offset },
    bottomLeft: { bottom: offset, left: offset },
    bottomRight: { bottom: offset, right: offset },
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FantasyPanel({ variant, children, style }: FantasyPanelProps) {
  const v = VARIANTS[variant];
  const studs = PRECOMPUTED_STUDS[variant];

  return (
    <View
      style={[
        styles.outerFrame,
        {
          backgroundColor: v.frameColor,
          borderRadius: v.frameRadius,
          padding: v.frameWidth,
        },
        style,
      ]}
    >
      {/* Parchment inner surface with inset border */}
      <View
        style={[
          styles.parchment,
          {
            backgroundColor: v.parchmentColor,
            borderRadius: v.innerRadius,
            borderWidth: 1,
            borderColor: 'rgba(90,58,24,0.15)',
          },
          v.contentPadding,
        ]}
      >
        {children}
      </View>

      {/* Corner studs */}
      {studs && (
        <>
          <View style={[STUD_BASE, studs.size, studs.topLeft]} />
          <View style={[STUD_BASE, studs.size, studs.topRight]} />
          <View style={[STUD_BASE, studs.size, studs.bottomLeft]} />
          <View style={[STUD_BASE, studs.size, studs.bottomRight]} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  outerFrame: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  parchment: {
    overflow: 'hidden',
  },
});
