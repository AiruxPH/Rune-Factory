// Original prototype balance. All content uses stable IDs, independent of labels.
export const currencies = [
  { id: 'coins', name: 'Coins', color: '#f1c75b', baseRate: 1, method: 'passive' },
  { id: 'energy', name: 'Energy', color: '#70dfbf', baseRate: 3, method: 'pad' },
  { id: 'crystals', name: 'Crystals', color: '#b6a0ff', baseRate: 1, method: 'gather' },
];
export const runes = [
  { id: 'spark', luckAffinity: 0, name: 'Spark', weight: 45, cap: 30, color: '#70dfbf', effects: [{ stat: 'coinsGain', operation: 'add', value: .1 }] },
  { id: 'current', luckAffinity: 0.1, name: 'Current', weight: 28, cap: 25, color: '#77bfff', effects: [{ stat: 'energyGain', operation: 'add', value: .12 }] },
  { id: 'bloom', luckAffinity: 0.25, name: 'Bloom', weight: 15, cap: 20, color: '#c2e481', effects: [{ stat: 'crystalsGain', operation: 'add', value: .15 }] },
  { id: 'haste', luckAffinity: 0.5, name: 'Haste', weight: 8, cap: 15, color: '#f1c75b', effects: [{ stat: 'runeSpeed', operation: 'add', value: .08 }] },
  { id: 'fortune', luckAffinity: 0.8, name: 'Fortune', weight: 3, cap: 10, color: '#f5a4d0', effects: [{ stat: 'runeLuck', operation: 'add', value: .1 }] },
  { id: 'nexus', luckAffinity: 1, name: 'Nexus', weight: 1, cap: 5, color: '#b6a0ff', effects: ['coinsGain','energyGain','crystalsGain'].map(stat => ({ stat, operation: 'multiply', value: 1.15 })) },
];
export const upgrades = [
  { id: 'income', name: 'Coin engine', description: '+50% coin income per level', currency: 'coins', cost: 15, growth: 1.6, cap: 20, effects: [{ stat: 'coinsGain', operation: 'add', value: .5 }] },
  { id: 'forge', name: 'Forge accelerator', description: '+20% Rune Speed per level', currency: 'coins', cost: 40, growth: 1.8, cap: 20, effects: [{ stat: 'runeSpeed', operation: 'add', value: .2 }] },
  { id: 'coinBulk', name: 'Coin-powered batches', description: '+1 Rune Bulk per level', currency: 'coins', cost: 100, growth: 1.8, cap: 15, effects: [{ stat: 'runeBulk', operation: 'add', value: 1 }] },
  { id: 'pad', name: 'Energy condenser', description: '+50% energy income per level', currency: 'energy', cost: 25, growth: 1.65, cap: 20, effects: [{ stat: 'energyGain', operation: 'add', value: .5 }] },
  { id: 'autoEnergy', name: 'Energy automaton', description: 'Collect energy everywhere', currency: 'energy', cost: 300, growth: 1, cap: 1, effects: [] },
  { id: 'energyBulk', name: 'Charged batches', description: '+1 Rune Bulk per level', currency: 'energy', cost: 60, growth: 1.8, cap: 20, effects: [{ stat: 'runeBulk', operation: 'add', value: 1 }] },
  { id: 'gather', name: 'Crystal lens', description: '+50% crystal yield per level', currency: 'crystals', cost: 5, growth: 1.6, cap: 15, effects: [{ stat: 'crystalsGain', operation: 'add', value: .5 }] },
  { id: 'crystalLuck', name: 'Fortune prism', description: '+10% Rune Luck per level', currency: 'crystals', cost: 8, growth: 1.7, cap: 20, effects: [{ stat: 'runeLuck', operation: 'add', value: .1 }] },
  { id: 'crystalSpeed', name: 'Prism accelerator', description: '+25% Rune Speed per level', currency: 'crystals', cost: 12, growth: 1.8, cap: 20, effects: [{ stat: 'runeSpeed', operation: 'add', value: .25 }] },
];
export const runeRules = { minimumInterval: .05, luckBonusLimit: 3, luckDiminishing: 4 };
export const reforgeRules = { coins: 1000, crystals: 25, coinGrowth: 2 };
export const milestones = [
  { at: 1, name: 'Permanent Energy automation', effects: [] },
  { at: 2, name: 'Garden stays unlocked', effects: [] },
  { at: 3, name: '+1 permanent Rune Bulk', effects: [{ stat: 'runeBulk', operation: 'add', value: 1 }] },
];
export const pool = { id: 'starter', name: 'Starter forge', currency: 'energy', cost: 20, rollsPerSecond: 8 };
export function validateContent() {
  for (const entries of [currencies, runes, upgrades]) {
    if (new Set(entries.map(x => x.id)).size !== entries.length) throw Error('Duplicate content IDs');
  }
  const stats = new Set([...currencies.map(c => c.id + 'Gain'), 'runeSpeed', 'runeLuck', 'runeBulk']);
  for (const item of [...runes, ...upgrades]) {
    if (!Number.isInteger(item.cap) || item.cap < 1) throw Error('Invalid level cap');
    for (const effect of item.effects) {
      if (!stats.has(effect.stat) || !['add','multiply'].includes(effect.operation) || !Number.isFinite(effect.value) || effect.value < 0) throw Error('Invalid effect');
    }
  }
  for (const milestone of milestones) {
    if (!Number.isInteger(milestone.at) || milestone.at < 1) throw Error('Invalid milestone');
    for (const effect of milestone.effects) if (!stats.has(effect.stat) || !['add', 'multiply'].includes(effect.operation) || !Number.isFinite(effect.value)) throw Error('Invalid milestone effect');
  }
  for (const rune of runes) if (!(rune.weight > 0) || !Number.isFinite(rune.luckAffinity) || rune.luckAffinity < 0 || rune.luckAffinity > 1) throw Error('Invalid rune weight');
  for (const item of [...upgrades, pool]) if (!currencies.some(c => c.id === item.currency) || !(item.cost > 0)) throw Error('Invalid currency or price');
}
