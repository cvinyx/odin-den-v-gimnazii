// Прогон «Списывания» ботом в node (без браузера): используется тестами и tools/balance_cheat.mjs.
import { CheatLogic, makeBot } from '../src/minigames/cheat_logic.js';
import { Rng } from '../src/engine/rng.js';
import { seatTile, tileToFeet, TEACHER_TILE, buildRoster } from '../src/world/classroom.js';
import { createState } from '../src/game/state.js';
import { TEACHERS } from '../data/teachers.js';

const teacherPos = tileToFeet({ ...TEACHER_TILE, half: true }); teacherPos.y -= 18;
const SEEDS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
// Цели взгляда — головы учеников реальной рассадки урока 1 для данного кода дня (как в игре).
function targetsFor(seed, seat) {
  const st = createState(SEEDS[seed % 31] + SEEDS[(seed * 7) % 31] + 'QX2' + SEEDS[(seed * 3) % 31]);
  st.seat = seat;
  return buildRoster(st, 1, { denis: false }).seats.map((s) => { const f = tileToFeet(seatTile(s.c, s.d, s.side)); return { x: f.x, y: f.y - 12 }; });
}

export const ELENA = { wide: true, ...TEACHERS.elena.params };
export const SETUPS = {
  'Английский, рядом с Игорем': { seat: [1, 4, 1], seatName: 'igor', teacher: ELENA, mul: 1, start: 15 },
  'Английский, впереди (×1,4, +1)': { seat: [1, 0, 0], seatName: 'front', teacher: ELENA, mul: 1.4, start: 15, front: true },
};

export function runCheat(seed, kind, setup = SETUPS['Английский, рядом с Игорем']) {
  const rng = new Rng('cheat-bal-' + seed);
  const roma = tileToFeet(seatTile(...setup.seat)); roma.y -= 12;
  const L = new CheatLogic(rng, {
    teacher: setup.teacher, mul: setup.mul, speedMul: setup.speedMul || 1, startSuspicion: setup.start || 0,
    roma, teacherPos, targets: targetsFor(seed, setup.seatName),
  });
  const bot = makeBot(kind);
  const dt = 1 / 60;
  while (!L.finished) L.update(dt, bot(L, dt));
  const director = L.result === 'director';
  return { grade: director ? 2 : Math.min(10, L.grade + (setup.front ? 1 : 0)), director, answers: L.answers, susp: Math.round(L.suspicion) };
}
