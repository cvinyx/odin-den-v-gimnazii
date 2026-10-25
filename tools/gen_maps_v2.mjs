// Генератор карт версии 2 (этап V2-3, пункты Л-1…Л-25, ИС-6, Р-9, Р-10). Пишет файлы в src/world/maps/
// и реестр index.js. Запуск: node tools/gen_maps_v2.mjs. Карты потом можно править руками — генератор
// нужен, чтобы 8 этажей корпусов, туалеты и кабинеты были одинаково устроены.
// Легенда тайлов — src/gen/tiles.js (TILE_DEFS).
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const dir = path.join(root, 'src/world/maps');
const OLD = ['cab_115', 'cab_208', 'cab_214', 'cab_305', 'cab_312', 'cab_404', 'k1_f1', 'k1_f2', 'k1_f3', 'k1_f4', 'k1_f4_toilet',
  'k2_f1', 'k2_f2', 'k2_f3', 'k2_f4', 'k2_f4_toilet', 'rec_f1', 'rec_f2', 'rec_toilet'];

// Исходные планы версии 1 берём из git (файлы карт версии 1 генератор удаляет).
function v1Rows(id) {
  const src = execSync(`git show 81949fd:src/world/maps/${id}.js`, { cwd: root }).toString();
  return [...src.matchAll(/^\s+'([^']*)',?$/gm)].map((m) => m[1]).filter((r) => r.length >= 10);
}
const REC_F1_ROWS = v1Rows('rec_f1');

class Grid {
  constructor(w, h, ch = '#') { this.w = w; this.h = h; this.a = Array.from({ length: h }, () => Array(w).fill(ch)); }
  set(x, y, ch) { if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.a[y][x] = ch; }
  get(x, y) { return this.a[y][x]; }
  fill(x0, y0, x1, y1, ch) { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) this.set(x, y, ch); }
  str(x, y, s) { [...s].forEach((c, i) => this.set(x + i, y, c)); }
  rows() { return this.a.map((r) => r.join('')); }
}

const maps = {};
function add(def) { maps[def.id] = def; }

// ---------- Номера кабинетов (Л-2): корпус, этаж, порядковый номер на этаже ----------
// Где что (Л-8, Л-15, Л-21): классы — 343 «И», 244 «М», 246 «Я», 325 «У»; предметы — 232 английский,
// 224 информатика (за железной дверью), 241 химия, 321 физика/астрономия, 331 биология.
const CLASSES = { '343': '11 «И»', '244': '11 «М»', '246': '11 «Я»', '325': '11 «У»' };
const SUBJECT_ROOMS = { '232': 'Английский', '224': 'Информатика', '241': 'Химия', '321': 'Физика', '331': 'Биология' };
const SPECIAL = {
  '327': { locked: 'Кабинет директора. Без вызова туда лучше не заходить.', label: 'Директор' },
  '337': { locked: 'Учительская. Ученикам нельзя.', label: 'Учительская' },
};

// ---------- Этаж корпуса 2 или 3 (Л-3, Л-4, Л-19) ----------
// Главный коридор (3 кабинета вдоль стены) → почти в конце развилка на два маленьких коридора:
// верхний — 3 кабинета (4–6), нижний — 3 кабинета (7–9) и туалеты Ж, М, учительский.
// Лестницы — в начале и в конце. Корпус 3 строится как есть, корпус 2 — зеркально (он слева от рекреации).
function buildingFloor(b, f) {
  const W = 46, H = 24, g = new Grid(W, H);
  g.fill(1, 9, 44, 11, '.');
  for (let x = 1; x <= 44; x++) { g.set(x, 8, 'W'); g.set(x, 12, x % 4 === 2 ? 'w' : 'W'); }
  // маленькие коридоры
  g.fill(33, 2, 35, 8, '.'); g.fill(33, 12, 35, 21, '.');
  for (let y = 1; y <= 8; y++) { g.set(32, y, 'W'); g.set(36, y, 'W'); }
  for (let y = 12; y <= 21; y++) { g.set(32, y, '#'); g.set(36, y, '#'); }
  g.str(33, 1, 'WNW');
  g.set(32, 8, b === 2 && f === 2 ? '=' : 'W'); g.set(36, 8, b === 2 && f === 2 ? '=' : 'W'); // Л-17: железная дверь
  g.fill(33, 22, 35, 22, '#');
  g.set(31, 12, 'W'); g.set(37, 12, 'W');
  if (f <= 2) g.fill(0, 9, 0, 11, '.'); // проход в рекреацию (1 эт.) и на 2-й этаж корпуса 1 (Л-5)
  // лестницы
  g.str(2, 8, 'SS'); g.str(41, 8, 'SS');
  const exits = [
    { x: 2, y: 8, stairs: true, label: 'Лестница' }, { x: 3, y: 8, stairs: true },
    { x: 41, y: 8, stairs: true, stairsSpawn: 'stairs2', label: 'Лестница' }, { x: 42, y: 8, stairs: true, stairsSpawn: 'stairs2' },
  ];
  const spawns = { stairs: { x: 2, y: 9, dir: 'down' }, stairs2: { x: 41, y: 9, dir: 'down' } };
  // двери: [номер, x, y, сторона]
  const doors = [[1, 10, 8, 'top'], [2, 17, 8, 'top'], [3, 24, 8, 'top'], [4, 32, 3, 'left'], [5, 32, 6, 'left'], [6, 36, 4, 'right'],
    [7, 32, 14, 'left'], [8, 32, 18, 'left'], [9, 34, 22, 'bottom']];
  const front = { top: [0, 1, 'down'], left: [1, 0, 'right'], right: [-1, 0, 'left'], bottom: [0, -1, 'up'] };
  for (const [k, x, y, side] of doors) {
    const no = `${b}${f}${k}`;
    g.set(x, y, 'D');
    const [dx, dy, dir] = front[side];
    spawns['door' + no] = { x: x + dx, y: y + dy, dir };
    let e;
    if (CLASSES[no]) e = { to: 'cab_' + no, spawn: 'door', label: `${no} ${CLASSES[no]}` };
    else if (SUBJECT_ROOMS[no]) e = { room: no, label: no };
    else if (SPECIAL[no]) e = { ...SPECIAL[no] };
    else e = { locked: `Кабинет ${no}. Заперто.`, label: no };
    exits.push({ x, y, ...e });
  }
  // туалеты (Л-3, Л-18): справа в нижнем маленьком коридоре
  const wc = [[13, 'women', 'Ж'], [16, 'men', 'М'], [19, 'teachers', 'Учит.']];
  for (const [y, kind, label] of wc) {
    g.set(36, y, 'D');
    if (kind === 'men') { exits.push({ x: 36, y, to: `c${b}_f${f}_wc`, spawn: 'door', label }); spawns.wc = { x: 35, y, dir: 'left' }; }
    else exits.push({ x: 36, y, deny: kind, label });
  }
  if (f <= 2) {
    const to = f === 1 ? 'c1_f1' : 'c1_f2', spawn = b === 2 ? 'c2' : 'c3';
    for (let y = 9; y <= 11; y++) exits.push({ x: 0, y, to, spawn, edge: 'left' });
    spawns.west = { x: 1, y: 10, dir: 'right' };
  }
  for (const [x, y] of [[6, 10], [28, 10], [39, 11]]) g.set(x, y === 11 ? 11 : 9, 'P');
  const spots = {
    named: [[12, 10], [14, 10], [19, 10], [21, 10], [26, 10], [29, 10], [34, 5], [34, 15], [8, 10], [38, 10]],
    crowd: [[5, 10], [22, 11], [30, 10], [39, 10], [34, 3], [34, 19], [15, 11], [43, 10]],
    patrol: [[4, 10], [43, 10], [34, 10], [34, 20]],
  };
  let def = {
    id: `c${b}_f${f}`, name: `Корпус ${b}, ${f} эт.`, floor: '.', music: 'corridor', building: b, floorNo: f, ambient: 'crowd',
    ...(f === 1 ? { kids: true } : {}), rows: g.rows(), spawns, exits, objects: [], npcs: [], spots,
  };
  if (b === 2) def = mirror(def);
  add(def);
  toilet(`c${b}_f${f}_wc`, `Туалет, корпус ${b}, ${f} эт.`, def.id, 'wc', b, f);
}

// Зеркало по горизонтали (корпус 2 — слева от рекреации, вход в него с востока).
function mirror(def) {
  const W = def.rows[0].length;
  const mx = (x) => W - 1 - x;
  const flip = { left: 'right', right: 'left' };
  const out = { ...def, rows: def.rows.map((r) => [...r].reverse().join('')) };
  out.spawns = Object.fromEntries(Object.entries(def.spawns).map(([k, s]) => [k === 'west' ? 'east' : k, { ...s, x: mx(s.x), dir: flip[s.dir] || s.dir }]));
  out.exits = def.exits.map((e) => ({ ...e, x: mx(e.x), ...(e.edge ? { edge: flip[e.edge] || e.edge } : {}) }));
  // у двухтайловых лестниц подпись — на первом тайле слева
  out.spots = Object.fromEntries(Object.entries(def.spots).map(([k, v]) => [k, v.map(([x, y]) => [mx(x), y])]));
  return out;
}

// ---------- Туалет (Л-9): входная комната (2 раковины, 2 зеркала, сушилка), вторая — 2 кабинки и писсуар ----------
function toilet(id, name, back, backSpawn, building = 1, floorNo = 1) {
  const g = new Grid(14, 9);
  g.fill(1, 2, 12, 7, 'u');
  g.str(1, 1, 'RDRMMz');
  g.set(4, 2, 's'); g.set(5, 2, 's');
  for (let y = 1; y <= 7; y++) g.set(7, y, y === 5 || y === 6 ? 'u' : '#');
  g.str(8, 1, 'RRRyR');
  g.fill(8, 2, 8, 3, 'k'); g.fill(10, 2, 10, 3, 'k');
  add({
    id, name, floor: 'u', music: 'corridor', toilet: true, building, floorNo, tint: '#80a0ff', rows: g.rows(),
    spawns: { door: { x: 2, y: 2, dir: 'down' } },
    exits: [{ x: 2, y: 1, to: back, spawn: backSpawn, label: 'Выход' }],
    objects: [{ x: 8, y: 3, kind: 'stall' }, { x: 10, y: 3, kind: 'stall' }, { x: 4, y: 2, kind: 'sink' }, { x: 5, y: 2, kind: 'sink' }],
    npcs: [],
    // kid — кабинка, где иногда сидит пятиклассник (Л-10, мини-игра — этап V2-5)
    spots: { named: [[3, 4], [5, 5], [9, 5], [11, 6], [2, 6], [11, 4]], crowd: [[4, 6], [10, 6]], kid: [[9, 3]] },
  });
}

// ---------- Кабинеты ----------
const CLASS_ROWS = [
  '##############################',
  '#WwWWWwWWWwWBBBBBBwWWWwWWWDWW#',
  '#.P..........................#',
  '#.............YY.............#',
  '#.......TT....TT....TT.......#',
  '#............................#',
  '#.......TT....TT....TT.......#',
  '#............................#',
  '#.......TT....TT....TT.......#',
  '#............................#',
  '#.......TT....TT....TT.......#',
  '#............................#',
  '#.......TT....TT....TT.......#',
  '#............................#',
  '##############################',
];
function cabinet(no, kind) {
  const g = new Grid(30, 15);
  CLASS_ROWS.forEach((r, y) => g.str(0, y, r));
  const b = +no[0], f = +no[1];
  if (kind === 'class') {
    // Л-21: три шкафа ДСП по две дверцы, стол классного руководителя в левом нижнем углу
    g.str(23, 13, 'XXXXXX'); g.str(1, 13, '&&');
  } else if (no === '241') { g.str(1, 13, 'KK'); g.str(26, 13, 'KK'); }
  else if (no === '331') { g.str(1, 13, 'KK'); g.set(27, 12, 'P'); g.set(2, 12, 'P'); }
  else if (no === '224') { g.str(1, 13, 'UU'); g.str(26, 13, 'UU'); }
  else if (no === '321') { g.str(1, 13, 'KK'); }
  else g.str(1, 13, 'KK');
  const title = CLASSES[no] ? `Каб. ${no} · ${CLASSES[no]}` : `Каб. ${no} · ${SUBJECT_ROOMS[no]}`;
  add({
    id: 'cab_' + no, name: title, floor: '.', music: 'lesson', building: b, floorNo: f,
    ...(kind === 'class' ? { room: no, classRoom: true } : {}),
    rows: g.rows(),
    spawns: { door: { x: 26, y: 2, dir: 'down' }, teacher: { x: 15, y: 2, dir: 'down' } },
    exits: [{ x: 26, y: 1, to: `c${b}_f${f}`, spawn: 'door' + no, label: 'Выход' }],
    objects: [], npcs: [],
    spots: kind === 'class' ? { named: [[5, 5], [11, 5], [17, 7], [23, 7], [5, 9], [11, 11], [25, 11], [17, 5]], crowd: [[4, 7], [24, 9]] } : {},
  });
}

// ---------- Корпус 1 (бывшая рекреация) ----------
function c1f1() {
  // план — бывшая рекреация версии 1 (rec_f1) с правками: директор переехал в корпус 3 (Л-15),
  // дверь в задний коридор (Р-10), турникеты Face-ID сразу за входом (ИС-6)
  const g = new Grid(40, 28);
  REC_F1_ROWS.forEach((r, y) => g.str(0, y, r));
  g.set(11, 1, 'W'); g.set(33, 1, 'D'); g.str(32, 2, 'qq');
  g.str(13, 23, 'C||C||C||C||CC');
  const rows = g.rows();
  const exits = [];
  for (let x = 16; x <= 23; x++) exits.push({ x, y: 26, to: 'street', spawn: 'door', edge: 'down' });
  for (let y = 15; y <= 17; y++) {
    exits.push({ x: 39, y, to: 'c3_f1', spawn: 'west', edge: 'right' });
    exits.push({ x: 0, y, to: 'c2_f1', spawn: 'east', edge: 'left' });
  }
  exits.push(
    { x: 2, y: 5, to: 'canteen', spawn: 'rec', label: 'Столовая' },
    { x: 18, y: 1, to: 'gym', spawn: 'rec', label: 'Спортзал' }, { x: 19, y: 1, to: 'gym', spawn: 'rec' },
    { x: 24, y: 1, to: 'c1_wc', spawn: 'door', label: 'WC' },
    { x: 29, y: 1, to: 'c1_f2', spawn: 'stairs', label: '2 эт.' }, { x: 30, y: 1, to: 'c1_f2', spawn: 'stairs' },
    { x: 33, y: 1, to: 'c1_back', spawn: 'rec', label: 'Задний коридор' },
    { x: 37, y: 5, to: 'pool', spawn: 'stairs', label: 'Бассейн' },
  );
  add({
    id: 'c1_f1', name: 'Корпус 1 (рекреация), 1 эт.', floor: 'q', music: 'corridor', ambient: 'crowd', building: 1, floorNo: 1, rows,
    spawns: {
      entrance: { x: 19, y: 25, dir: 'up' }, c3: { x: 38, y: 16, dir: 'left' }, c2: { x: 1, y: 16, dir: 'right' },
      stairs: { x: 29, y: 2, dir: 'down' }, canteen: { x: 2, y: 6, dir: 'down' }, gym: { x: 18, y: 2, dir: 'down' },
      toilet: { x: 24, y: 2, dir: 'down' }, wc: { x: 24, y: 2, dir: 'down' }, pool: { x: 37, y: 6, dir: 'down' }, back: { x: 33, y: 2, dir: 'down' },
    },
    exits, objects: [], npcs: [],
    spots: {
      named: [[17, 11], [19, 11], [21, 11], [23, 11], [15, 14], [17, 14], [25, 14], [27, 14], [13, 9], [26, 9]],
      crowd: [[8, 10], [20, 8], [31, 11], [14, 16], [26, 16], [19, 21], [6, 15], [33, 15]],
      patrol: [[6, 12], [34, 12], [34, 17], [6, 17]],
    },
  });
  toilet('c1_wc', 'Туалет, корпус 1', 'c1_f1', 'wc');
}

function c1f2() {
  const g = new Grid(40, 18);
  g.fill(1, 2, 38, 15, 'q');
  for (let x = 1; x <= 38; x++) { g.set(x, 1, x % 6 === 3 ? 'w' : 'W'); g.set(x, 16, x % 5 === 2 ? 'w' : 'W'); }
  g.str(8, 1, 'DD'); g.str(19, 1, 'DD'); g.str(29, 1, 'SS'); g.set(14, 1, 'N');
  g.fill(0, 8, 0, 10, 'q'); g.fill(39, 8, 39, 10, 'q');
  g.str(12, 13, 'bbb'); g.str(24, 13, 'bbb'); g.set(2, 2, 'P'); g.set(37, 2, 'P'); g.set(10, 6, 'C'); g.set(29, 6, 'C');
  const exits = [
    { x: 8, y: 1, to: 'library', spawn: 'door', label: 'Библиотека' }, { x: 9, y: 1, to: 'library', spawn: 'door' },
    { x: 19, y: 1, to: 'c1_hall', spawn: 'door', label: 'Актовый зал' }, { x: 20, y: 1, to: 'c1_hall', spawn: 'door' },
    { x: 29, y: 1, to: 'c1_f1', spawn: 'stairs', label: '1 эт.' }, { x: 30, y: 1, to: 'c1_f1', spawn: 'stairs' },
  ];
  for (let y = 8; y <= 10; y++) {
    exits.push({ x: 0, y, to: 'c2_f2', spawn: 'east', edge: 'left' });
    exits.push({ x: 39, y, to: 'c3_f2', spawn: 'west', edge: 'right' });
  }
  add({
    id: 'c1_f2', name: 'Корпус 1, 2 эт.', floor: 'q', music: 'corridor', ambient: 'crowd', building: 1, floorNo: 2, rows: g.rows(),
    spawns: { stairs: { x: 29, y: 2, dir: 'down' }, library: { x: 8, y: 2, dir: 'down' }, hall: { x: 19, y: 2, dir: 'down' },
      c2: { x: 1, y: 9, dir: 'right' }, c3: { x: 38, y: 9, dir: 'left' } },
    exits, objects: [], npcs: [],
    spots: {
      named: [[12, 9], [14, 9], [22, 9], [24, 9], [17, 5], [27, 11], [6, 11], [33, 6]],
      crowd: [[5, 4], [16, 11], [30, 9], [34, 13], [20, 7], [8, 13]],
      patrol: [[4, 9], [35, 9], [20, 12]],
    },
  });
}

// Актовый зал (Л-20): ~150 оранжевых стульев, тёмный пол, сцена с кафедрой и плазмой, кондиционеры.
function hall() {
  const W = 26, H = 28, g = new Grid(W, H);
  g.fill(1, 2, W - 2, H - 2, 'd');
  for (let x = 1; x <= W - 2; x++) g.set(x, 1, 'W');
  g.str(11, 1, 'VVVV'); g.set(3, 1, 'i'); g.set(22, 1, 'i');
  g.fill(1, 2, W - 2, 4, 'm'); g.fill(1, 5, W - 2, 5, 'n'); g.set(19, 3, 'l');
  let chairs = 0;
  for (let y = 7; y <= 25; y += 2) for (let x = 2; x <= W - 3; x++) if (x < 9 || x > 15) { g.set(x, y, 'o'); chairs++; }
  g.str(12, H - 1, 'DD');
  add({
    id: 'c1_hall', name: 'Актовый зал', floor: 'd', music: 'corridor', ambient: 'crowd', rows: g.rows(),
    spawns: { door: { x: 12, y: H - 2, dir: 'up' } },
    exits: [{ x: 12, y: H - 1, to: 'c1_f2', spawn: 'hall', label: 'Выход' }, { x: 13, y: H - 1, to: 'c1_f2', spawn: 'hall' }],
    // выступление на сцене: реплики — data/dialogs/hall.txt (метки perf_N, выбор по коду и перемене)
    objects: Array.from({ length: W - 2 }, (_, i) => ({ x: i + 1, y: 5, kind: 'stage', file: 'hall', pick: 'perf_' })),
    performer: { x: 12, y: 3 },
    npcs: [],
    spots: { named: [[11, 6], [13, 6], [12, 10], [12, 16], [5, 6], [20, 6]], crowd: [[12, 8], [12, 14], [12, 20], [4, 26], [20, 26]] },
    seats: chairs,
  });
}

// Задний коридор (Л-7, Р-10): за дверью между спортзалом и бассейном. Справа — два кабинета трудов
// и зал гимнастики, в конце — выход на задний двор.
function back() {
  const g = new Grid(12, 22);
  g.fill(3, 2, 5, 20, '.');
  for (let y = 2; y <= 20; y++) { g.set(2, y, y % 4 === 0 ? 'w' : 'W'); g.set(6, y, 'W'); }
  g.str(3, 1, 'WDW'); g.str(3, 21, 'WDW');
  g.set(6, 5, 'D'); g.set(6, 10, 'D'); g.set(6, 15, 'D');
  add({
    id: 'c1_back', name: 'Задний коридор', floor: '.', music: 'corridor', rows: g.rows(),
    spawns: { rec: { x: 4, y: 20, dir: 'up' }, yard: { x: 4, y: 2, dir: 'down' }, trudy1: { x: 5, y: 5, dir: 'right' },
      trudy2: { x: 5, y: 10, dir: 'right' }, gymroom: { x: 5, y: 15, dir: 'right' } },
    exits: [
      { x: 4, y: 21, to: 'c1_f1', spawn: 'back', label: 'Рекреация' }, { x: 4, y: 1, to: 'c1_yard', spawn: 'door', label: 'Двор' },
      { x: 6, y: 5, to: 'c1_trudy1', spawn: 'door', label: 'Труды' }, { x: 6, y: 10, to: 'c1_trudy2', spawn: 'door', label: 'Труды' },
      { x: 6, y: 15, to: 'c1_gymroom', spawn: 'door', label: 'Гимнастика' },
    ],
    objects: [], npcs: [], spots: { crowd: [[4, 8], [4, 17]] },
  });
  const room = (id, name, floor, fillFn, spawnBack) => {
    const r = new Grid(14, 10);
    r.fill(1, 2, 12, 8, floor);
    for (let x = 1; x <= 12; x++) r.set(x, 1, x % 4 === 2 ? 'w' : 'W');
    r.set(0, 5, 'D');
    fillFn(r);
    add({ id, name, floor, music: 'corridor', rows: r.rows(), spawns: { door: { x: 1, y: 5, dir: 'right' } },
      exits: [{ x: 0, y: 5, to: 'c1_back', spawn: spawnBack, label: 'Выход' }], objects: [], npcs: [], spots: {} });
  };
  const machines = (r) => { for (const y of [3, 6]) for (let x = 3; x <= 11; x += 2) r.set(x, y, 'I'); r.str(11, 8, 'KK'); };
  room('c1_trudy1', 'Кабинет трудов', '.', machines, 'trudy1');
  room('c1_trudy2', 'Кабинет трудов', '.', (r) => { machines(r); r.set(2, 8, '$'); }, 'trudy2');
  room('c1_gymroom', 'Зал гимнастики', 'j', (r) => { r.fill(11, 2, 12, 3, 'G'); for (let x = 3; x <= 9; x++) r.set(x, 1, 'A'); }, 'gymroom');
  // задний двор с красным забором-решёткой
  const y = new Grid(24, 14, 'g');
  for (let x = 0; x < 24; x++) { y.set(x, 0, '%'); y.set(x, 12, 'F'); y.set(x, 13, 'F'); }
  for (let yy = 0; yy < 12; yy++) { y.set(0, yy, '%'); y.set(23, yy, '%'); }
  y.fill(8, 5, 15, 10, 'a'); y.set(11, 12, 'E'); y.set(3, 3, 't'); y.set(19, 3, 't'); y.set(5, 9, 't'); y.str(16, 10, 'bb');
  add({ id: 'c1_yard', name: 'Задний двор', floor: 'g', music: 'corridor', rows: y.rows(), spawns: { door: { x: 11, y: 11, dir: 'up' } },
    exits: [{ x: 11, y: 12, to: 'c1_back', spawn: 'yard', label: 'Вход' }], objects: [], npcs: [], spots: { crowd: [[8, 6], [15, 8]] } });
}

// Улица (ИС-6): без проезжей части, широкая лестница ко входу.
function street() {
  const g = new Grid(30, 15, 'p');
  g.fill(0, 0, 29, 0, '#'); g.fill(0, 1, 29, 3, 'F'); g.str(14, 3, 'EE');
  g.fill(9, 4, 20, 6, '^');
  for (let yy = 4; yy <= 14; yy++) { g.set(0, yy, 'f'); g.set(29, yy, 'f'); g.fill(1, yy, 4, yy, 'g'); g.fill(25, yy, 28, yy, 'g'); }
  for (const [x, yy] of [[2, 5], [27, 5], [2, 9], [27, 9], [2, 13], [27, 13]]) g.set(x, yy, 't');
  g.str(7, 9, 'b'); g.str(22, 9, 'b'); g.fill(1, 14, 28, 14, 'c');
  add({ id: 'street', name: 'Улица у входа', floor: 'p', music: 'corridor', rows: g.rows(),
    spawns: { bus: { x: 15, y: 13, dir: 'up' }, door: { x: 14, y: 7, dir: 'down' } },
    exits: [{ x: 14, y: 3, to: 'c1_f1', spawn: 'entrance', label: 'Вход' }, { x: 15, y: 3, to: 'c1_f1', spawn: 'entrance' }],
    objects: [], npcs: [] });
}

// Столовая (Л-11): два ряда длинных столов (до 15 мест), у каждого класса два своих; вход в буфет.
function canteen() {
  const g = new Grid(40, 20, 'x');
  g.fill(0, 0, 39, 0, '#'); g.fill(0, 19, 39, 19, '#');
  for (let yy = 0; yy < 20; yy++) { g.set(0, yy, '#'); g.set(39, yy, '#'); }
  for (let x = 1; x <= 38; x++) g.set(x, 1, x % 5 === 3 ? 'w' : 'W');
  g.set(37, 1, 'D'); g.set(3, 1, 'D'); g.set(1, 2, 'P');
  const signs = [];
  const cls = [['11 «И»', '11 «И»', '11 «М»', '11 «М»'], ['11 «Я»', '11 «Я»', '11 «У»', '11 «У»']];
  [7, 14].forEach((ty, row) => [2, 11, 20, 29].forEach((tx, i) => {
    g.fill(tx, ty, tx + 6, ty, 'U');
    signs.push({ x: tx + 3, y: ty, text: cls[row][i] });
  }));
  const named = [];
  for (const ty of [6, 8, 13, 15]) for (const tx of [3, 5, 12, 14, 21, 23, 30, 32]) named.push([tx, ty]);
  add({
    id: 'canteen', name: 'Столовая', floor: 'x', music: 'canteen', tint: '#ffe0b0', ambient: 'crowd', rows: g.rows(),
    spawns: { rec: { x: 37, y: 2, dir: 'down' }, buffet: { x: 3, y: 2, dir: 'down' } },
    exits: [{ x: 37, y: 1, to: 'c1_f1', spawn: 'canteen', label: 'Рекреация' }, { x: 3, y: 1, to: 'buffet', spawn: 'canteen', label: 'Буфет' }],
    objects: [], npcs: [], signs,
    spots: { named: [[5, 6], [7, 6], [5, 8], [7, 8], [9, 6], [3, 8], [14, 6], [16, 8], [23, 6], [25, 8], [32, 13], [30, 15], [12, 13], [14, 15], ...named],
      crowd: [[26, 4], [18, 10], [8, 17], [34, 10], [20, 17], [10, 4]], patrol: [[18, 4], [18, 17], [36, 10]] },
  });
  // буфет (Л-11): маленькое зелёное помещение, вход из столовой
  const b = new Grid(14, 9, '+');
  b.fill(0, 0, 13, 0, '#'); for (let yy = 0; yy < 9; yy++) { b.set(0, yy, '#'); b.set(13, yy, '#'); }
  for (let x = 1; x <= 12; x++) { b.set(x, 1, x === 4 ? 'K' : 'W'); b.set(x, 8, x === 7 ? 'D' : '#'); }
  b.str(3, 3, 'OOOOOOOO'); b.set(1, 2, 'K'); b.set(12, 2, 'K');
  add({
    id: 'buffet', name: 'Буфет', floor: '+', music: 'canteen', rows: b.rows(),
    spawns: { canteen: { x: 7, y: 7, dir: 'up' } },
    exits: [{ x: 7, y: 8, to: 'canteen', spawn: 'buffet', label: 'Столовая' }],
    objects: Array.from({ length: 8 }, (_, i) => ({ x: 3 + i, y: 3, kind: 'buffet' })),
    npcs: [{ id: 'cook', x: 7, y: 2, dir: 'down', talk: { file: 'staff', label: 'cook' } }],
    spots: { crowd: [[4, 5], [10, 6]] },
  });
}

// Раздевалка (Л-25): за сеткой ворот спортзала.
function lockerRoom() {
  const g = new Grid(16, 9, '.');
  g.fill(0, 0, 15, 0, '#'); g.fill(0, 8, 15, 8, '#');
  for (let yy = 0; yy < 9; yy++) { g.set(0, yy, '#'); g.set(15, yy, yy === 4 ? '.' : '#'); }
  for (let x = 1; x <= 14; x++) g.set(x, 1, x === 1 ? 'L' : '-');
  g.str(3, 2, 'bbbbbbbbbb'); g.str(3, 7, 'bbbbbbbbbb');
  g.str(7, 4, 'TT'); g.set(13, 7, '$'); g.set(1, 6, '~');
  add({
    id: 'locker_room', name: 'Раздевалка', floor: '.', music: 'gym', tint: '#d0d8ff', room: 'спортзал', rows: g.rows(),
    spawns: { gym: { x: 14, y: 4, dir: 'left' } },
    exits: [{ x: 15, y: 4, to: 'gym', spawn: 'locker', edge: 'right' }],
    objects: [], npcs: [],
    spots: { named: [[3, 3], [5, 3], [9, 3], [11, 3], [3, 6], [5, 6], [9, 6], [11, 6], [13, 3], [13, 6], [7, 6], [7, 3]], crowd: [[12, 5]] },
  });
}

// ---------- Сборка ----------
for (const b of [2, 3]) for (let f = 1; f <= 4; f++) buildingFloor(b, f);
for (const no of Object.keys(CLASSES)) cabinet(no, 'class');
for (const no of Object.keys(SUBJECT_ROOMS)) cabinet(no, 'subject');
c1f1(); c1f2(); hall(); back(); street(); canteen(); lockerRoom();

const constName = (id) => id.toUpperCase();
const header = (d) => `// ${d.name} — карта версии 2 (этап V2-3), сгенерирована tools/gen_maps_v2.mjs.\n// Легенда тайлов — src/gen/tiles.js (TILE_DEFS). Координаты — в тайлах.\n`;
for (const d of Object.values(maps)) {
  if (d.rows.some((r) => r.length !== d.rows[0].length)) throw new Error('Разная длина строк: ' + d.id);
  const body = JSON.stringify(d, null, 2).replace(/"rows": \[([^\]]*)\]/s, (m) => m.replace(/\n\s+"/g, '\n    "'));
  fs.writeFileSync(path.join(dir, d.id + '.js'), header(d) + `export const ${constName(d.id)} = ${body};\n`);
}
for (const id of OLD) { const p = path.join(dir, id + '.js'); if (fs.existsSync(p)) fs.unlinkSync(p); }
// реестр
const keep = ['test_room', 'bus_stop', 'gym', 'library', 'pool', 'showers'];
const all = [...keep, ...Object.keys(maps)].sort();
const index = `// Реестр карт (версия 2, этап V2-3; генератор — tools/gen_maps_v2.mjs). Новые карты добавляются сюда.
${all.map((id) => `import { ${constName(id)} } from './${id}.js';`).join('\n')}

export const MAPS = Object.fromEntries(
  [${all.map(constName).join(', ')}].map((m) => [m.id, m]),
);

export function getMapDef(id) {
  const m = MAPS[id];
  if (!m) throw new Error('Нет карты ' + id);
  return m;
}

// Лестницы корпусов (Л-1): корпус 1 — бывшая рекреация, 2 — левый («М», «Я»), 3 — правый («И», «У»). Этаж → id карты.
export const STAIRWELLS = {
  1: { 1: 'c1_f1', 2: 'c1_f2' },
  2: { 1: 'c2_f1', 2: 'c2_f2', 3: 'c2_f3', 4: 'c2_f4' },
  3: { 1: 'c3_f1', 2: 'c3_f2', 3: 'c3_f3', 4: 'c3_f4' },
};

// Кабинет → карта класса (для урока).
export const ROOM_MAPS = { ${Object.keys(maps).filter((id) => id.startsWith('cab_')).map((id) => `'${id.slice(4)}': '${id}'`).join(', ')} };
`;
fs.writeFileSync(path.join(dir, 'index.js'), index);
console.log('карт сгенерировано:', Object.keys(maps).length, 'всего в реестре:', all.length);
