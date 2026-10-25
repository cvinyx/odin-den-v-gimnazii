// Банки вопросов тестов (М-4): data/tests/<id предмета>.txt, 10 случайных вопросов на урок по коду дня.
import { parseTestBank } from './test_parse.js';
import { eventRng } from './day.js';

const files = import.meta.glob('../../data/tests/*.txt', { query: '?raw', import: 'default', eager: true });
const cache = new Map();

export function testBank(subjectId) {
  if (cache.has(subjectId)) return cache.get(subjectId);
  const key = Object.keys(files).find((p) => p.endsWith('/' + subjectId + '.txt'));
  const bank = key ? parseTestBank(files[key]).questions : [];
  cache.set(subjectId, bank);
  return bank;
}

// 10 вопросов урока: по коду дня, дню и номеру урока; варианты ответа перемешаны.
export function pickQuestions(state, subjectId, n = 10) {
  const rng = eventRng(state, `test:${subjectId}:${state.day}:${state.lesson}`);
  return rng.shuffle([...testBank(subjectId)]).slice(0, n).map((q) => ({ q: q.q, options: rng.shuffle([...q.options]) }));
}
