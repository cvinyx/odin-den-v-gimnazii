// Тесты этапа 3: вся школа, перемены по таблице, учителя, уроки, буфет, схема.
import test from 'node:test';
import assert from 'node:assert/strict';
import { placesFor } from '../data/npc_schedule.js';
const NPC_SCHEDULE = placesFor('KQ7M2P', 1, 1);
import { CHARACTERS } from '../data/characters.js';
import { TEACHERS, CAMEO_TEACHERS } from '../data/teachers.js';
import { daySchedule } from '../data/schedule.js';
import { setDay } from '../src/game/day.js';

// V2-2: расписание — на 5 дней; проверки «по урокам» идут по всем дням недели.
const WEEK_DAYS = [1, 2, 3, 4, 5].map((d) => daySchedule(d));
import { LESSON_FILES, LINEUPS } from '../data/lessons.js';
import { MAPS, ROOM_MAPS, STAIRWELLS } from '../src/world/maps/index.js';
import { namedAt, cameosFor } from '../src/world/schedule.js';
import { patrolSees } from '../src/world/patrol.js';
import { createState } from '../src/game/state.js';
import { roomAction, startBreak, finishLesson } from '../src/game/day.js';
import { buyFood, isBigBreak } from '../src/scenes/buffet.js';
import { zoneOf } from '../src/scenes/school_map.js';
import { parseDialog } from '../src/ui/dialog_script.js';
import { readDialog } from './helpers.mjs';
import { planRoute } from '../tools/bot_lib.mjs';

// V2-5 (Л-22, Л-23): места на переменах теперь по дню недели и коду (data/npc_schedule.js); старая таблица
// раздела 11 заменена тестами в tests/v2_5.test.mjs. Здесь — только что все именные есть в таблице.
test('все именные ученики есть в таблице мест', () => {
  const p = placesFor('KQ7M2P', 1, 1);
  for (const id of Object.keys(CHARACTERS)) if (id !== 'roma') assert.ok(id in p, 'нет в таблице: ' + id);
});

test('на каждую перемену у каждого именного — свой диалог (и повторный)', () => {
  const again = parseDialog(readDialog('npc_again'));
  for (let b = 1; b <= 6; b++) {
    const d = parseDialog(readDialog('break' + b));
    assert.deepEqual(d.errors, []);
    for (const id of Object.keys(NPC_SCHEDULE)) {
      if (id === 'olga') continue;
      assert.ok(d.labels[id], `break${b}: нет диалога ${id}`);
    }
    assert.ok(d.labels.menu || b === 1);
  }
  for (const id of Object.keys(NPC_SCHEDULE)) if (id !== 'olga') assert.ok(again.labels[id], 'npc_again: ' + id);
  const staff = parseDialog(readDialog('staff'));
  for (const id of [...CAMEO_TEACHERS, 'olga', 'librarian', 'cook']) assert.ok(staff.labels[id], 'staff: ' + id);
});

test('учителя-камео: 1–2 за перемену, по сиду, разные места, только из списка', () => {
  for (const seed of ['ABCDEF', 'K7PQ2Z', 'ZZZZZZ']) {
    for (let b = 1; b <= 6; b++) {
      const a = cameosFor(createState(seed), b), c = cameosFor(createState(seed), b);
      assert.deepEqual(a, c);
      assert.ok(a.length >= 1 && a.length <= 2);
      assert.equal(new Set(a.map((x) => x.map)).size, a.length);
      for (const x of a) { assert.ok(CAMEO_TEACHERS.includes(x.id)); assert.ok(MAPS[x.map]); }
    }
  }
});

test('завуч видит конусом по направлению взгляда', () => {
  const z = { x: 100, y: 100, dir: 'right' };
  assert.equal(patrolSees(z, { x: 160, y: 105 }), true);
  assert.equal(patrolSees(z, { x: 40, y: 100 }), false);
  assert.equal(patrolSees(z, { x: 110, y: 110 }), true); // вплотную видно всегда
  assert.equal(patrolSees(z, { x: 300, y: 100 }), false);
});

test('уроки: у каждого есть файл диалогов со всеми метками и кабинет на карте', () => {
  const GAMES = ['test', 'phone_blocks', 'bait', 'phone_brawl', 'football', 'phone_feed', 'test_quiz', 'swim', 'classhour']; // V2-4
  for (const l of WEEK_DAYS.flat()) {
    const c = LESSON_FILES[l.file];
    assert.ok(c, 'нет файла урока ' + l.file);
    const d = parseDialog(readDialog(l.file));
    assert.deepEqual(d.errors, [], l.file);
    for (const lab of ['intro', 'before_game', 'after_good', 'after_bad', ...c.events, ...(c.seat ? [c.seat] : [])]) assert.ok(d.labels[lab], `${l.file}: нет ${lab}`);
    assert.ok(GAMES.includes(l.minigame), 'мини-игра урока ' + l.subject);
    if (l.building) {
      assert.ok(MAPS[ROOM_MAPS[l.room]], 'нет карты кабинета ' + l.room);
      const corridor = MAPS[`c${l.building}_f${l.floor}`];
      assert.ok(corridor.exits.some((e) => e.room === l.room || e.to === 'cab_' + l.room), `дверь ${l.room} в ${corridor.id}`);
    } else {
      assert.ok(Object.values(MAPS).some((m) => m.room === l.room), l.room);
    }
  }
  // составы Эль-Класико — строго 5 на 5 + скамейка, без безымянных
  for (const t of Object.values(LINEUPS)) { assert.equal(1 + t.field.length, 5); for (const id of [t.keeper, ...t.field, ...t.bench]) assert.ok(CHARACTERS[id], id); }
});

test('на перемене N вход в кабинет урока N+1 начинает урок', () => {
  for (let day = 1; day <= 5; day++) {
    setDay(day);
    const st = createState('ABCDEF');
    st.day = day;
    const S = WEEK_DAYS[day - 1];
    for (let n = 1; n < S.length; n++) {
      finishLesson(st, n, 5);
      startBreak(st, n);
      assert.deepEqual(roomAction(st, S[n].room), { type: 'lesson', n: n + 1 }, `день ${day}, урок ${n + 1}`);
    }
  }
  setDay(1);
});

test('из улицы можно дойти до каждого кабинета расписания и до каждой карты', () => {
  const data = { MAPS, STAIRWELLS };
  const roomMap = (l) => (l.building ? `c${l.building}_f${l.floor}` : l.room === 'бассейн' ? 'pool' : 'gym');
  for (const S of WEEK_DAYS) {
    for (const l of S) assert.ok(planRoute(data, 'street', l.room), 'нет пути к ' + l.room);
    // и между любыми двумя кабинетами подряд
    for (let i = 0; i + 1 < S.length; i++) assert.ok(planRoute(data, roomMap(S[i]), S[i + 1].room), `${S[i].room} → ${S[i + 1].room}`);
  }
  // каждая карта (кроме тестовой и остановки) достижима
  const seen = new Set(['street']); const q = ['street'];
  while (q.length) {
    const c = q.shift(); const m = MAPS[c];
    for (const e of m.exits || []) {
      const ts = e.to ? [e.to] : e.stairs ? Object.values(STAIRWELLS[m.building]) : [];
      for (const t of ts) if (!seen.has(t)) { seen.add(t); q.push(t); }
    }
  }
  for (const id of Object.keys(MAPS)) if (!['test_room', 'bus_stop'].includes(id) && !id.startsWith('cab_')) assert.ok(seen.has(id), 'недостижима ' + id);
});

test('буфет: цены, обед только на большой перемене, денег не хватает — не продаём', () => {
  const st = createState('ABCDEF');
  st.phase = 'break'; st.lesson = 1;
  assert.equal(isBigBreak(st), false);
  assert.equal(buyFood(st, 'lunch').ok, false);
  assert.equal(buyFood(st, 'smazhenka').ok, true);
  assert.equal(st.stats.money, 480);
  assert.equal(st.stats.hunger, 15);
  st.lesson = 3;
  assert.equal(isBigBreak(st), true);
  assert.equal(buyFood(st, 'lunch').ok, true);
  assert.equal(st.stats.money, 130);
  assert.equal(buyFood(st, 'topChoco').ok, false);
});

test('схема школы: у каждой карты есть зона', () => {
  for (const id of Object.keys(MAPS)) if (id !== 'test_room') assert.ok(zoneOf(id), id);
  // V2-3: новая нумерация корпусов (Л-1)
  assert.equal(zoneOf('c2_f3'), 'c2');
  assert.equal(zoneOf('cab_343'), 'c3');
  assert.equal(zoneOf('c1_back'), 'passage');
  assert.equal(zoneOf('library'), 'rec');
  assert.equal(zoneOf('showers'), 'pool');
});
