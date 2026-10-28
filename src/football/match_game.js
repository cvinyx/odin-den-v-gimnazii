// «Эль-Класико» как мини-игра урока физры (интерфейс start/update/draw/end, реестр мини-игр).
// Логика — match.js, здесь: управление Ромой, отрисовка зала в форме команд (Ф-1), табло, судья (только
// нарушения, Ф-16), трибуна со зрителями (Ф-17), экран штрафного/пенальти (Ф-15), ярость (Ф-7), золотой
// гол (Ф-8), после матча — статистика, xG и MVP (Ф-3…Ф-5), похвала Роме и подколы (Ф-2, Ф-9).
import { registerMinigame } from '../minigames/registry.js';
import { Particles, Popups, vrand } from '../minigames/kit.js';
import { MatchLogic, fmtXG } from './match.js';
import { FIELD, TEAM_NAMES, TEAM_COLORS, TEAM_UI } from './field.js';
import { BANTER, SILENT } from '../../data/football_banter.js';
import { BALANCE } from '../../data/balance.js';
import { staminaPenalty } from '../game/actions.js';
import { labelLines } from '../game/dialogs.js';
import { getPerson, sheetOf, kitSheetOf, portraitOf } from '../gen/people.js';
import { frameRect } from '../gen/sprites.js';
import { DialogScene } from '../scenes/dialog_scene.js';
import { GAME_H } from '../engine/renderer.js';
import { audio } from '../engine/audio.js';

const B = BALANCE.football;
const HT_FLAGS = { ht_barca: 'barca', ht_real: 'real', ht_igor: 'igor', ht_none: 'none' };
const FANS = ['levonchuk', 'vanya', 'svyat', 'anosov', 'vasily']; // не играющие именные на трибуне (Ф-17)
const SP_TEXT = { goal: 'ГОЛ!', save: 'СЕЙВ!', wide: 'МИМО!', over: 'НАД ВОРОТАМИ!', wall: 'В СТЕНКУ!' };
const nameOf = (id) => (id === 'roma' ? 'Рома' : getPerson(id).short);

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
    if (params.rageSoon && this.L.rageAt) this.L.rageAt[1] = 2;
    if (params.goldenSoon) { this.L.half = 2; this.L.t = B.halfSeconds - 3; this.L.secondHalf = () => {}; }
    if (params.foulSoon) this.foulSoon = params.foulSoon; // отладка: сразу штрафной / пенальти
    this.cheerT = -9; this.cheerTeam = null;
    this.banner = { text: 'ЭЛЬ-КЛАСИКО!', t: 0, color: '#ffe14d' };
  }

  get logic() { return { t: this.L.total, duration: B.halfSeconds * 2 }; } // для полоски урока

  // ---------- Ввод Ромы ----------
  romaInput(input) {
    const ax = input.axis();
    const inp = { ax: ax.x, ay: ax.y, sprint: input.held('run'), pass: input.pressed('confirm'), tackle: input.pressed('back'), shoot: null };
    if (this.L.state === 'setpiece') { if (inp.pass) input.consume('confirm'); return inp; }
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
    if (this.post) return this.updatePost(dt, input, auto);
    if (this.foulSoon && L.state === 'play' && this.time > 1.5) {
      const iny = L.team('inyaz').filter((q) => !q.keeper), fiz = L.team('fizmat').find((q) => !q.keeper);
      const v = L.roma || iny[0];
      if (this.foulSoon === 'penalty') { v.x = FIELD.right - 30; v.y = FIELD.cy; }
      L.foul(fiz, v); this.foulSoon = null; this.handleEvents();
    }
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
    if (this.endT && this.time - this.endT > 2) this.startPost();
  }

  // ---------- После матча: статистика + xG + MVP, затем похвала и подколы ----------
  startPost() {
    const L = this.L;
    this.sum = L.summary();
    this.post = { phase: 'stats', t: 0, i: 0, lines: this.banterLines() };
    audio.play(L.result() === 'win' ? 'statUp' : 'menuMove');
  }

  updatePost(dt, input, auto) {
    const P = this.post;
    P.t += dt;
    const next = auto ? P.t > (P.phase === 'stats' ? 4 : 2.2) : input.pressed('confirm') && P.t > 0.3;
    if (!next) return;
    if (!auto) input.consume('confirm');
    P.t = 0;
    if (P.phase === 'stats') { P.phase = 'banter'; P.i = 0; if (!P.lines.length) this.done = true; return; }
    P.i++;
    if (P.i >= P.lines.length) this.done = true;
    else audio.play('menuMove');
  }

  // Похвала Роме (если забил) и подколы: победитель — проигравший — победитель — проигравший (Ф-9).
  banterLines() {
    const L = this.L, rng = this.rng, day = this.ctx.state.day;
    const sum = L.summary();
    const win = L.winner(), lose = win ? (win === 'inyaz' ? 'fizmat' : 'inyaz') : null;
    const played = (t) => L.players.filter((q) => q.team === t && q.out !== 'gone' && q.id !== 'roma' && !SILENT.includes(q.id)).map((q) => q.id);
    const speakers = { inyaz: [...new Set(played('inyaz'))], fizmat: [...new Set(played('fizmat'))] };
    // [Имя игрока] — лучший у победителей: MVP, иначе лучший бомбардир, иначе вратарь с сейвами
    const rows = win ? sum.rows[win] : [];
    const best = rows.find((r) => r.id === sum.mvp) || [...rows].sort((a, b) => (b.goals * 100 + b.assists * 10 + b.saves) - (a.goals * 100 + a.assists * 10 + a.saves))[0];
    const loserKeeper = lose ? (L.keeperOf(lose) || {}).id : null;
    const fill = (t) => t.replace('[Имя игрока]', best ? nameOf(best.id) : 'Рома').replace('%score%', `${L.score.inyaz}:${L.score.fizmat}`)
      .replace('%keeper%', loserKeeper ? nameOf(loserKeeper) : 'ваш вратарь').replace('%goals%', String(L.roma.goals));
    const used = new Set();
    const take = (pool, team, emo) => {
      const cand = pool.filter(([t, who, d]) => !used.has(t) && (!d || d === day) && (!who || speakers[team].includes(who)));
      if (!cand.length || !speakers[team].length) return null;
      const [t, who] = rng.pick(cand);
      used.add(t);
      return { who: who || rng.pick(speakers[team]), text: fill(t), emo };
    };
    const out = [];
    if (L.roma.goals > 0) out.push(take(BANTER.praise, 'inyaz', 'happy'));
    if (!win) { out.push(take(BANTER.draw, 'inyaz', 'norm'), take(BANTER.draw, 'fizmat', 'norm')); return out.filter(Boolean); }
    const losePool = [...BANTER.lose, ...BANTER['lose_' + lose]];
    out.push(take(BANTER.win, win, 'happy'), take(losePool, lose, 'angry'), take(BANTER.win, win, 'happy'), take(losePool, lose, 'angry'));
    return out.filter(Boolean);
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
          this.cheerT = this.time; this.cheerTeam = e.team;
          this.banner = { text: e.own ? 'АВТОГОЛ!' : L.half === 3 ? 'ЗОЛОТОЙ ГОЛ!' : 'ГОЛ!', t: 0, color: TEAM_UI[e.team], big: true };
          const b = L.ball;
          this.particles.burst(b.x, b.y, 40, { color: '#ffe14d', speed: 120, life: 1.2 });
          this.particles.burst(b.x, b.y, 30, { color: TEAM_COLORS[e.team], speed: 90, life: 1.2 });
          if (e.own) { this.bubble(e.own, 'own_goal_' + e.own); this.popups.add(240, 60, `${nameOf(e.own)} — в свои!`, '#ff6a6a'); }
          else if (e.scorer) { this.bubble(e.scorer, 'goal_' + e.scorer); this.popups.add(240, 60, nameOf(e.scorer) + '!' + (e.assist ? ` (пас: ${nameOf(e.assist)})` : ''), '#ffffff'); }
          break;
        }
        case 'save': audio.play('hit'); this.popups.add(L.ball.x, L.ball.y - 12, 'Сейв!', '#9fd3ff'); break;
        case 'foul': {
          // судья говорит только о нарушениях (Ф-16)
          audio.play('whistle');
          const lab = e.penalty && e.setpiece ? 'ref_penalty' : e.kind === 'hand' ? 'ref_hand' : e.setpiece ? 'ref_foul' : 'ref_play_on';
          this.bubble('ivan', lab);
          this.popups.add(L.ball.x, L.ball.y - 14, e.kind === 'hand' ? 'Рука!' : 'Фол!', '#ff6a6a');
          break;
        }
        case 'setpiece': this.banner = { text: e.penalty ? 'ПЕНАЛЬТИ!' : 'ШТРАФНОЙ!', t: 0, color: '#ffe14d' }; break;
        case 'sp_result':
          if (e.result === 'save') audio.play('hit');
          else if (e.result !== 'goal') audio.play('menuDenied');
          break;
        case 'super': audio.play('kick'); this.game.r.shake(4, 0.4); this.popups.add(L.ball.x, L.ball.y - 16, 'СУПЕРУДАР!', '#ff4a4a'); break;
        case 'rage_block': audio.play('hit'); this.popups.add(L.ball.x, L.ball.y - 14, 'Не отобрать!', '#ff4a4a'); break;
        case 'golden': audio.play('whistle'); this.banner = { text: 'ЗОЛОТОЙ ГОЛ', t: 0, color: '#ffe14d', big: true }; break;
        case 'steal': audio.play('hit'); break;
        case 'diarrhea':
          audio.play('tummy'); this.game.r.shake(3, 0.5);
          this.bubble('smile', 'diarrhea');
          this.banner = { text: 'Смайл убегает с поля!', t: 0, color: '#c8a060' };
          break;
        case 'keeper_in': this.bubble(e.id, 'keeper_in_' + e.id); this.popups.add(240, 50, `${nameOf(e.id)} — в ворота`, '#ffffff'); audio.play('whistle'); break;
        case 'rage':
          audio.play('igorLaugh'); this.game.r.shake(4, 0.5);
          this.banner = { text: 'ЯРОСТЬ ИГОРЯ!', t: 0, color: '#ff4a4a', shake: true };
          this.bubble('igor', 'rage');
          break;
        case 'sub': this.popups.add(240, 40, `Замена: ${getPerson(e.in).short} вместо ${getPerson(e.out).short}`, '#ffffff'); break;
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
    const sum = L.summary();
    st.flags.matchMVP = sum.mvp;
    // отметки за физру нет (У-6)
    return {
      result: res, deltas: d, money: 0,
      extra: { score: { ...L.score }, goals, stats: L.stats, mvp: sum.mvp, xg: sum.xg, golden: L.half === 3 },
      summary: `${TEAM_NAMES.inyaz} ${L.score.inyaz} : ${L.score.fizmat} ${TEAM_NAMES.fizmat} · голов Ромы: ${goals} · MVP: ${nameOf(sum.mvp)}`,
    };
  }

  // ---------- Отрисовка ----------
  draw(r) {
    const L = this.L;
    if (this.post) return this.drawPost(r);
    if (L.state === 'setpiece' && L.sp) return this.drawSetPiece(r);
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
    this.drawBanner(r);
    if (L.state === 'kickoff' && L.total < 3) r.text('Z — пас, C — удар (держи), X — отбор, Shift — рывок', 240, 60, { align: 'center', color: '#ffffff', shadow: '#000' });
    this.game.hud.draw(r, this.ctx.state);
  }

  drawBanner(r) {
    if (!this.banner) return;
    const b = this.banner;
    const k = Math.min(1, b.t * 5);
    const scale = b.big ? 6 : 3;
    const dx = b.big ? Math.round(Math.sin(b.t * 40) * 2) : b.shake ? Math.round((vrand() - 0.5) * 6) : 0;
    const dy = b.shake ? Math.round((vrand() - 0.5) * 4) : 0;
    r.alpha(Math.min(1, (2.2 - b.t) * 2), () => r.text(b.text, 240 + dx, 96 - (1 - k) * 30 + dy, { align: 'center', color: b.color, scale, shadow: '#000' }));
  }

  // ---------- Экран штрафного / пенальти (Ф-15) ----------
  drawSetPiece(r) {
    const L = this.L, sp = L.sp, S = B.setPiece;
    const gx = (a) => 240 + a * 90; // −1…1 — створ ворот
    r.rect(0, 0, 480, GAME_H, '#5a5468');
    for (let x = 0; x < 480; x += 24) r.rect(x, 0, 1, 150, '#655f74');
    r.rect(0, 150, 480, GAME_H - 150, '#c8995a');
    for (let y = 156; y < GAME_H; y += 12) r.rect(0, y, 480, 1, '#bf9054');
    // ворота спереди: штанги, перекладина, сетка
    r.rect(gx(-1) - 3, 56, 3, 96, '#ffffff'); r.rect(gx(1), 56, 3, 96, '#ffffff'); r.rect(gx(-1) - 3, 53, 186, 3, '#ffffff');
    for (let x = gx(-1); x < gx(1); x += 6) r.rect(x, 56, 1, 94, '#8a8494');
    for (let y = 60; y < 150; y += 6) r.rect(gx(-1), y, 180, 1, '#8a8494');
    // вратарь: смещается к точке прыжка
    const k = sp.keeper;
    let kx = 240;
    if (sp.phase === 'kick' || sp.phase === 'result') kx = 240 + (gx(sp.dive) - 240) * Math.min(1, (sp.phase === 'result' ? 1 : sp.t / 0.4));
    if (k) { const sh = kitSheetOf(k.id, TEAM_COLORS[k.team]); const f = frameRect('down', 0); r.sprite(sh, f.sx, f.sy, f.sw, f.sh, Math.round(kx - f.sw), 150 - f.sh * 2, 2); }
    // стенка на штрафном: полевые обороняющейся команды
    if (!sp.penalty && k) {
      const wall = L.team(k.team).filter((q) => !q.keeper).slice(0, 3);
      const f = frameRect('down', 0);
      wall.forEach((q, i) => r.sprite(kitSheetOf(q.id, TEAM_COLORS[q.team]), f.sx, f.sy, f.sw, f.sh, 186 + i * 36, 172 - f.sh * 2, 2));
    }
    // мяч и бьющий
    let bx = 240, by = 214, bs = 6;
    if (sp.phase === 'kick' || sp.phase === 'result') {
      const t = sp.phase === 'result' ? 1 : Math.min(1, sp.t / 0.5);
      const ty = sp.result === 'over' ? 34 : 140 - sp.power * 70;
      bx = 240 + (gx(sp.aimReal) - 240) * t; by = 214 + (ty - 214) * t; bs = 6 - t * 3;
    }
    const shr = kitSheetOf(sp.shooter.id, TEAM_COLORS[sp.team]); const fr = frameRect('up', 0);
    r.sprite(shr, fr.sx, fr.sy, fr.sw, fr.sh, 250, 234 - fr.sh * 2, 2);
    r.rect(Math.round(bx - bs / 2), Math.round(by - bs / 2), Math.round(bs), Math.round(bs), '#ffffff'); r.frame(Math.round(bx - bs / 2), Math.round(by - bs / 2), Math.round(bs), Math.round(bs), '#2a2430', 1);
    // заголовок
    r.rect(0, 0, 480, 26, '#101018');
    r.text(`${sp.penalty ? 'ПЕНАЛЬТИ' : 'ШТРАФНОЙ'} · бьёт ${nameOf(sp.shooter.id)} (${TEAM_NAMES[sp.team]})${k ? ' · на воротах ' + nameOf(k.id) : ''}`, 240, 4, { align: 'center', color: '#ffe14d' });
    r.text(`${TEAM_NAMES.inyaz} ${L.score.inyaz} : ${L.score.fizmat} ${TEAM_NAMES.fizmat} · время стоит`, 240, 15, { align: 'center', color: '#c8c8d8' });
    // бегунок направления
    const human = L.spHuman();
    const aim = sp.aim ?? (sp.phase === 'aim' ? L.spAim(sp.aimT) : 0);
    r.rect(gx(-S.aimRange), 160, gx(S.aimRange) - gx(-S.aimRange), 6, '#5a2020'); r.rect(gx(-1), 160, 180, 6, '#2a6a2a');
    if (sp.phase !== 'ready') { r.rect(Math.round(gx(aim)) - 1, 156, 3, 14, '#ffe14d'); }
    // бегунок силы
    const pw = sp.power ?? (sp.phase === 'power' ? L.spPower(sp.powT) : 0);
    r.rect(400, 60, 10, 100, '#2a2a34'); r.rect(400, 60, 10, Math.round(100 * (1 - S.overPower)), '#5a2020');
    r.rect(400, 160 - Math.round(100 * pw), 10, Math.round(100 * pw), pw > S.overPower ? '#ff4a4a' : '#ffe14d');
    r.text('Сила', 405, 164, { align: 'center', color: '#ffffff', shadow: '#000' });
    let hint = '';
    if (sp.phase === 'ready') hint = 'Свисток…';
    else if (sp.phase === 'aim') hint = human ? 'Z — выбрать направление (зелёное — створ)' : `${nameOf(sp.shooter.id)} целится…`;
    else if (sp.phase === 'power') hint = human ? 'Z — выбрать силу (красное — выше ворот)' : `${nameOf(sp.shooter.id)} разбегается…`;
    if (hint) r.text(hint, 240, 32, { align: 'center', color: '#ffffff', shadow: '#000' });
    if (sp.phase === 'result') r.text(SP_TEXT[sp.result], 240, 90, { align: 'center', color: sp.result === 'goal' ? '#ffe14d' : '#ffffff', scale: 4, shadow: '#000' });
    this.drawBanner(r);
    this.game.hud.draw(r, this.ctx.state);
  }

  // ---------- После матча ----------
  drawPost(r) {
    const L = this.L, P = this.post, sum = this.sum;
    r.rect(0, 0, 480, GAME_H, '#1c1824');
    r.text(`${TEAM_NAMES.inyaz} ${L.score.inyaz} : ${L.score.fizmat} ${TEAM_NAMES.fizmat}`, 240, 6, { align: 'center', color: '#ffe14d', scale: 2 });
    r.text(`xG  ${fmtXG(sum.xg.inyaz)} — ${fmtXG(sum.xg.fizmat)}${L.half === 3 ? '  · золотой гол' : ''}`, 240, 24, { align: 'center', color: '#c8c8d8' });
    if (P.phase === 'stats') {
      for (const [t, x0] of [['inyaz', 24], ['fizmat', 252]]) {
        r.text(TEAM_NAMES[t], x0, 40, { color: TEAM_UI[t] });
        r.text('Г   П   С', x0 + 150, 40, { color: '#9a9aa8' });
        sum.rows[t].forEach((row, i) => {
          const y = 54 + i * 13;
          const mvp = row.id === sum.mvp;
          r.text((mvp ? '★ ' : '') + nameOf(row.id) + (row.keeper ? ' (вр.)' : ''), x0, y, { color: mvp ? '#ffe14d' : row.id === 'roma' ? '#ffffff' : '#d8d8e0' });
          r.text(row.keeper ? `—   —   ${row.saves}` : `${row.goals}   ${row.assists}   —`, x0 + 150, y, { color: '#ffffff' });
        });
      }
      r.text('Г — голы, П — передачи (ассисты), С — сейвы', 240, 160, { align: 'center', color: '#9a9aa8' });
      r.text(`MVP матча: ${nameOf(sum.mvp)}`, 240, 176, { align: 'center', color: '#ffe14d', scale: 2 });
      r.text('Z — дальше', 240, 214, { align: 'center', color: '#9a9aa8' });
    } else {
      const l = P.lines[P.i];
      if (l) {
        const team = L.players.find((q) => q.id === l.who)?.team;
        const pt = portraitOf(l.who, l.emo);
        r.box(20, 60, 440, 100, team ? TEAM_UI[team] : '#ffffff', '#101018');
        if (pt) r.image(pt, 30, 72, 72, 72);
        r.text(nameOf(l.who) + (team ? ' · ' + TEAM_NAMES[team] : ''), 112, 72, { color: team ? TEAM_UI[team] : '#ffffff' });
        r.wrap(l.text.replace(/\{\/?\w+\}/g, ''), 330).slice(0, 6).forEach((s, i) => r.text(s, 112, 88 + i * 12, { color: '#ffffff' }));
      }
      r.text(`${P.i + 1}/${P.lines.length} · Z — дальше`, 240, 214, { align: 'center', color: '#9a9aa8' });
    }
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
    const sh = kitSheetOf(q.id, TEAM_COLORS[q.team]);
    const dir = dirName(q.dir[0], q.dir[1]);
    const f = frameRect(dir, q.moving ? 1 + (Math.floor(q.anim * 6) % 2) : 0);
    const x = Math.round(q.x), y = Math.round(q.y);
    r.alpha(0.3, () => r.rect(x - 5, y - 1, 10, 3, '#000'));
    // ярость (Ф-7): красная аура
    if (q.rage > 0) r.alpha(0.35 + 0.25 * Math.sin(this.time * 20), () => { r.rect(x - 9, y - 26, 18, 27, '#ff3030'); r.rect(x - 11, y - 20, 22, 14, '#ff3030'); });
    r.sprite(sh, f.sx, f.sy, f.sw, f.sh, x - f.sw / 2, y - f.sh + 1);
    // у вратаря — зелёный ободок над головой
    if (q.keeper) r.frame(x - 3, y - f.sh - 4, 6, 5, '#6be36b', 1);
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
    const left = Math.max(0, (L.half === 3 ? B.goldenSeconds : B.halfSeconds) - L.t);
    const s = Math.ceil(left);
    r.text(`${L.half === 3 ? 'Золотой гол' : L.half + '-й тайм'}  ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`, 200, 13, { align: 'center', color: L.half === 3 ? '#ffe14d' : '#c8c8d8' });
    // выносливость Ромы (Shift)
    r.rect(262, 15, 60, 5, '#2a2a34');
    r.rect(262, 15, Math.round(60 * L.staminaMax), 5, '#4a4a58');
    r.rect(262, 15, Math.round(60 * L.stamina), 5, L.stamina < 0.2 ? '#ff6a6a' : '#6be36b');
    r.text(TEAM_NAMES.inyaz + ' (чёрные)', 6, 4, { color: TEAM_UI.inyaz });
    r.text(TEAM_NAMES.fizmat + ' (белые)', 474, 4, { align: 'right', color: TEAM_UI.fizmat });
    if (this.speed > 1) r.text('×' + this.speed, 474, 14, { align: 'right', color: '#6be36b' });
    this.drawStands(r);
  }

  // Трибуна внизу (Ф-17): запасные, вышедшие, не играющие именные и дед Василий. На гол — прыгают.
  drawStands(r) {
    const L = this.L;
    const y0 = FIELD.bottom + 4;
    r.rect(0, y0 + 14, 480, GAME_H - y0 - 14, '#4a3a2a'); r.rect(0, y0 + 14, 480, 2, '#7a5a3a');
    const subs = (t) => [...L.bench[t], ...L.players.filter((q) => q.team === t && q.out === 'gone').map((q) => q.id)];
    const groups = [['fizmat', subs('fizmat'), 30], [null, FANS, 170], ['inyaz', subs('inyaz'), 380]];
    const cheer = this.time - this.cheerT < 2.4;
    for (const [team, ids, x0] of groups) {
      [...new Set(ids)].forEach((id, i) => {
        const sh = team ? kitSheetOf(id, TEAM_COLORS[team]) : sheetOf(id); if (!sh) return;
        const f = frameRect('down', 0);
        const happy = cheer && (!team || team === this.cheerTeam);
        const jump = happy ? Math.round(Math.abs(Math.sin((this.time + i) * 9)) * 4) : 0;
        r.sprite(sh, f.sx, f.sy, f.sw, 18, x0 + i * 22, y0 - 2 - jump);
      });
    }
  }
}

registerMinigame('football', {
  title: 'Эль-Класико',
  music: 'gym',
  keys: ['Стрелки — бег, Shift — рывок (выносливость)', 'Z — пас, C — удар (держи), X — отбор (сзади — фол)', 'Штрафной и пенальти: Z — направление, Z — сила', `2 тайма по ${B.halfSeconds} с, ничья — золотой гол`],
  describe: () => '«ИнЯз» против «Физмата». Рома — под жёлтой стрелкой.',
  create: (ctx) => new FootballGame(ctx),
});
