import { runes, upgrades } from '../content/catalog.js';
// Order: (base 1 + all additive contributions) × all multiplicative effects.
// Multiplicative rune effects compound once per owned level.
export function stat(state, name) {
  let additions = 0, multiplier = 1;
  for (const [entries, owned] of [[runes, state.runes], [upgrades, state.upgrades]]) {
    for (const item of entries) for (const effect of item.effects) {
      if (effect.stat !== name) continue;
      const level = owned[item.id] || 0;
      if (effect.operation === 'add') additions += effect.value * level;
      else multiplier *= effect.value ** level;
    }
  }
  return (1 + additions) * multiplier * (name.endsWith('Gain') ? 1 + state.prestige * .25 : 1);
}
