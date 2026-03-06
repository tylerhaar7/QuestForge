import { fonts } from './typography';
import { colors } from './colors';
import type { TextSize, ColorblindMode } from '@/types/settings';
import { TEXT_SIZE_MULTIPLIER } from '@/types/settings';

/** Get font family based on dyslexia setting */
export function getFont(fontKey: keyof typeof fonts, dyslexiaFont: boolean): string {
  if (dyslexiaFont) return 'OpenDyslexic-Regular';
  return fonts[fontKey];
}

/** Scale a font size by the text size multiplier */
export function scaleFontSize(baseFontSize: number, textSize: TextSize): number {
  return Math.round(baseFontSize * TEXT_SIZE_MULTIPLIER[textSize]);
}

/** Remap colors for colorblind modes */
export function getColorblindColor(
  colorType: 'red' | 'green' | 'blue' | 'yellow',
  mode: ColorblindMode
): string {
  const remaps: Record<ColorblindMode, Record<string, string>> = {
    none: {},
    deuteranopia: {
      red: '#d4a017',
      green: '#2560a8',
    },
    protanopia: {
      red: '#d4a017',
      green: '#2560a8',
    },
    tritanopia: {
      blue: '#e85d75',
      green: '#d4a017',
    },
  };
  const defaultColors: Record<string, string> = {
    red: colors.combat.red,
    green: '#28a745',
    blue: '#2a52be',
    yellow: colors.gold.primary,
  };
  return remaps[mode]?.[colorType] ?? defaultColors[colorType] ?? defaultColors.red;
}

/** Get high-contrast color adjustments */
export function getHighContrastColors(enabled: boolean) {
  if (!enabled) return {};
  return {
    textPrimary: '#ffffff',
    textSecondary: '#d4d0c8',
    borderColor: colors.gold.primary,
  };
}
