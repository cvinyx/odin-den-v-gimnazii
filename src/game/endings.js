// Концовки недели (EDITS_V2: ИС-5, Р-5) — по среднему баллу за неделю (только выставленные оценки).
// Чистые функции — работают и в node-тестах.
import { BALANCE } from '../../data/balance.js';
import { weekAverage } from './day.js';

const E = BALANCE.endings;

export const ENDINGS = ['pride', 'bntu', 'habza', 'dad'];
export const ENDING_TITLES = {
  pride: 'Гордость семьи',
  bntu: 'Поступаю в БНТУ',
  habza: 'Дорога в хабзу',
  dad: 'Папочка зол',
};
// Музыкальный мотив каждой концовки (data/music.js).
export const ENDING_MUSIC = { pride: 'end_perfect', bntu: 'end_legend', habza: 'end_chaos', dad: 'end_drained' };
export const ENDING_COLORS = { pride: '#ffe14d', bntu: '#6be3c8', habza: '#c88aff', dad: '#ff5a5a' };

export function avgGrade(state) { return weekAverage(state); }

// Границы Р-5: больше 8,0 → «Гордость»; 6,0–8,0 включительно → «БНТУ»; 4,0–5,99 → «Хабза»; меньше 4,0 → «Папочка зол».
export function endingForAverage(avg) {
  if (avg > E.pride) return 'pride';
  if (avg >= E.bntu) return 'bntu';
  if (avg >= E.habza) return 'habza';
  return 'dad';
}

export function pickEnding(state) { return endingForAverage(weekAverage(state)); }
