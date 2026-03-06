import { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/services/supabase';
import { colors } from '@/theme/colors';

function parseAIContent(content: string): any | null {
  try {
    // Try direct JSON parse first
    const direct = JSON.parse(content);
    if (direct.narration) return direct;
    // If narration itself contains a JSON code block (AI nested response), extract it
    if (typeof direct.narration === 'string' && direct.narration.includes('```')) {
      const inner = extractJson(direct.narration);
      if (inner?.narration) return inner;
    }
    return direct;
  } catch {
    // Try extracting JSON from markdown code blocks
    return extractJson(content);
  }
}

function extractJson(text: string): any | null {
  try {
    const codeBlock = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlock) return JSON.parse(codeBlock[1].trim());
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch {}
  return null;
}

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
        setDebugMsg('No session, going to login...');
        router.replace('/(auth)/login');
        return;
      }

      setDebugMsg('Logged in, checking characters...');
      // Check if user has any characters
      const { data: characters } = await supabase
        .from('characters')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!characters || characters.length === 0) {
        setDebugMsg('No characters, going to create...');
        router.replace('/create');
        return;
      }

      setDebugMsg('Found character, checking campaigns...');
      // Check for active campaign
      const { data: campaigns } = await supabase
        .from('campaigns')
        .select('*')
        .eq('user_id', session.user.id)
        .order('updated_at', { ascending: false })
        .limit(1);

      if (!campaigns || campaigns.length === 0) {
        router.replace({
          pathname: '/create/campaign-start',
          params: { characterId: characters[0].id },
        });
        return;
      }

      setDebugMsg('Loading campaign...');
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

        const turnHistory = (campaigns[0].turn_history || []) as any[];
        const lastAssistant = [...turnHistory].reverse().find((t: any) => t.role === 'assistant');
        if (lastAssistant) {
          const parsed = parseAIContent(lastAssistant.content);
          if (parsed) {
            store.processAIResponse(parsed);
          }
        }
      }

      router.replace('/game/session');
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
