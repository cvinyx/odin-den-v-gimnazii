// Тесты этапа V2-2 «Неделя»: условия расписания У-2, границы концовок (Р-5), перенос между днями (Р-2),
// код сохранения посреди среды, оценки без оценки и минимальные (Р-6, Р-7), дорога домой и утро.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { WEEK, SUBJECTS, daySchedule, BELLS } from '../data/schedule.js';
import { createState, changeStat, scriptStatValue } from '../src/game/state.js';
import { startDay, setDay, lessonInfo, finishLesson, startBreak, noGradeLessons, lessonGraded, minGrade, weekAverage, endDayEarly, startLesson } from '../src/game/day.js';
import { endingForAverage, pickEnding } from '../src/game/endings.js';
import { encodeSaveCode, decodeSaveCode } from '../src/engine/save.js';
import { parseDialog } from '../src/ui/dialog_script.js';
import { DialogRunner } from '../src/game/dialog_runner.js';
import { BALANCE } from '../data/balance.js';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const dialog = (name) => parseDialog(fs.readFileSync(path.join(root, 'data/dialogs', name + '.txt'), 'utf8'));
const count = (days, id) => days.flat().filter((x) => x === id).length;
const SEEDS = ['KQ7M2P', 'ZT4H9W', 'AAAAAA', 'B7C8D9', 'Q2W3E4', 'HHHHHH'];

test('расписание 11 «И»: все условия У-2', () => {
  const W = WEEK.I;
  assert.equal(W.length, 5);
  for (const d of W) assert.ok(d.length >= 6 && d.length <= 7, 'в дне 6–7 уроков');
  assert.equal(count(W, 'russian'), 3, 'русский 3 раза');
  assert.equal(count(W, 'belarusian'), 1, 'белорусский 1 раз');
  W.forEach((d, i) => assert.equal(d.includes('english'), i !== 2, 'английский каждый день, кроме среды'));
  assert.equal(count(W, 'algebra'), 2);
  assert.equal(count(W, 'geometry'), 1);
  assert.ok(W[1].includes('pe_football') && W[4].includes('pe_football'), 'футбол во вторник и пятницу');
  assert.equal(count(W, 'pe_football'), 2);
  assert.ok(W[3].includes('pe_swim') && count(W, 'pe_swim') === 1, 'плавание в четверг');
  assert.equal(count(W, 'biology'), 2);
  assert.equal(count(W, 'hist_by'), 1);
  assert.equal(count(W, 'hist_world'), 1);
  assert.ok(W[1].includes('informatics') && count(W, 'informatics') === 1, 'информатика во вторник');
  assert.equal(count(W, 'chemistry'), 2);
  assert.equal(count(W, 'physics'), 2);
  assert.equal(count(W, 'astronomy'), 1);
  assert.equal(W[4][2], 'social', 'обществоведение — пятница, 3-й урок');
  assert.equal(W[4][W[4].length - 1], 'classhour', 'классный час — последний в пятницу');
  assert.ok(W[4].indexOf('pe_football') < W[4].indexOf('classhour'), 'классный час после футбола');
  // остальные классы — тоже 5 дней по 6–7 уроков, футбол «Физмата» в те же уроки, что и у «И»
  for (const c of ['M', 'Ya', 'U']) for (const d of WEEK[c]) { assert.ok(d.length >= 6 && d.length <= 7); for (const s of d) assert.ok(SUBJECTS[s], s); }
  for (const d of [1, 4]) assert.equal(WEEK.M[d].indexOf('pe_football'), WEEK.I[d].indexOf('pe_football'), 'Эль-Класико: оба класса на физре');
  // звонки: как в версии 1, 7-й урок 14:40–15:25
  assert.deepEqual(BELLS[6], { start: '14:40', end: '15:25' });
  // у каждого урока — учитель, файл и мини-игра
  for (let d = 1; d <= 5; d++) for (const l of daySchedule(d)) assert.ok(l.teacher && l.file && l.minigame, `${d}: ${l.subject}`);
});

test('концовки: границы 8,0 / 6,0 / 4,0 (Р-5)', () => {
  assert.equal(endingForAverage(8.01), 'pride');
  assert.equal(endingForAverage(8.0), 'bntu');
  assert.equal(endingForAverage(6.0), 'bntu');
  assert.equal(endingForAverage(5.99), 'habza');
  assert.equal(endingForAverage(4.0), 'habza');
  assert.equal(endingForAverage(3.99), 'dad');
  assert.equal(endingForAverage(0), 'dad');
  // средний — только по выставленным оценкам, прочерки не считаются
  const st = createState('KQ7M2P');
  st.week.grades[0] = [8, null, 8, 8];
  st.day = 2; st.grades = [null, 8];
  assert.equal(weekAverage(st), 8);
  assert.equal(pickEnding(st), 'bntu');
});

test('переход к следующему дню: что переносится, что сбрасывается (Р-2)', () => {
  for (const seed of SEEDS) {
    const st = createState(seed);
    changeStat(st, 'money', 1234);
    changeStat(st, 'aura', 13);
    st.stats.juice = 2;
    st.debts = [{ to: 'igor', amount: 70 }];
    st.grades = [7, 5, null, 6, 4, 9];
    st.stats.suspicion = 55; st.stats.stress = 90; st.stats.hunger = 99; st.directorCalls = 2;
    st.flags = { matchScore: '3:1', matchResult: 1, met_igor: true };
    const money = st.stats.money, aura = st.stats.aura;
    startDay(st, 2);
    assert.equal(st.day, 2);
    assert.equal(st.stats.money, money);
    assert.equal(st.stats.aura, aura);
    assert.equal(st.stats.juice, 2);
    assert.deepEqual(st.debts, [{ to: 'igor', amount: 70 }]);
    assert.deepEqual(st.week.grades[0], [7, 5, null, 6, 4, 9], 'оценки понедельника сохранены');
    assert.deepEqual(st.grades, []);
    assert.ok(st.stats.battery >= 20 && st.stats.battery <= 70);
    assert.ok(st.stats.vapeCharge >= 20 && st.stats.vapeCharge <= 70);
    assert.equal(st.stats.stress, 30);
    assert.equal(st.stats.hunger, 40);
    assert.equal(st.stats.suspicion, 0);
    assert.equal(st.directorCalls, 0);
    assert.equal(st.week.directorCalls, 2);
    assert.deepEqual(st.flags, {});
    assert.equal(st.week.matches[1].score, '3:1');
    assert.equal(st.phase, 'late');
    assert.equal(st.late, false, 'со вторника — без опоздания');
    // по коду дня: тот же код → те же числа утром
    const st2 = createState(seed); startDay(st2, 2);
    assert.equal(st2.stats.battery, st.stats.battery);
    assert.equal(st2.stats.vapeCharge, st.stats.vapeCharge);
  }
  setDay(1);
});

test('код сохранения посреди среды восстанавливает среду', () => {
  const st = createState('KQ7M2P');
  startDay(st, 2);
  finishLesson(st, 1, 7);
  startDay(st, 3);
  finishLesson(st, 1, 6); finishLesson(st, 2, 8); finishLesson(st, 3, 5);
  startBreak(st, 3);
  st.location = 'canteen';
  const code = encodeSaveCode(st);
  setDay(1); // как будто игра перезапущена
  const res = decodeSaveCode(code);
  assert.equal(res.ok, true, res.error);
  const ld = res.state;
  assert.equal(ld.day, 3);
  assert.equal(ld.phase, 'break');
  assert.equal(ld.lesson, 3);
  assert.deepEqual(ld.grades, st.grades);
  assert.deepEqual(ld.week.grades, st.week.grades);
  setDay(ld.day); // так делает game.loadState
  assert.equal(lessonInfo(4).subject, 'География', 'после 3-й перемены в среду — география');
  assert.equal(lessonInfo(6).subject, 'Белорусский язык');
  setDay(1);
});

test('оценки: без оценки — физра, плавание, классный час и 2–3 урока по коду; минимум 1/2 (Р-6, Р-7)', () => {
  for (const seed of SEEDS) {
    const st = createState(seed);
    const set = noGradeLessons(st);
    assert.ok(set.size >= 2 && set.size <= 3, `${seed}: ${set.size}`);
    for (const k of set) {
      const [d, n] = k.split(':').map(Number);
      assert.ok(daySchedule(d)[n - 1].graded, 'без оценки выбран урок, который и так без оценки');
    }
    assert.deepEqual([...noGradeLessons(createState(seed))], [...set], 'по коду дня');
    for (let d = 1; d <= 5; d++) {
      for (const l of daySchedule(d)) {
        if (['pe_football', 'pe_swim', 'classhour'].includes(l.subjectId)) assert.equal(lessonGraded(st, l.n, d), false, l.subject);
        else assert.equal(lessonGraded(st, l.n, d), !set.has(`${d}:${l.n}`));
      }
    }
  }
  // минимальные оценки: точные — 1, гуманитарные — 2
  const exact = ['algebra', 'geometry', 'physics', 'astronomy', 'chemistry', 'informatics'];
  for (const [id, S] of Object.entries(SUBJECTS)) assert.equal(S.exact, exact.includes(id), id);
  assert.equal(minGrade({ exact: true }), 1);
  assert.equal(minGrade({ exact: false }), 2);
  // finishLesson не ставит меньше минимума и ничего не ставит на уроке без оценки
  const st = createState('KQ7M2P');
  setDay(1);
  const n = [1, 2, 3, 4, 5, 6].find((k) => lessonGraded(st, k) && !lessonInfo(k).exact);
  finishLesson(st, n, 1);
  assert.equal(st.grades[n - 1], 2);
  setDay(2);
  st.day = 2;
  const pe = daySchedule(2).find((l) => l.subjectId === 'pe_football').n;
  finishLesson(st, pe, 10);
  assert.equal(st.grades[pe - 1], null);
  setDay(1);
});

test('день окончен раньше (Р-4): пропущенные уроки с оценкой — минимальная оценка', () => {
  const st = createState('KQ7M2P');
  startDay(st, 2);
  finishLesson(st, 1, 7);
  startLesson(st, 2);
  finishLesson(st, 2, BALANCE.director.grade);
  st.phase = 'break'; st.lesson = 2;
  endDayEarly(st, 'director');
  assert.equal(st.week.dayEnds[2], 'director');
  const S = daySchedule(2);
  for (const l of S.slice(2)) {
    const g = st.grades[l.n - 1];
    if (lessonGraded(st, l.n, 2)) assert.equal(g, l.exact ? 1 : 2, l.subject);
    else assert.equal(g, null, l.subject);
  }
  assert.equal(st.week.grades[1].length, S.length);
  setDay(1);
});

test('дорога домой: ≥ 10 разговоров по 4–8 реплик с реакциями на день', () => {
  const d = dialog('bus_home');
  assert.deepEqual(d.errors, []);
  const labels = d.order.filter((l) => /^home_\d+$/.test(l));
  assert.ok(labels.length >= 10, 'разговоров ' + labels.length);
  const contexts = [
    {}, { calls: 1 }, { match: 1 }, { match: -1 }, { dayavg: 3 }, { dayavg: 9 }, { debts: 5 },
    { flag: 'smileDiarrhea' }, { flag: 'igorRage' }, { flag: 'dayOver', calls: 3 },
  ];
  let reacted = 0;
  for (const label of labels) {
    for (const c of contexts) {
      const r = new DialogRunner(d, label, {
        effect: () => {}, stat: (n) => (n in c ? c[n] : n === 'dayavg' ? 6 : 0), flag: (n) => c.flag === n,
      });
      let says = 0;
      for (let g = 0; g < 200; g++) { const ev = r.next(); if (ev.type === 'end') break; if (ev.type === 'say') says++; else r.choose(0); }
      assert.ok(says >= 4 && says <= 8, `${label} ${JSON.stringify(c)}: ${says} реплик`);
      if (Object.keys(c).length && says > 0) reacted++;
    }
  }
  assert.ok(reacted > 0);
  // условие dayavg работает по сегодняшним оценкам
  const st = createState('KQ7M2P');
  assert.equal(scriptStatValue(st, 'dayavg'), 6);
  st.grades = [4, null, 2];
  assert.equal(scriptStatValue(st, 'dayavg'), 3);
});

test('утро вторника–пятницы: ≥ 3 сценки на день по 2–4 реплики; концовки — 3–6 реплик', () => {
  const m = dialog('morning');
  assert.deepEqual(m.errors, []);
  for (let day = 2; day <= 5; day++) {
    const ls = m.order.filter((l) => l.startsWith(`d${day}_`));
    assert.ok(ls.length >= 3, `день ${day}: ${ls.length}`);
    for (const l of ls) { const n = m.labels[l].cmds.filter((c) => c.type === 'say').length; assert.ok(n >= 2 && n <= 4, `${l}: ${n}`); }
  }
  const e = dialog('endings');
  assert.deepEqual(e.errors, []);
  for (const k of ['pride', 'bntu', 'habza', 'dad']) {
    const n = e.labels[k].cmds.filter((c) => c.type === 'say').length;
    assert.ok(n >= 3 && n <= 6, `${k}: ${n}`);
  }
  for (const f of ['day_end', 'lesson_swim', 'lesson_classhour']) assert.deepEqual(dialog(f).errors, [], f);
});
