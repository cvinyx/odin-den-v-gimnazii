// Чистая функция переноса размеченного текста (используется окном диалога и тестами).
// Перенос размеченного текста по словам. Возвращает массив строк (массивы символов).
export function wrapRich(chars, maxChars) {
  const lines = [];
  let line = [];
  let word = [];
  const flushWord = () => {
    if (!word.length) return;
    if (line.length && line.length + 1 + word.length > maxChars) { lines.push(line); line = []; }
    else if (line.length) line.push({ ch: ' ' });
    while (word.length > maxChars) { lines.push(word.slice(0, maxChars)); word = word.slice(maxChars); }
    line = line.concat(word);
    word = [];
  };
  for (const c of chars) {
    if (c.ch === '\n') { flushWord(); lines.push(line); line = []; continue; }
    if (c.ch === ' ') { flushWord(); continue; }
    word.push(c);
  }
  flushWord();
  if (line.length || !lines.length) lines.push(line);
  return lines;
}
