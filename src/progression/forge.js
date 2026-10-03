import { pool } from '../content/catalog.js';
import { stat } from './effects.js';
import { roll } from './economy.js';
// Continuous, time-based rolling. No E interaction or post-roll cooldown.
export class ForgeCollector {
  constructor() { this.progress = 0; this.active = false; }
  reset() { this.progress = 0; this.active = false; }
  update(state, seconds, standing, random = Math.random) {
    if (!standing) { this.reset(); return []; }
    if (!this.active) { this.progress = 1; this.active = true; }
    this.progress += seconds * pool.rollsPerSecond * stat(state, 'runeSpeed');
    const count = Math.floor(this.progress);
    this.progress -= count;
    const results = [];
    for (let i = 0; i < count; i++) {
      const result = roll(state, random);
      if (!result) { this.progress = 0; break; }
      results.push(result);
    }
    return results;
  }
}
