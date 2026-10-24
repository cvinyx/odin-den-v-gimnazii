// Тесты этапа 6: концовки по порядку раздела 16, достижения (≥ 12, работают без localStorage),
// симулятор дня проходит день во всех трёх стилях и даёт одну из 5 концовок.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createState } from '../src/game/state.js';
import { pickEnding, ENDINGS, avgGrade } from '../src/game/endings.js';
import { ACHIEVEMENTS, checkAchievements } from '../src/game/achievements.js';
import { simDay } from '../tools/sim_day_lib.mjs';

function day(patch = {}) {
  const st = createState('KQ7M2P');
  st.phase = 'end';
  st.grades = [6, 6, 6, 6, 6, 6, 6];
  st.stats.aura = 50;
  Object.assign(st, patch);
  return st;
}

test('концовки проверяются по порядку раздела 16', () => {
  assert.equal(pickEnding(day({ directorCalls: 3 })), 'director');
  const perfect = day({ directorCalls: 0 }); perfect.stats.aura = 70; perfect.flags.matchResult = 1;
  assert.equal(pickEnding(perfect), 'perfect');
  perfect.grades = [5, 5, 5, 5, 5, 5, 6]; // средняя < 6 — уже не идеальный
  assert.notEqual(pickEnding(perfect), 'perfect');
  const legend = day({ wins: 5 }); legend.stats.aura = 85;
  assert.equal(pickEnding(legend), 'legend');
  legend.flags.matchResult = 1; legend.directorCalls = 0; // «Идеальный» проверяется раньше
  assert.equal(pickEnding(legend), 'perfect');
  assert.equal(pickEnding(day({ breakdowns: 2 })), 'drained');
  const dead = day(); dead.stats.battery = 0; dead.stats.money = 90;
  assert.equal(pickEnding(dead), 'drained');
  assert.equal(pickEnding(day()), 'chaos');
  assert.equal(avgGrade(day()), 6);
});

test('достижений не меньше 12, у всех имя и описание; без localStorage открываются без ошибок', () => {
  assert.ok(ACHIEVEMENTS.length >= 12);
  const ids = new Set();
  for (const a of ACHIEVEMENTS) { assert.ok(a.name && a.desc && a.test, a.id); assert.ok(!ids.has(a.id)); ids.add(a.id); }
  const st = day(); st.flags.metNikolai = true; st.flags.smileDiarrhea = true; st.flags.ending = 'chaos';
  const got = checkAchievements(st, true).map((a) => a.id);
  for (const id of ['grandpa', 'diarrhea', 'end_chaos', 'clean']) assert.ok(got.includes(id), id);
  assert.deepEqual(checkAchievements(st, true), []); // второй раз — не повторяются
  assert.ok(st.flags.achievementsToday.includes('grandpa'));
});

test('симулятор дня: все стили доходят до одной из 5 концовок', () => {
  for (const style of ['cautious', 'average', 'chaotic']) {
    for (const seed of ['KQ7M2P', 'ZT4H9W']) {
      const r = simDay(seed, style);
      assert.ok(ENDINGS.includes(r.ending), style + ' ' + r.ending);
      if (r.ending !== 'director') assert.equal(r.st.grades.filter((g) => g != null).length, 7, style);
      assert.ok(r.minutes > 20 && r.minutes < 90, 'минут ' + r.minutes);
    }
  }
});
