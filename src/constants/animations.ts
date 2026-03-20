// Centralized animation timing, durations, and easing curves.
// Every animation in the app should reference these values
// so tuning feels consistent and changes propagate globally.

import { Easing } from 'react-native-reanimated';

// ─── Typewriter ─────────────────────────────────────────
export const TYPEWRITER = {
  // Per-character delay range (ms) — varies randomly for natural feel
  CHAR_MIN_MS: 40,
  CHAR_MAX_MS: 70,
  // Multipliers applied to base delay per speed setting
  SPEED_MULTIPLIER: {
    instant: 0,
    fast: 0.5,
    normal: 1,
    slow: 1.5,
  } as Record<string, number>,
  // Extra pause after punctuation for reading rhythm
  PAUSE_PERIOD: 80,     // . ! ?
  PAUSE_COMMA: 40,      // , ; :
  PAUSE_NEWLINE: 60,    // \n
  // Gap between paragraphs during sequential reveal
  PARAGRAPH_PAUSE: 300,
  // Cursor blink half-cycle
  CURSOR_BLINK_MS: 530,
  // Cursor visible duration after text completes before fading out
  CURSOR_LINGER_MS: 2000,
  // Fade-in when text block appears
  FADE_IN_MS: 300,
} as const;

// ─── Screen Transitions ─────────────────────────────────
export const TRANSITIONS = {
  FADE_IN: 200,
  FADE_OUT: 150,
  SLIDE_IN: 250,
  SLIDE_OUT: 200,
  CROSSFADE: 500,
} as const;

// ─── Combat ─────────────────────────────────────────────
export const COMBAT = {
  // Health bar
  HP_BAR_DURATION: 400,
  HP_FLASH_IN: 100,
  HP_FLASH_OUT: 400,
  // Damage numbers
  DAMAGE_FLOAT_DURATION: 600,
  DAMAGE_FLOAT_DISTANCE: 40,
  // Screen shake presets
  SCREEN_SHAKE_LIGHT: { distance: 4, cycles: 3, duration: 200 },
  SCREEN_SHAKE_HEAVY: { distance: 8, cycles: 5, duration: 300 },
  // Pause between sequential combat animation steps
  ACTION_PAUSE: 200,
} as const;

// ─── Dice ───────────────────────────────────────────────
export const DICE = {
  ROLL_DURATION_MIN: 800,
  ROLL_DURATION_MAX: 1200,
  RESULT_DISPLAY: 1500,
  TUMBLE_DURATION: 1800,
} as const;

// ─── UI Interactions ────────────────────────────────────
export const UI = {
  BUTTON_PRESS_SCALE: 0.97,
  BUTTON_PRESS_DOWN: 80,
  BUTTON_PRESS_UP: 120,
  STAGGER_DELAY: 80,
} as const;

// ─── Rewards / Progression ──────────────────────────────
export const REWARDS = {
  LOOT_STAGGER: 80,
  LEVEL_UP_STAT_TICK: 50,
  CHEST_OPEN_DURATION: 600,
} as const;

// ─── Ambient / Atmosphere ───────────────────────────────
export const ATMOSPHERE = {
  SCENE_CROSSFADE: 500,
  PARTICLE_FADE_IN: 500,
  PARTICLE_FADE_OUT: 300,
  MOOD_TRANSITION_OUT: 300,
  MOOD_TRANSITION_IN: 500,
} as const;

// ─── Shared Easing Presets ──────────────────────────────
export const EASING = {
  /** Standard deceleration — UI elements settling */
  smooth: Easing.out(Easing.cubic),
  /** Overshoot — dice bounce, loot pop-in */
  bounce: Easing.out(Easing.back(1.5)),
  /** Symmetric wave — quill bob, particle drift */
  gentle: Easing.inOut(Easing.sin),
  /** Quick deceleration — fade-outs, opacity changes */
  sharp: Easing.out(Easing.quad),
} as const;
