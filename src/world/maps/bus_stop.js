// Остановка автобуса №26 (вступление, раздел 13).
// Легенда тайлов — src/gen/tiles.js (TILE_DEFS). Координаты — в тайлах.
export const BUS_STOP = {
  id: 'bus_stop',
  name: 'Остановка «№26»',
  floor: 'g',
  music: 'intro',
  rows: [
    'tttttttttttttttttttttttttt',
    'tggtggtggtggtggtggtggtggtg',
    'gggggggggggggggggggggggggg',
    'ggfffggggggggggggggggggggg',
    'ggggggggghhhhhgggggggggggg',
    'pppppppppppppppppppppppppp',
    'pppppppppppppppppppppppppp',
    'pppppppppppppppppppppppppp',
    'cccccccccccccccccccccccccc',
    'rrrrrrrrrrrrrrrrrrrrrrrrrr',
    'rrrrrrrrrrrrrrrrrrrrrrrrrr',
    'rrrrrrrrrrrrrrrrrrrrrrrrrr',
  ],
  spawns: {
    start: {x:1,y:6,dir:"right"},
    levonchuk: {x:14,y:6,dir:"left"},
  },
  exits: [
  ],
  npcs: [
    { id: 'levonchuk', x: 14, y: 6, dir: 'left', talk: { file: 'intro', label: 'levonchuk' } },
  ],
};
