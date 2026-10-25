// Зал гимнастики — карта версии 2 (этап V2-3), сгенерирована tools/gen_maps_v2.mjs.
// Легенда тайлов — src/gen/tiles.js (TILE_DEFS). Координаты — в тайлах.
export const C1_GYMROOM = {
  "id": "c1_gymroom",
  "name": "Зал гимнастики",
  "floor": "j",
  "music": "corridor",
  "rows": [
    "##############",
    "#WwAAAAAAAwWW#",
    "#jjjjjjjjjjGG#",
    "#jjjjjjjjjjGG#",
    "#jjjjjjjjjjjj#",
    "Djjjjjjjjjjjj#",
    "#jjjjjjjjjjjj#",
    "#jjjjjjjjjjjj#",
    "#jjjjjjjjjjjj#",
    "##############"
  ],
  "spawns": {
    "door": {
      "x": 1,
      "y": 5,
      "dir": "right"
    }
  },
  "exits": [
    {
      "x": 0,
      "y": 5,
      "to": "c1_back",
      "spawn": "gymroom",
      "label": "Выход"
    }
  ],
  "objects": [],
  "npcs": [],
  "spots": {}
};
