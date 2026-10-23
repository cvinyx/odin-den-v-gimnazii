// ВРЕМЕННЫЙ финал дня (этап 3): после 7-го урока — оценки и статусы. Полные концовки — этап 6.
import { HUD_SLOTS } from '../ui/hud.js';
import { getIcon } from '../gen/icons.js';
import { formatMoney } from '../game/state.js';
import { totalDebt } from '../game/bets.js';
import { SCHEDULE } from '../../data/schedule.js';
import { getPerson } from '../gen/people.js';
import { formatTimer } from '../ui/format.js';
import { storeRemove, KEYS } from '../engine/save.js';

export class DayEndScene {
  constructor() { this.id = 'day_end'; this.opaque = true; this.t = 0; }
  enter(game) {
    this.game = game;
    game.state.phase = 'end';
    game.playMusic('menu');
    storeRemove(KEYS.autosave); // день окончен — «Продолжить» больше нечего
  }
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
    r.text('Последний звонок!', 240, 8, { align: 'center', color: '#ffe14d', scale: 2 });
    r.text('День пережит. (Временный финал — полные концовки появятся на этапе 6.)', 240, 30, { align: 'center', color: '#9a9aa8' });
    r.text('Оценки:', 30, 48, { color: '#9fd3ff' });
    SCHEDULE.forEach((l, i) => {
      const g = st.grades[i];
      r.text(`${l.n}. ${l.subject}`, 30, 60 + i * 11, { color: '#ffffff' });
      r.text(g == null ? '—' : String(g), 200, 60 + i * 11, { color: g >= 7 ? '#6be36b' : g >= 5 ? '#ffe14d' : '#ff6a6a', align: 'right' });
    });
    const gs = st.grades.filter((x) => x != null);
    const avg = gs.length ? gs.reduce((a, b) => a + b, 0) / gs.length : 0;
    r.text(`Средняя: ${avg.toFixed(1)}`, 30, 142, { color: '#ffe14d' });
    let y = 48;
    for (const slot of HUD_SLOTS) {
      if (slot.lessonOnly) continue;
      r.image(getIcon(slot.icon), 250, y);
      r.text(slot.label, 262, y, { color: '#ffffff' });
      r.text(slot.fmt(st.stats), 450, y, { color: '#ffffff', align: 'right' });
      y += 12;
    }
    const m = st.flags.matchScore;
    r.text(`Эль-Класико: ${m ? '«ИнЯз» ' + m + ' «Физмат»' : 'не сыграно'}`, 250, y + 4, { color: '#ffffff' });
    r.text(`Вызовы к директору: ${st.directorCalls}`, 250, y + 16, { color: '#ffffff' });
    r.text(`Побед: ${st.wins} · Затяжек: ${st.puffsToday} · Срывов: ${st.breakdowns}`, 250, y + 28, { color: '#ffffff' });
    r.text(`Долги, которые Рома никогда не вернёт: ${formatMoney(totalDebt(st))} BYN`, 240, 170, { align: 'center', color: '#ff8a8a' });
    st.debts.slice(0, 6).forEach((d, i) => r.text(`${(getPerson(d.to) || { short: d.to }).short}: ${formatMoney(d.amount)}`, 60 + (i % 3) * 130, 184 + Math.floor(i / 3) * 11, { color: '#ffb0b0' }));
    r.text(`Код дня: ${st.seed} · Время: ${formatTimer(st.playTime)}`, 240, 222, { align: 'center', color: '#9fd3ff' });
    r.text('Z — в главное меню', 240, 250, { align: 'center', color: '#9a9aa8' });
  }
}
