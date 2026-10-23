// Спортзал (1 эт.): небольшой зал для мини-футбола, шведские стенки, дверь в раздевалку.
// Легенда тайлов — src/gen/tiles.js (TILE_DEFS). Координаты — в тайлах.
export const GYM = {
  id: 'gym',
  name: 'Спортзал',
  floor: 'j',
  music: 'gym',
  room: 'спортзал',
  rows: [
    '##############################',
    '#AADAAAAAAAAAAAAAAAAAAAAAAAAA#',
    '#jjjjjjjjjjjjjJjjjjjjjjjjjjjj#',
    '#jjjjjjjjjjjjjJjjjjjjjjjjjjjj#',
    '#jjjjjjjjjjjjjJjjjjjjjjjjjjjj#',
    '#jjjjjjjjjjjjjJjjjjjjjjjjjjjj#',
    '#jjjjjjjjjjjjjJjjjjjjjjjjjjjj#',
    '#jjjjjjjjjjjjjJjjjjjjjjjjjjjj#',
    '#ZjjjjjjjjjjjjJjjjjjjjjjjjjjZ#',
    '#ZjjjjjjjjjjjjJjjjjjjjjjjjjjZ#',
    '#ZjjjjjjjjjjjjJjjjjjjjjjjjjjZ#',
    '#jjjjjjjjjjjjjJjjjjjjjjjjjjjj#',
    '#jjjjjjjjjjjjjJjjjjjjjjjjjjjj#',
    '#jjjjjjjjjjjjjJjjjjjjjjjjjjjj#',
    '#jjjjjjjjjjjjjJjjjjjjjjjjjjjj#',
    '#jjjjjjjjjjjjjJjjjjjjjjjjjjjj#',
    '#jjjjjjjjjjjjjJjjjjjjjjjjjjjj#',
    '###################D##########',
  ],
  spawns: {
    rec: {x:19,y:16,dir:"up"},
    locker: {x:3,y:2,dir:"down"},
  },
  exits: [
    { x: 19, y: 17, to: "rec_f1", spawn: "gym", label: "Выход" },
    { x: 3, y: 1, to: "locker_room", spawn: "gym", label: "Раздевалка" },
  ],
  objects: [
  ],
  npcs: [
  ],
  spots: {
    crowd: [[8, 6], [22, 12]],
  },
};
