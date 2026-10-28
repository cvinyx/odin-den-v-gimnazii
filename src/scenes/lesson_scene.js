// Шаблон урока (раздел 5): вход → выбор места → 2–3 события → главная мини-игра → итог урока → звонок.
// Все действия урока (телефон, вейп, байт, сидеть тихо) — через выборы в событиях.
// Подозрение 100 → вызов к директору: остаток урока пропущен, оценка 2.
// Неделя (V2-2): урок берётся из расписания текущего дня, диалоги — из файла предмета,
// мини-игра — из расписания (SUBJECTS[*].games). *_stub — временные заглушки (диалог вместо игры).
import { LESSON_FILES, LINEUPS } from '../../data/lessons.js';
import { MapView } from '../world/map_view.js';
import { BALANCE } from '../../data/balance.js';
import { lessonInfo, lessonClock, startLesson, finishLesson, endLessonRules, startBreak, eventRng, lastLesson, lessonGraded } from '../game/day.js';
import { ClassroomView } from '../world/classroom_view.js';
import { DialogScene } from './dialog_scene.js';
import { MinigameScene } from './minigame_scene.js';
import { LessonResultScene } from './lesson_result.js';
import { BellScene } from './bell.js';
import { DirectorScene } from './director.js';
import { PhonePopupScene } from './phone_popup.js';
import { PauseScene } from './pause.js';
import { SchoolMapScene } from './school_map.js';
import { changeStat } from '../game/state.js';
import { labelLines, getDialog } from '../game/dialogs.js';

const PHONE_GAMES = ['phone_blocks', 'phone_brawl', 'phone_feed'];

export class LessonScene {
  constructor(n, opts = {}) {
    this.id = 'lesson';
    this.n = n;
    this.opts = opts;
    this.stepIndex = -1;
    this.busy = false;
  }

  enter(game) {
    this.game = game;
    const st = game.state;
    this.info = lessonInfo(this.n);
    this.file = this.info.file;
    this.cfg = LESSON_FILES[this.file];
    this.graded = lessonGraded(st, this.n);
    if (!this.opts.resumed) startLesson(st, this.n);
    if (this.cfg.view === 'pool') this.setupSwim(st);
    this.before = { ...st.stats };
    game.condCtx = {}; // условия мини-игр перемены на уроке не действуют
    this.view = this.cfg.view === 'pe' ? peView() : this.cfg.view === 'pool' ? poolView() : new ClassroomView(st, this.info);
    game.hud.hint = null;
    game.playMusic('lesson');
    game.autosave(); // автосохранение в начале урока (раздел 18)
    this.grade = null;
    this.steps = this.buildSteps();
    this.next();
  }

  buildSteps() {
    const c = this.cfg;
    const labels = getDialog(this.file).labels;
    const game = this.info.minigame;
    const before = labels['before_' + game] ? 'before_' + game : 'before_game';
    const steps = [
      { p: 0.02, run: () => this.dialog('intro') },
      ...(c.seat ? [{ p: 0.06, run: () => this.dialog(c.seat, () => this.view.rebuild && this.view.rebuild(this.game.state)) }] : []),
      ...(c.view === 'pe' ? [{ p: 0.08, run: () => this.dialog(this.prematchLabel()) }] : []),
      ...c.events.map((e, i) => ({ p: 0.12 + i * 0.12, run: () => this.dialog(e) })),
      ...(c.pre && !this.swim?.romaBench ? [{ p: 0.4, run: () => this.extraGame(c.pre) }] : []),
      { p: 0.5, run: () => this.dialog(before) },
      { p: 0.5, run: () => this.mainGame() },
      ...(c.extra && !this.swim?.romaBench ? [{ p: 0.88, run: () => this.extraGame(c.extra) }] : []),
      { p: 0.92, run: () => this.dialog(this.grade == null || this.grade >= 6 ? 'after_good' : 'after_bad') },
      { p: 0.95, name: 'result', run: () => this.showResult() },
      { p: 0.98, run: () => this.dadMessage() },
      { p: 1, run: () => this.bell() },
    ];
    return steps;
  }

  // Разговор в раздевалке перед матчем (Ф-10): вторник — pm*, пятница — pf* («реванш»).
  prematchLabel() {
    const st = this.game.state;
    const pre = st.day === 5 ? 'pf' : 'pm';
    const all = Object.keys(getDialog(this.file).labels).filter((l) => new RegExp(`^${pre}\\d+$`).test(l));
    return eventRng(st, `prematch${st.day}`).pick(all);
  }

  setProgress(p) { this.game.state.clock = lessonClock(this.n, p); }

  next() {
    if (this.checkDirector()) return;
    this.stepIndex++;
    const s = this.steps[this.stepIndex];
    if (!s) return this.endLesson();
    this.setProgress(s.p);
    s.run();
  }

  dialog(label, after) {
    this.game.scenes.push(new DialogScene(this.file, label, {
      onEnd: () => { if (after) after(); this.afterDialog(); },
    }));
  }

  // После диалога: отложенные действия (байт на уроке), потом следующий шаг.
  afterDialog() {
    const acts = this.game.takeActions();
    const phone = acts.find((a) => a.name === 'phone');
    if (phone && this.cfg.view !== 'pe') {
      // «залипнуть в телефон» — короткая (25 с) телефонная мини-игра урока
      const st = this.game.state;
      const id = PHONE_GAMES.includes(this.info.minigame) ? this.info.minigame : eventRng(st, `phonegame${st.day}:${this.n}`).pick(PHONE_GAMES);
      this.game.scenes.push(new MinigameScene(id, {
        params: { lesson: this.n, short: true },
        onDone: (res) => this.afterPhone(res, () => this.next()),
      }));
      return;
    }
    const bait = acts.find((a) => a.name === 'bait');
    if (bait) {
      const st = this.game.state;
      const opp = bait.arg || 'igor';
      this.game.scenes.push(new MinigameScene('bait', {
        opp,
        params: { opp, inLesson: true, sulk: opp === 'igor' && st.seat === 'steal_ok' },
        onDone: (res) => this.afterBait(res),
      }));
      return;
    }
    this.next();
  }

  // После телефонной игры: «лайк не туда» (лента) — реакция друзей.
  afterPhone(res, then) {
    const post = res && res.extra && res.extra.wrongLike;
    if (!post) return then();
    this.game.state.flags.wrongLike = true;
    this.game.scenes.push(new DialogScene('feed', 'wrong_like', { vars: { post }, onEnd: then }));
  }

  afterBait(res) {
    if (res && res.extra && res.extra.rage) this.game.state.flags.igorRage = true;
    this.next();
  }

  mainGame() {
    const st = this.game.state;
    const c = this.cfg;
    let id = this.info.minigame;
    const params = { lesson: this.n, view: this.view, ...(c.params || {}) };
    if (id === 'test_quiz') { id = 'test'; params.quiz = true; }
    if (id === 'swim') Object.assign(params, this.swim);
    let opp = null;
    if (id === 'bait') {
      // байт-дуэль с одноклассником: обычно Денис; если Рома отбил место — дующийся Игорь
      opp = st.seat === 'steal_ok' ? 'igor' : 'denis';
      Object.assign(params, { opp, inLesson: true, sulk: opp === 'igor' });
    }
    this.game.scenes.push(new MinigameScene(id, {
      params, opp,
      onUpdate: (inst) => {
        const L = inst.logic || inst.L;
        if (L && L.duration) this.setProgress(0.5 + 0.35 * Math.min(1, L.t / L.duration));
      },
      onDone: (res) => {
        if (res.extra && res.extra.rage) st.flags.igorRage = true;
        let g = res.grade ?? BALANCE.lessonGrades.byResult[res.result] ?? 5;
        if (st.seat === 'front') g += BALANCE.seating.frontGradeBonus;
        this.grade = Math.max(1, Math.min(10, g));
        if (this.view.roma) this.view.roma.dir = 'up';
        this.afterPhone(res, () => this.next());
      },
    }));
  }

  // Душ до и после плавания (ИС-12): с двумя одноклассниками, которые в воде.
  extraGame(id) {
    const friends = id === 'shower' && this.swim ? this.swim.swimmers.slice(0, 2) : undefined;
    this.game.scenes.push(new MinigameScene(id, { params: { lesson: this.n, friends }, onDone: () => this.next() }));
  }

  // Плавание (У-3): только Рома, Игорь, Денис, Гуза, Матыч, Буй; у каждого 10 % забыть форму — на лавку.
  setupSwim(st) {
    const rng = eventRng(st, `swimforgot${st.day}`);
    const all = ['roma', 'igor', 'denis', 'guza', 'matych', 'buy'];
    const forgot = all.filter(() => rng.chance(BALANCE.swim.forgotChance));
    this.swim = { swimmers: all.filter((id) => id !== 'roma' && !forgot.includes(id)), bench: forgot.filter((id) => id !== 'roma'), romaBench: forgot.includes('roma') };
    if (this.swim.romaBench) st.flags.romaBench = true;
    if (this.view && this.view.setSwim) this.view.setSwim(this.swim);
  }

  checkDirector() {
    const st = this.game.state;
    if (this.directorDone || st.stats.suspicion < BALANCE.suspicion.directorAt) return false;
    this.directorDone = true;
    this.grade = BALANCE.director.grade;
    this.game.scenes.push(new DirectorScene({
      onDone: () => {
        // остаток урока пропущен: сразу итог урока
        this.stepIndex = this.steps.findIndex((s) => s.name === 'result') - 1;
        this.next();
      },
    }));
    return true;
  }

  showResult() {
    const st = this.game.state;
    this.game.scenes.push(new LessonResultScene({
      lesson: this.info, grade: this.graded ? this.grade ?? 1 : null, before: this.before, after: { ...st.stats },
      director: this.directorDone, onDone: () => this.next(),
    }));
  }

  dadMessage() {
    const st = this.game.state;
    if (!this.graded || this.grade < BALANCE.dad.gradeThreshold || st.stats.battery <= 0) return this.next();
    const rng = eventRng(st, `dad${st.day}:${this.n}`);
    const rub = rng.int(BALANCE.dad.transferMin / 100, BALANCE.dad.transferMax / 100);
    const lines = labelLines('dad', 'msg_' + rub);
    const text = lines.length ? rng.pick(lines).text : '';
    changeStat(st, 'money', rub * 100);
    this.game.scenes.push(new PhonePopupScene({ from: 'батя', text, amount: rub * 100, onDone: () => this.next() }));
  }

  bell() {
    this.game.scenes.push(new BellScene({ onDone: () => this.next() }));
  }

  endLesson() {
    const game = this.game;
    const st = game.state;
    endLessonRules(st);
    finishLesson(st, this.n, this.grade ?? 1);
    // последний звонок дня — дорога домой (М-6), после пятницы — концовка недели
    if (this.n >= lastLesson()) { import('./day_flow.js').then(({ goHome }) => goHome(game)); return; }
    startBreak(st, this.n);
    const where = this.info.room === 'бассейн' ? ['pool', 'stairs']
      : this.info.building === 0 ? ['locker_room', 'gym'] : [`c${this.info.building}_f${this.info.floor}`, 'door' + this.info.room];
    import('./world.js').then(({ WorldScene }) => {
      game.scenes.reset(new WorldScene(where[0], where[1], { autosave: true }), { fade: true });
    });
  }

  update() {
    const input = this.game.input;
    if (input.pressed('back')) { input.consume('back'); this.game.scenes.push(new PauseScene()); }
    else if (input.pressed('tab')) this.game.scenes.push(new SchoolMapScene());
  }

  draw(r) {
    this.view.draw(r);
    r.rect(0, 0, 480, 13, '#000000aa');
    r.text(`${this.info.subject} · ${this.game.state.locationName}`, 6, 3, { color: '#ffffff', shadow: '#000' });
    this.game.hud.draw(r, this.game.state);
  }
}

// Раздевалка перед «Эль-Класико»: составы из раздела 15 (без безымянных).
function peView() {
  const cast = [];
  const L = LINEUPS;
  const fiz = [L.fizmat.keeper, ...L.fizmat.field, ...L.fizmat.bench];
  const iny = [L.inyaz.keeper, ...L.inyaz.field, ...L.inyaz.bench];
  // раздевалка (Л-25): «ИнЯз» — на лавке у одной стены, «Физмат» — у противоположной
  iny.forEach((id, i) => cast.push({ id, x: 3 + i * 2, y: 3, dir: 'down' }));
  fiz.forEach((id, i) => cast.push({ id, x: 2 + i * 2, y: 6, dir: 'up' }));
  cast.push({ id: 'ivan', x: 13, y: 4, dir: 'left' });
  const v = new MapView('locker_room', cast.map((c) => ({ ...c, x: Math.round(c.x) })));
  return v;
}

// Раздевалка бассейна / бассейн: класс у бортика, учитель со свистком (только парни 11 «И», У-3).
function poolView() {
  const ids = ['igor', 'denis', 'roma', 'matych', 'buy', 'guza'];
  const cast = ids.map((id, i) => ({ id, x: 6 + i * 2, y: 3, dir: 'down' }));
  cast.push({ id: 'ivan', x: 4, y: 13, dir: 'up' });
  return new MapView('pool', cast);
}
