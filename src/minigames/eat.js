// «Кто больше съест» (раздел 14, п. 6): столовая, большая перемена, вход — купить 3 смаженки (3,60 BYN).
// Ритм-игра: стрелки в такт, каждая серия попаданий = съеденная смаженка. Голод < 30 — желудок
// заполняется вдвое быстрее. Итог: голод → 0.
import { registerMinigame } from './registry.js';
import { FakeInput, Particles, Popups, hungerMul, clock } from './kit.js';
import { BALANCE } from '../../data/balance.js';
import { getPerson, sheetOf } from '../gen/people.js';
import { frameRect } from '../gen/sprites.js';
import { GAME_H } from '../engine/renderer.js';
import { audio } from '../engine/audio.js';

const B = BALANCE.eat;
const DIRS = ['left', 'right']; // ИС-13: две стрелки вместо четырёх
const ARROW = { left: '←', down: '↓', up: '↑', right: '→' };

export class EatLogic {
  // p: { opp, hunger, accuracy }
  constructor(rng, p = {}) {
    this.rng = rng;
    this.p = p;
    this.window = B.window * (p.accuracy || 1);
    this.t = 0;
    this.duration = B.duration;
    this.notes = [];
    // ИС-13: ритм плавно растёт — от beat к beatFast за игру, полудолей почти нет
    for (let at = 2.5; at < this.duration - 1; at += B.beat + (B.beatFast - B.beat) * (at / this.duration)) this.notes.push({ at, dir: rng.pick(DIRS), state: null });
    this.hits = 0; this.misses = 0; this.series = 0;
    this.eaten = 0; this.stomach = 0;
    this.fast = (p.hunger ?? 50) < 30; // голод < 30 — желудок вдвое быстрее
    const skill = B.skill[p.opp] ?? B.skill.default;
    this.oppTotal = Math.max(1, Math.round(rng.float(skill - 1.5, skill + 1.5)));
    this.finished = false; this.result = null; this.events = [];
  }
  get oppEaten() { return Math.min(this.oppTotal, Math.floor(this.oppTotal * this.t / this.duration)); }
  update(dt, input) {
    if (this.finished) return;
    this.t += dt;
    for (const d of DIRS) {
      if (!input.pressed(d)) continue;
      const n = this.notes.find((x) => !x.state && Math.abs(x.at - this.t) <= this.window);
      if (n && n.dir === d) { n.state = 'hit'; this.hit(); }
      else { this.misses++; this.series = Math.max(0, this.series - 2); this.events.push({ type: 'wrong' }); }
    }
    // пропуск ноты сбивает серию: смаженку надо съесть «в одном ритме»
    for (const n of this.notes) if (!n.state && this.t - n.at > this.window) { n.state = 'miss'; this.misses++; this.series = 0; this.events.push({ type: 'miss' }); }
    if (this.t >= this.duration) this.finish();
  }
  hit() {
    this.hits++; this.series++;
    this.events.push({ type: 'hit' });
    if (this.series >= B.notesPerSmazhenka) {
      this.series = 0; this.eaten++; this.stomach += this.fast ? 2 : 1;
      this.events.push({ type: 'eat' });
      if (this.stomach >= B.stomachMax) this.finish();
    }
  }
  finish() {
    this.finished = true;
    this.t = Math.max(this.t, this.duration);
    this.result = this.eaten > this.oppTotal ? 'win' : this.eaten < this.oppTotal ? 'lose' : 'draw';
  }
}

export function eatBot(L, rng) {
  const plan = new Map();
  return () => {
    const inp = new FakeInput();
    for (const n of L.notes) {
      if (n.state || n.at - L.t > 0.3) continue;
      if (!plan.has(n)) plan.set(n, rng.chance(0.82) ? n.at + rng.float(-0.09, 0.09) : null); // 82 % попаданий
      const when = plan.get(n);
      if (when !== null && L.t >= when && !n.pressed) { n.pressed = true; inp.press(n.dir); }
    }
    return inp;
  };
}

class EatGame {
  constructor(ctx) { this.ctx = ctx; this.game = ctx.game; this.rng = ctx.rng; this.done = false; this.time = 0; this.particles = new Particles(); this.popups = new Popups(); }
  start(params) {
    const st = this.ctx.state;
    this.opp = this.ctx.opp || params.opp || 'denis';
    this.L = new EatLogic(this.rng, { opp: this.opp, hunger: st.stats.hunger, accuracy: hungerMul(st) });
    this.botFn = eatBot(this.L, this.rng);
  }
  update(dt, input) {
    this.time += dt;
    this.particles.update(dt); this.popups.update(dt);
    this.L.update(dt, this.autoplay ? this.botFn(dt) : input);
    for (const e of this.L.events) {
      if (e.type === 'hit') audio.play('menuMove');
      if (e.type === 'wrong' || e.type === 'miss') audio.play('menuDenied');
      if (e.type === 'eat') { audio.play('coin'); this.particles.burst(150, 120, 14, { color: '#d79a4a', speed: 60, gravity: 80 }); this.popups.add(150, 90, 'Ам! +1 смаженка', '#6be36b'); this.game.r.shake(2, 0.2); }
    }
    this.L.events = [];
    if (this.L.finished) this.done = true;
  }
  forfeit() { this.L.finish(); this.L.result = 'lose'; return this.end(); }
  end() {
    const L = this.L;
    const st = this.ctx.state;
    const d = { hunger: -st.stats.hunger, money: -B.entry };
    if (L.result === 'win') d.aura = 7;
    if (L.result === 'lose') d.aura = -4;
    return { result: L.result, deltas: d, money: 0, summary: `Съедено: Рома ${L.eaten} — ${getPerson(this.opp).short} ${L.oppTotal}` };
  }
  draw(r) {
    const L = this.L;
    r.rect(0, 0, 480, GAME_H, '#f0e2c8');
    r.text('КТО БОЛЬШЕ СЪЕСТ', 240, 4, { align: 'center', color: '#5a3010', scale: 2 });
    r.text(clock(L.duration - L.t), 240, 26, { align: 'center', color: '#5a3010' });
    // столы и едоки
    r.rect(80, 140, 320, 14, '#c8c0b0');
    const draw = (id, x, dir) => { const sh = sheetOf(id); const f = frameRect(dir, Math.floor(this.time * (L.series ? 8 : 2)) % 3); r.sprite(sh, f.sx, f.sy, f.sw, f.sh, x, 84, 2); };
    draw('roma', 134, 'right'); draw(this.opp, 314, 'left');
    r.text(`Рома: ${L.eaten}`, 150, 160, { align: 'center', color: '#5a3010' });
    r.text(`${getPerson(this.opp).short}: ${L.oppEaten}`, 330, 160, { align: 'center', color: '#5a3010' });
    // желудок
    r.text('Желудок' + (L.fast ? ' (голод < 30 — ×2!)' : ''), 20, 40, { color: '#5a3010' });
    r.rect(20, 52, 100, 8, '#c8b090');
    r.rect(20, 52, Math.round(100 * Math.min(1, L.stomach / B.stomachMax)), 8, L.stomach >= B.stomachMax * 0.8 ? '#e05050' : '#e0a050');
    // серия
    r.text(`Серия: ${L.series} / ${B.notesPerSmazhenka}`, 20, 66, { color: '#5a3010' });
    // дорожка нот
    const lx = 300, lw = 160, ly = 40;
    r.rect(lx, ly, lw, 90, '#3a2a1a');
    DIRS.forEach((d, i) => r.text(ARROW[d], lx + 20 + i * 40, ly + 74, { align: 'center', color: '#ffe14d', scale: 1 }));
    r.rect(lx, ly + 70, lw, 1, '#ffe14d');
    for (const n of L.notes) {
      const dy = (n.at - L.t) * 70;
      if (dy < -12 || dy > 74) continue;
      const i = DIRS.indexOf(n.dir);
      const col = n.state === 'hit' ? '#6be36b' : n.state === 'miss' ? '#ff4a4a' : '#ffffff';
      r.text(ARROW[n.dir], lx + 20 + i * 40, ly + 74 - dy, { align: 'center', color: col, scale: 2 });
    }
    r.text('Стрелки — в такт, когда символ на линии', 240, 214, { align: 'center', color: '#5a3010' });
    this.particles.draw(r); this.popups.draw(r);
    this.game.hud.draw(r, this.ctx.state);
  }
}

registerMinigame('eat', {
  title: 'Кто больше съест',
  music: 'canteen',
  keys: ['Стрелки ← ↓ ↑ → — в такт', '6 попаданий = одна смаженка', 'Голод < 30 — желудок полный вдвое быстрее', 'Вход — 3 смаженки (3,60 BYN)'],
  describe: () => `Вход: ${(B.entry / 100).toFixed(2).replace('.', ',')} BYN. ${B.duration} с.`,
  create: (ctx) => new EatGame(ctx),
});
