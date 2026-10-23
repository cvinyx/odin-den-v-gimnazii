// Туалет рекреации: раковины, зеркала, кабинки (точка «Затянуться»).
// Легенда тайлов — src/gen/tiles.js (TILE_DEFS). Координаты — в тайлах.
export const REC_TOILET = {
  id: 'rec_toilet',
  name: 'Туалет рекреации',
  floor: 'x',
  music: 'corridor',
  rows: [
    '################',
    '#WDWWMWMWMWWWWW#',
    '#xxxxsxsxsxkkkk#',
    '#xxxxxxxxxxxxxx#',
    '#xxxxxxxxxxxxxx#',
    '#xxxxxxxxxxxxxx#',
    '#xxxxxxxxxxxxxx#',
    '#xxxxxxxxxxxxxx#',
    '#xxxxxxxxxxxxxx#',
    '################',
  ],
  spawns: {
    door: {x:2,y:2,dir:"down"},
  },
  exits: [
    { x: 2, y: 1, to: "rec_f1", spawn: "toilet", label: "Выход" },
  ],
  objects: [
    { x: 11, y: 2, kind: "stall" },
    { x: 12, y: 2, kind: "stall" },
    { x: 13, y: 2, kind: "stall" },
    { x: 14, y: 2, kind: "stall" },
    { x: 5, y: 2, kind: "sink" },
    { x: 7, y: 2, kind: "sink" },
    { x: 9, y: 2, kind: "sink" },
  ],
  npcs: [
  ],
  spots: {
    named: [[11, 5], [13, 5], [11, 7], [13, 7], [8, 6], [6, 7], [9, 8]],
    crowd: [[4, 6], [10, 6]],
  },
};
