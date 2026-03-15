// Main game state store — Zustand
// This is the single source of truth for the active game session

import { create } from 'zustand';
import type {
  Campaign, Character, Companion, CombatState,
  GameMode, MoodType, AIResponse, Choice,
  EnemyIntention, ApprovalChange, DiceRollResult, DeathRecord,
} from '@/types/game';
import type { LevelUpMeta } from '@/services/campaign';

interface DeathMeta {
  deathCount: number;
  newUnlocks: string[];
  deathRecord: DeathRecord;
}

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

  // Death / Threshold
  deathMeta: DeathMeta | null;
  setDeathMeta: (meta: DeathMeta) => void;
  clearDeathMeta: () => void;

  // Level Up
  levelUpMeta: LevelUpMeta | null;
  setLevelUpMeta: (meta: LevelUpMeta) => void;
  clearLevelUpMeta: () => void;

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

  // Equipment
  toggleEquip: (itemId: string) => void;

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
  deathMeta: null,
  levelUpMeta: null,
};

export const useGameStore = create<GameState>((set, get) => ({
  ...initialState,

  setDeathMeta: (deathMeta) => set({ deathMeta }),
  clearDeathMeta: () => set({ deathMeta: null }),

  setLevelUpMeta: (levelUpMeta) => set({ levelUpMeta }),
  clearLevelUpMeta: () => set({ levelUpMeta: null }),

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

    // Light cleanup: strip residual JSON artifacts (key patterns, short quoted tokens,
    // isolated numbers/booleans) that may survive even when narration is mostly prose.
    narration = narration
      .replace(/"[\w_]+":\s*/g, '')
      .replace(/(?<!\w)"([^"]{1,20})"(?=[,\s}\]]|$)/gm, '$1')
      .replace(/^\s*,\s*/gm, '')
      .replace(/,\s*$/gm, '')
      .replace(/^\s*[{}\[\]]\s*$/gm, '')
      .replace(/^\s*-?\d+(?:\.\d+)?\s*$/gm, '')
      .replace(/^\s*(?:true|false|null)\s*$/gim, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

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

    // Update campaign location and mood if changed
    if (response.location || response.mood) {
      const campaign = get().campaign;
      if (campaign) {
        set({ campaign: {
          ...campaign,
          ...(response.location && { currentLocation: response.location }),
          ...(response.mood && { currentMood: response.mood }),
        } });
      }
    }

    // Check for tutorial completion
    if (response.tutorialComplete) {
      set({ isTutorialComplete: true });
    }

    // Update character XP and inventory from state changes (mirrors server-side persistence)
    if (response.stateChanges) {
      const char = get().character;
      if (char) {
        let updated = { ...char };
        for (const change of response.stateChanges) {
          if (change.type === 'hp' && change.target === char.name) {
            const newHp = Math.max(0, Math.min(updated.maxHp, updated.hp + Number(change.value)));
            updated = { ...updated, hp: newHp };
          }
          if (change.type === 'xp' && change.target === char.name) {
            updated = { ...updated, xp: (updated.xp || 0) + Number(change.value) };
          }
          if (change.type === 'item' && change.target === char.name) {
            const itemData = typeof change.value === 'object' && change.value !== null
              ? change.value as Record<string, any>
              : { name: String(change.value), type: 'misc', quantity: 1, description: '' };
            const itemType = itemData.type || 'misc';

            if (itemType === 'weapon' || itemType === 'armor' || itemType === 'shield' || itemType === 'accessory') {
              updated = {
                ...updated,
                equipment: [...updated.equipment, {
                  id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
                  name: itemData.name || 'Unknown Item',
                  type: itemType,
                  slot: itemData.slot || undefined,
                  equipped: false,
                  properties: itemData.properties || {},
                }],
              };
            } else {
              const inventory = [...updated.inventory];
              const existing = inventory.find(i => i.name === itemData.name);
              if (existing) {
                existing.quantity += (itemData.quantity || 1);
              } else {
                inventory.push({
                  id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
                  name: itemData.name || 'Unknown Item',
                  quantity: itemData.quantity || 1,
                  description: itemData.description || '',
                  type: itemType as any,
                });
              }
              updated = { ...updated, inventory };
            }
          }
        }
        if (updated !== char) {
          set({ character: updated });
        }
      }
    }

    // Update character spells if changed
    if (response.spellChanges) {
      const char = get().character;
      if (char) {
        let spells = [...(char.knownSpells || [])];
        if (response.spellChanges.learned?.length) {
          for (const spell of response.spellChanges.learned) {
            if (!spells.some(s => s.name === spell.name)) {
              spells.push(spell);
            }
          }
        }
        if (response.spellChanges.removed?.length) {
          spells = spells.filter(s => !response.spellChanges!.removed.includes(s.name));
        }
        set({ character: { ...char, knownSpells: spells } });
      }
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

  toggleEquip: (itemId) => {
    const char = get().character;
    if (!char) return;

    const target = char.equipment.find(e => e.id === itemId);
    if (!target) return;

    const isEquipping = !target.equipped;

    // Infer slot from item
    const slotOf = (item: typeof target) => {
      if (item.slot) return item.slot;
      if (item.type === 'weapon') return 'mainhand';
      if (item.type === 'armor') return 'body';
      if (item.type === 'shield') return 'offhand';
      return 'neck';
    };
    const targetSlot = slotOf(target);

    const equipment = char.equipment.map(item => {
      if (item.id === itemId) {
        return { ...item, equipped: isEquipping };
      }
      // If equipping, unequip anything currently in the same slot
      if (isEquipping && item.equipped && slotOf(item) === targetSlot) {
        return { ...item, equipped: false };
      }
      return item;
    });

    // Recalculate AC based on new equipment state
    const armor = equipment.find(e => e.type === 'armor' && e.equipped);
    const shield = equipment.find(e => e.type === 'shield' && e.equipped);
    const dexMod = Math.floor((char.abilityScores.dexterity - 10) / 2);
    let ac = 10 + dexMod;
    if (armor) {
      const armorAC = Number(armor.properties.ac) || 10;
      const maxDex = armor.properties.maxDex as number ?? Infinity;
      const effectiveDex = isFinite(maxDex) ? Math.min(dexMod, maxDex) : dexMod;
      ac = armorAC + effectiveDex;
    }
    if (shield) {
      ac += Number(shield.properties.acBonus) || 2;
    }
    set({ character: { ...char, equipment, ac } });
  },

  clearPendingApprovals: () => set({ pendingApprovalChanges: [] }),

  resetSession: () => set(initialState),
}));
