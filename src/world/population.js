// Кто находится на карте: статичные NPC карты, именные по таблице перемен (раздел 11), безымянные для живости.
import { NPC_SCHEDULE } from '../../data/npc_schedule.js';
import { makeUnnamed } from '../gen/people.js';
import { eventRng, breakNumber } from '../game/day.js';
import { labelsOf } from '../game/dialogs.js';

export function namedForMap(state, mapId) {
  const b = breakNumber(state);
  if (!b) return [];
  return Object.keys(NPC_SCHEDULE).filter((id) => NPC_SCHEDULE[id][b] === mapId);
}

// Возвращает массив описаний NPC: { id, x, y, dir, route, talk, wait, speed }.
export function populate(def, state, solidAt) {
  const out = [...(def.npcs || [])];
  const spots = def.spots || {};
  const b = breakNumber(state);
  // именные
  const named = namedForMap(state, def.id);
  const places = spots.named || spots.crowd || [];
  named.forEach((id, i) => {
    const p = places[i % places.length] || [2, 2];
    const off = Math.floor(i / Math.max(1, places.length));
    out.push({ id, x: p[0] + off, y: p[1], dir: i % 2 ? 'left' : 'right', talk: { file: 'break' + b, label: id }, named: true });
  });
  // безымянные
  let count = 0;
  if (state.phase === 'break') count = (spots.crowd || []).length;
  else if (state.phase === 'late') count = Math.min(1, (spots.crowd || []).length);
  const rng = eventRng(state, 'crowd:' + def.id + ':' + (b || state.phase));
  const crowdLabels = labelsOf('crowd');
  for (let i = 0; i < count; i++) {
    const p = spots.crowd[i];
    const id = makeUnnamed(rng, 'crowd', `crowd_${def.id}_${b || 0}_${i}`);
    // короткий маршрут влево-вправо по свободным клеткам
    const route = [[p[0], p[1]]];
    const dx = rng.pick([-3, -2, 2, 3]);
    let ok = true;
    for (let k = 1; k <= Math.abs(dx); k++) if (solidAt(p[0] + Math.sign(dx) * k, p[1])) ok = false;
    if (ok) route.push([p[0] + dx, p[1]]);
    out.push({
      id, x: p[0], y: p[1], dir: 'down', route: route.length > 1 ? route : [], wait: rng.float(1.5, 4), speed: rng.int(18, 30),
      talk: { file: 'crowd', label: rng.pick(crowdLabels) },
    });
  }
  return out;
}
