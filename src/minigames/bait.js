// Байт-дуэль: отрисовка и ввод поверх BaitLogic. Фразы — data/dialogs/bait_<соперник>.txt
// (метки roma_weak, roma_mid, roma_strong, roma_weird, opp_retort, opp_hit, opp_shrug, opp_boil, opp_win, intro),
// для соперников без своего файла — bait_common.txt.
import { registerMinigame } from './registry.js';
import { BaitLogic, CATS, CAT_NAMES } from './bait_logic.js';
import { labelLines, hasLabel } from '../game/dialogs.js';
import { DialogBox } from '../ui/dialog.js';
import { ChoiceMenu } from '../ui/choice.js';
import { getPerson, portraitOf } from '../gen/people.js';
import { GAME_H } from '../engine/renderer.js';
import { BALANCE } from '../../data/balance.js';
import { audio } from '../engine/audio.js';

export function baitFile(opp) {
  return hasLabel('bait_' + opp, 'roma_weak') ? 'bait_' + opp : 'bait_common';
}

function pickLine(rng, file, label, opp) {
  let lines = labelLines(file, label);
  if (!lines.length && file !== 'bait_common') lines = labelLines('bait_common', label);
  if (!lines.length) return { who: 'narrator', emo: 'norm', text: '...' };
  const l = rng.pick(lines);
  return { who: l.who === 'opp' ? opp : l.who, emo: l.emo, text: l.text };
}

class BaitGame {
  constructor(ctx) {
    this.ctx = ctx;
    this.game = ctx.game;
    this.rng = ctx.rng;
    this.done = false;
    this.time = 0;
  }

  start(params) {
    const st = this.ctx.state;
    this.opp = this.ctx.opp || params.opp;
    this.file = baitFile(this.opp);
    this.logic = new BaitLogic(this.rng, {
      opp: this.opp,
      inLesson: !!params.inLesson,
      sulk: !!params.sulk,
      hungerSlow: st.stats.hunger > BALANCE.hunger.slowThreshold,
      lessonMul: st.lessonMul,
      startSuspicion: st.stats.suspicion,
    });
    this.box = new DialogBox(this.game);
    this.queue = [];
    this.shown = { roma: 0, opp: 0 };
    this.flash = 0;
    this.say(pickLine(this.rng, this.file, 'intro', this.opp));
    this.next = () => this.offer();
  }

  // Показать реплику; после неё — следующий элемент очереди.
  say(line) {
    this.mode = 'say';
    const p = getPerson(line.who);
    this.box.show(p, line.who === 'narrator' ? null : portraitOf(line.who, line.emo), line.text);
    if (line.who !== 'narrator' && p) audio.blip(p.blip.freq, p.blip.wave);
  }

  offer() {
    this.options = CATS.map((c) => ({ cat: c, line: pickLine(this.rng, this.file, 'roma_' + c, this.opp) }));
    this.choice = new ChoiceMenu(`Раунд ${this.logic.round} из ${this.logic.rounds}. Чем ответить?`,
      this.options.map((o) => ({ text: `[${CAT_NAMES[o.cat]}] ${stripTags(o.line.text)}` })));
    this.mode = 'choose';
  }

  // Бот/тесты могут выбирать напрямую.
  pick(i) {
    const o = this.options[i];
    this.choice = null;
    const L = this.logic;
    const res = L.playRoma(o.cat);
    const steps = [{ line: o.line }];
    if (res.outcome === 'big') steps.push({ line: pickLine(this.rng, this.file, 'opp_hit', this.opp), flash: true });
    else if (res.outcome === 'backfire') steps.push({ line: pickLine(this.rng, this.file, 'opp_shrug', this.opp), self: true });
    else steps.push({ line: pickLine(this.rng, this.file, res.dmg > 14 ? 'opp_hit' : 'opp_shrug', this.opp) });
    if (!L.finished) {
      L.playOpp();
      steps.push({ line: pickLine(this.rng, this.file, 'opp_retort', this.opp), self: true });
      L.endRound();
    }
    this.queue = steps;
    this.runQueue();
  }

  runQueue() {
    const s = this.queue.shift();
    if (!s) {
      if (this.logic.finished) return this.finale();
      return this.offer();
    }
    if (s.flash) { this.flash = 0.4; this.game.r.shake(2, 0.25); }
    this.say(s.line);
  }

  finale() {
    const r = this.logic.result;
    this.finaleShown = true;
    const label = r === 'win' ? 'opp_boil' : r === 'lose' ? 'opp_win' : null;
    if (r === 'win' && this.opp === 'igor') { this.game.r.shake(5, 1.2); audio.play('igorLaugh'); }
    if (label) { this.queue = [{ line: pickLine(this.rng, this.file, label, this.opp) }]; this.after = true; this.runQueue(); }
    else this.done = true;
  }

  update(dt, input) {
    this.time += dt;
    this.flash = Math.max(0, this.flash - dt);
    for (const k of ['roma', 'opp']) this.shown[k] += (this.logic[k] - this.shown[k]) * Math.min(1, dt * 6);
    if (this.mode === 'choose') {
      const i = this.choice.update(dt, input);
      if (i >= 0) this.pick(i);
    } else if (this.mode === 'say') {
      if (this.box.update(dt, input)) {
        if (this.after && !this.queue.length) { this.done = true; return; }
        this.runQueue();
      }
    }
  }

  forfeit() {
    this.logic.result = 'lose';
    return this.end();
  }

  end() {
    const L = this.logic;
    const r = L.result || 'draw';
    const d = L.deltas();
    const p = getPerson(this.opp);
    const extra = {};
    if (r === 'win' && this.opp === 'igor') extra.berserk = true;
    return {
      result: r, deltas: d, money: 0, extra,
      summary: `Закипание: Рома ${Math.round(L.roma)} — ${p.short} ${Math.round(L.opp)}`,
    };
  }

  draw(r) {
    const L = this.logic;
    r.rect(0, 0, 480, GAME_H, '#1b1426');
    for (let y = 0; y < GAME_H; y += 6) r.rect(0, y, 480, 1, '#21192e');
    const berserk = this.opp === 'igor' && L.opp >= 100;
    this.drawSide(r, 'roma', 40, this.shown.roma, false);
    this.drawSide(r, this.opp, 330, this.shown.opp, berserk);
    r.text('БАЙТ-ДУЭЛЬ', 240, 4, { align: 'center', color: '#ffe14d', scale: 2, shadow: '#000' });
    r.text(`Раунд ${Math.min(L.round, L.rounds)} / ${L.rounds}`, 240, 26, { align: 'center', color: '#c8c8d8' });
    r.text('VS', 240, 48, { align: 'center', color: '#ff5a5a', scale: 2 });
    if (L.p.inLesson) {
      r.text('Подозрение: ' + Math.round(L.suspicion), 240, 72, { align: 'center', color: L.suspicion > 70 ? '#ff5a5a' : '#ffb0b0' });
    }
    if (this.flash > 0) r.alpha(this.flash, () => r.rect(0, 0, 480, GAME_H, '#ffffff'));
    if (this.mode === 'choose') this.choice.draw(r, GAME_H - 4);
    else this.box.draw(r);
    this.game.hud.draw(r, this.ctx.state);
  }

  drawSide(r, id, x, boil, berserk) {
    const emo = boil >= 75 ? 'angry' : boil >= 40 ? 'surprised' : 'happy';
    const pt = portraitOf(id, emo);
    let ox = 0;
    if (boil >= 75) ox = Math.round(Math.sin(this.time * 50) * 1.5);
    if (berserk) {
      const a = 0.5 + Math.sin(this.time * 12) * 0.3;
      r.alpha(a, () => r.rect(x - 6, 20, 120, 76, '#ff2020'));
    }
    if (pt) r.image(pt, x + 26 + ox, 22, 48, 48);
    const p = getPerson(id);
    r.text(p.short, x + 50, 72, { align: 'center', color: '#ffffff' });
    // шкала закипания
    r.rect(x, 84, 100, 8, '#2c2840');
    const w = Math.round(Math.min(100, boil));
    r.rect(x, 84, w, 8, boil >= 75 ? '#ff3a3a' : boil >= 40 ? '#ffa040' : '#ffe14d');
    r.frame(x - 1, 83, 102, 10, '#ffffff');
    r.text('закипание ' + Math.round(boil), x + 50, 96, { align: 'center', color: '#9a9aa8' });
  }
}

function stripTags(t) { return t.replace(/\{[^}]*\}/g, ''); }

registerMinigame('bait', {
  title: 'Байт-дуэль',
  music: 'bait',
  keys: ['↑↓ — выбрать фразу', 'Z — сказать', 'Кто первым закипел — проиграл', 'Рома закипает в 1,5 раза быстрее'],
  describe: (params) => (params.inLesson ? 'Прямо на уроке. Каждая реплика — подозрение.' : '3–4 раунда подколов.'),
  create: (ctx) => new BaitGame(ctx),
});
