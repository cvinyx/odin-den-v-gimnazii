// Логика «Списывания» (раздел 14, пункт 1) без отрисовки — для игры, тестов и бота баланса.
// Учитель поворачивается по таймеру и случайно; за 0,4 с до поворота — заметный признак.
// Держишь Z — подсматриваешь, 1,5 с = один ответ (макс. 10). Конус на Роме во время подсматривания —
// подозрение +30/с. 60 с. Оценка = 1 + ответы.
// V2-4: ИС-2 — Z, зажатая ещё до начала (из меню), не считается, пока её не отпустят (requireRelease);
// ИС-3 — если Рому не ловят 10 с подряд, подозрение падает; М-8 — учитель иногда идёт по рядам (walk).
import { BALANCE } from '../../data/balance.js';

const DEG = Math.PI / 180;

export function angleTo(from, to) { return Math.atan2(to.y - from.y, to.x - from.x) / DEG; }
export function angleDiff(a, b) { let d = ((a - b) % 360 + 540) % 360 - 180; return Math.abs(d); }

export class CheatLogic {
  // p: { teacher: { wide, lookTime, pRoma, randomTurnPerSec }, mul, speedMul, hungerSlow, startSuspicion,
  //      roma: {x,y}, teacherPos: {x,y}, targets: [{x,y}], duration, quiz }
  constructor(rng, p) {
    this.rng = rng;
    this.p = p;
    const C = BALANCE.cheat, M = BALANCE.minigames.cheat;
    const t = p.teacher || {};
    this.cfg = {
      lookTime: t.lookTime || C.lookTime,
      randomTurn: t.randomTurnPerSec ?? C.randomTurnPerSec,
      coneHalf: t.wide ? C.coneHalfWide : C.coneHalf,
      coneLen: C.coneLength,
      pRoma: t.pRoma ?? C.pRoma,
      turnSpeed: C.turnSpeed,
      warn: M.warnTime,
      perAnswer: M.secondsPerAnswer,
      suspPerSec: M.suspicionPerSecond,
      maxAnswers: M.maxAnswers,
      decay: C.progressDecay,
      spotBonus: C.spotBonus,
    };
    this.duration = p.duration || M.duration;
    this.t = 0;
    this.answers = 0;
    this.progress = 0;
    this.suspicion = p.startSuspicion || 0;
    this.suspicionStart = this.suspicion;
    this.caught = 0; // секунд под взглядом во время подсматривания
    this.tpos = { ...p.teacherPos };
    this.armed = !p.requireRelease;
    this.calmT = 0;
    this.angle = angleTo(this.tpos, p.roma);
    this.mode = 'look';
    this.timer = this.rng.float(this.cfg.lookTime[0], this.cfg.lookTime[1]);
    this.target = this.angle;
    this.peeking = false;
    this.finished = false;
    this.result = null;
  }

  get speed() {
    let s = this.p.speedMul || 1;
    if (this.p.hungerSlow) s *= BALANCE.hunger.slowFactor;
    return s;
  }

  pickTarget() {
    const p = this.p;
    if (this.rng.chance(this.cfg.pRoma)) return angleTo(this.tpos, p.roma) + this.rng.float(-8, 8);
    const t = this.rng.pick(p.targets);
    return angleTo(this.tpos, t) + this.rng.float(-6, 6);
  }

  // Видит ли учитель Рому прямо сейчас.
  get sees() {
    const p = this.p;
    const d = Math.hypot(p.roma.x - this.tpos.x, p.roma.y - this.tpos.y);
    return d <= this.cfg.coneLen && angleDiff(this.angle, angleTo(this.tpos, p.roma)) <= this.cfg.coneHalf;
  }

  // М-8: учитель идёт по ряду туда и обратно; смотрит туда, куда идёт.
  get walking() {
    const w = this.p.walk;
    return !!w && this.t >= w.start && this.t < w.start + w.dur;
  }

  updateWalk() {
    const w = this.p.walk;
    if (!w) return;
    if (!this.walking) {
      if (this.wasWalking) { this.tpos = { ...this.p.teacherPos }; this.wasWalking = false; this.mode = 'look'; this.timer = 0.5; }
      return;
    }
    this.wasWalking = true;
    const k = (this.t - w.start) / w.dur; // 0..1: вниз до конца ряда и обратно
    const leg = k < 0.5 ? k * 2 : (1 - k) * 2;
    const a = w.path[0], b = w.path[1];
    this.tpos = { x: a.x + (b.x - a.x) * leg, y: a.y + (b.y - a.y) * leg };
    this.angle = k < 0.5 ? 90 + Math.sin(this.t * 2) * 50 : -90 + Math.sin(this.t * 2) * 50;
    this.mode = 'walk';
  }

  update(dt, peek) {
    if (this.finished) return;
    this.t += dt;
    const c = this.cfg;
    if (!this.armed) { if (!peek) this.armed = true; else peek = false; }
    this.updateWalk();
    if (this.mode === 'walk') { /* направление задаёт updateWalk */ } else if (this.mode === 'look') {
      this.timer -= dt;
      if (this.rng.chance(c.randomTurn * dt)) this.timer = 0;
      if (this.timer <= 0) { this.target = this.pickTarget(); this.mode = 'warn'; this.timer = c.warn; this.spotted = false; }
    } else if (this.mode === 'warn') {
      this.timer -= dt;
      if (this.timer <= 0) this.mode = 'turn';
    } else if (this.mode === 'turn') {
      const diff = ((this.target - this.angle) % 360 + 540) % 360 - 180;
      const step = c.turnSpeed * dt;
      if (Math.abs(diff) <= step) { this.angle = this.target; this.mode = 'look'; this.timer = this.rng.float(c.lookTime[0], c.lookTime[1]); }
      else this.angle += Math.sign(diff) * step;
    }
    this.peeking = !!peek && this.answers < c.maxAnswers;
    if (this.peeking) {
      this.progress += (dt * this.speed) / c.perAnswer;
      if (this.progress >= 1) { this.progress = 0; this.answers++; }
      if (this.sees) {
        // «Заметила!» — разовый скачок за каждый взгляд, потом +30/с, пока Рома подсматривает
        const bump = this.spotted ? 0 : c.spotBonus;
        this.spotted = true;
        this.suspicion = Math.min(100, this.suspicion + (bump + c.suspPerSec * dt) * (this.p.mul || 1));
        this.caught += dt;
        this.calmT = 0;
      }
    } else {
      this.progress = Math.max(0, this.progress - c.decay * dt);
    }
    // ИС-3: не попадался calmAfter секунд подряд — подозрение потихоньку падает
    if (!(this.peeking && this.sees)) {
      this.calmT += dt;
      if (this.calmT >= BALANCE.cheat.calmAfter) this.suspicion = Math.max(0, this.suspicion - BALANCE.cheat.calmRate * dt);
    }
    if (this.suspicion >= 100) { this.finished = true; this.result = 'director'; }
    else if (this.t >= this.duration || this.answers >= c.maxAnswers) { this.finished = true; this.result = 'done'; }
  }

  get grade() { return Math.min(10, 1 + this.answers); }
}

// Стратегии бота для проверки баланса (и для скрипта-бота в браузере).
// cautious — подсматривает только когда учитель смотрит в сторону, бросает при признаке поворота;
// greedy — подсматривает всегда, отводит глаза только когда уже попался.
export function makeBot(kind, reaction = kind === 'greedy' ? 0.45 : 0.25) {
  let seenFor = 0, safeFor = 0, warnFor = 0;
  return (L, dt) => {
    const sees = L.sees;
    seenFor = sees ? seenFor + dt : 0;
    safeFor = !sees && L.mode === 'look' ? safeFor + dt : 0;
    warnFor = L.mode !== 'look' ? warnFor + dt : 0;
    if (kind === 'greedy') return seenFor < reaction;
    // осторожный: только в спокойное окно, с запасом реакции
    if (L.mode !== 'look') return warnFor < reaction && !sees && L.peeking;
    return safeFor > reaction;
  };
}
