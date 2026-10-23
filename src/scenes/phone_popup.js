// Уведомление на iPhone 11 (сообщение отца с переводом, раздел 8).
import { audio } from '../engine/audio.js';
import { formatMoney } from '../game/state.js';

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
    // корпус телефона с трещиной
    r.rect(x, y, 140, 220, '#1a1a1e');
    r.rect(x + 6, y + 10, 128, 200, '#2b4c7e');
    r.rect(x + 50, y + 4, 40, 4, '#000');
    r.rect(x + 6, y + 10, 128, 12, '#000');
    r.text('09:46', x + 10, y + 12, { color: '#fff' });
    r.text('■ 12%', x + 126, y + 12, { color: '#ff6a6a', align: 'right' });
    // трещина
    for (let i = 0; i < 30; i++) r.rect(x + 100 - i, y + 40 + i * 2 + (i % 3), 1, 2, '#cfe3ef');
    // уведомление
    r.rect(x + 10, y + 60, 120, 70, '#f0f0f4');
    r.text(this.opts.from, x + 16, y + 64, { color: '#202028' });
    const lines = r.wrap(this.opts.text || '', 108);
    lines.slice(0, 4).forEach((l, i) => r.text(l, x + 16, y + 78 + i * 10, { color: '#303040' }));
    r.rect(x + 10, y + 136, 120, 20, '#5ac85a');
    r.text('+' + formatMoney(this.opts.amount) + ' BYN', x + 70, y + 142, { align: 'center', color: '#0a2a0a' });
    r.text('Z', x + 70, y + 190, { align: 'center', color: '#ffffff' });
  }
}
