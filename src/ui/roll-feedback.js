// Aggregate a short window of rolls rather than replacing text for every opening.
export function summarizeRolls(results) {
  const groups = new Map();
  for (const result of results) {
    const item = groups.get(result.rune.id) || { name: result.rune.name, count: 0, level: 0, fresh: false, rare: result.rune.luckAffinity >= .8 };
    item.count++;
    if (result.leveledUp) item.level = Math.max(item.level, result.levelAfter);
    item.fresh ||= result.isNew;
    groups.set(result.rune.id, item);
  }
  return [...groups.values()].map(g => `${g.rare?'RARE · ':''}${g.name} ×${g.count}${g.fresh?' · NEW':''}${g.level?' · level '+g.level:''}`).join('  /  ');
}
