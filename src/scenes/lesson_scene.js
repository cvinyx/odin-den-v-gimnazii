// Шаблон урока (раздел 5): вход → выбор места → 2–3 события → главная мини-игра → итог урока → звонок.
// Все действия урока (телефон, вейп, байт, сидеть тихо) — через выборы в событиях.
// Подозрение 100 → вызов к директору: остаток урока пропущен, оценка 2.
import { LESSONS, LINEUPS } from '../../data/lessons.js';
import { MapView } from '../world/map_view.js';
import { LAST_LESSON } from '../game/day.js';
import { BALANCE } from '../../data/balance.js';
import { lessonInfo, lessonClock, startLesson, finishLesson, endLessonRules, startBreak, eventRng } from '../game/day.js';
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
import { labelLines } from '../game/dialogs.js';
import { pickEnding } from '../game/endings.js';

// Какая телефонная игра «по умолчанию» на уроке (на остальных — случайная из трёх).
const PHONE_BY_LESSON = { 2: 'phone_blocks', 4: 'phone_brawl', 6: 'phone_feed' };

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
    this.cfg = LESSONS[this.n];
    if (!this.opts.resumed) startLesson(st, this.n);
    this.before = { ...st.stats };
    game.condCtx = {}; // условия мини-игр перемены на уроке не действуют
    this.view = this.cfg.view === 'pe' ? peView() : new ClassroomView(st, this.info);
    game.hud.hint = null;
    game.playMusic('lesson');
    game.autosave(); // автосохранение в начале урока (раздел 18)
    this.grade = null;
    this.steps = this.buildSteps();
    this.next();
  }

  buildSteps() {
    const c = this.cfg;
    const steps = [
      { p: 0.02, run: () => this.dialog('intro') },
      ...(c.seat ? [{ p: 0.06, run: () => this.dialog(c.seat, () => this.view.rebuild && this.view.rebuild(this.game.state)) }] : []),
      ...c.events.map((e, i) => ({ p: 0.12 + i * 0.12, run: () => this.dialog(e) })),
      { p: 0.5, run: () => this.dialog('before_game') },
      { p: 0.5, run: () => this.mainGame() },
      ...(c.extra ? [{ p: 0.88, run: () => this.extraGame() }] : []),
      { p: 0.92, run: () => this.dialog(this.grade >= 6 ? 'after_good' : 'after_bad') },
      { p: 0.95, name: 'result', run: () => this.showResult() },
      { p: 0.98, run: () => this.dadMessage() },
      { p: 1, run: () => this.bell() },
    ];
    return steps;
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
    this.game.scenes.push(new DialogScene(this.cfg.file, label, {
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
      const id = PHONE_BY_LESSON[this.n] || eventRng(st, 'phonegame' + this.n).pick(Object.values(PHONE_BY_LESSON));
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
    if (res && res.extra && res.extra.berserk) this.game.state.flags.igorBerserk = true;
    this.next();
  }

  mainGame() {
    const st = this.game.state;
    const c = this.cfg;
    const params = { lesson: this.n, view: this.view, ...(c.params || {}) };
    let opp = null;
    if (c.minigame === 'bait') {
      // байт-дуэль с одноклассником: обычно Денис; если Рома отбил место — дующийся Игорь
      opp = st.seat === 'steal_ok' ? 'igor' : 'denis';
      Object.assign(params, { opp, inLesson: true, sulk: opp === 'igor' });
    }
    this.game.scenes.push(new MinigameScene(c.minigame, {
      params, opp,
      onUpdate: (inst) => {
        const L = inst.logic;
        if (L && L.duration) this.setProgress(0.5 + 0.35 * Math.min(1, L.t / L.duration));
      },
      onDone: (res) => {
        if (res.extra && res.extra.berserk) st.flags.igorBerserk = true;
        let g = res.grade ?? BALANCE.lessonGrades.byResult[res.result] ?? 5;
        if (st.seat === 'front') g += BALANCE.seating.frontGradeBonus;
        this.grade = Math.max(1, Math.min(10, g));
        if (this.view.roma) this.view.roma.dir = 'up';
        this.afterPhone(res, () => this.next());
      },
    }));
  }

  extraGame() {
    this.game.scenes.push(new MinigameScene(this.cfg.extra, { params: { lesson: this.n }, onDone: () => this.next() }));
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
      lesson: this.info, grade: this.grade, before: this.before, after: { ...st.stats },
      director: this.directorDone, onDone: () => this.next(),
    }));
  }

  dadMessage() {
    const st = this.game.state;
    if (this.grade < BALANCE.dad.gradeThreshold || st.stats.battery <= 0) return this.next();
    const rng = eventRng(st, 'dad' + this.n);
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
    if (this.n >= LAST_LESSON) {
      // последний звонок — концовка дня (раздел 16)
      import('./ending.js').then(({ EndingScene }) => game.scenes.reset(new EndingScene(pickEnding(st)), { fade: true }));
      return;
    }
    startBreak(st, this.n);
    const where = this.info.building === 0 ? ['locker_room', 'gym'] : [`k${this.info.building}_f${this.info.floor}`, 'door' + this.info.room];
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
  // «Физмат» — левая половина раздевалки, «ИнЯз» — правая
  fiz.forEach((id, i) => cast.push({ id, x: 2 + i, y: i % 2 ? 6 : 3, dir: 'right' }));
  iny.forEach((id, i) => cast.push({ id, x: 11 + i, y: i % 2 ? 6 : 3, dir: 'left' }));
  cast.push({ id: 'viktor', x: 9, y: 2, dir: 'down' });
  const v = new MapView('locker_room', cast.map((c) => ({ ...c, x: Math.round(c.x) })));
  return v;
}
