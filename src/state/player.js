import { currencies, runes, upgrades } from '../content/catalog.js';
import { amount } from '../shared/numbers.js';
import { copiesForLevel } from '../progression/runes.js';
export const SAVE_VERSION = 4;
export function newPlayer() {
  return { version: SAVE_VERSION, balances: Object.fromEntries(currencies.map(c => [c.id, 0])), runes: Object.fromEntries(runes.map(r => [r.id, 0])), upgrades: Object.fromEntries(upgrades.map(u => [u.id, 0])), runeXP: Object.fromEntries(runes.map(r => [r.id, 0])), runeCounts: Object.fromEntries(runes.map(r => [r.id, 0])), untrackedRolls: 0, prestige: 0, garden: false, rolls: 0, savedAt: Date.now() };
}
export function migrate(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw Error('Invalid save');
  if (raw.version > SAVE_VERSION) throw Error('Save was made by a newer version');
  // v2 adds bulk/luck/speed upgrades. Existing stable IDs retain their levels.
  const next = newPlayer();
  for (const c of currencies) next.balances[c.id] = amount(raw.balances?.[c.id]);
  for (const [key, entries] of [['runes', runes], ['upgrades', upgrades]]) {
    for (const item of entries) next[key][item.id] = Math.floor(Math.min(item.cap, amount(raw[key]?.[item.id])));
  }
  // Preserve legacy levels without guessing how many historical duplicates were earned.
  for (const rune of runes) {
    const xp = Math.max(copiesForLevel(next.runes[rune.id]), raw.version >= 4 ? Math.floor(amount(raw.runeXP?.[rune.id])) : 0);
    next.runeXP[rune.id] = Math.min(copiesForLevel(rune.cap), xp);
    next.runes[rune.id] = Math.min(rune.cap, Math.floor((Math.sqrt(8 * next.runeXP[rune.id] + 1) - 1) / 2));
  }
  next.prestige = Math.floor(Math.min(10000, amount(raw.prestige)));
  next.rolls = Math.floor(amount(raw.rolls));
  // v3 tracks opening quantities independently of capped rune levels.
  // Historical per-rune counts were not stored, so keep earlier rolls untracked.
  for (const rune of runes) next.runeCounts[rune.id] = Math.floor(amount(raw.runeCounts?.[rune.id]));
  next.untrackedRolls = raw.version >= 3 ? Math.floor(amount(raw.untrackedRolls)) : next.rolls;
  next.garden = raw.garden === true || next.prestige >= 2;
  next.savedAt = Number.isFinite(raw.savedAt) ? raw.savedAt : Date.now();
  return next;
}
