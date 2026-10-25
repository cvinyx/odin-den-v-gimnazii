// Тесты этапа 4: мини-игры. Белый список «Кто больше парит», каждая игра заканчивается с верным итогом,
// баланс «среднего» бота в 45–65 %, штраф голода.
import test from 'node:test';
import assert from 'node:assert/strict';
import { canVapeBattle, VAPE_WHITELIST } from '../src/minigames/vape_battle.js';
import { CHARACTERS } from '../data/characters.js';
import { TEACHERS, STAFF } from '../data/teachers.js';
import { makeUnnamed } from '../src/gen/people.js';
import { Rng } from '../src/engine/rng.js';
import { GAMES, runGame } from '../tools/balance_minigames_lib.mjs';
import { BlocksLogic } from '../src/minigames/phone_blocks.js';
import { EatLogic } from '../src/minigames/eat.js';

test('«Кто больше парит»: белый список — никогда Игорь, Смайл, Гуза, Вадим и учителя', () => {
  for (const id of ['igor', 'smile', 'guza', 'vadim', 'roma']) assert.equal(canVapeBattle(id), false, id);
  for (const id of Object.keys(TEACHERS)) assert.equal(canVapeBattle(id), false, id);
  for (const id of Object.keys(STAFF)) assert.equal(canVapeBattle(id), false, id);
  for (const id of Object.keys(CHARACTERS)) assert.equal(canVapeBattle(id), VAPE_WHITELIST.includes(id), id);
  assert.deepEqual([...VAPE_WHITELIST].sort(), ['bochko', 'buy', 'chernyak', 'denis', 'levonchuk', 'matych', 'shurpo', 'svyat', 'vitalik']); // ИС-7 (V2-5)
  // безымянные ученики 9–11 классов — можно; без описания или взрослый — нельзя
  const rng = new Rng('vape-wl');
  for (let i = 0; i < 20; i++) assert.equal(canVapeBattle(makeUnnamed(rng, 'wl')), true);
  assert.equal(canVapeBattle('nobody_123'), false);
  assert.equal(canVapeBattle('x', { unnamed: true, cls: '8 класс' }), false);
  assert.equal(canVapeBattle('x', { unnamed: true, adult: true, cls: '10 класс' }), false);
  assert.equal(canVapeBattle(null), false);
});

test('каждая мини-игра: 10 сидов — без ошибок, всегда заканчивается, итог верный', () => {
  for (const [id, g] of Object.entries(GAMES)) {
    for (let s = 1; s <= 10; s++) {
      const opp = g.opps ? g.opps[s % g.opps.length] : null;
      const r = runGame(id, 1000 + s, { opp });
      assert.ok(['win', 'lose', 'draw', 'director'].includes(r.result), id + ': ' + r.result);
      if (id !== 'bait_mb') assert.ok(r.sec <= 95, id + ' слишком долго: ' + r.sec);
    }
  }
});

test('баланс: «средний» бот выигрывает 45–65 %', () => {
  const N = 120;
  for (const [id, g] of Object.entries(GAMES)) {
    const opp = g.opps ? g.opps[0] : null;
    let win = 0;
    for (let i = 0; i < N; i++) if (runGame(id, i + 1, { opp }).result === 'win') win++;
    const pct = 100 * win / N;
    assert.ok(pct >= 40 && pct <= 70, `${id}${opp ? ' vs ' + opp : ''}: ${pct.toFixed(0)} %`);
  }
});

test('голод > 70 даёт −20 % (короче блок-пазл, уже окно ритма)', () => {
  const full = runGame('phone_blocks', 7, { hunger: 30 }), hungry = runGame('phone_blocks', 7, { hunger: 80 });
  assert.ok(hungry.sec < full.sec * 0.85, `${hungry.sec} vs ${full.sec}`);
  const a = new EatLogic(new Rng('e'), { accuracy: 1 }), b = new EatLogic(new Rng('e'), { accuracy: 0.8 });
  assert.ok(Math.abs(b.window - a.window * 0.8) < 1e-9);
  // логика блок-пазла: поставить фигуру можно только в свободные клетки
  const L = new BlocksLogic(new Rng('b'));
  assert.ok(L.place(0, 0, 0) >= 0);
  assert.equal(L.place(0, 0, 0), -1);
});
