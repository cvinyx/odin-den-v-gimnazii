// Уроки: файл диалогов, метки событий, главная мини-игра (раздел 6).
// Метки в файле: intro, seat (seat_en на английском), события, before_game, after_good, after_bad.
// minigame — id из реестра мини-игр (src/minigames/, футбол — src/football/); extra — игра после главной (душ).
export const LESSONS = {
  1: { file: 'lesson1', seat: 'seat_en', events: ['event1', 'event2', 'event3'], minigame: 'cheat', denis: false },
  2: { file: 'lesson2', seat: 'seat', events: ['event1', 'event2'], minigame: 'phone_blocks' },
  3: { file: 'lesson3', seat: 'seat', events: ['event1', 'event2'], minigame: 'bait' },
  4: { file: 'lesson4', seat: 'seat', events: ['event1', 'event2', 'event3'], minigame: 'phone_brawl' },
  5: { file: 'lesson5', seat: null, events: ['event1'], minigame: 'football', extra: 'shower', view: 'pe' },
  6: { file: 'lesson6', seat: 'seat', events: ['event1', 'event2'], minigame: 'phone_feed' },
  7: { file: 'lesson7', seat: 'seat', events: ['event1', 'event2'], minigame: 'cheat', params: { quiz: true } },
};

// Составы на «Эль-Класико» (раздел 15) — для сцены в раздевалке.
export const LINEUPS = {
  fizmat: { keeper: 'smile', field: ['chernyak', 'shurpo', 'vadim', 'vitalik'], bench: ['bochko', 'zakha'] },
  inyaz: { keeper: 'buy', field: ['igor', 'roma', 'denis', 'matych'], bench: ['guza'] },
};
