// Main Menu — Fantasy background with Play + Settings buttons
// Uses the AI-generated background image with invisible Pressable hit zones

import { useEffect, useState, useRef } from 'react';
import { View, Image, Pressable, Text, StyleSheet, ActivityIndicator, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Audio } from 'expo-av';
import { supabase } from '@/services/supabase';
import { useGameStore } from '@/stores/useGameStore';
import * as Haptics from 'expo-haptics';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { colors } from '@/theme/colors';
import { parseAIContent } from '@/utils/parseAI';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function MenuScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const hapticsEnabled = useSettingsStore((s) => s.accessibility.hapticFeedback);
  const musicEnabled = useSettingsStore((s) => s.musicEnabled);
  const musicVolume = useSettingsStore((s) => s.musicVolume);
  const soundRef = useRef<Audio.Sound | null>(null);

  // Play menu music
  useEffect(() => {
    if (!musicEnabled) return;

    let mounted = true;
    (async () => {
      try {
        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, staysActiveInBackground: false });
        const { sound } = await Audio.Sound.createAsync(
          require('../assets/audio/music/town-1.mp3'),
          { isLooping: true, volume: musicVolume }
        );
        if (!mounted) { sound.unloadAsync(); return; }
        soundRef.current = sound;
        await sound.playAsync();
      } catch {}
    })();

    return () => {
      mounted = false;
      soundRef.current?.stopAsync().then(() => soundRef.current?.unloadAsync());
    };
  }, [musicEnabled]);

  // Update volume when it changes
  useEffect(() => {
    soundRef.current?.setVolumeAsync(musicVolume);
  }, [musicVolume]);

  const handlePlay = async () => {
    if (loading) return;
    if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/(auth)/login');
        setLoading(false);
        return;
      }

      // Check for existing character
      const { data: characters } = await supabase
        .from('characters')
        .select('id')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!characters || characters.length === 0) {
        router.push('/create');
        setLoading(false);
        return;
      }

      // Check for active campaign
      const { data: campaigns } = await supabase
        .from('campaigns')
        .select('id, character_id, turn_history')
        .eq('user_id', session.user.id)
        .order('updated_at', { ascending: false })
        .limit(1);

      if (!campaigns || campaigns.length === 0) {
        router.push({
          pathname: '/create/campaign-start',
          params: { characterId: characters[0].id },
        });
        setLoading(false);
        return;
      }

      // Load campaign into store
      const { getCharacter } = await import('@/services/character');
      const { getCampaign } = await import('@/services/campaign');

      const campaignRow = campaigns[0];
      let character;
      try {
        character = await getCharacter(campaignRow.character_id);
      } catch {
        router.push('/create');
        setLoading(false);
        return;
      }

      const campaign = await getCampaign(campaignRow.id);
      const store = useGameStore.getState();
      store.setCharacter(character);
      store.setCampaign(campaign);

      // Restore last narration
      const turnHistory = (campaignRow.turn_history || []) as any[];
      const lastAssistant = [...turnHistory].reverse().find((t: any) => t.role === 'assistant');
      if (lastAssistant) {
        const parsed = parseAIContent(lastAssistant.content);
        if (parsed) store.processAIResponse(parsed);
      }

      // Stop menu music before entering game
      await soundRef.current?.stopAsync();
      router.replace('/game/session');
    } catch (err) {
      console.error('Menu play error:', err);
      setLoading(false);
    }
  };

  const handleSettings = () => {
    if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/settings');
  };

  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/main-menu-bg.png')}
        style={StyleSheet.absoluteFill}
        resizeMode="stretch"
      />

      {/* Bottom content area */}
      <View style={[styles.bottomArea, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {/* Buttons */}
        <View style={styles.buttonGroup}>
          <Pressable
            onPress={handlePlay}
            disabled={loading}
            style={({ pressed }) => [
              styles.btn,
              styles.btnPlay,
              pressed && styles.btnPressed,
            ]}
          >
            <View style={styles.btnInner}>
              <Text style={styles.btnPlayText}>Begin Adventure</Text>
            </View>
          </Pressable>

          <Pressable
            onPress={handleSettings}
            style={({ pressed }) => [
              styles.btn,
              styles.btnSettings,
              pressed && styles.btnPressed,
            ]}
          >
            <Text style={styles.btnSettingsText}>Settings</Text>
          </Pressable>
        </View>

        {/* Legal */}
        <Text style={styles.legalAI}>
          Game narration powered by AI (Claude by Anthropic)
        </Text>
        <View style={styles.legalLinks}>
          <Text
            style={styles.legalLink}
            onPress={() => Linking.openURL('https://bsbdtdexdlyruojyabtn.supabase.co/storage/v1/object/public/legal/privacy-policy.html')}
          >
            Privacy Policy
          </Text>
          <Text style={styles.legalDot}> · </Text>
          <Text
            style={styles.legalLink}
            onPress={() => Linking.openURL('https://bsbdtdexdlyruojyabtn.supabase.co/storage/v1/object/public/legal/terms-of-service.html')}
          >
            Terms of Service
          </Text>
        </View>
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.gold.primary} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d0a08',
  },
  bottomArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  buttonGroup: {
    width: '100%',
    alignItems: 'center',
    gap: 14,
    marginBottom: 24,
  },
  btn: {
    width: '85%',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
  btnPlay: {
    backgroundColor: 'rgba(13,10,8,0.7)',
    borderWidth: 1.5,
    borderColor: '#b48c3c',
    paddingVertical: 16,
  },
  btnInner: {
    alignItems: 'center',
  },
  btnPlayText: {
    fontFamily: 'Cinzel_700Bold',
    fontSize: 20,
    color: '#e8dcc8',
    letterSpacing: 2,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(180,140,60,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  btnSettings: {
    backgroundColor: 'rgba(13,10,8,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(180,140,60,0.35)',
    paddingVertical: 12,
  },
  btnSettingsText: {
    fontFamily: 'Cinzel_400Regular',
    fontSize: 15,
    color: 'rgba(232,220,200,0.7)',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  legalAI: {
    color: 'rgba(232,220,200,0.35)',
    fontSize: 10,
    textAlign: 'center',
    marginBottom: 6,
  },
  legalLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  legalLink: {
    color: 'rgba(180,140,60,0.5)',
    fontSize: 11,
    textDecorationLine: 'underline',
  },
  legalDot: {
    color: 'rgba(232,220,200,0.25)',
    fontSize: 11,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
