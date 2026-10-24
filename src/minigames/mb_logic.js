// Логика «Кто забайтит Матыча и Буя» без графики (проверяется в node-тестах).
import { BALANCE } from '../../data/balance.js';

const B = BALANCE.baitMB;
export const OPTIONS = [
  { target: 'matych', kind: 'mid', label: 'Матыч: про нос (средне)' },
  { target: 'matych', kind: 'strong', label: 'Матыч: про нос (жёстко, риск)' },
  { target: 'buy', kind: 'mid', label: 'Буй: про «бизнес» (средне)' },
  { target: 'buy', kind: 'strong', label: 'Буй: про «бизнес» (жёстко, риск)' },
];

export class MBLogic {
  constructor(rng, p = {}) {
    this.rng = rng;
    this.res = { matych: BALANCE.bait.opponents.matych.resist, buy: BALANCE.bait.opponents.buy.resist };
    this.boil = { matych: 0, buy: 0, roma: 0 };
    this.round = 1; this.finished = false; this.result = null;
  }
  playRoma(i) {
    const o = OPTIONS[i];
    let dmg = 0, back = 0;
    if (o.kind === 'mid') dmg = this.rng.int(B.mid[0], B.mid[1]);
    else if (this.rng.chance(B.strongChance)) dmg = this.rng.int(B.strong[0], B.strong[1]);
    else back = B.backfire;
    dmg = Math.round(dmg / this.res[o.target]);
    this.boil[o.target] = Math.min(100, this.boil[o.target] + dmg);
    this.boil.roma = Math.min(100, this.boil.roma + Math.round(back * BALANCE.bait.retortMul));
    return { target: o.target, dmg, back };
  }
  playFriend() {
    const t = this.boil.matych < this.boil.buy ? 'matych' : 'buy';
    const dmg = this.rng.int(B.friend[0], B.friend[1]);
    this.boil[t] = Math.min(100, this.boil[t] + Math.round(dmg / this.res[t]));
    return { target: t, dmg };
  }
  retort() {
    const who = this.rng.chance(0.5) ? 'matych' : 'buy';
    const hit = Math.round(this.rng.int(B.retort[0], B.retort[1]) * BALANCE.bait.retortMul);
    this.boil.roma = Math.min(100, this.boil.roma + hit);
    return { who, hit };
  }
  endRound() {
    const both = this.boil.matych >= 100 && this.boil.buy >= 100;
    if (both) { this.finished = true; this.result = 'win'; return; }
    if (this.boil.roma >= 100) { this.finished = true; this.result = 'lose'; return; }
    this.round++;
    if (this.round > B.rounds) {
      this.finished = true;
      const sum = this.boil.matych + this.boil.buy;
      this.result = sum >= B.winSum ? 'win' : sum >= B.winSum * 0.8 ? 'draw' : 'lose';
    }
  }
}

export function mbBotPick(L, rng) {
  const t = L.boil.matych <= L.boil.buy ? 0 : 2;
  return t + (rng.chance(0.35) ? 1 : 0);
}
