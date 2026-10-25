// Где стоят именные NPC на переменах (Л-22, Л-23): для каждой перемены каждого дня недели. Расписание
// получается из расписаний их классов (data/schedule.js) и кода недели: большая перемена — столовая;
// перед физрой/плаванием — раздевалка; иначе — свой класс (открыт на переменах), коридор класса, туалет,
// рекреация, библиотека или «по пути» к следующему уроку в другом корпусе. Баскетбол (М-3): с шансом 25 %
// Левончук, Бочко и Матыч — в спортзале (и нигде больше на этой перемене). Один персонаж — одно место.
import { CLASSES } from './characters.js';
import { daySchedule } from './schedule.js';
import { BALANCE } from './balance.js';
import { Rng, hashString } from '../src/engine/rng.js';

// Дом каждого класса: кабинет (Л-2), этаж-коридор, туалет этого этажа.
export const CLASS_HOME = {
  I: { cab: 'cab_343', corridor: 'c3_f4', wc: 'c3_f4_wc' },
  M: { cab: 'cab_244', corridor: 'c2_f4', wc: 'c2_f4_wc' },
  Ya: { cab: 'cab_246', corridor: 'c2_f4', wc: 'c2_f4_wc' },
  U: { cab: 'cab_325', corridor: 'c3_f2', wc: 'c3_f2_wc' },
};
export const CLASS_OF = {};
for (const [cls, ids] of Object.entries(CLASSES)) for (const id of ids) CLASS_OF[id] = cls;
export const NPC_IDS = [...Object.keys(CLASS_OF).filter((id) => id !== 'roma'), 'olga'];
const VAPERS = ['chernyak', 'shurpo', 'smile', 'vitalik', 'zakha', 'levonchuk', 'bochko', 'denis', 'matych', 'buy'];
const BASKETBALL = ['levonchuk', 'bochko', 'matych'];
const PATROL_MAPS = ['c1_f1', 'canteen', 'c3_f4', 'c2_f4', 'c3_f2', 'c1_f2', 'c2_f2'];

const isPE = (l) => l && (l.subjectId === 'pe_football' || l.subjectId === 'pe_swim');

// Идёт ли баскетбол на этой перемене (шанс — BALANCE.basketball.chance; не на большой и не перед физрой игроков).
export function basketballOn(seed, day, b) {
  if (b === 3) return false;
  if (BASKETBALL.some((id) => isPE(daySchedule(day, CLASS_OF[id])[b]))) return false;
  return new Rng(hashString(`${seed}#bb#${day}#${b}`)).chance(BALANCE.basketball.chance);
}

function place(seed, day, b, id) {
  const rng = new Rng(hashString(`${seed}#npc#${day}#${b}#${id}`));
  if (id === 'olga') return rng.chance(0.25) ? null : rng.pick(PATROL_MAPS);
  const cls = CLASS_OF[id], H = CLASS_HOME[cls];
  const sched = daySchedule(day, cls);
  const next = sched[b]; // следующий урок класса (после перемены b)
  if (b === 3) return 'canteen';
  if (isPE(next)) return 'locker_room';
  if (basketballOn(seed, day, b) && BASKETBALL.includes(id)) return 'gym';
  const opts = [[H.cab, 3], [H.corridor, 3], [H.wc, VAPERS.includes(id) ? 4 : 1], ['c1_f1', 2], ['c1_f2', 1], ['library', 1]];
  if (next && next.building > 0) {
    const way = `c${next.building}_f${next.floor}`; // следующий урок в другом корпусе/этаже — по пути
    if (way !== H.corridor) opts.push([way, 4]);
  }
  const total = opts.reduce((a, o) => a + o[1], 0);
  let x = rng.float(0, total);
  for (const [m, w] of opts) { if (x < w) return m; x -= w; }
  return opts[0][0];
}

const cache = new Map();
// Все места на перемене b дня day: { id: id карты | null }.
export function placesFor(seed, day, b) {
  const key = `${seed}|${day}|${b}`;
  if (!cache.has(key)) cache.set(key, Object.fromEntries(NPC_IDS.map((id) => [id, place(seed, day, b, id)])));
  return cache.get(key);
}
export function npcPlace(seed, day, b, id) { return placesFor(seed, day, b)[id]; }
