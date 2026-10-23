// Тайлы 16×16, генерируются кодом один раз. Атмосфера постсоветской школы: зелёная панель на стенах,
// линолеум «в клетку», батареи под окнами, коричневые парты, тёмно-зелёная доска.
import { Pixels } from './pixels.js';
import { shade } from './color.js';

export const TILE = 16;

const C = {
  floor: '#c9b48a', floorD: '#b59f74', floorL: '#d8c59c',
  wallTop: '#3b3346', wallTopL: '#4e445c',
  paintLow: '#5f8f6e', paintLowD: '#4d775a', paintHigh: '#e8e2cf', paintHighD: '#d2cbb5', stripe: '#3f6650',
  wood: '#8a5a32', woodD: '#6b4424', woodL: '#a8733f',
  board: '#2f4a3a', boardD: '#243a2d', chalk: '#e8efe8',
  glass: '#9ccbe8', glassL: '#cfe8f7', frame: '#f2f2ee',
  metal: '#9aa3ad', metalD: '#727b85',
  plant: '#3f8f3f', plantD: '#2c6b2e', pot: '#b0532f',
  locker: '#5d7aa6', lockerD: '#4a6288',
  carpet: '#9b3b3b', carpetD: '#7e2e2e',
};

function paintedWall(px) {
  px.rect(0, 0, 16, 16, C.paintHigh);
  px.rect(0, 7, 16, 9, C.paintLow);
  px.hline(0, 15, 6, C.stripe);
  px.hline(0, 15, 15, C.paintLowD);
  for (let x = 1; x < 16; x += 5) px.set(x, 3, C.paintHighD);
  for (let x = 3; x < 16; x += 6) px.set(x, 11, C.paintLowD);
}

const BUILDERS = {
  floor(px, v) {
    px.rect(0, 0, 16, 16, C.floor);
    // линолеум: крупная клетка 8×8 с разными оттенками
    const dark = v % 2 ? C.floorD : C.floor;
    px.rect(0, 0, 8, 8, dark); px.rect(8, 8, 8, 8, dark);
    px.hline(0, 15, 0, C.floorL); px.vline(0, 0, 15, C.floorL);
  },
  carpet(px) {
    px.rect(0, 0, 16, 16, C.carpet);
    for (let y = 0; y < 16; y += 4) for (let x = (y / 4) % 2 ? 2 : 0; x < 16; x += 4) px.set(x, y, C.carpetD);
  },
  wallTop(px) {
    px.rect(0, 0, 16, 16, C.wallTop);
    px.hline(0, 15, 15, C.wallTopL);
  },
  wall(px) { paintedWall(px); },
  window(px) {
    paintedWall(px);
    px.rect(2, 1, 12, 10, C.frame);
    px.rect(3, 2, 10, 8, C.glass);
    px.vline(7, 2, 9, C.frame); px.vline(8, 2, 9, C.frame);
    px.set(4, 3, C.glassL); px.set(5, 3, C.glassL); px.set(4, 4, C.glassL);
    px.set(10, 3, C.glassL);
    // батарея под окном
    px.rect(3, 12, 10, 3, C.metal);
    for (let x = 4; x < 13; x += 2) px.vline(x, 12, 14, C.metalD);
  },
  door(px) {
    paintedWall(px);
    px.rect(3, 0, 10, 16, C.woodD);
    px.rect(4, 1, 8, 15, C.wood);
    px.rect(5, 2, 6, 5, C.woodL);
    px.rect(10, 9, 2, 1, '#d8c070');
  },
  board(px, v) {
    paintedWall(px);
    px.rect(0, 1, 16, 11, C.woodD);
    px.rect(0, 2, 16, 9, C.board);
    px.hline(0, 15, 12, C.metalD);
    if (v === 0) { px.hline(3, 8, 4, C.chalk); px.hline(3, 6, 6, C.chalk); }
    if (v === 1) { px.hline(2, 4, 5, C.chalk); px.set(6, 5, C.chalk); px.hline(8, 12, 5, C.chalk); px.hline(4, 10, 8, C.chalk); }
    if (v === 2) { px.set(5, 4, C.chalk); px.set(6, 5, C.chalk); px.set(7, 6, C.chalk); px.hline(9, 13, 7, C.chalk); }
  },
  locker(px) {
    px.rect(0, 0, 16, 16, C.locker);
    px.vline(7, 0, 15, C.lockerD); px.vline(15, 0, 15, C.lockerD);
    for (const x of [2, 10]) { px.hline(x, x + 3, 2, C.lockerD); px.hline(x, x + 3, 4, C.lockerD); }
    px.set(5, 9, C.metal); px.set(13, 9, C.metal);
    px.hline(0, 15, 15, shade(C.locker, 0.6));
  },
  desk(px) {
    BUILDERS.floor(px, 0);
    px.rect(1, 3, 14, 8, C.wood);
    px.hline(1, 14, 3, C.woodL);
    px.rect(1, 11, 14, 2, C.woodD);
    px.vline(2, 13, 15, C.metalD); px.vline(13, 13, 15, C.metalD);
    px.rect(4, 5, 4, 3, '#f0ede0'); px.hline(5, 6, 6, '#8a8a9a');
  },
  plant(px) {
    BUILDERS.floor(px, 1);
    px.rect(5, 10, 6, 5, C.pot);
    px.hline(5, 10, 10, shade(C.pot, 1.2));
    for (const [x, y, w, h] of [[4, 4, 3, 6], [9, 3, 3, 7], [6, 1, 4, 8], [2, 6, 3, 3], [11, 6, 3, 3]]) px.rect(x, y, w, h, C.plant);
    px.set(7, 2, C.plantD); px.set(10, 5, C.plantD); px.set(5, 6, C.plantD);
  },
  bench(px) {
    BUILDERS.floor(px, 0);
    px.rect(0, 6, 16, 4, C.woodL);
    px.hline(0, 15, 9, C.woodD);
    px.vline(2, 10, 13, C.metalD); px.vline(13, 10, 13, C.metalD);
  },
};

// Варианты тайлов (у пола — шахматка, у доски — разные «надписи мелом»).
export const TILE_DEFS = {
  '.': { name: 'floor', variants: 2, solid: false },
  ',': { name: 'carpet', solid: false },
  '#': { name: 'wallTop', solid: true },
  'W': { name: 'wall', solid: true },
  'w': { name: 'window', solid: true },
  'D': { name: 'door', solid: true },
  'B': { name: 'board', variants: 3, solid: true },
  'L': { name: 'locker', solid: true },
  'T': { name: 'desk', solid: true },
  'P': { name: 'plant', solid: true },
  'b': { name: 'bench', solid: true },
};

const cache = new Map();

export function tilePixels(name, variant = 0) {
  const px = new Pixels(TILE, TILE);
  BUILDERS[name](px, variant);
  return px;
}

export function getTile(ch, variant = 0) {
  const def = TILE_DEFS[ch] || TILE_DEFS['.'];
  const v = def.variants ? variant % def.variants : 0;
  const key = def.name + v;
  let c = cache.get(key);
  if (!c) { c = tilePixels(def.name, v).toCanvas(); cache.set(key, c); }
  return c;
}

export function isSolidChar(ch) {
  const def = TILE_DEFS[ch];
  return def ? def.solid : true;
}
