import { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/services/supabase';
import { colors } from '@/theme/colors';

export default function IndexScreen() {
  const router = useRouter();
  const [debugMsg, setDebugMsg] = useState('Initializing...');

  useEffect(() => {
    // Small delay to ensure router is mounted
    const timer = setTimeout(() => checkAuthAndRoute(), 200);
    return () => clearTimeout(timer);
  }, []);

  async function checkAuthAndRoute() {
    try {
      setDebugMsg('Checking auth...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        setDebugMsg(`Auth error: ${sessionError.message}`);
        setTimeout(() => router.replace('/(auth)/login'), 500);
        return;
      }

      if (!session) {
        setDebugMsg('No session, going to menu...');
        router.replace('/menu');
        return;
      }

      // Logged in — go to main menu (menu handles campaign loading)
      router.replace('/menu');
    } catch (err) {
      setDebugMsg(`Error: ${err instanceof Error ? err.message : String(err)}`);
      setTimeout(() => router.replace('/(auth)/login'), 1000);
    }
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg.primary }}>
      <ActivityIndicator size="large" color={colors.gold.primary} />
      <Text style={{ color: colors.text.tertiary, marginTop: 16, fontSize: 12 }}>{debugMsg}</Text>
    </View>
  );
}
