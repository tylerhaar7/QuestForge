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
  isTutorialComplete: boolean;

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

  // Tutorial
  clearTutorialComplete: () => void;

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
  isTutorialComplete: false,
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

    // Check for tutorial completion
    if (response.tutorialComplete) {
      set({ isTutorialComplete: true });
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

  clearTutorialComplete: () => set({ isTutorialComplete: false }),

  resetSession: () => set(initialState),
}));
