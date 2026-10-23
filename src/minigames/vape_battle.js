// «Кто больше парит» (раздел 14, п. 5): держишь Z — шкала затяжки растёт, отпускаешь в зелёной зоне —
// большое облако; передержал — кашель и ноль. 3 раунда, сумма облаков.
// УЧАСТНИКИ СТРОГО: Черняк, Рома, Денис, Шурпо, Левончук, Бочко, Матыч, Буй и безымянные ученики 9–11 классов.
// Игорь, Смайл, Гуза, Вадим, остальные именные и все учителя — НИКОГДА.
// Последствия даже при победе: заряд −20 %, 1 заправка жижки, запах (+20 к подозрению на след. уроке),
// стресс +5 потом. Нет заряда или жижки — игра недоступна. Рядом завуч — риск вызова к директору.
import { registerMinigame } from './registry.js';
import { FakeInput, Particles, Popups, hungerMul, vrand } from './kit.js';
import { BALANCE } from '../../data/balance.js';
import { getPerson, portraitOf, sheetOf } from '../gen/people.js';
import { frameRect } from '../gen/sprites.js';
import { GAME_H } from '../engine/renderer.js';
import { audio } from '../engine/audio.js';
import { CHARACTERS } from '../../data/characters.js';
import { TEACHERS, STAFF } from '../../data/teachers.js';

const B = BALANCE.vapeBattle;

// Белый список (раздел 14). Безымянные — только ученики (не учителя и не персонал), классы 9–11.
export const VAPE_WHITELIST = ['chernyak', 'denis', 'shurpo', 'levonchuk', 'bochko', 'matych', 'buy'];
export function canVapeBattle(id, person = null) {
  if (!id) return false;
  if (VAPE_WHITELIST.includes(id)) return true;
  if (id in CHARACTERS || id in TEACHERS || id in STAFF) return false; // все остальные именные и все учителя
  const p = person || getPerson(id);
  if (!p || !p.unnamed || p.adult) return false;
  return /^(9|10|11)\b/.test(p.cls || '');
}
export function vapeReady(state) { return state.stats.vapeCharge > 0 && state.stats.juice > 0; }

export class VapeLogic {
  constructor(rng, p = {}) {
    this.rng = rng;
    this.p = p;
    const shrink = (B.green[1] - B.green[0]) * (1 - (p.accuracy || 1)) / 2;
    this.green = [B.green[0] + shrink, B.green[1] - shrink];
    this.skill = B.skill[p.opp] ?? B.skill.default;
    this.round = 1; this.fill = 0; this.holding = false;
    this.roma = []; this.opp = [];
    this.finished = false; this.result = null; this.events = [];
    this.pause = 0.8; this.oppIn = 0;
  }
  cloudFor(fill) {
    if (fill > 1) return 0;                                   // кашель
    if (fill >= this.green[0] && fill <= this.green[1]) return Math.round(55 + 45 * (fill - this.green[0]) / (this.green[1] - this.green[0]));
    if (fill > this.green[1]) return Math.round(30 + 20 * (1 - fill) / (1 - this.green[1]));
    return Math.round(fill * 50);
  }
  oppCloud() {
    // соперник: в среднем попадает в зону по навыку
    const f = this.rng.next() < this.skill ? this.rng.float(this.green[0], this.green[1]) : this.rng.float(0.3, 1.08);
    return this.cloudFor(f);
  }
  update(dt, input) {
    if (this.finished) return;
    if (this.oppIn > 0) {
      // ход соперника: он затягивается и выпускает облако
      this.oppIn -= dt;
      if (this.oppIn <= 0) this.oppTurn();
      return;
    }
    if (this.pause > 0) { this.pause -= dt; if (input.held('confirm') && this.pause <= 0) this.holding = true; return; }
    const held = input.held('confirm');
    if (held) {
      this.holding = true;
      this.fill += (B.fillSpeed + B.fillAccel * this.fill) * dt;
      if (this.fill > 1.08) this.release();
    } else if (this.holding) this.release();
  }
  release() {
    const c = this.cloudFor(this.fill);
    this.roma.push(c);
    this.events.push({ type: c === 0 ? 'cough' : 'cloud', size: c });
    this.fill = 0; this.holding = false; this.oppIn = B.oppTurn;
  }
  oppTurn() {
    const o = this.oppCloud();
    this.opp.push(o);
    this.events.push({ type: o === 0 ? 'opp_cough' : 'opp', size: o });
    this.pause = B.roundPause;
    if (this.round >= B.rounds) {
      this.finished = true;
      const a = this.roma.reduce((x, y) => x + y, 0), b = this.opp.reduce((x, y) => x + y, 0);
      this.result = a > b ? 'win' : a < b ? 'lose' : 'draw';
    } else this.round++;
  }
}

export function vapeBot(L, rng) {
  let target = null;
  return () => {
    const inp = new FakeInput();
    if (L.pause > 0 || L.oppIn > 0) { target = null; return inp; }
    if (target === null) target = rng.float(L.green[0] - 0.06, L.green[1] + 0.07); // «средний игрок» не идеален
    if (L.fill < target) inp.hold('confirm');
    return inp;
  };
}

class VapeGame {
  constructor(ctx) { this.ctx = ctx; this.game = ctx.game; this.rng = ctx.rng; this.done = false; this.time = 0; this.particles = new Particles(); this.popups = new Popups(); }
  start(params) {
    this.opp = this.ctx.opp || params.opp || 'chernyak';
    this.L = new VapeLogic(this.rng, { opp: this.opp, accuracy: hungerMul(this.ctx.state) });
    this.botFn = vapeBot(this.L, this.rng);
    this.patrol = !!params.patrolNear;
  }
  update(dt, input) {
    this.time += dt;
    this.particles.update(dt); this.popups.update(dt);
    if (this.L.holding && vrand() < 0.4) this.particles.burst(150, 120, 1, { color: '#e8f0ff', speed: 8, size: 3, grow: 6, life: 0.8 });
    this.L.update(dt, this.autoplay ? this.botFn(dt) : input);
    for (const e of this.L.events) {
      const opp = e.type.startsWith('opp'), x = opp ? 330 : 150;
      if (e.size === 0) { audio.play('statDown'); this.game.r.shake(3, 0.4); this.popups.add(x, 90, 'КХЕ-КХЕ! 0', '#ff6a6a'); continue; }
      audio.play('puff');
      this.particles.burst(x, 110, 10 + Math.round(e.size / 3), { color: opp ? '#e0e8f8' : '#f0f4ff', speed: 30 + e.size / 2, size: 4, grow: 10 + e.size / 5, life: 1.6, angle: -Math.PI / 2, spread: Math.PI });
      this.popups.add(x, 80, 'облако ' + e.size, opp ? '#c8d0e8' : '#ffffff');
      if (e.size >= 85) this.game.r.shake(2, 0.25);
    }
    this.L.events = [];
    if (this.L.finished && this.particles.list.length < 30) this.done = true;
  }
  forfeit() { this.L.finished = true; this.L.result = 'lose'; return this.end(); }
  end() {
    const L = this.L;
    const st = this.ctx.state;
    // последствия даже при победе (раздел 14)
    st.vapeSmell = true;
    st.puffsToday++;
    st.flags.vapeAfterStress = (st.flags.vapeAfterStress || 0) + B.stressAfter;
    const d = { vapeCharge: B.chargeCost, juice: B.juiceCost }; // стресс +5 — «потом», в конце следующего урока
    if (L.result === 'win') d.aura = 6;
    if (L.result === 'lose') d.aura = -3;
    const caught = this.patrol && this.rng.chance(B.patrolCatch);
    const a = L.roma.reduce((x, y) => x + y, 0), b = L.opp.reduce((x, y) => x + y, 0);
    return { result: L.result, deltas: d, money: 0, extra: { caught }, summary: `Облака: Рома ${a} — ${getPerson(this.opp).short} ${b}` + (caught ? ' · Завуч всё видела!' : '') };
  }
  draw(r) {
    const L = this.L;
    r.rect(0, 0, 480, GAME_H, '#cfdbe4');
    for (let i = 0; i < 480; i += 16) r.rect(i, 0, 1, GAME_H, '#b0c0cc');
    r.text('КТО БОЛЬШЕ ПАРИТ', 240, 4, { align: 'center', color: '#2a2430', scale: 2 });
    r.text(`Раунд ${L.round} / ${B.rounds}`, 240, 26, { align: 'center', color: '#2a2430' });
    const draw = (id, x, dir) => { const sh = sheetOf(id); const f = frameRect(dir, 0); r.sprite(sh, f.sx, f.sy, f.sw, f.sh, x, 110, 2); };
    draw('roma', 134, 'right'); draw(this.opp, 314, 'left');
    const sum = (a) => a.reduce((x, y) => x + y, 0);
    r.text('Рома: ' + sum(L.roma), 150, 182, { align: 'center', color: '#2a2430' });
    r.text(getPerson(this.opp).short + ': ' + sum(L.opp), 330, 182, { align: 'center', color: '#2a2430' });
    // шкала затяжки
    const sx = 40, sy = 40, sh = 140;
    r.rect(sx, sy, 16, sh, '#3a3a48');
    r.rect(sx, sy + Math.round((1 - L.green[1]) * sh), 16, Math.round((L.green[1] - L.green[0]) * sh), '#5ad65a');
    r.rect(sx, sy, 16, Math.round(sh * 0.08), '#ff4a4a');
    r.rect(sx + 2, sy + sh - Math.round(Math.min(1.08, L.fill) / 1.08 * sh), 12, Math.round(Math.min(1.08, L.fill) / 1.08 * sh), '#c8e0ff');
    r.text('ДЕРЖИ Z', sx + 8, sy + sh + 4, { align: 'center', color: '#2a2430' });
    if (L.oppIn > 0) r.text(`Ход: ${getPerson(this.opp).short} затягивается…`, 240, 40, { align: 'center', color: '#5a5a6a' });
    else if (!L.finished && L.pause <= 0) r.text('Твой ход: держи Z', 240, 40, { align: 'center', color: '#2a6a2a' });
    if (this.patrol) r.text('Рядом завуч! Риск…', 240, 200, { align: 'center', color: '#c02020' });
    this.particles.draw(r); this.popups.draw(r);
    this.game.hud.draw(r, this.ctx.state);
  }
}

registerMinigame('vape', {
  title: 'Кто больше парит',
  music: 'minigame',
  keys: ['Держи Z — затяжка, отпусти — облако', 'Зелёная зона — большое облако', 'Передержал — кашель и ноль', 'Даже победа стоит: заряд −20 %, жижка, запах'],
  describe: () => `${B.rounds} раундов по очереди, побеждает сумма облаков.`,
  create: (ctx) => new VapeGame(ctx),
});
