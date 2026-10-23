// Подробная панель по Tab: статусы со шкалами, деньги, долги, код дня, расписание.
import { HUD_SLOTS, phaseLabel } from '../ui/hud.js';
import { getIcon } from '../gen/icons.js';
import { SCHEDULE, roomLabel } from '../../data/schedule.js';
import { formatMoney } from '../game/state.js';

export class StatusPanel {
  constructor() { this.id = 'status'; this.opaque = false; }
  enter(game) { this.game = game; }
  update() {
    const input = this.game.input;
    if (input.pressed('tab') || input.pressed('back') || input.pressed('confirm')) {
      input.consume('back'); input.consume('confirm');
      this.game.scenes.pop();
    }
  }
  draw(r) {
    const st = this.game.state;
    const s = st.stats;
    r.alpha(0.7, () => r.rect(0, 0, 480, 270, '#000'));
    r.box(8, 8, 464, 254);
    r.text('Статусы', 18, 16, { color: '#ffe14d', scale: 2 });
    r.text(`Код дня: ${st.seed}`, 462, 16, { color: '#9fd3ff', align: 'right' });
    r.text(phaseLabel(st) + ' · ' + (st.locationName || ''), 462, 28, { color: '#9a9aa8', align: 'right' });
    let y = 44;
    for (const slot of HUD_SLOTS) {
      r.image(getIcon(slot.icon), 18, y);
      let label = slot.label;
      if (slot.lessonOnly && st.phase !== 'lesson') label += ' (на уроке)';
      r.text(label, 30, y, { color: '#ffffff' });
      r.text(slot.fmt(s) + (slot.key === 'money' ? ' BYN' : ''), 196, y, { color: slot.critical(s) ? '#ff5a5a' : '#ffffff', align: 'right' });
      if (slot.bar) {
        r.rect(30, y + 10, 166, 4, '#2c2840');
        r.rect(30, y + 10, Math.round(166 * slot.bar(s)), 4, slot.color);
      }
      if (slot.juice) r.text(`жижка: ${s.juice} запр.`, 30, y + 16, { color: '#c9a0ff' });
      y += slot.juice ? 28 : 22;
    }
    const debt = st.debts.reduce((a, d) => a + d.amount, 0);
    r.text(`Вызовы к директору: ${st.directorCalls}`, 18, y + 2, { color: '#ffffff' });
    r.text(`Долги: ${formatMoney(debt)} BYN`, 18, y + 14, { color: debt ? '#ff8a8a' : '#ffffff' });

    // расписание
    const x0 = 214;
    r.text('Расписание', x0, 44, { color: '#ffe14d' });
    SCHEDULE.forEach((l, i) => {
      const yy = 58 + i * 26;
      const cur = st.phase === 'lesson' && st.lesson === l.n;
      const done = st.grades[l.n - 1] != null;
      const color = cur ? '#ffe14d' : done ? '#7d7d90' : '#ffffff';
      r.text(`${l.n}. ${l.start}  ${l.subject}`, x0, yy, { color });
      r.text(roomLabel(l), x0 + 18, yy + 10, { color: '#9a9aa8' });
      if (done) r.text('оценка ' + st.grades[l.n - 1], 462, yy, { color: '#6be36b', align: 'right' });
    });
    r.text('Tab / X — закрыть', 240, 250, { color: '#9a9aa8', align: 'center' });
  }
}
