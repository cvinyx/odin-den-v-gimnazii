// Меню выбора A–D (раздел 4). Появляется только в диалогах и точках взаимодействия.
import { audio } from '../engine/audio.js';
import { BOX } from './dialog.js';
import { wrapText } from '../engine/font.js';

const LETTERS = ['A', 'B', 'C', 'D'];

export class ChoiceMenu {
  constructor(question, options) {
    this.question = question || '';
    this.options = options; // [{ text }]
    this.index = 0;
    this.time = 0;
    this.lines = options.map((o) => wrapText(o.text, 440 - 30));
  }

  // Возвращает индекс выбранного варианта или -1.
  update(dt, input) {
    this.time += dt;
    const n = this.options.length;
    if (input.pressed('up')) { this.index = (this.index + n - 1) % n; audio.play('menuMove'); }
    if (input.pressed('down')) { this.index = (this.index + 1) % n; audio.play('menuMove'); }
    if (input.pressed('confirm')) {
      input.consume('confirm');
      audio.play('menuSelect');
      return this.index;
    }
    return -1;
  }

  height() {
    let h = 12;
    if (this.question) h += 14;
    for (const l of this.lines) h += l.length * 10 + 3;
    return h;
  }

  draw(r) {
    const h = this.height();
    const x = BOX.x + 20, w = BOX.w - 40;
    const y = BOX.y - h - 18;
    r.box(x, y, w, h);
    let ty = y + 7;
    if (this.question) {
      r.text(this.question, x + 10, ty, { color: '#9fd3ff' });
      ty += 14;
    }
    this.options.forEach((o, i) => {
      const sel = i === this.index;
      const color = sel ? '#ffe14d' : '#ffffff';
      if (sel) r.text('♥', x + 6, ty, { color: '#ff4a5a' });
      r.text(LETTERS[i] + ')', x + 16, ty, { color });
      this.lines[i].forEach((line, li) => r.text(line, x + 34, ty + li * 10, { color }));
      ty += this.lines[i].length * 10 + 3;
    });
  }
}
