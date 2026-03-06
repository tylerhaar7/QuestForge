export type TextSize = 'small' | 'medium' | 'large' | 'xlarge';
export type TextSpeed = 'instant' | 'fast' | 'normal' | 'slow';
export type ColorblindMode = 'none' | 'deuteranopia' | 'protanopia' | 'tritanopia';

export interface AccessibilitySettings {
  textSize: TextSize;
  highContrast: boolean;
  reduceMotion: boolean;
  colorblindMode: ColorblindMode;
  dyslexiaFont: boolean;
  screenReaderOptimized: boolean;
  textSpeed: TextSpeed;
  hapticFeedback: boolean;
}

export const DEFAULT_ACCESSIBILITY: AccessibilitySettings = {
  textSize: 'medium',
  highContrast: false,
  reduceMotion: false,
  colorblindMode: 'none',
  dyslexiaFont: false,
  screenReaderOptimized: false,
  textSpeed: 'normal',
  hapticFeedback: true,
};

export const TEXT_SIZE_MULTIPLIER: Record<TextSize, number> = {
  small: 0.85,
  medium: 1.0,
  large: 1.2,
  xlarge: 1.4,
};
