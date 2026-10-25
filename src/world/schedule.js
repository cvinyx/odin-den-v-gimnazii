// Кто где на перемене (раздел 11): именные по таблице, завуч-патруль и учителя-камео по сиду.
// Чистые функции — их проверяют тесты.
import { placesFor } from '../../data/npc_schedule.js';
import { CAMEO_TEACHERS } from '../../data/teachers.js';
import { eventRng } from '../game/day.js';

// первые этажи корпусов 2 и 3 — тоже: там младшие классы и иногда учителя (Л-16)
export const CAMEO_MAPS = ['c1_f1', 'c1_f2', 'c2_f1', 'c3_f1', 'c2_f4', 'c3_f4', 'canteen', 'library'];

// Именные NPC на карте на перемене breakN этого дня недели (V2-5: по коду недели и дню).
export function namedAt(state, breakN, mapId) {
  const p = placesFor(state.seed, state.day, breakN);
  return Object.keys(p).filter((id) => p[id] === mapId);
}

// Учителя-камео на перемене: 1–2 штуки, каждый в своём месте. Детерминировано кодом дня.
export function cameosFor(state, breakN) {
  const rng = eventRng(state, 'cameo' + breakN);
  const n = rng.int(1, 2);
  const teachers = rng.shuffle([...CAMEO_TEACHERS]).slice(0, n);
  const maps = rng.shuffle([...CAMEO_MAPS]);
  return teachers.map((id, i) => ({ id, map: maps[i] }));
}

export function cameosAt(state, breakN, mapId) {
  return cameosFor(state, breakN).filter((c) => c.map === mapId).map((c) => c.id);
}
