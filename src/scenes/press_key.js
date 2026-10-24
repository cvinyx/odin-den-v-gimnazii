// Экран загрузки: «Нажми любую клавишу». Нужен, чтобы браузер разрешил звук (первое нажатие).
import { sheetOf } from '../gen/people.js';
import { frameRect } from '../gen/sprites.js';
import { TitleScene } from './title.js';

export class PressKeyScene {
  constructor() { this.id = 'press_key'; this.opaque = true; this.t = 0; }
  enter(game) { this.game = game; }
  update(dt) {
    this.t += dt;
    const input = this.game.input;
    if (this.t > 0.2 && input.anyPressed()) { input.consumeAll(); this.game.scenes.reset(new TitleScene(), { fade: true }); }
  }
  draw(r) {
    r.rect(0, 0, 480, 270, '#101024');
    for (let i = 0; i < 40; i++) r.rect((i * 97) % 480, (i * 53) % 150, 1, 1, '#4a4668');
    r.text('Один день', 240, 70, { align: 'center', color: '#ffe14d', scale: 3, shadow: '#000' });
    r.text('в гимназии', 240, 100, { align: 'center', color: '#ffffff', scale: 3, shadow: '#000' });
    const f = frameRect('down', 0);
    r.sprite(sheetOf('roma'), f.sx, f.sy, f.sw, f.sh, 240 - f.sw, 140, 2);
    if (Math.floor(this.t * 2) % 2 === 0) r.text('Нажми любую клавишу', 240, 210, { align: 'center', color: '#c8c8d8' });
    r.text('(клавиша включит и звук)', 240, 224, { align: 'center', color: '#7d7d90' });
  }
}
