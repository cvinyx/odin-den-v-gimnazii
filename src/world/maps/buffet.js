// Буфет — карта версии 2 (этап V2-3), сгенерирована tools/gen_maps_v2.mjs.
// Легенда тайлов — src/gen/tiles.js (TILE_DEFS). Координаты — в тайлах.
export const BUFFET = {
  "id": "buffet",
  "name": "Буфет",
  "floor": "+",
  "music": "canteen",
  "rows": [
    "##############",
    "#WWWKWWWWWWWW#",
    "#K++++++++++K#",
    "#++OOOOOOOO++#",
    "#++++++++++++#",
    "#++++++++++++#",
    "#++++++++++++#",
    "#++++++++++++#",
    "#######D######"
  ],
  "spawns": {
    "canteen": {
      "x": 7,
      "y": 7,
      "dir": "up"
    }
  },
  "exits": [
    {
      "x": 7,
      "y": 8,
      "to": "canteen",
      "spawn": "buffet",
      "label": "Столовая"
    }
  ],
  "objects": [
    {
      "x": 3,
      "y": 3,
      "kind": "buffet"
    },
    {
      "x": 4,
      "y": 3,
      "kind": "buffet"
    },
    {
      "x": 5,
      "y": 3,
      "kind": "buffet"
    },
    {
      "x": 6,
      "y": 3,
      "kind": "buffet"
    },
    {
      "x": 7,
      "y": 3,
      "kind": "buffet"
    },
    {
      "x": 8,
      "y": 3,
      "kind": "buffet"
    },
    {
      "x": 9,
      "y": 3,
      "kind": "buffet"
    },
    {
      "x": 10,
      "y": 3,
      "kind": "buffet"
    }
  ],
  "npcs": [
    {
      "id": "cook",
      "x": 7,
      "y": 2,
      "dir": "down",
      "talk": {
        "file": "staff",
        "label": "cook"
      }
    }
  ],
  "spots": {
    "crowd": [
      [
        4,
        5
      ],
      [
        10,
        6
      ]
    ]
  }
};
