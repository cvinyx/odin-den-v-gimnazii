// Отдельный выбор в точке взаимодействия (лестница, кабинка): вопрос + варианты A–D.
import { ChoiceMenu } from '../ui/choice.js';

export class ChoiceScene {
  // options: [{ text }]; onPick(index) — вызывается после закрытия; X — отмена (onPick(-1)).
  constructor(question, options, onPick) {
    this.id = 'choice';
    this.opaque = false;
    this.menu = new ChoiceMenu(question, options);
    this.onPick = onPick;
  }
  enter(game) { this.game = game; }
  update(dt) {
    const input = this.game.input;
    if (input.pressed('back')) { input.consume('back'); this.close(-1); return; }
    const i = this.menu.update(dt, input);
    if (i >= 0) this.close(i);
  }
  close(i) { this.game.scenes.remove(this); this.onPick(i); }
  draw(r) { this.menu.draw(r); }
}
