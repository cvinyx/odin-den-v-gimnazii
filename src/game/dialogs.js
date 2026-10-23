// Загрузка всех файлов диалогов из data/dialogs/*.txt (импорт как текст) и их разбор.
import { parseDialog, DialogParseError } from '../ui/dialog_script.js';
import { personExists } from '../gen/people.js';

const files = import.meta.glob('../../data/dialogs/*.txt', { query: '?raw', import: 'default', eager: true });

const parsed = new Map();

export function dialogFileNames() {
  return Object.keys(files).map((p) => p.split('/').pop().replace(/\.txt$/, ''));
}

// Возвращает разобранный файл; при ошибках бросает DialogParseError с номерами строк.
export function getDialog(name) {
  if (parsed.has(name)) return parsed.get(name);
  const key = Object.keys(files).find((p) => p.endsWith('/' + name + '.txt'));
  if (!key) throw new Error(`Нет файла диалогов data/dialogs/${name}.txt`);
  const res = parseDialog(files[key], { speakers: personExists });
  if (res.errors.length) throw new DialogParseError(res.errors, `data/dialogs/${name}.txt`);
  parsed.set(name, res);
  return res;
}

// Проверить все файлы при старте: ошибки — в консоль (игра не падает).
export function validateAllDialogs() {
  const problems = [];
  for (const name of dialogFileNames()) {
    try { getDialog(name); } catch (e) { problems.push(e.message); console.error(e.message); }
  }
  return problems;
}
