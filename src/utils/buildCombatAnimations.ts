// Build combat animation steps from dice roll results and state changes.
// Converts raw game engine output into sequential visual feedback.

import type { DiceRollResult, StateChange, CombatAnimationStep } from '@/types/game';
import { COMBAT } from '@/constants/animations';

export function buildCombatAnimations(
  diceResults: DiceRollResult[],
  stateChanges: StateChange[] | undefined,
  playerName: string,
): CombatAnimationStep[] {
  const steps: CombatAnimationStep[] = [];

  // HP changes from state changes → damage/heal numbers + shake
  if (stateChanges) {
    for (const change of stateChanges) {
      if (change.type !== 'hp') continue;

      const delta = Number(change.value);
      if (delta === 0) continue;

      const isPlayerTarget = change.target === playerName;
      const isHeal = delta > 0;
      const isCritical = diceResults.some(
        (r) => r.isCritical && r.roller !== change.target,
      );

      // Damage number
      steps.push({
        type: 'damage',
        value: Math.abs(delta),
        damageType: isHeal ? 'heal' : isCritical ? 'critical' : 'damage',
        targetName: change.target,
      });

      // Screen shake when player takes damage
      if (isPlayerTarget && !isHeal) {
        steps.push({
          type: 'shake',
          intensity: Math.abs(delta) >= 10 || isCritical ? 'heavy' : 'light',
        });
      }

      steps.push({ type: 'pause', duration: COMBAT.ACTION_PAUSE });
    }
  }

  return steps;
}
