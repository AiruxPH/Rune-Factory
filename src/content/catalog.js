// Original prototype balance. All content uses stable IDs, independent of labels.
export const currencies = [
  { id: 'coins', name: 'Coins', color: '#f1c75b', baseRate: 1, method: 'passive' },
  { id: 'energy', name: 'Energy', color: '#70dfbf', baseRate: 3, method: 'pad' },
  { id: 'crystals', name: 'Crystals', color: '#b6a0ff', baseRate: 1, method: 'gather' },
];
export const runes = [
  { id: 'spark', name: 'Spark', weight: 45, cap: 30, color: '#70dfbf', effects: [{ stat: 'coinsGain', operation: 'add', value: .1 }] },
  { id: 'current', name: 'Current', weight: 28, cap: 25, color: '#77bfff', effects: [{ stat: 'energyGain', operation: 'add', value: .12 }] },
  { id: 'bloom', name: 'Bloom', weight: 15, cap: 20, color: '#c2e481', effects: [{ stat: 'crystalsGain', operation: 'add', value: .15 }] },
  { id: 'haste', name: 'Haste', weight: 8, cap: 15, color: '#f1c75b', effects: [{ stat: 'runeSpeed', operation: 'add', value: .08 }] },
  { id: 'fortune', name: 'Fortune', weight: 3, cap: 10, color: '#f5a4d0', effects: [{ stat: 'runeLuck', operation: 'add', value: .1 }] },
  { id: 'nexus', name: 'Nexus', weight: 1, cap: 5, color: '#b6a0ff', effects: ['coinsGain','energyGain','crystalsGain'].map(stat => ({ stat, operation: 'multiply', value: 1.15 })) },
];
export const upgrades = [
  { id: 'income', name: 'Coin engine', description: '+50% base coin income per level', currency: 'coins', cost: 15, growth: 1.6, cap: 20, effects: [{ stat: 'coinsGain', operation: 'add', value: .5 }] },
  { id: 'pad', name: 'Energy condenser', description: '+50% base pad income per level', currency: 'coins', cost: 25, growth: 1.65, cap: 20, effects: [{ stat: 'energyGain', operation: 'add', value: .5 }] },
  { id: 'gather', name: 'Crystal lens', description: '+50% base crystal yield per level', currency: 'crystals', cost: 5, growth: 1.6, cap: 15, effects: [{ stat: 'crystalsGain', operation: 'add', value: .5 }] },
  { id: 'forge', name: 'Forge accelerator', description: '+20% automatic rolling rate per level', currency: 'coins', cost: 40, growth: 1.8, cap: 10, effects: [{ stat: 'runeSpeed', operation: 'add', value: .2 }] },
  { id: 'autoEnergy', name: 'Energy automaton', description: 'Collect pad income everywhere', currency: 'coins', cost: 300, growth: 1, cap: 1, effects: [] },
];
export const pool = { id: 'starter', name: 'Starter forge', currency: 'energy', cost: 20, rollsPerSecond: 8 };
export function validateContent() {
  for (const entries of [currencies, runes, upgrades]) {
    if (new Set(entries.map(x => x.id)).size !== entries.length) throw Error('Duplicate content IDs');
  }
  const stats = new Set([...currencies.map(c => c.id + 'Gain'), 'runeSpeed', 'runeLuck']);
  for (const item of [...runes, ...upgrades]) {
    if (!Number.isInteger(item.cap) || item.cap < 1) throw Error('Invalid level cap');
    for (const effect of item.effects) {
      if (!stats.has(effect.stat) || !['add','multiply'].includes(effect.operation) || !Number.isFinite(effect.value) || effect.value < 0) throw Error('Invalid effect');
    }
  }
  for (const rune of runes) if (!(rune.weight > 0)) throw Error('Invalid rune weight');
  for (const item of [...upgrades, pool]) if (!currencies.some(c => c.id === item.currency) || !(item.cost > 0)) throw Error('Invalid currency or price');
}
