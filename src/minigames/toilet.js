// «Царь туалета» (раздел 14, п. 4): перетягивание двери кабинки. Ползунок силы ходит туда-сюда,
// Z в зелёной зоне — рывок. 3 раунда. Сила соперника — BALANCE.toilet.strength.
import { registerMinigame } from './registry.js';
import { FakeInput, Particles, Popups, hungerMul, clock } from './kit.js';
import { BALANCE } from '../../data/balance.js';
import { getPerson, portraitOf, sheetOf } from '../gen/people.js';
import { frameRect } from '../gen/sprites.js';
import { GAME_H } from '../engine/renderer.js';
import { audio } from '../engine/audio.js';

const B = BALANCE.toilet;

export class ToiletLogic {
  // p: { opp, accuracy }
  constructor(rng, p = {}) {
    this.rng = rng;
    this.p = p;
    this.strength = B.strength[p.opp] ?? B.strength.default;
    const shrink = (B.green[1] - B.green[0]) * (1 - (p.accuracy || 1)) / 2;
    this.green = [B.green[0] + shrink, B.green[1] - shrink];
    this.round = 1; this.romaRounds = 0; this.oppRounds = 0;
    this.newRound();
    this.finished = false; this.result = null;
    this.events = [];
  }
  newRound() { this.door = 0; this.t = 0; this.s = 0; this.sdir = 1; this.oppT = this.nextOpp(); }
  nextOpp() { return this.rng.float(B.oppEvery[0], B.oppEvery[1]); }
  // door < 0 — дверь у Ромы (−1 — победа раунда), > 0 — у соперника
  update(dt, input) {
    if (this.finished) return;
    this.t += dt;
    this.s += this.sdir * B.sliderSpeed * dt;
    if (this.s >= 1) { this.s = 1; this.sdir = -1; } else if (this.s <= 0) { this.s = 0; this.sdir = 1; }
    if (input.pressed('confirm')) {
      if (this.s >= this.green[0] && this.s <= this.green[1]) { this.door -= B.pull; this.events.push({ type: 'pull' }); }
      else { this.door += B.miss; this.events.push({ type: 'miss' }); }
    }
    this.oppT -= dt;
    if (this.oppT <= 0) {
      this.door += B.oppPull * (0.9 + this.strength * 0.2) * this.rng.float(0.3, 1.7);
      this.oppT = this.nextOpp();
      this.events.push({ type: 'opp' });
    }
    if (this.door <= -1 || this.door >= 1 || this.t >= B.roundTime) {
      const romaWon = this.door < 0;
      if (romaWon) this.romaRounds++; else this.oppRounds++;
      this.events.push({ type: romaWon ? 'round_win' : 'round_lose' });
      if (this.romaRounds === 2 || this.oppRounds === 2 || this.round === B.rounds) {
        this.finished = true;
        this.result = this.romaRounds > this.oppRounds ? 'win' : 'lose';
      } else { this.round++; this.newRound(); }
    }
  }
}

// «Средний игрок»: жмёт, когда ползунок в зелёной зоне, с реакцией и промахами.
export function toiletBot(L, rng) {
  let cd = 0, aimAt = null;
  return (dt) => {
    const inp = new FakeInput();
    cd -= dt;
    const [a, b] = L.green;
    const inGreen = L.s >= a && L.s <= b;
    if (inGreen && aimAt === null) aimAt = rng.float(0.03, 0.16); // реакция
    if (!inGreen) aimAt = null;
    if (aimAt !== null) { aimAt -= dt; if (aimAt <= 0 && cd <= 0) { inp.press('confirm'); cd = rng.float(0.18, 0.3); aimAt = 99; } }
    if (rng.chance(0.25 * dt)) inp.press('confirm'); // нервное нажатие мимо
    return inp;
  };
}

class ToiletGame {
  constructor(ctx) { this.ctx = ctx; this.game = ctx.game; this.rng = ctx.rng; this.done = false; this.time = 0; this.particles = new Particles(); this.popups = new Popups(); }
  start(params) {
    this.opp = this.ctx.opp || params.opp || 'guza';
    this.L = new ToiletLogic(this.rng, { opp: this.opp, accuracy: hungerMul(this.ctx.state) });
    this.botFn = toiletBot(this.L, this.rng);
    this.shakeDoor = 0;
  }
  update(dt, input) {
    this.time += dt;
    this.particles.update(dt); this.popups.update(dt);
    this.shakeDoor = Math.max(0, this.shakeDoor - dt);
    this.L.update(dt, this.autoplay ? this.botFn(dt) : input);
    for (const e of this.L.events) {
      if (e.type === 'pull') { audio.play('hit'); this.shakeDoor = 0.15; this.particles.burst(240, 110, 6, { color: '#c8b080', speed: 50 }); this.popups.add(200, 70, 'РЫВОК!', '#6be36b'); }
      if (e.type === 'miss') { audio.play('menuDenied'); this.popups.add(200, 70, 'мимо', '#ff6a6a'); }
      if (e.type === 'opp') { audio.play('door'); this.shakeDoor = 0.12; }
      if (e.type === 'round_win') { audio.play('statUp'); this.game.r.shake(3, 0.3); }
      if (e.type === 'round_lose') { audio.play('statDown'); this.game.r.shake(3, 0.3); }
    }
    this.L.events = [];
    if (this.L.finished) this.done = true;
  }
  forfeit() { this.L.finished = true; this.L.result = 'lose'; return this.end(); }
  end() {
    const L = this.L;
    const win = L.result === 'win';
    return { result: L.result, deltas: win ? { aura: 6 } : { aura: -5 }, money: 0, summary: `Раунды: Рома ${L.romaRounds} — ${getPerson(this.opp).short} ${L.oppRounds}` };
  }
  draw(r) {
    const L = this.L;
    r.rect(0, 0, 480, GAME_H, '#dfe8ee');
    for (let i = 0; i < 480; i += 16) r.rect(i, 0, 1, GAME_H, '#b9c6d0');
    for (let j = 0; j < GAME_H; j += 16) r.rect(0, j, 480, 1, '#b9c6d0');
    r.text('ЦАРЬ ТУАЛЕТА', 240, 4, { align: 'center', color: '#2a2430', scale: 2 });
    r.text(`Раунд ${L.round} / ${B.rounds}   ·   ${L.romaRounds} : ${L.oppRounds}   ·   ${clock(B.roundTime - L.t)}`, 240, 26, { align: 'center', color: '#2a2430' });
    // кабинка и дверь: позиция двери показывает, кто тянет
    const cx = 240, cy = 120;
    r.rect(cx - 60, cy - 70, 120, 140, '#5b86a8');
    const dx = Math.round(L.door * 40) + (this.shakeDoor > 0 ? Math.round(Math.sin(this.time * 80) * 2) : 0);
    r.rect(cx - 30 + dx, cy - 64, 60, 128, '#7aa6c8');
    r.rect(cx - 30 + dx, cy - 64, 60, 4, '#a8c8e0');
    r.rect(cx + 20 + dx, cy, 6, 4, '#9aa3ad');
    // герои по краям
    const draw = (id, x, dir) => { const sh = sheetOf(id); const f = frameRect(dir, Math.floor(this.time * 6) % 3); r.sprite(sh, f.sx, f.sy, f.sw, f.sh, x, cy - 30, 2); };
    draw('roma', cx - 130 + Math.round(-L.door * 10), 'right');
    draw(this.opp, cx + 98 + Math.round(-L.door * 10), 'left');
    // шкала двери
    r.rect(140, 196, 200, 6, '#2c2840');
    r.rect(240 + Math.round(L.door * 100) - 2, 192, 4, 14, '#ffffff');
    r.text('Рома', 140, 206, { color: '#2a2430' }); r.text(getPerson(this.opp).short, 340, 206, { align: 'right', color: '#2a2430' });
    // ползунок силы
    const sx = 60, sw = 360, sy = 212;
    r.rect(sx, sy, sw, 10, '#3a3a48');
    r.rect(sx + Math.round(L.green[0] * sw), sy, Math.round((L.green[1] - L.green[0]) * sw), 10, '#5ad65a');
    r.rect(sx + Math.round(L.s * sw) - 2, sy - 3, 4, 16, '#ffe14d');
    r.text('Z — рывок, когда ползунок в зелёном', 240, 225, { align: 'center', color: '#2a2430' });
    this.particles.draw(r); this.popups.draw(r);
    this.game.hud.draw(r, this.ctx.state);
  }
}

registerMinigame('toilet', {
  title: 'Царь туалета',
  music: 'minigame',
  keys: ['Z — рывок двери', 'Жми, когда ползунок в зелёной зоне', 'Мимо — дверь уходит к сопернику', '3 раунда, до двух побед'],
  describe: (p, opp) => 'Перетягивание двери кабинки.',
  create: (ctx) => new ToiletGame(ctx),
});
