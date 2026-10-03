// Level N requires N additional copies. Lifetime opening counts remain separate.
export const copiesForLevel = level => level * (level + 1) / 2;
export function runeProgress(state, rune) {
  const level = state.runes[rune.id];
  const xp = Math.max(copiesForLevel(level), state.runeXP[rune.id] || 0);
  return { level, xp, capped: level >= rune.cap,
    collected: xp - copiesForLevel(level), needed: level + 1 };
}
export function awardRune(state, rune) {
  const progress = runeProgress(state, rune);
  const xp = Math.min(copiesForLevel(rune.cap), progress.xp + 1);
  state.runeXP[rune.id] = xp;
  const level = Math.min(rune.cap, Math.floor((Math.sqrt(8 * xp + 1) - 1) / 2));
  state.runes[rune.id] = level;
  return { capped: progress.capped, levelBefore: progress.level, levelAfter: level,
    leveledUp: level > progress.level, isNew: progress.level === 0 };
}
