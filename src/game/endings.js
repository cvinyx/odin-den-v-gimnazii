// Концовки (раздел 16): проверяются по порядку. Чистые функции — работают и в node-тестах.
import { BALANCE } from '../../data/balance.js';

const E = BALANCE.endings;

export const ENDINGS = ['director', 'perfect', 'legend', 'drained', 'chaos'];
export const ENDING_TITLES = {
  director: 'К директору!',
  perfect: 'Идеальный день',
  legend: 'Легенда байта',
  drained: 'Выжатый',
  chaos: 'Хаос как обычно',
};
// Музыкальный мотив каждой концовки (data/music.js).
export const ENDING_MUSIC = { director: 'director', perfect: 'end_perfect', legend: 'end_legend', drained: 'end_drained', chaos: 'end_chaos' };
export const ENDING_COLORS = { director: '#ff5a5a', perfect: '#ffe14d', legend: '#c88aff', drained: '#9aa3ad', chaos: '#6be3c8' };

export function avgGrade(state) {
  const g = state.grades.filter((x) => x != null);
  return g.length ? g.reduce((a, b) => a + b, 0) / g.length : 0;
}

export function pickEnding(state) {
  const s = state.stats;
  if (state.directorCalls >= BALANCE.director.endingOnCall) return 'director';
  if (state.flags.matchResult === 1 && s.aura >= E.perfect.aura && state.directorCalls === 0 && avgGrade(state) >= E.perfect.avgGrade) return 'perfect';
  if (s.aura >= E.baitLegend.aura && state.wins >= E.baitLegend.wins) return 'legend';
  if (state.breakdowns >= E.squeezed.breakdowns || (s.battery <= 0 && s.money < E.squeezed.money)) return 'drained';
  return 'chaos';
}
