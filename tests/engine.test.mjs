import test from 'node:test';
import assert from 'node:assert/strict';
import { Rng, rngFromCode, isValidSeed, normalizeSeed, generateSeedCode } from '../src/engine/rng.js';
import { REQUIRED_CHARS, hasGlyph, GLYPHS } from '../src/engine/font_glyphs.js';
import { wrapChars } from '../src/engine/font.js';
import { Tweener, Ease } from '../src/engine/tween.js';
import { createState, changeStat, formatMoney } from '../src/game/state.js';
import { BALANCE } from '../data/balance.js';

test('ГПСЧ: одинаковый сид — одинаковая последовательность', () => {
  const a = rngFromCode('ABCDEF'), b = rngFromCode('abcdef');
  const sa = Array.from({ length: 50 }, () => a.next());
  const sb = Array.from({ length: 50 }, () => b.next());
  assert.deepEqual(sa, sb);
  const c = rngFromCode('ABCDEG');
  assert.notDeepEqual(sa, Array.from({ length: 50 }, () => c.next()));
});

test('ГПСЧ: состояние сохраняется и восстанавливается', () => {
  const r = new Rng(42);
  r.next(); r.next();
  const s = r.getState();
  const x = [r.next(), r.int(1, 6)];
  const r2 = new Rng(0); r2.setState(s);
  assert.deepEqual([r2.next(), r2.int(1, 6)], x);
});

test('ГПСЧ: шанс 20 % примерно 20 %', () => {
  const r = new Rng('seat');
  let n = 0;
  for (let i = 0; i < 20000; i++) if (r.chance(0.2)) n++;
  assert.ok(Math.abs(n / 20000 - 0.2) < 0.015);
  for (let i = 0; i < 1000; i++) { const v = r.int(3, 5); assert.ok(v >= 3 && v <= 5); }
});

test('код дня', () => {
  for (let i = 0; i < 100; i++) assert.ok(isValidSeed(generateSeedCode()));
  assert.equal(normalizeSeed(' ab-cd ef9 '), 'ABCDEF');
  assert.equal(isValidSeed('ABCDE0'), false);
  assert.equal(isValidSeed('ABC'), false);
});

test('шрифт: есть все нужные символы, глифы 5×9', () => {
  const missing = [...REQUIRED_CHARS].filter((c) => !hasGlyph(c));
  assert.deepEqual(missing, []);
  for (const [ch, g] of Object.entries(GLYPHS)) {
    assert.equal(g.length, 9, ch);
    for (const row of g) assert.match(row, /^[#.]{5}$/, ch);
  }
});

test('шрифт: перенос по словам', () => {
  assert.deepEqual(wrapChars('Один день в гимназии', 10), ['Один день', 'в гимназии']);
  assert.deepEqual(wrapChars('Сверхдлинноеслово', 6), ['Сверхд', 'линное', 'слово']);
  assert.deepEqual(wrapChars('а\nб', 10), ['а', 'б']);
});

test('tween доходит до цели и вызывает колбэк', () => {
  const tw = new Tweener();
  const o = { x: 0 };
  let done = false;
  tw.add(o, { x: 10 }, 1, Ease.outQuad, () => { done = true; });
  for (let i = 0; i < 61; i++) tw.update(1 / 60);
  assert.equal(o.x, 10);
  assert.ok(done && !tw.busy);
});

test('состояние: стартовые значения из balance.js и ограничения', () => {
  const st = createState('ABCDEF');
  assert.equal(st.stats.battery, 34);
  assert.equal(st.stats.stress, 30);
  assert.equal(st.stats.aura, 50);
  assert.equal(st.stats.vapeCharge, 60);
  assert.equal(st.stats.juice, 2);
  assert.equal(st.stats.hunger, 40);
  assert.equal(st.stats.money, 600);
  assert.equal(changeStat(st, 'stress', 500), 70);
  assert.equal(st.stats.stress, 100);
  changeStat(st, 'battery', -999);
  assert.equal(st.stats.battery, 0);
  assert.equal(formatMoney(120), '1,20');
  assert.equal(formatMoney(5), '0,05');
  assert.equal(BALANCE.food.lunch.price, 350);
});
