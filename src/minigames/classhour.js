// «Классный час» (У-2, Р-12): пятница, последний урок. Тема по коду недели. Совместный байт учительницы:
// по очереди Игорь, Денис и Рома подкидывают фразы по теме, шкала её «закипания» растёт, она отвечает
// нейтрально-строго. Рома выбирает фразу: тихо / средне / дерзко (дерзко — сильнее, но могут выгнать за дверь).
// Закипела до конца — победа (аура). Оценки нет. Учителей можно байтить только здесь (Р-12).
import { registerMinigame } from './registry.js';
import { ClasshourLogic, classhourTopic } from './classhour_logic.js';
import { Popups } from './kit.js';
import { BALANCE } from '../../data/balance.js';
import { labelLines } from '../game/dialogs.js';
import { portraitOf, getPerson } from '../gen/people.js';
import { ChoiceMenu } from '../ui/choice.js';
import { GAME_H } from '../engine/renderer.js';
import { audio } from '../engine/audio.js';

const C = () => BALANCE.classhour;

class ClasshourGame {
  constructor(ctx) { this.ctx = ctx; this.game = ctx.game; this.rng = ctx.rng; this.done = false; this.time = 0; this.popups = new Popups(); }

  start(params) {
    const st = this.ctx.state;
    this.topic = params.topic || classhourTopic(st);
    this.L = new ClasshourLogic(this.rng, {});
    this.log = [];
    this.queue = [];
    const intro = labelLines('classhour', 'topic_' + this.topic)[0];
    if (intro) this.say(intro);
    this.friendsTurn();
  }

  say(l) { this.log.push({ who: l.who, text: l.text }); if (this.log.length > 4) this.log.shift(); }
  pickLine(label) { const ls = labelLines('classhour', label); return ls.length ? ls[this.rng.int(0, ls.length - 1)] : null; }

  friendsTurn() {
    for (const who of ['igor', 'denis']) {
      const l = this.pickLine(`${who}_${this.topic}`);
      const d = this.L.friendTurn();
      this.queue.push({ line: l, boil: d });
    }
    this.queue.push({ line: this.pickLine('reply') });
    this.phase = 'talk'; this.talkT = 0;
  }

  openMenu() {
    this.options = [1, 2, 3].map((lv) => ({ lv, line: this.pickLine(`roma_${this.topic}_${lv}`) }));
    const tag = ['(тихо)', '(средне)', '(дерзко)'];
    this.menu = new ChoiceMenu('Твоя фраза:', this.options.map((o, i) => ({ text: `${tag[i]} ${o.line ? o.line.text : '…'}` })));
    this.phase = 'choose';
  }

  choose(i) {
    const o = this.options[i];
    if (o.line) this.say(o.line);
    const d = this.L.romaTurn(o.lv);
    this.popups.add(380, 70, `+${d}`, '#ff6a5a');
    audio.play(o.lv === 3 ? 'igorLaugh' : 'menuSelect');
    if (this.L.kicked) { const k = this.pickLine('kicked'); if (k) this.queue.push({ line: k }); this.phase = 'talk'; this.talkT = 0; return; }
    if (this.L.finished) { for (const l of labelLines('classhour', this.L.result)) this.queue.push({ line: l }); this.phase = 'talk'; this.talkT = 0; return; }
    this.queue.push({ line: this.pickLine('reply') });
    this.friendsTurn();
  }

  update(dt, input) {
    this.time += dt;
    this.popups.update(dt);
    if (this.phase === 'talk') {
      this.talkT += dt;
      const skip = !this.autoplay && input.pressed('confirm');
      if (this.talkT > (this.autoplay ? 0.5 : 1.6) || skip) {
        this.talkT = 0;
        const q = this.queue.shift();
        if (q) { if (q.line) this.say(q.line); if (q.boil) this.popups.add(380, 70, `+${q.boil}`, '#ffb84a'); }
        else if (this.L.finished) this.done = true;
        else this.openMenu();
      }
    } else if (this.phase === 'choose') {
      const i = this.autoplay ? (this.rng.chance(0.3) ? 2 : 1) : this.menu.update(dt, input);
      if (i >= 0) this.choose(i);
    }
  }

  forfeit() { this.L.finished = true; this.L.result = 'lose'; return this.end(); }

  end() {
    const win = this.L.result === 'win';
    const K = C();
    return {
      result: win ? 'win' : 'lose',
      deltas: win ? { aura: K.winAura, stress: -5 } : this.L.kicked ? { aura: K.kickAura } : { aura: K.loseAura },
      money: 0, extra: { topic: this.topic, boil: this.L.boil, kicked: this.L.kicked },
      summary: win ? 'Классная закипела. Пятница!' : this.L.kicked ? 'Рому выгнали за дверь.' : `Закипание: ${this.L.boil} из 100. Непробиваемая.`,
    };
  }

  draw(r) {
    r.rect(0, 0, 480, GAME_H, '#2a3a2e');
    r.rect(40, 10, 400, 60, '#2f4a3a'); r.frame(40, 10, 400, 60, '#8a5a32', 3);
    r.text('КЛАССНЫЙ ЧАС', 240, 18, { align: 'center', color: '#e8efe8', scale: 2 });
    const titles = { belaz: 'БелАЗ', brsm: 'БРСМ', rules: 'Правила поведения', career: 'Профориентация', pdd: 'ПДД', health: 'Здоровый образ жизни' };
    r.text('Тема: ' + titles[this.topic], 240, 44, { align: 'center', color: '#e8efe8' });
    const pt = portraitOf('classteacher', this.L.boil > 70 ? 'angry' : 'norm');
    if (pt) r.image(pt, 400, 74, 64, 64);
    // шкала «закипания»
    r.text('Закипание', 300, 78, { color: '#ffffff' });
    r.rect(300, 90, 90, 8, '#1a1a22');
    r.rect(300, 90, Math.round(90 * this.L.boil / 100), 8, this.L.boil > 70 ? '#ff4a4a' : '#ffb84a');
    r.text(`Раунд ${Math.min(this.L.round + 1, this.L.rounds)}/${this.L.rounds}`, 300, 104, { color: '#9a9aa8' });
    ['igor', 'roma', 'denis'].forEach((id, i) => { const p = portraitOf(id, 'happy'); if (p) r.image(p, 20 + i * 70, 78, 56, 56); });
    // последние реплики
    this.log.forEach((l, i) => {
      const who = getPerson(l.who) ? getPerson(l.who).short : '';
      const lines = r.wrap(`${who}: ${l.text}`, 440);
      r.text(lines[0] + (lines.length > 1 ? '…' : ''), 20, 142 + i * 12, { color: l.who === 'classteacher' ? '#ffb0b0' : '#ffffff' });
    });
    if (this.phase === 'choose') this.menu.draw(r, 230);
    else r.text('Z — дальше', 240, 214, { align: 'center', color: '#9a9aa8' });
    this.popups.draw(r);
    this.game.hud.draw(r, this.ctx.state);
  }
}

registerMinigame('classhour', {
  title: 'Классный час',
  music: 'minigame',
  keys: ['Втроём с Игорем и Денисом байтите классную', 'Выбирай фразу: тихо, средне, дерзко', 'Дерзко — сильнее, но могут выгнать', 'Закипит до конца — пятница спасена'],
  describe: () => 'Пятница. Последний урок недели.',
  create: (ctx) => new ClasshourGame(ctx),
});
