// Достижения (раздел 17): хранятся между играми (localStorage, без него — только на эту игру).
// Условие — функция от состояния дня; atEnd — проверяется только в конце дня.
import { storeGet, storeSet, KEYS } from '../engine/save.js';
import { totalDebt } from './bets.js';
import { avgGrade } from './endings.js';

export const ACHIEVEMENTS = [
  { id: 'no_denis', name: 'Ни разу не сел рядом с Денисом', desc: 'Прожить день, ни на одном уроке не сев к Денису.', atEnd: true, test: (s) => !s.flags.satWithDenis && s.grades.filter((g) => g != null).length >= 7 },
  { id: 'kolya_3', name: 'Коля пропустил 3 гола', desc: 'Забить Коле Бочко в воротах три гола за матч.', test: (s) => (s.flags.kolyaConceded || 0) >= 3 },
  { id: 'debtor', name: 'Должен всем', desc: 'Набрать долгов на 5 BYN и больше.', test: (s) => totalDebt(s) >= 500 },
  { id: 'grandpa', name: 'Дедушка или Артём?', desc: 'Встретить Николая Петровича.', test: (s) => !!s.flags.metNikolai },
  { id: 'dead_iphone', name: 'Мёртвый iPhone', desc: 'Разрядить телефон до нуля.', test: (s) => s.stats.battery <= 0 && s.phase !== 'free' },
  { id: 'berserk', name: 'Берсерк', desc: 'Довести Игоря до берсерка.', test: (s) => !!s.flags.igorBerserk },
  { id: 'diarrhea', name: 'Физмат без вратаря', desc: 'Увидеть, как Смайл убегает с поля.', test: (s) => !!s.flags.smileDiarrhea },
  { id: 'hat_trick', name: 'Хет-трик Ковгана', desc: 'Забить три гола в Эль-Класико.', test: (s) => (s.flags.romaGoals || 0) >= 3 },
  { id: 'cloud_king', name: 'Король облаков', desc: 'Выиграть «Кто больше парит».', test: (s) => !!s.flags.won_vape },
  { id: 'toilet_king', name: 'Царь туалета', desc: 'Удержать дверь кабинки.', test: (s) => !!s.flags.won_toilet },
  { id: 'smazhenki', name: 'Смаженочный император', desc: 'Выиграть «Кто больше съест».', test: (s) => !!s.flags.won_eat },
  { id: 'mb', name: 'Двое на двое', desc: 'Забайтить Матыча и Буя вместе с другом.', test: (s) => !!s.flags.won_bait_mb },
  { id: 'wrong_like', name: 'Лайк не туда', desc: 'Лайкнуть не тот пост во время лага.', test: (s) => !!s.flags.wrongLike },
  { id: 'excellent', name: 'Отличник', desc: 'Закончить день со средней оценкой 8 и выше.', atEnd: true, test: (s) => avgGrade(s) >= 8 },
  { id: 'clean', name: 'Чистые лёгкие', desc: 'Прожить день без единой затяжки.', atEnd: true, test: (s) => s.puffsToday === 0 },
  { id: 'end_director', name: 'Три звонка', desc: 'Концовка «К директору!».', test: (s) => s.flags.ending === 'director' },
  { id: 'end_perfect', name: 'Идеальный день', desc: 'Концовка «Идеальный день».', test: (s) => s.flags.ending === 'perfect' },
  { id: 'end_legend', name: 'Легенда байта', desc: 'Концовка «Легенда байта».', test: (s) => s.flags.ending === 'legend' },
  { id: 'end_drained', name: 'Выжатый', desc: 'Концовка «Выжатый».', test: (s) => s.flags.ending === 'drained' },
  { id: 'end_chaos', name: 'Хаос как обычно', desc: 'Концовка «Хаос как обычно».', test: (s) => s.flags.ending === 'chaos' },
];

let memory = null; // если localStorage нет — помним в памяти до перезагрузки

export function unlockedIds() {
  const saved = storeGet(KEYS.achievements, null);
  if (Array.isArray(saved)) memory = saved;
  return memory || [];
}

// Проверить и открыть новые. Возвращает список только что открытых (для всплывающего уведомления).
export function checkAchievements(state, atEnd = false) {
  if (!state || !state.seed || state.phase === 'free' || state.phase === 'intro') return [];
  const have = new Set(unlockedIds());
  const fresh = [];
  for (const a of ACHIEVEMENTS) {
    if (have.has(a.id) || (a.atEnd && !atEnd)) continue;
    let ok = false;
    try { ok = a.test(state); } catch (e) { ok = false; }
    if (ok) { have.add(a.id); fresh.push(a); }
  }
  if (fresh.length) {
    memory = [...have];
    storeSet(KEYS.achievements, memory);
    state.flags.achievementsToday = [...(state.flags.achievementsToday || []), ...fresh.map((a) => a.id)];
  }
  return fresh;
}
