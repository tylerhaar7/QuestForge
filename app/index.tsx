import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/services/supabase';
import { colors } from '@/theme/colors';

export default function IndexScreen() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkAuthAndRoute();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.replace('/(auth)/login');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function checkAuthAndRoute() {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.replace('/(auth)/login');
        return;
      }

      // Check if user has any characters
      const { data: characters } = await supabase
        .from('characters')
        .select('id')
        .eq('user_id', session.user.id)
        .limit(1);

      if (!characters || characters.length === 0) {
        router.replace('/create');
        return;
      }

      // Has character — go to game
      router.replace('/game/session');
    } catch {
      router.replace('/(auth)/login');
    } finally {
      setChecking(false);
    }
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg.primary }}>
      <ActivityIndicator size="large" color={colors.gold.primary} />
    </View>
  );
}
