// Задний двор — карта версии 2 (этап V2-3), сгенерирована tools/gen_maps_v2.mjs.
// Легенда тайлов — src/gen/tiles.js (TILE_DEFS). Координаты — в тайлах.
export const C1_YARD = {
  "id": "c1_yard",
  "name": "Задний двор",
  "floor": "g",
  "music": "corridor",
  "rows": [
    "%%%%%%%%%%%%%%%%%%%%%%%%",
    "%gggggggggggggggggggggg%",
    "%gggggggggggggggggggggg%",
    "%ggtgggggggggggggggtggg%",
    "%gggggggggggggggggggggg%",
    "%gggggggaaaaaaaaggggggg%",
    "%gggggggaaaaaaaaggggggg%",
    "%gggggggaaaaaaaaggggggg%",
    "%gggggggaaaaaaaaggggggg%",
    "%ggggtggaaaaaaaaggggggg%",
    "%gggggggaaaaaaaabbggggg%",
    "%gggggggggggggggggggggg%",
    "FFFFFFFFFFFEFFFFFFFFFFFF",
    "FFFFFFFFFFFFFFFFFFFFFFFF"
  ],
  "spawns": {
    "door": {
      "x": 11,
      "y": 11,
      "dir": "up"
    }
  },
  "exits": [
    {
      "x": 11,
      "y": 12,
      "to": "c1_back",
      "spawn": "yard",
      "label": "Вход"
    }
  ],
  "objects": [],
  "npcs": [],
  "spots": {
    "crowd": [
      [
        8,
        6
      ],
      [
        15,
        8
      ]
    ]
  }
};
