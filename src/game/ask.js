// Вопросы ученикам других классов (М-7): «Какой у вас следующий урок?», «Вы уже писали тест по …?»,
// «Сколько у вас сегодня уроков?». Ответы берутся из расписания класса (data/schedule.js) и из общего для
// класса «состояния тестов» дня — поэтому у одноклассников они совпадают. Чистые функции (работают в node).
import { daySchedule } from '../../data/schedule.js';
import { CLASS_OF } from '../../data/npc_schedule.js';
import { BALANCE } from '../../data/balance.js';
import { Rng, hashString } from '../engine/rng.js';

export function askable(id) { const c = CLASS_OF[id]; return !!c && c !== 'I'; }

// Состояние теста на уроке n класса cls в этот день: { wrote, grade }.
export function classTest(state, cls, n) {
  const r = new Rng(hashString(`${state.seed}#clstest#${state.day}#${cls}#${n}`));
  return { wrote: r.chance(BALANCE.ask.testChance), grade: r.int(2, 10) };
}

// Ответы id на перемене state.lesson: { next, test: { subject, wrote, grade } | null, count }.
export function askAnswers(state, id) {
  const cls = CLASS_OF[id];
  const sched = daySchedule(state.day, cls);
  const b = state.lesson || 1;
  const nx = sched[b];
  let test = null;
  for (let n = b; n >= 1 && !test; n--) {
    const l = sched[n - 1];
    if (l && l.graded) test = { subject: l.subject, n, ...classTest(state, cls, n) };
  }
  return { next: nx ? { subject: nx.subject, room: nx.room } : null, test, count: sched.length };
}

export function nextText(a) { return a.next ? `Следующий у нас — ${a.next.subject}, кабинет ${a.next.room}.` : 'Следующего нет — это был последний урок.'; }
export function countText(a) { return `Сегодня у нас ${a.count} уроков.`; }
export function testText(a) {
  if (!a.test) return 'Тестов у нас пока не было.';
  return a.test.wrote ? `Да, по предмету «${a.test.subject}» писали.` : `Нет, по предмету «${a.test.subject}» не писали.`;
}
export function gradeText(a) { return a.test && a.test.wrote ? `Мне поставили ${a.test.grade}.` : 'Так мы же не писали.'; }
