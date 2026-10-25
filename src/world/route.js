// Куда идти до ближайшего мужского туалета (М-2): поиск по графу карт, возвращает первый шаг — выход на
// текущей карте. Стрелка-подсказка рисуется сценой мира.
import { MAPS, STAIRWELLS } from './maps/index.js';

// { exit, map } — выход на текущей карте и карта, куда он ведёт; null, если уже в туалете или пути нет.
export function nextToiletStep(from) {
  if (MAPS[from] && MAPS[from].toilet) return null;
  const prev = new Map([[from, null]]);
  const q = [from];
  while (q.length) {
    const cur = q.shift();
    const m = MAPS[cur];
    if (m.toilet) {
      let c = cur;
      while (prev.get(c) && prev.get(c).from !== from) c = prev.get(c).from;
      return prev.get(c);
    }
    for (const e of m.exits || []) {
      if (e.deny || e.locked) continue;
      const targets = e.to ? [e.to] : e.stairs && STAIRWELLS[m.building] ? Object.values(STAIRWELLS[m.building]) : [];
      for (const t of targets) {
        if (t === cur || prev.has(t) || !MAPS[t] || MAPS[t].id === 'test_room' || MAPS[t].classRoom) continue;
        prev.set(t, { from: cur, exit: e, map: t });
        q.push(t);
      }
    }
  }
  return null;
}
