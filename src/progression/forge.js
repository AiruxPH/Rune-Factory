import { pool, runeRules } from '../content/catalog.js';
import { stat } from './effects.js';
import { roll } from './economy.js';
export function runeStats(state) {
  const speed = stat(state, 'runeSpeed');
  const rawInterval = 1 / (pool.rollsPerSecond * speed);
  const interval = Math.max(runeRules.minimumInterval, rawInterval);
  const conversion = interval / rawInterval;
  const baseBulk = stat(state, 'runeBulk');
  const bulk = baseBulk * conversion;
  return { interval, rawInterval, baseBulk, bulk, conversion, luck: stat(state, 'runeLuck'), rps: bulk / interval };
}
// Automatic batches with fractional bulk carry. Leaving or running out of funds
// discards unfinished work, so no unpaid backlog can burst on a later deposit.
export class ForgeCollector {
  constructor() { this.reset(); }
  reset() { this.progress = 0; this.carry = 0; this.active = false; }
  update(state, seconds, standing, random = Math.random) {
    if (!standing) { this.reset(); return []; }
    const stats = runeStats(state);
    if (!this.active) { this.progress = 1; this.active = true; }
    this.progress += seconds / stats.interval;
    const batches = Math.floor(this.progress + 1e-10);
    this.progress = Math.max(0, this.progress - batches);
    this.carry += batches * stats.bulk;
    const count = Math.floor(this.carry + 1e-10);
    this.carry = Math.max(0, this.carry - count);
    const results = [];
    for (let i = 0; i < count; i++) {
      const result = roll(state, random);
      if (!result) { this.progress = 0; this.carry = 0; break; }
      results.push(result);
    }
    return results;
  }
}
