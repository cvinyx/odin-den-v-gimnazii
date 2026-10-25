// Тесты этапа V2-6 «Перемены: диалоги и рейджбайт»: пул разговоров (≥ 20 у каждого именного), реакции, групповые
// сценки (≥ 15), футбольные споры (Ф-11), молчуны (Ф-12), рейджбайт (≥ 200 фраз, ≥ 12 личных и ≥ 8 ответных на
// каждого из списка ИС-7), Миша Аносов без «Анус» (Н-4), сплетни ≥ 60, не повторяются за неделю.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { parseDialog } from '../src/ui/dialog_script.js';
import { BAIT_LIST } from '../data/rules.js';
import { CHARACTERS } from '../data/characters.js';
import { TEACHERS } from '../data/teachers.js';
import { GROUP_SCENES, FOOTBALL_SCENES, FOOTBALL_PRO, FOOTBALL_SILENT } from '../data/groups.js';
import { pickTalk, reactionKeys, footballContext } from '../src/game/talks.js';
import { createState } from '../src/game/state.js';
import { startDay, setDay } from '../src/game/day.js';
import { daySchedule } from '../data/schedule.js';
import { CLASS_OF } from '../data/npc_schedule.js';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const read = (f) => fs.readFileSync(path.join(root, 'data/dialogs', f + '.txt'), 'utf8');
const speakers = (id) => id === 'opp' || id in CHARACTERS || id in TEACHERS;
const load = (f) => parseDialog(read(f), { speakers });
const NAMED = Object.keys(CHARACTERS).filter((id) => id !== 'roma');
const lines = (d, labs) => labs.flatMap((l) => (d.labels[l] ? d.labels[l].cmds.filter((c) => c.type === 'say') : []));

test('у каждого именного ученика ≥ 20 разговоров на перемене; парсер без ошибок', () => {
  for (const id of NAMED) {
    const d = load('talk_' + id);
    assert.deepEqual(d.errors, [], id);
    const ts = Object.keys(d.labels).filter((l) => /^t\d+$/.test(l));
    assert.ok(ts.length >= 20, `${id}: ${ts.length}`);
    assert.equal(new Set(ts.flatMap((l) => lines(d, [l]).map((x) => x.text))).size >= 20, true);
  }
  assert.deepEqual(load('react').errors, []);
  for (const k of ['grades_good', 'grades_bad', 'match_win', 'match_lose', 'rage', 'shame', 'director', 'debts']) assert.ok(load('react').labels[`r_${k}_1`], k);
});

test('групповые сценки: ≥ 15, по 2–4 персонажа; футбольные споры — только Шурпо, Черняк, Денис, Смайл, Гуза', () => {
  const g = load('group');
  assert.deepEqual(g.errors, []);
  const ids = Object.keys(GROUP_SCENES);
  assert.ok(ids.length >= 15, String(ids.length));
  for (const l of ids) { assert.ok(g.labels[l], l); assert.ok(GROUP_SCENES[l].length >= 2 && GROUP_SCENES[l].length <= 4, l); }
  const f = load('football_talk');
  assert.deepEqual(f.errors, []);
  assert.ok(Object.keys(FOOTBALL_SCENES).length >= 10);
  for (const [l, who] of Object.entries(FOOTBALL_SCENES)) {
    assert.ok(f.labels[l], l);
    for (const x of who) assert.ok(FOOTBALL_PRO.includes(x), `${l}: ${x}`);
    for (const c of f.labels[l].cmds.filter((c) => c.type === 'say' && c.who !== 'narrator')) assert.ok(FOOTBALL_PRO.includes(c.who), `${l}: говорит ${c.who}`);
  }
  // остальные именные про клубы не говорят (личные пулы)
  for (const id of NAMED.filter((x) => !FOOTBALL_PRO.includes(x))) {
    const d = load('talk_' + id);
    for (const c of lines(d, Object.keys(d.labels))) assert.ok(!/реал\b|барс|«реал»|мадрид/i.test(c.text), `${id}: ${c.text}`);
  }
});

test('Ф-12: молчуны Заха, Виталик, Вадим, Миша — метка silent; в футбольные споры не вступают', () => {
  for (const id of FOOTBALL_SILENT) assert.ok(load('talk_' + id).labels.silent, id);
  for (const w of Object.values(FOOTBALL_SCENES)) for (const id of FOOTBALL_SILENT) assert.ok(!w.includes(id));
});

test('рейджбайт: ≥ 200 фраз; у каждого из списка ИС-7 ≥ 12 личных (против него) и ≥ 8 ответных', () => {
  let total = 0;
  for (const id of BAIT_LIST) {
    const d = load('bait_' + id);
    assert.deepEqual(d.errors, [], id);
    const mine = lines(d, ['roma_weak', 'roma_mid', 'roma_strong', 'roma_weird']).length;
    const his = lines(d, ['opp_retort', 'opp_hit', 'opp_shrug']).length;
    assert.ok(mine >= 12, `${id}: личных ${mine}`);
    assert.ok(his >= 8, `${id}: ответных ${his}`);
    for (const l of ['intro', 'opp_boil', 'opp_win']) assert.ok(d.labels[l], `${id}: нет ${l}`);
    total += mine + his;
  }
  const common = load('bait_common');
  total += lines(common, Object.keys(common.labels)).length;
  assert.ok(total >= 200, String(total));
  assert.ok(load('bait_kid5').labels.roma_weak && load('classhour').labels.reply, 'отдельные пулы: пятиклассник, классный час');
});

test('Н-4: Мише Аносову — только «Миша»/«Аносов»; слово «Анус» только когда его самого нет рядом', () => {
  for (const f of ['talk_anosov', 'bait_anosov']) assert.ok(!/анус/i.test(read(f)), f);
  const g = load('group');
  for (const [l, who] of Object.entries(GROUP_SCENES)) {
    const text = lines(g, [l, l + '_1', l + '_2']).map((c) => c.text).join(' ');
    if (who.includes('anosov')) assert.ok(!/анус/i.test(text), l);
  }
  for (const f of ['react', 'football_talk', 'gossip']) assert.ok(!/анус/i.test(read(f)), f);
  // реплики, адресованные Мише в чужих файлах разговоров (talk_*): нет «Анус» вообще
  for (const id of NAMED) assert.ok(!/анус/i.test(read('talk_' + id)), id);
});

test('сплетни безымянных ≥ 60', () => {
  const g = load('gossip');
  assert.deepEqual(g.errors, []);
  assert.ok(Object.keys(g.labels).filter((l) => /^g\d+$/.test(l)).length >= 60);
});

test('выбор разговора: за неделю метки не повторяются, реакции и футбол по условиям', () => {
  const labels = {};
  const L = (id) => ({
    talk: Object.keys(load('talk_' + id).labels).filter((l) => /^t\d+$/.test(l)), hasSilent: !!load('talk_' + id).labels.silent,
    react: Object.keys(load('react').labels), football: Object.keys(FOOTBALL_SCENES), group: Object.keys(GROUP_SCENES),
  });
  for (const seed of ['KQ7M2P', 'ZT4H9W']) {
    const st = createState(seed);
    const seen = new Set();
    for (let day = 1; day <= 5; day++) {
      if (day > 1) startDay(st, day); else setDay(1);
      for (let b = 1; b <= 6; b++) {
        st.phase = 'break'; st.lesson = b;
        for (const id of ['igor', 'chernyak', 'vanya']) {
          labels[id] = labels[id] || L(id);
          const p = pickTalk(st, id, labels[id], NAMED);
          // пока пул не исчерпан (20 разговоров), повторов нет
          if (p.kind === 'talk') { const key = `${id}:${p.label}`; const n = [...seen].filter((k) => k.startsWith(id + ':')).length; if (n < 20) assert.ok(!seen.has(key), `повтор ${key}`); seen.add(key); }
        }
      }
    }
  }
  // реакции
  const st = createState('REACT'); st.grades = [9, 9, 8]; st.flags.igorRage = true; st.debts = [{ to: 'igor', amount: 100 }]; st.flags.matchResult = 1;
  assert.deepEqual(reactionKeys(st).sort(), ['debts', 'grades_good', 'match_win', 'rage']);
  // футбол: вторник перед физрой — Шурпо/Денис получают спор, молчуны — silent; в понедельник — нет
  startDay(st, 2);
  const s = daySchedule(2, 'M'); const b = s.findIndex((l) => l.subjectId === 'pe_football');
  st.phase = 'break'; st.lesson = b; // перемена перед физрой
  assert.equal(footballContext(st, 'shurpo'), 'pre');
  assert.equal(pickTalk(st, 'zakha', { ...L('zakha') }, NAMED).kind, 'silent');
  let ft = 0;
  for (let i = 0; i < 20; i++) { st.week.groupSeen = []; if (pickTalk(st, 'denis', L('denis'), NAMED).kind === 'football') ft++; }
  assert.ok(ft >= 10, 'футбольных споров ' + ft);
  startDay(st, 1);
  st.phase = 'break'; st.lesson = 2;
  assert.notEqual(pickTalk(st, 'denis', L('denis'), NAMED).kind, 'football');
  setDay(1);
});
