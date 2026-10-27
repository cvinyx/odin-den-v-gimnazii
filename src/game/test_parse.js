// Разбор банка вопросов теста (М-4) из data/tests/<предмет>.txt. Формат — в README («Как дописать вопросы»):
//   ? Текст вопроса
//   + правильный ответ
//   - неправильный ответ   (ещё три строки «-»)
// Пустые строки и строки с // — пропускаются. Чистая функция — работает и в node-тестах.
export function parseTestBank(text) {
  const questions = [];
  const errors = [];
  let cur = null;
  const close = (line) => {
    if (!cur) return;
    const right = cur.options.filter((o) => o.right).length;
    if (cur.options.length !== 4) errors.push({ line: cur.line, msg: `у вопроса ${cur.options.length} вариантов, нужно 4` });
    else if (right !== 1) errors.push({ line: cur.line, msg: `правильных ответов ${right}, нужен 1 (строка с «+»)` });
    else questions.push({ q: cur.q, options: cur.options });
    cur = null;
    void line;
  };
  String(text).split(/\r?\n/).forEach((raw, i) => {
    const line = raw.trim();
    if (!line || line.startsWith('//')) return;
    const kind = line[0], body = line.slice(1).trim();
    if (kind === '?') { close(i); cur = { q: body, options: [], line: i + 1 }; }
    else if ((kind === '+' || kind === '-') && cur) cur.options.push({ text: body, right: kind === '+' });
    else errors.push({ line: i + 1, msg: 'строка должна начинаться с «?», «+» или «-»' });
  });
  close();
  return { questions, errors };
}

// Оценка за тест (М-4, Р-6): число верных из 10, но не ниже минимума предмета.
export function testGrade(correct, minimum) { return Math.max(minimum, Math.min(10, correct)); }
