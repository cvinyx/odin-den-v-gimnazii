// «Тест» на уроке (М-4, ИС-1): 10 вопросов из банка предмета (data/tests/*.txt) по коду дня.
// В начале выбор: «Решать самому» / «Списывать у соседа» / «Списывать с телефона». Списывание — это
// «Списывание» (cheat.js) на cheatSeconds; что не успел списать — решаешь сам. Оценка = число верных,
// но не ниже минимума предмета (Р-6). Сидишь один — соседа нет; телефон сел — с телефона нельзя.
import { registerMinigame } from './registry.js';
import { CheatGame } from './cheat.js';
import { ClassroomView } from '../world/classroom_view.js';
import { lessonInfo, minGrade } from '../game/day.js';
import { pickQuestions } from '../game/test_bank.js';
import { testGrade } from '../game/test_parse.js';
import { ChoiceMenu } from '../ui/choice.js';
import { BALANCE } from '../../data/balance.js';
import { audio } from '../engine/audio.js';
import { GAME_H } from '../engine/renderer.js';

const T = BALANCE.test;

// Есть ли сосед за партой Ромы (по рассадке урока).
export function hasNeighbor(roster) {
  const r = roster && roster.roma;
  if (!r) return false;
  return roster.seats.some((s) => s.c === r.c && s.d === r.d && s.side !== r.side);
}

// Какие способы доступны (ИС-1).
export function testModes(state, roster) {
  const modes = [{ id: 'self', text: 'Решать самому' }];
  if (hasNeighbor(roster)) modes.push({ id: 'neighbor', text: 'Списывать у соседа' });
  if (state.stats.battery > 0) modes.push({ id: 'phone', text: 'Списывать с телефона' });
  return modes;
}

export class TestGame {
  constructor(ctx) { this.ctx = ctx; this.game = ctx.game; this.rng = ctx.rng; this.done = false; this.time = 0; }

  start(params) {
    const st = this.ctx.state;
    this.params = params;
    this.lesson = lessonInfo(params.lesson || st.lesson || 1) || lessonInfo(1);
    this.view = params.view || new ClassroomView(st, this.lesson);
    this.questions = pickQuestions(st, this.lesson.subjectId, T.questions);
    this.modes = testModes(st, this.view.roster);
    this.menu = new ChoiceMenu(`Тест: ${this.lesson.subject}, ${this.questions.length} вопросов. Как писать?`, this.modes);
    this.phase = 'choose';
    this.correct = 0; this.copied = 0; this.qi = 0; this.answers = [];
    this.director = false;
  }

  choose(i) {
    this.mode = this.modes[i].id;
    if (this.mode === 'self') return this.nextQuestion();
    this.cheat = new CheatGame(this.ctx);
    this.cheat.start({ ...this.params, view: this.view, phone: this.mode === 'phone', duration: T.cheatSeconds });
    this.phase = 'cheat';
  }

  nextQuestion() {
    if (this.qi >= this.questions.length) { this.phase = 'done'; this.done = true; return; }
    const q = this.questions[this.qi];
    this.qMenu = new ChoiceMenu('', q.options.map((o) => ({ text: o.text })));
    this.qTime = T.questionSeconds;
    this.phase = 'quiz';
  }

  answer(i) {
    const q = this.questions[this.qi];
    const right = i >= 0 && q.options[i].right;
    if (right) this.correct++;
    this.answers.push(right);
    audio.play(right ? 'statUp' : 'statDown');
    this.flash = { right, t: 0.8 };
    this.qi++;
    this.nextQuestion();
  }

  update(dt, input) {
    this.time += dt;
    if (this.flash) { this.flash.t -= dt; if (this.flash.t <= 0) this.flash = null; }
    if (this.phase === 'choose') {
      const i = this.autoplay ? this.botMode() : this.menu.update(dt, input);
      if (i >= 0) this.choose(i);
    } else if (this.phase === 'cheat') {
      this.cheat.autoplay = this.autoplay;
      this.cheat.update(dt, input);
      if (this.cheat.done) {
        const res = this.cheat.end();
        if (res.result === 'director') { this.director = true; this.phase = 'done'; this.done = true; return; }
        // списанные ответы: часть может быть неверной (у соседа — чаще)
        const acc = this.mode === 'phone' ? T.phoneAccuracy : T.neighborAccuracy;
        this.copied = Math.min(this.questions.length, res.extra.answers);
        for (let k = 0; k < this.copied; k++) { const ok = this.rng.chance(acc); if (ok) this.correct++; this.answers.push(ok); }
        this.qi = this.copied;
        this.nextQuestion();
      }
    } else if (this.phase === 'quiz') {
      this.qTime -= dt;
      if (this.qTime <= 0) return this.answer(-1);
      const i = this.autoplay ? this.botAnswer(dt) : this.qMenu.update(dt, input);
      if (i >= 0) this.answer(i);
    }
  }

  // Бот: списывает, если можно (у соседа надёжнее по подозрению), иначе решает сам.
  botMode() {
    const k = this.modes.findIndex((m) => m.id === 'neighbor');
    return k >= 0 ? k : 0;
  }
  botAnswer(dt) {
    this.botT = (this.botT || 0) + dt;
    if (this.botT < 0.6) return -1;
    this.botT = 0;
    const q = this.questions[this.qi];
    const right = q.options.findIndex((o) => o.right);
    return this.rng.chance(T.botRight) ? right : (right + 1 + this.rng.int(0, 2)) % 4;
  }

  forfeit() { this.qi = this.questions.length; this.phase = 'done'; this.done = true; return this.end(); }

  end() {
    const min = minGrade(this.lesson);
    if (this.director) return { result: 'director', deltas: {}, money: 0, grade: BALANCE.director.grade, extra: { director: true }, summary: 'Учитель всё видел. Тест отобрали.' };
    const grade = testGrade(this.correct, min);
    const how = this.copied ? `списано ${this.copied}, сам — ${this.questions.length - this.copied}` : 'всё сам';
    return {
      result: grade >= 6 ? 'win' : 'lose', deltas: {}, money: 0, grade,
      extra: { correct: this.correct, copied: this.copied, mode: this.mode },
      summary: `Верных: ${this.correct} из ${this.questions.length} (${how}) → оценка ${grade}`,
    };
  }

  draw(r) {
    if (this.phase === 'cheat') { this.cheat.draw(r); return; }
    this.view.draw(r);
    r.alpha(0.55, () => r.rect(0, 0, 480, GAME_H, '#000'));
    if (this.phase === 'choose') {
      this.menu.draw(r, 200);
      if (!this.modes.some((m) => m.id === 'neighbor')) r.text('Сидишь один — списать у соседа не получится.', 240, 210, { align: 'center', color: '#9a9aa8' });
      if (!this.modes.some((m) => m.id === 'phone')) r.text('Телефон сел — с телефона не списать.', 240, 222, { align: 'center', color: '#9a9aa8' });
    } else if (this.phase === 'quiz' || this.phase === 'done') {
      const q = this.questions[Math.min(this.qi, this.questions.length - 1)];
      r.rect(0, 0, 480, 14, '#000');
      r.text(`Вопрос ${Math.min(this.qi + 1, this.questions.length)}/${this.questions.length}`, 6, 3, { color: '#9fd3ff' });
      r.text(`Верных: ${this.correct}`, 240, 3, { align: 'center', color: '#6be36b' });
      const left = Math.max(0, Math.ceil(this.qTime || 0));
      r.text(`0:${String(left).padStart(2, '0')}`, 474, 3, { align: 'right', color: left <= 5 ? '#ff5a5a' : '#ffffff' });
      r.box(20, 22, 440, 52);
      const lines = r.wrap(q.q, 420);
      lines.slice(0, 3).forEach((l, i) => r.text(l, 30, 30 + i * 12, { color: '#ffffff' }));
      if (this.qMenu && this.phase === 'quiz') this.qMenu.draw(r, 210);
      if (this.flash) r.text(this.flash.right ? 'Верно!' : 'Мимо…', 240, 82, { align: 'center', color: this.flash.right ? '#6be36b' : '#ff6a6a', scale: 2, shadow: '#000' });
    }
    this.game.hud.draw(r, this.ctx.state);
  }
}

registerMinigame('test', {
  title: 'Тест',
  music: 'lesson',
  keys: ['Выбери: решать самому, у соседа или с телефона', '↑↓ и Z — ответ, на вопрос 20 секунд', 'Списываешь — держи Z, пока учитель не смотрит', 'Не успел списать — дорешай сам'],
  describe: () => '10 вопросов. Оценка = число верных (не ниже минимума).',
  create: (ctx) => new TestGame(ctx),
});
