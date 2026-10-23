// Учебный кабинет (раздел 11): 3 ряда по 5 парт, рассадка. Один шаблон для всех кабинетов.
// Денис (справа) и Игорь (слева) всегда на последней парте среднего ряда.
import { TILE } from '../gen/tiles.js';
import { makeUnnamed } from '../gen/people.js';
import { eventRng } from '../game/day.js';

export const DESK_COLS = [8, 14, 20]; // левый тайл парты в каждом ряду
export const DESK_ROWS = [4, 6, 8, 10, 12]; // 0 — первая парта
export const TEACHER_TILE = { x: 14, y: 2 };

export function seatTile(c, d, side) {
  return { x: DESK_COLS[c] + side, y: DESK_ROWS[d] + 1 };
}

export function tileToFeet(t) {
  return { x: (t.x + 0.5) * TILE + (t.half ? TILE / 2 : 0), y: (t.y + 1) * TILE - 2 };
}

const FIXED = {
  matych: [0, 3, 0],
  buy: [2, 2, 1],
  guza: [2, 4, 0],
};

// Рассадка урока n: { seats: [{ id, c, d, side }], roma: { c, d, side } | null }.
export function buildRoster(state, n, opts = {}) {
  const denisHere = opts.denis !== false;
  const taken = new Map();
  const put = (id, c, d, side) => taken.set(`${c}:${d}:${side}`, { id, c, d, side });
  let roma = null;
  const seat = state.seat;
  if (seat === 'igor') roma = [1, 4, 1];
  else if (seat === 'front') roma = [1, 0, 0];
  else if (seat === 'steal_ok') roma = [1, 4, 0];
  else if (seat === 'steal_fail') {
    const r = eventRng(state, 'failseat' + n);
    roma = [r.int(0, 2), r.int(0, 1), r.int(0, 1)];
  }
  // Игорь и Денис
  if (seat === 'steal_ok') put('igor', 0, 4, 1); // дуется за соседней партой
  else put('igor', 1, 4, 0);
  if (denisHere && seat !== 'igor') put('denis', 1, 4, 1);
  for (const [id, [c, d, side]] of Object.entries(FIXED)) put(id, c, d, side);
  if (roma) {
    const key = `${roma[0]}:${roma[1]}:${roma[2]}`;
    const prev = taken.get(key);
    taken.delete(key);
    if (prev && prev.id !== 'igor' && prev.id !== 'denis') {
      // освободить место: пересадить на ближайшее свободное
      for (let d = 0; d < 5 && prev; d++) for (let c = 0; c < 3; c++) for (let s = 0; s < 2; s++) {
        const k = `${c}:${d}:${s}`;
        if (!taken.has(k) && k !== key && prev) { taken.set(k, { ...prev, c, d, side: s }); d = 9; c = 9; break; }
      }
    }
  }
  // безымянные одноклассники
  const rng = eventRng(state, 'class' + n);
  let k = 0;
  for (let d = 0; d < 5; d++) for (let c = 0; c < 3; c++) for (let s = 0; s < 2; s++) {
    const key = `${c}:${d}:${s}`;
    if (taken.has(key)) continue;
    if (roma && key === `${roma[0]}:${roma[1]}:${roma[2]}`) continue;
    if (state.seat === 'steal_fail' && roma && c === roma[0] && d === roma[1]) { if (rng.chance(0.5)) continue; }
    if (rng.chance(0.6)) {
      const id = makeUnnamed(rng, 'cls', `cls_${n}_${k++}`);
      taken.set(key, { id, c, d, side: s });
    }
  }
  return {
    seats: [...taken.values()],
    roma: roma ? { c: roma[0], d: roma[1], side: roma[2] } : null,
  };
}
