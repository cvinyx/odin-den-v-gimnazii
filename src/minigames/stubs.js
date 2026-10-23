// ВРЕМЕННЫЕ «запаски» мини-игр (этап 3). Тот же интерфейс start/update/draw/end: короткий диалог с выбором
// и случайным результатом по балансу (BALANCE.stubs). Заменятся настоящими играми:
// телефонные — на этапе 4, «Душ» — на этапе 4, футбол — на этапе 5.
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
      const st = this.ctx.state;
      // без батареи телефонные варианты недоступны
      this.options = this.optionsAll.filter((o) => !(this.id.startsWith('phone') && st.stats.battery <= 0 && o.index < 2));
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
    if (this.id.startsWith('phone')) {
      const o = B.phone[opt];
      const mul = st.lessonMul || 1;
      const win = o.win == null ? null : r.chance(o.win);
      d.battery = o.battery;
      d.suspicion = Math.round(r.int(o.susp[0], o.susp[1]) * (o.susp[0] > 0 ? mul : 1));
      if (o.stress) d.stress = o.stress;
      if (win === true) d.aura = r.int(o.aura[0], o.aura[1]);
      if (win === false) d.aura = -2;
      const grade = r.int(o.grade[0], o.grade[1]);
      if (st.stats.suspicion + d.suspicion >= 100) return { result: 'director', deltas: d, grade: BALANCE.director.grade };
      return { result: win === null ? 'draw' : win ? 'win' : 'lose', deltas: d, grade };
    }
    if (this.id === 'football') {
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
    // душ
    const o = B.shower.options[opt];
    const win = r.chance(o.win);
    if (!win) d.stress = B.shower.loseStress;
    return { result: win ? 'win' : 'lose', deltas: d };
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
    const st = this.ctx.state;
    if (this.id === 'football') st.flags.matchResult = -1;
    return { result: 'lose', deltas: this.id === 'shower' ? { stress: B.shower.loseStress } : {}, grade: this.id === 'football' ? BALANCE.football.gradeBase : 4 };
  }

  end() {
    const r = this.result || { result: 'lose', deltas: {} };
    return { result: r.result, deltas: r.deltas, money: 0, grade: r.grade, summary: r.summary || '(временная версия мини-игры)' };
  }

  draw(r) {
    r.rect(0, 0, 480, GAME_H, '#15131f');
    if (this.id.startsWith('phone')) drawPhone(r, this.id, this.time);
    else if (this.id === 'football') drawPitch(r, this.time);
    else drawShower(r, this.time);
    r.text('ВРЕМЕННАЯ ВЕРСИЯ', 474, 4, { align: 'right', color: '#9a9aa8' });
    this.box.draw(r);
    if (this.mode === 'choose') this.choice.draw(r);
    this.game.hud.draw(r, this.ctx.state);
  }
}

function drawPhone(r, id, t) {
  const x = 190, y = 8;
  r.rect(x, y, 100, 150, '#1a1a1e');
  r.rect(x + 5, y + 8, 90, 134, '#20304a');
  for (let i = 0; i < 18; i++) r.rect(x + 70 - i, y + 20 + i * 3, 1, 2, '#cfe3ef');
  if (id === 'phone_blocks') {
    for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) if ((i * 3 + j * 5 + Math.floor(t * 2)) % 7 < 3) r.rect(x + 13 + i * 9, y + 30 + j * 9, 8, 8, ['#e05050', '#50a0e0', '#e0c040'][(i + j) % 3]);
  } else if (id === 'phone_brawl') {
    r.rect(x + 10, y + 30, 80, 80, '#3a6a3a');
    for (let i = 0; i < 5; i++) r.rect(x + 20 + ((i * 17 + t * 30) % 60), y + 40 + i * 14, 5, 5, i ? '#e05050' : '#ffe14d');
  } else {
    for (let i = 0; i < 3; i++) { r.rect(x + 12, y + 18 + i * 40, 76, 34, '#e8e8f0'); r.rect(x + 16, y + 22 + i * 40, 20, 20, ['#c86a3a', '#4a9a4a', '#8a5aa8'][i]); }
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

function drawShower(r, t) {
  r.rect(80, 10, 320, 150, '#dfe8ee');
  for (let i = 0; i < 5; i++) {
    const x = 110 + i * 60;
    r.rect(x, 14, 10, 6, '#9aa3ad');
    for (let k = 0; k < 6; k++) r.rect(x + 1 + k * 2, 24 + ((t * 80 + k * 13) % 40), 1, 4, '#9fd3ff');
  }
  ['roma', 'igor', 'denis', 'chernyak'].forEach((id, i) => {
    const sh = sheetOf(id);
    const f = frameRect('down', 0);
    r.sprite(sh, f.sx, f.sy, f.sw, f.sh, 108 + i * 60, 70);
  });
}

for (const [id, title, keys] of [
  ['phone_blocks', 'Телефон: блок-пазл', ['↑↓ — выбрать, Z — решить', 'Временная версия: выбор и случай']],
  ['phone_brawl', 'Телефон: аркада-броулер', ['↑↓ — выбрать, Z — решить', 'Временная версия: выбор и случай']],
  ['phone_feed', 'Телефон: лента соцсети', ['↑↓ — выбрать, Z — решить', 'Временная версия: выбор и случай']],
  ['football', 'Эль-Класико', ['↑↓ — выбрать тактику, Z — решить', 'Временная версия: настоящий матч — этап 5']],
  ['shower', 'Душ', ['↑↓ — выбрать, Z — решить', 'Временная версия: настоящая игра — этап 4']],
]) {
  registerMinigame(id, { title, keys, stub: true, music: id === 'football' ? 'gym' : 'minigame', describe: () => 'Временная версия мини-игры.', create: (ctx) => new StubGame(ctx, id) });
}
