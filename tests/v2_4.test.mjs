// Тесты этапа V2-4: ИС-2 (нет роста подозрения без нажатий), ИС-3 (падение через 10 с), ИС-4 (50 % на
// отбивание места), английский (ИС-9, ИС-16), банки вопросов (М-4), минимальные оценки (Р-6), душ запускается
// (ИС-12), плавание и классный час доходят до конца, учитель ходит по рядам (М-8).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { CheatLogic } from '../src/minigames/cheat_logic.js';
import { ShowerLogic, showerBot } from '../src/minigames/shower.js';
import { SwimLogic, swimBot } from '../src/minigames/swim_logic.js';
import { ClasshourLogic, CLASSHOUR_TOPICS } from '../src/minigames/classhour_logic.js';
import { FakeInput } from '../src/minigames/kit.js';
import { trySeatSteal } from '../src/game/actions.js';
import { buildRoster } from '../src/world/classroom.js';
import { parseTestBank, testGrade } from '../src/game/test_parse.js';
import { createState } from '../src/game/state.js';
import { minGrade, noGradeLessons } from '../src/game/day.js';
import { SUBJECTS, daySchedule } from '../data/schedule.js';
import { LESSON_FILES } from '../data/lessons.js';
import { BALANCE } from '../data/balance.js';
import { Rng } from '../src/engine/rng.js';
import { parseDialog } from '../src/ui/dialog_script.js';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const geo = { roma: { x: 200, y: 150 }, teacherPos: { x: 240, y: 40 }, targets: [{ x: 150, y: 100 }, { x: 300, y: 120 }] };
// учитель всё время смотрит на Рому: любое подсматривание сразу видно
const staring = { lookTime: [99, 99], randomTurnPerSec: 0, pRoma: 1 };

test('ИС-2: Z, зажатая до начала, не поднимает подозрение; 2 секунды без нажатий — тоже', () => {
  for (const held of [true, false]) {
    const L = new CheatLogic(new Rng('is2'), { ...geo, teacher: staring, startSuspicion: 20, requireRelease: true });
    for (let t = 0; t < 2; t += 1 / 60) L.update(1 / 60, held);
    assert.equal(L.suspicion, 20, 'зажата: ' + held);
  }
  // а после отпускания и нового нажатия — растёт (проверка, что списывание вообще работает)
  const L = new CheatLogic(new Rng('is2b'), { ...geo, teacher: staring, startSuspicion: 20, requireRelease: true });
  L.update(1 / 60, false);
  for (let t = 0; t < 0.5; t += 1 / 60) L.update(1 / 60, true);
  assert.ok(L.suspicion > 20);
});

test('ИС-3: не попадался 10 секунд — подозрение падает', () => {
  const L = new CheatLogic(new Rng('is3'), { ...geo, teacher: staring, startSuspicion: 50, duration: 60 });
  for (let i = 0; i < Math.round(9.8 * 60); i++) L.update(1 / 60, false);
  assert.equal(L.suspicion, 50);
  for (let i = 0; i < 3 * 60; i++) L.update(1 / 60, false);
  assert.ok(L.suspicion < 50 && L.suspicion > 40, String(L.suspicion));
  assert.equal(BALANCE.cheat.calmAfter, 10);
});

test('М-8: учитель идёт по ряду — позиция и конус меняются, потом возвращается', () => {
  const walk = { start: 1, dur: 4, path: [{ x: 240, y: 40 }, { x: 240, y: 200 }] };
  const L = new CheatLogic(new Rng('m8'), { ...geo, teacher: staring, walk });
  for (let i = 0; i < 2 * 60; i++) L.update(1 / 60, false);
  assert.ok(L.walking && L.tpos.y > 40);
  for (let i = 0; i < 4 * 60; i++) L.update(1 / 60, false);
  assert.ok(!L.walking);
  assert.deepEqual(L.tpos, { x: 240, y: 40 });
  assert.equal(BALANCE.cheat.walkChance, 0.1);
});

test('ИС-4: отбить место у Игоря — 50 % (1000 прогонов)', () => {
  let ok = 0;
  for (let i = 0; i < 1000; i++) { const st = createState('S' + i); st.day = 1 + (i % 5); st.lesson = 1 + (i % 6); if (trySeatSteal(st)) ok++; }
  assert.ok(ok > 450 && ok < 550, String(ok));
});

test('английский: 14–15 человек, нет Дениса и Матвея; сел один — соседа нет (ИС-1, ИС-9, ИС-16)', () => {
  for (let i = 0; i < 40; i++) {
    for (const seat of ['igor', 'front', 'steal_ok', 'steal_fail', null]) {
      const st = createState('EN' + i); st.seat = seat;
      const r = buildRoster(st, 1, { english: true });
      const people = r.seats.length + 1; // Рома — тоже (сидит или ещё стоит у двери)
      assert.ok(people >= 14 && people <= 15, `${seat}: ${people}`);
      const ids = r.seats.map((s) => s.id);
      assert.ok(!ids.includes('denis') && !ids.includes('matych'), seat);
      assert.ok(r.seats.every((s) => s.d <= 2), 'три ряда парт');
      if (seat === 'front') assert.ok(!r.seats.some((s) => s.c === r.roma.c && s.d === r.roma.d), 'у первой парты нет соседа');
    }
  }
});

test('банки вопросов: у каждого предмета ≥ 40 вопросов без дублей, по 4 варианта и 1 верному', () => {
  for (const [id, S] of Object.entries(SUBJECTS)) {
    if (S.graded === false) continue;
    const res = parseTestBank(fs.readFileSync(path.join(root, 'data/tests', id + '.txt'), 'utf8'));
    assert.deepEqual(res.errors, [], id);
    assert.ok(res.questions.length >= 40, `${id}: ${res.questions.length}`);
    assert.equal(new Set(res.questions.map((q) => q.q)).size, res.questions.length, id + ': дубли');
  }
  // английский — тест на каждом уроке
  for (let d = 1; d <= 5; d++) for (const l of daySchedule(d)) if (l.subjectId === 'english') assert.equal(l.minigame, 'test');
  // уроки с тестом всегда с оценкой
  for (const seed of ['A', 'B', 'C']) for (const k of noGradeLessons(createState(seed))) {
    const [d, n] = k.split(':').map(Number);
    assert.ok(!daySchedule(d)[n - 1].minigame.startsWith('test'));
  }
});

test('минимальные оценки за тест: точные — 1, гуманитарные — 2 (Р-6)', () => {
  assert.equal(testGrade(0, minGrade({ exact: true })), 1);
  assert.equal(testGrade(0, minGrade({ exact: false })), 2);
  assert.equal(testGrade(7, 2), 7);
  assert.equal(testGrade(12, 1), 10);
});

test('ИС-12: душ запускается (зажатая с меню Z не заканчивает игру) и доходит до конца', () => {
  const L = new ShowerLogic(new Rng('sh'), {});
  const held = new FakeInput().hold('confirm');
  L.update(0.1, held);            // Z ещё зажата после «Начать»
  L.update(0.1, new FakeInput()); // отпустил
  assert.equal(L.finished, false, 'игра не закончилась сама');
  L.update(0.1, new FakeInput().hold('confirm'));
  assert.equal(L.started, true);
  const L2 = new ShowerLogic(new Rng('sh2'), {});
  const bot = showerBot(L2, new Rng('shb'));
  for (let i = 0; i < 60 * 70 && !L2.finished; i++) L2.update(1 / 60, bot(1 / 60));
  assert.ok(L2.finished && L2.romaTime > 5, String(L2.romaTime));
  assert.equal(LESSON_FILES.lesson_pe.extra, undefined, 'после футбола душа нет');
  assert.equal(LESSON_FILES.lesson_swim.pre, 'shower');
  assert.equal(LESSON_FILES.lesson_swim.extra, 'shower');
});

test('плавание: 4–5 минут, заплывы, физрук уходит и возвращается; классный час доходит до конца', () => {
  const L = new SwimLogic(new Rng('swim'), { swimmers: ['igor', 'denis', 'guza', 'matych', 'buy'], staminaMax: 0.9 });
  const bot = swimBot(L, new Rng('swimbot'));
  let away = 0;
  while (!L.finished) { L.update(1 / 30, bot(1 / 30)); for (const e of L.events) if (e.type === 'ivan_away') away++; L.events = []; }
  assert.ok(L.t >= 240 && L.t <= 300, String(L.t));
  assert.ok(L.heats.length >= 5, 'заплывов ' + L.heats.length);
  assert.ok(away >= 2);
  const d = L.deltas();
  assert.ok(Number.isFinite(d.aura) && Number.isFinite(d.stress));
  let wins = 0;
  for (let i = 0; i < 200; i++) {
    const C = new ClasshourLogic(new Rng('ch' + i), {});
    while (!C.finished) { C.friendTurn(); C.friendTurn(); C.romaTurn(2); }
    if (C.result === 'win') wins++;
  }
  assert.ok(wins > 40 && wins < 200, 'классный час: побед средним ' + wins);
  // реплики по всем темам есть
  const ch = parseDialog(fs.readFileSync(path.join(root, 'data/dialogs/classhour.txt'), 'utf8'));
  assert.deepEqual(ch.errors, []);
  for (const t of CLASSHOUR_TOPICS) for (const l of [`topic_${t}`, `roma_${t}_1`, `roma_${t}_2`, `roma_${t}_3`, `igor_${t}`, `denis_${t}`]) assert.ok(ch.labels[l], l);
  for (const f of ['swim', 'lesson_swim', 'lesson_classhour']) assert.deepEqual(parseDialog(fs.readFileSync(path.join(root, 'data/dialogs', f + '.txt'), 'utf8')).errors, [], f);
});
