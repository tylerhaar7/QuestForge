// Music service — mood-based background music using expo-av
import type { MoodType } from '@/types/game';

// Lazy-load expo-av so the app doesn't crash when the native module is unavailable (e.g. Expo Go)
let Audio: typeof import('expo-av').Audio | null = null;
try {
  Audio = require('expo-av').Audio;
} catch {
  console.warn('[Music] expo-av not available — music disabled');
}

// ─── Track mapping ──────────────────────────────────────────────────────────

const TRACKS = {
  'battle-1': require('../../assets/audio/battle-1.mp3'),
  'battle-2': require('../../assets/audio/battle-2.mp3'),
  'dungeon-1': require('../../assets/audio/dungeon-1.mp3'),
  'event-1': require('../../assets/audio/event-1.mp3'),
  'event-2': require('../../assets/audio/event-2.mp3'),
  'event-3': require('../../assets/audio/event-3.mp3'),
  'event-4': require('../../assets/audio/event-4.mp3'),
  'town-1': require('../../assets/audio/town-1.mp3'),
  'town-2': require('../../assets/audio/town-2.mp3'),
  'town-3': require('../../assets/audio/town-3.mp3'),
} as const;

type TrackKey = keyof typeof TRACKS;

// Map each mood to a pool of tracks — picks randomly from the pool
const MOOD_TRACKS: Record<MoodType, TrackKey[]> = {
  combat:    ['battle-1', 'battle-2'],
  boss:      ['battle-2'],
  dungeon:   ['dungeon-1'],
  forest:    ['event-1', 'event-2'],
  town:      ['town-1', 'town-2'],
  tavern:    ['town-2', 'town-3'],
  camp:      ['town-3'],
  threshold: ['event-3', 'event-4'],
};

// ─── Music Manager ──────────────────────────────────────────────────────────

let currentSound: any | null = null;
let currentMood: MoodType | null = null;
let currentTrack: TrackKey | null = null;
let isEnabled = true;
let currentVolume = 0.4;

function pickTrack(mood: MoodType): TrackKey {
  const pool = MOOD_TRACKS[mood];
  // Avoid repeating the same track if there are alternatives
  if (pool.length > 1 && currentTrack && pool.includes(currentTrack)) {
    const filtered = pool.filter(t => t !== currentTrack);
    return filtered[Math.floor(Math.random() * filtered.length)];
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

async function fadeOut(sound: any, durationMs = 800): Promise<void> {
  const steps = 10;
  const stepMs = durationMs / steps;
  const status = await sound.getStatusAsync();
  if (!status.isLoaded) return;
  const startVol = status.volume ?? currentVolume;

  for (let i = steps - 1; i >= 0; i--) {
    try {
      await sound.setVolumeAsync((startVol * i) / steps);
      await new Promise(r => setTimeout(r, stepMs));
    } catch {
      break; // Sound may have been unloaded
    }
  }
}

export const MusicService = {
  /** Set whether music is enabled */
  setEnabled(enabled: boolean) {
    isEnabled = enabled;
    if (!enabled) {
      this.stop();
    }
  },

  /** Set volume (0-1) */
  setVolume(volume: number) {
    currentVolume = Math.max(0, Math.min(1, volume));
    if (currentSound) {
      currentSound.setVolumeAsync(currentVolume).catch(() => {});
    }
  },

  /** Play music for a given mood, crossfading if mood changed */
  async playForMood(mood: MoodType) {
    if (!Audio || !isEnabled) return;
    if (mood === currentMood) return; // Already playing this mood

    const track = pickTrack(mood);
    currentMood = mood;
    currentTrack = track;

    // Fade out current track
    if (currentSound) {
      const old = currentSound;
      currentSound = null;
      await fadeOut(old);
      await old.unloadAsync().catch(() => {});
    }

    // Configure audio mode for background playback
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });

    // Load and play new track
    try {
      const { sound } = await Audio.Sound.createAsync(
        TRACKS[track],
        {
          isLooping: true,
          volume: currentVolume,
          shouldPlay: true,
        }
      );
      currentSound = sound;
    } catch (err) {
      console.warn('[Music] Failed to load track:', track, err);
    }
  },

  /** Stop all music */
  async stop() {
    currentMood = null;
    currentTrack = null;
    if (currentSound) {
      const old = currentSound;
      currentSound = null;
      await fadeOut(old, 400);
      await old.unloadAsync().catch(() => {});
    }
  },

  /** Get current state */
  getState() {
    return { mood: currentMood, track: currentTrack, enabled: isEnabled, volume: currentVolume };
  },
};
