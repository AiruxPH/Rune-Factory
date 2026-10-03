import { currencies, runes, upgrades } from '../content/catalog.js';
import { MAX_AMOUNT, amount } from '../shared/numbers.js';
import { copiesForLevel } from './runes.js';
import { reforgeCost } from './reforge.js';

export function numberInput(value, max = MAX_AMOUNT, integer = false) {
  if (typeof value === 'string' && !value.trim()) throw Error('Enter a number.');
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0 || n > max || (integer && !Number.isInteger(n)))
    throw Error(`Enter ${integer ? 'a whole number' : 'a number'} from 0 to ${max}.`);
  return n;
}
export function editCurrency(state, id, value, mode) {
  if (!currencies.some(c => c.id === id) || !['add','set'].includes(mode)) throw Error('Choose a currency and action.');
  const n = numberInput(value);
  state.balances[id] = mode === 'add' ? amount(state.balances[id] + n) : n;
}
export function setLevel(state, kind, id, value) {
  const item = (kind === 'runes' ? runes : kind === 'upgrades' ? upgrades : []).find(x => x.id === id);
  if (!item) throw Error('Choose a rune or upgrade.');
  const level = numberInput(value, item.cap, true);
  state[kind][id] = level;
  if (kind === 'runes') state.runeXP[id] = copiesForLevel(level);
  // Editing levels does not invent openings or modify lifetime counts.
}
export function setReforges(state, value) {
  state.prestige = numberInput(value, 10000, true);
  state.garden = state.prestige >= 2;
}
export function prepareReforge(state) {
  for (const [id, cost] of Object.entries(reforgeCost(state))) state.balances[id] = Math.max(state.balances[id], cost);
}
export function resetSection(state, section) {
  if (!['balances','upgrades','runes'].includes(section)) throw Error('Unknown reset section.');
  for (const id in state[section]) state[section][id] = 0;
  if (section === 'runes') for (const id in state.runeXP) state.runeXP[id] = 0;
}
