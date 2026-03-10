// src/components/ui/InventorySlot.tsx
import React from 'react';
import { ImageBackground, Text, StyleSheet, ViewStyle } from 'react-native';
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
    <ImageBackground
      source={source}
      resizeMode="contain"
      style={[styles.container, { width: size, height: size }, style]}
      imageStyle={styles.image}
    >
      {children ? (
        children
      ) : (
        <>
          {icon && <Text style={styles.icon}>{icon}</Text>}
          {label && (
            <Text style={styles.label} numberOfLines={1}>
              {label}
            </Text>
          )}
          {empty && <Text style={styles.emptyText}>—</Text>}
        </>
      )}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {},
  icon: {
    fontSize: 20,
  },
  label: {
    fontFamily: fonts.body,
    fontSize: 8,
    color: '#e8dcc8',
    textAlign: 'center',
    marginTop: 2,
  },
  emptyText: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: '#5a4a2a',
  },
});
