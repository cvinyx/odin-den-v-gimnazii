// Логика байт-дуэли (раздел 14, пункт 3) без отрисовки — используется игрой, тестами и ботом.
// 3–4 раунда; в каждом Рома выбирает фразу: слабая, средняя, сильная-рискованная, странная.
// У обоих шкала «закипания»; у Ромы она растёт на 50 % быстрее. Кто первым закипел — проиграл.
import { BALANCE } from '../../data/balance.js';

export const CATS = ['weak', 'mid', 'strong', 'weird'];
export const CAT_NAMES = { weak: 'слабо', mid: 'средне', strong: 'жёстко, риск', weird: 'странно' };

export class BaitLogic {
  // p: { opp, inLesson, sulk, hungerSlow, lessonMul, startSuspicion }
  constructor(rng, p = {}) {
    this.rng = rng;
    this.p = p;
    this.B = BALANCE.bait;
    this.stats = this.B.opponents[p.opp] || (p.kid ? this.B.opponents.kid5 : this.B.opponents.default);
    this.roma = 0;
    this.opp = 0;
    this.round = 1;
    this.rounds = rng.int(BALANCE.minigames.bait.roundsMin, BALANCE.minigames.bait.roundsMax);
    this.suspicion = p.startSuspicion || 0;
    this.suspicionAdded = 0;
    this.result = null;
  }

  get finished() { return this.result !== null; }

  k() {
    let k = 1 / this.stats.resist;
    if (this.p.sulk) k *= this.B.sulkBonus;
    if (this.p.hungerSlow) k *= BALANCE.hunger.slowFactor;
    return k;
  }

  roll([a, b]) { return this.rng.int(a, b); }

  addSusp() {
    if (!this.p.inLesson) return;
    const m = BALANCE.minigames.bait;
    const v = Math.round(this.rng.int(m.suspicionMin, m.suspicionMax) * (this.p.lessonMul || 1));
    this.suspicion = Math.min(100, this.suspicion + v);
    this.suspicionAdded += v;
    if (this.suspicion >= 100) this.result = 'director';
  }

  // Ход Ромы. Возвращает описание: { cat, dmg, backfire, outcome: 'hit'|'big'|'fizzle'|'backfire' }.
  playRoma(cat) {
    const B = this.B;
    const k = this.k();
    let dmg = 0, back = 0, outcome = 'hit';
    if (cat === 'weak') dmg = this.roll(B.weak) * k;
    else if (cat === 'mid') dmg = this.roll(B.mid) * k;
    else if (cat === 'strong') {
      if (this.rng.chance(B.strongChance)) { dmg = this.roll(B.strong) * k; outcome = 'big'; }
      else { back = B.strongBackfire; outcome = 'backfire'; }
    } else {
      const r = this.rng.next();
      if (r < B.weirdHit) { dmg = this.roll(B.weird) * k; outcome = 'big'; }
      else if (r < B.weirdHit + 0.3) { dmg = B.weirdFizzle; outcome = 'fizzle'; }
      else { back = B.weirdBackfire; outcome = 'backfire'; }
    }
    dmg = Math.round(dmg);
    this.opp = Math.min(100, this.opp + dmg);
    if (back) this.roma = Math.min(100, this.roma + Math.round(back * B.retortMul));
    this.addSusp();
    if (!this.result) {
      if (this.opp >= 100) this.result = 'win';
      else if (this.roma >= 100) this.result = 'lose';
    }
    return { cat, dmg, back, outcome };
  }

  // Ответ соперника.
  playOpp() {
    const hit = Math.round(this.roll(this.stats.attack) * this.B.retortMul);
    this.roma = Math.min(100, this.roma + hit);
    // подозрение на уроке — только за реплики Ромы (учитель слышит того, кто сидит ближе и громче)
    if (!this.result && this.roma >= 100) this.result = 'lose';
    return { hit };
  }

  endRound() {
    if (this.result) return;
    this.round++;
    if (this.round > this.rounds) {
      if (this.roma > this.opp) this.result = 'lose';
      else if (this.opp > this.roma) this.result = 'win';
      else this.result = 'draw';
    }
  }

  deltas() {
    const B = this.B;
    const d = {};
    if (this.result === 'win') d.aura = this.rng.int(B.winAura[0], B.winAura[1]);
    if (this.result === 'lose' || this.result === 'director') { d.aura = B.loseAura; d.stress = B.loseStress; }
    if (this.suspicionAdded) d.suspicion = this.suspicionAdded;
    return d;
  }
}
