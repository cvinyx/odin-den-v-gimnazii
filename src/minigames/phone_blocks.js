// Телефон: блок-пазл (в духе Block Blast). Поле 8×8, 3 фигуры на выбор, полная строка/столбец исчезает.
// Управление: ←→ — выбрать фигуру, Z — взять; стрелки — двигать, Z — поставить, C — вернуть.
import { registerMinigame } from './registry.js';
import { PhoneGame } from './phone_shell.js';
import { FakeInput, hungerMul } from './kit.js';
import { BALANCE } from '../../data/balance.js';
import { audio } from '../engine/audio.js';

const B = BALANCE.phoneGames.blocks;
const N = 8;
// Фигуры — список клеток [x, y].
export const SHAPES = [
  [[0, 0]],
  [[0, 0], [1, 0]], [[0, 0], [0, 1]],
  [[0, 0], [1, 0], [2, 0]], [[0, 0], [0, 1], [0, 2]],
  [[0, 0], [1, 0], [0, 1], [1, 1]],
  [[0, 0], [0, 1], [1, 1]], [[1, 0], [0, 1], [1, 1]], [[0, 0], [1, 0], [0, 1]],
  [[0, 0], [1, 0], [2, 0], [1, 1]],
  [[0, 0], [0, 1], [0, 2], [1, 2]],
  [[0, 0], [1, 0], [2, 0], [3, 0]],
];
const COLORS = ['#e05050', '#50a0e0', '#e0c040', '#60c060', '#b070e0', '#e08a40'];

export class BlocksLogic {
  constructor(rng, p = {}) {
    this.rng = rng;
    this.grid = Array.from({ length: N }, () => Array(N).fill(null));
    this.score = 0;
    this.target = p.target || B.target;
    this.finished = false;
    this.deal();
    this.mode = 'select';
    this.sel = 0;
    this.cx = 2; this.cy = 2;
  }
  deal() { this.hand = [0, 1, 2].map(() => ({ shape: this.rng.pick(SHAPES), color: this.rng.pick(COLORS) })); }
  fits(shape, x, y) {
    return shape.every(([dx, dy]) => x + dx >= 0 && y + dy >= 0 && x + dx < N && y + dy < N && !this.grid[y + dy][x + dx]);
  }
  anyFit(shape) { for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (this.fits(shape, x, y)) return true; return false; }
  // Поставить фигуру из руки. Возвращает число очищенных линий или −1.
  place(i, x, y) {
    const p = this.hand[i];
    if (!p || !this.fits(p.shape, x, y)) return -1;
    for (const [dx, dy] of p.shape) this.grid[y + dy][x + dx] = p.color;
    this.score += p.shape.length;
    const rows = [], cols = [];
    for (let k = 0; k < N; k++) {
      if (this.grid[k].every(Boolean)) rows.push(k);
      if (this.grid.every((row) => row[k])) cols.push(k);
    }
    for (const k of rows) this.grid[k].fill(null);
    for (const k of cols) for (let j = 0; j < N; j++) this.grid[j][k] = null;
    const lines = rows.length + cols.length;
    if (lines) this.score += lines * B.linePoints + (lines - 1) * B.comboBonus;
    this.hand[i] = null;
    if (this.hand.every((h) => !h)) this.deal();
    if (!this.hand.some((h) => h && this.anyFit(h.shape))) this.finished = true; // некуда ставить
    return lines;
  }
  // Лучший ход для бота (жадно: больше линий, плотнее к краю).
  bestMove() {
    let best = null;
    this.hand.forEach((h, i) => {
      if (!h) return;
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
        if (!this.fits(h.shape, x, y)) continue;
        let v = 0;
        const g = this.grid.map((r) => r.slice());
        for (const [dx, dy] of h.shape) g[y + dy][x + dx] = 1;
        for (let k = 0; k < N; k++) { if (g[k].every(Boolean)) v += 10; if (g.every((r) => r[k])) v += 10; }
        for (const [dx, dy] of h.shape) for (const [ax, ay] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + dx + ax, ny = y + dy + ay;
          if (nx < 0 || ny < 0 || nx >= N || ny >= N || g[ny][nx]) v += 0.4;
        }
        if (!best || v > best.v) best = { i, x, y, v };
      }
    });
    return best;
  }
}

export class BlocksInner {
  constructor(rng, p) {
    this.L = new BlocksLogic(rng, {});
    this.kit = p.kit;
    this.rng = rng;
    this.speed = 1; // голод сокращает время игры (−20 %), см. create()
    this.botT = 0; this.botMove = null;
  }
  get score() { return this.L.score; }
  get target() { return this.L.target; }
  get finished() { return this.L.finished; }
  update(dt, input) {
    const L = this.L;
    if (L.mode === 'select') {
      if (input.pressed('left')) L.sel = (L.sel + 2) % 3;
      if (input.pressed('right')) L.sel = (L.sel + 1) % 3;
      if (input.pressed('confirm') && L.hand[L.sel]) { L.mode = 'place'; audio.play('menuMove'); }
    } else {
      const sh = L.hand[L.sel].shape;
      const w = Math.max(...sh.map((c) => c[0])) + 1, h = Math.max(...sh.map((c) => c[1])) + 1;
      if (input.pressed('left')) L.cx = Math.max(0, L.cx - 1);
      if (input.pressed('right')) L.cx = Math.min(N - w, L.cx + 1);
      if (input.pressed('up')) L.cy = Math.max(0, L.cy - 1);
      if (input.pressed('down')) L.cy = Math.min(N - h, L.cy + 1);
      if (input.pressed('action2')) L.mode = 'select';
      if (input.pressed('confirm')) {
        const lines = L.place(L.sel, L.cx, L.cy);
        if (lines < 0) audio.play('menuDenied');
        else {
          audio.play(lines ? 'coin' : 'menuSelect');
          const ox = this.kit ? 176 + 12 + L.cx * 13 : 0;
          if (this.kit && lines) { this.kit.popups.add(ox + 10, 60 + L.cy * 13, '+' + (lines * 10), '#6be36b'); this.kit.particles.burst(ox + 10, 60 + L.cy * 13, 14, { color: '#ffe14d', speed: 60 }); this.kit.game.r.shake(2, 0.2); }
          L.mode = 'select';
          L.sel = L.hand.findIndex(Boolean);
        }
      }
    }
  }
  // «Средний игрок»: выбирает ход, думает ~0,5 с, потом жмёт по клавише каждые ~0,13 с.
  // Решение строится от текущего состояния, так что потерянное нажатие (лаг) не сбивает бота.
  bot(dt) {
    const inp = new FakeInput();
    this.botT -= dt * this.speed;
    if (this.botT > 0) return inp;
    const L = this.L;
    const m = this.botMove;
    if (!m || !L.hand[m.i] || L.hand[m.i] !== m.piece || !L.fits(m.piece.shape, m.x, m.y)) {
      const b = L.bestMove();
      this.botMove = b ? { ...b, piece: L.hand[b.i] } : null;
      this.botT = this.rng.float(0.35, 0.7);
      return inp;
    }
    if (L.mode === 'select') inp.press(L.sel === m.i ? 'confirm' : 'right');
    else if (L.sel !== m.i) inp.press('action2');
    else if (L.cx < m.x) inp.press('right');
    else if (L.cx > m.x) inp.press('left');
    else if (L.cy < m.y) inp.press('down');
    else if (L.cy > m.y) inp.press('up');
    else inp.press('confirm');
    this.botT = this.rng.float(0.1, 0.17);
    return inp;
  }
  draw(r, x, y, w) {
    const L = this.L;
    r.rect(0, 0, w, 200, '#1a2a44');
    r.text('BLOCKS', w / 2, 2, { align: 'center', color: '#ffe14d' });
    const gx = 12, gy = 14, c = 13;
    r.rect(gx - 2, gy - 2, N * c + 3, N * c + 3, '#0c1424');
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const v = L.grid[j][i];
      r.rect(gx + i * c, gy + j * c, c - 1, c - 1, v || '#22324e');
      if (v) r.rect(gx + i * c, gy + j * c, c - 1, 2, '#ffffff55');
    }
    if (L.mode === 'place' && L.hand[L.sel]) {
      const sh = L.hand[L.sel];
      const ok = L.fits(sh.shape, L.cx, L.cy);
      for (const [dx, dy] of sh.shape) r.alpha(0.7, () => r.rect(gx + (L.cx + dx) * c, gy + (L.cy + dy) * c, c - 1, c - 1, ok ? sh.color : '#ff3030'));
    }
    // рука
    L.hand.forEach((h, i) => {
      const hx = 6 + i * 40, hy = 128;
      if (i === L.sel) r.frame(hx - 2, hy - 2, 38, 38, L.mode === 'place' ? '#6be36b' : '#ffe14d');
      if (!h) return;
      for (const [dx, dy] of h.shape) r.rect(hx + dx * 8, hy + dy * 8, 7, 7, h.color);
    });
    r.text('Z взять/поставить, C отмена', w / 2, 172, { align: 'center', color: '#9a9aa8' });
  }
}

registerMinigame('phone_blocks', {
  title: 'Телефон: блок-пазл',
  music: 'minigame',
  keys: ['←→ — фигура, Z — взять', 'Стрелки — двигать, Z — поставить, C — назад', 'X — спрятать телефон (пауза)', 'Играешь, когда учитель смотрит — подозрение'],
  describe: () => `Собери ${B.target} очков за ${B.duration} с, не попавшись.`,
  create: (ctx) => new PhoneGame(ctx, (rng, p) => new BlocksInner(rng, p), { duration: B.duration * hungerMul(ctx.state) || B.duration, title: 'Блок-пазл', help: ['←→ Z — фигура', 'стрелки Z — ставить', 'C — назад'] }),
});
