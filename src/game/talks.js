// Разговоры на переменах (М-5, V2-6): выбор метки для именного ученика. Чистые функции — работают и в тестах.
// Приоритет: молчуны перед/после матча (Ф-12) → футбольный спор (Ф-10, Ф-11; вторник и пятница перед физрой) →
// реакция на событие дня/недели → групповая сценка (если все участники рядом) → личный разговор t1…tN.
// За неделю одна и та же метка у одного человека не повторяется (пока не исчерпан пул).
import { daySchedule } from '../../data/schedule.js';
import { CLASS_OF } from '../../data/npc_schedule.js';
import { GROUP_SCENES, FOOTBALL_SCENES, FOOTBALL_PRO, FOOTBALL_SILENT } from '../../data/groups.js';
import { eventRng } from './day.js';

const isPE = (l) => l && l.subjectId === 'pe_football';

// Контекст футбола на этой перемене: 'pre' (следующий урок класса — футбол), 'post' (только что был) или null.
export function footballContext(state, id) {
  const cls = CLASS_OF[id];
  if (!cls || state.phase !== 'break') return null;
  const s = daySchedule(state.day, cls);
  const b = state.lesson;
  if (isPE(s[b])) return 'pre';
  if (b >= 1 && isPE(s[b - 1])) return 'post';
  return null;
}

// События дня и недели, на которые собеседники реагируют (метки r_<ключ>_<k> в react.txt).
export function reactionKeys(state) {
  const keys = [];
  const g = state.grades.filter((x) => typeof x === 'number');
  if (g.length >= 2) {
    const avg = g.reduce((a, b) => a + b, 0) / g.length;
    if (avg >= 8) keys.push('grades_good'); else if (avg < 4) keys.push('grades_bad');
  }
  const m = state.flags.matchResult ?? (state.week.matches[state.day - 1] || {}).result;
  if (m > 0) keys.push('match_win'); else if (m < 0) keys.push('match_lose');
  if (state.flags.igorRage) keys.push('rage');
  if ((state.week.dayEnds || {})[state.day - 1] === 'shame') keys.push('shame');
  if (state.directorCalls > 0 || (state.week.dayEnds || {})[state.day - 1] === 'director') keys.push('director');
  if (state.debts && state.debts.length) keys.push('debts');
  return keys;
}

// labels: { talk: [t1…] (личные метки этого id), hasSilent, react: [все r_*], football: [ft*], group: [g*] }
// present: id именных, которые сейчас на карте. Возвращает { file, label, kind }.
export function pickTalk(state, id, labels, present = []) {
  const wk = state.week;
  wk.talkSeen = wk.talkSeen || {}; wk.reactSeen = wk.reactSeen || []; wk.groupSeen = wk.groupSeen || [];
  const rng = eventRng(state, `talk:${id}:${state.day}:${state.lesson}:${(state.flags.talkN = (state.flags.talkN || 0) + 1)}`);
  const ctx = footballContext(state, id);
  if (labels.hasSilent && FOOTBALL_SILENT.includes(id) && [2, 5].includes(state.day) && ctx) return { file: 'talk_' + id, label: 'silent', kind: 'silent' };
  if (FOOTBALL_PRO.includes(id) && [2, 5].includes(state.day) && ctx === 'pre') {
    const free = labels.football.filter((l) => FOOTBALL_SCENES[l] && FOOTBALL_SCENES[l].includes(id) && !wk.groupSeen.includes(l));
    if (free.length && rng.chance(0.8)) { const l = rng.pick(free); wk.groupSeen.push(l); return { file: 'football_talk', label: l, kind: 'football' }; }
  }
  const rk = reactionKeys(state).filter((k) => !wk.reactSeen.includes(`${id}:${k}`) && labels.react.some((l) => l.startsWith(`r_${k}_`)));
  if (rk.length && rng.chance(0.4)) {
    const k = rng.pick(rk);
    wk.reactSeen.push(`${id}:${k}`);
    const opts = labels.react.filter((l) => l.startsWith(`r_${k}_`));
    return { file: 'react', label: rng.pick(opts), kind: 'react' };
  }
  const gs = labels.group.filter((l) => GROUP_SCENES[l] && GROUP_SCENES[l].includes(id) && !wk.groupSeen.includes(l) && GROUP_SCENES[l].every((x) => x === id || present.includes(x)));
  if (gs.length && rng.chance(0.3)) { const l = rng.pick(gs); wk.groupSeen.push(l); return { file: 'group', label: l, kind: 'group' }; }
  const seen = (wk.talkSeen[id] = wk.talkSeen[id] || []);
  let free = labels.talk.filter((l) => !seen.includes(l));
  if (!free.length) { wk.talkSeen[id] = []; free = labels.talk; }
  const l = rng.pick(free);
  wk.talkSeen[id].push(l);
  return { file: 'talk_' + id, label: l, kind: 'talk' };
}
