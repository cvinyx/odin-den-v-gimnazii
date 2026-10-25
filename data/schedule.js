// Расписание дня (раздел 6).
export const SCHEDULE = [
  { n: 1, start: '09:00', end: '09:45', subject: 'Английский', room: '404', building: 2, floor: 4, teacher: 'english', minigame: 'cheat' },
  { n: 2, start: '09:55', end: '10:40', subject: 'Математика', room: '305', building: 1, floor: 3, teacher: 'math', minigame: 'phone_blocks' },
  { n: 3, start: '10:50', end: '11:35', subject: 'Русский язык', room: '208', building: 2, floor: 2, teacher: 'russian', minigame: 'bait' },
  { n: 4, start: '11:55', end: '12:40', subject: 'Физика', room: '214', building: 1, floor: 2, teacher: 'physics', minigame: 'phone_brawl' },
  { n: 5, start: '12:50', end: '13:35', subject: 'Физкультура', room: 'спортзал', building: 0, floor: 1, teacher: 'ivan', minigame: 'football' },
  { n: 6, start: '13:45', end: '14:30', subject: 'Белорусский', room: '312', building: 2, floor: 3, teacher: 'belarusian', minigame: 'phone_feed' },
  { n: 7, start: '14:40', end: '15:25', subject: 'Обществоведение', room: '115', building: 1, floor: 1, teacher: 'social', minigame: 'cheat_quiz' },
];

// Перемены: после урока N. Третья — большая (в столовой).
export const BREAKS = [
  { after: 1, start: '09:45', big: false },
  { after: 2, start: '10:40', big: false },
  { after: 3, start: '11:35', end: '11:55', big: true, place: 'столовая', minigame: 'eat' },
  { after: 4, start: '12:40', big: false },
  { after: 5, start: '13:35', big: false },
  { after: 6, start: '14:30', big: false },
];

export function roomLabel(lesson) {
  if (lesson.building === 0) return lesson.room;
  return `каб. ${lesson.room}, корп. ${lesson.building}, ${lesson.floor} эт.`;
}
