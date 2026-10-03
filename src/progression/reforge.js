import { reforgeRules, milestones } from '../content/catalog.js';
import { amount } from '../shared/numbers.js';
export const hasEnergyAutomation = state => state.prestige >= 1 || state.upgrades.autoEnergy > 0;
export function reforgeCost(state) {
  return { coins: amount(reforgeRules.coins * reforgeRules.coinGrowth ** Math.min(300, state.prestige)),
    crystals: reforgeRules.crystals * (state.prestige + 1) };
}
export function canReforge(state) {
  return Object.entries(reforgeCost(state)).every(([id, cost]) => state.balances[id] >= cost);
}
export const nextMilestone = state => milestones.find(m => m.at > state.prestige);
