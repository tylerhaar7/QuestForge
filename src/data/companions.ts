// Starter companions — Korrin, Sera, Thaelen
// These are the default party members for every new campaign

import type { Companion, ClassName, Condition } from '@/types/game';

export interface StarterCompanion {
  name: string;
  className: ClassName;
  level: number;
  maxHp: number;
  ac: number;
  portrait: string;
  color: string;
  personality: {
    approves: string[];
    disapproves: string[];
    voice: string;
    backstory: string;
  };
  abilities: {
    name: string;
    type: 'attack' | 'spell' | 'reaction' | 'bonus' | 'heal';
    description: string;
    icon: string;
  }[];
}

export const STARTER_COMPANIONS: StarterCompanion[] = [
  {
    name: 'Korrin',
    className: 'fighter',
    level: 1,
    maxHp: 12,
    ac: 16,
    portrait: '',
    color: '#c4a035',
    personality: {
      approves: ['honor', 'protection', 'honesty', 'bravery', 'defending_innocents'],
      disapproves: ['deception', 'cowardice', 'harming_innocents', 'betrayal', 'cruelty'],
      voice: 'Steadfast and earnest. Speaks plainly. Believes in doing the right thing even when it costs. Occasional dry humor.',
      backstory: 'A disgraced soldier seeking redemption through honest service.',
    },
    abilities: [
      { name: 'Second Wind', type: 'heal', description: 'Recover 1d10+1 HP', icon: '💨' },
      { name: 'Protection', type: 'reaction', description: 'Impose disadvantage on attack targeting adjacent ally', icon: '🛡️' },
    ],
  },
  {
    name: 'Sera',
    className: 'rogue',
    level: 1,
    maxHp: 9,
    ac: 14,
    portrait: '',
    color: '#8b5cf6',
    personality: {
      approves: ['cleverness', 'loyalty', 'street_smarts', 'pragmatism', 'wit'],
      disapproves: ['naivety', 'blind_authority', 'unnecessary_cruelty', 'stupidity', 'self_righteousness'],
      voice: 'Sharp-tongued and quick. Uses humor to deflect. Fiercely loyal once trust is earned. Hides vulnerability behind sarcasm.',
      backstory: 'A former street urchin who learned that trust is a luxury.',
    },
    abilities: [
      { name: 'Sneak Attack', type: 'attack', description: 'Extra 1d6 damage with advantage', icon: '🗡️' },
      { name: 'Cunning Action', type: 'bonus', description: 'Dash, Disengage, or Hide as bonus action', icon: '💨' },
    ],
  },
  {
    name: 'Thaelen',
    className: 'druid',
    level: 1,
    maxHp: 9,
    ac: 13,
    portrait: '',
    color: '#22c55e',
    personality: {
      approves: ['nature_protection', 'patience', 'wisdom', 'empathy', 'balance'],
      disapproves: ['destruction', 'haste', 'fire_use', 'greed', 'waste'],
      voice: 'Thoughtful and measured. Speaks with quiet authority. Sees patterns others miss. Occasionally cryptic.',
      backstory: 'A wandering druid whose grove was destroyed. Seeks to understand why the natural order is breaking.',
    },
    abilities: [
      { name: 'Healing Word', type: 'heal', description: 'Heal 1d4+2 at range as bonus action', icon: '🌿' },
      { name: 'Entangle', type: 'spell', description: 'Restrain creatures in a 20ft area', icon: '🌱' },
    ],
  },
];

/**
 * Build a full Companion object from starter data for a new campaign
 */
export function buildCompanion(starter: StarterCompanion): Companion {
  return {
    name: starter.name,
    className: starter.className,
    level: starter.level,
    hp: starter.maxHp,
    maxHp: starter.maxHp,
    ac: starter.ac,
    portrait: starter.portrait,
    color: starter.color,
    approvalScore: 50,
    relationshipStage: 'neutral',
    personality: starter.personality,
    abilities: starter.abilities,
    conditions: [],
  };
}
