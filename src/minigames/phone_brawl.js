// Телефон: аркада-броулер (в духе Brawl Stars). Маленькая арена, стрельба по ботам, 45 с.
// Рядом с Денисом — кооператив с ботом-Денисом. Физик выходит из кабинета — окна безопасной игры.
// Управление: стрелки — бег, Z — выстрел (в сторону движения).
import { registerMinigame } from './registry.js';
import { PhoneGame } from './phone_shell.js';
import { FakeInput, hungerMul, vrand } from './kit.js';
import { BALANCE } from '../../data/balance.js';
import { audio } from '../engine/audio.js';

const B = BALANCE.phoneGames.brawl;
const W = 128, H = 128, OY = 16;

export class BrawlLogic {
  // p: { coop, speedMul }
  constructor(rng, p = {}) {
    this.rng = rng;
    this.p = p;
    this.player = { x: W / 2, y: H - 20, hp: B.hp, dir: [0, -1], cd: 0, inv: 0 };
    this.denis = p.coop ? { x: W / 2 - 20, y: H - 24, cd: 0, tx: W / 2, ty: H / 2 } : null;
    this.enemies = [];
    this.bullets = [];
    this.kills = 0;
    this.target = p.target || B.target;
    this.spawnT = 0.5;
    this.finished = false;
    this.dead = false;
    this.events = []; // для эффектов: { type, x, y }
  }
  get score() { return this.kills; }

  spawn() {
    const side = this.rng.int(0, 2);
    const x = side === 0 ? 6 : side === 1 ? W - 6 : this.rng.float(10, W - 10);
    const y = side === 2 ? 6 : this.rng.float(6, H / 2);
    this.enemies.push({ x, y, hp: B.enemyHp, sp: this.rng.float(B.enemySpeed[0], B.enemySpeed[1]), fire: this.rng.float(B.enemyFire[0], B.enemyFire[1]) });
  }

  shoot(from, dx, dy, team, speed) {
    const n = Math.hypot(dx, dy) || 1;
    this.bullets.push({ x: from.x, y: from.y, vx: dx / n * speed, vy: dy / n * speed, team, t: 0 });
  }

  update(dt, input) {
    if (this.finished) return;
    const P = this.player;
    const sp = B.playerSpeed * (this.p.speedMul || 1);
    const ax = input.axis();
    if (ax.x || ax.y) { P.dir = [ax.x, ax.y]; const n = Math.hypot(ax.x, ax.y); P.x += ax.x / n * sp * dt; P.y += ax.y / n * sp * dt; }
    P.x = Math.max(4, Math.min(W - 4, P.x)); P.y = Math.max(4, Math.min(H - 4, P.y));
    P.cd -= dt; P.inv -= dt;
    if (input.pressed('confirm') && P.cd <= 0) {
      const spread = (1 - (this.p.speedMul || 1)) * 0.6; // голод: хуже точность
      const a = Math.atan2(P.dir[1], P.dir[0]) + (this.rng.next() - 0.5) * spread;
      this.shoot(P, Math.cos(a), Math.sin(a), 'p', B.bulletSpeed);
      P.cd = B.fireCooldown;
      this.events.push({ type: 'shot' });
    }
    // Денис-бот
    const D = this.denis;
    if (D) {
      D.cd -= dt;
      if (Math.hypot(D.tx - D.x, D.ty - D.y) < 3) { D.tx = this.rng.float(16, W - 16); D.ty = this.rng.float(H / 2, H - 10); }
      const dx = D.tx - D.x, dy = D.ty - D.y, n = Math.hypot(dx, dy) || 1;
      D.x += dx / n * 34 * dt; D.y += dy / n * 34 * dt;
      const e = this.nearest(D);
      if (e && D.cd <= 0) { this.shoot(D, e.x - D.x, e.y - D.y, 'p', B.bulletSpeed); D.cd = B.denisFire; }
    }
    // враги
    this.spawnT -= dt;
    if (this.spawnT <= 0 && this.enemies.length < B.maxEnemies) { this.spawn(); this.spawnT = B.spawnEvery; }
    for (const e of this.enemies) {
      const tgt = D && Math.hypot(D.x - e.x, D.y - e.y) < Math.hypot(P.x - e.x, P.y - e.y) ? D : P;
      const dx = tgt.x - e.x, dy = tgt.y - e.y, d = Math.hypot(dx, dy) || 1;
      if (d > 34) { e.x += dx / d * e.sp * dt; e.y += dy / d * e.sp * dt; }
      else { e.x -= dy / d * e.sp * 0.6 * dt; e.y += dx / d * e.sp * 0.6 * dt; } // кружит
      e.fire -= dt;
      if (e.fire <= 0) { this.shoot(e, dx, dy, 'e', B.enemyBullet); e.fire = this.rng.float(B.enemyFire[0], B.enemyFire[1]); }
    }
    // пули
    for (const b of this.bullets) {
      b.x += b.vx * dt; b.y += b.vy * dt; b.t += dt;
      if (b.team === 'p') {
        for (const e of this.enemies) if (!b.hit && Math.hypot(e.x - b.x, e.y - b.y) < 6) { b.hit = true; e.hp--; this.events.push({ type: 'hit', x: e.x, y: e.y }); }
      } else if (!b.hit && Math.hypot(P.x - b.x, P.y - b.y) < 5 && P.inv <= 0) {
        b.hit = true; P.hp--; P.inv = 0.6; this.events.push({ type: 'hurt', x: P.x, y: P.y });
      }
    }
    this.bullets = this.bullets.filter((b) => !b.hit && b.t < 3 && b.x > -4 && b.y > -4 && b.x < W + 4 && b.y < H + 4);
    const before = this.enemies.length;
    this.enemies = this.enemies.filter((e) => { if (e.hp <= 0) { this.events.push({ type: 'kill', x: e.x, y: e.y }); return false; } return true; });
    this.kills += before - this.enemies.length;
    if (P.hp <= 0) { this.dead = true; this.finished = true; }
  }

  nearest(from) {
    let best = null, bd = 1e9;
    for (const e of this.enemies) { const d = Math.hypot(e.x - from.x, e.y - from.y); if (d < bd) { bd = d; best = e; } }
    return best;
  }
}

// «Средний игрок»: держит дистанцию, поворачивается к ближайшему врагу, стреляет с задержкой реакции.
export function brawlBot(L, rng) {
  let think = 0, keys = { x: 0, y: 0 }, fireIn = 0;
  return (dt) => {
    const inp = new FakeInput();
    const P = L.player;
    think -= dt; fireIn -= dt;
    const e = L.nearest(P);
    if (think <= 0) {
      think = rng.float(0.18, 0.32);
      keys = { x: 0, y: 0 };
      if (e) {
        const dx = e.x - P.x, dy = e.y - P.y, d = Math.hypot(dx, dy);
        const ang = Math.atan2(dy, dx);
        const oct = Math.round(ang / (Math.PI / 4));
        let fx = Math.round(Math.cos(oct * Math.PI / 4)), fy = Math.round(Math.sin(oct * Math.PI / 4));
        if (d < 30) { fx = -fx; fy = -fy; } // отступить
        keys = { x: fx, y: fy };
        // уклон от ближайшей пули
        const b = L.bullets.find((b) => b.team === 'e' && Math.hypot(b.x - P.x, b.y - P.y) < 18);
        if (b && rng.chance(0.6)) keys = { x: Math.sign(-b.vy) || 1, y: Math.sign(b.vx) || 0 };
      }
    }
    if (keys.x > 0) inp.hold('right'); if (keys.x < 0) inp.hold('left');
    if (keys.y > 0) inp.hold('down'); if (keys.y < 0) inp.hold('up');
    if (e && fireIn <= 0) {
      // повернуться к врагу и выстрелить
      const dx = e.x - P.x, dy = e.y - P.y;
      const oct = Math.round(Math.atan2(dy, dx) / (Math.PI / 4));
      const fx = Math.round(Math.cos(oct * Math.PI / 4)), fy = Math.round(Math.sin(oct * Math.PI / 4));
      inp.h.clear();
      if (fx > 0) inp.hold('right'); if (fx < 0) inp.hold('left');
      if (fy > 0) inp.hold('down'); if (fy < 0) inp.hold('up');
      inp.press('confirm');
      fireIn = rng.float(0.32, 0.5);
    }
    return inp;
  };
}

export class BrawlInner {
  constructor(rng, p) {
    const st = p.state;
    this.L = new BrawlLogic(rng, { coop: st.seat === 'steal_ok' || !!p.coop, speedMul: hungerMul(st) });
    this.kit = p.kit;
    this.botFn = brawlBot(this.L, rng);
  }
  get score() { return this.L.kills; }
  get target() { return this.L.target; }
  get finished() { return this.L.finished; }
  update(dt, input) {
    this.L.update(dt, input);
    for (const e of this.L.events) {
      if (e.type === 'shot') audio.play('menuMove');
      if (e.type === 'kill') { audio.play('hit'); if (this.kit) { this.kit.particles.burst(176 + e.x, 22 + OY + e.y, 12, { color: '#ff6a4a', speed: 50 }); this.kit.popups.add(176 + e.x, 22 + OY + e.y, '+1', '#6be36b'); } }
      if (e.type === 'hurt') { audio.play('statDown'); if (this.kit) this.kit.game.r.shake(3, 0.2); }
    }
    this.L.events = [];
  }
  bot(dt) { return this.botFn(dt); }
  draw(r, x, y, w) {
    const L = this.L;
    r.rect(0, 0, w, 200, '#162016');
    r.text(`♥${L.player.hp}  ☠${L.kills}`, 4, 3, { color: '#ffffff' });
    if (L.denis) r.text('кооп', w - 4, 3, { align: 'right', color: '#9fd3ff' });
    r.rect(0, OY, W, H, '#3a6a3a');
    for (let i = 0; i < 8; i++) r.rect((i * 37) % W, OY + (i * 53) % H, 10, 6, '#2e5a2e'); // кусты
    for (const b of L.bullets) r.rect(b.x - 1, OY + b.y - 1, 3, 3, b.team === 'p' ? '#ffe14d' : '#ff5050');
    for (const e of L.enemies) { r.rect(e.x - 4, OY + e.y - 4, 8, 8, '#c03030'); r.rect(e.x - 2, OY + e.y - 2, 4, 2, '#ffffff'); }
    if (L.denis) { r.rect(L.denis.x - 4, OY + L.denis.y - 4, 8, 8, '#7a4526'); r.rect(L.denis.x - 3, OY + L.denis.y - 6, 6, 3, '#4a2a16'); }
    const P = L.player;
    if (P.inv <= 0 || Math.floor(P.inv * 20) % 2) { r.rect(P.x - 4, OY + P.y - 4, 8, 8, '#e9cf6e'); r.rect(P.x - 1 + P.dir[0] * 4, OY + P.y - 1 + P.dir[1] * 4, 3, 3, '#ffffff'); }
    r.text('Z — огонь, стрелки — бег', w / 2, OY + H + 6, { align: 'center', color: '#9a9aa8' });
  }
}

registerMinigame('phone_brawl', {
  title: 'Телефон: аркада-броулер',
  music: 'minigame',
  keys: ['Стрелки — бег, Z — выстрел', 'X — спрятать телефон (пауза)', 'Учитель вышел — играй смело', 'Рядом Денис — он помогает'],
  describe: () => `Выбей ${B.target} ботов за ${B.duration} с и не умри.`,
  create: (ctx) => new PhoneGame(ctx, (rng, p) => new BrawlInner(rng, p), { duration: B.duration, title: 'Броулер', help: ['стрелки — бег', 'Z — огонь'] }),
});
