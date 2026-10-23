// Рендерер: внутреннее разрешение 480×270, целочисленный масштаб под окно, чёрные поля, камера, тряска.
import { drawText, drawGlyph, measure, wrapText } from './font.js';

export const W = 480;
export const H = 270;
export const GAME_H = 234; // игровая область над HUD
export const HUD_H = 36;

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.ctx.imageSmoothingEnabled = false;
    this.scale = 1;
    this.cam = { x: 0, y: 0 };
    this.shakeTime = 0;
    this.shakePower = 0;
    this.shakeX = 0;
    this.shakeY = 0;
    this.time = 0; // для мигания и анимаций в draw
    this.resize();
    window.addEventListener('resize', () => this.resize());
    document.addEventListener('fullscreenchange', () => this.resize());
  }

  resize() {
    const k = Math.max(1, Math.floor(Math.min(window.innerWidth / W, window.innerHeight / H)));
    this.scale = k;
    this.canvas.style.width = W * k + 'px';
    this.canvas.style.height = H * k + 'px';
  }

  toggleFullscreen() {
    try {
      if (document.fullscreenElement) document.exitFullscreen();
      else document.documentElement.requestFullscreen().catch(() => {});
    } catch (e) { /* полный экран недоступен — не страшно */ }
  }

  shake(power = 3, time = 0.3) {
    this.shakePower = Math.max(this.shakePower, power);
    this.shakeTime = Math.max(this.shakeTime, time);
  }

  // Тряска считается в update по ГПСЧ-независимой формуле (визуальный эффект, не логика).
  update(dt) {
    this.time += dt;
    if (this.shakeTime > 0) {
      this.shakeTime -= dt;
      const p = this.shakePower * Math.min(1, this.shakeTime / 0.15);
      this.shakeX = Math.round(Math.sin(this.time * 91) * p);
      this.shakeY = Math.round(Math.cos(this.time * 77) * p);
      if (this.shakeTime <= 0) { this.shakeX = this.shakeY = 0; this.shakePower = 0; }
    }
  }

  beginFrame() {
    const ctx = this.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
  }

  // Мировые координаты: сдвиг на камеру и тряску.
  withCamera(fn) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(-Math.round(this.cam.x) + this.shakeX, -Math.round(this.cam.y) + this.shakeY);
    fn();
    ctx.restore();
  }

  // Экранные координаты с тряской (для интерфейса игровой области).
  withShake(fn) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(this.shakeX, this.shakeY);
    fn();
    ctx.restore();
  }

  clip(x, y, w, h, fn) {
    const ctx = this.ctx;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    fn();
    ctx.restore();
  }

  rect(x, y, w, h, color) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  frame(x, y, w, h, color, t = 1) {
    this.rect(x, y, w, t, color);
    this.rect(x, y + h - t, w, t, color);
    this.rect(x, y, t, h, color);
    this.rect(x + w - t, y, t, h, color);
  }

  // Окно в стиле Undertale: чёрное с белой рамкой.
  box(x, y, w, h, border = '#fff', fill = '#000', t = 2) {
    this.rect(x, y, w, h, fill);
    this.frame(x, y, w, h, border, t);
  }

  image(img, x, y, w, h) {
    if (w === undefined) this.ctx.drawImage(img, Math.round(x), Math.round(y));
    else this.ctx.drawImage(img, Math.round(x), Math.round(y), w, h);
  }

  // Часть изображения: sx, sy, sw, sh → x, y, с целым масштабом.
  sprite(img, sx, sy, sw, sh, x, y, scale = 1, flip = false) {
    const ctx = this.ctx;
    if (!flip) {
      ctx.drawImage(img, sx, sy, sw, sh, Math.round(x), Math.round(y), sw * scale, sh * scale);
    } else {
      ctx.save();
      ctx.translate(Math.round(x) + sw * scale, Math.round(y));
      ctx.scale(-1, 1);
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw * scale, sh * scale);
      ctx.restore();
    }
  }

  alpha(a, fn) {
    const ctx = this.ctx;
    const prev = ctx.globalAlpha;
    ctx.globalAlpha = prev * a;
    fn();
    ctx.globalAlpha = prev;
  }

  text(str, x, y, opts) { drawText(this.ctx, str, x, y, opts); }
  glyph(ch, x, y, color, scale) { drawGlyph(this.ctx, ch, x, y, color, scale); }
  measure(str, scale) { return measure(str, scale); }
  wrap(str, width, scale) { return wrapText(str, width, scale); }

  // Мигание (true/false) с периодом period секунд.
  blink(period = 0.5) { return Math.floor(this.time / period) % 2 === 0; }
}
