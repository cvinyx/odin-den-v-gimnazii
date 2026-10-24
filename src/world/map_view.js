// Статичная сцена на карте: персонажи расставлены по тайлам (раздевалка перед матчем, душ и т. п.).
import { TileMap } from './tilemap.js';
import { Actor } from './npc.js';
import { getMapDef } from './maps/index.js';
import { tileToFeet } from './classroom.js';
import { GAME_H } from '../engine/renderer.js';

export class MapView {
  // cast: [{ id, x, y, dir }] в тайлах
  constructor(mapId, cast) {
    this.def = getMapDef(mapId);
    this.map = new TileMap(this.def);
    this.actors = cast.map((c) => { const f = tileToFeet(c); return new Actor(c.id, f.x, f.y, c.dir || 'down'); });
    this.roma = this.actors.find((a) => a.id === 'roma') || null;
  }

  draw(r) {
    r.cam.x = (this.map.pixelW - 480) / 2;
    r.cam.y = (this.map.pixelH - GAME_H) / 2;
    r.clip(0, 0, 480, GAME_H, () => {
      r.withCamera(() => {
        this.map.draw(r, 480, GAME_H);
        for (const a of [...this.actors].sort((a, b) => a.y - b.y)) a.draw(r);
      });
    });
  }
}
