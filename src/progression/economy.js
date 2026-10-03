import { currencies, upgrades, runes, pool, runeRules } from '../content/catalog.js';
import { amount } from '../shared/numbers.js';
import { stat } from './effects.js';
import { awardRune } from './runes.js';
import { hasEnergyAutomation, canReforge } from './reforge.js';
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
  if (context.onPad || hasEnergyAutomation(state)) earn(state, 'energy', rate(state, 'energy') * seconds);
}
export function price(state, upgrade) { return Math.ceil(upgrade.cost * upgrade.growth ** state.upgrades[upgrade.id]); }
export function buy(state, id) {
  const item = upgrades.find(u => u.id === id);
  if (!item || (id === 'autoEnergy' && hasEnergyAutomation(state)) || state.upgrades[id] >= item.cap || !spend(state, item.currency, price(state, item))) return false;
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
// Bounded rarity bonuses preserve the pool's identity even at very high Luck.
export function probabilities(state) {
  const luck = Math.max(1, stat(state, 'runeLuck'));
  const strength = (luck - 1) / (luck - 1 + runeRules.luckDiminishing);
  const weights = runes.map(r => r.weight * (1 + runeRules.luckBonusLimit * strength * r.luckAffinity));
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
  const progress = awardRune(state, rune);
  state.runeCounts[rune.id] = amount(state.runeCounts[rune.id] + 1);
  state.rolls++; return { rune, ...progress };
}
export function reforge(state) {
  if (!canReforge(state)) return false;
  for (const id in state.balances) state.balances[id] = 0;
  for (const id in state.upgrades) state.upgrades[id] = 0;
  state.prestige++; state.garden = state.prestige >= 2; return true;
}
