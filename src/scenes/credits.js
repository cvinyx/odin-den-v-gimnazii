// Титры (главное меню): кто сделал игру. Тексты — в data/dialogs/credits.txt.
import { labelLines } from '../game/dialogs.js';
import { sheetOf } from '../gen/people.js';
import { frameRect } from '../gen/sprites.js';

const PARADE = ['roma', 'denis', 'igor', 'chernyak', 'shurpo', 'levonchuk', 'bochko', 'smile', 'matych', 'buy', 'guza', 'vadim', 'vitalik', 'zakha', 'anosov'];

export class CreditsScene {
  constructor() { this.id = 'credits'; this.opaque = true; this.t = 0; }
  enter(game) { this.game = game; this.lines = labelLines('credits', 'credits').map((l) => l.text); }
  update(dt) {
    this.t += dt;
    const input = this.game.input;
    if (this.t > 0.3 && (input.pressed('back') || input.pressed('confirm'))) { input.consume('back'); input.consume('confirm'); this.game.scenes.pop(); }
  }
  draw(r) {
    r.rect(0, 0, 480, 270, '#101024');
    const h = this.lines.length * 14 + 260;
    const off = (this.t * 18) % h;
    this.lines.forEach((l, i) => {
      const y = 250 + i * 14 - off;
      if (y < -10 || y > 230) return;
      const head = l.startsWith('#');
      r.text(head ? l.slice(1).trim() : l, 240, y, { align: 'center', color: head ? '#ffe14d' : '#ffffff', scale: head ? 2 : 1 });
    });
    // парад персонажей внизу
    PARADE.forEach((id, i) => {
      const x = ((i * 34 + this.t * 30) % 540) - 30;
      const f = frameRect('right', Math.floor(this.t * 6 + i) % 3);
      r.sprite(sheetOf(id), f.sx, f.sy, f.sw, f.sh, x, 236);
    });
    r.text('X — назад', 474, 4, { align: 'right', color: '#7d7d90' });
  }
}
