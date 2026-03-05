# QuestForge — MacBook Setup Guide & First Files

*Run these commands on your 2020 MacBook Pro (Intel i7, 16GB, 512GB)*
*This gets you from zero to a running Expo project with the full folder structure and foundational files*

---

## Step 1: Prerequisites

Make sure these are installed. If not, install them first:

```bash
# Check Node (need v18+)
node --version

# If not installed or outdated:
brew install node

# Check npm
npm --version

# Install Expo CLI globally
npm install -g expo-cli

# Check git
git --version
```

---

## Step 2: Create the Project

```bash
# Create Expo project with TypeScript
npx create-expo-app@latest QuestForge --template blank-typescript

# Move into project
cd QuestForge

# Initialize git
git init
git add .
git commit -m "Initial Expo setup"
```

---

## Step 3: Install Dependencies

Run this as one block — it installs everything we need for the full architecture:

```bash
# Core navigation & routing
npx expo install expo-router expo-linking expo-constants expo-status-bar react-native-screens react-native-safe-area-context

# Animation & haptics
npx expo install react-native-reanimated react-native-gesture-handler expo-haptics

# Audio
npx expo install expo-av

# Fonts
npx expo install expo-font @expo-google-fonts/cinzel @expo-google-fonts/crimson-text

# Storage (fast local cache)
npm install react-native-mmkv

# State management
npm install zustand

# Server state
npm install @tanstack/react-query

# Supabase
npm install @supabase/supabase-js react-native-url-polyfill

# Payments (add later when needed)
# npm install react-native-purchases

# Dev dependencies
npm install -D @types/react @types/react-native
```

After installing, commit:
```bash
git add .
git commit -m "Install all dependencies"
```

---

## Step 4: Configure Expo

Replace the contents of `app.json` with:

```json
{
  "expo": {
    "name": "QuestForge",
    "slug": "questforge",
    "version": "0.1.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "dark",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#0d0a08"
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.questforge.app"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#0d0a08"
      },
      "package": "com.questforge.app"
    },
    "scheme": "questforge",
    "plugins": [
      "expo-router",
      "expo-font",
      "expo-haptics"
    ]
  }
}
```

Update `tsconfig.json`:

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@engine/*": ["src/engine/*"],
      "@ai/*": ["src/ai/*"],
      "@stores/*": ["src/stores/*"],
      "@services/*": ["src/services/*"],
      "@theme/*": ["src/theme/*"],
      "@hooks/*": ["src/hooks/*"],
      "@data/*": ["src/data/*"],
      "@types/*": ["src/types/*"]
    }
  }
}
```

Update `babel.config.js`:

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin',  // MUST be last
    ],
  };
};
```

---

## Step 5: Create the Folder Structure

```bash
# Create the full directory tree
mkdir -p src/{theme,components/{ui,game},engine,ai/{prompts},services,stores,hooks,types,data}
mkdir -p app/{'(auth)','(tabs)',game,create}
mkdir -p supabase/functions/{'game-turn','generate-image','session-recap','campaign-init'}
mkdir -p assets/{fonts,images,audio/{ambient,sfx}}

# Verify structure
find src -type d | sort
find app -type d | sort
```

Your project should now look like:

```
QuestForge/
├── app/                          # Expo Router (file-based routing)
│   ├── (auth)/                   # Login, register, onboarding
│   ├── (tabs)/                   # Main tab navigation
│   ├── game/                     # Game screens
│   ├── create/                   # Character/campaign creation
│   └── _layout.tsx               # Root layout
│
├── src/
│   ├── theme/                    # Colors, typography, spacing
│   ├── components/
│   │   ├── ui/                   # Reusable primitives (Button, Card, Modal)
│   │   └── game/                 # Game-specific (NarrativeText, AbilityCard, etc.)
│   ├── engine/                   # D&D 5e mechanics (dice, combat, character)
│   ├── ai/
│   │   └── prompts/              # All DM system prompts
│   ├── services/                 # Supabase, API, RevenueCat
│   ├── stores/                   # Zustand stores
│   ├── hooks/                    # Custom React hooks
│   ├── types/                    # TypeScript definitions
│   └── data/                     # Static data (origins, achievements, SRD)
│
├── supabase/
│   └── functions/                # Edge Functions
│       ├── game-turn/
│       ├── generate-image/
│       ├── session-recap/
│       └── campaign-init/
│
└── assets/
    ├── fonts/
    ├── images/
    └── audio/
        ├── ambient/
        └── sfx/
```

---

## Step 6: Create Foundational Files

These are the first files to build — in order of dependency. Create them one at a time.

### File 1: `src/theme/colors.ts`

```typescript
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
```

### File 2: `src/theme/typography.ts`

```typescript
// QuestForge Typography System
// Cinzel: headings, UI labels, combat text
// Crimson Text: body, descriptions, dialogue
// IM Fell English: narrative text (story prose)

import { Platform } from 'react-native';

export const fonts = {
  heading: Platform.select({
    ios: 'Cinzel-Bold',
    android: 'Cinzel-Bold',
    default: 'Cinzel',
  }),
  headingRegular: Platform.select({
    ios: 'Cinzel-Regular',
    android: 'Cinzel-Regular',
    default: 'Cinzel',
  }),
  body: Platform.select({
    ios: 'CrimsonText-Regular',
    android: 'CrimsonText-Regular',
    default: 'Crimson Text',
  }),
  bodyBold: Platform.select({
    ios: 'CrimsonText-Bold',
    android: 'CrimsonText-Bold',
    default: 'Crimson Text',
  }),
  bodyItalic: Platform.select({
    ios: 'CrimsonText-Italic',
    android: 'CrimsonText-Italic',
    default: 'Crimson Text',
  }),
  narrative: Platform.select({
    ios: 'IMFellEnglish-Regular',
    android: 'IMFellEnglish-Regular',
    default: 'IM Fell English',
  }),
  narrativeItalic: Platform.select({
    ios: 'IMFellEnglish-Italic',
    android: 'IMFellEnglish-Italic',
    default: 'IM Fell English',
  }),
} as const;

export const textStyles = {
  // UI Elements
  screenTitle: {
    fontFamily: fonts.heading,
    fontSize: 24,
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
  },
  sectionLabel: {
    fontFamily: fonts.heading,
    fontSize: 10,
    letterSpacing: 3,
    textTransform: 'uppercase' as const,
  },
  buttonLabel: {
    fontFamily: fonts.headingRegular,
    fontSize: 13,
    letterSpacing: 1,
  },

  // Game Text
  narrative: {
    fontFamily: fonts.narrative,
    fontSize: 16,
    lineHeight: 28,
  },
  dialogue: {
    fontFamily: fonts.bodyItalic,
    fontSize: 15,
    lineHeight: 24,
  },
  combatLog: {
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 18,
  },

  // Character / Stats
  characterName: {
    fontFamily: fonts.heading,
    fontSize: 14,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
  },
  statLabel: {
    fontFamily: fonts.headingRegular,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
  },
  statValue: {
    fontFamily: fonts.heading,
    fontSize: 20,
    fontWeight: '900' as const,
  },

  // Choice buttons
  choiceText: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
  },
  skillCheckLabel: {
    fontFamily: fonts.headingRegular,
    fontSize: 10,
    letterSpacing: 1,
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;
```

### File 3: `src/types/game.ts`

```typescript
// Core game type definitions

// ─── Dice ───────────────────────────────────────────
export type DieType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100';

export interface DiceRoll {
  die: DieType;
  count: number;
  modifier: number;
  advantage?: boolean;
  disadvantage?: boolean;
}

export interface DiceResult {
  rolls: number[];
  total: number;
  isCritical: boolean;
  isFumble: boolean;
  formula: string;
}

// ─── Character ──────────────────────────────────────
export type AbilityScore = 'strength' | 'dexterity' | 'constitution' | 'intelligence' | 'wisdom' | 'charisma';
export type Skill =
  | 'acrobatics' | 'animal_handling' | 'arcana' | 'athletics'
  | 'deception' | 'history' | 'insight' | 'intimidation'
  | 'investigation' | 'medicine' | 'nature' | 'perception'
  | 'performance' | 'persuasion' | 'religion' | 'sleight_of_hand'
  | 'stealth' | 'survival';

export type ClassName =
  | 'barbarian' | 'bard' | 'cleric' | 'druid' | 'fighter'
  | 'monk' | 'paladin' | 'ranger' | 'rogue' | 'sorcerer'
  | 'warlock' | 'wizard';

export type RaceName =
  | 'human' | 'elf' | 'dwarf' | 'halfling' | 'gnome'
  | 'half_elf' | 'half_orc' | 'tiefling' | 'dragonborn';

export interface AbilityScores {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

export interface Character {
  id: string;
  userId: string;
  name: string;
  race: RaceName;
  className: ClassName;
  subclass: string;
  level: number;
  xp: number;
  abilityScores: AbilityScores;
  hp: number;
  maxHp: number;
  tempHp: number;
  ac: number;
  speed: number;
  proficiencyBonus: number;
  proficientSkills: Skill[];
  proficientSaves: AbilityScore[];
  spellSlots: number[];        // Index = slot level (1-9), value = remaining
  maxSpellSlots: number[];
  equipment: EquipmentItem[];
  inventory: InventoryItem[];
  features: string[];          // Class/race feature IDs
  conditions: Condition[];
  originStory: string;         // Origin story ID
  personalQuestFlags: Record<string, boolean>;
  portraitUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EquipmentItem {
  id: string;
  name: string;
  type: 'weapon' | 'armor' | 'shield' | 'accessory';
  equipped: boolean;
  properties: Record<string, any>;
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  description: string;
  type: 'consumable' | 'quest' | 'treasure' | 'material' | 'misc';
}

export type Condition =
  | 'blinded' | 'charmed' | 'deafened' | 'frightened'
  | 'grappled' | 'incapacitated' | 'invisible' | 'paralyzed'
  | 'petrified' | 'poisoned' | 'prone' | 'restrained'
  | 'stunned' | 'unconscious' | 'exhaustion_1' | 'exhaustion_2'
  | 'exhaustion_3' | 'exhaustion_4' | 'exhaustion_5';

// ─── Companion ──────────────────────────────────────
export interface Companion {
  name: string;
  className: ClassName;
  level: number;
  hp: number;
  maxHp: number;
  ac: number;
  portrait: string;
  color: string;
  approvalScore: number;       // 0-100
  relationshipStage: RelationshipStage;
  personality: CompanionPersonality;
  abilities: CompanionAbility[];
  conditions: Condition[];
}

export type RelationshipStage =
  | 'hostile' | 'cold' | 'neutral' | 'friendly'
  | 'trusted' | 'bonded' | 'devoted';

export interface CompanionPersonality {
  approves: string[];          // Tags: ['nature_protection', 'patience']
  disapproves: string[];       // Tags: ['destruction', 'deception']
  voice: string;               // Brief personality descriptor for AI
  backstory: string;
}

export interface CompanionAbility {
  name: string;
  type: 'attack' | 'spell' | 'reaction' | 'bonus' | 'heal';
  description: string;
  icon: string;
}

// ─── Combat ─────────────────────────────────────────
export interface CombatState {
  isActive: boolean;
  round: number;
  turnIndex: number;
  initiativeOrder: InitiativeEntry[];
  enemies: Enemy[];
}

export interface InitiativeEntry {
  name: string;
  initiative: number;
  side: 'party' | 'enemy';
  index: number;               // Index into party or enemies array
}

export interface Enemy {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  ac: number;
  portrait: string;
  intention?: EnemyIntention;
  conditions: Condition[];
}

export interface EnemyIntention {
  target: string;              // Name of the target
  action: string;              // "Aimed Shot", "Reckless Charge"
  predictedDamage: string;     // "1d8+2 (avg 6)"
  special?: string;            // "knockback 10ft"
  description: string;
}

// ─── Campaign ───────────────────────────────────────
export type GameMode = 'exploration' | 'combat' | 'social' | 'rest' | 'camp' | 'threshold';
export type MoodType = 'dungeon' | 'combat' | 'tavern' | 'forest' | 'town' | 'camp' | 'threshold' | 'boss';

export interface Campaign {
  id: string;
  userId: string;
  characterId: string;
  name: string;
  worldId: string;
  currentLocation: string;
  currentMood: MoodType;
  currentMode: GameMode;
  companions: Companion[];
  combatState: CombatState;
  questLog: Quest[];
  storySummary: string;
  deathCount: number;
  deathHistory: DeathRecord[];
  thresholdUnlocks: string[];
  difficultyProfile: DifficultyProfile;
  adventureMap?: AdventureMap;
  turnCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Quest {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'completed' | 'failed';
  isPersonalQuest: boolean;
  objectives: QuestObjective[];
}

export interface QuestObjective {
  description: string;
  completed: boolean;
}

export interface DeathRecord {
  turn: number;
  cause: string;
  location: string;
  enemy?: string;
  companionsPresent: string[];
}

export interface DifficultyProfile {
  winRateLast10: number;
  avgHpAtCombatEnd: number;
  deaths: number;
  sessionLengthAvg: number;
  retryRate: number;
  inputFrequency: number;
  preference: 'story' | 'balanced' | 'hardcore';
}

// ─── Adventure Map (Slay the Spire) ────────────────
export type MapNodeType =
  | 'combat' | 'elite' | 'boss' | 'rest'
  | 'merchant' | 'mystery' | 'social' | 'treasure';

export interface MapNode {
  id: string;
  type: MapNodeType;
  connections: string[];
  completed: boolean;
  difficulty: 1 | 2 | 3;
  teaser: string;
  icon: string;
}

export interface AdventureMap {
  nodes: MapNode[];
  currentNodeId: string;
  chapterTitle: string;
}

// ─── AI Response ────────────────────────────────────
export interface AIResponse {
  mode: GameMode;
  narration: string;
  location?: string;
  companionActions?: CompanionAction[];
  choices?: Choice[];
  diceRequests?: DiceRequest[];
  stateChanges?: StateChange[];
  approvalChanges?: ApprovalChange[];
  enemyIntentions?: EnemyIntention[];
  threadUpdates?: ThreadUpdate[];
  mood?: MoodType;
  ambientHint?: string;
}

export interface CompanionAction {
  companion: string;
  action: string;
  dialogue?: string;
}

export interface Choice {
  text: string;
  type: string;
  icon: string;
  skillCheck?: SkillCheck;
}

export interface SkillCheck {
  skill: Skill;
  dc: number;
  modifier: number;
  successChance: number;
  advantage: boolean;
}

export interface DiceRequest {
  type: 'attack_roll' | 'saving_throw' | 'skill_check' | 'damage' | 'initiative';
  roller: string;
  ability?: string;
  target?: string;
  dc?: number;
  formula?: string;
}

export interface StateChange {
  type: 'hp' | 'condition' | 'item' | 'xp' | 'spell_slot' | 'quest' | 'location';
  target: string;
  value: any;
}

export interface ApprovalChange {
  companion: string;
  delta: number;
  reason: string;
}

export interface ThreadUpdate {
  threadId: string;
  action: 'advance' | 'resolve' | 'introduce';
  detail: string;
}
```

### File 4: `src/engine/dice.ts`

```typescript
// D&D 5e Dice Engine — Deterministic, never AI-generated
// All randomness happens HERE, not in Claude's responses

import { DieType, DiceRoll, DiceResult } from '@/types/game';

const DIE_MAX: Record<DieType, number> = {
  d4: 4, d6: 6, d8: 8, d10: 10, d12: 12, d20: 20, d100: 100,
};

/**
 * Roll a single die
 */
export function rollDie(die: DieType): number {
  return Math.floor(Math.random() * DIE_MAX[die]) + 1;
}

/**
 * Roll multiple dice with modifier, advantage/disadvantage
 */
export function rollDice(roll: DiceRoll): DiceResult {
  const { die, count, modifier, advantage, disadvantage } = roll;

  let rolls: number[] = [];

  if (die === 'd20' && (advantage || disadvantage)) {
    // Roll twice for advantage/disadvantage
    const roll1 = rollDie(die);
    const roll2 = rollDie(die);
    const chosen = advantage
      ? Math.max(roll1, roll2)
      : Math.min(roll1, roll2);
    rolls = [chosen];
    // Store both for display: [chosen, other]
  } else {
    for (let i = 0; i < count; i++) {
      rolls.push(rollDie(die));
    }
  }

  const subtotal = rolls.reduce((sum, r) => sum + r, 0);
  const total = subtotal + modifier;
  const isCritical = die === 'd20' && rolls[0] === 20;
  const isFumble = die === 'd20' && rolls[0] === 1;

  const formula = `${count}${die}${modifier >= 0 ? '+' : ''}${modifier !== 0 ? modifier : ''}`;

  return { rolls, total, isCritical, isFumble, formula };
}

/**
 * Parse a dice formula string like "2d6+3" into a DiceRoll
 */
export function parseFormula(formula: string): DiceRoll {
  const match = formula.match(/^(\d+)d(\d+)([+-]\d+)?$/);
  if (!match) {
    throw new Error(`Invalid dice formula: ${formula}`);
  }

  const count = parseInt(match[1], 10);
  const sides = parseInt(match[2], 10);
  const modifier = match[3] ? parseInt(match[3], 10) : 0;
  const die = `d${sides}` as DieType;

  if (!DIE_MAX[die]) {
    throw new Error(`Invalid die type: d${sides}`);
  }

  return { die, count, modifier };
}

/**
 * Roll an attack: d20 + modifier vs AC
 */
export function rollAttack(
  attackModifier: number,
  targetAC: number,
  advantage = false,
  disadvantage = false
): { hit: boolean; roll: DiceResult; damageMultiplier: number } {
  const roll = rollDice({
    die: 'd20',
    count: 1,
    modifier: attackModifier,
    advantage,
    disadvantage,
  });

  // Natural 20 always hits, natural 1 always misses
  const hit = roll.isCritical || (!roll.isFumble && roll.total >= targetAC);
  const damageMultiplier = roll.isCritical ? 2 : 1;

  return { hit, roll, damageMultiplier };
}

/**
 * Roll a saving throw: d20 + modifier vs DC
 */
export function rollSavingThrow(
  saveModifier: number,
  dc: number,
  advantage = false,
  disadvantage = false
): { success: boolean; roll: DiceResult } {
  const roll = rollDice({
    die: 'd20',
    count: 1,
    modifier: saveModifier,
    advantage,
    disadvantage,
  });

  // Nat 20 always succeeds on death saves, nat 1 always fails
  const success = roll.isCritical || (!roll.isFumble && roll.total >= dc);

  return { success, roll };
}

/**
 * Roll a skill check: d20 + modifier vs DC
 */
export function rollSkillCheck(
  skillModifier: number,
  dc: number,
  advantage = false,
  disadvantage = false
): { success: boolean; roll: DiceResult; margin: number } {
  const roll = rollDice({
    die: 'd20',
    count: 1,
    modifier: skillModifier,
    advantage,
    disadvantage,
  });

  const success = roll.total >= dc;
  const margin = roll.total - dc; // Positive = succeeded by, negative = failed by

  return { success, roll, margin };
}

/**
 * Roll initiative for a combatant
 */
export function rollInitiative(dexModifier: number): number {
  const roll = rollDice({ die: 'd20', count: 1, modifier: dexModifier });
  return roll.total;
}

/**
 * Roll damage with optional crit multiplier
 */
export function rollDamage(
  formula: string,
  critMultiplier: number = 1
): DiceResult {
  const parsed = parseFormula(formula);

  if (critMultiplier > 1) {
    // On crit, double the dice count (not the modifier)
    parsed.count *= critMultiplier;
  }

  return rollDice(parsed);
}

/**
 * Calculate success probability for display in skill check UI
 */
export function calculateSuccessChance(modifier: number, dc: number): number {
  // Need to roll (dc - modifier) or higher on d20
  const needed = dc - modifier;
  if (needed <= 1) return 100;  // Auto-succeed (even nat 1 passes)
  if (needed > 20) return 5;    // Only nat 20 succeeds
  return Math.round(((21 - needed) / 20) * 100);
}
```

### File 5: `src/services/supabase.ts`

```typescript
// Supabase client configuration
// API key is safe client-side — Row Level Security protects data
// Claude API key lives ONLY in Edge Functions (server-side)

import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { MMKV } from 'react-native-mmkv';

// Local storage adapter for Supabase auth
const storage = new MMKV({ id: 'supabase-auth' });

const mmkvStorageAdapter = {
  getItem: (key: string) => {
    const value = storage.getString(key);
    return value ?? null;
  },
  setItem: (key: string, value: string) => {
    storage.set(key, value);
  },
  removeItem: (key: string) => {
    storage.delete(key);
  },
};

// TODO: Replace with your actual Supabase project values
const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: mmkvStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Helper: Get current user ID (throws if not logged in)
export async function getCurrentUserId(): Promise<string> {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Not authenticated');
  return user.id;
}
```

### File 6: `src/stores/useGameStore.ts`

```typescript
// Main game state store — Zustand
// This is the single source of truth for the active game session

import { create } from 'zustand';
import type {
  Campaign, Character, Companion, CombatState,
  GameMode, MoodType, AIResponse, Choice,
  EnemyIntention, ApprovalChange,
} from '@/types/game';

interface GameState {
  // Core state
  campaign: Campaign | null;
  character: Character | null;
  isLoading: boolean;
  error: string | null;

  // Current turn
  currentNarration: string;
  currentChoices: Choice[];
  currentMode: GameMode;
  currentMood: MoodType;
  enemyIntentions: EnemyIntention[];

  // UI state
  isNarrationComplete: boolean;
  showDiceRoll: boolean;
  lastDiceResult: number | null;
  pendingApprovalChanges: ApprovalChange[];

  // Actions
  setCampaign: (campaign: Campaign) => void;
  setCharacter: (character: Character) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Game flow
  processAIResponse: (response: AIResponse) => void;
  setNarrationComplete: (complete: boolean) => void;
  triggerDiceRoll: (result: number) => void;
  clearDiceRoll: () => void;

  // Combat
  updateCombatState: (combat: Partial<CombatState>) => void;

  // Companions
  updateCompanionApproval: (name: string, delta: number) => void;

  // Reset
  resetSession: () => void;
}

const initialState = {
  campaign: null,
  character: null,
  isLoading: false,
  error: null,
  currentNarration: '',
  currentChoices: [],
  currentMode: 'exploration' as GameMode,
  currentMood: 'dungeon' as MoodType,
  enemyIntentions: [],
  isNarrationComplete: false,
  showDiceRoll: false,
  lastDiceResult: null,
  pendingApprovalChanges: [],
};

export const useGameStore = create<GameState>((set, get) => ({
  ...initialState,

  setCampaign: (campaign) => set({ campaign }),
  setCharacter: (character) => set({ character }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  processAIResponse: (response) => {
    set({
      currentNarration: response.narration,
      currentChoices: response.choices || [],
      currentMode: response.mode,
      currentMood: response.mood || get().currentMood,
      enemyIntentions: response.enemyIntentions || [],
      isNarrationComplete: false,
      pendingApprovalChanges: response.approvalChanges || [],
    });

    // Update campaign location if changed
    if (response.location) {
      const campaign = get().campaign;
      if (campaign) {
        set({ campaign: { ...campaign, currentLocation: response.location } });
      }
    }
  },

  setNarrationComplete: (complete) => set({ isNarrationComplete: complete }),

  triggerDiceRoll: (result) => set({ showDiceRoll: true, lastDiceResult: result }),
  clearDiceRoll: () => set({ showDiceRoll: false, lastDiceResult: null }),

  updateCombatState: (combat) => {
    const campaign = get().campaign;
    if (campaign) {
      set({
        campaign: {
          ...campaign,
          combatState: { ...campaign.combatState, ...combat },
        },
      });
    }
  },

  updateCompanionApproval: (name, delta) => {
    const campaign = get().campaign;
    if (!campaign) return;

    const companions = campaign.companions.map((c) => {
      if (c.name !== name) return c;
      const newScore = Math.max(0, Math.min(100, c.approvalScore + delta));
      return { ...c, approvalScore: newScore };
    });

    set({ campaign: { ...campaign, companions } });
  },

  resetSession: () => set(initialState),
}));
```

### File 7: `src/engine/character.ts`

```typescript
// Character mechanics — ability modifiers, proficiency, HP calculation
// All deterministic. No AI involvement.

import type { AbilityScore, AbilityScores, Character, ClassName, Skill } from '@/types/game';

/**
 * Calculate ability modifier from score
 * Score 10-11 = +0, 12-13 = +1, 8-9 = -1, etc.
 */
export function getModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

/**
 * Get proficiency bonus by level
 */
export function getProficiencyBonus(level: number): number {
  return Math.ceil(level / 4) + 1;
}

/**
 * Skill → Ability mapping
 */
export const SKILL_ABILITIES: Record<Skill, AbilityScore> = {
  acrobatics: 'dexterity',
  animal_handling: 'wisdom',
  arcana: 'intelligence',
  athletics: 'strength',
  deception: 'charisma',
  history: 'intelligence',
  insight: 'wisdom',
  intimidation: 'charisma',
  investigation: 'intelligence',
  medicine: 'wisdom',
  nature: 'intelligence',
  perception: 'wisdom',
  performance: 'charisma',
  persuasion: 'charisma',
  religion: 'intelligence',
  sleight_of_hand: 'dexterity',
  stealth: 'dexterity',
  survival: 'wisdom',
};

/**
 * Get total skill modifier for a character
 */
export function getSkillModifier(character: Character, skill: Skill): number {
  const ability = SKILL_ABILITIES[skill];
  const abilityMod = getModifier(character.abilityScores[ability]);
  const isProficient = character.proficientSkills.includes(skill);
  const profBonus = isProficient ? getProficiencyBonus(character.level) : 0;
  return abilityMod + profBonus;
}

/**
 * Get saving throw modifier
 */
export function getSaveModifier(character: Character, ability: AbilityScore): number {
  const abilityMod = getModifier(character.abilityScores[ability]);
  const isProficient = character.proficientSaves.includes(ability);
  const profBonus = isProficient ? getProficiencyBonus(character.level) : 0;
  return abilityMod + profBonus;
}

/**
 * Hit die by class
 */
export const CLASS_HIT_DIE: Record<ClassName, number> = {
  barbarian: 12,
  bard: 8,
  cleric: 8,
  druid: 8,
  fighter: 10,
  monk: 8,
  paladin: 10,
  ranger: 10,
  rogue: 8,
  sorcerer: 6,
  warlock: 8,
  wizard: 6,
};

/**
 * Calculate max HP at a given level
 * Level 1: max hit die + CON modifier
 * Level 2+: average hit die (rounded up) + CON modifier per level
 */
export function calculateMaxHP(
  className: ClassName,
  level: number,
  constitutionScore: number
): number {
  const hitDie = CLASS_HIT_DIE[className];
  const conMod = getModifier(constitutionScore);

  // Level 1: max hit die
  let hp = hitDie + conMod;

  // Levels 2+: average (rounded up) per level
  const avgPerLevel = Math.ceil(hitDie / 2) + 1;
  for (let i = 2; i <= level; i++) {
    hp += avgPerLevel + conMod;
  }

  return Math.max(1, hp);  // Minimum 1 HP
}

/**
 * Calculate AC from equipment
 * Base AC = 10 + DEX modifier (no armor)
 */
export function calculateAC(character: Character): number {
  const dexMod = getModifier(character.abilityScores.dexterity);

  const armor = character.equipment.find(
    (e) => e.type === 'armor' && e.equipped
  );
  const shield = character.equipment.find(
    (e) => e.type === 'shield' && e.equipped
  );

  let ac = 10 + dexMod;  // Unarmored default

  if (armor) {
    const armorAC = armor.properties.ac || 10;
    const maxDex = armor.properties.maxDex ?? Infinity;
    const dexBonus = Math.min(dexMod, maxDex);

    ac = armorAC + dexBonus;
  }

  if (shield) {
    ac += shield.properties.acBonus || 2;
  }

  // TODO: Handle class-specific unarmored defense (Barbarian, Monk)

  return ac;
}
```

### File 8: `src/ai/prompts/dm-system.ts`

```typescript
// DM System Prompt — The core personality and rules for Claude as Dungeon Master
// This is prompt-cached per campaign (~800 tokens, saves 90% on repeated calls)

export const DM_SYSTEM_PROMPT = `You are the Dungeon Master for QuestForge, a solo D&D 5e adventure.

PERSONA:
- Write vivid, atmospheric prose in second person for the player, third person for NPCs
- 2-4 paragraphs per response, never more unless a major story beat
- Use strong verbs, sensory details, and varied sentence structure
- Companions speak with distinct voices and personalities
- NPCs have motivations, secrets, and agendas — they are not quest dispensers
- The world feels lived-in, with history and consequences

CRITICAL MECHANICAL RULES — NEVER VIOLATE:
1. NEVER calculate damage, HP changes, healing, or any math
2. NEVER tell the player what number they rolled
3. NEVER track spell slots, HP, inventory, or conditions
4. When a player attacks or casts: output dice_requests, the engine resolves
5. When you need a skill check: output dice_requests with the DC
6. Your job is NARRATIVE ONLY — describe what happens, not the numbers
7. The game engine will inject MECHANICAL RESULT into your next prompt
8. Narrate based on those results — you don't decide if attacks hit

NARRATIVE RULES:
1. ALWAYS present meaningful consequences for choices
2. NEVER guarantee success — failure should be possible and interesting
3. Companions act independently with their own judgment — they argue, refuse, joke
4. The player can TRY anything, but impossible actions fail narratively
5. When in doubt, call for a skill check
6. Avoid cliches: "a chill runs down your spine", "you feel a sense of foreboding"
7. Make the player's class and abilities matter in narration
8. Reference the player's origin story and personal quest naturally

RESPONSE FORMAT — Always respond with valid JSON:
{
  "mode": "exploration|combat|social|rest|camp|threshold",
  "narration": "The narrative text...",
  "location": "Current location name (if changed)",
  "companion_actions": [
    {"companion": "Name", "action": "What they do", "dialogue": "What they say"}
  ],
  "choices": [
    {"text": "Choice description", "type": "aggressive|diplomatic|stealth|knowledge|creative", "icon": "emoji",
     "skill_check": {"skill": "persuasion", "dc": 14}}
  ],
  "dice_requests": [
    {"type": "attack_roll|saving_throw|skill_check|damage|initiative", "roller": "Name", "ability": "Eldritch Blast", "target": "Goblin", "dc": 15, "formula": "1d10+4"}
  ],
  "state_changes": [
    {"type": "hp|condition|item|xp|spell_slot|quest|location", "target": "Name", "value": "..."}
  ],
  "approval_changes": [
    {"companion": "Name", "delta": -5, "reason": "disapproves of deception"}
  ],
  "enemy_intentions": [
    {"enemy": "Goblin Archer", "target": "Thaelen", "action": "Aimed Shot", "predicted_damage": "1d8+2", "description": "draws back the bow"}
  ],
  "thread_updates": [
    {"thread_id": "abc", "action": "advance", "detail": "The cult symbol matches..."}
  ],
  "mood": "dungeon|combat|tavern|forest|town|camp|threshold|boss",
  "ambient_hint": "dungeon_drip"
}

Only include fields that are relevant to the current response. choices and dice_requests should not both appear in the same response.`;

export const MECHANICAL_ENFORCEMENT = `
REMINDER: You are the narrator, not the calculator.
- The game engine handles ALL dice rolls, damage, HP tracking, and state
- You receive MECHANICAL RESULT messages with outcomes
- Narrate those outcomes — do not recalculate or second-guess them
- If a result says "HIT for 11 damage", describe the hit, don't verify the math
- If a result says "MISS", describe the miss dramatically`;
```

### File 9: `app/_layout.tsx`

```typescript
// Root layout — wraps the entire app
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, ActivityIndicator } from 'react-native';
import { colors } from '@/theme/colors';

const queryClient = new QueryClient();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Cinzel-Regular': require('../assets/fonts/Cinzel-Regular.ttf'),
    'Cinzel-Bold': require('../assets/fonts/Cinzel-Bold.ttf'),
    'CrimsonText-Regular': require('../assets/fonts/CrimsonText-Regular.ttf'),
    'CrimsonText-Bold': require('../assets/fonts/CrimsonText-Bold.ttf'),
    'CrimsonText-Italic': require('../assets/fonts/CrimsonText-Italic.ttf'),
    'IMFellEnglish-Regular': require('../assets/fonts/IMFellEnglish-Regular.ttf'),
    'IMFellEnglish-Italic': require('../assets/fonts/IMFellEnglish-Italic.ttf'),
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg.primary }}>
        <ActivityIndicator size="large" color={colors.gold.primary} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.bg.primary },
            animation: 'fade',
          }}
        />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
```

---

## Step 7: Download Fonts

You need to download these font files and place them in `assets/fonts/`:

1. **Cinzel** — https://fonts.google.com/specimen/Cinzel
   - `Cinzel-Regular.ttf`
   - `Cinzel-Bold.ttf`

2. **Crimson Text** — https://fonts.google.com/specimen/Crimson+Text
   - `CrimsonText-Regular.ttf`
   - `CrimsonText-Bold.ttf`
   - `CrimsonText-Italic.ttf`

3. **IM Fell English** — https://fonts.google.com/specimen/IM+Fell+English
   - `IMFellEnglish-Regular.ttf`
   - `IMFellEnglish-Italic.ttf`

Download from Google Fonts, extract, and copy the `.ttf` files into `assets/fonts/`.

---

## Step 8: Verify Everything Works

```bash
# Start the dev server
npx expo start

# Press 'i' to open in iOS Simulator (if Xcode is installed)
# Or scan the QR code with Expo Go on your phone
```

If you get a blank dark screen with no errors, everything is wired up correctly.

---

## Step 9: Set Up Supabase

1. Go to https://supabase.com and create a new project called "questforge"
2. Copy your project URL and anon key into `src/services/supabase.ts`
3. Run the SQL migrations from the architecture doc to create tables

---

## Step 10: Next Steps (Build Order)

Now that the foundation is set, build in this order:

1. **`src/engine/combat.ts`** — Combat engine (initiative, turn order, attack resolution)
2. **`src/ai/context-builder.ts`** — Assembles the full prompt context from campaign state
3. **`src/ai/parser.ts`** — Parses Claude's JSON response with fallbacks
4. **`src/components/game/NarrativeText.tsx`** — Typewriter text with tap-to-complete
5. **`src/components/game/ChoiceButton.tsx`** — Choice buttons with skill check display
6. **`src/components/game/AbilityCard.tsx`** — Combat ability cards
7. **`src/components/game/HpBar.tsx`** — HP bar component
8. **`src/components/game/PartyCard.tsx`** — Party member card
9. **`src/components/game/ApprovalIndicator.tsx`** — Companion approval popup
10. **`app/game/session.tsx`** — The main game screen that ties everything together

---

## CLAUDE.md for Claude CLI

Create this file in the project root for Claude Code sessions:

```markdown
# QuestForge — AI D&D Solo RPG

## Project Overview
QuestForge is an AI-powered solo D&D 5e mobile game built with React Native + Expo.
Claude (via API) serves as the Dungeon Master. The app has AI-controlled party members,
a deterministic D&D 5e game engine, and a Supabase backend.

## Tech Stack
- React Native + Expo (SDK 52+), TypeScript
- Expo Router (file-based routing)
- Zustand (client state), React Query (server state), MMKV (local cache)
- Supabase (auth, database, Edge Functions)
- Claude API (Haiku + Sonnet) via Supabase Edge Functions
- react-native-reanimated (animations), expo-haptics, expo-av

## Architecture Rules
1. **Claude NEVER does math.** The game engine handles ALL dice, damage, HP, AC, spell slots.
   Claude only narrates outcomes that the engine resolves.
2. **Supabase stores ALL persistent state.** Campaign, character, companions, NPCs, quests.
3. **Structured AI responses.** Claude always returns JSON matching the AIResponse type.
4. **Prompt caching.** System prompt + world lore + mode instructions are cached per campaign.
5. **Model routing.** Haiku for simple turns, Sonnet for combat/story/social scenes.

## Key Directories
- `src/engine/` — D&D 5e mechanics (deterministic, no AI)
- `src/ai/` — Prompt building, response parsing, model routing
- `src/components/game/` — Game UI components
- `src/stores/` — Zustand state management
- `src/services/` — Supabase client, API calls
- `src/theme/` — Colors, typography, spacing
- `src/types/` — TypeScript definitions
- `app/` — Expo Router screens
- `supabase/functions/` — Edge Functions (server-side AI calls)

## Design System
- Colors: Dark fantasy (near-black bg, gold accents, warm off-white text)
- Fonts: Cinzel (headings), Crimson Text (body), IM Fell English (narrative)
- Animations: Reanimated for combat, dice rolls, UI transitions
- Haptics on: dice rolls, combat hits, choice selection, approval changes

## Important Patterns
- Game state flows through useGameStore (Zustand)
- AI responses are parsed into typed AIResponse objects
- Companion approval tracked as 0-100 score with relationship stages
- Enemy intentions are telegraphed before player's turn
- Death triggers The Threshold hub (Hades-inspired), not game over
- Plot threads tracked in Supabase, injected into AI context for narrative payoff
```

---

## Summary of What You Now Have

After running through this guide:

| What | Status |
|------|--------|
| Expo TypeScript project | ✅ Created |
| All dependencies installed | ✅ Ready |
| Full folder structure | ✅ Created |
| Color system | ✅ `src/theme/colors.ts` |
| Typography system | ✅ `src/theme/typography.ts` |
| Game type definitions | ✅ `src/types/game.ts` |
| Dice engine | ✅ `src/engine/dice.ts` |
| Character mechanics | ✅ `src/engine/character.ts` |
| Supabase client | ✅ `src/services/supabase.ts` |
| Game state store | ✅ `src/stores/useGameStore.ts` |
| DM system prompt | ✅ `src/ai/prompts/dm-system.ts` |
| Root layout with fonts | ✅ `app/_layout.tsx` |
| CLAUDE.md for CLI | ✅ Ready |

**Next session:** Build the combat engine, AI context builder, response parser, and your first game UI components.
