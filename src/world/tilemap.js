// Тайловая карта 16×16: строки символов + легенда из src/gen/tiles.js.
import { TILE, getTile, isSolidChar, TILE_DEFS } from '../gen/tiles.js';

export class TileMap {
  constructor(def) {
    this.def = def;
    this.rows = def.rows;
    this.h = def.rows.length;
    this.w = def.rows[0].length;
    for (let i = 0; i < this.h; i++) {
      if (this.rows[i].length !== this.w) throw new Error(`Карта ${def.id}: строка ${i} длиной ${this.rows[i].length}, нужно ${this.w}`);
      for (const ch of this.rows[i]) if (!TILE_DEFS[ch]) throw new Error(`Карта ${def.id}: неизвестный тайл «${ch}» в строке ${i}`);
    }
    this.pixelW = this.w * TILE;
    this.pixelH = this.h * TILE;
  }

  charAt(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= this.w || ty >= this.h) return '#';
    return this.rows[ty][tx];
  }

  solidAt(tx, ty) { return isSolidChar(this.charAt(tx, ty)); }

  // Отрисовка видимой части (r.cam — левый верхний угол камеры в пикселях мира).
  draw(r, viewW, viewH) {
    const x0 = Math.max(0, Math.floor(r.cam.x / TILE));
    const y0 = Math.max(0, Math.floor(r.cam.y / TILE));
    const x1 = Math.min(this.w - 1, Math.floor((r.cam.x + viewW) / TILE));
    const y1 = Math.min(this.h - 1, Math.floor((r.cam.y + viewH) / TILE));
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        const ch = this.rows[ty][tx];
        const variant = ch === 'B' ? tx : tx + ty;
        r.image(getTile(ch, variant), tx * TILE, ty * TILE);
      }
    }
  }
}
