// Бассейн (0 эт., спуск из корпуса 1): дорожки, душевые, лавочки для тех, кто без формы (У-3).
// Легенда тайлов — src/gen/tiles.js (TILE_DEFS). Координаты — в тайлах.
export const POOL = {
  id: 'pool',
  name: 'Бассейн',
  floor: 'x',
  music: 'corridor',
  tint: '#80c0ff',
  room: 'бассейн',
  rows: [
    '##############################',
    '#WSWWwWWWwWWWwWWWwWWWwWWWwWDW#',
    '#xxxxxxxxxxxxxxxxxxxxxxxxxxxx#',
    '#xxxxxxxxxxxxxxxxxxxxxxxxxxxx#',
    '#xxxxxxxxxxxxxxxxxxxxxxxxxxxx#',
    '#xxxeeeeeeeeeeeeeeeeeeeeeexxx#',
    '#xxxevvvvvvvvvvvvvvvvvvvvexxx#',
    '#xxxevvvvvvvvvvvvvvvvvvvvexxx#',
    '#xxxevvvvvvvvvvvvvvvvvvvvexxx#',
    '#xxxevvvvvvvvvvvvvvvvvvvvexxx#',
    '#xxxevvvvvvvvvvvvvvvvvvvvexxx#',
    '#xxxevvvvvvvvvvvvvvvvvvvvexxx#',
    '#xxxeeeeeeeeeeeeeeeeeeeeeexxx#',
    '#xxxxxxxxxxxxxxxxxxxxxxxxxxxx#',
    '#xbbbbbbxxxxxxxxxxxxxxxxbbbbx#',
    '##############################',
  ],
  spawns: {
    stairs: {x:2,y:2,dir:"down"},
    showers: {x:27,y:2,dir:"down"},
  },
  exits: [
    { x: 2, y: 1, to: "c1_f1", spawn: "pool", label: "Наверх" },
    { x: 27, y: 1, to: "showers", spawn: "door", label: "Душ" },
  ],
  objects: [
  ],
  npcs: [
  ],
  spots: {
    crowd: [[10, 3], [20, 13]],
  },
};
