// Туалет корп. 1, 4 эт.: раковины, зеркала, кабинки (точка «Затянуться»).
// Легенда тайлов — src/gen/tiles.js (TILE_DEFS). Координаты — в тайлах.
export const K1_F4_TOILET = {
  id: 'k1_f4_toilet',
  name: 'Туалет корп. 1, 4 эт.',
  floor: 'x',
  music: 'corridor',
  building: 1,
  floorNo: 4,
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
    { x: 2, y: 1, to: "k1_f4", spawn: "toilet", label: "Выход" },
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
