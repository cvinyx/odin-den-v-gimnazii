// Улица у входа — карта версии 2 (этап V2-3), сгенерирована tools/gen_maps_v2.mjs.
// Легенда тайлов — src/gen/tiles.js (TILE_DEFS). Координаты — в тайлах.
export const STREET = {
  "id": "street",
  "name": "Улица у входа",
  "floor": "p",
  "music": "corridor",
  "rows": [
    "##############################",
    "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
    "FFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
    "FFFFFFFFFFFFFFEEFFFFFFFFFFFFFF",
    "fggggpppp^^^^^^^^^^^^ppppggggf",
    "fgtggpppp^^^^^^^^^^^^ppppggtgf",
    "fggggpppp^^^^^^^^^^^^ppppggggf",
    "fggggppppppppppppppppppppggggf",
    "fggggppppppppppppppppppppggggf",
    "fgtggppbppppppppppppppbppggtgf",
    "fggggppppppppppppppppppppggggf",
    "fggggppppppppppppppppppppggggf",
    "fggggppppppppppppppppppppggggf",
    "fgtggppppppppppppppppppppggtgf",
    "fccccccccccccccccccccccccccccf"
  ],
  "spawns": {
    "bus": {
      "x": 15,
      "y": 13,
      "dir": "up"
    },
    "door": {
      "x": 14,
      "y": 7,
      "dir": "down"
    }
  },
  "exits": [
    {
      "x": 14,
      "y": 3,
      "to": "c1_f1",
      "spawn": "entrance",
      "label": "Вход"
    },
    {
      "x": 15,
      "y": 3,
      "to": "c1_f1",
      "spawn": "entrance"
    }
  ],
  "objects": [],
  "npcs": []
};
