# Tech Debt — QuestForge

## Feature-Staged Components (Do Not Delete)

| File | Purpose | Blocked On |
|------|---------|------------|
| `src/components/game/DiceOverlay.tsx` | 3D dice roll animation overlay | Combat UI integration |
| `src/components/game/D20Mesh.tsx` | Three.js D20 mesh + tumble animation | DiceOverlay dependency |
| `src/components/game/AbilityCard.tsx` | Combat ability card display | Combat mode UI |

These components are built and ready but not yet wired into the game session screen.
They will be integrated during the Combat UI phase.
