import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { CHARACTERS, STUDENT_ORDER, CLASSES, UNNAMED_POOL } from '../data/characters.js';
import { TEACHERS, TEACHER_ORDER, MALE_TEACHERS } from '../data/teachers.js';
import { buildSheetPixels, heightPx, FRAME_W, FRAME_H, keyColors } from '../src/gen/sprites.js';
import { buildPortraitPixels, EMOTIONS } from '../src/gen/portraits.js';
import { makeUnnamed, getPerson, visualKey } from '../src/gen/people.js';
import { Rng } from '../src/engine/rng.js';
import { root } from './helpers.mjs';

const NAMED_STUDENTS = ['roma', 'chernyak', 'igor', 'denis', 'levonchuk', 'bochko', 'shurpo', 'smile', 'vadim', 'anosov', 'vitalik', 'zakha', 'matych', 'buy', 'guza', 'vanya', 'svyat'];
const NAMED_TEACHERS = ['english', 'math', 'russian', 'belarusian', 'physics', 'ivan', 'social', 'history', 'chemistry', 'biology', 'informatics', 'geography', 'classteacher', 'olga', 'vasily', 'director'];

test('все именные персонажи (EDITS_V2: В-*, Н-*, У-1) есть в данных', () => {
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
  assert.deepEqual(CLASSES.U.sort(), ['svyat', 'vanya']);
});

test('Н-4: у всех именных учеников полное имя (имя и фамилия) и короткое имя', () => {
  const FULL = {
    smile: 'Максим Самойлик', buy: 'Никита Буевич', matych: 'Матвей Павочка', guza: 'Никита Гузаревич',
    anosov: 'Миша Аносов', zakha: 'Захар Корень', vadim: 'Вадим Семашко', vitalik: 'Виталий Дзитко',
    vanya: 'Ваня Максимов', svyat: 'Святослав Гулько',
  };
  for (const [id, p] of Object.entries(CHARACTERS)) {
    assert.ok(/^\S+ \S+$/.test(p.name), id + ': нет фамилии — ' + p.name);
    assert.ok(p.short && p.short.length <= 10, id);
  }
  for (const [id, name] of Object.entries(FULL)) assert.equal(CHARACTERS[id].name, name);
  assert.equal(CHARACTERS.anosov.short, 'Миша'); // в окне диалога — «Миша», не кличка
  assert.ok(CHARACTERS.anosov.nicknames.some((n) => n.name === 'Анус' && n.aboutOnly));
});

test('Н-3: клички (редкие отмечены)', () => {
  const nick = (id) => (CHARACTERS[id].nicknames || []).map((n) => n.name + (n.rare ? '*' : ''));
  assert.deepEqual(nick('roma'), ['Косой', 'Коган']);
  assert.deepEqual(nick('chernyak'), ['Чер']);
  assert.deepEqual(nick('shurpo'), ['Шар']);
  assert.deepEqual(nick('levonchuk'), ['Лёва']);
  assert.deepEqual(nick('denis'), ['Поп']);
  assert.deepEqual(nick('igor'), ['Сорняк*', 'Стояк*']);
  assert.deepEqual(nick('bochko'), ['Бочкин']);
  assert.deepEqual(nick('svyat'), ['Светик']);
  assert.deepEqual(nick('vanya'), ['Максим Иванов*']);
});

test('У-1: учителя — один на предмет, пол по списку, физрук Иван Владимирович, дедушка — Василий', () => {
  const subjects = ['english', 'math', 'russian', 'belarusian', 'physics', 'ivan', 'social', 'history', 'chemistry', 'biology', 'informatics', 'geography', 'classteacher'];
  for (const id of subjects) {
    const t = TEACHERS[id];
    assert.equal(!t.female, MALE_TEACHERS.includes(id), id + ': пол');
    assert.ok(/^\S+ \S+(вна|вич)$/.test(t.name), id + ': имя и отчество — ' + t.name);
  }
  assert.equal(TEACHERS.ivan.name, 'Иван Владимирович');
  assert.equal(TEACHERS.ivan.heightCm, 170);
  assert.equal(TEACHERS.ivan.mustache, 'stalin');
  assert.equal(TEACHERS.vasily.name, 'Василий');
  assert.equal(TEACHERS.vasily.heightCm, 192);
  // Василий как Артём, но седой
  for (const k of ['hairStyle', 'eyeColor', 'bigChin', 'build']) assert.equal(TEACHERS.vasily[k], CHARACTERS.levonchuk[k], k);
  const names = new Set(subjects.map((id) => TEACHERS[id].name));
  assert.equal(names.size, subjects.length);
});

test('рост по В-*: Вадим самый высокий из учеников, Денис, Шурпо и Святослав — самые низкие', () => {
  const cm = (id) => CHARACTERS[id].heightCm;
  const H = { roma: 183, igor: 175, denis: 173, levonchuk: 187, chernyak: 183, shurpo: 173, smile: 185, bochko: 185, matych: 187, buy: 187, guza: 187, vadim: 191, zakha: 175, vitalik: 185, anosov: 190, vanya: 187, svyat: 173 };
  for (const [id, h] of Object.entries(H)) assert.equal(cm(id), h, id);
  const all = NAMED_STUDENTS.map(cm);
  assert.equal(Math.max(...all), 191);
  assert.equal(Math.min(...all), 173);
  for (const id of NAMED_STUDENTS) assert.ok(heightPx(cm(id)) >= 22 && heightPx(cm(id)) <= 28);
  assert.ok(heightPx(130) < heightPx(160), 'дети ниже');
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
    const fr = (col, row) => { const a = []; for (let y = 0; y < FRAME_H; y++) for (let x = 0; x < FRAME_W; x++) a.push(sheet.get(col * FRAME_W + x, row * FRAME_H + y)); return a.join(','); };
    for (let row = 0; row < 4; row++) assert.notEqual(fr(0, row), fr(1, row), id + ' нет анимации');
  }
});

test('фирменные черты В-*: очки, кроссовки, кольцо, худи, майка, усы, гетерохромия', () => {
  const sp = (id, src = CHARACTERS) => buildSheetPixels(src[id]).data;
  const pt = (id, src = CHARACTERS) => buildPortraitPixels(src[id], 'norm').data;
  assert.ok(sp('roma').includes('#bfe3f7'), 'Рома: круглые очки');
  assert.ok(sp('bochko').includes('#2a2a33') && pt('bochko').includes('#22222a'), 'Коля: солнцезащитные очки');
  assert.ok(sp('bochko').includes('#e2b23a'), 'Коля: кольцо');
  for (const id of ['igor', 'denis', 'guza']) assert.ok(sp(id).includes('#f4f4f4'), id + ': три белые полоски');
  assert.ok(sp('buy').includes('#d0262e'), 'Буй: красные вставки');
  assert.ok(pt('buy').includes('#6b3e1e'), 'Буй: гетерохромия');
  assert.ok(sp('shurpo').includes('#a8a8b0'), 'Шурпо: молния худи');
  assert.ok(sp('smile').includes('#2f5fc8'), 'Смайл: синие кроссовки');
  assert.ok(sp('matych').includes('#3f9a4a'), 'Матыч: зелёные кроссовки');
  assert.ok(sp('chernyak').includes('#0b0b0d'), 'Черняк: ремень');
  assert.ok(pt('ivan', TEACHERS).includes('#cfcfd4'), 'Иван Владимирович: седой');
  assert.notEqual(pt('ivan', TEACHERS).join(), buildPortraitPixels({ ...TEACHERS.ivan, mustache: null }, 'norm').data.join(), 'усы');
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

test('ИС-17: доля школьной формы среди 500 безымянных — 65–75 %, форма по правилам', () => {
  const rng = new Rng('uniform-share');
  let n = 0;
  for (let i = 0; i < 500; i++) {
    const p = getPerson(makeUnnamed(rng, 'share'));
    if (p.uniform) {
      n++;
      assert.equal(p.shirtColor, UNNAMED_POOL.uniform.shirt);
      assert.equal(p.pantsColor, UNNAMED_POOL.uniform.bottom);
      assert.equal(p.tie, UNNAMED_POOL.uniform.tie);
      assert.ok(p.tieLogo);
    }
  }
  assert.ok(n >= 325 && n <= 375, 'в форме ' + n);
  // дети младших классов: 120–150 см и ниже старших
  const kid = getPerson(makeUnnamed(new Rng('kid'), 'kid', null, { kids: true }));
  assert.ok(kid.heightCm >= 120 && kid.heightCm <= 150 && kid.kid);
});

test('ИС-18: портрет безымянного строится из тех же параметров, что и спрайт (50 NPC)', () => {
  const rng = new Rng('portrait-match');
  for (let i = 0; i < 50; i++) {
    const id = makeUnnamed(rng, 'pm', null, { kids: i % 5 === 0 });
    const p = getPerson(id);
    const c = keyColors(p);
    const sheet = buildSheetPixels(p).data, portrait = buildPortraitPixels(p, 'norm').data;
    assert.ok(sheet.includes(c.hair) && portrait.includes(c.hair), id + ': волосы');
    assert.ok(sheet.includes(c.top) && portrait.includes(c.top), id + ': верх');
    assert.ok(sheet.includes(c.pants), id + ': низ');
  }
  // тот же id с новыми параметрами (новая перемена) — новый ключ картинок, старый спрайт не подставится
  const a = makeUnnamed(new Rng('same1'), 'x', 'fixed_npc'); const k1 = visualKey(a, getPerson(a));
  const b = makeUnnamed(new Rng('same2'), 'x', 'fixed_npc'); const k2 = visualKey(b, getPerson(b));
  assert.notEqual(k1, k2);
});

test('нигде в игре нет «Максим Аносов», «берсерк», «Бодак», «Виктор Сергеевич»', () => {
  const bad = /Максим Аносов|Аносов Максим|берсерк|Бодак|Виктор Сергеевич/i;
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
  const files = [...walk(path.join(root, 'src')), ...walk(path.join(root, 'data')), ...walk(path.join(root, 'tests')), path.join(root, 'README.md')]
    .filter((f) => /\.(js|mjs|txt|md)$/.test(f) && !f.endsWith('characters.test.mjs'));
  for (const f of files) assert.ok(!bad.test(fs.readFileSync(f, 'utf8')), path.relative(root, f));
  assert.ok(!bad.test(fs.readFileSync(path.join(root, 'dist/index.html'), 'utf8')), 'dist/index.html');
});
