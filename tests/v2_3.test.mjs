// Тесты этапа V2-3 «Новая карта школы»: достижимость, маршруты ко всем кабинетам недели, нумерация Л-2,
// этажи корпусов (Л-3, Л-19), туалеты (Л-9, Л-18), коридоры без шкафчиков (Л-24), помещения Л-7…Л-25, ИС-6.
import test from 'node:test';
import assert from 'node:assert/strict';
import { MAPS, STAIRWELLS, ROOM_MAPS } from '../src/world/maps/index.js';
import { TILE_DEFS } from '../src/gen/tiles.js';
import { daySchedule } from '../data/schedule.js';
import { planRoute } from '../tools/bot_lib.mjs';
import { BALANCE } from '../data/balance.js';

const count = (m, ch) => m.rows.join('').split(ch).length - 1;
const FLOORS = [2, 3].flatMap((b) => [1, 2, 3, 4].map((f) => MAPS[`c${b}_f${f}`]));

test('все карты достижимы от улицы, у всех тайлов есть описание', () => {
  const seen = new Set(['street']); const q = ['street'];
  while (q.length) {
    const m = MAPS[q.shift()];
    const next = (m.exits || []).flatMap((e) => (e.to ? [e.to] : e.room ? [ROOM_MAPS[e.room]].filter(Boolean) : e.stairs ? Object.values(STAIRWELLS[m.building]) : []));
    for (const t of next) if (!seen.has(t)) { seen.add(t); q.push(t); }
  }
  for (const id of Object.keys(MAPS)) if (!['test_room', 'bus_stop'].includes(id)) assert.ok(seen.has(id), 'недостижима: ' + id);
  for (const m of Object.values(MAPS)) for (const ch of m.rows.join('')) assert.ok(TILE_DEFS[ch], `${m.id}: тайл «${ch}»`);
});

test('путь от входа до каждого кабинета расписания всех 5 дней', () => {
  const data = { MAPS, STAIRWELLS };
  for (let d = 1; d <= 5; d++) for (const l of daySchedule(d)) {
    assert.ok(planRoute(data, 'c1_f1', l.room), `день ${d}: ${l.subject} (${l.room})`);
    if (l.building) assert.ok(MAPS[ROOM_MAPS[l.room]], 'нет карты кабинета ' + l.room);
  }
});

test('этажи корпусов 2 и 3: 3 туалета, 2 лестницы, 9 кабинетов, нет шкафчиков (Л-3, Л-4, Л-19, Л-24)', () => {
  for (const m of FLOORS) {
    const wc = m.exits.filter((e) => e.deny || (e.to && MAPS[e.to].toilet));
    assert.equal(wc.length, 3, m.id + ': туалеты');
    assert.deepEqual(wc.map((e) => e.deny || 'men').sort(), ['men', 'teachers', 'women']);
    const stairs = m.exits.filter((e) => e.stairs && e.label);
    assert.equal(stairs.length, 2, m.id + ': лестницы');
    assert.ok(m.spawns.stairs && m.spawns.stairs2);
    assert.equal(count(m, 'L'), 0, m.id + ': шкафчики в коридоре');
    // номера по Л-2: корпус, этаж, номер на этаже
    const nums = m.exits.map((e) => e.room || (e.to && e.to.startsWith('cab_') ? e.to.slice(4) : null) || (e.locked && (e.locked.match(/\d{3}/) || [])[0])).filter(Boolean);
    assert.equal(new Set(nums).size, m.id === 'c3_f2' || m.id === 'c3_f3' ? 8 : 9, m.id + ': ' + nums);
    for (const n of nums) assert.equal(n.slice(0, 2), `${m.building}${m.floorNo}`, `${m.id}: ${n}`);
  }
  for (const id of ['c1_f1', 'c1_f2']) assert.equal(count(MAPS[id], 'L'), 0, id);
  // переходы на 2-й этаж корпуса 1 (Л-5)
  assert.ok(MAPS.c2_f2.exits.some((e) => e.to === 'c1_f2'));
  assert.ok(MAPS.c3_f2.exits.some((e) => e.to === 'c1_f2'));
});

test('где кабинеты (Л-2, Л-8, Л-15, Л-17, Л-21)', () => {
  const where = (no) => FLOORS.find((m) => m.exits.some((e) => e.room === no || e.to === 'cab_' + no));
  assert.equal(where('343').id, 'c3_f4');
  assert.equal(where('244').id, 'c2_f4');
  assert.equal(where('246').id, 'c2_f4');
  assert.equal(where('325').id, 'c3_f2');
  assert.equal(where('224').id, 'c2_f2');
  assert.equal(where('321').id, 'c3_f2');
  assert.equal(where('331').id, 'c3_f3');
  assert.equal(where('241').id, 'c2_f4');
  assert.ok(MAPS.c3_f2.exits.some((e) => e.label === 'Директор'));
  assert.ok(MAPS.c3_f3.exits.some((e) => e.label === 'Учительская'));
  assert.ok(count(MAPS.c2_f2, '=') >= 1, 'железная дверь');
  for (const no of ['343', '244', '246', '325']) {
    const m = MAPS['cab_' + no];
    assert.ok(m.classRoom && m.room === no);
    assert.equal(count(m, 'X'), 6, 'три шкафа по две дверцы');
    assert.ok(count(m, '&') >= 1, 'стол классного руководителя');
  }
});

test('туалеты (Л-9, Л-18): две комнаты, 2 раковины, 2 зеркала, сушилка, 2 кабинки, писсуар, синяя плитка', () => {
  const wcs = Object.values(MAPS).filter((m) => m.toilet);
  assert.equal(wcs.length, 9);
  for (const m of wcs) {
    assert.equal(count(m, 's'), 2); assert.equal(count(m, 'M'), 2); assert.equal(count(m, 'z'), 1);
    assert.ok(count(m, 'k') >= 2); assert.equal(count(m, 'y'), 1); assert.ok(count(m, 'u') > 20);
    assert.ok(m.spots.kid, 'место для пятиклассника');
  }
  assert.equal(BALANCE.toilets.wrongDoorAura, -5);
});

test('корпус 1, улица, столовая, буфет, раздевалка, бассейн (Л-7, Л-11, Л-12, Л-20, Л-25, ИС-6, У-3)', () => {
  const hall = MAPS.c1_hall;
  assert.ok(count(hall, 'o') >= 140 && count(hall, 'o') <= 160, 'стульев ' + count(hall, 'o'));
  assert.ok(count(hall, 'l') === 1 && count(hall, 'V') >= 2 && count(hall, 'i') >= 2 && count(hall, 'm') > 20);
  assert.ok(MAPS.c1_f2.exits.some((e) => e.to === 'c1_hall') && MAPS.c1_f2.exits.some((e) => e.to === 'library'));
  assert.equal(MAPS.c1_back.exits.filter((e) => /^c1_(trudy|gymroom)/.test(e.to)).length, 3);
  assert.ok(MAPS.c1_back.exits.some((e) => e.to === 'c1_yard'));
  assert.ok(count(MAPS.c1_trudy1, 'I') >= 6 && count(MAPS.c1_gymroom, 'G') >= 2 && count(MAPS.c1_yard, '%') > 20);
  assert.equal(count(MAPS.street, 'r') + count(MAPS.street, 'a'), 0, 'проезжая часть убрана');
  assert.ok(count(MAPS.street, '^') >= 20 && count(MAPS.c1_f1, '|') >= 6);
  const signs = MAPS.canteen.signs.map((s) => s.text);
  for (const c of ['11 «И»', '11 «М»', '11 «Я»', '11 «У»']) assert.equal(signs.filter((t) => t === c).length, 2, c);
  assert.ok(MAPS.canteen.exits.some((e) => e.to === 'buffet') && count(MAPS.buffet, '+') > 20);
  const food = Object.values(BALANCE.food).map((f) => [f.name, f.price]);
  for (const need of [['Карбонарка', 200], ['Шашлычок', 200], ['Батончик «Витьба»', 90], ['Булочка с повидлом', 120], ['Сок 1 литр', 250]]) assert.ok(food.some(([n, p]) => n === need[0] && p === need[1]), need[0]);
  const lr = MAPS.locker_room;
  assert.ok(count(lr, 'L') === 1 && count(lr, 'T') === 2 && count(lr, 'b') >= 16 && count(lr, '$') === 1 && count(lr, '~') === 1 && count(lr, '-') >= 6);
  assert.ok(MAPS.gym.exits.some((e) => e.to === 'locker_room' && e.edge));
  assert.ok(count(MAPS.pool, 'b') >= 8, 'лавочки в бассейне');
  assert.ok(MAPS.c2_f1.kids && MAPS.c3_f1.kids && !MAPS.c3_f2.kids, 'младшие классы на 1-х этажах');
});
