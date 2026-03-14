// Character Screen — Parchment scroll character sheet
// Full-screen overlay styled as a classic D&D parchment with unroll animation

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

import { colors } from '@/theme/colors';
import { fonts, spacing } from '@/theme/typography';
import { useGameStore } from '@/stores/useGameStore';
import { getModifier, getSkillModifier, getSaveModifier, SKILL_ABILITIES } from '@/engine/character';
import { CLASSES } from '@/data/classes';
import { RACES } from '@/data/races';
import type { Character, AbilityScore, Skill, EquipmentItem, EquipmentSlot, InventoryItem, Spell } from '@/types/game';
import { PortraitFrame, InventorySlot, FantasyPanel, FantasyButton } from '@/components/ui';
import { MoodParticles } from '@/components/game/MoodParticles';
import { updateCharacterEquipment } from '@/services/character';

// ─── Constants ────────────────────────────────────────────────────────────────

const PARCHMENT = {
  body: '#e8d8b4',
  edgeDark: 'rgba(160, 128, 80, 0.2)',
  ink: '#2a1a08',
  inkSecondary: '#6b5730',
  gold: '#8b6914',
  divider: '#b8a070',
  agedSpot: 'rgba(160, 130, 80, 0.15)',
};

const ABILITY_LABELS: Record<AbilityScore, string> = {
  strength: 'STR',
  dexterity: 'DEX',
  constitution: 'CON',
  intelligence: 'INT',
  wisdom: 'WIS',
  charisma: 'CHA',
};

const ABILITY_ORDER: AbilityScore[] = [
  'strength', 'dexterity', 'constitution',
  'intelligence', 'wisdom', 'charisma',
];

const ALL_SKILLS: Skill[] = [
  'acrobatics', 'animal_handling', 'arcana', 'athletics',
  'deception', 'history', 'insight', 'intimidation',
  'investigation', 'medicine', 'nature', 'perception',
  'performance', 'persuasion', 'religion', 'sleight_of_hand',
  'stealth', 'survival',
];

const SKILL_DISPLAY_NAMES: Record<Skill, string> = {
  acrobatics: 'Acrobatics',
  animal_handling: 'Animal Handling',
  arcana: 'Arcana',
  athletics: 'Athletics',
  deception: 'Deception',
  history: 'History',
  insight: 'Insight',
  intimidation: 'Intimidation',
  investigation: 'Investigation',
  medicine: 'Medicine',
  nature: 'Nature',
  perception: 'Perception',
  performance: 'Performance',
  persuasion: 'Persuasion',
  religion: 'Religion',
  sleight_of_hand: 'Sleight of Hand',
  stealth: 'Stealth',
  survival: 'Survival',
};

const EQUIPMENT_ICONS: Record<EquipmentItem['type'], string> = {
  weapon: '\u2694',
  armor: '\uD83D\uDEE1',
  shield: '\uD83D\uDEE1',
  accessory: '\u2726',
};

const INVENTORY_ICONS: Record<InventoryItem['type'], string> = {
  consumable: '\uD83E\uDDEA',
  quest: '\uD83D\uDCDC',
  treasure: '\uD83D\uDCB0',
  material: '\uD83D\uDD2E',
  misc: '\uD83C\uDF92',
};

const SPELL_LEVEL_LABELS: Record<number, string> = {
  0: 'CANTRIPS',
  1: '1ST LEVEL',
  2: '2ND LEVEL',
  3: '3RD LEVEL',
  4: '4TH LEVEL',
  5: '5TH LEVEL',
  6: '6TH LEVEL',
  7: '7TH LEVEL',
  8: '8TH LEVEL',
  9: '9TH LEVEL',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatModifier(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

function getHpColor(hp: number, maxHp: number): string {
  const ratio = maxHp > 0 ? hp / maxHp : 0;
  if (ratio > 0.5) return '#2a6e1e';
  if (ratio > 0.25) return '#8b7514';
  return '#8b1a1a';
}

function getEquipmentSummary(item: EquipmentItem): string {
  const props = item.properties;
  if (item.type === 'weapon') {
    const parts: string[] = [];
    if (props.damage) parts.push(String(props.damage));
    if (props.damageType) parts.push(String(props.damageType));
    return parts.join(' ');
  }
  if (item.type === 'armor') {
    return props.ac ? `AC ${props.ac}` : '';
  }
  if (item.type === 'shield') {
    return props.acBonus ? `+${props.acBonus} AC` : '+2 AC';
  }
  return '';
}

function getRaceDisplayName(race: Character['race']): string {
  return RACES[race]?.name ?? race;
}

function getClassDisplayName(className: Character['className']): string {
  return CLASSES[className]?.name ?? className;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ParchmentCurlTop() {
  return (
    <View style={styles.curlContainer}>
      <View style={styles.curlDark} />
      <View style={styles.curlMid} />
      <View style={styles.curlLight} />
      <View style={styles.curlMid} />
      <View style={styles.curlShadow} />
    </View>
  );
}

function ParchmentCurlBottom() {
  return (
    <View style={styles.curlContainer}>
      <View style={styles.curlShadowBottom} />
      <View style={styles.curlMid} />
      <View style={styles.curlLight} />
      <View style={styles.curlMid} />
      <View style={styles.curlDark} />
    </View>
  );
}

function SectionDivider({ label }: { label: string }) {
  return (
    <View style={styles.sectionDivider}>
      <View style={styles.sectionDividerLine} />
      <Text style={styles.sectionDividerLabel}>{label}</Text>
      <View style={styles.sectionDividerLine} />
    </View>
  );
}

function CharacterHeader({ character }: { character: Character }) {
  const raceName = getRaceDisplayName(character.race);
  const className = getClassDisplayName(character.className);

  return (
    <View style={styles.header}>
      <PortraitFrame size="md" variant="simple">
        <Text style={styles.portraitInitial}>{character.name.charAt(0).toUpperCase()}</Text>
      </PortraitFrame>
      <Text style={styles.headerName}>{character.name}</Text>
      <Text style={styles.headerSubtitle}>
        Level {character.level} · {raceName} · {className}
      </Text>
      <View style={styles.headerBorder} />
    </View>
  );
}

// D&D 5e XP thresholds (mirrors progression.ts)
const XP_THRESHOLDS = [0, 0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000];

function ExperienceSection({ character }: { character: Character }) {
  const currentXP = character.xp || 0;
  const isMaxLevel = character.level >= 20;
  const nextLevelXP = isMaxLevel ? XP_THRESHOLDS[20] : XP_THRESHOLDS[character.level + 1];
  const currentLevelXP = XP_THRESHOLDS[character.level];
  const progress = isMaxLevel ? 1 : Math.min(1, (currentXP - currentLevelXP) / Math.max(1, nextLevelXP - currentLevelXP));

  return (
    <View style={styles.xpContainer}>
      <View style={styles.xpLabelRow}>
        <Text style={styles.xpLabel}>EXPERIENCE</Text>
        <Text style={styles.xpValue}>
          {isMaxLevel ? 'MAX LEVEL' : `${currentXP.toLocaleString()} / ${nextLevelXP.toLocaleString()}`}
        </Text>
      </View>
      <View style={styles.xpBarBg}>
        <View style={[styles.xpBarFill, { width: `${Math.round(progress * 100)}%` }]} />
      </View>
    </View>
  );
}

function AbilityScoresSection({ character }: { character: Character }) {
  return (
    <View style={styles.abilitiesRow}>
      {ABILITY_ORDER.map((ability) => {
        const score = character.abilityScores[ability];
        const mod = getModifier(score);
        return (
          <View key={ability} style={styles.abilityItem}>
            <View style={styles.abilityDiamond}>
              <Text style={styles.abilityScore}>{score}</Text>
            </View>
            <Text style={styles.abilityLabel}>{ABILITY_LABELS[ability]}</Text>
            <Text style={styles.abilityModifier}>{formatModifier(mod)}</Text>
          </View>
        );
      })}
    </View>
  );
}

function CombatStatsSection({ character }: { character: Character }) {
  const hpColor = getHpColor(character.hp, character.maxHp);

  return (
    <View style={styles.combatRow}>
      <View style={styles.combatCard}>
        <Text style={styles.combatLabel}>AC</Text>
        <Text style={styles.combatValue}>{character.ac}</Text>
      </View>
      <View style={styles.combatCard}>
        <Text style={styles.combatLabel}>HP</Text>
        <Text style={[styles.combatValue, { color: hpColor }]}>
          {character.hp}/{character.maxHp}
        </Text>
      </View>
      <View style={styles.combatCard}>
        <Text style={styles.combatLabel}>SPEED</Text>
        <Text style={styles.combatValue}>{character.speed}ft</Text>
      </View>
    </View>
  );
}

function SavingThrowsSection({ character }: { character: Character }) {
  return (
    <View style={styles.savesRow}>
      {ABILITY_ORDER.map((ability) => {
        const mod = getSaveModifier(character, ability);
        const isProficient = character.proficientSaves.includes(ability);
        return (
          <View
            key={ability}
            style={[
              styles.savePill,
              isProficient ? styles.savePillProficient : styles.savePillNormal,
            ]}
          >
            <Text
              style={[
                styles.savePillText,
                isProficient ? styles.savePillTextProficient : styles.savePillTextNormal,
              ]}
            >
              {ABILITY_LABELS[ability]} {formatModifier(mod)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function SkillsSection({ character }: { character: Character }) {
  return (
    <View style={styles.skillsList}>
      {ALL_SKILLS.map((skill) => {
        const mod = getSkillModifier(character, skill);
        const isProficient = character.proficientSkills.includes(skill);
        return (
          <View key={skill} style={styles.skillRow}>
            <Text
              style={[
                styles.skillName,
                isProficient ? styles.skillProficient : styles.skillNormal,
              ]}
            >
              {isProficient ? '\u25CF ' : '\u25CB '}
              {SKILL_DISPLAY_NAMES[skill]}
            </Text>
            <Text
              style={[
                styles.skillModifier,
                isProficient ? styles.skillProficient : styles.skillNormal,
              ]}
            >
              {formatModifier(mod)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

// All wearable equipment slots — ordered for the character doll grid layout
const ALL_SLOTS: { slot: EquipmentSlot; label: string; icon: string }[] = [
  { slot: 'head',     label: 'HEAD',      icon: '\uD83D\uDC51' },  // crown
  { slot: 'neck',     label: 'NECK',      icon: '\uD83D\uDCFF' },  // necklace
  { slot: 'cloak',    label: 'CLOAK',     icon: '\uD83E\uDDE3' },  // scarf (cloak)
  { slot: 'body',     label: 'BODY',      icon: '\uD83E\uDEE0' },  // armor stand — fallback
  { slot: 'mainhand', label: 'MAIN HAND', icon: '\u2694' },         // swords
  { slot: 'offhand',  label: 'OFF HAND',  icon: '\uD83D\uDEE1' },  // shield
  { slot: 'hands',    label: 'HANDS',     icon: '\uD83E\uDDE4' },  // gloves
  { slot: 'waist',    label: 'WAIST',     icon: '\uD83E\uDD4B' },  // belt
  { slot: 'feet',     label: 'FEET',      icon: '\uD83E\uDD7E' },  // boot
  { slot: 'ring1',    label: 'RING',      icon: '\uD83D\uDC8D' },  // ring
  { slot: 'ring2',    label: 'RING',      icon: '\uD83D\uDC8D' },  // ring
];

/** Infer slot from item type when slot field is absent */
function getItemSlot(item: EquipmentItem): EquipmentSlot {
  if (item.slot) return item.slot;
  switch (item.type) {
    case 'weapon': return 'mainhand';
    case 'armor':  return 'body';
    case 'shield': return 'offhand';
    default:       return 'neck'; // generic accessory fallback
  }
}

function EquipmentSection({ equipment }: { equipment: EquipmentItem[] }) {
  const toggleEquip = useGameStore((s) => s.toggleEquip);
  const [selectedItem, setSelectedItem] = useState<EquipmentItem | null>(null);
  const unequipped = equipment.filter((e) => !e.equipped);

  // Build a map: slot → equipped item
  const slotMap = new Map<EquipmentSlot, EquipmentItem>();
  for (const item of equipment) {
    if (!item.equipped) continue;
    const slot = getItemSlot(item);
    slotMap.set(slot, item);
  }

  const handleSlotPress = useCallback((item: EquipmentItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedItem((prev) => (prev?.id === item.id ? null : item));
  }, []);

  const handleEquipToggle = useCallback((item: EquipmentItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    toggleEquip(item.id);
    setSelectedItem(null);

    // Persist to Supabase in background
    const char = useGameStore.getState().character;
    if (char) {
      updateCharacterEquipment(char.id, char.equipment, char.ac).catch(() => {});
    }
  }, [toggleEquip]);

  if (equipment.length === 0) {
    return <Text style={styles.emptyText}>No equipment</Text>;
  }

  return (
    <View>
      {/* Worn equipment panel — character doll style */}
      <FantasyPanel variant="card" style={styles.wornPanel}>
        <Text style={styles.wornTitle}>WORN EQUIPMENT</Text>

        {/* Row 1: Head */}
        <View style={styles.dollRow}>
          <SlotCell slot="head" slotMap={slotMap} selectedItem={selectedItem} onPress={handleSlotPress} />
        </View>

        {/* Row 2: Cloak — Body — Neck */}
        <View style={styles.dollRow}>
          <SlotCell slot="cloak" slotMap={slotMap} selectedItem={selectedItem} onPress={handleSlotPress} />
          <SlotCell slot="body" slotMap={slotMap} selectedItem={selectedItem} onPress={handleSlotPress} />
          <SlotCell slot="neck" slotMap={slotMap} selectedItem={selectedItem} onPress={handleSlotPress} />
        </View>

        {/* Row 3: Main Hand — Waist — Off Hand */}
        <View style={styles.dollRow}>
          <SlotCell slot="mainhand" slotMap={slotMap} selectedItem={selectedItem} onPress={handleSlotPress} />
          <SlotCell slot="waist" slotMap={slotMap} selectedItem={selectedItem} onPress={handleSlotPress} />
          <SlotCell slot="offhand" slotMap={slotMap} selectedItem={selectedItem} onPress={handleSlotPress} />
        </View>

        {/* Row 4: Hands — Feet */}
        <View style={styles.dollRow}>
          <SlotCell slot="hands" slotMap={slotMap} selectedItem={selectedItem} onPress={handleSlotPress} />
          <SlotCell slot="feet" slotMap={slotMap} selectedItem={selectedItem} onPress={handleSlotPress} />
        </View>

        {/* Row 5: Ring — Ring */}
        <View style={styles.dollRow}>
          <SlotCell slot="ring1" slotMap={slotMap} selectedItem={selectedItem} onPress={handleSlotPress} />
          <SlotCell slot="ring2" slotMap={slotMap} selectedItem={selectedItem} onPress={handleSlotPress} />
        </View>
      </FantasyPanel>

      {/* Pack — unequipped items */}
      {unequipped.length > 0 && (
        <FantasyPanel variant="strip" style={styles.packPanel}>
          <Text style={styles.packLabel}>PACK</Text>
          <View style={styles.packGrid}>
            {unequipped.map((item) => {
              const icon = EQUIPMENT_ICONS[item.type] || '\u2726';
              const isSelected = selectedItem?.id === item.id;
              return (
                <InventorySlot
                  key={item.id}
                  icon={icon}
                  label={item.name}
                  variant="square"
                  onPress={() => handleSlotPress(item)}
                  style={isSelected ? styles.wornSlotSelected : undefined}
                />
              );
            })}
          </View>
        </FantasyPanel>
      )}

      {/* Detail card for selected item */}
      {selectedItem && (
        <FantasyPanel variant="pinned" style={styles.detailPanel}>
          <View style={styles.itemDetailHeader}>
            <Text style={styles.itemDetailIcon}>
              {EQUIPMENT_ICONS[selectedItem.type] || '\u2726'}
            </Text>
            <View style={styles.itemDetailTitleBlock}>
              <Text style={styles.itemDetailName}>{selectedItem.name}</Text>
              <Text style={styles.itemDetailType}>
                {selectedItem.type.charAt(0).toUpperCase() + selectedItem.type.slice(1)}
                {selectedItem.equipped ? ' \u2022 Equipped' : ''}
              </Text>
            </View>
          </View>

          {/* Properties */}
          {selectedItem.properties && Object.keys(selectedItem.properties).length > 0 && (
            <View style={styles.itemDetailProps}>
              {selectedItem.properties.damage && (
                <Text style={styles.itemDetailProp}>
                  <Text style={styles.itemDetailPropLabel}>Damage: </Text>
                  {selectedItem.properties.damage}
                  {selectedItem.properties.damageType ? ` ${selectedItem.properties.damageType}` : ''}
                </Text>
              )}
              {selectedItem.properties.ac != null && (
                <Text style={styles.itemDetailProp}>
                  <Text style={styles.itemDetailPropLabel}>AC: </Text>
                  {selectedItem.properties.ac}
                </Text>
              )}
              {selectedItem.properties.acBonus != null && (
                <Text style={styles.itemDetailProp}>
                  <Text style={styles.itemDetailPropLabel}>AC Bonus: </Text>
                  +{selectedItem.properties.acBonus}
                </Text>
              )}
              {selectedItem.properties.range && (
                <Text style={styles.itemDetailProp}>
                  <Text style={styles.itemDetailPropLabel}>Range: </Text>
                  {selectedItem.properties.range}
                </Text>
              )}
              {selectedItem.properties.description && (
                <Text style={styles.itemDetailDesc}>
                  {selectedItem.properties.description}
                </Text>
              )}
            </View>
          )}

          {/* Equip / Unequip + Close */}
          <View style={styles.itemDetailActions}>
            <FantasyButton
              variant="primary"
              label={selectedItem.equipped ? 'UNEQUIP' : 'EQUIP'}
              onPress={() => handleEquipToggle(selectedItem)}
              style={{ flex: 1 }}
            />
            <FantasyButton
              variant="secondary"
              label="CLOSE"
              onPress={() => setSelectedItem(null)}
              style={{ flex: 1 }}
            />
          </View>
        </FantasyPanel>
      )}
    </View>
  );
}

/** Individual slot cell used in the character doll layout */
function SlotCell({
  slot,
  slotMap,
  selectedItem,
  onPress,
}: {
  slot: EquipmentSlot;
  slotMap: Map<EquipmentSlot, EquipmentItem>;
  selectedItem: EquipmentItem | null;
  onPress: (item: EquipmentItem) => void;
}) {
  const meta = ALL_SLOTS.find((s) => s.slot === slot)!;
  const item = slotMap.get(slot);
  const isSelected = selectedItem?.id === item?.id;

  return (
    <View style={styles.wornSlotWrapper}>
      <InventorySlot
        icon={item ? (EQUIPMENT_ICONS[item.type] || meta.icon) : undefined}
        label={item ? item.name : undefined}
        empty={!item}
        variant="square"
        onPress={item ? () => onPress(item) : undefined}
        style={isSelected ? styles.wornSlotSelected : undefined}
      >
        {!item && <Text style={styles.emptySlotLabel}>{meta.label}</Text>}
      </InventorySlot>
      {item && (
        <Text style={styles.wornSlotDetail} numberOfLines={1}>
          {getEquipmentSummary(item)}
        </Text>
      )}
    </View>
  );
}

function InventorySection({ inventory }: { inventory: InventoryItem[] }) {
  if (inventory.length === 0) {
    return <Text style={styles.emptyText}>No items</Text>;
  }

  return (
    <View>
      {inventory.map((item, index) => {
        const icon = INVENTORY_ICONS[item.type] || '\uD83C\uDF92';
        return (
          <View
            key={item.id}
            style={[
              styles.equipmentRow,
              index < inventory.length - 1 && styles.equipmentRowBorder,
            ]}
          >
            <Text style={styles.equipmentName}>
              {icon} {item.name}
            </Text>
            <Text style={styles.equipmentSummary}>x{item.quantity}</Text>
          </View>
        );
      })}
    </View>
  );
}

function SpellsSection({ character }: { character: Character }) {
  const [expandedSpells, setExpandedSpells] = useState<Set<string>>(new Set());
  const spells = character.knownSpells;

  if (!spells || spells.length === 0) {
    return <Text style={styles.emptyTextItalic}>No spells known</Text>;
  }

  const toggleSpell = (name: string) => {
    setExpandedSpells((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  // Group spells by level
  const grouped = new Map<number, Spell[]>();
  for (const spell of spells) {
    const list = grouped.get(spell.level) || [];
    list.push(spell);
    grouped.set(spell.level, list);
  }
  const sortedLevels = Array.from(grouped.keys()).sort((a, b) => a - b);

  // Spell slot tracker
  const hasSlots = character.maxSpellSlots.some((s) => s > 0);

  return (
    <View>
      {/* Slot tracker */}
      {hasSlots && (
        <View style={styles.slotTrackerRow}>
          {character.maxSpellSlots.map((maxSlot, idx) => {
            if (idx === 0 || maxSlot === 0) return null;
            const remaining = character.spellSlots[idx] || 0;
            const dots: string[] = [];
            for (let i = 0; i < maxSlot; i++) {
              dots.push(i < remaining ? '\u25CF' : '\u25CB');
            }
            return (
              <View key={idx} style={styles.slotGroup}>
                <Text style={styles.slotLevel}>Lv{idx}</Text>
                <Text style={styles.slotDots}>{dots.join(' ')}</Text>
                <Text style={styles.slotCount}>
                  {remaining}/{maxSlot}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Spell groups */}
      {sortedLevels.map((level) => {
        const levelSpells = grouped.get(level) || [];
        return (
          <View key={level} style={styles.spellGroup}>
            <Text style={styles.spellGroupLabel}>
              {SPELL_LEVEL_LABELS[level] || `LEVEL ${level}`}
            </Text>
            <View style={styles.spellChipsRow}>
              {levelSpells.map((spell) => {
                const isExpanded = expandedSpells.has(spell.name);
                return (
                  <View key={spell.name} style={styles.spellChipWrapper}>
                    <Pressable
                      onPress={() => toggleSpell(spell.name)}
                      style={[
                        styles.spellChip,
                        isExpanded && styles.spellChipExpanded,
                      ]}
                    >
                      <Text
                        style={[
                          styles.spellChipText,
                          isExpanded && styles.spellChipTextExpanded,
                        ]}
                      >
                        {spell.name}
                      </Text>
                    </Pressable>
                    {isExpanded && (
                      <View style={styles.spellDetails}>
                        <Text style={styles.spellDetailRow}>
                          <Text style={styles.spellDetailLabel}>Casting Time: </Text>
                          {spell.castingTime}
                        </Text>
                        <Text style={styles.spellDetailRow}>
                          <Text style={styles.spellDetailLabel}>Range: </Text>
                          {spell.range}
                        </Text>
                        <Text style={styles.spellDetailRow}>
                          <Text style={styles.spellDetailLabel}>Duration: </Text>
                          {spell.duration}
                        </Text>
                        <View style={styles.componentRow}>
                          <Text style={styles.spellDetailLabel}>Components: </Text>
                          {spell.components.split(',').map((c: string) => {
                            const key = c.trim().charAt(0).toUpperCase();
                            const label = key === 'V' ? 'Verbal' : key === 'S' ? 'Somatic' : key === 'M' ? 'Material' : c.trim();
                            return (
                              <View key={c} style={styles.componentPill}>
                                <Text style={styles.componentPillText}>{label}</Text>
                              </View>
                            );
                          })}
                        </View>
                        <Text style={styles.spellDescription}>
                          {spell.description}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        );
      })}
    </View>
  );
}

function ClassFeaturesSection({ character }: { character: Character }) {
  const classData = CLASSES[character.className];
  const features = classData?.features || [];

  if (features.length === 0) {
    return <Text style={styles.emptyText}>No features</Text>;
  }

  return (
    <View>
      {features.map((feature, index) => (
        <View key={index} style={styles.featureItem}>
          <Text style={styles.featureName}>{feature.name}</Text>
          <Text style={styles.featureDescription}>{feature.description}</Text>
        </View>
      ))}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function CharacterScreen() {
  const router = useRouter();
  const character = useGameStore((s) => s.character);

  // Unroll animation
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withSpring(1, { damping: 15, stiffness: 120 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.95 + 0.05 * progress.value }],
  }));

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  // ── Empty state ──────────────────────────────────────────────────────────
  if (!character) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateText}>No character loaded</Text>
        </View>
        <Pressable onPress={handleClose} style={styles.closeButton}>
          <View style={styles.closeButtonInner}>
            <Text style={styles.closeButtonText}>✕</Text>
          </View>
        </Pressable>
      </SafeAreaView>
    );
  }

  // ── Main layout ──────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <MoodParticles />
      <Animated.View style={[styles.scrollContainer, animatedStyle]}>
        {/* Top curl */}
        <ParchmentCurlTop />

        {/* Parchment body */}
        <ScrollView
          style={styles.parchmentBody}
          contentContainerStyle={styles.parchmentContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Edge darkening overlays */}
          <View style={styles.edgeLeft} />
          <View style={styles.edgeRight} />

          <CharacterHeader character={character} />

          <ExperienceSection character={character} />

          <SectionDivider label="ABILITY SCORES" />
          <AbilityScoresSection character={character} />

          <SectionDivider label="COMBAT" />
          <CombatStatsSection character={character} />

          <SectionDivider label="SAVING THROWS" />
          <SavingThrowsSection character={character} />

          <SectionDivider label="SKILLS" />
          <SkillsSection character={character} />

          <SectionDivider label="EQUIPMENT" />
          <EquipmentSection equipment={character.equipment} />

          <SectionDivider label="INVENTORY" />
          <InventorySection inventory={character.inventory} />

          <SectionDivider label="KNOWN SPELLS" />
          <SpellsSection character={character} />

          <SectionDivider label="CLASS FEATURES" />
          <ClassFeaturesSection character={character} />

          {/* Bottom padding */}
          <View style={{ height: spacing.lg }} />
        </ScrollView>

        {/* Bottom curl */}
        <ParchmentCurlBottom />
      </Animated.View>

      {/* Close button — floats on parchment below the curl */}
      <Pressable onPress={handleClose} style={styles.closeButton}>
        <View style={styles.closeButtonInner}>
          <Text style={styles.closeButtonText}>✕</Text>
        </View>
      </Pressable>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  scrollContainer: {
    flex: 1,
    marginHorizontal: spacing.sm,
  },

  // ── Close button ──────────────────────────────────────────────────────────
  closeButton: {
    position: 'absolute',
    top: 62,
    right: 18,
    zIndex: 20,
  },
  closeButtonInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: PARCHMENT.body,
    borderWidth: 1.5,
    borderColor: PARCHMENT.divider,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  closeButtonText: {
    fontFamily: fonts.heading,
    fontSize: 14,
    color: PARCHMENT.ink,
    lineHeight: 16,
  },

  // ── Parchment curls ───────────────────────────────────────────────────────
  curlContainer: {
    height: 48,
    overflow: 'hidden',
  },
  curlDark: {
    flex: 2,
    backgroundColor: '#7a5c32',
    borderRadius: 2,
  },
  curlMid: {
    flex: 3,
    backgroundColor: '#c8a870',
  },
  curlLight: {
    flex: 4,
    backgroundColor: '#e8d4a8',
  },
  curlShadow: {
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.15)',
    marginTop: -2,
  },
  curlShadowBottom: {
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.15)',
    marginBottom: -2,
  },

  // ── Parchment body ────────────────────────────────────────────────────────
  parchmentBody: {
    flex: 1,
    backgroundColor: PARCHMENT.body,
  },
  parchmentContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },

  // ── Edge darkening ────────────────────────────────────────────────────────
  edgeLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 12,
    backgroundColor: PARCHMENT.edgeDark,
  },
  edgeRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: 12,
    backgroundColor: PARCHMENT.edgeDark,
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    alignItems: 'center',
    paddingBottom: spacing.md,
    marginBottom: spacing.xs,
  },
  portraitInitial: {
    fontFamily: fonts.heading,
    fontSize: 24,
    color: '#e8dcc8',
  },
  headerName: {
    fontFamily: fonts.heading,
    fontSize: 22,
    color: PARCHMENT.ink,
    letterSpacing: 1,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontFamily: fonts.bodyItalic,
    fontSize: 12,
    color: PARCHMENT.inkSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  headerBorder: {
    width: '80%',
    height: 1.5,
    backgroundColor: PARCHMENT.divider,
    marginTop: spacing.md,
  },

  // ── Section divider ───────────────────────────────────────────────────────
  sectionDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: PARCHMENT.divider,
  },
  sectionDividerLabel: {
    fontFamily: fonts.heading,
    fontSize: 9,
    letterSpacing: 3,
    color: PARCHMENT.gold,
    marginHorizontal: spacing.sm,
    textTransform: 'uppercase',
  },

  // ── XP bar ──────────────────────────────────────────────────────────────
  xpContainer: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  xpLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  xpLabel: {
    fontFamily: fonts.heading,
    fontSize: 9,
    letterSpacing: 3,
    color: PARCHMENT.gold,
    textTransform: 'uppercase',
  },
  xpValue: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: PARCHMENT.inkSecondary,
  },
  xpBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(42,26,8,0.12)',
    borderWidth: 0.5,
    borderColor: PARCHMENT.divider,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: PARCHMENT.gold,
  },

  // ── Ability scores ────────────────────────────────────────────────────────
  abilitiesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.xs,
  },
  abilityItem: {
    alignItems: 'center',
    width: 48,
  },
  abilityDiamond: {
    width: 38,
    height: 38,
    borderWidth: 1.5,
    borderColor: PARCHMENT.gold,
    borderRadius: 4,
    transform: [{ rotate: '45deg' }],
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(232, 216, 180, 0.6)',
  },
  abilityScore: {
    fontFamily: fonts.heading,
    fontSize: 14,
    color: PARCHMENT.ink,
    transform: [{ rotate: '-45deg' }],
  },
  abilityLabel: {
    fontFamily: fonts.heading,
    fontSize: 8,
    letterSpacing: 2,
    color: PARCHMENT.gold,
    marginTop: 10,
    textTransform: 'uppercase',
  },
  abilityModifier: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: PARCHMENT.inkSecondary,
    marginTop: 2,
  },

  // ── Combat stats ──────────────────────────────────────────────────────────
  combatRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: spacing.sm,
  },
  combatCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: PARCHMENT.gold,
    borderRadius: 8,
    backgroundColor: 'rgba(139, 105, 20, 0.06)',
  },
  combatLabel: {
    fontFamily: fonts.heading,
    fontSize: 8,
    letterSpacing: 2,
    color: PARCHMENT.gold,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  combatValue: {
    fontFamily: fonts.heading,
    fontSize: 18,
    color: PARCHMENT.ink,
  },

  // ── Saving throws ─────────────────────────────────────────────────────────
  savesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  savePill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 1,
    borderRadius: 16,
  },
  savePillProficient: {
    backgroundColor: PARCHMENT.gold,
  },
  savePillNormal: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: PARCHMENT.divider,
  },
  savePillText: {
    fontFamily: fonts.headingRegular,
    fontSize: 10,
    letterSpacing: 1,
  },
  savePillTextProficient: {
    color: '#f0e6d0',
  },
  savePillTextNormal: {
    color: PARCHMENT.inkSecondary,
  },

  // ── Skills ────────────────────────────────────────────────────────────────
  skillsList: {
    gap: 1,
  },
  skillRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: spacing.xs,
  },
  skillName: {
    fontFamily: fonts.body,
    fontSize: 13,
    flex: 1,
  },
  skillModifier: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    textAlign: 'right',
    minWidth: 30,
  },
  skillProficient: {
    color: PARCHMENT.gold,
    fontFamily: fonts.bodyBold,
  },
  skillNormal: {
    color: PARCHMENT.inkSecondary,
  },

  // ── Equipment & Inventory ─────────────────────────────────────────────────
  wornPanel: {
    marginBottom: spacing.sm,
  },
  wornTitle: {
    fontFamily: fonts.heading,
    fontSize: 10,
    letterSpacing: 3,
    color: '#8b6914',
    textAlign: 'center',
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  dollRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  wornSlotWrapper: {
    alignItems: 'center',
  },
  wornSlotSelected: {
    borderColor: '#b48c3c',
    borderWidth: 2,
  },
  emptySlotLabel: {
    fontFamily: fonts.headingRegular,
    fontSize: 7,
    letterSpacing: 0.5,
    color: '#5a4a2a',
    textAlign: 'center',
  },
  wornSlotDetail: {
    fontFamily: fonts.bodyItalic,
    fontSize: 9,
    color: '#6b5730',
    marginTop: 2,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  packPanel: {
    marginTop: spacing.sm,
  },
  packLabel: {
    fontFamily: fonts.heading,
    fontSize: 10,
    letterSpacing: 3,
    color: '#8b6914',
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  packGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  detailPanel: {
    marginTop: spacing.sm,
  },
  itemDetailActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  itemDetailCard: {
    marginTop: spacing.md,
    backgroundColor: 'rgba(42,26,8,0.08)',
    borderWidth: 1,
    borderColor: PARCHMENT.divider,
    borderRadius: 8,
    padding: spacing.md,
  },
  itemDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  itemDetailIcon: {
    fontSize: 22,
    marginRight: spacing.sm,
  },
  itemDetailTitleBlock: {
    flex: 1,
  },
  itemDetailName: {
    fontFamily: fonts.heading,
    fontSize: 14,
    color: PARCHMENT.ink,
    letterSpacing: 0.5,
  },
  itemDetailType: {
    fontFamily: fonts.bodyItalic,
    fontSize: 11,
    color: PARCHMENT.inkSecondary,
    fontStyle: 'italic',
    marginTop: 1,
  },
  itemDetailProps: {
    gap: 3,
  },
  itemDetailProp: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: PARCHMENT.inkSecondary,
    lineHeight: 18,
  },
  itemDetailPropLabel: {
    fontFamily: fonts.bodyBold,
    color: PARCHMENT.ink,
  },
  itemDetailDesc: {
    fontFamily: fonts.bodyItalic,
    fontSize: 12,
    color: PARCHMENT.ink,
    lineHeight: 18,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  itemDetailHint: {
    fontFamily: fonts.body,
    fontSize: 9,
    color: PARCHMENT.divider,
    textAlign: 'right',
    marginTop: spacing.sm,
  },
  equipmentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  equipmentRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: PARCHMENT.divider,
    borderStyle: 'dotted',
  },
  equipmentName: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: PARCHMENT.ink,
    flex: 1,
  },
  equipmentSummary: {
    fontFamily: fonts.bodyItalic,
    fontSize: 12,
    color: PARCHMENT.inkSecondary,
    fontStyle: 'italic',
    marginLeft: spacing.sm,
  },

  // ── Spells ────────────────────────────────────────────────────────────────
  slotTrackerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.md,
    justifyContent: 'center',
  },
  slotGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  slotLevel: {
    fontFamily: fonts.heading,
    fontSize: 9,
    color: PARCHMENT.gold,
    letterSpacing: 1,
  },
  slotDots: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: PARCHMENT.gold,
    letterSpacing: 2,
  },
  slotCount: {
    fontFamily: fonts.body,
    fontSize: 9,
    color: PARCHMENT.inkSecondary,
  },
  spellGroup: {
    marginBottom: spacing.md,
  },
  spellGroupLabel: {
    fontFamily: fonts.heading,
    fontSize: 9,
    letterSpacing: 2,
    color: PARCHMENT.gold,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  spellChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  spellChipWrapper: {
    marginBottom: spacing.xs,
  },
  spellChip: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PARCHMENT.divider,
    backgroundColor: 'rgba(139, 105, 20, 0.08)',
  },
  spellChipExpanded: {
    backgroundColor: 'rgba(139, 105, 20, 0.15)',
    borderColor: PARCHMENT.gold,
  },
  spellChipText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: PARCHMENT.ink,
  },
  spellChipTextExpanded: {
    fontFamily: fonts.bodyBold,
    color: PARCHMENT.gold,
  },
  spellDetails: {
    marginTop: spacing.xs,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
    backgroundColor: 'rgba(139, 105, 20, 0.06)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: PARCHMENT.divider,
  },
  spellDetailRow: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: PARCHMENT.inkSecondary,
    lineHeight: 18,
  },
  spellDetailLabel: {
    fontFamily: fonts.bodyBold,
    color: PARCHMENT.ink,
  },
  componentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 2,
  },
  componentPill: {
    borderWidth: 1,
    borderColor: PARCHMENT.divider,
    borderRadius: 3,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  componentPillText: {
    fontFamily: fonts.headingRegular,
    fontSize: 9,
    color: PARCHMENT.inkSecondary,
    letterSpacing: 0.3,
  },
  spellDescription: {
    fontFamily: fonts.bodyItalic,
    fontSize: 11,
    color: PARCHMENT.ink,
    lineHeight: 18,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },

  // ── Class Features ────────────────────────────────────────────────────────
  featureItem: {
    marginBottom: spacing.md,
  },
  featureName: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: PARCHMENT.ink,
    marginBottom: 2,
  },
  featureDescription: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: PARCHMENT.inkSecondary,
    lineHeight: 20,
  },

  // ── Empty states ──────────────────────────────────────────────────────────
  emptyText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: PARCHMENT.inkSecondary,
    textAlign: 'center',
    paddingVertical: spacing.sm,
  },
  emptyTextItalic: {
    fontFamily: fonts.bodyItalic,
    fontSize: 13,
    color: PARCHMENT.inkSecondary,
    textAlign: 'center',
    paddingVertical: spacing.sm,
    fontStyle: 'italic',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    fontFamily: fonts.narrativeItalic,
    fontSize: 16,
    color: colors.text.tertiary,
    fontStyle: 'italic',
  },
});
