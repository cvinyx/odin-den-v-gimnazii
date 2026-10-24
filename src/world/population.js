// Кто находится на карте: статичные NPC карты, именные по таблице перемен (раздел 11), завуч-патруль,
// учителя-камео и безымянные для живости.
import { makeUnnamed } from '../gen/people.js';
import { eventRng, breakNumber } from '../game/day.js';
import { labelsOf } from '../game/dialogs.js';
import { namedAt, cameosAt } from './schedule.js';

export function populate(def, state, solidAt) {
  const out = [...(def.npcs || [])];
  const spots = def.spots || {};
  const b = breakNumber(state);
  if (b) {
    // именные (завуч — отдельно, патрулём)
    const named = namedAt(b, def.id).filter((id) => id !== 'olga');
    const places = spots.named || spots.crowd || [[2, 2]];
    named.forEach((id, i) => {
      const p = places[i % places.length];
      const off = Math.floor(i / places.length);
      out.push({ id, x: p[0] + off, y: p[1], dir: i % 2 ? 'left' : 'right', talk: { file: 'break' + b, label: id }, named: true });
    });
    if (namedAt(b, def.id).includes('olga')) {
      const route = spots.patrol || spots.crowd || [];
      const p = route[0] || [2, 2];
      out.push({ id: 'olga', x: p[0], y: p[1], dir: 'down', route, wait: 1.2, speed: 34, talk: { file: 'staff', label: 'olga' }, patrol: true });
    }
    // учителя-камео
    const free = (spots.crowd || []).slice().reverse();
    cameosAt(state, b, def.id).forEach((id, i) => {
      const p = free[i % Math.max(1, free.length)] || [3, 3];
      out.push({ id, x: p[0], y: p[1], dir: 'down', talk: { file: 'staff', label: id }, cameo: true });
    });
  }
  // безымянные
  let count = 0;
  if (state.phase === 'break') count = Math.max(0, (spots.crowd || []).length - 1);
  else if (state.phase === 'late') count = Math.min(1, (spots.crowd || []).length);
  const taken = new Set(out.map((n) => n.x + ':' + n.y));
  const rng = eventRng(state, 'crowd:' + def.id + ':' + (b || state.phase));
  const crowdLabels = labelsOf('crowd').filter((l) => /^c\d+$/.test(l));
  for (let i = 0; i < count; i++) {
    const p = spots.crowd[i];
    if (taken.has(p[0] + ':' + p[1])) continue;
    const id = makeUnnamed(rng, 'crowd', `crowd_${def.id}_${b || 0}_${i}`);
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
