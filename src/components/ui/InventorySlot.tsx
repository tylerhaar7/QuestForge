// src/components/ui/InventorySlot.tsx
// Fantasy inventory slot using CSS Views (consistent with FantasyPanel approach).
import React from 'react';
import { Pressable, Text, View, StyleSheet, ViewStyle } from 'react-native';
import { fonts } from '@/theme/typography';

interface InventorySlotProps {
  icon?: string;
  label?: string;
  empty?: boolean;
  variant?: 'square' | 'wide';
  onPress?: () => void;
  children?: React.ReactNode;
  style?: ViewStyle;
}

const SLOT_COLORS = {
  frame: '#2e1e10',
  inset: '#1a1208',
  insetBorder: '#3a2a18',
  highlight: 'rgba(180,140,60,0.08)',
  labelBg: 'rgba(42,26,8,0.85)',
  labelText: '#d4c4a0',
  icon: '#c8b898',
  emptyText: '#5a4a2a',
};

export function InventorySlot({
  icon,
  label,
  empty = false,
  variant = 'square',
  onPress,
  children,
  style,
}: InventorySlotProps) {
  const size = variant === 'square' ? 72 : 88;

  const content = (
    <View style={[styles.outer, { width: size }, style]}>
      {/* Slot frame */}
      <View style={[styles.frame, { width: size, height: size }]}>
        {/* Dark inset area */}
        <View style={styles.inset}>
          {/* Subtle highlight at top */}
          <View style={styles.highlight} />

          {/* Icon centered */}
          <View style={styles.iconArea}>
            {children ? (
              children
            ) : (
              <>
                {icon && <Text style={styles.icon}>{icon}</Text>}
                {empty && <Text style={styles.emptyText}>—</Text>}
              </>
            )}
          </View>
        </View>
      </View>

      {/* Label below the slot */}
      {label && (
        <View style={styles.labelContainer}>
          <Text style={styles.label} numberOfLines={1}>
            {label}
          </Text>
        </View>
      )}
    </View>
  );

  if (onPress) {
    return <Pressable onPress={onPress}>{content}</Pressable>;
  }

  return content;
}

const styles = StyleSheet.create({
  outer: {
    alignItems: 'center',
  },
  frame: {
    backgroundColor: SLOT_COLORS.frame,
    borderRadius: 6,
    padding: 3,
    // Beveled edge effect
    borderWidth: 1,
    borderTopColor: '#4a3a28',
    borderLeftColor: '#3a2a18',
    borderBottomColor: '#1a0e04',
    borderRightColor: '#1a0e04',
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 3,
  },
  inset: {
    flex: 1,
    backgroundColor: SLOT_COLORS.inset,
    borderRadius: 4,
    borderWidth: 1,
    borderTopColor: '#0e0a04',
    borderLeftColor: '#0e0a04',
    borderBottomColor: SLOT_COLORS.insetBorder,
    borderRightColor: SLOT_COLORS.insetBorder,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '30%',
    backgroundColor: SLOT_COLORS.highlight,
  },
  iconArea: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 24,
    color: SLOT_COLORS.icon,
  },
  emptyText: {
    fontFamily: fonts.body,
    fontSize: 18,
    color: SLOT_COLORS.emptyText,
  },
  labelContainer: {
    marginTop: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    backgroundColor: SLOT_COLORS.labelBg,
    borderRadius: 3,
    maxWidth: '100%',
  },
  label: {
    fontFamily: fonts.headingRegular,
    fontSize: 9,
    color: SLOT_COLORS.labelText,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
});
