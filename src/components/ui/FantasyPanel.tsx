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

// ─── Corner Stud (metal bolt decoration) ──────────────────────────────────────

function Stud({ size, position }: { size: number; position: ViewStyle }) {
  return (
    <View
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: '#3a3028',
          borderWidth: 1,
          borderTopColor: '#6a5a48',
          borderLeftColor: '#5a4a38',
          borderBottomColor: '#1a1208',
          borderRightColor: '#2a2018',
        },
        position,
      ]}
    />
  );
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

// ─── Component ────────────────────────────────────────────────────────────────

export function FantasyPanel({ variant, children, style }: FantasyPanelProps) {
  const v = VARIANTS[variant];
  const studOffset = -(v.studSize / 2 - v.frameWidth / 2);

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
      {/* Parchment inner surface */}
      <View
        style={[
          styles.parchment,
          {
            backgroundColor: v.parchmentColor,
            borderRadius: v.innerRadius,
          },
          v.contentPadding,
        ]}
      >
        {/* Wood-grain edge highlight */}
        <View
          style={[
            styles.innerEdge,
            {
              borderRadius: v.innerRadius,
              borderColor: 'rgba(90,58,24,0.15)',
            },
          ]}
        />
        {children}
      </View>

      {/* Corner studs */}
      {v.showStuds && (
        <>
          <Stud size={v.studSize} position={{ top: studOffset, left: studOffset }} />
          <Stud size={v.studSize} position={{ top: studOffset, right: studOffset }} />
          <Stud size={v.studSize} position={{ bottom: studOffset, left: studOffset }} />
          <Stud size={v.studSize} position={{ bottom: studOffset, right: studOffset }} />
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
  innerEdge: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
  },
});
