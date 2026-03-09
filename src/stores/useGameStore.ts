// Main game state store — Zustand
// This is the single source of truth for the active game session

import { create } from 'zustand';
import type {
  Campaign, Character, Companion, CombatState,
  GameMode, MoodType, AIResponse, Choice,
  EnemyIntention, ApprovalChange, DiceRollResult,
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
  pendingDiceRolls: DiceRollResult[];
  activeDiceRoll: DiceRollResult | null;
  pendingApprovalChanges: ApprovalChange[];
  isTutorialComplete: boolean;

  // Actions
  setCampaign: (campaign: Campaign) => void;
  setCharacter: (character: Character) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Game flow
  processAIResponse: (response: AIResponse) => void;
  setNarrationComplete: (complete: boolean) => void;
  queueDiceRolls: (rolls: DiceRollResult[]) => void;
  shiftDiceRoll: () => void;
  clearAllDiceRolls: () => void;

  // Combat
  updateCombatState: (combat: Partial<CombatState>) => void;

  // Companions
  updateCompanionApproval: (name: string, delta: number) => void;

  // Tutorial
  clearTutorialComplete: () => void;

  // Approvals
  clearPendingApprovals: () => void;

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
  pendingDiceRolls: [],
  activeDiceRoll: null,
  pendingApprovalChanges: [],
  isTutorialComplete: false,
};

export const useGameStore = create<GameState>((set, get) => ({
  ...initialState,

  setCampaign: (campaign) => set({ campaign }),
  setCharacter: (character) => set({ character }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  processAIResponse: (response) => {
    // Guard: detect JSON accidentally set as narration and extract real narration
    let narration = response.narration || '';
    const trimmed = narration.trim();
    if (trimmed.startsWith('```') || trimmed.startsWith('{') || trimmed.startsWith('[') || (trimmed.match(/"[\w_]+":\s*["{[\d]/g) || []).length >= 3) {
      // Try to extract real narration from nested JSON (may be truncated)
      let extracted = false;

      // First try full JSON parse
      try {
        const codeBlock = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
        const jsonStr = codeBlock ? codeBlock[1].trim() : trimmed;
        const inner = JSON.parse(jsonStr.match(/\{[\s\S]*\}/)?.[0] || jsonStr);
        if (inner.narration && typeof inner.narration === 'string') {
          narration = inner.narration;
          extracted = true;
        }
      } catch {
        // JSON is truncated — extract narration string directly via regex
        const narrationMatch = trimmed.match(/"narration"\s*:\s*"((?:[^"\\]|\\.)*)"/);
        if (narrationMatch) {
          try {
            narration = JSON.parse('"' + narrationMatch[1] + '"');
            extracted = true;
          } catch {
            narration = narrationMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
            extracted = true;
          }
        }
      }

      if (!extracted) {
        narration = 'The story continues...';
      }
    }

    // Clean up escaped characters that survive JSON serialization
    narration = narration
      .replace(/\\n/g, '\n')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\')
      .replace(/\\\//g, '/');

    set({
      currentNarration: narration,
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

    // Check for tutorial completion
    if (response.tutorialComplete) {
      set({ isTutorialComplete: true });
    }
  },

  setNarrationComplete: (complete) => set({ isNarrationComplete: complete }),

  queueDiceRolls: (rolls) => {
    if (rolls.length === 0) return;
    set({ pendingDiceRolls: rolls.slice(1), activeDiceRoll: rolls[0] });
  },
  shiftDiceRoll: () => {
    const { pendingDiceRolls } = get();
    if (pendingDiceRolls.length > 0) {
      set({ activeDiceRoll: pendingDiceRolls[0], pendingDiceRolls: pendingDiceRolls.slice(1) });
    } else {
      set({ activeDiceRoll: null });
    }
  },
  clearAllDiceRolls: () => set({ pendingDiceRolls: [], activeDiceRoll: null }),

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

  clearTutorialComplete: () => set({ isTutorialComplete: false }),

  clearPendingApprovals: () => set({ pendingApprovalChanges: [] }),

  resetSession: () => set(initialState),
}));
