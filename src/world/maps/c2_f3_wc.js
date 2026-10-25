// Туалет, корпус 2, 3 эт. — карта версии 2 (этап V2-3), сгенерирована tools/gen_maps_v2.mjs.
// Легенда тайлов — src/gen/tiles.js (TILE_DEFS). Координаты — в тайлах.
export const C2_F3_WC = {
  "id": "c2_f3_wc",
  "name": "Туалет, корпус 2, 3 эт.",
  "floor": "u",
  "music": "corridor",
  "toilet": true,
  "building": 2,
  "floorNo": 3,
  "tint": "#80a0ff",
  "rows": [
    "##############",
    "#RDRMMz#RRRyR#",
    "#uuussu#kukuu#",
    "#uuuuuu#kukuu#",
    "#uuuuuu#uuuuu#",
    "#uuuuuuuuuuuu#",
    "#uuuuuuuuuuuu#",
    "#uuuuuu#uuuuu#",
    "##############"
  ],
  "spawns": {
    "door": {
      "x": 2,
      "y": 2,
      "dir": "down"
    }
  },
  "exits": [
    {
      "x": 2,
      "y": 1,
      "to": "c2_f3",
      "spawn": "wc",
      "label": "Выход"
    }
  ],
  "objects": [
    {
      "x": 8,
      "y": 3,
      "kind": "stall"
    },
    {
      "x": 10,
      "y": 3,
      "kind": "stall"
    },
    {
      "x": 4,
      "y": 2,
      "kind": "sink"
    },
    {
      "x": 5,
      "y": 2,
      "kind": "sink"
    }
  ],
  "npcs": [],
  "spots": {
    "named": [
      [
        3,
        4
      ],
      [
        5,
        5
      ],
      [
        9,
        5
      ],
      [
        11,
        6
      ],
      [
        2,
        6
      ],
      [
        11,
        4
      ]
    ],
    "crowd": [
      [
        4,
        6
      ],
      [
        10,
        6
      ]
    ],
    "kid": [
      [
        9,
        3
      ]
    ]
  }
};
