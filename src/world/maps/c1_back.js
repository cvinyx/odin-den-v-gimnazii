// Задний коридор — карта версии 2 (этап V2-3), сгенерирована tools/gen_maps_v2.mjs.
// Легенда тайлов — src/gen/tiles.js (TILE_DEFS). Координаты — в тайлах.
export const C1_BACK = {
  "id": "c1_back",
  "name": "Задний коридор",
  "floor": ".",
  "music": "corridor",
  "rows": [
    "############",
    "###WDW######",
    "##W...W#####",
    "##W...W#####",
    "##w...W#####",
    "##W...D#####",
    "##W...W#####",
    "##W...W#####",
    "##w...W#####",
    "##W...W#####",
    "##W...D#####",
    "##W...W#####",
    "##w...W#####",
    "##W...W#####",
    "##W...W#####",
    "##W...D#####",
    "##w...W#####",
    "##W...W#####",
    "##W...W#####",
    "##W...W#####",
    "##w...W#####",
    "###WDW######"
  ],
  "spawns": {
    "rec": {
      "x": 4,
      "y": 20,
      "dir": "up"
    },
    "yard": {
      "x": 4,
      "y": 2,
      "dir": "down"
    },
    "trudy1": {
      "x": 5,
      "y": 5,
      "dir": "right"
    },
    "trudy2": {
      "x": 5,
      "y": 10,
      "dir": "right"
    },
    "gymroom": {
      "x": 5,
      "y": 15,
      "dir": "right"
    }
  },
  "exits": [
    {
      "x": 4,
      "y": 21,
      "to": "c1_f1",
      "spawn": "back",
      "label": "Рекреация"
    },
    {
      "x": 4,
      "y": 1,
      "to": "c1_yard",
      "spawn": "door",
      "label": "Двор"
    },
    {
      "x": 6,
      "y": 5,
      "to": "c1_trudy1",
      "spawn": "door",
      "label": "Труды"
    },
    {
      "x": 6,
      "y": 10,
      "to": "c1_trudy2",
      "spawn": "door",
      "label": "Труды"
    },
    {
      "x": 6,
      "y": 15,
      "to": "c1_gymroom",
      "spawn": "door",
      "label": "Гимнастика"
    }
  ],
  "objects": [],
  "npcs": [],
  "spots": {
    "crowd": [
      [
        4,
        8
      ],
      [
        4,
        17
      ]
    ]
  }
};
