// Main Menu — Fantasy background with Play + Settings buttons
// Uses the AI-generated background image with invisible Pressable hit zones

import { useEffect, useState, useRef } from 'react';
import { View, Image, Pressable, Text, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useRouter } from 'expo-router';
import { Audio } from 'expo-av';
import { supabase } from '@/services/supabase';
import { useGameStore } from '@/stores/useGameStore';
import * as Haptics from 'expo-haptics';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { colors } from '@/theme/colors';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// Scale image to fill most of the screen — leave just enough for legal footer
const FOOTER_H = 120;
const IMG_DISPLAY_H = SCREEN_H - FOOTER_H;

// Button positions as % of the image's displayed height
const PLAY_TOP = IMG_DISPLAY_H * 0.505;
const PLAY_H = IMG_DISPLAY_H * 0.065;
const SETTINGS_TOP = IMG_DISPLAY_H * 0.595;
const SETTINGS_H = IMG_DISPLAY_H * 0.065;
const BTN_LEFT = SCREEN_W * 0.15;
const BTN_WIDTH = SCREEN_W * 0.70;

function parseAIContent(content: string): any | null {
  try {
    const direct = JSON.parse(content);
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

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/main-menu-bg.png')}
        style={{ width: SCREEN_W, height: IMG_DISPLAY_H }}
        resizeMode="stretch"
      />

      {/* Hit zones over painted buttons */}
      <Pressable
        style={[styles.hitZone, {
          top: PLAY_TOP,
          left: BTN_LEFT,
          width: BTN_WIDTH,
          height: PLAY_H,
        }]}
        onPress={handlePlay}
        disabled={loading}
      />

      <Pressable
        style={[styles.hitZone, {
          top: SETTINGS_TOP,
          left: BTN_LEFT,
          width: BTN_WIDTH,
          height: SETTINGS_H,
        }]}
        onPress={handleSettings}
      />

      {/* Legal footer in the black space below the image */}
      <View style={styles.legalFooter}>
        <Text style={styles.legalAI}>
          Game narration powered by AI (Claude by Anthropic).{'\n'}
          All game mechanics resolved by deterministic engine.
        </Text>
        <View style={styles.legalLinks}>
          <Text
            style={styles.legalLink}
            onPress={() => WebBrowser.openBrowserAsync('https://bsbdtdexdlyruojyabtn.supabase.co/storage/v1/object/public/legal/privacy-policy.html')}
          >
            Privacy Policy
          </Text>
          <Text style={styles.legalDot}> · </Text>
          <Text
            style={styles.legalLink}
            onPress={() => WebBrowser.openBrowserAsync('https://bsbdtdexdlyruojyabtn.supabase.co/storage/v1/object/public/legal/terms-of-service.html')}
          >
            Terms of Service
          </Text>
        </View>
        <Text style={styles.legalCopy}>
          v0.1.0 · Made with ⚔️ in the Realm
        </Text>
      </View>

      {/* Loading spinner when Play is pressed */}
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
  hitZone: {
    position: 'absolute',
  },
  legalFooter: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  legalAI: {
    color: '#6b5d4d',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 12,
  },
  legalLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  legalLink: {
    color: '#b48c3c',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  legalDot: {
    color: '#4a4035',
    fontSize: 12,
  },
  legalCopy: {
    color: '#4a4035',
    fontSize: 10,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
