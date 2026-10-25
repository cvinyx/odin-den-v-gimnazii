// «Душ» (раздел 14, п. 8; ИС-12 — до и после плавания): душевые бассейна. Держишь Z — стоишь под душем; температура
// скачет — стрелками ↑↓ держи её в комфортной зоне; кто-то толкает — нажми X вовремя.
// Цель — достоять дольше друзей. Проигрыш: учитель вежливо поторапливает всех, стресс +10.
import { registerMinigame } from './registry.js';
import { FakeInput, Particles, Popups, hungerMul, vrand } from './kit.js';
import { BALANCE } from '../../data/balance.js';
import { getPerson, swimSheetOf } from '../gen/people.js';
import { frameRect } from '../gen/sprites.js';
import { GAME_H } from '../engine/renderer.js';
import { audio } from '../engine/audio.js';

const B = BALANCE.shower;

export class ShowerLogic {
  // p: { friends: [id, id], accuracy }
  constructor(rng, p = {}) {
    this.rng = rng;
    this.friends = (p.friends || ['igor', 'denis']).map((id) => {
      const [a, b] = B.friends[id] || B.friends.default;
      return { id, time: rng.float(a, b), out: false };
    });
    const shrink = (B.comfort[1] - B.comfort[0]) * (1 - (p.accuracy || 1)) / 2;
    this.zone = [B.comfort[0] + shrink, B.comfort[1] - shrink];
    this.temp = 0.5; this.vel = 0; this.jumpT = this.rng.float(B.jumpEvery[0], B.jumpEvery[1]);
    this.pushT = this.rng.float(B.pushEvery[0], B.pushEvery[1]); this.push = 0;
    this.discomfort = 0;
    this.t = 0; this.romaTime = 0; this.started = false;
    this.finished = false; this.result = null; this.reason = null; this.events = [];
  }
  update(dt, input) {
    if (this.finished) return;
    this.t += dt;
    for (const f of this.friends) if (!f.out && this.t >= f.time) { f.out = true; this.events.push({ type: 'friend_out', id: f.id }); }
    const held = input.held('confirm');
    // V2-4 (ИС-12): Z, зажатая ещё в меню «Начать», не считается — иначе отпускание сразу заканчивало игру
    if (!this.started) { if (!held) this.armed = true; else if (this.armed) this.started = true; return; }
    if (!held) return this.stop('left');
    this.romaTime = this.t;
    // температура
    this.jumpT -= dt;
    if (this.jumpT <= 0) { this.vel += (this.rng.chance(0.5) ? 1 : -1) * B.jump; this.jumpT = this.rng.float(B.jumpEvery[0], B.jumpEvery[1]); this.events.push({ type: 'jump' }); }
    this.vel += (this.rng.next() - 0.5) * B.drift * dt * 4;
    this.vel *= 1 - dt * 0.8;
    if (input.held('up')) this.temp += B.adjust * dt;
    if (input.held('down')) this.temp -= B.adjust * dt;
    this.temp = Math.max(0, Math.min(1, this.temp + this.vel * dt));
    const inZone = this.temp >= this.zone[0] && this.temp <= this.zone[1];
    this.discomfort = Math.max(0, this.discomfort + (inZone ? -0.25 : B.discomfort) * dt);
    if (this.discomfort >= 1) return this.stop(this.temp > 0.5 ? 'hot' : 'cold');
    // толчки
    if (this.push > 0) {
      if (input.pressed('back')) { this.push = 0; this.events.push({ type: 'block' }); }
      else { this.push -= dt; if (this.push <= 0) return this.stop('pushed'); }
    } else {
      this.pushT -= dt;
      if (this.pushT <= 0) { this.push = B.pushWindow; this.pushT = this.rng.float(B.pushEvery[0], B.pushEvery[1]); this.events.push({ type: 'push' }); }
    }
    if (this.t >= B.maxTime) this.stop('max');
  }
  stop(reason) {
    this.finished = true; this.reason = reason;
    this.result = this.friends.every((f) => this.romaTime > f.time) ? 'win' : 'lose';
  }
}

export function showerBot(L, rng) {
  let pushSeen = 0, blockAt = null, adj = null;
  return (dt) => {
    const inp = new FakeInput();
    if (L.started && L.friends.every((f) => f.out)) return inp; // все вышли — можно и самому
    if (!L.armed) return inp; // сначала отпустить Z
    inp.hold('confirm');
    // температура: «средний игрок» реагирует с запаздыванием
    const mid = (L.zone[0] + L.zone[1]) / 2;
    if (adj === null || rng.chance(dt * 6)) adj = L.temp < mid - 0.04 ? 'up' : L.temp > mid + 0.04 ? 'down' : null;
    if (adj) inp.hold(adj);
    if (L.push > 0) {
      if (blockAt === null) blockAt = rng.chance(0.88) ? rng.float(0.15, 0.5) : 9;
      pushSeen += dt;
      if (pushSeen >= blockAt) { inp.press('back'); blockAt = 9; }
    } else { pushSeen = 0; blockAt = null; }
    return inp;
  };
}

class ShowerGame {
  constructor(ctx) { this.ctx = ctx; this.game = ctx.game; this.rng = ctx.rng; this.done = false; this.time = 0; this.particles = new Particles(); this.popups = new Popups(); }
  start(params) {
    const friends = params.friends || this.rng.shuffle(['igor', 'denis', 'chernyak', 'shurpo']).slice(0, 2);
    this.L = new ShowerLogic(this.rng, { friends, accuracy: hungerMul(this.ctx.state) });
    this.botFn = showerBot(this.L, this.rng);
  }
  update(dt, input) {
    this.time += dt;
    this.particles.update(dt); this.popups.update(dt);
    if (vrand() < 0.6) this.particles.burst(80 + Math.floor(vrand() * 5) * 80, 40, 1, { color: '#9fd3ff', speed: 30, angle: Math.PI / 2, spread: 0.3, gravity: 120, life: 0.8, size: 2 });
    this.L.update(dt, this.autoplay ? this.botFn(dt) : input);
    for (const e of this.L.events) {
      if (e.type === 'friend_out') { audio.play('door'); this.popups.add(240, 60, getPerson(e.id).short + ' сдался!', '#6be36b'); }
      if (e.type === 'push') { audio.play('menuMove'); this.game.r.shake(3, 0.3); }
      if (e.type === 'block') { audio.play('hit'); this.popups.add(160, 80, 'Отбился!', '#6be36b'); }
      if (e.type === 'jump') audio.play('menuDenied');
    }
    this.L.events = [];
    if (this.L.finished) this.done = true;
  }
  forfeit() { this.L.stop('left'); this.L.result = 'lose'; return this.end(); }
  end() {
    const L = this.L;
    const win = L.result === 'win';
    const reasons = { left: 'вышел сам', hot: 'обжёгся', cold: 'замёрз', pushed: 'вытолкали', max: 'достоял до конца' };
    return { result: L.result, deltas: win ? { aura: 4 } : { stress: B.loseStress }, money: 0, summary: `Рома: ${Math.round(L.romaTime)} с (${reasons[L.reason]}) · ` + L.friends.map((f) => `${getPerson(f.id).short} ${Math.round(f.time)} с`).join(' · ') };
  }
  draw(r) {
    const L = this.L;
    r.rect(0, 0, 480, GAME_H, '#dfe8ee');
    for (let i = 0; i < 480; i += 12) r.rect(i, 0, 1, GAME_H, '#c4d2dc');
    for (let j = 0; j < GAME_H; j += 12) r.rect(0, j, 480, 1, '#c4d2dc');
    r.text('ДУШ', 240, 4, { align: 'center', color: '#2a3440', scale: 2 });
    r.text(`${Math.round(L.t)} с`, 240, 26, { align: 'center', color: '#2a3440' });
    const people = [{ id: 'roma', out: L.finished }, ...L.friends];
    people.forEach((p, i) => {
      const x = 80 + i * 120;
      r.rect(x + 8, 32, 14, 6, '#9aa3ad');
      if (p.out) return;
      const sh = swimSheetOf(p.id); const f = frameRect('down', 0); // в плавках и шапочке (У-3)
      const dx = p.id === 'roma' && L.push > 0 ? Math.round(Math.sin(this.time * 60) * 3) : 0;
      r.sprite(sh, f.sx, f.sy, f.sw, f.sh, x + dx, 60, 2);
    });
    // термометр
    const tx = 430, ty = 50, th = 140;
    r.rect(tx, ty, 14, th, '#3a3a48');
    r.rect(tx, ty + Math.round((1 - L.zone[1]) * th), 14, Math.round((L.zone[1] - L.zone[0]) * th), '#5ad65a');
    r.rect(tx - 4, ty + Math.round((1 - L.temp) * th) - 1, 22, 3, L.temp > 0.5 ? '#ff4a4a' : '#4a9aff');
    r.text('t°', tx + 7, ty - 12, { align: 'center', color: '#2a3440' });
    r.text('Дискомфорт', 20, 196, { color: '#2a3440' });
    r.rect(100, 198, 100, 6, '#c4d2dc');
    r.rect(100, 198, Math.round(100 * Math.min(1, L.discomfort)), 6, '#e05050');
    if (L.push > 0) r.text('ТОЛКАЮТ! ЖМИ X!', 240, 40, { align: 'center', color: '#c02020', scale: 2, shadow: '#fff' });
    if (!L.started) r.text('Зажми Z, чтобы встать под душ', 240, 170, { align: 'center', color: '#2a3440' });
    r.text('Z держать · ↑↓ температура · X отбиться', 240, 214, { align: 'center', color: '#2a3440' });
    this.particles.draw(r); this.popups.draw(r);
    this.game.hud.draw(r, this.ctx.state);
  }
}

registerMinigame('shower', {
  title: 'Душ',
  music: 'minigame',
  keys: ['Держи Z — стоишь под душем', '↑↓ — держи температуру в зелёной зоне', 'Толкают — успей нажать X', 'Достой дольше друзей'],
  describe: () => 'Душ у бассейна. Горячей воды мало.',
  create: (ctx) => new ShowerGame(ctx),
});
