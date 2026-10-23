// Концовки (раздел 16). На этапе 2 полностью работает «К директору!»; остальные — этап 6.
import { DialogScene } from './dialog_scene.js';
import { SCHEDULE } from '../../data/schedule.js';
import { formatMoney } from '../game/state.js';
import { totalDebt } from '../game/bets.js';

const TITLES = { director: 'К директору!' };

export class EndingScene {
  constructor(kind) { this.id = 'ending'; this.kind = kind; this.opaque = true; this.t = 0; this.talked = false; }
  enter(game) {
    this.game = game;
    game.state.phase = 'end';
    game.playMusic('director');
    game.scenes.push(new DialogScene('endings', this.kind, { onEnd: () => { this.talked = true; } }));
  }
  update(dt) {
    this.t += dt;
    if (this.talked && this.game.input.pressed('confirm')) {
      this.game.input.consume('confirm');
      import('./title.js').then(({ TitleScene }) => this.game.scenes.reset(new TitleScene(), { fade: true }));
    }
  }
  draw(r) {
    const st = this.game.state;
    r.rect(0, 0, 480, 270, '#1a0c0c');
    r.text('КОНЦОВКА', 240, 12, { align: 'center', color: '#9a9aa8' });
    r.text(TITLES[this.kind] || this.kind, 240, 26, { align: 'center', color: '#ff5a5a', scale: 2 });
    if (!this.talked) return;
    let y = 60;
    SCHEDULE.forEach((l, i) => { if (st.grades[i] != null) { r.text(`${l.subject}: ${st.grades[i]}`, 240, y, { align: 'center', color: '#ffffff' }); y += 11; } });
    r.text(`Вызовы к директору: ${st.directorCalls}`, 240, y + 6, { align: 'center', color: '#ffffff' });
    r.text(`Долги, которые Рома никогда не вернёт: ${formatMoney(totalDebt(st))} BYN`, 240, y + 20, { align: 'center', color: '#ff8a8a' });
    r.text(`Код дня: ${st.seed}`, 240, 220, { align: 'center', color: '#9fd3ff' });
    r.text('Z — в главное меню', 240, 250, { align: 'center', color: '#9a9aa8' });
  }
}
