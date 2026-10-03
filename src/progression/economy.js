import { currencies, upgrades, runes, pool } from '../content/catalog.js';
import { amount } from '../shared/numbers.js';
import { stat } from './effects.js';
export function earn(state, id, value) {
  if (!(id in state.balances) || !Number.isFinite(value) || value < 0) return false;
  state.balances[id] = amount(state.balances[id] + value); return true;
}
export function spend(state, id, cost) {
  if (!(id in state.balances) || !Number.isFinite(cost) || cost < 0 || state.balances[id] < cost) return false;
  state.balances[id] -= cost; return true;
}
export function rate(state, id) { return currencies.find(c => c.id === id).baseRate * stat(state, id + 'Gain'); }
export function tick(state, seconds, context = {}) {
  if (!Number.isFinite(seconds) || seconds <= 0) return;
  earn(state, 'coins', rate(state, 'coins') * seconds);
  if (context.onPad || state.upgrades.autoEnergy) earn(state, 'energy', rate(state, 'energy') * seconds);
}
export function price(state, upgrade) { return Math.ceil(upgrade.cost * upgrade.growth ** state.upgrades[upgrade.id]); }
export function buy(state, id) {
  const item = upgrades.find(u => u.id === id);
  if (!item || state.upgrades[id] >= item.cap || !spend(state, item.currency, price(state, item))) return false;
  state.upgrades[id]++; return true;
}
export function buyMax(state, id) {
  let purchased = 0;
  while (buy(state, id)) purchased++;
  return purchased;
}
export function unlockGarden(state) {
  if (state.garden || !spend(state, 'coins', 100)) return false;
  state.garden = true; return true;
}
// Luck reshapes weights toward rarer runes. This is our own rule, not NI's formula.
export function probabilities(state) {
  const luck = Math.max(1, stat(state, 'runeLuck'));
  const weights = runes.map(r => r.weight ** (1 / luck));
  const total = weights.reduce((a, b) => a + b, 0);
  return weights.map(w => w / total);
}
export function roll(state, random = Math.random) {
  if (!spend(state, pool.currency, pool.cost)) return null;
  const sample = Math.max(0, Math.min(1 - Number.EPSILON, random()));
  const chances = probabilities(state);
  let cumulative = 0;
  const index = chances.findIndex(p => { cumulative += p; return sample < cumulative; });
  const rune = runes[index < 0 ? runes.length - 1 : index];
  const capped = state.runes[rune.id] >= rune.cap;
  state.runes[rune.id] = Math.min(rune.cap, state.runes[rune.id] + 1);
  state.runeCounts[rune.id] = amount(state.runeCounts[rune.id] + 1);
  state.rolls++; return { rune, capped };
}
export function reforge(state) {
  if (state.balances.coins < 1000 || state.balances.crystals < 25) return false;
  for (const id in state.balances) state.balances[id] = 0;
  for (const id in state.upgrades) state.upgrades[id] = 0;
  state.garden = false; state.prestige++; return true;
}
