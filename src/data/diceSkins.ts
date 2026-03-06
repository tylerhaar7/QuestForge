export interface DiceSkin {
  id: string;
  name: string;
  faceColor: string;
  numberColor: string;
  edgeColor: string;
  metalness: number;
  roughness: number;
  emissiveColor?: string;
  emissiveIntensity?: number;
  premium: boolean;
}

export const DICE_SKINS: DiceSkin[] = [
  {
    id: 'tavern_bone',
    name: 'Tavern Bone',
    faceColor: '#d4c5a9',
    numberColor: '#2a1f0f',
    edgeColor: '#8b7d6b',
    metalness: 0.1,
    roughness: 0.8,
    premium: false,
  },
  {
    id: 'obsidian',
    name: 'Obsidian',
    faceColor: '#1a1a1a',
    numberColor: '#b48c3c',
    edgeColor: '#333333',
    metalness: 0.9,
    roughness: 0.2,
    emissiveColor: '#ff6600',
    emissiveIntensity: 0.05,
    premium: false,
  },
  {
    id: 'dragon_gold',
    name: 'Dragon Gold',
    faceColor: '#2a1f0f',
    numberColor: '#ffffff',
    edgeColor: '#b48c3c',
    metalness: 0.7,
    roughness: 0.3,
    emissiveColor: '#b48c3c',
    emissiveIntensity: 0.1,
    premium: false,
  },
];

export const DEFAULT_DICE_SKIN = 'obsidian';
