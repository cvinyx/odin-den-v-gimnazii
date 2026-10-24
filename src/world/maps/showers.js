// Душевые бассейна (мини-игра «Душ» после физкультуры).
// Легенда тайлов — src/gen/tiles.js (TILE_DEFS). Координаты — в тайлах.
export const SHOWERS = {
  id: 'showers',
  name: 'Душевые',
  floor: 'x',
  music: 'corridor',
  tint: '#a0d8ff',
  rows: [
    '################',
    '#WDWWHWHWHWHWHW#',
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
    { x: 2, y: 1, to: "pool", spawn: "showers", label: "Выход" },
  ],
  objects: [
  ],
  npcs: [
  ],
};
