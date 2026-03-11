// src/components/ui/InventorySlot.tsx
import React from 'react';
import { Image, Text, View, StyleSheet, ViewStyle } from 'react-native';
import { UI_ASSETS } from '@/assets/ui';
import { fonts } from '@/theme/typography';

interface InventorySlotProps {
  icon?: string;
  label?: string;
  empty?: boolean;
  variant?: 'square' | 'wide';
  children?: React.ReactNode;
  style?: ViewStyle;
}

export function InventorySlot({
  icon,
  label,
  empty = false,
  variant = 'square',
  children,
  style,
}: InventorySlotProps) {
  const source =
    variant === 'square' ? UI_ASSETS.slot.square : UI_ASSETS.slot.wide;
  const size = variant === 'square' ? 64 : 80;

  return (
    <View style={[styles.wrapper, { width: size, height: size }, style]}>
      {/* Frame image */}
      <Image
        source={source}
        style={StyleSheet.absoluteFillObject}
        resizeMode="stretch"
      />

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

      {/* Label chip at bottom */}
      {label && (
        <View style={styles.labelChip}>
          <Text style={styles.label} numberOfLines={1}>
            {label}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconArea: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  icon: {
    fontSize: 20,
    color: '#e8dcc8',
  },
  labelChip: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 3,
    paddingVertical: 1,
    paddingHorizontal: 2,
  },
  label: {
    fontFamily: fonts.body,
    fontSize: 8,
    color: '#e8dcc8',
    textAlign: 'center',
  },
  emptyText: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: '#5a4a2a',
  },
});
