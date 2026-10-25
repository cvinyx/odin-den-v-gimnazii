// Тесты этапа 3: вся школа, перемены по таблице, учителя, уроки, буфет, схема.
import test from 'node:test';
import assert from 'node:assert/strict';
import { NPC_SCHEDULE } from '../data/npc_schedule.js';
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

// Таблица раздела 11 (как в спецификации) — с названиями мест, переведёнными в id карт.
const TABLE = {
  'denis,igor': ['k2_f4', 'k2_f4_toilet', 'canteen', 'rec_f1', 'locker_room', 'k2_f3'],
  'chernyak,shurpo': ['k1_f4_toilet', 'k1_f4_toilet', 'canteen', 'rec_toilet', 'locker_room', 'library'],
  'levonchuk': ['k1_f4', 'rec_f2', 'canteen', 'k1_f4', 'rec_f1', 'rec_f1'],
  'bochko': ['k1_f4', 'rec_f2', 'canteen', 'k1_f4', 'locker_room', 'rec_f1'],
  'matych,buy,guza': ['rec_f1', 'k2_f4', 'canteen', 'k2_f4_toilet', 'locker_room', 'rec_f1'],
  'smile,vadim,vitalik,zakha,anosov': ['k1_f4', 'k1_f4_toilet', 'canteen', 'rec_f1', 'locker_room', 'k1_f4'],
  'vanya,svyat': ['k2_f2', 'rec_f2', 'canteen', 'k2_f2', 'rec_f1', 'k2_f2'],
  'olga': [null, 'rec_f1', 'canteen', 'k2_f4', null, 'k1_f4'],
};

test('на каждой перемене каждый именной NPC стоит там, где сказано в таблице раздела 11', () => {
  for (const [ids, places] of Object.entries(TABLE)) {
    for (const id of ids.split(',')) {
      for (let b = 1; b <= 6; b++) {
        const where = places[b - 1];
        assert.equal(NPC_SCHEDULE[id][b], where, `${id}, перемена ${b}`);
        for (const mapId of Object.keys(MAPS)) {
          assert.equal(namedAt(b, mapId).includes(id), mapId === where, `${id} на ${mapId}, перемена ${b}`);
        }
        if (where) assert.ok(MAPS[where], 'нет карты ' + where);
      }
    }
  }
  // все именные ученики есть в таблице
  for (const id of Object.keys(CHARACTERS)) if (id !== 'roma') assert.ok(NPC_SCHEDULE[id], 'нет в таблице: ' + id);
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
  const GAMES = ['cheat', 'phone_blocks', 'bait', 'phone_brawl', 'football', 'phone_feed', 'cheat_quiz', 'swim_stub', 'classhour_stub'];
  for (const l of WEEK_DAYS.flat()) {
    const c = LESSON_FILES[l.file];
    assert.ok(c, 'нет файла урока ' + l.file);
    const d = parseDialog(readDialog(l.file));
    assert.deepEqual(d.errors, [], l.file);
    for (const lab of ['intro', 'before_game', 'after_good', 'after_bad', ...c.events, ...(c.seat ? [c.seat] : [])]) assert.ok(d.labels[lab], `${l.file}: нет ${lab}`);
    assert.ok(GAMES.includes(l.minigame), 'мини-игра урока ' + l.subject);
    if (l.minigame.endsWith('_stub')) assert.ok(d.labels[l.minigame], `${l.file}: нет ${l.minigame}`);
    if (l.building) {
      assert.ok(MAPS[ROOM_MAPS[l.room]], 'нет карты кабинета ' + l.room);
      const corridor = MAPS[`k${l.building}_f${l.floor}`];
      assert.ok(corridor.exits.some((e) => e.room === l.room), `дверь ${l.room} в ${corridor.id}`);
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
  const roomMap = (l) => (l.building ? `k${l.building}_f${l.floor}` : l.room === 'бассейн' ? 'pool' : 'gym');
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
  assert.equal(zoneOf('k1_f3'), 'k1');
  assert.equal(zoneOf('cab_404'), 'k2');
  assert.equal(zoneOf('library'), 'rec');
  assert.equal(zoneOf('showers'), 'pool');
});
