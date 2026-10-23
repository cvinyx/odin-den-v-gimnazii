// Рисует каждую карту целиком в PNG (без браузера): проверка, что нет дыр в стенах и обрезанных тайлов.
// Запуск: node tools/render_maps.mjs [папка]
import fs from 'node:fs';
import { MAPS } from '../src/world/maps/index.js';
import { TILE_DEFS, tilePixels } from '../src/gen/tiles.js';
import { writePng } from './png.mjs';

const out = process.argv[2] || 'docs/screenshots/etap-3/karty';
fs.mkdirSync(out, { recursive: true });
const cache = new Map();
const tile = (ch, v) => {
  const def = TILE_DEFS[ch];
  const vv = def.variants ? v % def.variants : 0;
  const k = def.name + vv;
  if (!cache.has(k)) cache.set(k, tilePixels(def.name, vv));
  return cache.get(k);
};
for (const [id, m] of Object.entries(MAPS)) {
  const w = m.rows[0].length, h = m.rows.length;
  const cells = [];
  m.rows.forEach((row, y) => [...row].forEach((ch, x) => {
    const variant = ch === 'B' || ch === 'F' ? x : ch === '.' ? x + y : x * 7 + y * 3;
    if (TILE_DEFS[ch].overlay) cells.push({ px: tile(m.floor || '.', x + y), x: x * 16, y: y * 16 });
    cells.push({ px: tile(ch, variant), x: x * 16, y: y * 16 });
  }));
  writePng(`${out}/${id}.png`, w * 16, h * 16, cells, 1, '#000000');
}
console.log('карт:', Object.keys(MAPS).length);
