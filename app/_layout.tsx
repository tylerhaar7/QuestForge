// Root layout — wraps the entire app
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, ActivityIndicator } from 'react-native';
import { colors } from '@/theme/colors';
import { AccessibilityProvider } from '@/providers/AccessibilityProvider';
import { bootstrapEncryptedStorage } from '@/services/supabase';

const queryClient = new QueryClient();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Cinzel-Regular': require('../assets/fonts/Cinzel-Regular.ttf'),
    'Cinzel-Bold': require('../assets/fonts/Cinzel-Bold.ttf'),
    'CrimsonText-Regular': require('../assets/fonts/CrimsonText-Regular.ttf'),
    'CrimsonText-Bold': require('../assets/fonts/CrimsonText-Bold.ttf'),
    'CrimsonText-Italic': require('../assets/fonts/CrimsonText-Italic.ttf'),
    'IMFellEnglish-Regular': require('../assets/fonts/IMFellEnglish-Regular.ttf'),
    'IMFellEnglish-Italic': require('../assets/fonts/IMFellEnglish-Italic.ttf'),
    'OpenDyslexic-Regular': require('../assets/fonts/OpenDyslexic-Regular.ttf'),
  });

  useEffect(() => {
    bootstrapEncryptedStorage().catch(() => {});
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg.primary }}>
        <ActivityIndicator size="large" color={colors.gold.primary} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AccessibilityProvider>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.bg.primary },
              animation: 'fade',
            }}
          />
        </AccessibilityProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
