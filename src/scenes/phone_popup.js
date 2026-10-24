// Уведомление на iPhone 11 (сообщение отца с переводом, раздел 8).
import { audio } from '../engine/audio.js';
import { formatMoney } from '../game/state.js';
import { drawPhoneFrame, drawCrack, PHONE } from '../minigames/phone_shell.js';

export class PhonePopupScene {
  constructor(opts) { this.id = 'phone'; this.opts = opts; this.opaque = false; this.t = 0; }
  enter(game) { this.game = game; audio.play('coin'); }
  update(dt) {
    this.t += dt;
    const input = this.game.input;
    if (this.t > 0.6 && input.pressed('confirm')) {
      input.consume('confirm');
      this.game.scenes.remove(this);
      if (this.opts.onDone) this.opts.onDone();
    }
  }
  draw(r) {
    r.alpha(0.5, () => r.rect(0, 0, 480, 270, '#000'));
    const k = Math.min(1, this.t * 4);
    const x = Math.round(480 - 300 * (1 - Math.pow(1 - k, 3)));
    const y = 20;
    // тот же iPhone 11 с трещиной, что и в телефонных мини-играх
    const st = this.game && this.game.state;
    drawPhoneFrame(r, x, y, st ? st.stats.battery : 12, st ? st.playTime : 0);
    r.rect(x + PHONE.sx, y + PHONE.sy, PHONE.sw, PHONE.sh, '#2b4c7e');
    drawCrack(r, x, y);
    // уведомление
    r.rect(x + 12, y + 60, 120, 70, '#f0f0f4');
    r.text(this.opts.from, x + 18, y + 64, { color: '#202028' });
    const lines = r.wrap(this.opts.text || '', 108);
    lines.slice(0, 4).forEach((l, i) => r.text(l, x + 18, y + 78 + i * 10, { color: '#303040' }));
    r.rect(x + 12, y + 136, 120, 20, '#5ac85a');
    r.text('+' + formatMoney(this.opts.amount) + ' BYN', x + 70, y + 142, { align: 'center', color: '#0a2a0a' });
    r.text('Z', x + 72, y + 196, { align: 'center', color: '#ffffff' });
  }
}
