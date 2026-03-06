import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createMMKV } from 'react-native-mmkv';
import type { AccessibilitySettings, TextSize, TextSpeed, ColorblindMode } from '@/types/settings';
import { DEFAULT_ACCESSIBILITY } from '@/types/settings';

const storage = createMMKV({ id: 'questforge-settings' });

const mmkvStorage = {
  getItem: (name: string) => storage.getString(name) ?? null,
  setItem: (name: string, value: string) => storage.set(name, value),
  removeItem: (name: string) => storage.remove(name),
};

interface SettingsState {
  accessibility: AccessibilitySettings;
  setTextSize: (size: TextSize) => void;
  setHighContrast: (enabled: boolean) => void;
  setReduceMotion: (enabled: boolean) => void;
  setColorblindMode: (mode: ColorblindMode) => void;
  setDyslexiaFont: (enabled: boolean) => void;
  setScreenReaderOptimized: (enabled: boolean) => void;
  setTextSpeed: (speed: TextSpeed) => void;
  setHapticFeedback: (enabled: boolean) => void;
  resetAccessibility: () => void;
  selectedDiceSkin: string;
  setDiceSkin: (skinId: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      accessibility: DEFAULT_ACCESSIBILITY,
      setTextSize: (textSize) =>
        set((s) => ({ accessibility: { ...s.accessibility, textSize } })),
      setHighContrast: (highContrast) =>
        set((s) => ({ accessibility: { ...s.accessibility, highContrast } })),
      setReduceMotion: (reduceMotion) =>
        set((s) => ({ accessibility: { ...s.accessibility, reduceMotion } })),
      setColorblindMode: (colorblindMode) =>
        set((s) => ({ accessibility: { ...s.accessibility, colorblindMode } })),
      setDyslexiaFont: (dyslexiaFont) =>
        set((s) => ({ accessibility: { ...s.accessibility, dyslexiaFont } })),
      setScreenReaderOptimized: (screenReaderOptimized) =>
        set((s) => ({ accessibility: { ...s.accessibility, screenReaderOptimized } })),
      setTextSpeed: (textSpeed) =>
        set((s) => ({ accessibility: { ...s.accessibility, textSpeed } })),
      setHapticFeedback: (hapticFeedback) =>
        set((s) => ({ accessibility: { ...s.accessibility, hapticFeedback } })),
      resetAccessibility: () =>
        set({ accessibility: DEFAULT_ACCESSIBILITY }),
      selectedDiceSkin: 'obsidian',
      setDiceSkin: (selectedDiceSkin) => set({ selectedDiceSkin }),
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
