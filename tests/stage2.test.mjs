// Тесты этапа 2: рассадка и детерминизм, ставки/долги, вейп и срыв, правила дня, карты, баланс мини-игр.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createState, changeStat } from '../src/game/state.js';
import { eventRng, startLesson, endLessonRules, finishLesson, startBreak, lessonClock, roomAction, hintText, setDay } from '../src/game/day.js';
import { puff, addSuspicion, checkBreakdown, directorCall, directorEndsDay, staminaPenalty } from '../src/game/actions.js';
import { rollBet, resolveLoss, totalDebt, creditorReminds } from '../src/game/bets.js';
import { BALANCE } from '../data/balance.js';
import { NPC_SCHEDULE } from '../data/npc_schedule.js';
import { MAPS, STAIRWELLS } from '../src/world/maps/index.js';
import { TILE_DEFS, isSolidChar } from '../src/gen/tiles.js';
import { CheatLogic, makeBot } from '../src/minigames/cheat_logic.js';
import { BaitLogic, CATS } from '../src/minigames/bait_logic.js';
import { buildRoster } from '../src/world/classroom.js';
import { Rng } from '../src/engine/rng.js';
import { parseDialog } from '../src/ui/dialog_script.js';
import { readDialog, dialogNames } from './helpers.mjs';
import { runCheat } from '../tools/balance_cheat_lib.mjs';

// V2-4 (ИС-4): шанс отбить место — 50 % (тест обновлён под новое правило)
test('рассадка 50 %: одинаковый код дня — одинаковый результат', () => {
  const roll = (seed, n) => eventRng(createState(seed), 'seat' + n).chance(BALANCE.seating.stealChance);
  for (const seed of ['ABCDEF', 'K7PQ2Z', 'XXXXXX']) for (let n = 1; n <= 7; n++) assert.equal(roll(seed, n), roll(seed, n));
  let ok = 0, total = 0;
  for (let i = 0; i < 3000; i++) { total++; if (roll('S' + i, 2)) ok++; }
  assert.ok(Math.abs(ok / total - 0.5) < 0.03, 'доля успехов ' + ok / total);
});

test('рассадка класса детерминирована, Игорь и Денис на последней парте среднего ряда', () => {
  const st = createState('ABCDEF');
  const a = buildRoster(st, 2), b = buildRoster(st, 2);
  assert.deepEqual(a.seats.map((s) => s.id.replace(/^cls_\d+_/, '') + s.c + s.d + s.side), b.seats.map((s) => s.id.replace(/^cls_\d+_/, '') + s.c + s.d + s.side));
  const igor = a.seats.find((s) => s.id === 'igor'), denis = a.seats.find((s) => s.id === 'denis');
  assert.deepEqual([igor.c, igor.d, igor.side], [1, 4, 0]);
  assert.deepEqual([denis.c, denis.d, denis.side], [1, 4, 1]);
  // английский: Дениса нет, Рома рядом с Игорем
  st.seat = 'igor';
  const en = buildRoster(st, 1, { denis: false });
  assert.ok(!en.seats.some((s) => s.id === 'denis'));
  assert.deepEqual([en.roma.c, en.roma.d, en.roma.side], [1, 4, 1]);
  // отбил место: Рома на месте Игоря, Игорь дуется рядом
  st.seat = 'steal_ok';
  const so = buildRoster(st, 2);
  assert.deepEqual([so.roma.c, so.roma.d, so.roma.side], [1, 4, 0]);
  assert.ok(!so.seats.some((s) => s.c === 1 && s.d === 4 && s.side === 0));
  // на уроке в кабинете только «И» и безымянные
  const allowed = new Set(['igor', 'denis', 'matych', 'buy', 'guza']);
  for (const s of a.seats) assert.ok(allowed.has(s.id) || s.id.startsWith('cls_'), s.id);
});

test('начало урока: опоздание 15, перенос 25 %, запах вейпа +20, множитель учителя', () => {
  const st = createState('ABCDEF');
  startLesson(st, 1);
  assert.equal(st.stats.suspicion, 15);
  assert.equal(st.clock, '09:00');
  assert.equal(lessonClock(1, 0.5), '09:22');
  finishLesson(st, 1, 7);
  st.suspicionPrev = 80;
  st.vapeSmell = true;
  startLesson(st, 2);
  assert.equal(st.stats.suspicion, 40);
  assert.equal(st.vapeSmell, false);
  // V2-2: белорусский — 6-й урок в среду (расписание недели)
  setDay(3);
  startLesson(st, 6);
  assert.equal(st.lessonMul, 0.5); // Ядвига Францевна
  setDay(1);
});

test('конец урока: батарея −1, голод +8, пустой вейп и мёртвый телефон — стресс', () => {
  const st = createState('ABCDEF');
  endLessonRules(st);
  assert.equal(st.stats.battery, 33);
  assert.equal(st.stats.hunger, 48);
  st.stats.battery = 1; st.stats.vapeCharge = 0; st.stats.hunger = 95;
  const s0 = st.stats.stress;
  endLessonRules(st);
  assert.equal(st.stats.stress, s0 + 5 + 5 + 10);
});

test('перемена: часы замирают на конце урока, вход в кабинет', () => {
  const st = createState('ABCDEF');
  st.phase = 'late';
  // V2-2, V2-3: понедельник — английский (232), потом алгебра (343, класс 11 «И»)
  assert.equal(roomAction(st, '232').type, 'lesson');
  assert.equal(roomAction(st, '321').type, 'denied');
  assert.match(hintText(st), /Английский, каб\. 232, корп\. 2, 3 эт\./);
  finishLesson(st, 1, 6);
  startBreak(st, 1);
  assert.equal(st.clock, '09:45');
  assert.match(hintText(st), /Следующий: Алгебра, каб\. 343, корп\. 3, 4 эт\./);
  assert.equal(roomAction(st, '343').type, 'lesson');
  assert.equal(roomAction(st, '232').type, 'denied');
});

test('вейп: 5 затяжек = 1 заправка, на уроке +25 подозрения (с множителем), без жижки нельзя', () => {
  const st = createState('ABCDEF');
  st.stats.vapeCharge = 100;
  for (let i = 0; i < 5; i++) assert.equal(puff(st).ok, true);
  assert.equal(st.stats.juice, 1);
  assert.equal(st.stats.vapeCharge, 50);
  assert.equal(st.puffsToday, 5);
  assert.equal(staminaPenalty(st), 0.25);
  st.phase = 'lesson'; st.lessonMul = 1.4; st.stats.suspicion = 0;
  puff(st);
  assert.equal(st.stats.suspicion, 35);
  st.stats.juice = 0;
  assert.equal(puff(st).ok, false);
  assert.equal(addSuspicion({ ...st, phase: 'break' }, 50), 0);
});

test('срыв на стрессе 100 и вызовы к директору', () => {
  const st = createState('ABCDEF');
  changeStat(st, 'stress', 100);
  assert.equal(checkBreakdown(st), true);
  assert.equal(st.stats.stress, 60);
  assert.equal(st.breakdownPending, true);
  assert.equal(checkBreakdown(st), false);
  directorCall(st); directorCall(st);
  assert.equal(directorEndsDay(st), false);
  directorCall(st);
  assert.equal(directorEndsDay(st), true);
});

test('ставки и долги: три варианта при проигрыше', () => {
  const st = createState('ABCDEF');
  for (let i = 0; i < 50; i++) { const b = rollBet(st, 'igor'); assert.ok(b >= 50 && b <= 200 && b % 10 === 0); }
  st.stats.money = 600;
  assert.deepEqual(resolveLoss(st, 'igor', 120, 'pay'), { outcome: 'paid', paid: 120 });
  assert.equal(st.stats.money, 480);
  resolveLoss(st, 'denis', 150, 'later');
  resolveLoss(st, 'denis', 50, 'later');
  assert.equal(totalDebt(st), 200);
  assert.equal(st.debts.length, 1);
  st.stats.money = 30;
  assert.equal(resolveLoss(st, 'buy', 100, 'nomoney').outcome, 'truth');
  // шанс разоблачения ≈ 40 % (≥ 2 BYN — 60 %)
  let exp = 0, expRich = 0;
  for (let i = 0; i < 2000; i++) {
    const a = createState('E' + i); a.stats.money = 150; a.flags.betCount = i;
    if (resolveLoss(a, 'x', 100, 'nomoney').outcome === 'exposed') exp++;
    const b = createState('E' + i); b.stats.money = 300; b.flags.betCount = i;
    if (resolveLoss(b, 'x', 100, 'nomoney').outcome === 'exposed') expRich++;
  }
  assert.ok(Math.abs(exp / 2000 - 0.4) < 0.04, 'разоблачение ' + exp / 2000);
  assert.ok(Math.abs(expRich / 2000 - 0.6) < 0.04, 'разоблачение богатого ' + expRich / 2000);
  // кредитор напоминает примерно в половине встреч
  let rem = 0;
  for (let i = 0; i < 400; i++) if (creditorReminds(st, 'denis')) rem++;
  assert.ok(rem > 150 && rem < 250, 'напоминания ' + rem);
  assert.equal(creditorReminds(st, 'chernyak'), false);
});

test('карты: тайлы известны, выходы ведут на существующие карты и точки, точки появления — на полу', () => {
  for (const [id, m] of Object.entries(MAPS)) {
    const w = m.rows[0].length;
    for (const row of m.rows) { assert.equal(row.length, w, id); for (const ch of row) assert.ok(TILE_DEFS[ch], id + ': ' + ch); }
    const floor = (x, y) => y >= 0 && y < m.rows.length && x >= 0 && x < w && !isSolidChar(m.rows[y][x]);
    for (const [name, sp] of Object.entries(m.spawns || {})) assert.ok(floor(sp.x, sp.y), `${id}.${name}`);
    for (const ex of m.exits || []) {
      if (ex.to) { assert.ok(MAPS[ex.to], `${id} → ${ex.to}`); assert.ok(MAPS[ex.to].spawns[ex.spawn], `${id} → ${ex.to}.${ex.spawn}`); }
    }
    for (const list of Object.values(m.spots || {})) for (const [x, y] of list) assert.ok(floor(x, y), `${id} точка ${x},${y}`);
    for (const n of m.npcs || []) assert.ok(floor(n.x, n.y), `${id} NPC ${n.id}`);
  }
  for (const floors of Object.values(STAIRWELLS)) for (const id of Object.values(floors)) assert.ok(MAPS[id], id);
});

test('путь от улицы до каб. 404 существует (по картам и переходам)', () => {
  // граф: карта → карты, куда ведут выходы и лестницы
  const edges = {};
  for (const [id, m] of Object.entries(MAPS)) {
    edges[id] = new Set((m.exits || []).filter((e) => e.to).map((e) => e.to));
    if (m.building && STAIRWELLS[m.building] && (m.exits || []).some((e) => e.stairs)) for (const t of Object.values(STAIRWELLS[m.building])) edges[id].add(t);
  }
  const seen = new Set(['street']);
  const q = ['street'];
  while (q.length) { const c = q.shift(); for (const n of edges[c]) if (!seen.has(n)) { seen.add(n); q.push(n); } }
  for (const need of ['c1_f1', 'c3_f1', 'c3_f2', 'c3_f3', 'c3_f4', 'c3_f4_wc']) assert.ok(seen.has(need), need);
  assert.ok(MAPS.c3_f4.exits.some((e) => e.to === 'cab_343')); // V2-3: класс 11 «И» — 343
});

test('перемена 1: NPC стоят там, где сказано в таблице раздела 11', () => {
  const b1 = (id) => NPC_SCHEDULE[id][1];
  assert.equal(b1('denis'), 'c3_f4');
  assert.equal(b1('igor'), 'c3_f4');
  for (const id of ['matych', 'buy', 'guza']) assert.equal(b1(id), 'c1_f1');
  // у всех именных, кто стоит на картах этапа 2, есть диалоги перемены 1
  const d = parseDialog(readDialog('break1'));
  for (const [id, row] of Object.entries(NPC_SCHEDULE)) if (MAPS[row[1]]) assert.ok(d.labels[id], 'нет диалога ' + id);
});

test('файлы байт-дуэли: у каждого есть все метки', () => {
  const need = ['intro', 'roma_weak', 'roma_mid', 'roma_strong', 'roma_weird', 'opp_retort', 'opp_hit', 'opp_shrug', 'opp_boil', 'opp_win'];
  for (const name of dialogNames().filter((n) => n.startsWith('bait_'))) {
    const d = parseDialog(readDialog(name));
    for (const l of need) assert.ok(d.labels[l], name + ': нет ' + l);
  }
});

test('байт-дуэль: всегда заканчивается за 3–4 раунда, Рома закипает в 1,5 раза быстрее', () => {
  const results = {};
  for (let i = 0; i < 300; i++) {
    const L = new BaitLogic(new Rng('b' + i), { opp: 'igor' });
    const pick = new Rng('p' + i);
    let rounds = 0;
    while (!L.finished && rounds < 10) { L.playRoma(pick.pick(CATS)); if (!L.finished) L.playOpp(); L.endRound(); rounds++; }
    assert.ok(L.finished && rounds <= 4);
    results[L.result] = (results[L.result] || 0) + 1;
  }
  assert.ok(results.win > 30 && results.lose > 30, JSON.stringify(results));
  // на уроке каждая реплика добавляет подозрение
  const L = new BaitLogic(new Rng('lesson'), { opp: 'igor', inLesson: true, lessonMul: 1, startSuspicion: 0 });
  L.playRoma('weak');
  assert.ok(L.suspicionAdded >= 5 && L.suspicionAdded <= 15);
});

test('«Списывание»: осторожно — оценки 5–8 в среднем, жадно — риск директора', () => {
  const N = 20;
  const avg = (style) => { const r = Array.from({ length: N }, (_, i) => runCheat(i + 1, style)); return { avg: r.reduce((a, b) => a + b.grade, 0) / N, dir: r.filter((x) => x.director).length }; };
  const c = avg('cautious'), g = avg('greedy');
  assert.ok(c.avg >= 5 && c.avg <= 8, 'осторожно ' + c.avg);
  assert.equal(c.dir, 0);
  assert.ok(g.dir >= N * 0.3, 'жадно директоров ' + g.dir);
});
