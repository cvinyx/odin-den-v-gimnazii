// Библиотека (рекреация, 2 эт.): стеллажи, розетка для зарядки, библиотекарь.
// Легенда тайлов — src/gen/tiles.js (TILE_DEFS). Координаты — в тайлах.
export const LIBRARY = {
  id: 'library',
  name: 'Библиотека',
  floor: ',',
  music: 'library',
  tint: '#ffcf80',
  rows: [
    '########################',
    '#WWQWWwWWWwWWWwWWWWWDWW#',
    '#,,,,,,,,,,,,,,,,,,,,,P#',
    '#,,,,,,,,,,,,,,,,,,,,,,#',
    '#,,,,,,,,,,YY,,,,,,,,,,#',
    '#,KKKKKKK,,,,,,KKKKKKK,#',
    '#,,,,,,,,,,,,,,,,,,,,,,#',
    '#,,,,,,,,,,,,,,,,,,,,,,#',
    '#,KKKKKKK,,,,,,KKKKKKK,#',
    '#,,,,,,,,,,,,,,,,,,,,,,#',
    '#,,,,,,,,,UUUU,,,,,,,,,#',
    '#,KK,,,,,,,,,,,,,,,,,,,#',
    '#,,,,,,,,,,,,,,,,,,,,,,#',
    '########################',
  ],
  spawns: {
    door: {x:20,y:2,dir:"down"},
    outlet: {x:3,y:2,dir:"up"},
  },
  exits: [
    { x: 20, y: 1, to: "rec_f2", spawn: "library", label: "Выход" },
  ],
  objects: [
    { x: 3, y: 1, kind: "outlet" },
    { x: 2, y: 5, kind: "shelf" },
    { x: 5, y: 5, kind: "shelf" },
    { x: 8, y: 5, kind: "shelf" },
    { x: 15, y: 5, kind: "shelf" },
    { x: 18, y: 5, kind: "shelf" },
    { x: 21, y: 5, kind: "shelf" },
    { x: 2, y: 8, kind: "shelf" },
    { x: 5, y: 8, kind: "shelf" },
    { x: 8, y: 8, kind: "shelf" },
    { x: 15, y: 8, kind: "shelf" },
    { x: 18, y: 8, kind: "shelf" },
    { x: 21, y: 8, kind: "shelf" },
  ],
  npcs: [
    { id: "librarian", x: 12, y: 3, dir: "down", talk: { file: "staff", label: "librarian" } },
  ],
  spots: {
    named: [[11, 7], [13, 7], [11, 11], [14, 11]],
    crowd: [[6, 10], [18, 10]],
  },
};
