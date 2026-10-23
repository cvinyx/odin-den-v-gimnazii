// Система дня (раздел 5): расписание, состояния «урок N» / «перемена N», часы, подсказка «Следующий: …»,
// правила статусов между уроками, автосохранение в начале урока и перемены.
import { SCHEDULE, roomLabel } from '../../data/schedule.js';
import { TEACHERS } from '../../data/teachers.js';
import { BALANCE } from '../../data/balance.js';
import { changeStat } from './state.js';
import { Rng, hashString } from '../engine/rng.js';

export const LESSON_MINUTES = 45;
export const DEMO_LAST_BREAK = 1; // этап 2: после перемены 1 — «Конец демо-версии»

export function toMinutes(hhmm) { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; }
export function fromMinutes(min) {
  const h = Math.floor(min / 60), m = Math.floor(min % 60);
  return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
}

export function lessonInfo(n) { return SCHEDULE[n - 1] || null; }

// Время на уроке пропорционально прогрессу сцены p ∈ [0, 1].
export function lessonClock(n, p) {
  const l = lessonInfo(n);
  const a = toMinutes(l.start), b = toMinutes(l.end);
  return fromMinutes(a + (b - a) * Math.max(0, Math.min(1, p)));
}

// Какой урок следующий для текущего состояния.
export function nextLesson(state) {
  if (state.phase === 'late' || state.phase === 'intro') return lessonInfo(1);
  if (state.phase === 'break') return lessonInfo(state.lesson + 1);
  if (state.phase === 'lesson') return lessonInfo(state.lesson);
  return null;
}

export function hintText(state) {
  const l = nextLesson(state);
  if (!l || state.phase === 'lesson' || state.phase === 'intro') return null;
  return `Следующий: ${l.subject}, ${roomLabel(l)}`;
}

// ГПСЧ дня для конкретного события: зависит только от кода дня и имени события (одинаковый код → одинаковый результат).
export function eventRng(state, name) {
  return new Rng(hashString(state.seed + '#' + name));
}

// Множитель подозрения учителя (раздел 10).
export function teacherMul(n) {
  const t = TEACHERS[lessonInfo(n).teacher];
  return (t && t.params && t.params.suspicionMul) || 1;
}

export function startLesson(state, n) {
  const l = lessonInfo(n);
  state.phase = 'lesson';
  state.lesson = n;
  state.clock = l.start;
  state.location = 'cab_' + l.room;
  state.locationName = `Каб. ${l.room}`;
  state.seat = null;
  state.lessonMul = teacherMul(n);
  let susp = Math.round(state.suspicionPrev * BALANCE.suspicion.carryOver);
  if (n === 1 && state.late) susp = Math.max(susp, BALANCE.start.lateSuspicion);
  if (state.vapeSmell) { susp += BALANCE.suspicion.vapeSmellBonus; state.vapeSmell = false; }
  state.stats.suspicion = Math.min(100, susp);
}

// Правила статусов в конце урока (раздел 7). Возвращает список применённых правил (для экрана итога).
export function endLessonRules(state) {
  const s = state.stats;
  const notes = [];
  changeStat(state, 'battery', BALANCE.battery.perLesson);
  changeStat(state, 'hunger', BALANCE.hunger.perLesson);
  if (s.battery <= 0) { changeStat(state, 'stress', BALANCE.battery.deadStressPerLesson); notes.push('Телефон мёртв: стресс +5'); }
  if (s.vapeCharge <= 0 || s.juice <= 0) { changeStat(state, 'stress', BALANCE.vape.emptyStressPerLesson); notes.push('Вейп пустой: стресс +5'); }
  if (s.hunger >= 100) { changeStat(state, 'stress', BALANCE.hunger.maxStressPerLesson); notes.push('Голод 100: стресс +10'); }
  return notes;
}

export function finishLesson(state, n, grade) {
  state.grades[n - 1] = grade;
  state.late = false;
  state.suspicionPrev = state.stats.suspicion;
  state.stats.suspicion = 0;
  state.seat = null;
}

export function startBreak(state, n) {
  const l = lessonInfo(n);
  state.phase = 'break';
  state.lesson = n;
  state.clock = l.end; // часы замирают на начале перемены
  state.flags['break' + n] = true;
}

// Вход в кабинет. Возвращает действие: { type: 'lesson', n } | { type: 'demo_end' } | { type: 'denied', text }.
export function roomAction(state, room) {
  if (state.phase === 'late' && room === lessonInfo(1).room) return { type: 'lesson', n: 1 };
  if (state.phase === 'break') {
    if (state.lesson >= DEMO_LAST_BREAK) return { type: 'demo_end' };
    const next = lessonInfo(state.lesson + 1);
    if (next && next.room === room) return { type: 'lesson', n: next.n };
  }
  const next = nextLesson(state);
  return { type: 'denied', text: next ? `Сейчас не сюда. ${hintText(state) || ''}` : 'Заперто.' };
}

// Номер текущей перемены для таблицы NPC (раздел 11) или null.
export function breakNumber(state) { return state.phase === 'break' ? state.lesson : null; }
