import { hasEnergyAutomation, reforgeCost, nextMilestone } from './reforge.js';
// Suggestions, never gates. Players can do these steps in another order.
export function nextGoal(state) {
  if (!state.prestige) {
    if (!state.upgrades.income) return 'Buy Coin engine level 1 in Upgrades → Coins (15 coins).';
    if (!state.rolls) return 'Charge 20 Energy on the mint pad, then step onto the violet forge.';
    if (state.upgrades.pad < 3) return 'Build Energy condenser to level 3 in Upgrades → Energy.';
    if (!hasEnergyAutomation(state)) return 'Save 300 Energy on the pad for Energy automaton. It works everywhere.';
    if (!state.garden) return 'Save 100 coins, then press E at the garden gate.';
    if (state.upgrades.income < 5) return 'Build Coin engine to level 5 to prepare for your first Reforge.';
  }
  const cost = reforgeCost(state);
  if (!state.garden) return 'Open the garden at the gate for 100 coins, then gather crystals.';
  if (state.balances.crystals < cost.crystals) return `Gather crystals in the garden: ${Math.floor(state.balances.crystals)} / ${cost.crystals}.`;
  const reward = nextMilestone(state)?.name || '+25% resource gains';
  if (state.balances.coins < cost.coins) return `Save ${cost.coins.toLocaleString('en-US')} coins for Reforge ${state.prestige + 1}: ${reward}.`;
  return `Reforge ${state.prestige + 1} is ready! Open Reforge to gain ${reward.toLowerCase()}.`;
}
