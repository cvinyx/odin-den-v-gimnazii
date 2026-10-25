// Расписание недели (EDITS_V2: У-2, Л-8, Р-1). Звонки — как в версии 1, 7-й урок — 14:40–15:25.
// room — кабинет на ТЕКУЩЕЙ карте (номер на двери), roomV2 — номер по новой нумерации Л-2/Л-8
// (карты переедут на этапе V2-3, тогда room = roomV2).

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

// Кабинеты текущей карты: корпус и этаж (корпус 1 — левый, 2 — правый; 0 — спортзал/бассейн).
const ROOMS = {
  '404': { building: 2, floor: 4 },
  '305': { building: 1, floor: 3 },
  '208': { building: 2, floor: 2 },
  '214': { building: 1, floor: 2 },
  '312': { building: 2, floor: 3 },
  '115': { building: 1, floor: 1 },
  'спортзал': { building: 0, floor: 1 },
  'бассейн': { building: 0, floor: 0 },
};

// Предметы. exact — точный (минимальная оценка 1, Р-6), иначе гуманитарный (минимум 2).
// graded: false — оценок нет никогда (У-6). games — главная мини-игра по очереди за неделю.
// Где по Л-8: всё гуманитарное + математика — 343 (класс 11 «И»); информатика — 2-й корпус, 2 эт.
// (за железной дверью); физика и астрономия — 3-й корпус, 2 эт.; биология — 3-й корпус, 3 эт.;
// химия — 2-й корпус, 4 эт.; английский — 2-й корпус, 3 эт., вдоль коридора (решение V2-2).
export const SUBJECTS = {
  english: { name: 'Английский', short: 'Англ. яз.', teacher: 'english', file: 'lesson_english', room: '305', roomV2: '232', exact: false, games: ['cheat'] },
  algebra: { name: 'Алгебра', short: 'Алгебра', teacher: 'math', file: 'lesson_math', room: '404', roomV2: '343', exact: true, games: ['phone_blocks', 'cheat'] },
  geometry: { name: 'Геометрия', short: 'Геометрия', teacher: 'math', file: 'lesson_math', room: '404', roomV2: '343', exact: true, games: ['cheat'] },
  russian: { name: 'Русский язык', short: 'Русск. яз.', teacher: 'russian', file: 'lesson_russian', room: '404', roomV2: '343', exact: false, games: ['bait', 'cheat', 'phone_feed'] },
  rus_lit: { name: 'Русская литература', short: 'Русск. лит.', teacher: 'russian', file: 'lesson_lit', room: '404', roomV2: '343', exact: false, games: ['phone_feed', 'bait'] },
  belarusian: { name: 'Белорусский язык', short: 'Бел. яз.', teacher: 'belarusian', file: 'lesson_belarusian', room: '404', roomV2: '343', exact: false, games: ['phone_feed'] },
  bel_lit: { name: 'Белорусская литература', short: 'Бел. лит.', teacher: 'belarusian', file: 'lesson_bellit', room: '404', roomV2: '343', exact: false, games: ['bait'] },
  physics: { name: 'Физика', short: 'Физика', teacher: 'physics', file: 'lesson_physics', room: '208', roomV2: '321', exact: true, games: ['phone_brawl', 'cheat'] },
  astronomy: { name: 'Астрономия', short: 'Астрономия', teacher: 'physics', file: 'lesson_astronomy', room: '208', roomV2: '321', exact: true, games: ['phone_brawl'] },
  chemistry: { name: 'Химия', short: 'Химия', teacher: 'chemistry', file: 'lesson_chemistry', room: '305', roomV2: '241', exact: true, games: ['cheat', 'phone_blocks'] },
  biology: { name: 'Биология', short: 'Биология', teacher: 'biology', file: 'lesson_biology', room: '312', roomV2: '331', exact: false, games: ['phone_feed', 'cheat'] },
  informatics: { name: 'Информатика', short: 'Информатика', teacher: 'informatics', file: 'lesson_informatics', room: '214', roomV2: '221', exact: true, games: ['phone_brawl'] },
  hist_by: { name: 'История Беларуси', short: 'Ист. Беларуси', teacher: 'history', file: 'lesson_history', room: '404', roomV2: '343', exact: false, games: ['cheat'] },
  hist_world: { name: 'Всемирная история', short: 'Всем. история', teacher: 'history', file: 'lesson_history', room: '404', roomV2: '343', exact: false, games: ['bait'] },
  geography: { name: 'География', short: 'География', teacher: 'geography', file: 'lesson_geography', room: '404', roomV2: '343', exact: false, games: ['phone_blocks', 'phone_feed'] },
  social: { name: 'Обществоведение', short: 'Обществовед.', teacher: 'social', file: 'lesson_social', room: '404', roomV2: '343', exact: false, games: ['cheat_quiz'] },
  pe_football: { name: 'Физкультура', short: 'Физра', teacher: 'ivan', file: 'lesson_pe', room: 'спортзал', roomV2: 'спортзал', exact: false, graded: false, games: ['football'] },
  pe_swim: { name: 'Плавание', short: 'Плавание', teacher: 'ivan', file: 'lesson_swim', room: 'бассейн', roomV2: 'бассейн', exact: false, graded: false, games: ['swim_stub'] },
  classhour: { name: 'Классный час', short: 'Кл. час', teacher: 'classteacher', file: 'lesson_classhour', room: '404', roomV2: '343', exact: false, graded: false, games: ['classhour_stub'] },
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
    const R = ROOMS[S.room];
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
