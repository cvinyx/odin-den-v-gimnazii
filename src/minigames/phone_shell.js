// Оболочка «телефон под партой» (раздел 14, п. 2): iPhone 11 с трещиной, батарея, силуэт учителя
// и индикатор «смотрит / не смотрит», X — мгновенно спрятать (пауза), лаги-фризы, смерть при 0 %.
// Логика (PhoneShellLogic) — без отрисовки; PhoneGame — общая обёртка для трёх телефонных игр.
import { BALANCE } from '../../data/balance.js';
import { TEACHERS } from '../../data/teachers.js';
import { portraitOf } from '../gen/people.js';
import { GAME_H } from '../engine/renderer.js';
import { audio } from '../engine/audio.js';
import { lessonInfo } from '../game/day.js';
import { clock, Popups, Particles, FakeInput } from './kit.js';

const PB = BALANCE.phoneGames;

export class PhoneShellLogic {
  // p: { suddenTurn, leavesRoom, mul, duration, battery, startSuspicion }
  constructor(rng, p) {
    this.rng = rng;
    this.p = p;
    this.t = 0;
    this.duration = p.duration;
    this.mode = 'board';
    this.timer = rng.float(PB.teacher.board[0], PB.teacher.board[1]);
    this.hidden = false;
    this.hiddenTime = 0;
    this.frozen = 0;
    this.lagNext = this.nextLag();
    this.suspicion = p.startSuspicion || 0;
    this.added = 0;
    this.finished = false;
    this.result = null;
    this.windows = p.leavesRoom ? PB.outWindows.map(([a, d]) => [a, a + d]).filter(([a]) => a < this.duration) : [];
  }

  nextLag() {
    const low = this.p.battery < BALANCE.battery.lowThreshold;
    const [a, b] = low ? BALANCE.battery.lagIntervalLow : BALANCE.battery.lagInterval;
    return this.rng.float(a, b);
  }

  get out() { return this.windows.some(([a, b]) => this.t >= a && this.t < b); }
  get watching() { return !this.out && this.mode === 'watch'; }
  get warning() { return !this.out && this.mode === 'warn'; }

  // Возвращает true, если игра на экране сейчас идёт (не спрятан и не фриз).
  update(dt, toggleHide) {
    if (this.finished) return false;
    this.t += dt;
    if (toggleHide) this.hidden = !this.hidden;
    if (this.hidden) this.hiddenTime += dt;
    // учитель
    this.timer -= dt;
    if (this.timer <= 0) {
      if (this.mode === 'board') { this.mode = 'warn'; this.timer = this.p.suddenTurn ? PB.suddenTurnWarn : PB.teacher.warn; }
      else if (this.mode === 'warn') { this.mode = 'watch'; this.timer = this.rng.float(PB.teacher.watch[0], PB.teacher.watch[1]); }
      else { this.mode = 'board'; this.timer = this.rng.float(PB.teacher.board[0], PB.teacher.board[1]); }
    }
    // лаги (только когда телефон в руках)
    if (this.frozen > 0) this.frozen = Math.max(0, this.frozen - dt);
    else if (!this.hidden) {
      this.lagNext -= dt;
      if (this.lagNext <= 0) { this.frozen = this.rng.float(BALANCE.battery.lagFreeze[0], BALANCE.battery.lagFreeze[1]); this.lagNext = this.nextLag(); }
    }
    // подозрение: играешь, пока учитель смотрит
    if (!this.hidden && this.watching) {
      const add = BALANCE.minigames.phone.suspicionPerSecond * dt * (this.p.mul || 1);
      this.suspicion = Math.min(100, this.suspicion + add);
      this.added += add;
    }
    if (this.suspicion >= 100) { this.finished = true; this.result = 'director'; }
    else if (this.t >= this.duration) { this.finished = true; this.result = 'time'; }
    return !this.hidden && this.frozen <= 0 && !this.finished;
  }
}

// Бот оболочки: прячет телефон при признаке поворота и достаёт, когда учитель снова у доски.
// Реакция «среднего игрока» — 0,2–0,45 с, поэтому на внезапном повороте он иногда попадается.
export function shellBot(rng) {
  let since = 0, last = null, reaction = 0.3;
  return (S, dt) => {
    const danger = S.warning || S.watching;
    if (danger !== last) { since = 0; last = danger; reaction = rng.float(0.2, 0.45); } else since += dt;
    if (danger && !S.hidden && since >= reaction) return true;
    if (!danger && S.hidden && since >= reaction + 0.15) return true;
    return false;
  };
}

// Оценка за телефонный урок: базовая, + если слушал (прятал телефон долго), − если много подозрения.
export function phoneLessonGrade(rng, S) {
  const g = PB.grade;
  let grade = rng.int(g.base[0], g.base[1]);
  if (S.hiddenTime >= S.duration * g.listenShare) grade += g.listenBonus;
  if (S.added >= g.caughtAt) grade -= g.caughtPenalty;
  return Math.max(1, Math.min(10, grade));
}

// ---------- Отрисовка корпуса телефона (используется и сообщениями отца) ----------
export const PHONE = { x: 168, y: 4, w: 144, h: 226, sx: 8, sy: 18, sw: 128, sh: 196 };

export function drawPhoneFrame(r, x, y, battery, time = 0) {
  const P = PHONE;
  r.rect(x, y, P.w, P.h, '#16161a');
  r.frame(x, y, P.w, P.h, '#3a3a44', 2);
  r.rect(x + P.sx, y + P.sy, P.sw, P.sh, '#101820');
  r.rect(x + 52, y + 5, 40, 6, '#000');
  // статус-бар
  r.rect(x + P.sx, y + P.sy - 12, P.sw, 11, '#000');
  const hh = 9 + Math.floor(time / 60) % 3, mm = (46 + Math.floor(time)) % 60;
  r.text(`${hh}:${String(mm).padStart(2, '0')}`, x + P.sx + 3, y + P.sy - 11, { color: '#ffffff' });
  const low = battery < 20;
  r.frame(x + P.sx + P.sw - 26, y + P.sy - 10, 18, 8, '#ffffff');
  r.rect(x + P.sx + P.sw - 24, y + P.sy - 8, Math.max(1, Math.round(14 * battery / 100)), 4, low ? '#ff4a4a' : '#5ad65a');
  r.text(String(Math.round(battery)), x + P.sx + P.sw - 30, y + P.sy - 11, { color: low ? '#ff6a6a' : '#ffffff', align: 'right' });
}

// трещина поверх экрана
export function drawCrack(r, x, y) {
  const P = PHONE;
  const pts = [[100, 20], [92, 40], [98, 55], [86, 80], [90, 96], [78, 120]];
  for (let i = 0; i + 1 < pts.length; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[i + 1];
    const n = Math.max(Math.abs(bx - ax), Math.abs(by - ay));
    for (let k = 0; k <= n; k++) r.rect(x + P.sx + Math.round(ax + (bx - ax) * k / n), y + P.sy + Math.round(ay + (by - ay) * k / n), 1, 1, '#d8eef8');
  }
  r.rect(x + P.sx + 98, y + P.sy + 55, 10, 1, '#d8eef8');
  r.rect(x + P.sx + 88, y + P.sy + 96, 1, 9, '#d8eef8');
}

// Общая обёртка телефонной игры: оболочка + внутренняя игра (inner).
// inner: { update(dt, input), draw(r, x, y, w, h), score, target, finished?, onFrozenPress?(), bot?(dt) → FakeInput }
export class PhoneGame {
  constructor(ctx, makeInner, opts = {}) {
    this.ctx = ctx; this.game = ctx.game; this.rng = ctx.rng; this.makeInner = makeInner; this.opts = opts;
    this.done = false; this.time = 0;
    this.popups = new Popups(); this.particles = new Particles();
  }

  start(params) {
    const st = this.ctx.state;
    const l = lessonInfo(params.lesson || st.lesson || 2);
    const t = TEACHERS[(l && l.teacher) || 'tatiana'];
    this.teacherId = t ? (l.teacher) : 'tatiana';
    this.short = !!params.short;
    const duration = params.short ? PB.shortDuration : this.opts.duration;
    this.dead = st.stats.battery <= 0;
    this.shell = new PhoneShellLogic(this.rng, {
      suddenTurn: !!(t && t.params.suddenTurn), leavesRoom: !!(t && t.params.leavesRoom),
      mul: st.lessonMul || 1, duration, battery: st.stats.battery, startSuspicion: st.stats.suspicion,
    });
    this.inner = this.makeInner(this.rng, { ...params, duration, state: st, kit: this });
    this.startSusp = st.stats.suspicion;
    if (this.dead) { this.shell.finished = true; this.shell.result = 'dead'; this.done = true; }
  }

  update(dt, input) {
    this.time += dt;
    this.popups.update(dt); this.particles.update(dt);
    if (this.dead) { this.done = true; return; }
    const S = this.shell;
    const auto = this.autoplay;
    const toggle = auto ? this.shellBotFn(S, dt) : input.pressed('back');
    if (!auto && toggle) input.consume('back');
    if (toggle) audio.play(S.hidden ? 'menuSelect' : 'menuBack');
    const wasWarn = S.warning;
    const active = S.update(dt, toggle);
    if (S.warning && !wasWarn) audio.play('menuMove');
    this.ctx.state.stats.suspicion = Math.round(S.suspicion);
    // бот «думает» только когда телефон в руках, иначе его очередь нажатий уходит в пустоту
    const inp = auto ? (active || (S.frozen > 0 && !S.hidden) ? this.inner.bot(dt) : new FakeInput()) : input;
    if (active) this.inner.update(dt, inp);
    else if (S.frozen > 0 && !S.hidden && inp.pressed('confirm') && this.inner.onFrozenPress) this.inner.onFrozenPress();
    if (S.finished || this.inner.finished) this.done = true;
  }

  // Цель по очкам: в короткой игре (25 с «залипнуть» на уроке) — своя, меньше (BALANCE.phoneGames.*.shortTarget).
  get target() { return this.short && this.opts.shortTarget ? this.opts.shortTarget : this.inner.target; }

  get logic() { return this.shell; } // для полоски времени урока (t / duration)

  get shellBotFn() { if (!this._sb) this._sb = shellBot(this.rng); return this._sb; }

  forfeit() { this.dead = true; this.forced = true; return this.end(); }

  end() {
    const S = this.shell;
    const st = this.ctx.state;
    const inner = this.inner;
    if (this.dead) {
      const grade = phoneLessonGrade(this.rng, { ...S, hiddenTime: S.duration, added: 0 });
      return { result: 'lose', deltas: {}, money: 0, grade, summary: this.forced ? 'Срыв: телефон из рук.' : 'Телефон мёртв (0 %). Пришлось слушать урок.' };
    }
    const director = S.result === 'director';
    const ratio = inner.score / this.target;
    const win = !director && ratio >= 1;
    const d = { battery: PB.batteryCost };
    if (win) d.aura = Math.round(PB.auraMin + (PB.auraMax - PB.auraMin) * Math.min(1, (ratio - 1) * 2 + 0.3));
    else if (ratio >= 0.5) d.aura = PB.auraMin;
    st.stats.suspicion = this.startSusp; // подозрение вернём дельтой (видно на экране итога)
    d.suspicion = Math.round(S.suspicion - this.startSusp);
    return {
      result: director ? 'director' : win ? 'win' : 'lose', deltas: d, money: 0,
      grade: director ? BALANCE.director.grade : phoneLessonGrade(this.rng, S),
      extra: { score: inner.score, wrongLike: inner.wrongLike || null },
      summary: `Очки: ${inner.score} из ${this.target}` + (S.hiddenTime > 1 ? ` · прятал ${Math.round(S.hiddenTime)} с` : ''),
    };
  }

  draw(r) {
    const S = this.shell;
    r.rect(0, 0, 480, GAME_H, '#2a2018');
    // парта
    r.rect(0, 150, 480, 84, '#8a5a32');
    r.rect(0, 150, 480, 3, '#a8733f');
    // учитель (слева)
    this.drawTeacher(r, 16, 20);
    // телефон
    const P = PHONE;
    const hidY = S && S.hidden ? 120 : 0;
    const x = P.x, y = P.y + hidY;
    drawPhoneFrame(r, x, y, this.ctx.state.stats.battery, this.time);
    if (!this.dead) {
      r.clip(x + P.sx, y + P.sy, P.sw, P.sh, () => {
        r.ctx.save();
        r.ctx.translate(x + P.sx, y + P.sy);
        this.inner.draw(r, 0, 0, P.sw, P.sh);
        r.ctx.restore();
        if (S.frozen > 0) {
          r.alpha(0.55, () => r.rect(x + P.sx, y + P.sy, P.sw, P.sh, '#202020'));
          const a = this.time * 8;
          for (let i = 0; i < 8; i++) r.alpha(((i + Math.floor(a)) % 8) / 8, () => r.rect(x + 72 + Math.round(Math.cos(i * 0.785) * 10), y + 112 + Math.round(Math.sin(i * 0.785) * 10), 3, 3, '#ffffff'));
          r.text('лагает…', x + 72, y + 130, { align: 'center', color: '#ffffff' });
        }
      });
    } else {
      r.rect(x + P.sx, y + P.sy, P.sw, P.sh, '#000');
      r.text('0 %', x + 72, y + 100, { align: 'center', color: '#ff4a4a', scale: 2 });
      r.text('Телефон мёртв', x + 72, y + 124, { align: 'center', color: '#9a9aa8' });
    }
    drawCrack(r, x, y);
    if (S && S.hidden) {
      r.rect(x - 10, 150, P.w + 20, 84, '#8a5a32');
      r.text('Телефон спрятан (X — достать)', 240, 160, { align: 'center', color: '#ffe14d', shadow: '#000' });
    }
    // правая панель
    const rx = 330;
    r.box(rx, 8, 142, 96, '#4a4668', '#000', 1);
    r.text(this.opts.title || '', rx + 71, 14, { align: 'center', color: '#ffe14d' });
    if (S) {
      r.text('Время ' + clock(S.duration - S.t), rx + 8, 30, { color: '#ffffff' });
      r.text(`Очки: ${this.inner.score} / ${this.target}`, rx + 8, 44, { color: this.inner.score >= this.target ? '#6be36b' : '#ffffff' });
      r.text('Подозрение', rx + 8, 60, { color: '#9a9aa8' });
      r.rect(rx + 8, 72, 126, 6, '#2c2840');
      r.rect(rx + 8, 72, Math.round(126 * S.suspicion / 100), 6, S.suspicion > 70 ? '#ff3a3a' : '#ff9a5a');
      r.text('X — спрятать', rx + 8, 86, { color: '#9a9aa8' });
    }
    r.box(rx, 110, 142, 36, '#4a4668', '#000', 1);
    (this.opts.help || []).forEach((h, i) => r.text(h, rx + 6, 114 + i * 10, { color: '#c8c8d8' }));
    this.particles.draw(r);
    this.popups.draw(r);
    this.game.hud.draw(r, this.ctx.state);
  }

  drawTeacher(r, x, y) {
    const S = this.shell;
    r.box(x, y, 136, 124, '#4a4668', '#1a1620', 1);
    if (!S) return;
    if (S.out) {
      r.rect(x + 40, y + 12, 56, 90, '#5a3a22');
      r.rect(x + 46, y + 18, 44, 80, '#2a1a10');
      r.text('ВЫШЕЛ', x + 68, y + 108, { align: 'center', color: '#6be36b' });
      return;
    }
    const pt = portraitOf(this.teacherId, S.watching ? 'surprised' : 'norm');
    if (S.mode === 'board') {
      // спиной: силуэт
      r.alpha(0.9, () => r.rect(x + 44, y + 22, 48, 60, '#0e0c12'));
      r.rect(x + 52, y + 12, 32, 26, '#0e0c12');
      r.rect(x + 8, y + 86, 120, 14, '#2f4a3a');
      r.text('у доски', x + 68, y + 108, { align: 'center', color: '#6be36b' });
    } else {
      if (pt) r.image(pt, x + 20, y + 10, 96, 96);
      if (S.warning) {
        if (r.blink(0.1)) r.text('!', x + 116, y + 8, { color: '#ff4a4a', scale: 2 });
        r.text('поворачивается!', x + 68, y + 108, { align: 'center', color: '#ffb84a' });
      } else r.text('СМОТРИТ!', x + 68, y + 108, { align: 'center', color: r.blink(0.2) ? '#ff4a4a' : '#ffffff' });
    }
  }
}
