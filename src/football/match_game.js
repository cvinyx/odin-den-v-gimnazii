// «Эль-Класико» как мини-игра урока 5 (интерфейс start/update/draw/end, реестр мини-игр).
// Логика — match.js, здесь: управление Ромой, отрисовка зала, табло, судья с облачками,
// «ГОЛ!», перерыв со сценкой (DialogScene), режим «ИИ против ИИ» и ускорение ×4 (отладка).
import { registerMinigame } from '../minigames/registry.js';
import { Particles, Popups, vrand } from '../minigames/kit.js';
import { MatchLogic } from './match.js';
import { FIELD, TEAM_NAMES, TEAM_COLORS } from './field.js';
import { BALANCE } from '../../data/balance.js';
import { staminaPenalty } from '../game/actions.js';
import { labelLines } from '../game/dialogs.js';
import { getPerson, sheetOf } from '../gen/people.js';
import { frameRect } from '../gen/sprites.js';
import { DialogScene } from '../scenes/dialog_scene.js';
import { GAME_H } from '../engine/renderer.js';
import { audio } from '../engine/audio.js';

const B = BALANCE.football;
const HT_FLAGS = { ht_barca: 'barca', ht_real: 'real', ht_igor: 'igor', ht_none: 'none' };

function dirName(dx, dy) { return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'); }

export class FootballGame {
  constructor(ctx) {
    this.ctx = ctx; this.game = ctx.game; this.rng = ctx.rng;
    this.done = false; this.time = 0;
    this.particles = new Particles(); this.popups = new Popups();
    this.bubbles = [];   // { id, text, t }
    this.banner = null;  // { text, t, color }
    this.power = null;   // сила удара (удержание C)
  }

  start(params) {
    const st = this.ctx.state;
    this.params = params;
    this.speed = params.speed || 1;
    this.L = new MatchLogic(this.rng, {
      aiRoma: !!params.aiRoma,
      hungry: st.stats.hunger > BALANCE.hunger.slowThreshold,
      staminaMax: 1 - staminaPenalty(st),
      rageStart: !!st.flags.igorRage,
      diarrhea: params.diarrhea ?? null,
    });
    if (params.diarrheaSoon && this.L.diarrheaAt != null) this.L.diarrheaAt = 3;
    this.banner = { text: 'ЭЛЬ-КЛАСИКО!', t: 0, color: '#ffe14d' };
  }

  get logic() { return { t: this.L.total, duration: B.halfSeconds * 2 }; } // для полоски урока

  // ---------- Ввод Ромы ----------
  romaInput(input) {
    const ax = input.axis();
    const inp = { ax: ax.x, ay: ax.y, sprint: input.held('run'), pass: input.pressed('confirm'), tackle: input.pressed('back'), shoot: null };
    if (input.held('action2')) this.power = Math.min(1, (this.power ?? 0) + 1 / 60 / 0.9);
    else if (this.power != null) { inp.shoot = this.power; this.power = null; }
    if (inp.tackle) input.consume('back');
    return inp;
  }

  update(dt, input) {
    this.time += dt;
    const L = this.L;
    const auto = this.autoplay || this.params.aiRoma;
    if (auto) L.p.aiRoma = true;
    const steps = this.speed;
    for (let i = 0; i < steps; i++) {
      L.update(dt, auto ? null : this.romaInput(input));
      this.handleEvents();
      if (L.state === 'halftime' || L.state === 'end') break;
    }
    this.particles.update(dt); this.popups.update(dt);
    for (const b of this.bubbles) b.t += dt;
    this.bubbles = this.bubbles.filter((b) => b.t < 2.2);
    if (this.banner) { this.banner.t += dt; if (this.banner.t > 2.2) this.banner = null; }
    if (L.state === 'halftime' && !this.htShown) this.halftime();
    if (L.state === 'end' && !this.endT) { this.endT = this.time; audio.play('whistle'); this.banner = { text: 'ФИНАЛЬНЫЙ СВИСТОК', t: 0, color: '#ffffff' }; }
    if (this.endT && this.time - this.endT > 2) this.done = true;
  }

  bubble(id, label) {
    const ls = labelLines('football', label);
    if (!ls.length) return;
    this.bubbles = this.bubbles.filter((b) => b.id !== id);
    this.bubbles.push({ id, text: this.rng.pick(ls).text.replace(/\{\/?\w+\}/g, ''), t: 0 });
  }

  handleEvents() {
    const L = this.L;
    for (const e of L.events) {
      switch (e.type) {
        case 'kick': case 'shot': audio.play('kick'); break;
        case 'whistle': audio.play('whistle'); break;
        case 'goal': {
          audio.play('goal');
          this.game.r.shake(5, 0.6);
          this.banner = { text: 'ГОЛ!', t: 0, color: TEAM_COLORS[e.team], big: true };
          const b = L.ball;
          this.particles.burst(b.x, b.y, 40, { color: '#ffe14d', speed: 120, life: 1.2 });
          this.particles.burst(b.x, b.y, 30, { color: TEAM_COLORS[e.team], speed: 90, life: 1.2 });
          if (e.scorer) { this.bubble(e.scorer, 'goal_' + e.scorer); this.popups.add(240, 60, getPerson(e.scorer).short + '!', '#ffffff'); }
          break;
        }
        case 'save': audio.play('hit'); this.popups.add(L.ball.x, L.ball.y - 12, 'Сейв!', '#9fd3ff'); break;
        case 'foul': audio.play('whistle'); this.bubble('ivan', 'ref_foul'); this.popups.add(L.ball.x, L.ball.y - 14, 'Фол!', '#ff6a6a'); break;
        case 'yellow': this.yellowFor = { id: e.id, t: this.time }; this.bubble('ivan', 'ref_yellow'); break;
        case 'steal': audio.play('hit'); break;
        case 'diarrhea':
          audio.play('tummy'); this.game.r.shake(3, 0.5);
          this.bubble('smile', 'diarrhea');
          this.banner = { text: 'Смайл убегает с поля!', t: 0, color: '#c8a060' };
          break;
        case 'keeper_in': this.bubble('ivan', 'keeper_in_' + e.id); audio.play('whistle'); break;
        case 'rage':
          audio.play('igorLaugh'); this.game.r.shake(4, 0.5);
          this.banner = { text: 'ЯРОСТЬ ИГОРЯ!', t: 0, color: '#ff4a4a' };
          this.bubble('igor', 'rage');
          break;
        case 'sub': this.popups.add(240, 40, `Замена: ${getPerson(e.in).short} вместо ${getPerson(e.out).short}`, '#ffffff'); break;
        case 'ref': this.bubble('ivan', 'ref_' + e.id); break;
        case 'halftime': audio.play('whistle'); break;
        default:
      }
    }
    L.events.length = 0;
  }

  // Перерыв: сценка-спор, выбор Ромы → эффект на 2-й тайм.
  halftime() {
    this.htShown = true;
    const st = this.ctx.state;
    for (const f of Object.keys(HT_FLAGS)) st.flags[f] = false;
    const finish = () => {
      let choice = Object.keys(HT_FLAGS).find((f) => st.flags[f]);
      choice = choice ? HT_FLAGS[choice] : 'none';
      st.flags.halftimeChoice = choice;
      this.L.secondHalf(choice);
      this.handleEvents();
      this.banner = { text: '2-Й ТАЙМ', t: 0, color: '#ffe14d' };
    };
    if (this.params.aiRoma && this.params.skipHalftime) { st.flags['ht_' + this.rng.pick(['barca', 'real', 'igor', 'none'])] = true; return finish(); }
    this.game.scenes.push(new DialogScene('football', 'halftime', { onEnd: finish }));
  }

  forfeit() {
    // срыв: Рома весь матч «не в игре» — засчитываем поражение
    this.L.score.fizmat = Math.max(this.L.score.fizmat, this.L.score.inyaz + 1);
    this.L.state = 'end';
    return this.end();
  }

  end() {
    const L = this.L;
    const st = this.ctx.state;
    const res = L.result();
    const goals = L.roma.goals;
    const R = B[res];
    const d = { aura: R.aura + goals * B.goalAura, hunger: BALANCE.hunger.perFootball };
    if (R.stress) d.stress = R.stress;
    st.flags.matchResult = res === 'win' ? 1 : res === 'lose' ? -1 : 0;
    st.flags.matchScore = `${L.score.inyaz}:${L.score.fizmat}`;
    st.flags.romaGoals = goals;
    st.flags.smileDiarrhea = !!L.smileGone;
    st.flags.kolyaConceded = L.stats.kolyaConceded;
    st.flags.matchFouls = L.stats.fouls;
    st.flags.romaYellow = L.roma.yellow;
    const grade = Math.min(10, B.gradeBase + goals + (res === 'win' ? B.gradeWinBonus : 0));
    return {
      result: res, deltas: d, money: 0, grade,
      extra: { score: { ...L.score }, goals, stats: L.stats },
      summary: `${TEAM_NAMES.inyaz} ${L.score.inyaz} : ${L.score.fizmat} ${TEAM_NAMES.fizmat} · голов Ромы: ${goals}`,
    };
  }

  // ---------- Отрисовка ----------
  draw(r) {
    const L = this.L;
    r.rect(0, 0, 480, GAME_H, '#2a2230');
    this.drawHall(r);
    // игроки и судья — по глубине (y)
    const actors = [...L.players.filter((q) => !q.out || q.out === 'run').map((q) => ({ q, y: q.y })), { ref: true, y: L.ref.y }];
    actors.sort((a, b) => a.y - b.y);
    for (const a of actors) if (a.ref) this.drawRef(r); else this.drawPlayer(r, a.q);
    this.drawBall(r);
    this.particles.draw(r);
    this.drawBubbles(r);
    this.drawBoard(r);
    this.popups.draw(r);
    if (this.banner) {
      const b = this.banner;
      const k = Math.min(1, b.t * 5);
      const scale = b.big ? 6 : 3;
      r.alpha(Math.min(1, (2.2 - b.t) * 2), () => r.text(b.text, 240 + (b.big ? Math.round(Math.sin(b.t * 40) * 2) : 0), 96 - (1 - k) * 30, { align: 'center', color: b.color, scale, shadow: '#000' }));
    }
    if (L.state === 'kickoff') r.text('Z — пас, C — удар (держи), X — отбор, Shift — рывок', 240, 214, { align: 'center', color: '#ffffff', shadow: '#000' });
    this.game.hud.draw(r, this.ctx.state);
  }

  drawHall(r) {
    const F = FIELD;
    // паркет
    r.rect(F.left, F.top, F.w, F.h, '#c8995a');
    for (let x = F.left; x < F.right; x += 22) r.rect(x, F.top, 1, F.h, '#b98a4e');
    for (let y = F.top + 8; y < F.bottom; y += 16) r.rect(F.left, y, F.w, 1, '#bf9054');
    // разметка
    const line = '#f4f0e6';
    r.frame(F.left + 2, F.top + 2, F.w - 4, F.h - 4, line, 1);
    r.rect(F.cx, F.top + 2, 1, F.h - 4, line);
    for (let a = 0; a < 40; a++) { const t = a / 40 * Math.PI * 2; r.rect(Math.round(F.cx + Math.cos(t) * 22), Math.round(F.cy + Math.sin(t) * 22), 1, 1, line); }
    r.rect(F.cx - 1, F.cy - 1, 3, 3, line);
    for (const [gx, s] of [[F.left, 1], [F.right, -1]]) {
      // штрафная — полукруг
      for (let a = 0; a < 40; a++) { const t = (a / 39 - 0.5) * Math.PI; r.rect(Math.round(gx + s * Math.cos(t) * 46), Math.round(F.cy + Math.sin(t) * 46), 1, 1, line); }
    }
    // стены
    r.rect(F.left - 6, F.top - 4, F.w + 12, 4, '#6a6070');
    r.rect(F.left - 6, F.bottom, F.w + 12, 4, '#6a6070');
    r.rect(F.left - 6, F.top, 6, F.goalTop - F.top, '#6a6070');
    r.rect(F.left - 6, F.goalBottom, 6, F.bottom - F.goalBottom, '#6a6070');
    r.rect(F.right, F.top, 6, F.goalTop - F.top, '#6a6070');
    r.rect(F.right, F.goalBottom, 6, F.bottom - F.goalBottom, '#6a6070');
    // ворота с сеткой
    for (const [x0, w] of [[F.left - F.goalDepth, F.goalDepth], [F.right, F.goalDepth]]) {
      r.rect(x0, F.goalTop, w, F.goalBottom - F.goalTop, '#3a3440');
      for (let y = F.goalTop; y < F.goalBottom; y += 4) r.rect(x0, y, w, 1, '#8a8494');
      for (let x = x0; x < x0 + w; x += 4) r.rect(x, F.goalTop, 1, F.goalBottom - F.goalTop, '#8a8494');
    }
    r.rect(F.left - 2, F.goalTop - 2, 3, 3, '#ffffff'); r.rect(F.left - 2, F.goalBottom - 1, 3, 3, '#ffffff');
    r.rect(F.right - 1, F.goalTop - 2, 3, 3, '#ffffff'); r.rect(F.right - 1, F.goalBottom - 1, 3, 3, '#ffffff');
  }

  drawPlayer(r, q) {
    const sh = sheetOf(q.id);
    const dir = dirName(q.dir[0], q.dir[1]);
    const f = frameRect(dir, q.moving ? 1 + (Math.floor(q.anim * 6) % 2) : 0);
    const x = Math.round(q.x), y = Math.round(q.y);
    // «манишка» под ногами — цвет команды
    r.alpha(0.8, () => { r.rect(x - 6, y - 1, 12, 3, TEAM_COLORS[q.team]); r.rect(x - 4, y - 2, 8, 5, TEAM_COLORS[q.team]); });
    if (q.rage > 0) r.alpha(0.35 + 0.25 * Math.sin(this.time * 20), () => r.rect(x - 8, y - 24, 16, 24, '#ff3030'));
    r.sprite(sh, f.sx, f.sy, f.sw, f.sh, x - f.sw / 2, y - f.sh + 1);
    // цвет команды над головой (у вратаря — зелёный ободок)
    r.rect(x - 2, y - f.sh - 3, 4, 3, TEAM_COLORS[q.team]);
    if (q.keeper) r.frame(x - 3, y - f.sh - 4, 6, 5, '#6be36b', 1);
    if (q.yellow) r.rect(x + 5, y - 22, 3, 4, '#ffe14d');
    if (q === this.L.roma) {
      const bob = Math.round(Math.sin(this.time * 6));
      const my = y - f.sh - 11 + bob; r.rect(x - 3, my, 7, 2, '#ffe14d'); r.rect(x - 2, my + 2, 5, 1, '#ffe14d'); r.rect(x - 1, my + 3, 3, 1, '#ffe14d'); r.rect(x, my + 4, 1, 1, '#ffe14d');
      if (this.power != null) { r.rect(x - 10, y + 4, 20, 3, '#000'); r.rect(x - 10, y + 4, Math.round(20 * this.power), 3, this.power > 0.8 ? '#ff4a4a' : '#ffe14d'); }
    }
    if (q.out === 'run' && vrand() < 0.5) this.particles.burst(x, y - 6, 1, { color: '#a08050', speed: 12, life: 0.5, size: 2 });
  }

  drawRef(r) {
    const R = this.L.ref;
    const sh = sheetOf('ivan');
    const f = frameRect(R.dir, R.moving ? 1 + (Math.floor(R.anim * 6) % 2) : 0);
    r.sprite(sh, f.sx, f.sy, f.sw, f.sh, Math.round(R.x - f.sw / 2), Math.round(R.y - f.sh + 1));
  }

  drawBall(r) {
    const b = this.L.ball;
    const x = Math.round(b.x), y = Math.round(b.y);
    r.alpha(0.35, () => r.rect(x - 2, y + 1, 5, 2, '#000'));
    r.rect(x - 2, y - 2, 5, 5, '#ffffff'); r.rect(x - 1, y - 1, 2, 2, '#2a2a30');
  }

  drawBubbles(r) {
    const L = this.L;
    for (const b of this.bubbles) {
      const who = b.id === 'ivan' ? L.ref : L.players.find((q) => q.id === b.id && (!q.out || q.out === 'run'));
      if (!who) continue;
      const w = r.measure(b.text) + 8;
      const x = Math.max(2, Math.min(478 - w, Math.round(who.x - w / 2)));
      const y = Math.max(26, Math.round(who.y - 40));
      r.rect(x, y, w, 12, '#ffffff'); r.frame(x, y, w, 12, '#2a2430', 1);
      r.rect(Math.round(who.x), y + 12, 2, 3, '#ffffff');
      r.text(b.text, x + 4, y + 2, { color: '#2a2430' });
    }
  }

  drawBoard(r) {
    const L = this.L;
    // табло
    r.rect(150, 0, 180, 24, '#101018'); r.frame(150, 0, 180, 24, '#4a4668', 1);
    r.text(`${TEAM_NAMES.inyaz} ${L.score.inyaz} : ${L.score.fizmat} ${TEAM_NAMES.fizmat}`, 240, 3, { align: 'center', color: '#ffe14d' });
    const left = Math.max(0, B.halfSeconds - L.t);
    const s = Math.ceil(left);
    r.text(`${L.half}-й тайм  ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`, 200, 13, { align: 'center', color: '#c8c8d8' });
    // выносливость Ромы (Shift)
    r.rect(262, 15, 60, 5, '#2a2a34');
    r.rect(262, 15, Math.round(60 * L.staminaMax), 5, '#4a4a58');
    r.rect(262, 15, Math.round(60 * L.stamina), 5, L.stamina < 0.2 ? '#ff6a6a' : '#6be36b');
    // скамейки: «Физмат» слева, «ИнЯз» справа (только запасные из раздела 15)
    this.drawBench(r, 4, 'fizmat');
    this.drawBench(r, 340, 'inyaz');
    if (this.speed > 1) r.text('×' + this.speed, 474, 14, { align: 'right', color: '#6be36b' });
  }

  drawBench(r, x0, team) {
    r.rect(x0, 18, 136, 4, '#7a5a3a');
    r.text(TEAM_NAMES[team], x0 + 2, 1, { color: TEAM_COLORS[team] });
    this.L.bench[team].forEach((id, i) => {
      const sh = sheetOf(id); const f = frameRect('down', 0);
      // сидят: видна верхняя половина
      r.sprite(sh, f.sx, f.sy, f.sw, 14, x0 + 70 + i * 18, 6);
    });
  }
}

registerMinigame('football', {
  title: 'Эль-Класико',
  music: 'gym',
  keys: ['Стрелки — бег, Shift — рывок (выносливость)', 'Z — пас, C — удар (держи — сильнее)', 'X без мяча — отбор (сзади — фол!)', `2 тайма по ${B.halfSeconds} с, 5 на 5`],
  describe: () => '«ИнЯз» против «Физмата». Рома — под жёлтой стрелкой.',
  create: (ctx) => new FootballGame(ctx),
});
