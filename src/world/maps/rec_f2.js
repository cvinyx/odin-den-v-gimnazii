// Рекреация, 2 этаж: вход в библиотеку, лестница вниз.
// Легенда тайлов — src/gen/tiles.js (TILE_DEFS). Координаты — в тайлах.
export const REC_F2 = {
  id: 'rec_f2',
  name: 'Рекреация 2 эт.',
  floor: 'q',
  music: 'corridor',
  ambient: 'crowd',
  rows: [
    '########################################',
    '#WwWWWwWWWNWWWwWWWwDDWwWWNwWWSSWWWwWWWw#',
    '#PqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqP#',
    '#qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq#',
    '#qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq#',
    '#qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq#',
    '#qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq#',
    '#qqqqqqqqqqqqqCqqqqqqqqqqCqqqqqqqqqqqqq#',
    '#qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq#',
    '#qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq#',
    '#qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq#',
    '#qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq#',
    '#qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq#',
    '#PqqqqqqbbbqqqqqqqqqqqqqqqqqqqbbbqqqqqP#',
    '########################################',
    '########################################',
  ],
  spawns: {
    stairs: {x:29,y:2,dir:"down"},
    library: {x:19,y:2,dir:"down"},
  },
  exits: [
    { x: 29, y: 1, to: "rec_f1", spawn: "stairs", label: "1 эт." },
    { x: 30, y: 1, to: "rec_f1", spawn: "stairs" },
    { x: 19, y: 1, to: "library", spawn: "door", label: "Библиотека" },
    { x: 20, y: 1, to: "library", spawn: "door" },
  ],
  objects: [
  ],
  npcs: [
  ],
  spots: {
    named: [[17, 6], [19, 6], [22, 9], [24, 9]],
    crowd: [[6, 5], [33, 5], [12, 10], [28, 10]],
    patrol: [[5, 8], [34, 8]],
  },
};
