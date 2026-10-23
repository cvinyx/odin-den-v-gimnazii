// Предпросмотр генератора: листы спрайтов и портреты всех персонажей → PNG.
import { CHARACTERS, STUDENT_ORDER } from '../data/characters.js';
import { TEACHERS, TEACHER_ORDER } from '../data/teachers.js';
import { buildSheetPixels } from '../src/gen/sprites.js';
import { buildPortraitPixels, EMOTIONS } from '../src/gen/portraits.js';
import { writePng } from './png.mjs';

const out = process.argv[2] || '.';
function sheetPreview(ids, table, file) {
  const cells = ids.filter((id) => !table[id].voiceOnly).map((id, i) => ({ px: buildSheetPixels(table[id]), x: i * 50, y: 0 }));
  writePng(file, cells.length * 50, 128, cells, 3);
}
function portraitPreview(ids, table, file) {
  const cells = [];
  ids.forEach((id, row) => EMOTIONS.forEach((e, col) => cells.push({ px: buildPortraitPixels(table[id], e), x: col * 50, y: row * 50 })));
  writePng(file, EMOTIONS.length * 50, ids.length * 50, cells, 2);
}
sheetPreview(STUDENT_ORDER, CHARACTERS, out + '/students_sheets.png');
sheetPreview(TEACHER_ORDER, TEACHERS, out + '/teachers_sheets.png');
portraitPreview(STUDENT_ORDER.slice(0, 8), CHARACTERS, out + '/students_portraits_1.png');
portraitPreview(STUDENT_ORDER.slice(8), CHARACTERS, out + '/students_portraits_2.png');
portraitPreview(TEACHER_ORDER, TEACHERS, out + '/teachers_portraits.png');
console.log('ok');
