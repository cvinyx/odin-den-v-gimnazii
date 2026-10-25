// Тесты этапа 5: «Эль-Класико». Составы строго по разделу 15 (5 на 5, без безымянных), замены и диарея,
// мяч не улетает за поле, никто не застревает в углах, баланс 30 матчей «ИИ против ИИ».
import test from 'node:test';
import assert from 'node:assert/strict';
import { MatchLogic } from '../src/football/match.js';
import { Rng } from '../src/engine/rng.js';
import { CHARACTERS } from '../data/characters.js';
import { runMatch } from '../tools/balance_football_lib.mjs';

const ids = (M, team) => M.team(team).map((q) => q.id).sort();
function play(M, until) {
  for (let i = 0; i < 60 * 400 && !until(M); i++) { M.update(1 / 60, null); M.events.length = 0; }
}

test('составы по разделу 15: 5 на 5, вратари Смайл и Буй, без безымянных', () => {
  const M = new MatchLogic(new Rng('t1'), { aiRoma: true, diarrhea: false });
  assert.deepEqual(ids(M, 'fizmat'), ['chernyak', 'shurpo', 'smile', 'vadim', 'vitalik']);
  assert.deepEqual(ids(M, 'inyaz'), ['buy', 'denis', 'igor', 'matych', 'roma']);
  assert.equal(M.keeperOf('fizmat').id, 'smile');
  assert.equal(M.keeperOf('inyaz').id, 'buy');
  assert.deepEqual(M.bench.fizmat, ['bochko', 'zakha']);
  assert.deepEqual(M.bench.inyaz, ['guza']);
  for (const q of M.players) assert.ok(CHARACTERS[q.id], q.id);
});

test('2-й тайм: Коля вместо Вадима, Гуза вместо Матыча; диарея в 1-м тайме — Коля в воротах, потом Заха вместо Вадима', () => {
  const M = new MatchLogic(new Rng('t2'), { aiRoma: true, diarrhea: false });
  play(M, (m) => m.state === 'halftime');
  M.secondHalf('none');
  assert.deepEqual(ids(M, 'fizmat'), ['bochko', 'chernyak', 'shurpo', 'smile', 'vitalik']);
  assert.deepEqual(ids(M, 'inyaz'), ['buy', 'denis', 'guza', 'igor', 'roma']);
  const D = new MatchLogic(new Rng('t3'), { aiRoma: true, diarrhea: true });
  D.diarrheaAt = 5;
  play(D, (m) => m.smileGone);
  assert.equal(D.keeperOf('fizmat').id, 'bochko');
  play(D, (m) => m.state === 'halftime');
  D.secondHalf('none');
  assert.deepEqual(ids(D, 'fizmat'), ['bochko', 'chernyak', 'shurpo', 'vitalik', 'zakha']);
  assert.equal(D.keeperOf('fizmat').id, 'bochko');
  play(D, (m) => m.state === 'end');
  assert.equal(D.lineupErrors.length, 0);
});

test('перерыв влияет на 2-й тайм: «Галатасарай» — ярость Игоря, «Барса» — Денис сильнее', () => {
  const M = new MatchLogic(new Rng('t4'), { aiRoma: true, diarrhea: false });
  play(M, (m) => m.state === 'halftime');
  M.secondHalf('igor');
  assert.ok(M.players.find((q) => q.id === 'igor').rage > 0);
  const N = new MatchLogic(new Rng('t5'), { aiRoma: true, diarrhea: false });
  play(N, (m) => m.state === 'halftime');
  N.secondHalf('barca');
  assert.equal(N.players.find((q) => q.id === 'denis').skill, 7);
});

test('30 матчей «ИИ против ИИ»: 2–6 голов в среднем, никто не выигрывает > 70 %, 0:0 ≤ 15 %, без застреваний', () => {
  const N = 30;
  let goals = 0, nil = 0;
  const res = { win: 0, draw: 0, lose: 0 };
  for (let i = 1; i <= N; i++) {
    const r = runMatch(i);
    res[r.result]++;
    const g = r.score.inyaz + r.score.fizmat;
    goals += g; if (!g) nil++;
    assert.deepEqual(r.issues, [], 'матч ' + i);
    assert.deepEqual(r.lineupErrors, [], 'матч ' + i);
    assert.ok(r.minGap > 1.5, 'игроки проходят сквозь друг друга: ' + r.minGap);
  }
  const avg = goals / N;
  assert.ok(avg >= 2 && avg <= 6, 'голов в среднем ' + avg);
  assert.ok(res.win / N <= 0.7 && res.lose / N <= 0.7, JSON.stringify(res));
  assert.ok(nil / N <= 0.15, '0:0 — ' + nil);
});

test('итог матча для Ромы: победа/ничья/поражение по счёту', () => {
  const M = new MatchLogic(new Rng('t6'), { aiRoma: true });
  M.score = { inyaz: 2, fizmat: 1 }; assert.equal(M.result(), 'win');
  M.score = { inyaz: 1, fizmat: 1 }; assert.equal(M.result(), 'draw');
  M.score = { inyaz: 0, fizmat: 3 }; assert.equal(M.result(), 'lose');
});

test('диарея перед самым перерывом: замена вратаря успевает, состав не ломается (40 матчей)', () => {
  for (let i = 1; i <= 40; i++) {
    const M = new MatchLogic(new Rng('d' + i), { aiRoma: true, diarrhea: true, rageStart: i % 2 === 0 });
    M.diarrheaAt = 80 + i * 0.25; // как раз под конец 1-го тайма
    for (let f = 0; f < 60 * 400 && M.state !== 'end'; f++) {
      M.update(1 / 60, null);
      for (const e of M.events) if (e.type === 'halftime') M.secondHalf('none');
      M.events.length = 0;
    }
    assert.deepEqual(M.lineupErrors, [], 'матч ' + i);
  }
});
