// Система дня (раздел 5) и недели (EDITS_V2, Р-1…Р-7): расписание дня, состояния «урок N» / «перемена N»,
// часы, подсказка «Следующий: …», правила статусов между уроками, переход к следующему дню, оценки.
import { daySchedule, roomLabel } from '../../data/schedule.js';
import { TEACHERS } from '../../data/teachers.js';
import { BALANCE } from '../../data/balance.js';
import { changeStat } from './state.js';
import { Rng, hashString } from '../engine/rng.js';

export const LESSON_MINUTES = 45;

export function toMinutes(hhmm) { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; }
export function fromMinutes(min) {
  const h = Math.floor(min / 60), m = Math.floor(min % 60);
  return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
}

// Текущий день недели (1–5). Его ставит игра при новой игре, загрузке и смене дня (setDay).
let CURRENT_DAY = 1;
const cache = new Map();
export function setDay(day) { CURRENT_DAY = Math.max(1, Math.min(5, day || 1)); }
export function currentDay() { return CURRENT_DAY; }
export function todaySchedule(day = CURRENT_DAY) {
  if (!cache.has(day)) cache.set(day, daySchedule(day));
  return cache.get(day);
}
export function lessonInfo(n, day = CURRENT_DAY) { return todaySchedule(day)[n - 1] || null; }
export function lastLesson(day = CURRENT_DAY) { return todaySchedule(day).length; }

// Уроки недели без оценки (Р-7): 2–3 урока (не физкультура, не классный час и не тест), по коду недели.
export function noGradeLessons(state) {
  const rng = eventRng(state, 'nograde');
  const all = [];
  // тест (М-4) всегда с оценкой — такие уроки в «без оценки» не попадают
  for (let d = 1; d <= 5; d++) for (const l of daySchedule(d)) if (l.graded && !l.minigame.startsWith('test')) all.push(`${d}:${l.n}`);
  const n = rng.int(BALANCE.grades.noGradePerWeek[0], BALANCE.grades.noGradePerWeek[1]);
  return new Set(rng.shuffle(all).slice(0, n));
}
// Ставится ли оценка за урок n дня day.
export function lessonGraded(state, n, day = state.day) {
  const l = lessonInfo(n, day);
  if (!l || !l.graded) return false;
  return !noGradeLessons(state).has(`${day}:${n}`);
}
// Минимальная оценка (Р-6, М-4): точные — 1, гуманитарные — 2.
export function minGrade(lesson) { return lesson && lesson.exact ? BALANCE.grades.minExact : BALANCE.grades.minHumanities; }

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
  const pool = l.room === 'бассейн';
  state.location = pool ? 'pool' : l.building === 0 ? 'locker_room' : 'cab_' + l.room;
  state.locationName = pool ? 'Бассейн' : l.building === 0 ? 'Спортзал' : `Каб. ${l.room}`;
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
  if (state.flags.vapeAfterStress) { changeStat(state, 'stress', state.flags.vapeAfterStress); notes.push('Отходняк после вейп-игры: стресс +' + state.flags.vapeAfterStress); state.flags.vapeAfterStress = 0; }
  return notes;
}

export function finishLesson(state, n, grade) {
  const l = lessonInfo(n, state.day);
  if (!lessonGraded(state, n)) grade = null;
  else grade = Math.max(minGrade(l), Math.min(10, grade ?? minGrade(l)));
  state.grades[n - 1] = grade;
  state.week.grades[state.day - 1] = [...state.grades];
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

// Вход в кабинет. Возвращает действие: { type: 'lesson', n } | { type: 'denied', text }.
export function roomAction(state, room) {
  if (state.phase === 'late' && room === lessonInfo(1).room) return { type: 'lesson', n: 1 };
  if (state.phase === 'break') {
    const next = lessonInfo(state.lesson + 1);
    if (next && next.room === room) return { type: 'lesson', n: next.n };
  }
  const next = nextLesson(state);
  return { type: 'denied', text: next ? `Сейчас не сюда. ${hintText(state) || ''}` : 'Заперто.' };
}

// Оценки недели: все выставленные (числа) и средний балл (Р-5).
export function weekGrades(state) {
  const out = [];
  state.week.grades.forEach((g, d) => (d + 1 === state.day ? state.grades : g).forEach((x) => { if (typeof x === 'number') out.push(x); }));
  return out;
}
export function weekAverage(state) {
  const g = weekGrades(state);
  return g.length ? g.reduce((a, b) => a + b, 0) / g.length : 0;
}

// День закончился раньше (3-й вызов к директору, «Это позор» — Р-4): за пропущенные уроки с оценкой —
// минимальная оценка.
export function endDayEarly(state, reason) {
  state.week.dayEnds[state.day] = reason;
  const total = lastLesson(state.day);
  for (let n = 1; n <= total; n++) {
    if (state.grades[n - 1] != null) continue;
    if (n === state.lesson && state.phase === 'lesson') continue; // текущий урок закрывает сцена урока
    state.grades[n - 1] = lessonGraded(state, n) ? minGrade(lessonInfo(n, state.day)) : null;
  }
  state.week.grades[state.day - 1] = [...state.grades];
}

// Новый день недели (Р-2): деньги, долги, аура, жижка, достижения и оценки переносятся;
// батарея и заряд вейпа — случайно 20–70 %, стресс 30, голод 40, подозрение 0.
export function startDay(state, day) {
  const M = BALANCE.morning;
  state.week.grades[state.day - 1] = [...state.grades];
  if (state.flags.matchScore) state.week.matches[state.day] = { score: state.flags.matchScore, result: state.flags.matchResult };
  state.week.directorCalls += state.directorCalls;
  state.day = day;
  setDay(day);
  const rng = eventRng(state, 'morning' + day);
  state.stats.battery = rng.int(M.battery[0], M.battery[1]);
  state.stats.vapeCharge = rng.int(M.vape[0], M.vape[1]);
  state.stats.stress = M.stress;
  state.stats.hunger = M.hunger;
  state.stats.suspicion = 0;
  state.grades = [...(state.week.grades[day - 1] || [])];
  state.directorCalls = 0;
  state.breakdowns = 0;
  state.puffsToday = 0;
  state.puffsInRefill = 0;
  state.flags = {};
  state.met = {};
  state.seat = null;
  state.lessonMul = 1;
  state.suspicionPrev = 0;
  state.vapeSmell = false;
  state.breakdownPending = false;
  state.charging = null;
  state.late = day === 1;
  state.lesson = 0;
  state.phase = 'late';
  state.clock = M.time;
}

// Номер текущей перемены для таблицы NPC (раздел 11) или null.
export function breakNumber(state) { return state.phase === 'break' ? state.lesson : null; }

// Для итогов недели: оценки дня d (текущий день — из state.grades), матч дня d, вызовы к директору за неделю.
export function dayGrades(state, d) { return (d === state.day ? state.grades : state.week.grades[d - 1]) || []; }
export function dayMatch(state, d) {
  if (d === state.day) return state.flags.matchScore ? { score: state.flags.matchScore, result: state.flags.matchResult } : null;
  return state.week.matches[d] || null;
}
export function weekDirectorCalls(state) { return state.week.directorCalls + state.directorCalls; }
