// Сцена диалога поверх карты: реплики, выборы, эффекты (изменения видны в HUD сразу).
import { DialogBox } from '../ui/dialog.js';
import { ChoiceMenu } from '../ui/choice.js';
import { DialogRunner } from '../game/dialog_runner.js';
import { getDialog } from '../game/dialogs.js';
import { getPerson, portraitOf, NARRATOR } from '../gen/people.js';

export class DialogScene {
  constructor(file, label, opts = {}) { this.id = 'dialog';
    this.file = file;
    this.label = label;
    this.onEnd = opts.onEnd || null;
    this.opaque = false;
    this.mode = 'say';
    this.choice = null;
    this.history = []; // для тестов: что было показано
  }

  enter(game) {
    this.game = game;
    this.box = new DialogBox(game);
    try {
      const script = getDialog(this.file);
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

  advance() {
    const ev = this.runner.next();
    if (ev.type === 'say') {
      this.mode = 'say';
      const person = getPerson(ev.who) || NARRATOR;
      const portrait = ev.who === 'narrator' ? null : portraitOf(ev.who, ev.emo);
      this.box.show(person, portrait, ev.text);
      this.history.push(ev);
    } else if (ev.type === 'choice') {
      this.mode = 'choice';
      this.choice = new ChoiceMenu(ev.question, ev.options);
      this.history.push(ev);
    } else {
      this.finish();
    }
  }

  finish() {
    this.mode = 'done';
    this.game.scenes.remove(this);
    const t = this.game.scenes.top;
    if (t && t.resume) t.resume({ dialogEnded: true }, this);
    if (this.onEnd) this.onEnd();
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
