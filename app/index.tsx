import { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/services/supabase';
import { colors } from '@/theme/colors';

function parseAIContent(content: string): any | null {
  try {
    const direct = JSON.parse(content);
    // If narration contains a JSON code block (AI nested response), extract inner
    if (typeof direct.narration === 'string' && direct.narration.includes('```')) {
      const inner = extractJson(direct.narration);
      if (inner?.narration) return inner;
    }
    if (direct.narration || direct.narrative) return direct;
    return direct;
  } catch {
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
