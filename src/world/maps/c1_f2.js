// Корпус 1, 2 эт. — карта версии 2 (этап V2-3), сгенерирована tools/gen_maps_v2.mjs.
// Легенда тайлов — src/gen/tiles.js (TILE_DEFS). Координаты — в тайлах.
export const C1_F2 = {
  "id": "c1_f2",
  "name": "Корпус 1, 2 эт.",
  "floor": "q",
  "music": "corridor",
  "ambient": "crowd",
  "building": 1,
  "floorNo": 2,
  "rows": [
    "########################################",
    "#WWwWWWWDDWWWWNwWWWDDwWWWWWwWSSWWwWWWWW#",
    "#qPqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqPq#",
    "#qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq#",
    "#qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq#",
    "#qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq#",
    "#qqqqqqqqqCqqqqqqqqqqqqqqqqqqCqqqqqqqqq#",
    "#qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq#",
    "qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq",
    "qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq",
    "qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq",
    "#qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq#",
    "#qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq#",
    "#qqqqqqqqqqqbbbqqqqqqqqqbbbqqqqqqqqqqqq#",
    "#qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq#",
    "#qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq#",
    "#WwWWWWwWWWWwWWWWwWWWWwWWWWwWWWWwWWWWwW#",
    "########################################"
  ],
  "spawns": {
    "stairs": {
      "x": 29,
      "y": 2,
      "dir": "down"
    },
    "library": {
      "x": 8,
      "y": 2,
      "dir": "down"
    },
    "hall": {
      "x": 19,
      "y": 2,
      "dir": "down"
    },
    "c2": {
      "x": 1,
      "y": 9,
      "dir": "right"
    },
    "c3": {
      "x": 38,
      "y": 9,
      "dir": "left"
    }
  },
  "exits": [
    {
      "x": 8,
      "y": 1,
      "to": "library",
      "spawn": "door",
      "label": "Библиотека"
    },
    {
      "x": 9,
      "y": 1,
      "to": "library",
      "spawn": "door"
    },
    {
      "x": 19,
      "y": 1,
      "to": "c1_hall",
      "spawn": "door",
      "label": "Актовый зал"
    },
    {
      "x": 20,
      "y": 1,
      "to": "c1_hall",
      "spawn": "door"
    },
    {
      "x": 29,
      "y": 1,
      "to": "c1_f1",
      "spawn": "stairs",
      "label": "1 эт."
    },
    {
      "x": 30,
      "y": 1,
      "to": "c1_f1",
      "spawn": "stairs"
    },
    {
      "x": 0,
      "y": 8,
      "to": "c2_f2",
      "spawn": "east",
      "edge": "left"
    },
    {
      "x": 39,
      "y": 8,
      "to": "c3_f2",
      "spawn": "west",
      "edge": "right"
    },
    {
      "x": 0,
      "y": 9,
      "to": "c2_f2",
      "spawn": "east",
      "edge": "left"
    },
    {
      "x": 39,
      "y": 9,
      "to": "c3_f2",
      "spawn": "west",
      "edge": "right"
    },
    {
      "x": 0,
      "y": 10,
      "to": "c2_f2",
      "spawn": "east",
      "edge": "left"
    },
    {
      "x": 39,
      "y": 10,
      "to": "c3_f2",
      "spawn": "west",
      "edge": "right"
    }
  ],
  "objects": [],
  "npcs": [],
  "spots": {
    "named": [
      [
        12,
        9
      ],
      [
        14,
        9
      ],
      [
        22,
        9
      ],
      [
        24,
        9
      ],
      [
        17,
        5
      ],
      [
        27,
        11
      ],
      [
        6,
        11
      ],
      [
        33,
        6
      ]
    ],
    "crowd": [
      [
        5,
        4
      ],
      [
        16,
        11
      ],
      [
        30,
        9
      ],
      [
        34,
        13
      ],
      [
        20,
        7
      ],
      [
        8,
        13
      ]
    ],
    "patrol": [
      [
        4,
        9
      ],
      [
        35,
        9
      ],
      [
        20,
        12
      ]
    ]
  }
};
