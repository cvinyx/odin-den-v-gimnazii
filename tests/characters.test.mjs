import test from 'node:test';
import assert from 'node:assert/strict';
import { CHARACTERS, STUDENT_ORDER, CLASSES } from '../data/characters.js';
import { TEACHERS, TEACHER_ORDER } from '../data/teachers.js';
import { buildSheetPixels, heightPx, FRAME_W, FRAME_H } from '../src/gen/sprites.js';
import { buildPortraitPixels, EMOTIONS } from '../src/gen/portraits.js';

const NAMED_STUDENTS = ['roma', 'chernyak', 'igor', 'denis', 'levonchuk', 'bochko', 'shurpo', 'smile', 'vadim', 'anus', 'vitalik', 'zakha', 'matych', 'buy', 'guza'];
const NAMED_TEACHERS = ['elena', 'tatiana', 'svetlana', 'oleg', 'viktor', 'galina', 'valentina', 'natalia', 'olga', 'marina', 'lyudmila', 'andrey', 'nikolai', 'director'];

test('все именные персонажи разделов 9 и 10 есть в данных', () => {
  for (const id of NAMED_STUDENTS) assert.ok(CHARACTERS[id], id);
  for (const id of NAMED_TEACHERS) assert.ok(TEACHERS[id], id);
  assert.deepEqual([...STUDENT_ORDER].sort(), [...NAMED_STUDENTS].sort());
  assert.deepEqual([...TEACHER_ORDER].sort(), [...NAMED_TEACHERS].sort());
  for (const p of [...Object.values(CHARACTERS), ...Object.values(TEACHERS)]) {
    assert.ok(p.blip && p.blip.freq > 0, p.name + ' без тона блипа');
  }
  for (const id of Object.keys(CHARACTERS)) {
    const cls = Object.entries(CLASSES).find(([, ids]) => ids.includes(id));
    assert.ok(cls, id + ' без класса');
  }
});

test('рост: Левончук самый высокий, Денис самый низкий из друзей', () => {
  const h = (id) => heightPx(CHARACTERS[id].heightCm);
  assert.equal(h('levonchuk'), 28);
  assert.equal(h('denis'), 22);
  assert.ok(h('roma') > h('igor'));
  for (const id of NAMED_STUDENTS) assert.ok(h(id) >= 22 && h(id) <= 28);
});

test('спрайты: 4 направления × 3 кадра, все персонажи различаются', () => {
  const seen = new Map();
  for (const [id, p] of [...Object.entries(CHARACTERS), ...Object.entries(TEACHERS)]) {
    if (p.voiceOnly) continue;
    const sheet = buildSheetPixels(p);
    assert.equal(sheet.w, FRAME_W * 3);
    assert.equal(sheet.h, FRAME_H * 4);
    const key = sheet.data.join(',');
    assert.ok(!seen.has(key), `${id} совпадает с ${seen.get(key)}`);
    seen.set(key, id);
    // кадры ходьбы отличаются от кадра стояния
    const fr = (col, row) => { const a = []; for (let y = 0; y < FRAME_H; y++) for (let x = 0; x < FRAME_W; x++) a.push(sheet.get(col * FRAME_W + x, row * FRAME_H + y)); return a.join(','); };
    for (let row = 0; row < 4; row++) assert.notEqual(fr(0, row), fr(1, row), id + ' нет анимации');
  }
});

test('силуэты: у фирменных черт есть пиксели', () => {
  const front = (id) => buildSheetPixels(CHARACTERS[id]);
  // очки Коли — чёрные пиксели на уровне глаз
  const kolya = front('bochko');
  assert.ok(kolya.data.includes('#141414'));
  // логотип Supreme у Шурпо
  assert.ok(front('shurpo').data.includes('#d3202b'));
});

test('портреты 48×48 во всех эмоциях, эмоции различаются', () => {
  for (const [id, p] of [...Object.entries(CHARACTERS), ...Object.entries(TEACHERS)]) {
    const variants = new Set();
    for (const e of EMOTIONS) {
      const px = buildPortraitPixels(p, e);
      assert.equal(px.w, 48);
      variants.add(px.data.join(','));
    }
    if (!p.voiceOnly) assert.equal(variants.size, EMOTIONS.length, id);
  }
});
