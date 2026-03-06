import React, { createContext, useContext, useMemo } from 'react';
import { useSettingsStore } from '@/stores/useSettingsStore';
import type { AccessibilitySettings } from '@/types/settings';
import { getFont, scaleFontSize, getHighContrastColors } from '@/theme/accessibility';
import { fonts } from '@/theme/typography';

interface AccessibilityContextValue {
  settings: AccessibilitySettings;
  font: (key: keyof typeof fonts) => string;
  fontSize: (base: number) => number;
  skipAnimations: boolean;
  hapticsEnabled: boolean;
  textSpeed: AccessibilitySettings['textSpeed'];
  contrastOverrides: ReturnType<typeof getHighContrastColors>;
}

const AccessibilityContext = createContext<AccessibilityContextValue | null>(null);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const settings = useSettingsStore((s) => s.accessibility);

  const value = useMemo<AccessibilityContextValue>(() => ({
    settings,
    font: (key) => getFont(key, settings.dyslexiaFont),
    fontSize: (base) => scaleFontSize(base, settings.textSize),
    skipAnimations: settings.reduceMotion,
    hapticsEnabled: settings.hapticFeedback,
    textSpeed: settings.textSpeed,
    contrastOverrides: getHighContrastColors(settings.highContrast),
  }), [settings]);

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility(): AccessibilityContextValue {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) throw new Error('useAccessibility must be used within AccessibilityProvider');
  return ctx;
}
