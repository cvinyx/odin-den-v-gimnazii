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
  terr: '#a7a49c', terrD: '#97948c', terrL: '#b7b4ac', terrS: '#9c9991',
  tile: '#dfe8ee', tileD: '#b9c6d0',
  stair: '#9b9890', stairD: '#6c6a64', stairL: '#c4c1b9',
  stallC: '#5b86a8',
  asph: '#6a6a70', asphD: '#56565c', asphL: '#7e7e84',
  side: '#a9a59c', sideD: '#8e8a82',
  grass: '#4f8f3f', grassD: '#3f7a32', grassL: '#6aa856',
  brick: '#d9c9a8', brickD: '#bfae8c',
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
    px.rect(1, 3, 14, 8, C.wood);
    px.hline(1, 14, 3, C.woodL);
    px.rect(1, 11, 14, 2, C.woodD);
    px.vline(2, 13, 15, C.metalD); px.vline(13, 13, 15, C.metalD);
    px.rect(4, 5, 4, 3, '#f0ede0'); px.hline(5, 6, 6, '#8a8a9a');
  },
  plant(px) {
    px.rect(5, 10, 6, 5, C.pot);
    px.hline(5, 10, 10, shade(C.pot, 1.2));
    for (const [x, y, w, h] of [[4, 4, 3, 6], [9, 3, 3, 7], [6, 1, 4, 8], [2, 6, 3, 3], [11, 6, 3, 3]]) px.rect(x, y, w, h, C.plant);
    px.set(7, 2, C.plantD); px.set(10, 5, C.plantD); px.set(5, 6, C.plantD);
  },
  bench(px) {
    px.rect(0, 6, 16, 4, C.woodL);
    px.hline(0, 15, 9, C.woodD);
    px.vline(2, 10, 13, C.metalD); px.vline(13, 10, 13, C.metalD);
  },
  // Терраццо рекреации: серая крошка.
  terrazzo(px, v) {
    px.rect(0, 0, 16, 16, C.terr);
    for (let i = 0; i < 14; i++) {
      const x = (i * 7 + v * 5) % 16, y = (i * 11 + v * 3) % 16;
      px.set(x, y, i % 3 ? C.terrD : C.terrL);
    }
    // плиты 2×2 тайла с тонкими швами
    if (v % 2 === 0) px.hline(0, 15, 0, C.terrS);
    if (v % 3 === 0) px.vline(0, 0, 15, C.terrS);
  },
  // Кафель туалета: мелкая плитка.
  tiles(px) {
    px.rect(0, 0, 16, 16, C.tile);
    for (let i = 0; i < 16; i += 4) { px.hline(0, 15, i, C.tileD); px.vline(i, 0, 15, C.tileD); }
  },
  stairs(px) {
    px.rect(0, 0, 16, 16, C.stairD);
    for (let y = 0; y < 16; y += 4) { px.rect(0, y, 16, 3, C.stair); px.hline(0, 15, y, C.stairL); }
    px.vline(0, 0, 15, C.metalD); px.vline(15, 0, 15, C.metalD);
  },
  stall(px) {
    px.rect(0, 0, 16, 16, C.stallC);
    px.rect(1, 1, 14, 13, shade(C.stallC, 1.1));
    px.vline(0, 0, 15, shade(C.stallC, 0.7));
    px.rect(11, 7, 2, 2, C.metal);
    px.hline(0, 15, 15, shade(C.stallC, 0.6));
  },
  sink(px) {
    px.rect(2, 2, 12, 8, '#f2f4f6');
    px.rect(4, 4, 8, 4, '#c9d6e0');
    px.rect(7, 0, 2, 3, C.metal);
    px.rect(6, 10, 4, 5, '#d8dde2');
  },
  mirror(px) {
    paintedWall(px);
    px.rect(2, 1, 12, 9, '#9aa3ad');
    px.rect(3, 2, 10, 7, '#cfe3ef');
    px.set(4, 3, '#ffffff'); px.set(5, 3, '#ffffff'); px.set(4, 4, '#ffffff');
  },
  asphalt(px, v) {
    px.rect(0, 0, 16, 16, C.asph);
    for (let i = 0; i < 10; i++) px.set((i * 5 + v * 3) % 16, (i * 7 + v) % 16, i % 2 ? C.asphD : C.asphL);
  },
  sidewalk(px) {
    px.rect(0, 0, 16, 16, C.side);
    px.hline(0, 15, 0, C.sideD); px.vline(0, 0, 15, C.sideD);
    px.hline(0, 7, 8, C.sideD); px.vline(8, 0, 15, C.sideD);
  },
  grass(px, v) {
    px.rect(0, 0, 16, 16, C.grass);
    for (let i = 0; i < 12; i++) px.set((i * 5 + v * 7) % 16, (i * 3 + v * 5) % 16, i % 2 ? C.grassD : C.grassL);
  },
  tree(px) {
    BUILDERS.grass(px, 1);
    px.rect(7, 11, 2, 5, C.woodD);
    for (const [x, y, w, h] of [[3, 2, 10, 9], [2, 4, 12, 5], [5, 0, 6, 12]]) px.rect(x, y, w, h, C.plant);
    px.set(5, 3, C.plantD); px.set(10, 5, C.plantD); px.set(7, 8, C.plantD); px.set(6, 1, '#5aae4a');
  },
  fence(px) {
    for (let x = 1; x < 16; x += 4) px.rect(x, 2, 2, 13, '#2d3a2d');
    px.hline(0, 15, 4, '#3e4e3e'); px.hline(0, 15, 11, '#3e4e3e');
  },
  road(px, v) {
    px.rect(0, 0, 16, 16, '#3a3a40');
    if (v % 2 === 0) px.rect(2, 7, 8, 2, '#e8e8e0');
  },
  curb(px) {
    px.rect(0, 0, 16, 16, C.asph);
    px.rect(0, 12, 16, 4, '#b8b8b0');
    px.hline(0, 15, 12, '#d8d8d0');
  },
  shelter(px, v) {
    px.rect(0, 0, 16, 16, C.asph);
    px.rect(0, 0, 16, 5, '#2f5f8f');
    px.hline(0, 15, 5, '#1f3f60');
    px.rect(1, 6, 14, 6, '#9fd0e8');
    px.vline(v % 2 ? 15 : 0, 5, 15, C.metalD);
    px.rect(2, 12, 12, 2, C.woodL);
  },
  facade(px, v) {
    px.rect(0, 0, 16, 16, C.brick);
    for (let y = 0; y < 16; y += 4) {
      px.hline(0, 15, y, C.brickD);
      for (let x = (y / 4) % 2 ? 4 : 0; x < 16; x += 8) px.vline(x, y, y + 3, C.brickD);
    }
    if (v % 3 !== 1) {
      px.rect(3, 3, 10, 9, C.frame);
      px.rect(4, 4, 8, 7, C.glass);
      px.vline(8, 4, 10, C.frame);
      px.set(5, 5, C.glassL);
    }
  },
  entrance(px) {
    px.rect(0, 0, 16, 16, C.brick);
    px.rect(1, 1, 14, 15, '#5a6470');
    px.rect(2, 2, 12, 14, C.glass);
    px.vline(7, 2, 15, '#5a6470'); px.vline(8, 2, 15, '#5a6470');
    px.set(3, 3, C.glassL); px.set(10, 3, C.glassL);
  },
  teacherDesk(px) {
    px.rect(0, 3, 16, 10, C.woodD);
    px.rect(1, 3, 14, 8, C.wood);
    px.hline(1, 14, 3, C.woodL);
    px.rect(3, 5, 5, 4, '#f0ede0');
    px.rect(10, 4, 3, 4, '#3a5a8a');
  },
  column(px) {
    px.rect(3, 0, 10, 16, '#e4ddc8');
    px.vline(3, 0, 15, '#b8b2a0'); px.vline(12, 0, 15, '#b8b2a0');
    px.vline(5, 0, 15, '#f2ecda');
    px.rect(1, 13, 14, 3, '#8f8a7c');
    px.rect(2, 0, 12, 2, '#c8c2b0');
  },
  notice(px) {
    paintedWall(px);
    px.rect(1, 1, 14, 11, '#8a5a32');
    px.rect(2, 2, 12, 9, '#c9a46a');
    px.rect(3, 3, 4, 3, '#f4f4f4'); px.rect(8, 3, 5, 4, '#ffe8a0'); px.rect(4, 7, 5, 3, '#f4c0c0');
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
  'T': { name: 'desk', solid: true, overlay: true },
  'P': { name: 'plant', solid: true, overlay: true },
  'b': { name: 'bench', solid: true, overlay: true },
  'q': { name: 'terrazzo', variants: 4, solid: false },
  'x': { name: 'tiles', solid: false },
  'S': { name: 'stairs', solid: true },
  'k': { name: 'stall', solid: true },
  's': { name: 'sink', solid: true, overlay: true },
  'M': { name: 'mirror', solid: true },
  'a': { name: 'asphalt', variants: 3, solid: false },
  'p': { name: 'sidewalk', solid: false },
  'g': { name: 'grass', variants: 3, solid: false },
  't': { name: 'tree', solid: true },
  'f': { name: 'fence', solid: true, overlay: true },
  'r': { name: 'road', variants: 2, solid: true },
  'c': { name: 'curb', solid: false },
  'h': { name: 'shelter', variants: 2, solid: true },
  'F': { name: 'facade', variants: 3, solid: true },
  'E': { name: 'entrance', solid: true },
  'Y': { name: 'teacherDesk', solid: true, overlay: true },
  'C': { name: 'column', solid: true, overlay: true },
  'N': { name: 'notice', solid: true },
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
