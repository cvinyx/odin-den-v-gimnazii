// Вертикальное меню: пункты с действиями, пункты-настройки (влево/вправо) и пункты «Скоро».
import { audio } from '../engine/audio.js';

// item: { label, action?, soon?, disabled?, value?: () => string, change?: (dir) => void }
export class Menu {
  constructor(items, opts = {}) {
    this.items = items;
    this.index = 0;
    this.opts = { lineH: 16, scale: 1, align: 'left', ...opts };
    this.skipDisabled();
  }

  skipDisabled(dir = 1) {
    const n = this.items.length;
    for (let i = 0; i < n && this.items[this.index].disabled; i++) this.index = (this.index + dir + n) % n;
  }

  move(dir) {
    const n = this.items.length;
    this.index = (this.index + dir + n) % n;
    this.skipDisabled(dir);
    audio.play('menuMove');
  }

  // Возвращает выбранный пункт (после подтверждения) или null.
  update(input, game) {
    if (input.pressed('up')) this.move(-1);
    if (input.pressed('down')) this.move(1);
    const it = this.items[this.index];
    if (it.change) {
      if (input.pressed('left')) { it.change(-1); audio.play('menuMove'); }
      if (input.pressed('right')) { it.change(1); audio.play('menuMove'); }
    }
    if (input.pressed('confirm')) {
      input.consume('confirm');
      if (it.disabled) { audio.play('menuDenied'); return null; }
      if (it.soon) { audio.play('menuDenied'); if (game) game.toast('Скоро'); return null; }
      if (it.change && !it.action) { it.change(1); audio.play('menuMove'); return null; }
      audio.play('menuSelect');
      if (it.action) it.action();
      return it;
    }
    return null;
  }

  draw(r, x, y, time = 0) {
    const { lineH, scale, align } = this.opts;
    this.items.forEach((it, i) => {
      const sel = i === this.index;
      let color = sel ? '#ffe14d' : '#ffffff';
      if (it.disabled) color = '#5c5a6e';
      let label = it.label;
      if (it.value) label += ':  ◄ ' + it.value() + ' ►';
      if (it.soon) label += '  (Скоро)';
      const ty = y + i * lineH;
      r.text(label, x, ty, { color, scale, align, shadow: '#000' });
      if (sel) {
        const w = r.measure(label, scale);
        const cx = align === 'center' ? x - w / 2 - 12 * scale : x - 12 * scale;
        const bob = Math.round(Math.sin(time * 6));
        r.text('♥', cx + bob, ty, { color: '#ff4a5a', scale });
      }
    });
  }

  height() { return this.items.length * this.opts.lineH; }
}
