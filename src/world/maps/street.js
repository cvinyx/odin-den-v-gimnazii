// Улица у входа в гимназию (раздел 12).
// Легенда тайлов — src/gen/tiles.js (TILE_DEFS). Координаты — в тайлах.
export const STREET = {
  id: 'street',
  name: 'Улица у входа',
  floor: 'a',
  music: 'corridor',
  rows: [
    '##############################',
    'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF',
    'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF',
    'FFFFFFFFFFFFFFEEFFFFFFFFFFFFFF',
    'fgggppppppppppppppppppppppgggf',
    'ftggppppppppppppppppppppppggtf',
    'fgggppppppppppppppppppppppgggf',
    'fgggbaaaaaaaaaaaaaaaaaaaabgggf',
    'ftggaaaaaaaaaaaaaaaaaaaaaaggtf',
    'fgggaaaaaaaaaaaaaaaaaaaaaagggf',
    'fgggaaaaaaaaaaaaaaaaaaaaaagggf',
    'ftggaaaaaaaaaaaaaaaaaaaaaaggtf',
    'cccccccccccccccccccccccccccccc',
    'rrrrrrrrrrrrrrrrrrrrrrrrrrrrrr',
    'rrrrrrrrrrrrrrrrrrrrrrrrrrrrrr',
  ],
  spawns: {
    bus: {x:15,y:11,dir:"up"},
    door: {x:14,y:4,dir:"down"},
  },
  exits: [
    { x: 14, y: 3, to: "rec_f1", spawn: "entrance" },
    { x: 15, y: 3, to: "rec_f1", spawn: "entrance" },
  ],
};
