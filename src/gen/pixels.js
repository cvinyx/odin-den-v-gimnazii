// Пиксельный буфер: рисуем по пикселям без канваса (работает и в node-тестах), потом переносим в offscreen-canvas.
import { hexToRgb } from './color.js';
import { makeCanvas } from '../engine/canvas.js';

export class Pixels {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.data = new Array(w * h).fill(null);
  }
  set(x, y, c) {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h || !c) return;
    this.data[y * this.w + x] = c;
  }
  get(x, y) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return null;
    return this.data[y * this.w + x];
  }
  rect(x, y, w, h, c) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c);
  }
  hline(x0, x1, y, c) { for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) this.set(x, y, c); }
  vline(x, y0, y1, c) { for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) this.set(x, y, c); }
  // Заполненный эллипс по центру (cx, cy) с радиусами rx, ry.
  ellipse(cx, cy, rx, ry, c) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
        if (dx * dx + dy * dy <= 1) this.set(x, y, c);
      }
    }
  }
  // Контур снаружи непустых пикселей (для читаемости спрайта на любом фоне).
  outline(c) {
    const add = [];
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      if (this.get(x, y)) continue;
      if (this.get(x - 1, y) || this.get(x + 1, y) || this.get(x, y - 1) || this.get(x, y + 1)) add.push([x, y]);
    }
    for (const [x, y] of add) this.set(x, y, c);
  }
  // Скопировать в другой буфер со сдвигом и (опционально) зеркально.
  blitTo(dst, dx, dy, flip = false) {
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      const c = this.get(x, y);
      if (c) dst.set(dx + (flip ? this.w - 1 - x : x), dy + y, c);
    }
  }
  toCanvas() {
    const cv = makeCanvas(this.w, this.h);
    const ctx = cv.getContext('2d');
    const img = ctx.createImageData(this.w, this.h);
    const cache = new Map();
    for (let i = 0; i < this.data.length; i++) {
      const c = this.data[i];
      if (!c) continue;
      let rgb = cache.get(c);
      if (!rgb) { rgb = hexToRgb(c); cache.set(c, rgb); }
      img.data[i * 4] = rgb[0];
      img.data[i * 4 + 1] = rgb[1];
      img.data[i * 4 + 2] = rgb[2];
      img.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    return cv;
  }
}
