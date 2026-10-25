// Корпус 1 (рекреация), 1 эт. — карта версии 2 (этап V2-3), сгенерирована tools/gen_maps_v2.mjs.
// Легенда тайлов — src/gen/tiles.js (TILE_DEFS). Координаты — в тайлах.
export const C1_F1 = {
  "id": "c1_f1",
  "name": "Корпус 1 (рекреация), 1 эт.",
  "floor": "q",
  "music": "corridor",
  "ambient": "crowd",
  "building": 1,
  "floorNo": 1,
  "rows": [
    "########################################",
    "#####WWWwWWWNWWWwWDDwWWWDWWNwSSWwDW#####",
    "#####qbbbqqqqqbbqqqqqqqqqqbbqqqqqqq#####",
    "#####qqqqqqqqqqqqqqqqqqqqqqqqqqqqqq#####",
    "#####qqqqqqqqqqqqqqqqqqqqqqqqqqqqqq#####",
    "#WDWWqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqWWSW#",
    "#PqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqP#",
    "#qqqqqqqqqCqqqqqqqqqqqqqqqqqqCqqqqqqqqq#",
    "#qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq#",
    "#PqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqP#",
    "#PqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqP#",
    "#qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq#",
    "#qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq#",
    "#qqqqqqqqqCqqqqqqqqqqqqqqqqqqCqqqqqqqqq#",
    "#qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq#",
    "qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq",
    "qqqqqqqqqCqqqqqqqqqqqqqqqqqqqqCqqqqqqqqq",
    "qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq",
    "#qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq#",
    "#PqqqqqqqqqqqqqbbbqqqqbbbqqqqqqqqqqqqqP#",
    "#########qqqqqqqqqqqqqqqqqqqqqq#########",
    "#########qqqqqqqqqqqqqqqqqqqqqq#########",
    "#########PqqqqqqqqqqqqqqqqqqqqP#########",
    "#############C||C||C||C||CC#############",
    "#############qqqqqqqqqqqqqq#############",
    "################qqqqqqqq################",
    "################qqqqqqqq################",
    "########################################"
  ],
  "spawns": {
    "entrance": {
      "x": 19,
      "y": 25,
      "dir": "up"
    },
    "c3": {
      "x": 38,
      "y": 16,
      "dir": "left"
    },
    "c2": {
      "x": 1,
      "y": 16,
      "dir": "right"
    },
    "stairs": {
      "x": 29,
      "y": 2,
      "dir": "down"
    },
    "canteen": {
      "x": 2,
      "y": 6,
      "dir": "down"
    },
    "gym": {
      "x": 18,
      "y": 2,
      "dir": "down"
    },
    "toilet": {
      "x": 24,
      "y": 2,
      "dir": "down"
    },
    "wc": {
      "x": 24,
      "y": 2,
      "dir": "down"
    },
    "pool": {
      "x": 37,
      "y": 6,
      "dir": "down"
    },
    "back": {
      "x": 33,
      "y": 2,
      "dir": "down"
    }
  },
  "exits": [
    {
      "x": 16,
      "y": 26,
      "to": "street",
      "spawn": "door",
      "edge": "down"
    },
    {
      "x": 17,
      "y": 26,
      "to": "street",
      "spawn": "door",
      "edge": "down"
    },
    {
      "x": 18,
      "y": 26,
      "to": "street",
      "spawn": "door",
      "edge": "down"
    },
    {
      "x": 19,
      "y": 26,
      "to": "street",
      "spawn": "door",
      "edge": "down"
    },
    {
      "x": 20,
      "y": 26,
      "to": "street",
      "spawn": "door",
      "edge": "down"
    },
    {
      "x": 21,
      "y": 26,
      "to": "street",
      "spawn": "door",
      "edge": "down"
    },
    {
      "x": 22,
      "y": 26,
      "to": "street",
      "spawn": "door",
      "edge": "down"
    },
    {
      "x": 23,
      "y": 26,
      "to": "street",
      "spawn": "door",
      "edge": "down"
    },
    {
      "x": 39,
      "y": 15,
      "to": "c3_f1",
      "spawn": "west",
      "edge": "right"
    },
    {
      "x": 0,
      "y": 15,
      "to": "c2_f1",
      "spawn": "east",
      "edge": "left"
    },
    {
      "x": 39,
      "y": 16,
      "to": "c3_f1",
      "spawn": "west",
      "edge": "right"
    },
    {
      "x": 0,
      "y": 16,
      "to": "c2_f1",
      "spawn": "east",
      "edge": "left"
    },
    {
      "x": 39,
      "y": 17,
      "to": "c3_f1",
      "spawn": "west",
      "edge": "right"
    },
    {
      "x": 0,
      "y": 17,
      "to": "c2_f1",
      "spawn": "east",
      "edge": "left"
    },
    {
      "x": 2,
      "y": 5,
      "to": "canteen",
      "spawn": "rec",
      "label": "Столовая"
    },
    {
      "x": 18,
      "y": 1,
      "to": "gym",
      "spawn": "rec",
      "label": "Спортзал"
    },
    {
      "x": 19,
      "y": 1,
      "to": "gym",
      "spawn": "rec"
    },
    {
      "x": 24,
      "y": 1,
      "to": "c1_wc",
      "spawn": "door",
      "label": "WC"
    },
    {
      "x": 29,
      "y": 1,
      "to": "c1_f2",
      "spawn": "stairs",
      "label": "2 эт."
    },
    {
      "x": 30,
      "y": 1,
      "to": "c1_f2",
      "spawn": "stairs"
    },
    {
      "x": 33,
      "y": 1,
      "to": "c1_back",
      "spawn": "rec",
      "label": "Задний коридор"
    },
    {
      "x": 37,
      "y": 5,
      "to": "pool",
      "spawn": "stairs",
      "label": "Бассейн"
    }
  ],
  "objects": [],
  "npcs": [],
  "spots": {
    "named": [
      [
        17,
        11
      ],
      [
        19,
        11
      ],
      [
        21,
        11
      ],
      [
        23,
        11
      ],
      [
        15,
        14
      ],
      [
        17,
        14
      ],
      [
        25,
        14
      ],
      [
        27,
        14
      ],
      [
        13,
        9
      ],
      [
        26,
        9
      ]
    ],
    "crowd": [
      [
        8,
        10
      ],
      [
        20,
        8
      ],
      [
        31,
        11
      ],
      [
        14,
        16
      ],
      [
        26,
        16
      ],
      [
        19,
        21
      ],
      [
        6,
        15
      ],
      [
        33,
        15
      ]
    ],
    "patrol": [
      [
        6,
        12
      ],
      [
        34,
        12
      ],
      [
        34,
        17
      ],
      [
        6,
        17
      ]
    ]
  }
};
