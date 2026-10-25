// Вкладки «Расписание» и «Дневник» (EDITS_V2: Р-8). Открываются из «Настроек» и из паузы (Esc).
// «Расписание» доступно всегда. «Дневник» выглядит как экран телефона: оценки за неделю по дням
// и средний балл; при батарее 0 — «Телефон сел».
import { DAYS, DAY_SHORT, BELLS, daySchedule } from '../../data/schedule.js';
import { drawPhoneFrame, drawCrack, PHONE } from '../minigames/phone_shell.js';
import { weekAverage } from '../game/day.js';

const gradeColor = (g) => (g >= 7 ? '#2e9e3e' : g >= 5 ? '#b08a10' : '#d23a3a');

export class ScheduleScene {
  constructor() { this.id = 'schedule'; this.opaque = false; this.t = 0; }
  enter(game) { this.game = game; }
  update(dt) {
    this.t += dt;
    const input = this.game.input;
    if (input.pressed('back') || (this.t > 0.3 && input.pressed('confirm'))) {
      input.consume('back'); input.consume('confirm');
      this.game.scenes.pop();
    }
  }
  draw(r) {
    const st = this.game.state;
    const today = st && st.seed ? st.day : 0;
    const cur = st && st.phase === 'lesson' ? st.lesson : 0;
    r.alpha(0.8, () => r.rect(0, 0, 480, 270, '#000'));
    r.box(4, 4, 472, 262, '#ffffff', '#141428');
    r.text('Расписание 11 «И»', 240, 10, { align: 'center', color: '#ffe14d', scale: 2 });
    const x0 = 52, cw = 84, y0 = 34, rh = 30;
    DAYS.forEach((d, i) => {
      const x = x0 + i * cw;
      if (i + 1 === today) r.rect(x, y0 - 2, cw - 2, 12 + 7 * rh, '#2a2a50');
      r.text(d, x + cw / 2 - 1, y0, { align: 'center', color: i + 1 === today ? '#ffe14d' : '#9fd3ff' });
    });
    BELLS.forEach((b, n) => {
      const y = y0 + 12 + n * rh;
      r.text(`${n + 1}.`, 10, y + 2, { color: '#ffffff' });
      r.text(b.start, 10, y + 12, { color: '#7d7d90' });
      for (let d = 1; d <= 5; d++) {
        const l = daySchedule(d)[n];
        if (!l) continue;
        const x = x0 + (d - 1) * cw;
        if (d === today && n + 1 === cur) r.frame(x, y - 1, cw - 2, rh - 2, '#ffe14d');
        r.text(l.short, x + 3, y + 2, { color: '#ffffff' });
        r.text(l.building === 0 ? l.room : 'каб. ' + l.room, x + 3, y + 12, { color: '#7d7d90' });
      }
    });
    r.text('X — назад', 240, 254, { align: 'center', color: '#5a5a6a' });
  }
}

export class DiaryScene {
  constructor() { this.id = 'diary'; this.opaque = false; this.t = 0; this.day = null; }
  enter(game) {
    this.game = game;
    const st = game.state;
    this.day = st && st.seed ? st.day : 1;
  }
  update(dt) {
    this.t += dt;
    const input = this.game.input;
    if (input.pressed('back') || (this.t > 0.3 && input.pressed('confirm'))) {
      input.consume('back'); input.consume('confirm');
      this.game.scenes.pop();
      return;
    }
    if (input.pressed('left')) this.day = Math.max(1, this.day - 1);
    if (input.pressed('right')) this.day = Math.min(5, this.day + 1);
  }
  draw(r) {
    const st = this.game.state;
    r.alpha(0.6, () => r.rect(0, 0, 480, 270, '#000'));
    const x = PHONE.x, y = PHONE.y + 18;
    const ok = st && st.seed;
    drawPhoneFrame(r, x, y, ok ? st.stats.battery : 0, ok ? st.clock : '--:--');
    const sx = x + PHONE.sx, sy = y + PHONE.sy, sw = PHONE.sw, sh = PHONE.sh;
    if (!ok) {
      r.text('Игра не начата', sx + sw / 2, sy + 90, { align: 'center', color: '#9a9aa8' });
    } else if (st.stats.battery <= 0) {
      // мёртвый телефон: чёрный экран, значок пустой батареи
      r.rect(sx, sy, sw, sh, '#000');
      r.frame(sx + 50, sy + 70, 26, 12, '#d23a3a');
      r.rect(sx + 76, sy + 74, 3, 4, '#d23a3a');
      r.text('Телефон сел', sx + sw / 2, sy + 92, { align: 'center', color: '#ff6a6a' });
      r.text('Дневник недоступен.', sx + sw / 2, sy + 106, { align: 'center', color: '#7d7d90' });
      r.text('Зарядись в библиотеке.', sx + sw / 2, sy + 118, { align: 'center', color: '#7d7d90' });
    } else {
      this.drawDiary(r, st, sx, sy, sw, sh);
    }
    drawCrack(r, x, y);
    r.text('←→ — день, X — назад', 240, 258, { align: 'center', color: '#9a9aa8' });
  }
  drawDiary(r, st, sx, sy, sw, sh) {
    r.rect(sx, sy, sw, sh, '#f4f4f8');
    r.rect(sx, sy, sw, 16, '#3a6ad8');
    r.text('Дневник', sx + 4, sy + 4, { color: '#ffffff' });
    r.text('schools.by', sx + sw - 4, sy + 4, { align: 'right', color: '#c8d8ff' });
    // вкладки дней
    DAY_SHORT.forEach((d, i) => {
      const tx = sx + 2 + i * 25;
      const sel = i + 1 === this.day;
      r.rect(tx, sy + 19, 23, 11, sel ? '#3a6ad8' : '#dcdce6');
      r.text(d, tx + 12, sy + 21, { align: 'center', color: sel ? '#ffffff' : '#404050' });
    });
    const d = this.day;
    const grades = d === st.day ? st.grades : st.week.grades[d - 1] || [];
    const list = daySchedule(d);
    list.forEach((l, i) => {
      const y = sy + 36 + i * 15;
      r.rect(sx + 2, y - 2, sw - 4, 14, i % 2 ? '#ffffff' : '#ececf4');
      r.text(l.short, sx + 5, y + 1, { color: '#202028' });
      const g = grades[i];
      const past = d < st.day || (d === st.day && i < grades.length && g !== undefined);
      const txt = typeof g === 'number' ? String(g) : past ? '—' : '';
      r.text(txt, sx + sw - 8, y + 1, { align: 'right', color: typeof g === 'number' ? gradeColor(g) : '#9a9aa8' });
    });
    if (st.week.dayEnds[d]) r.text('День сорван', sx + sw / 2, sy + 144, { align: 'center', color: '#d23a3a' });
    r.rect(sx, sy + sh - 34, sw, 34, '#e4e8f8');
    const avg = weekAverage(st);
    r.text('Средний за неделю', sx + 4, sy + sh - 30, { color: '#404050' });
    r.text(avg ? avg.toFixed(2).replace('.', ',') : '—', sx + sw / 2, sy + sh - 18, { align: 'center', color: avg ? gradeColor(avg) : '#9a9aa8', scale: 1 });
  }
}
