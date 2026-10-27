// Кто находится на карте: статичные NPC карты, именные по таблице перемен (раздел 11), завуч-патруль,
// учителя-камео и безымянные для живости.
import { makeUnnamed } from '../gen/people.js';
import { eventRng, breakNumber } from '../game/day.js';
import { labelsOf } from '../game/dialogs.js';
import { namedAt, cameosAt } from './schedule.js';
import { basketballOn } from '../../data/npc_schedule.js';
import { BALANCE } from '../../data/balance.js';

export function populate(def, state, solidAt) {
  const out = [...(def.npcs || [])];
  const spots = def.spots || {};
  const b = breakNumber(state);
  if (b) {
    // баскетбол (М-3): спортзал, один бросок на кольцо справа; Иван Владимирович и Василий молча смотрят
    const hoops = def.id === 'gym' && basketballOn(state.seed, state.day, b);
    // именные (завуч — отдельно, патрулём)
    const named = namedAt(state, b, def.id).filter((id) => id !== 'olga' && !(hoops && ['levonchuk', 'bochko', 'matych'].includes(id)));
    if (hoops) {
      const sp = [[22, 8, 'right'], [24, 10, 'right'], [21, 11, 'right']];
      ['levonchuk', 'bochko', 'matych'].forEach((id, i) => out.push({ id, x: sp[i][0], y: sp[i][1], dir: 'right', route: [[sp[i][0], sp[i][1]], [sp[i][0] + 2, sp[i][1] + (i % 2 ? -1 : 1)]], wait: 1.2, speed: 30, talk: { file: 'basketball', label: id }, named: true, bb: true }));
      const rb = eventRng(state, `bb:${state.day}:${b}`);
      for (let k = 0; k < rb.int(1, 2); k++) out.push({ id: makeUnnamed(rb, 'hoop', `hoop_${state.day}_${b}_${k}`), x: 19 + k * 2, y: 9 + k, dir: 'right', route: [[19 + k * 2, 9 + k], [22, 6 + k * 5]], wait: 1.5, speed: 28, talk: { file: 'basketball', label: 'player' }, bb: true });
      out.push({ id: 'ivan', x: 14, y: 15, dir: 'right', talk: { file: 'basketball', label: 'watcher' } });
      out.push({ id: 'vasily', x: 16, y: 15, dir: 'right', talk: { file: 'basketball', label: 'watcher' } });
    }
    const places = spots.named || spots.crowd || [[2, 2]];
    named.forEach((id, i) => {
      const p = places[i % places.length];
      const off = Math.floor(i / places.length);
      out.push({ id, x: p[0] + off, y: p[1], dir: i % 2 ? 'left' : 'right', talk: { file: 'break' + b, label: id }, named: true });
    });
    if (namedAt(state, b, def.id).includes('olga')) {
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
  // пятиклассник в кабинке мужского туалета (Л-10)
  if (b && def.toilet && def.spots && def.spots.kid) {
    const rk = eventRng(state, `kid5:${def.id}:${state.day}:${b}`);
    if (rk.chance(BALANCE.kid5.chance) || state.flags.forceKid5) {
      const p = def.spots.kid[0];
      out.push({ id: makeUnnamed(rk, 'kid5', `kid5_${state.day}_${b}`, { kids: true }), x: p[0], y: p[1], dir: 'down', talk: { file: 'kid5', label: 'kid' }, kid5: true });
    }
  }
  // безымянные
  // Л-13: столовая на большой перемене почти полностью занята; на других переменах там мало народу
  const crowd = def.id === 'canteen' && b !== 3 ? (spots.crowd || []).slice(-6) : (spots.crowd || []);
  let count = 0;
  if (state.phase === 'break') count = Math.min(44, Math.max(0, crowd.length - 1));
  else if (state.phase === 'late') count = Math.min(1, crowd.length);
  const taken = new Set(out.map((n) => n.x + ':' + n.y));
  const rng = eventRng(state, 'crowd:' + def.id + ':' + (b || state.phase));
  const crowdLabels = labelsOf('crowd').filter((l) => /^c\d+$/.test(l));
  for (let i = 0; i < count; i++) {
    const p = crowd[i];
    if (taken.has(p[0] + ':' + p[1])) continue;
    // первые этажи корпусов 2 и 3 — младшие классы (Л-16)
    const id = makeUnnamed(rng, def.kids ? 'kid' : 'crowd', `crowd_${def.id}_${b || 0}_${i}`, def.kids ? { kids: true } : {});
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
  // актовый зал (Л-20): на сцене всегда кто-то выступает
  if (def.performer) {
    const p = def.performer;
    out.push({ id: makeUnnamed(eventRng(state, 'performer:' + (b || state.phase)), 'stage', 'stage_performer'), x: p.x, y: p.y, dir: 'down', route: [] });
  }
  return out;
}
