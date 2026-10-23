// Школьный звонок: звук и надпись.
import { audio } from '../engine/audio.js';

export class BellScene {
  constructor(opts = {}) { this.id = 'bell'; this.opts = opts; this.opaque = false; this.t = 0; }
  enter(game) { this.game = game; audio.play('bell'); game.r.shake(2, 1.6); }
  update(dt) {
    this.t += dt;
    if (this.t > 2.0 || (this.t > 0.5 && this.game.input.pressed('confirm'))) {
      this.game.input.consume('confirm');
      this.game.scenes.remove(this);
      if (this.opts.onDone) this.opts.onDone();
    }
  }
  draw(r) {
    r.alpha(0.5, () => r.rect(0, 0, 480, 234, '#000'));
    const ox = Math.round(Math.sin(this.t * 60) * 2);
    r.text('ДЗЗЗЫНЬ!', 240 + ox, 100, { align: 'center', color: '#ffe14d', scale: 2, shadow: '#000' });
    r.text(this.opts.text || 'Звонок', 240, 126, { align: 'center', color: '#ffffff', shadow: '#000' });
  }
}
