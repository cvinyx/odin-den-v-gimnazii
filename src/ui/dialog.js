// Окно диалога в стиле Undertale (раздел 4): чёрное окно с белой рамкой 2 px, портрет 48×48 слева,
// до 3 строк, печать по буквам с блипами, эффекты {shake} {slow} {wave} {c=цвет}.
import { GAME_H } from '../engine/renderer.js';
import { CELL_W } from '../engine/font.js';
import { parseRichText } from './dialog_script.js';
import { audio } from '../engine/audio.js';
import { wrapRich } from './dialog_wrap.js';

export { wrapRich };

export const BOX = { x: 6, y: GAME_H - 68, w: 468, h: 64 };
const LINES = 3;
const LINE_STEP = 15;
export const TEXT_SPEEDS = { slow: 22, normal: 42, fast: 90 };

export class DialogBox {
  constructor(game) {
    this.game = game;
    this.pages = [];
    this.page = 0;
    this.shown = 0;
    this.acc = 0;
    this.time = 0;
    this.speaker = null;
    this.portrait = null;
  }

  // person — объект персонажа, portrait — канвас или null.
  show(person, portrait, text) {
    this.speaker = person;
    this.portrait = portrait;
    const maxChars = portrait ? 60 : 72;
    const lines = wrapRich(parseRichText(text), maxChars);
    this.pages = [];
    for (let i = 0; i < lines.length; i += LINES) this.pages.push(lines.slice(i, i + LINES));
    this.page = 0;
    this.startPage();
  }

  startPage() {
    this.shown = 0;
    this.acc = 0;
    this.blipCount = 0;
    const p = this.pages[this.page] || [];
    this.pageChars = p.reduce((n, l) => n + l.length, 0);
  }

  get pageDone() { return this.shown >= this.pageChars; }

  charAt(index) {
    let i = index;
    for (const l of this.pages[this.page]) {
      if (i < l.length) return l[i];
      i -= l.length;
    }
    return null;
  }

  // Возвращает true, когда весь текст прочитан и игрок нажал «дальше».
  update(dt, input) {
    this.time += dt;
    const speedName = this.game.settings.textSpeed || 'normal';
    const cps = TEXT_SPEEDS[speedName] || TEXT_SPEEDS.normal;
    if (!this.pageDone) {
      if (input.pressed('back') || input.pressed('confirm')) {
        this.shown = this.pageChars;
        input.consume('confirm');
        input.consume('back');
      } else {
        this.acc += dt;
        while (!this.pageDone) {
          const c = this.charAt(Math.floor(this.shown));
          const need = 1 / (c && c.slow ? cps * 0.3 : cps);
          if (this.acc < need) break;
          this.acc -= need;
          this.shown++;
          if (c && c.ch !== ' ' && /[^.,!?…\-—]/.test(c.ch)) {
            if (this.blipCount++ % 2 === 0) this.blip();
          }
          if (c && /[.!?…]/.test(c.ch)) this.acc -= need * 3; // пауза на знаках препинания
        }
      }
      return false;
    }
    if (input.pressed('confirm')) {
      input.consume('confirm');
      if (this.page < this.pages.length - 1) {
        this.page++;
        this.startPage();
        return false;
      }
      return true;
    }
    return false;
  }

  blip() {
    const b = (this.speaker && this.speaker.blip) || { freq: 200, wave: 'triangle' };
    audio.blip(b.freq || 180, b.freq ? b.wave : 'triangle');
  }

  draw(r) {
    const { x, y, w, h } = BOX;
    r.box(x, y, w, h);
    let tx = x + 10;
    if (this.portrait) {
      r.image(this.portrait, x + 8, y + 8);
      tx = x + 62;
    }
    if (this.speaker && this.speaker.short && !this.speaker.narrator) {
      const name = this.speaker.adult ? this.speaker.name : this.speaker.short; // учителей — по имени-отчеству
      const nw = r.measure(name) + 10;
      r.box(x + 4, y - 13, nw, 15);
      r.text(name, x + 9, y - 9, { color: '#ffe14d' });
    }
    const lines = this.pages[this.page] || [];
    let idx = 0;
    const narr = this.speaker && this.speaker.narrator;
    lines.forEach((line, li) => {
      line.forEach((c, ci) => {
        if (idx++ >= this.shown) return;
        let ox = 0, oy = 0;
        if (c.shake) {
          const k = Math.floor(this.time * 30) + ci * 7 + li * 13;
          ox = (k * 37) % 2;
          oy = ((k * 53) % 3) - 1;
        }
        if (c.wave) oy += Math.round(Math.sin(this.time * 8 + ci * 0.7) * 1.5);
        const color = c.color || (narr ? '#c8c8d8' : '#ffffff');
        r.glyph(c.ch, tx + ci * CELL_W + ox, y + 10 + li * LINE_STEP + oy, color);
      });
    });
    if (this.pageDone && r.blink(0.4)) {
      r.text('▼', x + w - 14, y + h - 12, { color: '#ffffff' });
    }
  }
}
