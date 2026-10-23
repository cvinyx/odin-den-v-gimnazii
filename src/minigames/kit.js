// Общие детали мини-игр: «ввод бота» (тот же интерфейс, что у src/engine/input.js), частицы,
// всплывающие цифры, тряска. Частицы и всплывашки — только визуальные (без ГПСЧ дня).

export class FakeInput {
  constructor() { this.p = new Set(); this.h = new Set(); }
  pressed(a) { return this.p.has(a); }
  held(a) { return this.h.has(a); }
  released() { return false; }
  consume(a) { this.p.delete(a); }
  axis() {
    return { x: (this.h.has('right') ? 1 : 0) - (this.h.has('left') ? 1 : 0), y: (this.h.has('down') ? 1 : 0) - (this.h.has('up') ? 1 : 0) };
  }
  press(a) { this.p.add(a); return this; }
  hold(a, on = true) { if (on) this.h.add(a); else this.h.delete(a); return this; }
  next() { this.p.clear(); return this; }
}

// Простой визуальный генератор (не влияет на игру).
let vs = 1234567;
export function vrand() { vs = (vs * 1103515245 + 12345) & 0x7fffffff; return vs / 0x7fffffff; }

export class Particles {
  constructor() { this.list = []; }
  // kind: 'spark' | 'cloud' | 'crumb' | 'drop'
  burst(x, y, n, opts = {}) {
    for (let i = 0; i < n; i++) {
      const a = (opts.angle ?? vrand() * Math.PI * 2) + (vrand() - 0.5) * (opts.spread ?? Math.PI * 2);
      const sp = (opts.speed ?? 40) * (0.4 + vrand() * 0.8);
      this.list.push({
        x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, t: 0, life: (opts.life ?? 0.6) * (0.6 + vrand() * 0.8),
        size: (opts.size ?? 2) * (0.6 + vrand() * 0.8), color: opts.color || '#ffffff', grow: opts.grow || 0, gravity: opts.gravity || 0,
      });
    }
  }
  update(dt) {
    for (const p of this.list) {
      p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.gravity * dt;
      p.vx *= 1 - dt * 1.5; p.vy *= 1 - dt * 1.5; p.size += p.grow * dt;
    }
    this.list = this.list.filter((p) => p.t < p.life);
  }
  draw(r) {
    for (const p of this.list) {
      const a = 1 - p.t / p.life;
      r.alpha(a, () => r.rect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size, p.color));
    }
  }
}

export class Popups {
  constructor() { this.list = []; }
  add(x, y, text, color = '#ffe14d') { this.list.push({ x, y, text, color, t: 0 }); }
  update(dt) { for (const p of this.list) p.t += dt; this.list = this.list.filter((p) => p.t < 1); }
  draw(r) {
    for (const p of this.list) r.alpha(1 - p.t, () => r.text(p.text, p.x, p.y - p.t * 16, { align: 'center', color: p.color, shadow: '#000' }));
  }
}

// Таймер в формате 0:42
export function clock(sec) { const s = Math.max(0, Math.ceil(sec)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; }

// Множитель голода > 70: скорость и точность −20 % (раздел 7).
import { BALANCE } from '../../data/balance.js';
export function hungerMul(state) { return state.stats.hunger > BALANCE.hunger.slowThreshold ? BALANCE.hunger.slowFactor : 1; }
