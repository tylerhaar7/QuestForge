// src/assets/ui.ts
// Central index of all fantasy UI art assets (Moon Tribe RPG Pack).
// Components import from here instead of using require() directly.

import { ImageSourcePropType } from 'react-native';

export const UI_ASSETS = {
  // Panels / Content Frames
  panel: {
    card: require('../../assets/ui/panel-card.png') as ImageSourcePropType,
    pinned: require('../../assets/ui/panel-pinned.png') as ImageSourcePropType,
    modal: require('../../assets/ui/panel-modal.png') as ImageSourcePropType,
    button: require('../../assets/ui/panel-button.png') as ImageSourcePropType,
    strip: require('../../assets/ui/panel-strip.png') as ImageSourcePropType,
  },

  // Portrait Frames
  portrait: {
    ornate: require('../../assets/ui/portrait-ornate.png') as ImageSourcePropType,
    simple: require('../../assets/ui/portrait-simple.png') as ImageSourcePropType,
  },

  // Status Bars
  bar: {
    hp: require('../../assets/ui/bar-hp.png') as ImageSourcePropType,
    mana: require('../../assets/ui/bar-mana.png') as ImageSourcePropType,
    xp: require('../../assets/ui/bar-xp.png') as ImageSourcePropType,
  },

  // Inventory / Equipment Slots
  slot: {
    square: require('../../assets/ui/slot-square.png') as ImageSourcePropType,
    wide: require('../../assets/ui/slot-wide.png') as ImageSourcePropType,
  },

  // Action Buttons
  action: {
    rune: require('../../assets/ui/action-rune.png') as ImageSourcePropType,
    ember: require('../../assets/ui/action-ember.png') as ImageSourcePropType,
  },

  // System Buttons
  system: {
    closeOrnate: require('../../assets/ui/system-close-ornate.png') as ImageSourcePropType,
    closeDiamond: require('../../assets/ui/system-close-diamond.png') as ImageSourcePropType,
  },

  // Map
  map: {
    border: require('../../assets/ui/map-border.png') as ImageSourcePropType,
  },
} as const;
