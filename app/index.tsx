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
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!characters || characters.length === 0) {
        router.replace('/create');
        return;
      }

      // Check for active campaign
      const { data: campaigns } = await supabase
        .from('campaigns')
        .select('*')
        .eq('user_id', session.user.id)
        .order('updated_at', { ascending: false })
        .limit(1);

      if (!campaigns || campaigns.length === 0) {
        // Has character but no campaign — go to campaign start
        router.replace({
          pathname: '/create/campaign-start',
          params: { characterId: characters[0].id },
        });
        return;
      }

      // Has campaign — load into store and go to game
      const { getCharacter } = await import('@/services/character');
      const { getActiveCampaign } = await import('@/services/campaign');
      const { useGameStore } = await import('@/stores/useGameStore');

      const character = await getCharacter(characters[0].id);
      const campaign = await getActiveCampaign(session.user.id);

      if (campaign) {
        const store = useGameStore.getState();
        store.setCharacter(character);
        store.setCampaign(campaign);

        // Restore last narration from turn history
        const turnHistory = (campaigns[0].turn_history || []) as any[];
        const lastAssistant = [...turnHistory].reverse().find((t: any) => t.role === 'assistant');
        if (lastAssistant) {
          try {
            const parsed = JSON.parse(lastAssistant.content);
            store.processAIResponse(parsed);
          } catch {
            // If can't parse, just show a default
          }
        }
      }

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
