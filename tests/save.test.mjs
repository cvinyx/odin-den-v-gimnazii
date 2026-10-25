import test from 'node:test';
import assert from 'node:assert/strict';
import { createState, changeStat } from '../src/game/state.js';
import { encodeSaveCode, decodeSaveCode, storeGet, storeSet, autosave, loadAutosave } from '../src/engine/save.js';

function sample() {
  const st = createState('K7PQ2Z');
  changeStat(st, 'aura', 17);
  changeStat(st, 'money', -133);
  st.grades = [7, 5];
  st.debts = [{ to: 'igor', amount: 150 }];
  st.flags = { met_igor: true, 'x.y': false };
  st.locationName = 'Каб. 404 «И»';
  st.pos = { x: 123, y: 45, dir: 'left' };
  return st;
}

test('сохранение → код → загрузка даёт то же состояние', () => {
  const st = sample();
  const code = encodeSaveCode(st);
  assert.match(code, /^ODG1-[A-Za-z0-9+/]+-[0-9A-Z]{7}$/);
  const res = decodeSaveCode(code);
  assert.equal(res.ok, true, res.error);
  assert.deepEqual(res.state, st);
});

test('код с пробелами и переносами строк тоже читается', () => {
  const code = encodeSaveCode(sample());
  const messy = '  ' + code.slice(0, 20) + '\n' + code.slice(20) + ' ';
  assert.equal(decodeSaveCode(messy).ok, true);
});

test('испорченный код не роняет игру и даёт понятную ошибку', () => {
  const code = encodeSaveCode(sample());
  const broken = [
    '', 'привет', 'ODG1-abc', code.slice(0, -1) + (code.endsWith('A') ? 'B' : 'A'),
    code.replace('ODG1', 'ODG9'), code.slice(0, 30) + 'Z' + code.slice(31),
    'ODG1-%%%%-0000000', 'ODG1-' + Buffer.from('{"v":1').toString('base64').replace(/=+$/, '') + '-0000000', null, undefined, 12345,
  ];
  for (const b of broken) {
    const res = decodeSaveCode(b);
    assert.equal(res.ok, false, 'должен быть отказ для ' + String(b).slice(0, 40));
    assert.equal(typeof res.error, 'string');
    assert.ok(res.error.length > 5);
  }
});

test('правильная контрольная сумма, но неверные данные — тоже отказ', async () => {
  const { crc32 } = await import('../src/engine/save.js');
  const body = Buffer.from('{"v":1,"s":"AAAAAA"}').toString('base64').replace(/=+$/, '');
  const sum = crc32(body).toString(36).toUpperCase().padStart(7, '0');
  const res = decodeSaveCode(`ODG1-${body}-${sum}`);
  assert.equal(res.ok, false);
  // V2-2: код версии 1 (один день) — отдельное сообщение «Сохранение от старой версии»
  assert.match(res.error, /Сохранение от старой версии/);
  const body2 = Buffer.from('{"v":2,"s":"AAAAAA"}').toString('base64').replace(/=+$/, '');
  const res2 = decodeSaveCode(`ODG1-${body2}-${crc32(body2).toString(36).toUpperCase().padStart(7, '0')}`);
  assert.equal(res2.ok, false);
  assert.match(res2.error, /не подходит/);
});

test('без localStorage игра не падает', () => {
  assert.equal(storeGet('x', 'fallback'), 'fallback');
  assert.equal(storeSet('x', 1), false);
  assert.equal(autosave(sample()), false);
  assert.equal(loadAutosave(), null);
});

test('localStorage, который бросает исключения, тоже не роняет', () => {
  globalThis.localStorage = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('quota'); }, removeItem() { throw new Error('x'); } };
  try {
    assert.equal(storeGet('x', 5), 5);
    assert.equal(storeSet('x', 1), false);
  } finally { delete globalThis.localStorage; }
});

test('localStorage: автосохранение и загрузка', () => {
  const mem = new Map();
  globalThis.localStorage = { getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k) };
  try {
    const st = sample();
    assert.equal(autosave(st), true);
    assert.deepEqual(loadAutosave(), st);
  } finally { delete globalThis.localStorage; }
});
