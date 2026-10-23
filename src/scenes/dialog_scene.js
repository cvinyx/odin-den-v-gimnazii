// Сцена диалога поверх карты: реплики, выборы, эффекты (изменения видны в HUD сразу).
// opts: onEnd(), vars (подстановки %имя% в тексте), opp (кто такой @opp — соперник/кредитор),
//       script (готовый разобранный скрипт вместо файла).
import { DialogBox } from '../ui/dialog.js';
import { ChoiceMenu } from '../ui/choice.js';
import { DialogRunner } from '../game/dialog_runner.js';
import { getDialog, labelLines } from '../game/dialogs.js';
import { getPerson, portraitOf, NARRATOR } from '../gen/people.js';
import { eventRng } from '../game/day.js';

export class DialogScene {
  constructor(file, label, opts = {}) {
    this.id = 'dialog';
    this.file = file;
    this.label = label;
    this.opts = opts;
    this.onEnd = opts.onEnd || null;
    this.opaque = false;
    this.mode = 'say';
    this.choice = null;
    this.history = []; // что было показано (для тестов и бота)
  }

  // Короткое сообщение без файла: DialogScene.message(['текст', ...]) или [{ who, emo, text }].
  static message(lines, opts = {}) {
    const cmds = lines.map((l) => (typeof l === 'string' ? { type: 'say', who: 'narrator', emo: 'norm', text: l } : { type: 'say', emo: 'norm', ...l }));
    return new DialogScene(null, 'main', { ...opts, script: { labels: { main: { cmds } } } });
  }

  enter(game) {
    this.game = game;
    this.box = new DialogBox(game);
    try {
      const script = this.opts.script || getDialog(this.file);
      this.runner = new DialogRunner(script, this.label, {
        effect: (e) => game.applyEffect(e),
        stat: (n) => game.scriptStat(n),
        flag: (n) => game.scriptFlag(n),
      });
      this.advance();
    } catch (err) {
      console.error(err);
      this.runner = null;
      this.box.show(NARRATOR, null, '{c=red}Ошибка в диалоге:{/c} ' + String(err.message).split('\n')[0]);
    }
  }

  subst(text) {
    const vars = this.opts.vars || {};
    return text.replace(/%(\w+)%/g, (m, k) => (k in vars ? String(vars[k]) : m));
  }

  advance() {
    const ev = this.runner.next();
    if (ev.type === 'say') {
      this.mode = 'say';
      const who = ev.who === 'opp' ? this.opts.opp || 'narrator' : ev.who;
      const person = getPerson(who) || NARRATOR;
      const portrait = who === 'narrator' ? null : portraitOf(who, ev.emo);
      this.box.show(person, portrait, this.subst(ev.text));
      this.history.push({ ...ev, who });
    } else if (ev.type === 'choice') {
      const st = this.game.state;
      if (st.breakdownPending && ev.options.length > 1) {
        // срыв: выбор «проваливается» — Рома выпаливает случайный вариант
        st.breakdownPending = false;
        const i = eventRng(st, 'breakdown' + st.breakdowns).int(0, ev.options.length - 1);
        this.history.push({ type: 'breakdown', option: i });
        this.runner.choose(i);
        const line = labelLines('system', 'breakdown_choice')[0];
        this.mode = 'say';
        this.box.show(getPerson('roma'), portraitOf('roma', 'angry'), (line ? line.text : '') + ' ' + ev.options[i].text);
        this.game.r.shake(4, 0.5);
        return;
      }
      this.mode = 'choice';
      this.choice = new ChoiceMenu(this.subst(ev.question), ev.options.map((o) => ({ text: this.subst(o.text) })));
      this.history.push(ev);
    } else {
      this.finish();
    }
  }

  finish() {
    if (this.mode === 'done') return;
    this.mode = 'done';
    this.game.scenes.remove(this);
    const t = this.game.scenes.top;
    if (t && t.resume) t.resume({ dialogEnded: true }, this);
    if (this.onEnd) this.onEnd(this);
  }

  update(dt) {
    const input = this.game.input;
    if (this.mode === 'say') {
      if (this.box.update(dt, input)) {
        if (!this.runner) this.finish();
        else this.advance();
      }
    } else if (this.mode === 'choice') {
      this.box.time += dt;
      const i = this.choice.update(dt, input);
      if (i >= 0) {
        this.history.push({ type: 'chosen', option: i });
        this.runner.choose(i);
        this.choice = null;
        this.advance();
      }
    }
  }

  draw(r) {
    if (this.mode === 'done') return;
    r.withShake(() => {
      this.box.draw(r);
      if (this.mode === 'choice' && this.choice) this.choice.draw(r);
    });
  }
}
