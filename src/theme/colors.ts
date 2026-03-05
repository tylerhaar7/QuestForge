// QuestForge Color System — Dark Fantasy Palette
// Inspired by BG3's atmospheric UI

export const colors = {
  // Backgrounds
  bg: {
    primary: '#0d0a08',      // Near-black base
    secondary: '#1a1510',    // Slightly lighter panel
    tertiary: '#231d15',     // Card backgrounds
    overlay: 'rgba(0,0,0,0.7)',
  },

  // Gold accent system (primary interactive color)
  gold: {
    bright: '#d4a843',
    primary: '#b48c3c',
    muted: '#8a7040',
    dim: '#5a4a2a',
    glow: 'rgba(180,140,60,0.3)',
    border: 'rgba(180,140,60,0.15)',
    borderHover: 'rgba(180,140,60,0.5)',
  },

  // Text
  text: {
    primary: '#e8dcc8',      // Warm off-white
    secondary: '#b4a888',    // Muted parchment
    tertiary: '#8a7e68',     // Subdued labels
    disabled: '#5a5040',
  },

  // Combat colors
  combat: {
    red: '#dc3232',
    redGlow: 'rgba(220,50,50,0.3)',
    redBorder: 'rgba(220,50,50,0.15)',
    damageFlash: 'rgba(220,50,50,0.4)',
    healFlash: 'rgba(50,220,100,0.4)',
  },

  // Ability type colors
  ability: {
    attack:   { bg: 'rgba(220,60,60,0.12)',  border: 'rgba(220,60,60,0.4)',  glow: '#c44' },
    spell:    { bg: 'rgba(100,60,220,0.12)', border: 'rgba(100,60,220,0.4)', glow: '#86c' },
    reaction: { bg: 'rgba(220,140,30,0.12)', border: 'rgba(220,140,30,0.4)', glow: '#ca4' },
    bonus:    { bg: 'rgba(60,180,220,0.12)', border: 'rgba(60,180,220,0.4)', glow: '#4bc' },
    heal:     { bg: 'rgba(60,220,100,0.12)', border: 'rgba(60,220,100,0.4)', glow: '#4c6' },
  },

  // Class colors (for party UI)
  class: {
    barbarian: '#e25822',
    bard:      '#ab6dac',
    cleric:    '#91a1b2',
    druid:     '#7a853b',
    fighter:   '#7f513e',
    monk:      '#51a5c5',
    paladin:   '#b59e54',
    ranger:    '#507f62',
    rogue:     '#555752',
    sorcerer:  '#992e2e',
    warlock:   '#7b469b',
    wizard:    '#2a52be',
  },

  // Companion approval
  approval: {
    hostile:  '#dc3232',
    cold:     '#e07030',
    neutral:  '#b4a888',
    friendly: '#7ab648',
    trusted:  '#4a90d9',
    bonded:   '#d4a843',
    devoted:  '#e8dcc8',
  },

  // Mood-based backgrounds (for ambient color shifts)
  mood: {
    dungeon: { accent: 'rgba(40,35,25,0.4)', secondary: '#1a1510' },
    combat:  { accent: 'rgba(80,20,20,0.4)', secondary: '#1a0f0f' },
    tavern:  { accent: 'rgba(60,40,20,0.4)', secondary: '#1a1510' },
    forest:  { accent: 'rgba(20,40,20,0.4)', secondary: '#101a10' },
    town:    { accent: 'rgba(40,35,30,0.4)', secondary: '#1a1815' },
    camp:    { accent: 'rgba(60,40,15,0.4)', secondary: '#1a1208' },
    threshold: { accent: 'rgba(30,30,50,0.4)', secondary: '#0f0f1a' },
  },
} as const;

export type ColorTheme = typeof colors;
