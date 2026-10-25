// Уроки по предметам (EDITS_V2, V2-2): файл диалогов → метки событий. Метки в файле: intro, seat
// (seat_en на английском), события, before_game (или before_<мини-игра>), after_good, after_bad.
// Главная мини-игра — из расписания (data/schedule.js, SUBJECTS[*].games). extra — игра после главной.
// *_stub — временные заглушки (плавание и классный час, этап V2-4): диалог-выбор вместо мини-игры.
const STD = { seat: 'seat', events: ['event1', 'event2'] };
export const LESSON_FILES = {
  lesson_english: { seat: 'seat_en', events: ['event1', 'event2', 'event3'], denis: false },
  lesson_math: STD,
  lesson_russian: STD,
  lesson_lit: STD,
  lesson_belarusian: STD,
  lesson_bellit: STD,
  lesson_physics: { seat: 'seat', events: ['event1', 'event2', 'event3'] },
  lesson_astronomy: STD,
  lesson_chemistry: STD,
  lesson_biology: STD,
  lesson_informatics: STD,
  lesson_history: STD,
  lesson_geography: STD,
  lesson_social: { ...STD, params: { quiz: true } },
  lesson_pe: { seat: null, events: ['event1'], extra: 'shower', view: 'pe' },
  lesson_swim: { seat: null, events: [], view: 'pool' },
  lesson_classhour: { seat: null, events: [] },
};

// Составы на «Эль-Класико» (раздел 15) — для сцены в раздевалке.
export const LINEUPS = {
  fizmat: { keeper: 'smile', field: ['chernyak', 'shurpo', 'vadim', 'vitalik'], bench: ['bochko', 'zakha'] },
  inyaz: { keeper: 'buy', field: ['igor', 'roma', 'denis', 'matych'], bench: ['guza'] },
};
