// Тесты этапа 6: концовки по порядку раздела 16, достижения (≥ 12, работают без localStorage),
// симулятор проходит неделю во всех трёх стилях и даёт одну из 4 концовок недели (V2-2).
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

// V2-2: старые 5 концовок дня заменены 4 концовками недели (ИС-5, Р-5) — тест обновлён под новое правило.
test('концовки недели — по среднему баллу за неделю', () => {
  const st = day();
  st.grades = [9, 9, 9, 9, 9, 9, 9];
  assert.equal(pickEnding(st), 'pride');
  st.grades = [6, 6, 6, 6, 6, 6, 6];
  assert.equal(pickEnding(st), 'bntu');
  st.grades = [5, 5, 4];
  assert.equal(pickEnding(st), 'habza');
  st.grades = [2, 3];
  assert.equal(pickEnding(st), 'dad');
  assert.equal(avgGrade(day()), 6);
  assert.deepEqual(ENDINGS, ['pride', 'bntu', 'habza', 'dad']);
});

test('достижений не меньше 12, у всех имя и описание; без localStorage открываются без ошибок', () => {
  assert.ok(ACHIEVEMENTS.length >= 12);
  const ids = new Set();
  for (const a of ACHIEVEMENTS) { assert.ok(a.name && a.desc && a.test, a.id); assert.ok(!ids.has(a.id)); ids.add(a.id); }
  const st = day(); st.flags.metVasily = true; st.flags.smileDiarrhea = true; st.flags.ending = 'habza';
  const got = checkAchievements(st, true).map((a) => a.id);
  for (const id of ['grandpa', 'diarrhea', 'end_habza', 'clean']) assert.ok(got.includes(id), id);
  assert.deepEqual(checkAchievements(st, true), []); // второй раз — не повторяются
  assert.ok(st.flags.achievementsToday.includes('grandpa'));
});

test('симулятор недели: все стили доходят до одной из 4 концовок', () => {
  for (const style of ['cautious', 'average', 'chaotic']) {
    for (const seed of ['KQ7M2P', 'ZT4H9W']) {
      const r = simDay(seed, style);
      assert.ok(ENDINGS.includes(r.ending), style + ' ' + r.ending);
      assert.equal(r.st.day, 5);
      for (let d = 0; d < 4; d++) assert.ok(r.st.week.grades[d].length >= 6, `${style}: день ${d + 1} — ${r.st.week.grades[d]}`);
      assert.equal(r.st.week.busSeen.length, 5);
      assert.equal(new Set(r.st.week.busSeen).size, 5, 'автобус без повторов');
      assert.ok(r.minutes > 20 && r.minutes < 90, 'минут ' + r.minutes);
    }
  }
});
