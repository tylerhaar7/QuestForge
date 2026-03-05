import { create } from 'zustand';
import type { AbilityScore, AbilityScores, ClassName, RaceName, Skill } from '@/types/game';
import type { EquipmentItem } from '@/types/game';
import { RACES } from '@/data/races';
import { CLASSES } from '@/data/classes';
import { ORIGIN_MAP } from '@/data/origins';
import { getModifier, calculateMaxHP, calculateAC, getProficiencyBonus } from '@/engine/character';

// Standard Array for ability score assignment
export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];

interface CharacterCreationState {
  // Step state
  step: number;   // 0=race, 1=class, 2=abilities, 3=origin, 4=name/summary

  // Selections
  race: RaceName | null;
  className: ClassName | null;
  abilityAssignment: Partial<Record<AbilityScore, number>>;  // ability -> base score (before race bonus)
  selectedSkills: Skill[];
  originId: string | null;
  customOrigin: string | null;  // If player writes their own
  name: string;

  // Actions
  setStep: (step: number) => void;
  setRace: (race: RaceName) => void;
  setClass: (className: ClassName) => void;
  setAbilityScore: (ability: AbilityScore, score: number) => void;
  clearAbilityScore: (ability: AbilityScore) => void;
  setSelectedSkills: (skills: Skill[]) => void;
  setOrigin: (originId: string) => void;
  setCustomOrigin: (text: string) => void;
  setName: (name: string) => void;
  reset: () => void;

  // Derived
  getFinalAbilityScores: () => AbilityScores | null;
  getAssignedScores: () => number[];
  getAvailableScores: () => number[];
  canProceedFromAbilities: () => boolean;
}

const ABILITIES: AbilityScore[] = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];

const initialState = {
  step: 0,
  race: null as RaceName | null,
  className: null as ClassName | null,
  abilityAssignment: {} as Partial<Record<AbilityScore, number>>,
  selectedSkills: [] as Skill[],
  originId: null as string | null,
  customOrigin: null as string | null,
  name: '',
};

export const useCharacterCreationStore = create<CharacterCreationState>((set, get) => ({
  ...initialState,

  setStep: (step) => set({ step }),
  setRace: (race) => set({ race }),
  setClass: (className) => set({ className, selectedSkills: [] }),  // Reset skills when class changes
  setAbilityScore: (ability, score) => set((state) => ({
    abilityAssignment: { ...state.abilityAssignment, [ability]: score },
  })),
  clearAbilityScore: (ability) => set((state) => {
    const next = { ...state.abilityAssignment };
    delete next[ability];
    return { abilityAssignment: next };
  }),
  setSelectedSkills: (skills) => set({ selectedSkills: skills }),
  setOrigin: (originId) => set({ originId, customOrigin: null }),
  setCustomOrigin: (text) => set({ customOrigin: text, originId: 'custom' }),
  setName: (name) => set({ name }),
  reset: () => set(initialState),

  getAssignedScores: () => Object.values(get().abilityAssignment),

  getAvailableScores: () => {
    const assigned = Object.values(get().abilityAssignment);
    const available = [...STANDARD_ARRAY];
    for (const score of assigned) {
      const idx = available.indexOf(score);
      if (idx !== -1) available.splice(idx, 1);
    }
    return available;
  },

  canProceedFromAbilities: () => {
    const { abilityAssignment, className } = get();
    const allAssigned = ABILITIES.every(a => abilityAssignment[a] !== undefined);
    const classData = className ? CLASSES[className] : null;
    const skillCount = get().selectedSkills.length;
    const requiredSkills = classData?.skillChoices.pick ?? 0;
    return allAssigned && skillCount === requiredSkills;
  },

  getFinalAbilityScores: () => {
    const { race, abilityAssignment } = get();
    if (!race) return null;
    const raceData = RACES[race];
    const allAssigned = ABILITIES.every(a => abilityAssignment[a] !== undefined);
    if (!allAssigned) return null;

    const scores: AbilityScores = { strength: 0, dexterity: 0, constitution: 0, intelligence: 0, wisdom: 0, charisma: 0 };
    for (const ability of ABILITIES) {
      const base = abilityAssignment[ability] ?? 10;
      const raceBonus = raceData.abilityBonuses[ability] ?? 0;
      scores[ability] = base + raceBonus;
    }
    return scores;
  },
}));
