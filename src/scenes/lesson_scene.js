// Шаблон урока (раздел 5): вход → выбор места → 2–3 события → главная мини-игра → итог урока → звонок.
// Все действия урока (телефон, вейп, байт, сидеть тихо) — через выборы в событиях.
// Подозрение 100 → вызов к директору: остаток урока пропущен, оценка 2.
import { LESSONS } from '../../data/lessons.js';
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
import { StatusPanel } from './status_panel.js';
import { changeStat } from '../game/state.js';
import { labelLines } from '../game/dialogs.js';

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
    this.view = new ClassroomView(st, this.info);
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
      { p: 0.06, run: () => this.dialog(c.seat, () => this.view.rebuild(this.game.state)) },
      ...c.events.map((e, i) => ({ p: 0.12 + i * 0.12, run: () => this.dialog(e) })),
      { p: 0.5, run: () => this.dialog('before_game') },
      { p: 0.5, run: () => this.mainGame() },
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

  afterBait(res) {
    if (res && res.extra && res.extra.berserk) this.game.state.flags.igorBerserk = true;
    this.next();
  }

  mainGame() {
    const st = this.game.state;
    this.game.scenes.push(new MinigameScene(this.cfg.minigame, {
      params: { lesson: this.n, view: this.view },
      onUpdate: (inst) => {
        const L = inst.logic;
        if (L && L.duration) this.setProgress(0.5 + 0.4 * Math.min(1, L.t / L.duration));
      },
      onDone: (res) => {
        let g = res.grade || 1;
        if (st.seat === 'front') g += BALANCE.seating.frontGradeBonus;
        this.grade = Math.max(1, Math.min(10, g));
        this.view.roma.dir = 'up';
        this.next();
      },
    }));
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
    startBreak(st, this.n);
    const corridor = `k${this.info.building}_f${this.info.floor}`;
    import('./world.js').then(({ WorldScene }) => {
      game.scenes.reset(new WorldScene(corridor, 'door' + this.info.room, { autosave: true }), { fade: true });
    });
  }

  update() {
    const input = this.game.input;
    if (input.pressed('back')) { input.consume('back'); this.game.scenes.push(new PauseScene()); }
    else if (input.pressed('tab')) this.game.scenes.push(new StatusPanel());
  }

  draw(r) {
    this.view.draw(r);
    r.rect(0, 0, 480, 13, '#000000aa');
    r.text(`${this.info.subject} · ${this.game.state.locationName}`, 6, 3, { color: '#ffffff', shadow: '#000' });
    this.game.hud.draw(r, this.game.state);
  }
}
