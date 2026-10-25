// Быстрый симулятор недели в node (без браузера и графики) — для баланса (этап 6, неделя — V2-2).
// Использует настоящие данные и правила: файлы диалогов (выборы и их эффекты), расписание, уроки,
// правила статусов, ставки и долги, мини-игры с «средним» ботом (логика тех же классов, что в игре),
// футбол (MatchLogic, Ромой играет ИИ), концовки. Стиль игрока: cautious / average / chaotic.
// Ходьба по карте не моделируется — только то, что Рома делает на переменах.
import fs from 'node:fs';
import path from 'node:path';
import { parseDialog } from '../src/ui/dialog_script.js';
import { DialogRunner } from '../src/game/dialog_runner.js';
import { createState, changeStat, applyScriptEffect, scriptStatValue, VAPE_FRIENDS } from '../src/game/state.js';
import { puff, sitQuiet, addSuspicion, checkBreakdown, directorCall, directorEndsDay, staminaPenalty, trySeatSteal } from '../src/game/actions.js';
import { startLesson, endLessonRules, finishLesson, startBreak, eventRng, lessonInfo, lastLesson, lessonGraded, startDay, endDayEarly, setDay, weekAverage } from '../src/game/day.js';
import { rollBet, payWin, resolveLoss } from '../src/game/bets.js';
import { pickEnding, avgGrade } from '../src/game/endings.js';
import { LESSON_FILES } from '../data/lessons.js';
import { NPC_SCHEDULE } from '../data/npc_schedule.js';
import { TEACHERS } from '../data/teachers.js';
import { BALANCE } from '../data/balance.js';
import { buyFood, isBigBreak } from '../src/scenes/buffet.js';
import { canVapeBattle, vapeReady } from '../src/minigames/vape_battle.js';
import { CheatLogic, makeBot } from '../src/minigames/cheat_logic.js';
import { BaitLogic, CATS } from '../src/minigames/bait_logic.js';
import { MatchLogic } from '../src/football/match.js';
import { SwimLogic, swimBot } from '../src/minigames/swim_logic.js';
import { ClasshourLogic } from '../src/minigames/classhour_logic.js';
import { buildRoster, seatTile, tileToFeet, TEACHER_TILE } from '../src/world/classroom.js';
import { runGame } from './balance_minigames_lib.mjs';
import { Rng } from '../src/engine/rng.js';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const cache = new Map();
function dialog(name) {
  if (!cache.has(name)) cache.set(name, parseDialog(fs.readFileSync(path.join(root, 'data/dialogs', name + '.txt'), 'utf8')));
  return cache.get(name);
}

// Слова в вариантах, которые выбирает стиль (по порядку предпочтения).
const PREFER = {
  cautious: ['Сидеть тихо', 'Переписывать', 'Слушать', 'Читать', 'Писать сам', 'Не рисковать', 'Вызваться', 'Выйти и честно', 'И не ссорятся',
    'Молча', 'Ай вос', 'К Игорю', 'Не сегодня', 'передумал', 'бывай', 'Попросить жижку', 'Да, проспал'],
  average: [],
  chaotic: ['Затянуться', 'Залипнуть', 'Забайтить', 'Давай на рубль', 'Давай!', 'Отбить место', 'Кто больше парит', 'Царь туалета', 'Кто больше съест',
    'Матыча и Буя', 'Байт-дуэль', 'Галатасарай'],
};

export class SimDay {
  constructor(seed, style) {
    this.st = createState(seed);
    this.style = style;
    this.rng = new Rng('sim#' + seed + '#' + style); // решения «игрока» (не события дня)
    this.pending = [];
    this.condCtx = {};
    this.opp = null;
    this.patrolNear = false;
    this.say = 0; this.choices = 0; this.mgSec = 0; this.games = {};
    this.over = false; // день окончен раньше (3-й вызов к директору)
    setDay(1);
  }

  // ---------- Диалоги ----------
  runDialog(file, label, opp = null) {
    const st = this.st;
    this.opp = opp;
    const r = new DialogRunner(dialog(file), label, {
      effect: (c) => this.effect(c),
      stat: (n) => (n in this.condCtx ? this.condCtx[n] : scriptStatValue(st, n, opp)),
      flag: (n) => !!st.flags[n],
    });
    for (let guard = 0; guard < 500; guard++) {
      const ev = r.next();
      if (ev.type === 'end') break;
      if (ev.type === 'say') { this.say++; continue; }
      this.choices++;
      let i;
      if (st.breakdownPending && ev.options.length > 1) { st.breakdownPending = false; i = eventRng(st, 'breakdown' + st.breakdowns).int(0, ev.options.length - 1); }
      else i = this.pick(ev.question, ev.options.map((o) => o.text));
      r.choose(i);
      this.tick();
    }
    this.tick();
  }

  pick(q, opts) {
    const s = this.style;
    const r = this.rng;
    if (s === 'average' && r.chance(0.5)) return r.int(0, opts.length - 1);
    if (s === 'chaotic' && r.chance(0.35)) return r.int(0, opts.length - 1);
    const pref = s === 'average' ? (r.chance(0.5) ? PREFER.cautious : PREFER.chaotic) : PREFER[s];
    for (const w of pref) { const i = opts.findIndex((o) => o.includes(w)); if (i >= 0) return i; }
    return s === 'cautious' ? opts.length - 1 : r.int(0, opts.length - 1);
  }

  effect(e) {
    const st = this.st;
    if (e.type === 'sfx' || e.type === 'shake') return;
    if (e.type === 'action') return this.action(e.name, e.arg);
    if (e.type === 'stat' && e.stat === 'suspicion') return addSuspicion(st, e.delta);
    applyScriptEffect(st, e);
  }

  // Как Game.performAction: мгновенные — сразу, остальные — после диалога.
  action(name, arg) {
    const st = this.st;
    switch (name) {
      case 'vape': {
        const res = puff(st);
        if (res.ok && st.phase !== 'lesson' && this.patrolNear) this.pending.push({ name: 'director_patrol' });
        break;
      }
      case 'phone': if (st.stats.battery > 0) this.pending.push({ name }); break;
      case 'quiet': sitQuiet(st); break;
      case 'wash': if (!st.flags['washed' + st.lesson]) { changeStat(st, 'stress', -3); st.flags['washed' + st.lesson] = true; } break;
      case 'seat_steal': {
        const ok = trySeatSteal(st);
        st.seat = ok ? 'steal_ok' : 'steal_fail'; st.flags.seat_ok = ok; if (ok) st.flags.satWithDenis = true;
        st.lessonMul *= ok ? BALANCE.seating.stealSuccessSuspicion : BALANCE.seating.stealFailSuspicion;
        break;
      }
      case 'seat_front': st.seat = 'front'; st.lessonMul *= BALANCE.seating.frontSuspicion; break;
      case 'seat_igor': st.seat = 'igor'; break;
      case 'askjuice': {
        const key = 'askedJuice_' + this.opp;
        let ok = false;
        if (VAPE_FRIENDS.includes(this.opp) && !st.flags[key]) ok = eventRng(st, key).chance(BALANCE.vape.askJuiceChance);
        st.flags[key] = true; st.flags.juice_ok = ok;
        if (ok) changeStat(st, 'juice', 1);
        break;
      }
      case 'challenge': this.condCtx.challenge = 0; st.flags['challenged_' + this.opp + '_' + st.lesson] = true; break;
      default: this.pending.push({ name, arg });
    }
  }

  tick() { checkBreakdown(this.st); }

  // ---------- Мини-игры (как MinigameScene) ----------
  minigame(id, { opp = null, bet = 0, params = {} } = {}) {
    const st = this.st;
    let res;
    if (st.breakdownPending) { st.breakdownPending = false; res = { result: 'lose', deltas: {}, grade: id === 'football' ? BALANCE.football.gradeBase : 4 }; }
    else res = this.play(id, opp, params);
    this.games[id] = (this.games[id] || 0) + 1;
    for (const [k, v] of Object.entries(res.deltas || {})) if (k in st.stats && v) changeStat(st, k, v);
    if (res.money) changeStat(st, 'money', res.money);
    if (res.result === 'win') st.flags['won_' + id] = true;
    if (bet && res.result === 'win') payWin(st, bet);
    if (bet && res.result === 'lose') resolveLoss(st, opp, bet, this.lossOption());
    if (!bet && res.result === 'win' && opp) st.wins++;
    this.tick();
    return res;
  }

  lossOption() {
    const s = this.style, r = this.rng;
    if (s === 'cautious') return this.st.stats.money > 0 ? 'pay' : 'later';
    if (s === 'chaotic') return this.st.stats.money > 0 && r.chance(0.5) ? 'pay' : r.pick(['nomoney', 'later']);
    return this.st.stats.money > 0 && r.chance(0.6) ? 'pay' : r.pick(['nomoney', 'later']);
  }

  play(id, opp, params) {
    const st = this.st;
    const rng = eventRng(st, 'mg:' + id + ':' + (st.flags.mgCount = (st.flags.mgCount || 0) + 1));
    if (id === 'cheat') return this.playCheat(rng, params);
    if (id === 'test') return this.playTest(rng, params);
    if (id === 'swim') return this.playSwim(rng, params);
    if (id === 'classhour') return this.playClasshour(rng);
    if (id === 'bait') return this.playBait(rng, opp, params);
    if (id === 'football') return this.playFootball(rng);
    const r = runGame(id === 'vape' ? 'vape' : id, rng.int(1, 1e9), { opp, state: st, params });
    this.mgSec += r.sec;
    return r.out;
  }

  // Тест (М-4): у соседа, если он есть, иначе сам; недосписанное — сам (точность по стилю).
  playTest(rng, params) {
    const st = this.st, T = BALANCE.test;
    const roster = buildRoster(st, st.lesson, {});
    const r = roster.roma;
    const neighbor = r && roster.seats.some((x) => x.c === r.c && x.d === r.d && x.side !== r.side);
    const self = { cautious: 0.65, average: 0.55, chaotic: 0.45 }[this.style];
    let correct = 0, copied = 0;
    if (neighbor || st.stats.battery > 0) {
      const res = this.playCheat(rng, { ...params, duration: T.cheatSeconds });
      if (res.result === 'director') return res;
      copied = Math.min(10, res.grade - 1);
      for (let k = 0; k < copied; k++) if (this.rng.chance(neighbor ? T.neighborAccuracy : T.phoneAccuracy)) correct++;
    }
    for (let k = copied; k < 10; k++) { this.mgSec += 8; if (this.rng.chance(self)) correct++; }
    const min = lessonInfo(st.lesson).exact ? 1 : 2;
    return { result: correct >= 6 ? 'win' : 'lose', deltas: {}, grade: Math.max(min, correct) };
  }

  playSwim(rng, params) {
    const st = this.st;
    if (params.romaBench) { this.mgSec += BALANCE.swim.benchSeconds; return { result: 'draw', deltas: { stress: -2 } }; }
    const L = new SwimLogic(rng, { swimmers: params.swimmers, staminaMax: 1 - staminaPenalty(st) });
    const bot = swimBot(L, this.rng);
    while (!L.finished) L.update(1 / 30, bot(1 / 30));
    this.mgSec += L.t;
    return { result: L.wins() ? 'win' : 'lose', deltas: L.deltas() };
  }

  playClasshour(rng) {
    const L = new ClasshourLogic(rng, {});
    const hard = { cautious: 0.1, average: 0.3, chaotic: 0.6 }[this.style];
    while (!L.finished) { L.friendTurn(); L.friendTurn(); L.romaTurn(this.rng.chance(hard) ? 3 : this.rng.chance(0.5) ? 2 : 1); }
    this.mgSec += 50;
    const K = BALANCE.classhour;
    return { result: L.result, deltas: { aura: L.result === 'win' ? K.winAura : L.kicked ? K.kickAura : K.loseAura } };
  }

  playCheat(rng, params) {
    const st = this.st;
    const n = st.lesson;
    const t = TEACHERS[lessonInfo(n).teacher];
    const roster = buildRoster(st, n, {});
    const rs = roster.roma ? tileToFeet(seatTile(roster.roma.c, roster.roma.d, roster.roma.side)) : { x: 200, y: 150 };
    const tp = tileToFeet({ ...TEACHER_TILE, half: true }); tp.y -= 18;
    const L = new CheatLogic(rng, {
      teacher: { wide: t.params.coneWidth === 'wide' }, mul: st.lessonMul || 1,
      speedMul: st.seat === 'steal_ok' ? BALANCE.seating.stealSuccessCheatSpeed : 1,
      hungerSlow: st.stats.hunger > BALANCE.hunger.slowThreshold, startSuspicion: st.stats.suspicion,
      roma: { x: rs.x, y: rs.y - 12 }, teacherPos: tp,
      targets: roster.seats.map((s) => { const f = tileToFeet(seatTile(s.c, s.d, s.side)); return { x: f.x, y: f.y - 12 }; }),
    });
    const bot = makeBot(this.style === 'chaotic' ? 'greedy' : this.style === 'average' && this.rng.chance(0.5) ? 'greedy' : 'cautious');
    const quiz = params.quiz ? [...BALANCE.cheat.quizTimes] : [];
    const right = { cautious: 0.7, average: 0.5, chaotic: 0.3 }[this.style];
    while (!L.finished) {
      L.update(1 / 60, bot(L, 1 / 60));
      if (quiz.length && L.t >= quiz[0]) {
        quiz.shift();
        const ok = this.rng.chance(right);
        L.suspicion = Math.max(0, Math.min(100, L.suspicion + (ok ? (t.params.rightAnswerSuspicion || -15) : Math.round(BALANCE.cheat.quizWrong * (L.p.mul || 1)))));
      }
    }
    this.mgSec += L.t;
    st.stats.suspicion = Math.round(L.suspicion);
    const director = L.result === 'director';
    return { result: director ? 'director' : L.answers >= 5 ? 'win' : 'lose', deltas: {}, grade: director ? BALANCE.director.grade : L.grade };
  }

  playBait(rng, opp, params) {
    const st = this.st;
    const L = new BaitLogic(rng, { opp, inLesson: !!params.inLesson, sulk: !!params.sulk, hungerSlow: st.stats.hunger > BALANCE.hunger.slowThreshold, lessonMul: st.lessonMul, startSuspicion: st.stats.suspicion });
    const w = { cautious: [3, 5, 1, 1], average: [2, 4, 2, 2], chaotic: [1, 2, 4, 3] }[this.style];
    while (!L.finished) {
      let x = this.rng.float(0, w.reduce((a, b) => a + b, 0)), c = 0;
      while (x > w[c]) { x -= w[c]; c++; }
      L.playRoma(CATS[Math.min(3, c)]);
      if (!L.finished) L.playOpp();
      L.endRound();
    }
    this.mgSec += L.rounds * 12;
    if (L.result === 'win' && opp === 'igor') st.flags.igorRage = true;
    return { result: L.result, deltas: L.deltas() };
  }

  playFootball(rng) {
    const st = this.st;
    const M = new MatchLogic(rng, { aiRoma: true, hungry: st.stats.hunger > BALANCE.hunger.slowThreshold, staminaMax: 1 - staminaPenalty(st), rageStart: !!st.flags.igorRage });
    for (let f = 0; f < 60 * 400 && M.state !== 'end'; f++) {
      M.update(1 / 60, null);
      for (const e of M.events) if (e.type === 'halftime') {
        st.flags.ht = this.pick('', ['«"Барса" — сила.»', '«"Реал", конечно.»', '«Галатасарай»', 'бывай']);
        this.say += 8; this.choices++;
        M.secondHalf(['barca', 'real', 'igor', 'none'][st.flags.ht]);
      }
      M.events.length = 0;
    }
    this.mgSec += M.total;
    const F = BALANCE.football;
    const res = M.result(), goals = M.roma.goals;
    st.flags.matchResult = res === 'win' ? 1 : res === 'lose' ? -1 : 0;
    st.flags.matchScore = `${M.score.inyaz}:${M.score.fizmat}`;
    st.flags.romaGoals = goals; st.flags.smileDiarrhea = !!M.smileGone; st.flags.kolyaConceded = M.stats.kolyaConceded;
    const d = { aura: F[res].aura + goals * F.goalAura, hunger: BALANCE.hunger.perFootball };
    if (F[res].stress) d.stress = F[res].stress;
    return { result: res, deltas: d, grade: Math.min(10, F.gradeBase + goals + (res === 'win' ? F.gradeWinBonus : 0)) };
  }

  // ---------- Вызов к директору ----------
  director() {
    directorCall(this.st);
    this.say += 4;
    if (directorEndsDay(this.st)) this.over = true;
  }

  // ---------- Урок (как LessonScene) ----------
  lesson(n) {
    const st = this.st, info = lessonInfo(n), file = info.file, c = LESSON_FILES[file];
    let game = info.minigame;
    const graded = lessonGraded(st, n);
    startLesson(st, n);
    this.condCtx = {};
    let grade = null, directorHere = false;
    const before = dialog(file).labels['before_' + game] ? 'before_' + game : 'before_game';
    const steps = [() => this.runDialog(file, 'intro'), ...(c.seat ? [() => this.runDialog(file, c.seat)] : []), ...c.events.map((e) => () => this.runDialog(file, e)), () => this.runDialog(file, before)];
    const checkDir = () => {
      if (directorHere || st.stats.suspicion < BALANCE.suspicion.directorAt) return false;
      directorHere = true; grade = BALANCE.director.grade; this.director();
      return true;
    };
    const afterDialog = () => {
      const acts = this.pending; this.pending = [];
      if (acts.find((a) => a.name === 'phone') && c.view !== 'pe') {
        const PB = ['phone_blocks', 'phone_brawl', 'phone_feed'];
        const id = PB.includes(game) ? game : eventRng(st, `phonegame${st.day}:${n}`).pick(PB);
        const r = this.minigame(id, { params: { lesson: n, short: true } });
        if (r.extra && r.extra.wrongLike) { st.flags.wrongLike = true; this.say += 4; }
      }
      const bait = acts.find((a) => a.name === 'bait');
      if (bait) {
        const opp = bait.arg || 'igor';
        const r = this.minigame('bait', { opp, params: { opp, inLesson: true, sulk: opp === 'igor' && st.seat === 'steal_ok' } });
        void r;
      }
    };
    for (const s of steps) { if (checkDir() || this.over) break; s(); afterDialog(); }
    if (!directorHere && !this.over && !checkDir()) {
      const params = { lesson: n, ...(c.params || {}) };
      if (game === 'test_quiz') { game = 'test'; params.quiz = true; }
      if (game === 'swim') Object.assign(params, this.swimSetup(st));
      let opp = null;
      if (game === 'bait') { opp = st.seat === 'steal_ok' ? 'igor' : 'denis'; Object.assign(params, { opp, inLesson: true, sulk: opp === 'igor' }); }
      if (c.pre && !params.romaBench) this.minigame(c.pre, { params: { lesson: n } });
      const res = this.minigame(game, { opp, params });
      let g = res.grade ?? BALANCE.lessonGrades.byResult[res.result] ?? 5;
      if (st.seat === 'front') g += BALANCE.seating.frontGradeBonus;
      grade = Math.max(1, Math.min(10, g));
      if (res.extra && res.extra.wrongLike) { st.flags.wrongLike = true; this.say += 4; }
      if (!checkDir() && c.extra && !params.romaBench) this.minigame(c.extra, { params: { lesson: n } });
      if (!directorHere) this.runDialog(file, !graded || grade >= 6 ? 'after_good' : 'after_bad');
    }
    if (this.over) { finishLesson(st, n, grade ?? BALANCE.director.grade); return; }
    // отец
    if (graded && grade >= BALANCE.dad.gradeThreshold && st.stats.battery > 0) {
      const rub = eventRng(st, `dad${st.day}:${n}`).int(BALANCE.dad.transferMin / 100, BALANCE.dad.transferMax / 100);
      changeStat(st, 'money', rub * 100); this.say += 1;
    }
    endLessonRules(st);
    finishLesson(st, n, grade ?? 1);
    this.tick();
  }

  // ---------- Перемена ----------
  breakTime(n) {
    const st = this.st, s = this.style, r = this.rng;
    startBreak(st, n);
    // поесть
    const hungry = { cautious: 45, average: 60, chaotic: 80 }[s];
    if (st.stats.hunger >= hungry) {
      const key = isBigBreak(st) && st.stats.money >= 350 && s !== 'chaotic' ? 'lunch' : st.stats.money >= 180 && st.stats.stress > 50 ? 'topChoco' : 'smazhenka';
      buyFood(st, key);
    }
    // не бережёт деньги: сладкое на каждой перемене
    if (s === 'chaotic' && st.stats.money >= 180) buyFood(st, 'topChoco');
    if (s === 'average' && st.stats.stress > 55 && r.chance(0.5)) buyFood(st, 'tea');
    // зарядка в библиотеке (зарядить можно одно устройство)
    const charge = s === 'cautious' ? st.stats.battery < 50 : s === 'average' ? st.stats.battery < 25 && r.chance(0.6) : false;
    if (charge) changeStat(st, 'battery', Math.round(BALANCE.battery.chargePerSecond * 45));
    else if (s !== 'cautious' && st.stats.vapeCharge < 30 && r.chance(0.5)) changeStat(st, 'vapeCharge', Math.round(BALANCE.vape.chargePerSecond * 45));
    // разговоры с именными на перемене
    const here = Object.entries(NPC_SCHEDULE).filter(([, row]) => row[n]).map(([id]) => id);
    const talks = { cautious: 2, average: 3, chaotic: 4 }[s];
    for (let k = 0; k < talks && !this.over; k++) {
      const id = r.pick(here);
      const loc = NPC_SCHEDULE[id][n];
      this.patrolNear = s !== 'cautious' && r.chance(0.12);
      this.condCtx = this.miniCtx(id, loc, n);
      const label = st.flags[`talked_break${n}_${id}`] ? null : id;
      st.flags[`talked_break${n}_${id}`] = true;
      if (label && dialog('break' + n).labels[label]) this.runDialog('break' + n, label, id);
      else if (dialog('npc_again').labels[id]) this.runDialog('npc_again', id, id);
      this.breakActions(id, loc);
    }
    // затяжка в коридоре (снять стресс)
    const puffs = { cautious: 0, average: st.stats.stress > 60 ? 1 : 0, chaotic: st.stats.stress > 35 ? 2 : 1 }[s];
    for (let k = 0; k < puffs && !this.over; k++) { this.patrolNear = r.chance(0.12); this.action('vape'); this.breakActions(null, null); }
  }

  miniCtx(id, loc, n) {
    const st = this.st;
    const intoilet = /_wc$/.test(loc) ? 1 : 0, incanteen = loc === 'canteen' ? 1 : 0;
    const bigbreak = incanteen && isBigBreak(st) ? 1 : 0;
    const vapebattle = canVapeBattle(id) ? 1 : 0;
    const near = (w) => NPC_SCHEDULE[w][n] === loc;
    this.mbFriend = !['matych', 'buy'].includes(id) && near('matych') && near('buy') ? id : null;
    let challenge = 0, chalgame = 0;
    if (!st.flags['challenged_' + id + '_' + st.lesson]) {
      const rng = eventRng(st, 'challenge:' + id + ':' + st.lesson);
      if (rng.chance(BALANCE.challengeChance)) {
        const games = [1, vapebattle && vapeReady(st) && 2, intoilet && 3, bigbreak && st.stats.money >= BALANCE.eat.entry && 4].filter(Boolean);
        chalgame = rng.pick(games); challenge = 1;
      }
    }
    return { intoilet, incanteen, bigbreak, mbnear: this.mbFriend ? 1 : 0, vapebattle, playable: 1, challenge, chalgame };
  }

  breakActions(opp) {
    const st = this.st;
    const acts = this.pending; this.pending = [];
    for (const a of acts) {
      if (this.over) return;
      if (a.name === 'director_patrol') this.director();
      else if (a.name === 'bait') { const o = a.arg || opp; this.minigame('bait', { opp: o, bet: rollBet(st, o), params: { opp: o } }); }
      else if (a.name === 'buffet') { if (st.stats.hunger > 40) buyFood(st, 'smazhenka'); }
      else if (a.name === 'play') {
        const k = a.arg;
        if (k === 'mb') this.minigame('bait_mb', { opp: 'matych', params: { friend: this.mbFriend || 'denis' } });
        else if (k === 'vape' && canVapeBattle(opp) && vapeReady(st)) {
          const r = this.minigame('vape', { opp, bet: rollBet(st, opp), params: { opp, patrolNear: this.patrolNear } });
          if (r.extra && r.extra.caught) this.director();
        } else if (k === 'eat' && st.stats.money >= BALANCE.eat.entry) this.minigame('eat', { opp, params: { opp } });
        else if (k === 'toilet') this.minigame('toilet', { opp, bet: rollBet(st, opp), params: { opp } });
      }
    }
  }

  swimSetup(st) {
    const rng = eventRng(st, `swimforgot${st.day}`);
    const all = ['roma', 'igor', 'denis', 'guza', 'matych', 'buy'];
    const forgot = all.filter(() => rng.chance(BALANCE.swim.forgotChance));
    return { swimmers: all.filter((id) => id !== 'roma' && !forgot.includes(id)), romaBench: forgot.includes('roma') };
  }

  // ---------- Один день ----------
  runOneDay() {
    const st = this.st;
    if (st.day === 1) {
      st.phase = 'intro';
      this.runDialog('intro', 'wake');
      this.runDialog('intro', 'levonchuk', 'levonchuk');
      this.runDialog('intro', 'bus');
    } else {
      const morning = dialog('morning').order.filter((l) => l.startsWith(`d${st.day}_`));
      this.runDialog('morning', eventRng(st, 'morningscene' + st.day).pick(morning));
    }
    st.phase = 'late';
    const total = lastLesson();
    this.over = false;
    for (let n = 1; n <= total && !this.over; n++) {
      this.lesson(n);
      if (this.over) break;
      if (n < total) this.breakTime(n);
    }
    if (this.over) endDayEarly(st, 'director');
    // дорога домой: разговор с Левончуком (без повторов за неделю)
    st.phase = 'home';
    const all = dialog('bus_home').order.filter((l) => /^home_\d+$/.test(l));
    const fresh = all.filter((l) => !st.week.busSeen.includes(l));
    const label = eventRng(st, 'bushome' + st.day).pick(fresh.length ? fresh : all);
    st.week.busSeen.push(label);
    this.runDialog('bus_home', label, 'levonchuk');
  }

  // ---------- Вся неделя ----------
  run(days = 5) {
    const st = this.st;
    this.dayAvgs = [];
    for (let d = 1; d <= days; d++) {
      if (d > 1) startDay(st, d);
      this.runOneDay();
    }
    const ending = pickEnding(st);
    // время живого игрока за день: чтение реплик, выборы, мини-игры, переходы и перемены
    const minutes = (this.say * 2.4 + this.choices * 4 + this.mgSec * 1.15 + days * (13 * 35 + 6 * 75 + 7 * 25 + 60)) / 60 / days;
    return { ending, st, minutes, games: this.games, avg: weekAverage(st), avgGrade: avgGrade(st) };
  }
}

export function simDay(seed, style, days = 5) { return new SimDay(seed, style).run(days); }
