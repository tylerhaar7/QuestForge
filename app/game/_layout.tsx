import { Stack } from 'expo-router';
import { colors } from '@/theme/colors';
import { TRANSITIONS } from '@/constants/animations';

export default function GameLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg.primary },
        animation: 'fade',
        animationDuration: TRANSITIONS.FADE_IN,
      }}
    >
      {/* Main session — gentle fade (default) */}
      <Stack.Screen name="session" />

      {/* Menu-style overlays — slide up from bottom like game panels */}
      <Stack.Screen name="character" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="journal" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="camp" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="map" options={{ animation: 'slide_from_bottom' }} />

      {/* Death → Threshold — dramatic slow fade */}
      <Stack.Screen name="threshold" options={{ animation: 'fade_from_bottom' }} />

      {/* Level-Up — dramatic, no swipe back */}
      <Stack.Screen name="level-up" options={{ animation: 'fade_from_bottom', gestureEnabled: false }} />

      {/* Recap — gentle fade (default) */}
      <Stack.Screen name="recap" />
    </Stack>
  );
}
