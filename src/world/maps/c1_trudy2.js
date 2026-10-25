// Кабинет трудов — карта версии 2 (этап V2-3), сгенерирована tools/gen_maps_v2.mjs.
// Легенда тайлов — src/gen/tiles.js (TILE_DEFS). Координаты — в тайлах.
export const C1_TRUDY2 = {
  "id": "c1_trudy2",
  "name": "Кабинет трудов",
  "floor": ".",
  "music": "corridor",
  "rows": [
    "##############",
    "#WwWWWwWWWwWW#",
    "#............#",
    "#..I.I.I.I.I.#",
    "#............#",
    "D............#",
    "#..I.I.I.I.I.#",
    "#............#",
    "#.$........KK#",
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
      "spawn": "trudy2",
      "label": "Выход"
    }
  ],
  "objects": [],
  "npcs": [],
  "spots": {}
};
