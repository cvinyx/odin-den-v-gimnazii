// Логика «Эль-Класико» без отрисовки (работает и в node-тестах): мяч, 5 на 5, ИИ полевых и вратарей,
// судья, фолы, карточки, диарея Смайла, берсерк Игоря, перерыв и замены (раздел 15).
// Рома управляется вводом (romaInput) или ИИ (aiRoma — режим «ИИ против ИИ»).
import { BALANCE } from '../../data/balance.js';
import { CHARACTERS } from '../../data/characters.js';
import { LINEUPS } from '../../data/lessons.js';
import { FIELD, SIDE, ownGoalX, oppGoalX, other, clampField } from './field.js';

const B = BALANCE.football;
const PH = B.physics;

// Позиции полевых (доля длины поля от своих ворот, доля ширины): защита и атака.
const HOMES = [
  { def: [0.2, 0.3], att: [0.42, 0.28] },
  { def: [0.2, 0.7], att: [0.42, 0.72] },
  { def: [0.4, 0.4], att: [0.7, 0.35] },
  { def: [0.4, 0.62], att: [0.72, 0.66] },
];

const hyp = Math.hypot;
function norm(x, y) { const d = hyp(x, y) || 1; return [x / d, y / d]; }

export class Player {
  constructor(id, team, keeper, slot) {
    this.id = id; this.team = team; this.keeper = keeper; this.slot = slot;
    this.x = 0; this.y = 0; this.vx = 0; this.vy = 0;
    this.dir = [SIDE[team], 0];
    this.tx = 0; this.ty = 0;          // куда бежит
    this.think = 0; this.cd = 0; this.stun = 0; this.noPick = 0;
    this.yellow = 0; this.goals = 0;
    this.sprint = false; this.berserk = 0;
    this.mod = { speed: 0, skill: 0 }; // перерыв
    this.anim = 0; this.moving = false;
    this.out = null;                   // 'run' — убегает с поля (диарея)
    this.stuckT = 0; this.lastX = 0; this.lastY = 0;
  }
  get stats() { return B.players[this.id] || { speed: 5, skill: 4 }; }
  get skill() { return Math.max(1, Math.min(10, this.stats.skill + this.mod.skill)); }
  get reaction() { return B.keepers[this.id] ?? 3; }
}

export class MatchLogic {
  // p: { aiRoma, hungry (голод > 70), staminaMax (0.6–1), berserkStart (Игоря забайтили сегодня), diarrhea (true/false/null — по шансу) }
  constructor(rng, p = {}) {
    this.rng = rng;
    this.p = p;
    this.half = 1;
    this.t = 0;                 // секунды текущего тайма
    this.total = 0;             // секунды матча
    this.score = { inyaz: 0, fizmat: 0 };
    this.events = [];
    this.stats = { fouls: 0, yellows: 0, saves: 0, shots: { inyaz: 0, fizmat: 0 }, kolyaConceded: 0 };
    this.bench = { fizmat: [...LINEUPS.fizmat.bench], inyaz: [...LINEUPS.inyaz.bench] };
    this.players = [];
    const add = (team, id, keeper, slot) => this.players.push(new Player(id, team, keeper, slot));
    // роли: двое сильнейших (скорость + навык) — в нападении (места 2–3), остальные — в защите
    const roles = (ids) => [...ids].sort((a, b) => sum(a) - sum(b));
    const sum = (id) => (B.players[id].speed + B.players[id].skill) * 100 + ids0.indexOf(id);
    let ids0 = LINEUPS.fizmat.field;
    add('fizmat', LINEUPS.fizmat.keeper, true, -1);
    roles(ids0).forEach((id, i) => add('fizmat', id, false, i));
    ids0 = LINEUPS.inyaz.field;
    add('inyaz', LINEUPS.inyaz.keeper, true, -1);
    roles(ids0).forEach((id, i) => add('inyaz', id, false, i));
    this.roma = this.players.find((q) => q.id === 'roma');
    this.ball = { x: FIELD.cx, y: FIELD.cy, vx: 0, vy: 0, owner: null, last: null, shotBy: null, beatKeeper: false };
    this.stamina = p.staminaMax ?? 1;
    this.staminaMax = p.staminaMax ?? 1;
    this.accMul = p.hungry ? BALANCE.hunger.slowFactor : 1;
    this.diarrheaAt = (p.diarrhea ?? rng.chance(B.diarrheaChance)) ? rng.float(B.diarrheaAt[0], B.diarrheaAt[1]) : null;
    this.diarrheaDone = false;
    this.refT = rng.float(B.refLineEvery[0], B.refLineEvery[1]);
    this.ref = { x: FIELD.cx, y: FIELD.bottom - 1, dir: 'up', moving: false }; // бегает вдоль нижней бровки
    this.state = 'kickoff';
    this.stateT = 1.2;
    this.lineupErrors = [];
    this.kickoff('inyaz');
    if (p.berserkStart) this.startBerserk();
  }

  get onField() { return this.players.filter((q) => !q.out); }
  team(t) { return this.onField.filter((q) => q.team === t); }
  keeperOf(t) { return this.onField.find((q) => q.team === t && q.keeper); }
  emit(e) { this.events.push(e); }

  // ---------- Расстановка ----------
  kickoff(team) {
    for (const q of this.onField) {
      const s = SIDE[q.team];
      if (q.keeper) { q.x = ownGoalX(q.team) + s * 8; q.y = FIELD.cy; } else {
        const h = HOMES[q.slot].def;
        q.x = ownGoalX(q.team) + s * h[0] * FIELD.w * 0.9; q.y = FIELD.top + h[1] * FIELD.h;
      }
      q.vx = q.vy = 0; q.dir = [s, 0]; q.stun = 0;
    }
    // разыгрывает нападающий: подходит к центру
    const f = this.team(team).filter((q) => !q.keeper).sort((a, b) => b.slot - a.slot)[0];
    f.x = FIELD.cx - SIDE[team] * 7; f.y = FIELD.cy;
    Object.assign(this.ball, { x: FIELD.cx, y: FIELD.cy, vx: 0, vy: 0, owner: f, last: team, shotBy: null, beatKeeper: false });
    this.state = 'kickoff'; this.stateT = 1.2;
  }

  // ---------- Главный шаг ----------
  // input — для Ромы: { ax, ay, sprint, pass (нажато), shoot (отпущено, power 0–1), tackle (нажато) }
  update(dt, input = null) {
    if (this.state === 'halftime' || this.state === 'end') return;
    this.total += dt; this.t += dt;
    if (this.state === 'kickoff' || this.state === 'goal' || this.state === 'freekick' || this.state === 'diarrhea') {
      this.stateT -= dt;
      this.updateRunners(dt);
      if (this.state === 'goal' && this.stateT <= 0) this.kickoff(this.goalAgainst);
      else if (this.state === 'diarrhea' && this.stateT <= 0) this.finishDiarrhea();
      else if (this.stateT <= 0) { this.state = 'play'; this.emit({ type: 'whistle' }); }
      this.checkTime();
      return;
    }
    // события по времени
    if (this.diarrheaAt != null && !this.diarrheaDone && this.total >= this.diarrheaAt && this.ball.owner && !this.ball.owner.keeper) return this.startDiarrhea();
    for (const q of this.onField) {
      q.cd -= dt; q.stun = Math.max(0, q.stun - dt); q.noPick = Math.max(0, q.noPick - dt);
      if (q.berserk > 0) { q.berserk -= dt; if (q.berserk <= 0) this.emit({ type: 'berserk_end' }); }
    }
    // решения и движение
    for (const q of this.onField) {
      if (q === this.roma && !this.p.aiRoma && input) this.controlRoma(q, dt, input);
      else if (q.keeper) this.keeperAI(q, dt);
      else this.fieldAI(q, dt);
    }
    this.movePlayers(dt);
    this.updateBall(dt);
    this.updateRef(dt);
    this.refTalk(dt);
    this.checkLineups();
    this.checkTime();
  }

  checkTime() {
    if (this.t < B.halfSeconds) return;
    if (this.state === 'goal' && this.stateT > 0) return; // дать порадоваться голу
    if (this.state === 'diarrhea') return;                // сначала замена вратаря (иначе у «Физмата» 4 игрока)
    if (this.half === 1) { this.state = 'halftime'; this.emit({ type: 'halftime' }); }
    else { this.state = 'end'; this.emit({ type: 'end' }); }
  }

  // Второй тайм: эффект выбора в перерыве и замены (Коля вместо Вадима, Гуза вместо Матыча).
  secondHalf(choice) {
    const H = B.halftime;
    const P = (id) => this.players.find((q) => q.id === id && !q.out);
    if (choice === 'barca' && P('denis')) P('denis').mod.skill += H.barcaDenisSkill;
    if (choice === 'real') { if (P('shurpo')) P('shurpo').mod.speed += H.realShurpoSpeed; if (P('denis')) P('denis').mod.skill += H.realDenisSkill; }
    if (choice === 'igor') this.startBerserk();
    this.substitute('fizmat', 'vadim', this.bench.fizmat.includes('bochko') ? 'bochko' : 'zakha');
    this.substitute('inyaz', 'matych', 'guza');
    this.half = 2; this.t = 0;
    this.kickoff('fizmat');
  }

  substitute(team, outId, inId) {
    const o = this.players.find((q) => q.id === outId && !q.out);
    if (!o || !this.bench[team].includes(inId)) return;
    const n = new Player(inId, team, o.keeper, o.slot);
    n.x = o.x; n.y = o.y;
    o.out = 'bench';
    this.bench[team] = this.bench[team].filter((x) => x !== inId);
    this.bench[team].push(outId);
    this.players.push(n);
    if (this.ball.owner === o) this.ball.owner = null;
    this.emit({ type: 'sub', team, out: outId, in: inId });
  }

  startBerserk() {
    const ig = this.players.find((q) => q.id === 'igor' && !q.out);
    if (!ig) return;
    ig.berserk = B.berserk.seconds;
    this.emit({ type: 'berserk' });
  }

  // ---------- Диарея Смайла ----------
  startDiarrhea() {
    this.diarrheaDone = true;
    const sm = this.players.find((q) => q.id === 'smile' && !q.out);
    if (!sm) return;
    sm.out = 'run'; sm.tx = FIELD.right - 30; sm.ty = FIELD.top - 30;
    this.runner = sm;
    this.ball.owner = null;
    this.state = 'diarrhea'; this.stateT = 3;
    this.emit({ type: 'diarrhea' });
  }
  finishDiarrhea() {
    // в ворота — Коля; если Коля уже на поле (2-й тайм) — Заха
    const sm = this.runner;
    const inId = this.bench.fizmat.includes('bochko') ? 'bochko' : 'zakha';
    const n = new Player(inId, 'fizmat', true, -1);
    n.x = FIELD.right - 8; n.y = FIELD.cy;
    this.bench.fizmat = this.bench.fizmat.filter((x) => x !== inId);
    this.players.push(n);
    if (sm) { this.players.splice(this.players.indexOf(sm), 1); }
    this.runner = null;
    this.smileGone = true;
    this.emit({ type: 'keeper_in', id: inId });
    // мяч — «Физмату» от ворот
    Object.assign(this.ball, { x: n.x - 10, y: n.y, vx: 0, vy: 0, owner: n, last: 'fizmat' });
    n.hold = B.keeper.hold;
    this.state = 'freekick'; this.stateT = 1;
  }

  updateRunners(dt) {
    const r = this.runner;
    if (r) {
      const [dx, dy] = norm(r.tx - r.x, r.ty - r.y);
      r.x += dx * 110 * dt; r.y += dy * 110 * dt; r.dir = [dx, dy]; r.moving = true; r.anim += dt;
    }
  }

  // ---------- Управление Ромой ----------
  controlRoma(q, dt, inp) {
    const sp = this.speedOf(q);
    let { ax, ay } = inp;
    const want = (ax || ay) ? 1 : 0;
    if (want) { const n = hyp(ax, ay); ax /= n; ay /= n; q.dir = [ax, ay]; }
    q.sprint = !!inp.sprint && want && this.stamina > 0.02;
    if (q.sprint) this.stamina = Math.max(0, this.stamina - B.stamina.drain * dt);
    else this.stamina = Math.min(this.staminaMax, this.stamina + B.stamina.regen * dt);
    const v = sp * (q.sprint ? B.move.sprint : 1);
    q.tx = q.x + ax * v; q.ty = q.y + ay * v; q.direct = [ax * v * want, ay * v * want];
    const own = this.ball.owner === q;
    if (own && inp.pass) this.passBest(q, q.dir);
    else if (own && inp.shoot != null) this.shoot(q, inp.shoot, q.dir);
    else if (!own && inp.tackle) this.tackle(q);
  }

  speedOf(q) {
    let s = B.move.base + (q.stats.speed + q.mod.speed) * B.move.perSpeed;
    if (q.berserk > 0) s *= B.berserk.speed;
    if (this.ball.owner === q && !q.keeper) s *= B.move.dribble; // с мячом медленнее
    if (q.team === 'inyaz' && this.p.hungry) s *= BALANCE.hunger.slowFactor;
    return s;
  }

  // ---------- ИИ полевого ----------
  fieldAI(q, dt) {
    const b = this.ball;
    const s = SIDE[q.team];
    q.think -= dt;
    q.direct = null;
    if (q.stun > 0) { q.tx = q.x; q.ty = q.y; return; }
    if (b.owner === q) {
      // с мячом: «атака»
      if (q.think <= 0) {
        q.think = this.rng.float(B.ai.decide[0], B.ai.decide[1]);
        const gx = oppGoalX(q.team), d = hyp(gx - q.x, FIELD.cy - q.y);
        const press = this.nearestOpp(q);
        const pressed = press && hyp(press.x - q.x, press.y - q.y) < B.ai.pressDist;
        // слабые теряют мяч сами (Матыч, Коля)
        if (this.rng.chance(Math.max(0, 5 - q.skill) * B.ai.fumblePerSec * (B.ai.decide[0] + B.ai.decide[1]))) {
          b.owner = null; b.vx = this.rng.float(-40, 40); b.vy = this.rng.float(-40, 40); q.noPick = 0.4;
          this.emit({ type: 'fumble', id: q.id });
          return;
        }
        const shootP = d < B.ai.shootAlways ? 1 : d < B.ai.shootRange ? B.ai.shootChance[0] + q.skill * B.ai.shootChance[1] + (q.berserk > 0 ? 0.1 : 0) : 0;
        if (shootP && this.rng.chance(shootP)) return this.shoot(q, this.rng.float(0.55, 1), [s, 0], true);
        if (pressed && this.rng.chance(0.45 + q.skill * 0.045)) { if (this.passBest(q, [s, 0], true)) return; }
        if (!pressed && this.rng.chance(0.07 + q.skill * 0.01)) { if (this.passBest(q, [s, 0], true, true)) return; }
      }
      // ведение к воротам, огибая ближайшего соперника
      const gx = oppGoalX(q.team);
      let [dx, dy] = norm(gx - q.x, FIELD.cy - q.y + (q.slot % 2 ? 20 : -20) * (Math.abs(gx - q.x) > 120 ? 1 : 0));
      const o = this.nearestOpp(q);
      if (o) {
        const od = hyp(o.x - q.x, o.y - q.y);
        if (od < 30 && (o.x - q.x) * s > -4) { const side = o.y > q.y ? -1 : 1; dy += side * 0.9; [dx, dy] = norm(dx, dy); }
      }
      q.tx = q.x + dx * 40; q.ty = q.y + dy * 40;
      return;
    }
    // без мяча
    const chaser = this.chaserOf(q.team);
    if (chaser === q) {
      // «борьба за мяч»: к мячу (с упреждением), отбор у владельца
      const o = b.owner;
      if (o && o.team !== q.team) {
        const gx = ownGoalX(q.team);
        const [gdx, gdy] = norm(gx - o.x, FIELD.cy - o.y);
        q.tx = o.x + gdx * 6; q.ty = o.y + gdy * 6; // заходить со стороны своих ворот (спереди)
        const dist = hyp(o.x - q.x, o.y - q.y);
        if (dist < B.ai.tackleDist && q.cd <= 0 && q.think <= 0) {
          q.think = this.rng.float(0.2, 0.45);
          // сзади разумный ИИ не лезет (это фол) — кроме Игоря в берсерке и слабых «на авось»
          const [ux, uy] = norm(q.x - o.x, q.y - o.y);
          const behind = ux * o.dir[0] + uy * o.dir[1] < -0.45;
          const careless = q.berserk > 0 || this.rng.chance(B.ai.carelessTackle * (10 - q.skill) / 10);
          if ((!behind || careless) && this.rng.chance(0.35 + q.skill * 0.04 + (q.berserk > 0 ? 0.4 : 0))) this.tackle(q);
        }
      } else { q.tx = b.x + b.vx * 0.15; q.ty = b.y + b.vy * 0.15; }
      return;
    }
    // «позиция» (атака или защита): по своей роли, со сдвигом за мячом
    const attacking = b.owner ? b.owner.team === q.team : b.last === q.team;
    // подстраховка: второй ближайший встаёт между мячом и своими воротами, когда мяч на нашей половине
    if (!attacking && b.owner && (b.x - FIELD.cx) * SIDE[q.team] < 0 && this.coverOf(q.team) === q) {
      const gx = ownGoalX(q.team);
      const [ux, uy] = norm(gx - b.x, FIELD.cy - b.y);
      [q.tx, q.ty] = clampField(b.x + ux * B.ai.coverDist, b.y + uy * B.ai.coverDist, 10);
      return;
    }
    const h = HOMES[q.slot][attacking ? 'att' : 'def'];
    const baseX = ownGoalX(q.team) + s * h[0] * FIELD.w;
    const ballShift = (b.x - FIELD.cx) * 0.35;
    let tx = baseX + ballShift, ty = FIELD.top + h[1] * FIELD.h + (b.y - FIELD.cy) * 0.25;
    // разойтись с партнёрами (не сбиваться в кучу)
    for (const m of this.team(q.team)) {
      if (m === q || m.keeper) continue;
      const d = hyp(m.x - tx, m.y - ty);
      if (d < 34) { const [ux, uy] = norm(tx - m.x, ty - m.y); tx += ux * (34 - d) * 0.6; ty += uy * (34 - d) * 0.6; }
    }
    [q.tx, q.ty] = clampField(tx, ty, 12);
  }

  chaserOf(team) {
    const b = this.ball;
    let best = null, bd = 1e9;
    for (const q of this.team(team)) {
      if (q.keeper || q.stun > 0) continue;
      if (q === this.roma && !this.p.aiRoma) continue; // Рома решает сам
      const d = hyp(q.x - b.x, q.y - b.y);
      if (d < bd) { bd = d; best = q; }
    }
    return best;
  }

  // второй по близости к мячу полевой (не преследующий)
  coverOf(team) {
    const b = this.ball, ch = this.chaserOf(team);
    let best = null, bd = 1e9;
    for (const q of this.team(team)) {
      if (q.keeper || q === ch || (q === this.roma && !this.p.aiRoma)) continue;
      const d = hyp(q.x - b.x, q.y - b.y);
      if (d < bd) { bd = d; best = q; }
    }
    return best;
  }

  nearestOpp(q) {
    let best = null, bd = 1e9;
    for (const o of this.team(other(q.team))) { const d = hyp(o.x - q.x, o.y - q.y); if (d < bd) { bd = d; best = o; } }
    return best;
  }

  // ---------- Вратарь ----------
  keeperAI(q, dt) {
    const b = this.ball;
    const s = SIDE[q.team];
    const gx = ownGoalX(q.team);
    const K = B.keeper;
    if (b.owner === q) {
      q.hold = (q.hold ?? K.hold) - dt;
      q.tx = q.x; q.ty = q.y;
      if (q.hold <= 0) { q.hold = null; if (!this.passBest(q, [s, 0], true, true)) this.shoot(q, 0.6, [s, this.rng.float(-0.5, 0.5)], false); }
      return;
    }
    // реакция: вратарь «видит» мяч с задержкой; на удар — бросок в точку, куда летит мяч
    q.seenY = q.seenY ?? FIELD.cy;
    q.seenY += (b.y - q.seenY) * Math.min(1, dt * q.reaction * 1.3);
    let ty = FIELD.cy + (q.seenY - FIELD.cy) * 0.8;
    q.dive = false;
    const incoming = !b.owner && b.vx * -s > 60;
    if (incoming) {
      q.reactT = (q.reactT ?? 0) + dt;
      const tt = (b.x - gx) / -b.vx;
      if (tt > 0 && tt < 1.6 && q.reactT >= K.delay * (11 - q.reaction)) { ty = b.y + b.vy * tt; q.dive = true; }
    } else q.reactT = 0;
    q.tx = gx + s * 7; q.ty = Math.max(FIELD.goalTop + 2, Math.min(FIELD.goalBottom - 2, ty));
    // выйти на медленный мяч у ворот
    const near = Math.abs(b.x - gx) < 34 && !b.owner && hyp(b.vx, b.vy) < 60;
    if (near) { q.tx = b.x; q.ty = b.y; }
    // сейв
    const reach = K.reach + q.reaction * K.perReach;
    const d = hyp(b.x - q.x, b.y - q.y);
    const toGoal = b.vx * -s > 0;
    if (!b.owner && d < reach && !b.beatKeeper && q.noPick <= 0) {
      const sp = hyp(b.vx, b.vy);
      if (!toGoal || sp < 70) return this.grab(q);
      const p = K.save + q.reaction * K.perSave - Math.max(0, sp - 150) * K.fastPenalty;
      if (this.rng.chance(p)) { this.stats.saves++; this.emit({ type: 'save', id: q.id }); this.grab(q); }
      else b.beatKeeper = true;
    }
  }

  grab(q) {
    const b = this.ball;
    b.owner = q; b.vx = b.vy = 0; b.last = q.team; b.beatKeeper = false; b.shotBy = null;
    q.hold = B.keeper.hold;
  }

  // ---------- Действия ----------
  passBest(q, dir, ai = false, forwardOnly = false) {
    const s = SIDE[q.team];
    let best = null, bv = -1e9;
    for (const m of this.team(q.team)) {
      if (m === q || m.keeper) continue;
      const dx = m.x - q.x, dy = m.y - q.y, d = hyp(dx, dy);
      if (d < 18 || d > 230) continue;
      const opp = this.team(other(q.team));
      // открытость: насколько далеко ближайший соперник от линии паса и от получателя
      let open = 99;
      for (const o of opp) {
        const t = Math.max(0, Math.min(1, ((o.x - q.x) * dx + (o.y - q.y) * dy) / (d * d)));
        open = Math.min(open, hyp(q.x + dx * t - o.x, q.y + dy * t - o.y));
      }
      if (ai && open < 9) continue;
      const fwd = dx * s;
      if (forwardOnly && fwd < 10) continue;
      const v = ai ? fwd * 0.5 + Math.min(open, 40) * 1.5 - d * 0.15 : (dx * dir[0] + dy * dir[1]) / d * 100 - d * 0.1;
      if (v > bv) { bv = v; best = m; }
    }
    if (!best) return false;
    const b = this.ball;
    const lead = 0.25;
    const tx = best.x + best.vx * lead, ty = best.y + best.vy * lead;
    const d = hyp(tx - q.x, ty - q.y);
    const err = (10 - q.skill) * B.ai.passError / this.acc(q) * this.rng.float(-1, 1);
    const a = Math.atan2(ty - q.y, tx - q.x) + err;
    const sp = Math.max(PH.passSpeed[0], Math.min(PH.passSpeed[1], 70 + d * 1.6));
    this.kick(q, Math.cos(a) * sp, Math.sin(a) * sp);
    this.emit({ type: 'pass', id: q.id, to: best.id });
    return true;
  }

  acc(q) { return q.team === 'inyaz' ? this.accMul : 1; }

  // Удар: power 0–1. aim — у ИИ целится в створ, у Ромы — по направлению (с подсказкой к воротам).
  shoot(q, power, dir, aiAim = false) {
    const s = SIDE[q.team];
    const gx = oppGoalX(q.team);
    let a;
    if (aiAim || q.keeper) {
      const ty = this.rng.float(FIELD.goalTop + 6, FIELD.goalBottom - 6);
      a = Math.atan2(ty - q.y, gx - q.x);
    } else {
      const [ux, uy] = norm(dir[0], dir[1]);
      const [gx2, gy2] = norm(gx - q.x, FIELD.cy - q.y);
      const toward = ux * gx2 + uy * gy2;
      // если смотрит примерно на ворота — немного доворачиваем
      const k = toward > 0.5 ? 0.45 : 0;
      a = Math.atan2(uy * (1 - k) + gy2 * k, ux * (1 - k) + gx2 * k);
    }
    const err = (10.5 - q.skill) * B.ai.shotError / this.acc(q) * this.rng.float(-1, 1);
    a += err;
    let sp = PH.shotSpeed[0] + (PH.shotSpeed[1] - PH.shotSpeed[0]) * Math.max(0, Math.min(1, power));
    if (q.berserk > 0) sp *= 1.15;
    this.kick(q, Math.cos(a) * sp, Math.sin(a) * sp);
    const b = this.ball;
    b.shotBy = q.keeper ? null : q; b.beatKeeper = false;
    if (!q.keeper) this.stats.shots[q.team]++;
    this.emit({ type: 'shot', id: q.id, power });
  }

  kick(q, vx, vy) {
    const b = this.ball;
    b.owner = null; b.vx = vx; b.vy = vy; b.last = q.team; b.shotBy = null;
    q.noPick = 0.3; q.hold = null;
    this.emit({ type: 'kick' });
  }

  tackle(q) {
    const b = this.ball, o = b.owner;
    q.cd = B.ai.tackleCd;
    this.emit({ type: 'tackle', id: q.id });
    if (!o || o.team === q.team || o.keeper) return;
    const dist = hyp(o.x - q.x, o.y - q.y);
    if (dist > B.ai.tackleDist + 2) return;
    const T = B.tackle;
    // сзади: подкат со стороны спины владельца
    const [ux, uy] = norm(q.x - o.x, q.y - o.y);
    const behind = ux * o.dir[0] + uy * o.dir[1] < -0.45;
    const foulP = behind ? T.behindFoul : q.berserk > 0 ? T.berserkFoul : 0.04;
    if (this.rng.chance(foulP)) return this.foul(q, o);
    if (this.rng.chance(T.base + (q.skill - o.skill) * T.perSkill)) {
      b.owner = q; b.last = q.team; o.stun = T.stun * 0.6; o.noPick = 0.5;
      this.emit({ type: 'steal', id: q.id, from: o.id });
    } else { q.stun = T.stun; this.emit({ type: 'miss_tackle', id: q.id }); }
  }

  foul(q, victim) {
    this.stats.fouls++;
    this.emit({ type: 'foul', id: q.id, victim: victim.id });
    if (this.rng.chance(B.yellowChance + (q.berserk > 0 ? 0.2 : 0))) { q.yellow++; this.stats.yellows++; this.emit({ type: 'yellow', id: q.id }); }
    // штрафной: мяч у пострадавшего, соперники отходят
    const b = this.ball;
    victim.stun = 0;
    Object.assign(b, { owner: victim, vx: 0, vy: 0, last: victim.team, shotBy: null });
    for (const o of this.team(q.team)) {
      if (o.keeper) continue;
      const d = hyp(o.x - victim.x, o.y - victim.y);
      if (d < 30) { const [ux, uy] = norm(o.x - victim.x || 1, o.y - victim.y); [o.x, o.y] = clampField(victim.x + ux * 30, victim.y + uy * 30, 8); }
    }
    q.stun = 0.8;
    this.state = 'freekick'; this.stateT = 1.1;
  }

  // ---------- Движение и столкновения ----------
  movePlayers(dt) {
    const R = PH.playerR;
    for (const q of this.onField) {
      let vx, vy;
      if (q.direct) [vx, vy] = q.direct;
      else {
        const sp = q.keeper ? (B.keeper.baseSpeed + q.reaction * B.keeper.perReaction) * (q.dive ? B.keeper.dive : 1) : this.speedOf(q);
        const dx = q.tx - q.x, dy = q.ty - q.y, d = hyp(dx, dy);
        const v = d < 2 ? 0 : Math.min(sp, d * 6);
        vx = d ? dx / d * v : 0; vy = d ? dy / d * v : 0;
      }
      if (q.stun > 0) { vx *= 0.2; vy *= 0.2; }
      const k = Math.min(1, dt * B.move.accel);
      q.vx += (vx - q.vx) * k; q.vy += (vy - q.vy) * k;
      q.x += q.vx * dt; q.y += q.vy * dt;
      const sp2 = hyp(q.vx, q.vy);
      q.moving = sp2 > 8;
      if (q.moving) { q.anim += dt * sp2 / 40; if (q !== this.roma || this.p.aiRoma || !q.direct || hyp(...q.direct) > 0) q.dir = [q.vx / sp2, q.vy / sp2]; }
      // вратарь может стоять в линии ворот, полевые — внутри стен
      const m = q.keeper ? 4 : 5;
      [q.x, q.y] = clampField(q.x, q.y, m);
      // застрял (упёрся): шаг в сторону
      if (hyp(q.x - q.lastX, q.y - q.lastY) < 0.3 && hyp(q.tx - q.x, q.ty - q.y) > 12 && !q.direct) q.stuckT += dt; else q.stuckT = 0;
      if (q.stuckT > 1) { q.x += this.rng.float(-6, 6); q.y += this.rng.float(-6, 6); [q.x, q.y] = clampField(q.x, q.y, m); q.stuckT = 0; }
      q.lastX = q.x; q.lastY = q.y;
    }
    // игроки не проходят сквозь друг друга
    const list = this.onField;
    for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
      const a = list[i], c = list[j];
      const dx = c.x - a.x, dy = c.y - a.y, d = hyp(dx, dy);
      if (d < R * 2 && d > 0.001) {
        const push = (R * 2 - d) / 2, ux = dx / d, uy = dy / d;
        a.x -= ux * push; a.y -= uy * push; c.x += ux * push; c.y += uy * push;
        [a.x, a.y] = clampField(a.x, a.y, a.keeper ? 4 : 5); [c.x, c.y] = clampField(c.x, c.y, c.keeper ? 4 : 5);
      } else if (d <= 0.001) { c.x += 1; }
    }
  }

  // ---------- Мяч ----------
  updateBall(dt) {
    const b = this.ball;
    const r = PH.ballR;
    if (b.owner) {
      const o = b.owner;
      const tx = o.x + o.dir[0] * 7, ty = o.y + o.dir[1] * 7 + 2;
      const k = Math.min(1, dt * PH.dribbleLag);
      b.x += (tx - b.x) * k; b.y += (ty - b.y) * k;
      b.vx = o.vx; b.vy = o.vy;
      if (this.inGoal()) return this.scoreGoal();
      [b.x, b.y] = clampField(b.x, b.y, r);
      return;
    }
    b.x += b.vx * dt; b.y += b.vy * dt;
    const f = Math.max(0, 1 - PH.friction * dt);
    b.vx *= f; b.vy *= f;
    const inMouth = b.y > FIELD.goalTop + r && b.y < FIELD.goalBottom - r;
    if (this.inGoal()) return this.scoreGoal();
    // стены (в створе ворот стены нет)
    if (b.x < FIELD.left + r && !inMouth) { b.x = FIELD.left + r; b.vx = Math.abs(b.vx) * PH.wallBounce; this.emit({ type: 'wall' }); }
    if (b.x > FIELD.right - r && !inMouth) { b.x = FIELD.right - r; b.vx = -Math.abs(b.vx) * PH.wallBounce; this.emit({ type: 'wall' }); }
    if (b.y < FIELD.top + r) { b.y = FIELD.top + r; b.vy = Math.abs(b.vy) * PH.wallBounce; this.emit({ type: 'wall' }); }
    if (b.y > FIELD.bottom - r) { b.y = FIELD.bottom - r; b.vy = -Math.abs(b.vy) * PH.wallBounce; this.emit({ type: 'wall' }); }
    // подбор: ближайший свободный игрок рядом с мячом
    const sp = hyp(b.vx, b.vy);
    let best = null, bd = PH.control;
    for (const q of this.onField) {
      if (q.noPick > 0 || q.stun > 0 || q.keeper) continue;
      const d = hyp(q.x - b.x, q.y - b.y);
      if (d < bd) { bd = d; best = q; }
    }
    if (best && (sp < PH.trapSpeed || this.rng.chance(0.25))) {
      b.owner = best; b.last = best.team; b.shotBy = null; b.beatKeeper = false;
      if (best.berserk > 0 && best.id === 'igor') this.emit({ type: 'igor_ball' });
    }
  }

  inGoal() {
    const b = this.ball;
    return (b.x < FIELD.left - 2 || b.x > FIELD.right + 2) && b.y > FIELD.goalTop && b.y < FIELD.goalBottom;
  }

  scoreGoal() {
    const b = this.ball;
    const team = b.x < FIELD.cx ? 'fizmat' : 'inyaz'; // забила команда, атакующая эти ворота
    this.score[team]++;
    let scorer = b.shotBy || b.owner;
    if (!scorer || scorer.team !== team) scorer = null; // автогол — без автора
    if (scorer) scorer.goals++;
    const k = this.keeperOf(other(team));
    if (k && k.id === 'bochko') this.stats.kolyaConceded++;
    this.emit({ type: 'goal', team, scorer: scorer && scorer.id });
    b.owner = null; b.vx *= 0.2; b.vy *= 0.2;
    b.x = Math.max(FIELD.left - FIELD.goalDepth + 3, Math.min(FIELD.right + FIELD.goalDepth - 3, b.x));
    this.goalAgainst = other(team);
    this.state = 'goal'; this.stateT = 2.4;
  }

  // ---------- Судья ----------
  updateRef(dt) {
    const tx = Math.max(FIELD.left + 30, Math.min(FIELD.right - 30, this.ball.x));
    const d = tx - this.ref.x;
    this.ref.moving = Math.abs(d) > 4;
    if (this.ref.moving) { this.ref.x += Math.sign(d) * Math.min(Math.abs(d), 60 * dt); this.ref.dir = d > 0 ? 'right' : 'left'; } else this.ref.dir = 'up';
    this.ref.anim = (this.ref.anim || 0) + (this.ref.moving ? dt : 0);
  }

  // Нейтральные реплики: кому — решает игра (медленный, потерял мяч); текст — в football.txt.
  refTalk(dt) {
    this.refT -= dt;
    if (this.refT > 0) return;
    this.refT = this.rng.float(B.refLineEvery[0], B.refLineEvery[1]);
    const slow = this.onField.filter((q) => !q.keeper && ['shurpo', 'bochko', 'matych', 'zakha', 'guza', 'vadim', 'vitalik', 'denis', 'igor', 'chernyak'].includes(q.id));
    const q = this.rng.pick(slow.length ? slow : this.onField);
    this.emit({ type: 'ref', id: q.id });
  }

  // ---------- Автотест состава (раздел 15): 5 на 5, без безымянных ----------
  checkLineups() {
    for (const t of ['inyaz', 'fizmat']) {
      const on = this.team(t);
      const bad = on.length !== 5 || on.some((q) => !CHARACTERS[q.id]) || on.filter((q) => q.keeper).length !== 1;
      if (bad) {
        const msg = `Состав «${t}» нарушен: ${on.map((q) => q.id).join(', ')}`;
        if (this.lineupErrors.length < 5) { this.lineupErrors.push(msg); console.error(msg); }
      }
    }
  }

  // Итог матча для Ромы (раздел 15).
  result() {
    const a = this.score.inyaz, f = this.score.fizmat;
    return a > f ? 'win' : a < f ? 'lose' : 'draw';
  }
}

