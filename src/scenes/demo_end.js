// «Конец демо-версии» (этап 2): после Перемены 1 вход в любой кабинет. На этапе 3 заменится продолжением дня.
import { HUD_SLOTS } from '../ui/hud.js';
import { getIcon } from '../gen/icons.js';
import { formatMoney } from '../game/state.js';
import { totalDebt } from '../game/bets.js';
import { SCHEDULE } from '../../data/schedule.js';
import { getPerson } from '../gen/people.js';

export class DemoEndScene {
  constructor() { this.id = 'demo_end'; this.opaque = true; this.t = 0; }
  enter(game) { this.game = game; game.playMusic('menu'); }
  update(dt) {
    this.t += dt;
    if (this.t > 1 && this.game.input.pressed('confirm')) {
      this.game.input.consume('confirm');
      import('./title.js').then(({ TitleScene }) => this.game.scenes.reset(new TitleScene(), { fade: true }));
    }
  }
  draw(r) {
    const st = this.game.state;
    r.rect(0, 0, 480, 270, '#101024');
    r.text('Конец демо-версии', 240, 14, { align: 'center', color: '#ffe14d', scale: 2 });
    r.text('Дальше — математика в корпусе 1. Он откроется на следующем этапе.', 240, 38, { align: 'center', color: '#c8c8d8' });
    let y = 58;
    for (const slot of HUD_SLOTS) {
      if (slot.lessonOnly) continue;
      r.image(getIcon(slot.icon), 60, y);
      r.text(slot.label, 72, y, { color: '#ffffff' });
      r.text(slot.fmt(st.stats), 230, y, { color: '#ffffff', align: 'right' });
      y += 13;
    }
    const x2 = 260;
    r.text('Оценки:', x2, 58, { color: '#9a9aa8' });
    SCHEDULE.forEach((l, i) => { if (st.grades[i] != null) r.text(`${l.subject}: ${st.grades[i]}`, x2, 70 + i * 11, { color: '#ffffff' }); });
    r.text(`Вызовы к директору: ${st.directorCalls}`, x2, 120, { color: '#ffffff' });
    r.text(`Побед в спорах: ${st.wins}`, x2, 132, { color: '#ffffff' });
    r.text(`Затяжек: ${st.puffsToday}`, x2, 144, { color: '#ffffff' });
    r.text('Долги, которые Рома никогда', 60, 160, { color: '#ff8a8a' });
    r.text(`не вернёт: ${formatMoney(totalDebt(st))} BYN`, 60, 171, { color: '#ff8a8a' });
    st.debts.slice(0, 4).forEach((d, i) => r.text(`· ${(getPerson(d.to) || { short: d.to }).short}: ${formatMoney(d.amount)}`, 260, 160 + i * 11, { color: '#ffb0b0' }));
    r.text(`Код дня: ${st.seed}`, 240, 216, { align: 'center', color: '#9fd3ff' });
    r.text('Z — в главное меню', 240, 250, { align: 'center', color: '#9a9aa8' });
  }
}
