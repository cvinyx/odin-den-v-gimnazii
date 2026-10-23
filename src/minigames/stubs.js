// ВРЕМЕННАЯ «запаска» футбола (этап 3). Тот же интерфейс start/update/draw/end: короткий диалог с выбором
// и случайным результатом по балансу (BALANCE.stubs). Заменится настоящим матчем на этапе 5.
import { registerMinigame } from './registry.js';
import { DialogBox } from '../ui/dialog.js';
import { ChoiceMenu } from '../ui/choice.js';
import { getDialog, labelLines } from '../game/dialogs.js';
import { getPerson, portraitOf, NARRATOR, sheetOf } from '../gen/people.js';
import { frameRect } from '../gen/sprites.js';
import { BALANCE } from '../../data/balance.js';
import { GAME_H } from '../engine/renderer.js';
import { staminaPenalty } from '../game/actions.js';
import { LINEUPS } from '../../data/lessons.js';

const B = BALANCE.stubs;

class StubGame {
  constructor(ctx, id) { this.ctx = ctx; this.game = ctx.game; this.rng = ctx.rng; this.id = id; this.done = false; this.time = 0; }

  start() {
    const d = getDialog('stubs');
    const cmds = d.labels[this.id].cmds;
    this.intro = cmds.filter((c) => c.type === 'say');
    const ch = cmds.find((c) => c.type === 'choice');
    this.question = ch.question;
    this.optionsAll = ch.options.map((o, i) => ({ text: o.text, index: i, cond: o.cond }));
    this.box = new DialogBox(this.game);
    this.queue = [...this.intro];
    this.mode = 'say';
    this.showNext();
  }

  say(l) {
    const who = l.who;
    this.box.show(getPerson(who) || NARRATOR, who === 'narrator' ? null : portraitOf(who, l.emo), l.text);
  }

  showNext() {
    const l = this.queue.shift();
    if (l) { this.mode = 'say'; this.say(l); return; }
    if (!this.result) {
      this.options = this.optionsAll;
      this.choice = new ChoiceMenu(this.question, this.options.map((o) => ({ text: o.text })));
      this.mode = 'choose';
    } else this.done = true;
  }

  // Выбор варианта (используют и бот, и игрок).
  pick(i) {
    const opt = this.options[i].index;
    this.choice = null;
    this.result = this.resolve(opt);
    const lines = labelLines('stubs', this.id + '_' + this.result.result);
    const pickLine = lines.length ? [this.rng.pick(lines)] : [];
    this.queue = [...(this.result.lines || []), ...pickLine];
    this.showNext();
  }

  resolve(opt) {
    const st = this.ctx.state;
    const r = this.rng;
    const d = {};
    {
      const F = B.football;
      const o = F.options[opt];
      let p = F.baseWin + o.win - staminaPenalty(st) * 0.3;
      if (st.flags.igorBerserk) p += F.berserkWin;
      if (st.stats.hunger > BALANCE.hunger.slowThreshold) p += F.hungryWin;
      const roll = r.next();
      const res = roll < p ? 'win' : roll < p + F.drawChance ? 'draw' : 'lose';
      const goals = r.int(o.goals[0], o.goals[1]);
      const R = BALANCE.football[res];
      d.aura = R.aura + goals * BALANCE.football.goalAura;
      if (R.stress) d.stress = R.stress;
      d.hunger = BALANCE.hunger.perFootball;
      // счёт: голы Ромы входят в голы «ИнЯза»
      let ours = goals + r.int(0, 2), theirs = r.int(0, 3);
      if (res === 'win' && ours <= theirs) ours = theirs + 1;
      if (res === 'lose' && theirs <= ours) theirs = ours + 1;
      if (res === 'draw') theirs = ours;
      st.flags.matchResult = res === 'win' ? 1 : res === 'lose' ? -1 : 0;
      st.flags.matchScore = `${ours}:${theirs}`;
      st.flags.romaGoals = goals;
      const lines = [];
      if (r.chance(BALANCE.football.diarrheaChance)) {
        st.flags.smileDiarrhea = true;
        lines.push(...labelLines('stubs', 'football_diarrhea'));
      }
      lines.push({ type: 'say', who: 'narrator', emo: 'norm', text: `Счёт: «ИнЯз» ${ours} : ${theirs} «Физмат». Голов Ромы: ${goals}.` });
      const grade = BALANCE.football.gradeBase + goals + (res === 'win' ? BALANCE.football.gradeWinBonus : 0);
      return { result: res, deltas: d, grade, lines, summary: `«ИнЯз» ${ours} : ${theirs} «Физмат»` };
    }
  }

  update(dt, input) {
    this.time += dt;
    if (this.mode === 'say') {
      if (this.box.update(dt, input)) this.showNext();
    } else if (this.mode === 'choose') {
      const i = this.choice.update(dt, input);
      if (i >= 0) this.pick(i);
    }
  }

  forfeit() {
    // срыв: худший исход
    this.ctx.state.flags.matchResult = -1;
    return { result: 'lose', deltas: {}, grade: BALANCE.football.gradeBase };
  }

  end() {
    const r = this.result || { result: 'lose', deltas: {} };
    return { result: r.result, deltas: r.deltas, money: 0, grade: r.grade, summary: r.summary || '(временная версия мини-игры)' };
  }

  draw(r) {
    r.rect(0, 0, 480, GAME_H, '#15131f');
    drawPitch(r, this.time);
    r.text('ВРЕМЕННАЯ ВЕРСИЯ', 474, 4, { align: 'right', color: '#9a9aa8' });
    this.box.draw(r);
    if (this.mode === 'choose') this.choice.draw(r);
    this.game.hud.draw(r, this.ctx.state);
  }
}

function drawPitch(r, t) {
  r.rect(20, 10, 440, 150, '#c89a5a');
  r.frame(20, 10, 440, 150, '#f4f4f4', 2);
  r.rect(239, 10, 2, 150, '#f4f4f4');
  r.rect(20, 60, 8, 50, '#e8e8e8'); r.rect(452, 60, 8, 50, '#e8e8e8');
  const teams = [[LINEUPS.inyaz.keeper, ...LINEUPS.inyaz.field], [LINEUPS.fizmat.keeper, ...LINEUPS.fizmat.field]];
  teams.forEach((team, side) => team.forEach((id, i) => {
    const sh = sheetOf(id);
    const f = frameRect(side ? 'left' : 'right', Math.floor(t * 6 + i) % 3);
    const x = side ? 400 - (i ? 60 + i * 30 : 0) : 40 + (i ? 60 + i * 30 : 0);
    const y = 40 + ((i * 37) % 90) + Math.round(Math.sin(t * 2 + i) * 4);
    r.sprite(sh, f.sx, f.sy, f.sw, f.sh, x, y);
  }));
  r.rect(236 + Math.round(Math.sin(t * 3) * 60), 80, 6, 6, '#ffffff');
}

for (const [id, title, keys] of [
  ['football', 'Эль-Класико', ['↑↓ — выбрать тактику, Z — решить', 'Временная версия: настоящий матч — этап 5']],
]) {
  registerMinigame(id, { title, keys, stub: true, music: id === 'football' ? 'gym' : 'minigame', describe: () => 'Временная версия мини-игры.', create: (ctx) => new StubGame(ctx, id) });
}
