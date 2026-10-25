// «Плавание» (У-3): урок в бассейне, 4–5 минут. Заплывы на две дорожки — чередуй ← и →; Иван Владимирович
// даёт команды, уходит и возвращается. Пока его нет: Z — брызги, X — притопить друга (может застать).
// Если Рома забыл форму (params.romaBench) — урок на лавке с телефоном и репликами друзей.
import { registerMinigame } from './registry.js';
import { SwimLogic, swimBot } from './swim_logic.js';
import { Particles, Popups } from './kit.js';
import { BALANCE } from '../../data/balance.js';
import { swimSheetOf, sheetOf, getPerson } from '../gen/people.js';
import { frameRect } from '../gen/sprites.js';
import { labelLines } from '../game/dialogs.js';
import { staminaPenalty } from '../game/actions.js';
import { changeStat } from '../game/state.js';
import { GAME_H } from '../engine/renderer.js';
import { audio } from '../engine/audio.js';

const W = BALANCE.swim;
const lines = (label) => labelLines('swim', label).map((l) => ({ who: l.who, text: l.text }));

class SwimGame {
  constructor(ctx) { this.ctx = ctx; this.game = ctx.game; this.rng = ctx.rng; this.done = false; this.time = 0; this.particles = new Particles(); this.popups = new Popups(); }

  start(params) {
    const st = this.ctx.state;
    this.swimmers = params.swimmers || ['igor', 'denis', 'guza', 'matych', 'buy'];
    this.bench = params.bench || [];
    this.romaBench = !!params.romaBench;
    const hungry = st.stats.hunger > BALANCE.hunger.slowThreshold ? W.hungerStamina : 0;
    this.L = new SwimLogic(this.rng, {
      swimmers: this.swimmers, staminaMax: 1 - staminaPenalty(st) - hungry,
      duration: this.romaBench ? W.benchSeconds : (params.duration || W.duration),
    });
    if (this.romaBench) { this.L.p.swimmers = this.swimmers; this.L.staminaMax = 0; }
    this.bot = swimBot(this.L, this.rng);
    this.commands = lines('commands');
    this.benchLines = lines('bench');
    this.awayLines = lines('away');
    this.say = null; this.sayT = 0; this.phoneT = 0; this.phoneOn = false;
  }

  speak(l, t = 2.6) { if (l) { this.say = l; this.sayT = t; } }

  update(dt, input) {
    this.time += dt;
    this.particles.update(dt); this.popups.update(dt);
    if (this.sayT > 0) this.sayT -= dt;
    const L = this.L;
    let inp;
    if (this.romaBench) inp = {};
    else if (this.autoplay) inp = this.bot(dt);
    else inp = { left: input.pressed('left'), right: input.pressed('right'), splash: input.pressed('confirm'), dunk: input.pressed('back') };
    L.update(dt, inp);
    if (this.romaBench) this.updateBench(dt, input);
    for (const e of L.events) {
      if (e.type === 'heat') { audio.play('whistle'); if (this.commands.length) this.speak(this.commands[L.command % this.commands.length]); }
      if (e.type === 'heat_end') { this.popups.add(240, 60, e.place === 1 ? 'Первый!' : `${e.place}-е место`, e.place === 1 ? '#6be36b' : '#ffffff'); audio.play(e.place === 1 ? 'statUp' : 'menuMove'); }
      if (e.type === 'overtake') this.popups.add(120, 90, `Обогнал: ${getPerson(e.id).short}!`, '#ffe14d');
      if (e.type === 'ivan_away') { audio.play('door'); this.speak(this.awayLines[this.rng.int(0, Math.max(0, this.awayLines.length - 1))]); }
      if (e.type === 'ivan_back') audio.play('whistle');
      if (e.type === 'splash') { audio.play('kick'); for (let i = 0; i < 8; i++) this.particles.burst(200, 120, 1, { color: '#cfe8f7', speed: 60, angle: -Math.PI / 2, spread: 1.2, gravity: 200, life: 0.6, size: 2 }); }
      if (e.type === 'dunk') { audio.play('hit'); this.popups.add(200, 100, 'Притопил Игоря!', '#9fd3ff'); }
      if (e.type === 'caught') { audio.play('menuDenied'); this.game.r.shake(3, 0.3); this.speak({ who: 'ivan', text: 'Ковган! Я всё видел! Ещё раз — и будешь мыть бортик зубной щёткой.' }); }
    }
    L.events = [];
    if (L.finished) this.done = true;
  }

  // Урок на лавке: Z — залипнуть в телефон (тратит батарею), друзья кричат из воды.
  updateBench(dt, input) {
    const st = this.ctx.state;
    this.phoneOn = this.autoplay ? this.time % 10 < 6 : input.held('confirm');
    if (this.phoneOn && st.stats.battery > 0) {
      this.phoneT += dt;
      if (this.phoneT >= 3) { this.phoneT = 0; changeStat(st, 'battery', -1); changeStat(st, 'stress', -1); }
    }
    this.benchT = (this.benchT || 0) + dt;
    if (this.benchT > 7 && this.benchLines.length) { this.benchT = 0; this.speak(this.benchLines[this.rng.int(0, this.benchLines.length - 1)], 3.5); }
  }

  forfeit() { this.L.finished = true; return this.end(); }

  end() {
    const L = this.L;
    if (this.romaBench) return { result: 'draw', deltas: { stress: -2 }, money: 0, summary: 'Весь урок на лавке. Форма осталась дома.' };
    const d = L.deltas();
    const wins = L.wins();
    return {
      result: wins >= Math.ceil(L.heats.length / 2) ? 'win' : wins ? 'draw' : 'lose',
      deltas: d, money: 0,
      extra: { heats: L.heats.length, wins, overtakes: L.overtakes, splashes: L.splashes, dunks: L.dunks },
      summary: `Заплывов: ${L.heats.length}, побед: ${wins} · обогнал Игоря ${L.overtakes.igor}, Дениса ${L.overtakes.denis}`,
    };
  }

  draw(r) {
    const L = this.L;
    r.rect(0, 0, 480, GAME_H, '#cfd8de');
    // бортик и вода
    const top = 34, laneH = 26, n = 1 + this.swimmers.length;
    r.rect(0, top - 6, 480, 6, '#9aa3ad');
    r.rect(0, top, 480, laneH * n, '#3a8ac8');
    for (let i = 0; i < n; i++) {
      const y = top + i * laneH;
      for (let x = 0; x < 480; x += 8) r.rect(x + Math.round(Math.sin(this.time * 2 + i + x) * 2), y + 4 + (x % 16 ? 0 : 1), 5, 1, '#5aa8e0');
      if (i) for (let x = 0; x < 480; x += 6) r.rect(x, y - 1, 3, 2, x % 12 ? '#e8e8e8' : '#d23a3a');
    }
    r.rect(36, top, 2, laneH * n, '#ffe14d'); r.rect(440, top, 2, laneH * n, '#ffe14d');
    const H = L.heat;
    const ids = this.romaBench ? this.swimmers : ['roma', ...this.swimmers];
    ids.forEach((id, i) => {
      const y = top + i * laneH + 2;
      const lane = H ? H.lanes.find((l) => l.id === id) : null;
      // туда (вправо) и обратно — две дорожки
      const k = lane ? lane.x / W.distance : 0;
      const forward = k < 0.5;
      const x = forward ? 40 + k * 2 * 390 : 430 - (k - 0.5) * 2 * 390;
      const sh = swimSheetOf(id);
      const f = frameRect(forward ? 'right' : 'left', H && !(lane && lane.done) ? Math.floor(this.time * 8 + i) % 3 : 0);
      if (sh) r.sprite(sh, f.sx, f.sy, f.sw, Math.min(f.sh, 18), Math.round(x) - 8, y, 1);
      r.text(id === 'roma' ? 'Рома' : getPerson(id).short, 4, y + 6, { color: '#ffffff', shadow: '#000' });
    });
    // физрук у бортика
    if (L.ivanHere) {
      const sh = sheetOf('ivan'); const f = frameRect('down', 0);
      if (sh) r.sprite(sh, f.sx, f.sy, f.sw, f.sh, 452, 0, 1);
    }
    // лавка: забывшие форму (и Рома, если забыл)
    const benchY = top + laneH * n + 8;
    r.rect(20, benchY + 22, 200, 5, '#8a5a32');
    const benchIds = [...this.bench, ...(this.romaBench ? ['roma'] : [])];
    benchIds.forEach((id, i) => {
      const sh = sheetOf(id); const f = frameRect('down', 0);
      if (sh) r.sprite(sh, f.sx, f.sy, f.sw, f.sh, 30 + i * 30, benchY - 8, 1);
      if (id === 'roma' && this.phoneOn) r.rect(30 + i * 30 + 2, benchY + 8, 6, 8, '#16161a');
    });
    if (benchIds.length) r.text('Лавка (без формы)', 20, benchY + 30, { color: '#3a3a48' });
    // панель
    r.rect(0, 0, 440, 14, '#000');
    const left = Math.max(0, Math.ceil(L.duration - L.t));
    r.text(`Плавание · ${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`, 6, 3, { color: '#9fd3ff' });
    if (!this.romaBench) {
      r.text('Выносливость', 170, 3, { color: '#ffffff' });
      r.rect(240, 4, 80, 6, '#2a2a38');
      r.rect(240, 4, Math.round(80 * L.stamina), 6, L.stamina > 0.3 ? '#5ad65a' : '#ff6a5a');
      r.text(`Побед: ${L.wins()}`, 330, 3, { color: '#ffe14d' });
    }
    let hint = this.romaBench ? 'Держи Z — залипнуть в телефон' : L.phase === 'heat' ? 'Чередуй ← → — гребки!' : L.phase === 'away' ? 'Физрук ушёл! Z — брызги, X — притопить Игоря' : 'Слушай команду…';
    r.text(hint, 240, 214, { align: 'center', color: '#202028' });
    if (this.say && this.sayT > 0) {
      const who = this.say.who && getPerson(this.say.who) ? getPerson(this.say.who).short + ': ' : '';
      r.box(60, benchY + 34, 360, 22, '#ffffff', '#101018');
      r.text(who + this.say.text, 240, benchY + 40, { align: 'center', color: '#ffffff' });
    }
    this.particles.draw(r); this.popups.draw(r);
    this.game.hud.draw(r, this.ctx.state);
  }
}

registerMinigame('swim', {
  title: 'Плавание',
  music: 'minigame',
  keys: ['Чередуй ← и → — гребки (одна и та же сторона — слабо)', 'Выносливость тратится — давай отдохнуть', 'Физрук ушёл: Z — брызги, X — притопить друга', 'Обгони Игоря и Дениса'],
  describe: (p) => (p && p.romaBench ? 'Форму забыл. Урок на лавке.' : 'Четверг. Две дорожки кролем.'),
  create: (ctx) => new SwimGame(ctx),
});
