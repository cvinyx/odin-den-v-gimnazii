// «Кто забайтит Матыча и Буя» (раздел 14, п. 7): байт-дуэль втроём — Рома и друг против Матыча и Буя.
// Каждый раунд Рома выбирает, кого байтить и насколько жёстко; друг подкидывает своё; они огрызаются.
// Очки — за реакцию Матыча и Буя (их шкалы закипания). Оба закипели или сумма ≥ 160 — победа.
import { registerMinigame } from './registry.js';
import { FakeInput, Particles, Popups } from './kit.js';
import { BALANCE } from '../../data/balance.js';
import { MBLogic, mbBotPick, OPTIONS } from './mb_logic.js';
import { labelLines } from '../game/dialogs.js';
import { DialogBox } from '../ui/dialog.js';
import { ChoiceMenu } from '../ui/choice.js';
import { getPerson, portraitOf, NARRATOR } from '../gen/people.js';
import { GAME_H } from '../engine/renderer.js';
import { audio } from '../engine/audio.js';

class MBGame {
  constructor(ctx) { this.ctx = ctx; this.game = ctx.game; this.rng = ctx.rng; this.done = false; this.time = 0; this.particles = new Particles(); this.popups = new Popups(); }
  start(params) {
    this.friend = params.friend || this.ctx.opp || 'denis';
    this.L = new MBLogic(this.rng);
    this.box = new DialogBox(this.game);
    this.queue = [this.line('intro')].flat();
    this.mode = 'say';
    this.next();
  }
  line(label, who = null) {
    const ls = labelLines('mb_duo', label);
    if (!ls.length) return [];
    const l = this.rng.pick(ls);
    return [{ who: l.who === 'opp' ? this.friend : who || l.who, emo: l.emo, text: l.text }];
  }
  next() {
    const l = this.queue.shift();
    if (l) { this.mode = 'say'; const p = getPerson(l.who) || NARRATOR; this.box.show(p, l.who === 'narrator' ? null : portraitOf(l.who, l.emo), l.text); return; }
    if (this.L.finished) {
      if (!this.ended) { this.ended = true; this.queue = this.line(this.L.result === 'win' ? 'win' : 'lose'); return this.next(); }
      this.done = true; return;
    }
    this.mode = 'choose';
    this.choice = new ChoiceMenu(`Раунд ${this.L.round} из ${BALANCE.baitMB.rounds}. Кого байтим?`, OPTIONS.map((o) => ({ text: o.label })));
  }
  pick(i) {
    const L = this.L;
    const o = OPTIONS[i];
    const r1 = L.playRoma(i);
    const q = [...this.line(`roma_${o.target}_${o.kind}`)];
    if (r1.dmg > 15) { q.push(...this.line(`${o.target}_hit`)); this.fx(o.target, r1.dmg); }
    const r2 = L.playFriend();
    q.push(...this.line('friend'));
    this.fx(r2.target, r2.dmg);
    const r3 = L.retort();
    q.push(...this.line(`${r3.who}_retort`));
    L.endRound();
    this.queue = q;
    this.next();
  }
  fx(target, dmg) {
    const x = target === 'matych' ? 300 : 410;
    this.popups.add(x, 40, '+' + dmg, '#ffb84a');
    this.particles.burst(x, 50, 8, { color: '#ff6a4a', speed: 40 });
    audio.play('hit');
  }
  update(dt, input) {
    this.time += dt;
    this.particles.update(dt); this.popups.update(dt);
    if (this.mode === 'say') {
      const inp = this.autoplay ? new FakeInput().press('confirm') : input;
      if (this.autoplay) { this.box.shown = this.box.pageChars; }
      if (this.box.update(dt, inp)) this.next();
    } else if (this.mode === 'choose') {
      if (this.autoplay) return this.pick(mbBotPick(this.L, this.rng));
      const i = this.choice.update(dt, input);
      if (i >= 0) this.pick(i);
    }
  }
  forfeit() { this.L.finished = true; this.L.result = 'lose'; return this.end(); }
  end() {
    const L = this.L;
    const d = L.result === 'win' ? { aura: 8 } : L.result === 'lose' ? { aura: -5, stress: 5 } : {};
    return { result: L.result, deltas: d, money: 0, summary: `Матыч ${L.boil.matych} · Буй ${L.boil.buy} · Рома ${L.boil.roma}` };
  }
  draw(r) {
    const L = this.L;
    r.rect(0, 0, 480, GAME_H, '#1b1426');
    r.text('ЗАБАЙТИТЬ МАТЫЧА И БУЯ', 240, 4, { align: 'center', color: '#ffe14d', scale: 2 });
    const side = (id, x, val, label) => {
      const pt = portraitOf(id, val >= 75 ? 'angry' : val >= 40 ? 'surprised' : 'happy');
      if (pt) r.image(pt, x, 24, 48, 48);
      r.text(label, x + 24, 74, { align: 'center', color: '#ffffff' });
      r.rect(x - 6, 86, 60, 6, '#2c2840');
      r.rect(x - 6, 86, Math.round(60 * val / 100), 6, val >= 75 ? '#ff3a3a' : '#ffa040');
    };
    side('roma', 20, L.boil.roma, 'Рома');
    side(this.friend, 90, 0, getPerson(this.friend).short);
    side('matych', 276, L.boil.matych, 'Матыч');
    side('buy', 386, L.boil.buy, 'Буй');
    r.text('VS', 200, 44, { align: 'center', color: '#ff5a5a', scale: 2 });
    if (this.mode === 'choose') this.choice.draw(r, GAME_H - 4); else this.box.draw(r);
    this.particles.draw(r); this.popups.draw(r);
    this.game.hud.draw(r, this.ctx.state);
  }
}

registerMinigame('bait_mb', {
  title: 'Кто забайтит Матыча и Буя',
  music: 'bait',
  keys: ['↑↓ — кого и как байтить, Z — сказать', 'Друг помогает сам', `Оба закипели или сумма ≥ ${BALANCE.baitMB.winSum} — победа`, 'Сам закипел — проигрыш'],
  describe: () => 'Рома и друг против Матыча и Буя.',
  create: (ctx) => new MBGame(ctx),
});
