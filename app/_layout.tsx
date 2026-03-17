// Root layout — wraps the entire app
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, ActivityIndicator } from 'react-native';
import { colors } from '@/theme/colors';
import { AccessibilityProvider } from '@/providers/AccessibilityProvider';
import { ErrorBoundary } from '@/components/ErrorBoundary';

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

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg.primary }}>
        <ActivityIndicator size="large" color={colors.gold.primary} />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
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
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
