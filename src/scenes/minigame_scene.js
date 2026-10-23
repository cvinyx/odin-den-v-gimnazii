// Обёртка мини-игры: экран «до» (название, соперник, ставка, клавиши) → игра → применение итогов →
// выбор при проигрыше на деньги → экран «после» (результат, изменения статусов, реплика соперника).
import { getMinigame } from '../minigames/registry.js';
import { Menu } from '../ui/menu.js';
import { getPerson, portraitOf } from '../gen/people.js';
import { formatMoney, changeStat } from '../game/state.js';
import { payWin, resolveLoss } from '../game/bets.js';
import { eventRng } from '../game/day.js';
import { DialogScene } from './dialog_scene.js';
import { HUD_SLOTS } from '../ui/hud.js';
import { audio } from '../engine/audio.js';

const RESULT_NAMES = { win: 'ПОБЕДА', lose: 'ПОРАЖЕНИЕ', draw: 'НИЧЬЯ', director: 'К ДИРЕКТОРУ' };
const LOSS_TEXT = { paid: 'lose_pay', exposed: 'lose_exposed', escaped: 'lose_escaped', truth: 'lose_truth', debt: 'lose_debt' };

export class MinigameScene {
  // opts: { params, opp, bet (копейки или null), onDone(res), noOutro }
  constructor(id, opts = {}) {
    this.id = 'minigame';
    this.gameId = id;
    this.opts = opts;
    this.opaque = true;
    this.phase = 'intro';
    this.time = 0;
  }

  enter(game) {
    this.game = game;
    this.meta = getMinigame(this.gameId);
    const st = game.state;
    st.flags.mgCount = (st.flags.mgCount || 0) + 1;
    this.rng = eventRng(st, 'mg:' + this.gameId + ':' + st.flags.mgCount);
    this.opp = this.opts.opp || null;
    this.bet = this.opts.bet || 0;
    this.introMenu = new Menu(this.bet
      ? [{ label: 'Играть', action: () => this.begin() }, { label: 'Отказаться', action: () => this.refuse() }]
      : [{ label: 'Начать', action: () => this.begin() }], { lineH: 14 });
    game.playMusic(this.meta.music || 'minigame');
    game.hud.hint = null;
  }

  begin() {
    const st = this.game.state;
    this.before = { ...st.stats };
    this.inst = this.meta.create({ game: this.game, state: st, rng: this.rng, params: this.opts.params || {}, opp: this.opp });
    this.inst.start(this.opts.params || {});
    this.phase = 'play';
    if (st.breakdownPending) {
      st.breakdownPending = false;
      this.forced = true;
      this.game.toast('Срыв! Мини-игра провалена', 2.5);
      this.game.r.shake(5, 0.6);
      this.finishPlay(this.inst.forfeit ? this.inst.forfeit() : { result: 'lose', deltas: {} });
    }
  }

  refuse() {
    this.game.scenes.pop();
    if (this.opts.onDone) this.opts.onDone({ refused: true });
  }

  finishPlay(res) {
    this.res = res;
    const st = this.game.state;
    for (const [k, v] of Object.entries(res.deltas || {})) if (k in st.stats && v) changeStat(st, k, v);
    if (res.money) changeStat(st, 'money', res.money);
    if (this.bet && res.result === 'win') { payWin(st, this.bet); audio.play('coin'); }
    if (this.bet && res.result === 'lose') { this.startLoss(); return; }
    if (!this.bet && res.result === 'win' && this.opp) st.wins++;
    this.toOutro();
  }

  startLoss() {
    this.phase = 'loss';
    const st = this.game.state;
    const items = [
      { label: 'A) «Отдать сейчас»', disabled: st.stats.money <= 0, action: () => this.loss('pay') },
      { label: '«У меня нет»', action: () => this.loss('nomoney') },
      { label: '«Потом отдам»', action: () => this.loss('later') },
    ];
    items[1].label = 'B) ' + items[1].label;
    items[2].label = 'C) ' + items[2].label;
    this.lossMenu = new Menu(items, { lineH: 16 });
  }

  loss(option) {
    const st = this.game.state;
    const out = resolveLoss(st, this.opp, this.bet, option);
    this.lossOutcome = out;
    this.phase = 'loss_talk';
    const opp = getPerson(this.opp);
    this.game.scenes.push(new DialogScene('bets', LOSS_TEXT[out.outcome], {
      opp: this.opp,
      vars: { bet: formatMoney(this.bet), name: opp ? opp.short : '' },
      onEnd: () => this.toOutro(),
    }));
  }

  toOutro() {
    this.phase = 'outro';
    this.after = { ...this.game.state.stats };
    const r = this.res.result;
    audio.play(r === 'win' ? 'statUp' : r === 'lose' || r === 'director' ? 'statDown' : 'menuSelect');
    if (this.opts.noOutro) this.done();
  }

  done() {
    this.game.scenes.remove(this);
    const t = this.game.scenes.top;
    if (t && t.resume) t.resume({ minigame: this.gameId, res: this.res }, this);
    if (this.opts.onDone) this.opts.onDone(this.res);
  }

  update(dt) {
    this.time += dt;
    const input = this.game.input;
    if (this.phase === 'intro') {
      if (this.bet && input.pressed('back')) { input.consume('back'); this.refuse(); return; }
      this.introMenu.update(input, this.game);
    } else if (this.phase === 'play') {
      this.inst.update(dt, input);
      if (this.opts.onUpdate) this.opts.onUpdate(this.inst);
      if (this.inst.done) this.finishPlay(this.inst.end());
    } else if (this.phase === 'loss') {
      this.lossMenu.update(input, this.game);
    } else if (this.phase === 'outro') {
      if (input.pressed('confirm')) { input.consume('confirm'); this.done(); }
    }
  }

  drawCard(r, title) {
    r.rect(0, 0, 480, 270, '#14122a');
    for (let y = 0; y < 270; y += 8) r.rect(0, y, 480, 1, '#1a1834');
    r.text(title, 240, 14, { align: 'center', color: '#ffe14d', scale: 2, shadow: '#000' });
  }

  draw(r) {
    const m = this.meta;
    if (this.phase === 'play' && this.inst) { this.inst.draw(r); return; }
    if (this.phase === 'intro') {
      this.drawCard(r, m.title);
      const desc = m.describe ? m.describe(this.opts.params || {}, this.opp) : '';
      if (desc) r.text(desc, 240, 38, { align: 'center', color: '#c8c8d8' });
      let y = 56;
      if (this.opp) {
        const p = getPerson(this.opp);
        r.box(20, y, 200, 70, '#4a4668', '#000', 1);
        const pt = portraitOf(this.opp, 'happy');
        if (pt) r.image(pt, 30, y + 11);
        r.text('Соперник:', 86, y + 12, { color: '#9a9aa8' });
        r.text(p.short, 86, y + 24, { color: '#ffffff', scale: 2 });
        if (this.bet) r.text('Ставка: ' + formatMoney(this.bet) + ' BYN', 86, y + 48, { color: '#6be36b' });
      }
      const kx = this.opp ? 236 : 60;
      r.box(kx, y, this.opp ? 224 : 360, 70 + (this.opp ? 0 : 20), '#4a4668', '#000', 1);
      r.text('Клавиши:', kx + 10, y + 8, { color: '#9a9aa8' });
      (m.keys || []).forEach((k, i) => r.text(k, kx + 10, y + 20 + i * 11, { color: '#ffffff' }));
      if (this.game.state.breakdownPending) r.text('После срыва эта игра провалится автоматически!', 240, 160, { align: 'center', color: '#ff5a5a' });
      this.introMenu.draw(r, 210, 180, this.time);
      if (this.bet) r.text('X — отказаться', 240, 250, { align: 'center', color: '#9a9aa8' });
      return;
    }
    if (this.phase === 'loss' || this.phase === 'loss_talk') {
      this.drawCard(r, 'Проиграл ставку');
      const p = getPerson(this.opp);
      r.text(`${p.short} ждёт ${formatMoney(this.bet)} BYN. У тебя ${formatMoney(this.game.state.stats.money)} BYN.`, 240, 44, { align: 'center', color: '#ffffff' });
      const pt = portraitOf(this.opp, 'happy');
      if (pt) r.image(pt, 216, 60);
      if (this.phase === 'loss') {
        this.lossMenu.draw(r, 140, 124, this.time);
        r.text('«У меня нет» — могут разоблачить (аура −10). «Потом» — долг навсегда.', 240, 186, { align: 'center', color: '#9a9aa8' });
      }
      return;
    }
    if (this.phase === 'outro') {
      const res = this.res;
      this.drawCard(r, (this.forced ? 'СРЫВ: ' : '') + (RESULT_NAMES[res.result] || res.result));
      let y = 44;
      if (res.summary) { r.text(res.summary, 240, y, { align: 'center', color: '#ffffff' }); y += 14; }
      if (this.lossOutcome) {
        const o = this.lossOutcome.outcome;
        const t = { paid: 'Отдал деньги.', exposed: 'Разоблачили: аура −10, деньги всё равно отдал.', escaped: 'Прокатило — платить не надо.', truth: 'Денег правда нет.', debt: 'Долг записан. Навсегда.' }[o];
        r.text(t, 240, y, { align: 'center', color: '#ffb0b0' }); y += 14;
      }
      drawDeltas(r, this.before, this.after, y + 6);
      if (res.oppLine) r.text('«' + res.oppLine + '»', 240, 210, { align: 'center', color: '#9fd3ff' });
      r.text('Z — дальше', 240, 250, { align: 'center', color: '#9a9aa8' });
    }
  }
}

// Таблица изменений статусов «было → стало».
export function drawDeltas(r, before, after, y) {
  let row = 0;
  for (const slot of HUD_SLOTS) {
    const k = slot.key;
    const d = after[k] - before[k];
    if (!d) continue;
    const good = k === 'stress' || k === 'suspicion' || k === 'hunger' ? d < 0 : d > 0;
    const val = k === 'money' ? formatMoney(Math.abs(d)) + ' BYN' : Math.abs(d);
    r.text(slot.label, 150, y + row * 12, { color: '#c8c8d8' });
    r.text((d > 0 ? '+' : '−') + val, 330, y + row * 12, { color: good ? '#6be36b' : '#ff6a6a', align: 'right' });
    row++;
  }
  if (after.juice !== before.juice) {
    r.text('Жижка', 150, y + row * 12, { color: '#c8c8d8' });
    r.text((after.juice > before.juice ? '+' : '−') + Math.abs(after.juice - before.juice), 330, y + row * 12, { color: '#ff6a6a', align: 'right' });
    row++;
  }
  if (!row) r.text('Статусы не изменились', 240, y, { align: 'center', color: '#9a9aa8' });
  return row;
}
