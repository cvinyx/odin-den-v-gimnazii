// Рисование битмап-шрифта. Глифы рендерятся один раз в атлас; для каждого цвета — свой кэшированный атлас.
import { GLYPHS, GLYPH_W, GLYPH_H, CELL_W, CELL_H, hasGlyph } from './font_glyphs.js';
import { makeCanvas } from './canvas.js';

export { CELL_W, CELL_H };
export const LINE_H = 10; // межстрочный интервал (ячейка 9 + 1)

const CHARS = Object.keys(GLYPHS);
const INDEX = new Map(CHARS.map((c, i) => [c, i]));
const COLS = 32;
let baseAtlas = null;
const tinted = new Map();

function buildBase() {
  const rows = Math.ceil((CHARS.length + 1) / COLS);
  const cv = makeCanvas(COLS * CELL_W, rows * CELL_H);
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#fff';
  CHARS.forEach((ch, i) => {
    const gx = (i % COLS) * CELL_W;
    const gy = Math.floor(i / COLS) * CELL_H;
    const g = GLYPHS[ch];
    for (let y = 0; y < GLYPH_H; y++) {
      for (let x = 0; x < GLYPH_W; x++) if (g[y][x] === '#') ctx.fillRect(gx + x, gy + y, 1, 1);
    }
  });
  // Последняя ячейка — «нет глифа»: рамка.
  const i = CHARS.length;
  const gx = (i % COLS) * CELL_W, gy = Math.floor(i / COLS) * CELL_H;
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1;
  ctx.strokeRect(gx + 0.5, gy + 0.5, GLYPH_W - 1, 6);
  baseAtlas = cv;
}

function atlasFor(color) {
  if (!baseAtlas) buildBase();
  let a = tinted.get(color);
  if (a) return a;
  a = makeCanvas(baseAtlas.width, baseAtlas.height);
  const ctx = a.getContext('2d');
  ctx.drawImage(baseAtlas, 0, 0);
  ctx.globalCompositeOperation = 'source-in';
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, a.width, a.height);
  tinted.set(color, a);
  return a;
}

// Нарисовать один символ. scale — целый (1 или 2).
export function drawGlyph(ctx, ch, x, y, color = '#fff', scale = 1) {
  if (ch === ' ' || ch === '\n') return;
  const idx = INDEX.has(ch) ? INDEX.get(ch) : CHARS.length;
  const atlas = atlasFor(color);
  const sx = (idx % COLS) * CELL_W;
  const sy = Math.floor(idx / COLS) * CELL_H;
  ctx.drawImage(atlas, sx, sy, CELL_W, CELL_H, Math.round(x), Math.round(y), CELL_W * scale, CELL_H * scale);
}

export function measure(str, scale = 1) {
  let max = 0;
  for (const line of String(str).split('\n')) max = Math.max(max, [...line].length);
  return max * CELL_W * scale;
}

// Строка (с \n). opts: color, scale, shadow (цвет тени), align: 'left'|'center'|'right'.
export function drawText(ctx, str, x, y, opts = {}) {
  const color = opts.color || '#fff';
  const scale = opts.scale || 1;
  const lineH = (opts.lineH || LINE_H) * scale;
  const lines = String(str).split('\n');
  lines.forEach((line, li) => {
    const chars = [...line];
    let lx = x;
    const w = chars.length * CELL_W * scale;
    if (opts.align === 'center') lx = Math.round(x - w / 2);
    else if (opts.align === 'right') lx = x - w;
    const ly = y + li * lineH;
    chars.forEach((ch, i) => {
      if (opts.shadow) drawGlyph(ctx, ch, lx + i * CELL_W * scale + scale, ly + scale, opts.shadow, scale);
      drawGlyph(ctx, ch, lx + i * CELL_W * scale, ly, color, scale);
    });
  });
}

// Перенос по словам в заданную ширину (в пикселях). Возвращает массив строк.
export function wrapText(str, maxWidth, scale = 1) {
  const maxChars = Math.max(1, Math.floor(maxWidth / (CELL_W * scale)));
  return wrapChars(str, maxChars);
}

// Перенос по количеству символов. Чистая функция — используется и в тестах.
export function wrapChars(str, maxChars) {
  const out = [];
  for (const para of String(str).split('\n')) {
    const words = para.split(' ');
    let line = '';
    for (let word of words) {
      // Слишком длинное слово режем на куски.
      while ([...word].length > maxChars) {
        const room = line ? maxChars - [...line].length - 1 : maxChars;
        if (room <= 0) { out.push(line); line = ''; continue; }
        const chars = [...word];
        const head = chars.slice(0, room).join('');
        word = chars.slice(room).join('');
        out.push(line ? line + ' ' + head : head);
        line = '';
      }
      if (!line) line = word;
      else if ([...line].length + 1 + [...word].length <= maxChars) line += ' ' + word;
      else { out.push(line); line = word; }
    }
    out.push(line);
  }
  return out;
}

export { hasGlyph };
