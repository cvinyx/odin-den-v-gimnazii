// Расписание недели (EDITS_V2: У-2, Л-8, Р-1). Звонки — как в версии 1, 7-й урок — 14:40–15:25.
// room — номер кабинета по Л-2 (корпус, этаж, номер на этаже); с этапа V2-3 карты по новой нумерации,
// roomV2 оставлен равным room для совместимости.

export const DAYS = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница'];
export const DAY_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт'];

export const BELLS = [
  { start: '09:00', end: '09:45' },
  { start: '09:55', end: '10:40' },
  { start: '10:50', end: '11:35' },
  { start: '11:55', end: '12:40' },
  { start: '12:50', end: '13:35' },
  { start: '13:45', end: '14:30' },
  { start: '14:40', end: '15:25' },
];

// Корпус и этаж кабинета — по номеру (Л-2). Корпус 0 — спортзал и бассейн.
function roomPlace(room) {
  if (room === 'спортзал') return { building: 0, floor: 1 };
  if (room === 'бассейн') return { building: 0, floor: 0 };
  return { building: +room[0], floor: +room[1] };
}

// Предметы. exact — точный (минимальная оценка 1, Р-6), иначе гуманитарный (минимум 2).
// graded: false — оценок нет никогда (У-6). games — главная мини-игра по очереди за неделю
// (test — тест М-4 с выбором «сам / у соседа / с телефона», test_quiz — то же с вопросами учителя).
// Где по Л-8: всё гуманитарное + математика — 343 (класс 11 «И»); информатика — 224 (корпус 2, 2 эт.,
// за железной дверью); физика и астрономия — 321; биология — 331; химия — 241; английский — 232
// (корпус 2, 3 эт., вдоль коридора — решение V2-2).
export const SUBJECTS = {
  english: { name: 'Английский', short: 'Англ. яз.', teacher: 'english', file: 'lesson_english', room: '232', roomV2: '232', exact: false, games: ['test'] },
  algebra: { name: 'Алгебра', short: 'Алгебра', teacher: 'math', file: 'lesson_math', room: '343', roomV2: '343', exact: true, games: ['phone_blocks', 'test'] },
  geometry: { name: 'Геометрия', short: 'Геометрия', teacher: 'math', file: 'lesson_math', room: '343', roomV2: '343', exact: true, games: ['test'] },
  russian: { name: 'Русский язык', short: 'Русск. яз.', teacher: 'russian', file: 'lesson_russian', room: '343', roomV2: '343', exact: false, games: ['bait', 'test', 'phone_feed'] },
  rus_lit: { name: 'Русская литература', short: 'Русск. лит.', teacher: 'russian', file: 'lesson_lit', room: '343', roomV2: '343', exact: false, games: ['phone_feed', 'bait'] },
  belarusian: { name: 'Белорусский язык', short: 'Бел. яз.', teacher: 'belarusian', file: 'lesson_belarusian', room: '343', roomV2: '343', exact: false, games: ['phone_feed'] },
  bel_lit: { name: 'Белорусская литература', short: 'Бел. лит.', teacher: 'belarusian', file: 'lesson_bellit', room: '343', roomV2: '343', exact: false, games: ['bait'] },
  physics: { name: 'Физика', short: 'Физика', teacher: 'physics', file: 'lesson_physics', room: '321', roomV2: '321', exact: true, games: ['phone_brawl', 'test'] },
  astronomy: { name: 'Астрономия', short: 'Астрономия', teacher: 'physics', file: 'lesson_astronomy', room: '321', roomV2: '321', exact: true, games: ['phone_brawl'] },
  chemistry: { name: 'Химия', short: 'Химия', teacher: 'chemistry', file: 'lesson_chemistry', room: '241', roomV2: '241', exact: true, games: ['test', 'phone_blocks'] },
  biology: { name: 'Биология', short: 'Биология', teacher: 'biology', file: 'lesson_biology', room: '331', roomV2: '331', exact: false, games: ['phone_feed', 'test'] },
  informatics: { name: 'Информатика', short: 'Информатика', teacher: 'informatics', file: 'lesson_informatics', room: '224', roomV2: '224', exact: true, games: ['phone_brawl'] },
  hist_by: { name: 'История Беларуси', short: 'Ист. Беларуси', teacher: 'history', file: 'lesson_history', room: '343', roomV2: '343', exact: false, games: ['test'] },
  hist_world: { name: 'Всемирная история', short: 'Всем. история', teacher: 'history', file: 'lesson_history', room: '343', roomV2: '343', exact: false, games: ['bait'] },
  geography: { name: 'География', short: 'География', teacher: 'geography', file: 'lesson_geography', room: '343', roomV2: '343', exact: false, games: ['phone_blocks', 'phone_feed'] },
  social: { name: 'Обществоведение', short: 'Обществовед.', teacher: 'social', file: 'lesson_social', room: '343', roomV2: '343', exact: false, games: ['test_quiz'] },
  pe_football: { name: 'Физкультура', short: 'Физра', teacher: 'ivan', file: 'lesson_pe', room: 'спортзал', roomV2: 'спортзал', exact: false, graded: false, games: ['football'] },
  pe_swim: { name: 'Плавание', short: 'Плавание', teacher: 'ivan', file: 'lesson_swim', room: 'бассейн', roomV2: 'бассейн', exact: false, graded: false, games: ['swim'] },
  classhour: { name: 'Классный час', short: 'Кл. час', teacher: 'classteacher', file: 'lesson_classhour', room: '343', roomV2: '343', exact: false, graded: false, games: ['classhour'] },
};

// Неделя 11 «И» (Рома). Условия У-2 проверяет тест (tests/v2_2.test.mjs).
export const WEEK = {
  I: [
    ['english', 'algebra', 'russian', 'physics', 'biology', 'rus_lit'],
    ['english', 'informatics', 'russian', 'hist_by', 'geometry', 'pe_football', 'chemistry'],
    ['algebra', 'russian', 'chemistry', 'geography', 'physics', 'belarusian'],
    ['english', 'biology', 'pe_swim', 'hist_world', 'rus_lit', 'astronomy'],
    ['english', 'bel_lit', 'social', 'geography', 'pe_football', 'classhour'],
  ],
  // 11 «М» (физмат): футбол с «И» во вторник и пятницу в те же уроки.
  M: [
    ['algebra', 'physics', 'english', 'russian', 'informatics', 'chemistry'],
    ['geometry', 'english', 'algebra', 'physics', 'russian', 'pe_football', 'biology'],
    ['physics', 'algebra', 'english', 'hist_by', 'rus_lit', 'astronomy'],
    ['chemistry', 'geometry', 'russian', 'english', 'belarusian', 'geography'],
    ['algebra', 'hist_world', 'social', 'english', 'pe_football', 'classhour'],
  ],
  // 11 «Я» (языковой)
  Ya: [
    ['english', 'russian', 'rus_lit', 'algebra', 'geography', 'english'],
    ['belarusian', 'english', 'hist_by', 'russian', 'biology', 'pe_swim', 'english'],
    ['english', 'social', 'geometry', 'bel_lit', 'chemistry', 'russian'],
    ['rus_lit', 'english', 'algebra', 'physics', 'hist_world', 'pe_football'],
    ['english', 'russian', 'informatics', 'astronomy', 'geography', 'classhour'],
  ],
  // 11 «У» (универсальный)
  U: [
    ['russian', 'english', 'biology', 'chemistry', 'algebra', 'hist_by'],
    ['algebra', 'physics', 'english', 'geography', 'rus_lit', 'pe_swim'],
    ['english', 'biology', 'russian', 'informatics', 'geometry', 'belarusian', 'social'],
    ['chemistry', 'russian', 'physics', 'english', 'pe_football', 'hist_world'],
    ['english', 'astronomy', 'bel_lit', 'algebra', 'geography', 'classhour'],
  ],
};

// Перемены: после урока N. Третья — большая (в столовой).
export const BREAKS = [
  { after: 1, start: '09:45', big: false },
  { after: 2, start: '10:40', big: false },
  { after: 3, start: '11:35', end: '11:55', big: true, place: 'столовая', minigame: 'eat' },
  { after: 4, start: '12:40', big: false },
  { after: 5, start: '13:35', big: false },
  { after: 6, start: '14:30', big: false },
];

// Уроки дня (day 1–5) для класса cls: { n, start, end, subject, subjectId, room, roomV2, building, floor,
// teacher, minigame, exact, graded }. Номер мини-игры — по тому, какой раз предмет идёт на неделе.
export function daySchedule(day, cls = 'I') {
  const week = WEEK[cls];
  const list = week[Math.max(0, Math.min(4, day - 1))];
  return list.map((sid, i) => {
    const S = SUBJECTS[sid];
    let occ = 0;
    for (let d = 0; d < day - 1; d++) occ += week[d].filter((x) => x === sid).length;
    occ += list.slice(0, i).filter((x) => x === sid).length;
    const R = roomPlace(S.room);
    return {
      n: i + 1, ...BELLS[i], subject: S.name, short: S.short, subjectId: sid, room: S.room, roomV2: S.roomV2,
      building: R.building, floor: R.floor, teacher: S.teacher, file: S.file,
      minigame: S.games[occ % S.games.length], exact: S.exact, graded: S.graded !== false,
    };
  });
}

// Совместимость: расписание понедельника (старый код, отладка «по урокам»).
export const SCHEDULE = daySchedule(1);

export function roomLabel(lesson) {
  if (lesson.building === 0) return lesson.room;
  return `каб. ${lesson.room}, корп. ${lesson.building}, ${lesson.floor} эт.`;
}
