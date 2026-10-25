// Экран итогов недели (раздел 17, V2-2) и карточка-картинка PNG 960×540: «Скачать картинку», «Скопировать текстом».
// Оценки по дням, средний балл за неделю, матчи вторника и пятницы, долги.
// Обе кнопки работают и при открытии файла через file:// (data-URL и буфер обмена с запасным путём).
import { Menu } from '../ui/menu.js';
import { DAY_SHORT, daySchedule } from '../../data/schedule.js';
import { dayGrades, dayMatch, weekDirectorCalls } from '../game/day.js';
import { HUD_SLOTS } from '../ui/hud.js';
import { getIcon } from '../gen/icons.js';
import { formatMoney } from '../game/state.js';
import { totalDebt } from '../game/bets.js';
import { getPerson, portraitOf } from '../gen/people.js';
import { formatTimer } from '../ui/format.js';
import { ENDING_TITLES, ENDING_COLORS, avgGrade } from '../game/endings.js';
import { ACHIEVEMENTS } from '../game/achievements.js';
import { copyToClipboard } from '../engine/save.js';
import { Renderer } from '../engine/renderer.js';

const PORTRAIT_EMO = { pride: 'happy', bntu: 'norm', habza: 'dumb', dad: 'surprised' };
const fmtAvg = (v) => v.toFixed(2).replace('.', ',');
const matchLine = (m) => (m ? `«ИнЯз» ${m.score} «Физмат»` : 'не сыграно');
function avgOf(list) { const g = list.filter((x) => typeof x === 'number'); return g.length ? g.reduce((a, b) => a + b, 0) / g.length : null; }
const gradeColor = (g) => (g >= 7 ? '#6be36b' : g >= 5 ? '#ffe14d' : '#ff6a6a');

// Короткий текст для чата.
export function resultsText(state, kind) {
  const lines = [`Неделя в гимназии — «${ENDING_TITLES[kind]}»`];
  for (let d = 1; d <= 5; d++) {
    const g = dayGrades(state, d).map((x) => (x == null ? '—' : x)).join(' ');
    lines.push(`${DAY_SHORT[d - 1]}: ${g || '—'}${state.week.dayEnds[d] ? ' (день сорван)' : ''}`);
  }
  lines.push(`Средний балл за неделю: ${fmtAvg(avgGrade(state))}`);
  lines.push(`Эль-Класико: вт — ${matchLine(dayMatch(state, 2))}, пт — ${matchLine(dayMatch(state, 5))}`);
  lines.push(`Аура ${state.stats.aura} · Деньги ${formatMoney(state.stats.money)} BYN · Долги ${formatMoney(totalDebt(state))} BYN`);
  lines.push(`Вызовы к директору: ${weekDirectorCalls(state)} · Время: ${formatTimer(state.playTime)}`);
  lines.push(`Код недели: ${state.seed} — сыграй эту же неделю!`);
  return lines.join('\n');
}

// Отрисовать карточку 480×270 рендерером игры (потом — увеличение ×2 до 960×540).
export function drawCard(r, state, kind) {
  r.rect(0, 0, 480, 270, '#14122a');
  for (let y = 0; y < 270; y += 8) r.rect(0, y, 480, 1, '#1a1834');
  r.rect(0, 0, 480, 3, ENDING_COLORS[kind]); r.rect(0, 267, 480, 3, ENDING_COLORS[kind]);
  r.text('ОДИН ДЕНЬ В ГИМНАЗИИ · ИТОГИ НЕДЕЛИ', 240, 10, { align: 'center', color: '#9a9aa8' });
  r.text(ENDING_TITLES[kind], 240, 24, { align: 'center', color: ENDING_COLORS[kind], scale: 3, shadow: '#000' });
  // портрет Ромы
  r.box(14, 56, 84, 84, '#ffffff', '#000', 2);
  const p = portraitOf('roma', PORTRAIT_EMO[kind] || 'norm');
  if (p) r.image(p, 18, 60, 76, 76);
  r.text('Рома Ковган', 56, 146, { align: 'center', color: '#ffffff' });
  r.text('11 «И»', 56, 158, { align: 'center', color: '#9a9aa8' });
  // оценки по дням: число — оценка, «·» — урок без оценки
  r.text('Оценки за неделю', 110, 56, { color: '#9fd3ff' });
  for (let d = 1; d <= 5; d++) {
    const y = 70 + (d - 1) * 13;
    const grades = dayGrades(state, d);
    const n = daySchedule(d).length;
    r.text(DAY_SHORT[d - 1], 110, y, { color: state.week.dayEnds[d] ? '#ff8a8a' : '#c8c8d8' });
    for (let i = 0; i < n; i++) {
      const g = grades[i];
      r.text(typeof g === 'number' ? String(g) : '·', 140 + i * 15, y, { align: 'center', color: typeof g === 'number' ? gradeColor(g) : '#5a5a6a' });
    }
    const a = avgOf(grades);
    r.text(a == null ? '—' : fmtAvg(a), 290, y, { align: 'right', color: '#9a9aa8' });
  }
  r.text(`Средний: ${fmtAvg(avgGrade(state))}`, 110, 138, { color: ENDING_COLORS[kind], scale: 2 });
  // статусы
  let y = 56;
  for (const slot of HUD_SLOTS) {
    if (slot.lessonOnly) continue;
    r.image(getIcon(slot.icon), 316, y);
    r.text(slot.label, 330, y, { color: '#c8c8d8' });
    r.text(slot.fmt(state.stats), 462, y, { align: 'right', color: '#ffffff' });
    y += 12;
  }
  const m2 = dayMatch(state, 2), m5 = dayMatch(state, 5);
  r.text(`Матч вт: ${m2 ? m2.score : '—'}`, 316, y + 4, { color: '#ffffff' });
  r.text(`Матч пт: ${m5 ? m5.score : '—'}`, 316, y + 16, { color: '#ffffff' });
  const calls = weekDirectorCalls(state);
  r.text(`К директору: ${calls}`, 316, y + 28, { color: calls ? '#ff8a8a' : '#ffffff' });
  r.text(`Долги: ${formatMoney(totalDebt(state))} BYN`, 110, 160, { color: '#ff8a8a' });
  r.text(`Код недели: ${state.seed}`, 160, 214, { align: 'center', color: '#9fd3ff', scale: 2 });
  r.text(`Время: ${formatTimer(state.playTime)}`, 160, 238, { align: 'center', color: '#9a9aa8' });
}

// Карточка 960×540 (PNG). Возвращает canvas.
export function renderCard(state, kind) {
  const small = document.createElement('canvas');
  small.width = 480; small.height = 270;
  const r = Object.create(Renderer.prototype); // без подписки на resize: только методы рисования
  Object.assign(r, { canvas: small, ctx: small.getContext('2d'), scale: 1, cam: { x: 0, y: 0 }, time: 0, shakeX: 0, shakeY: 0 });
  r.ctx.imageSmoothingEnabled = false;
  drawCard(r, state, kind);
  const big = document.createElement('canvas');
  big.width = 960; big.height = 540;
  const c = big.getContext('2d');
  c.imageSmoothingEnabled = false;
  c.drawImage(small, 0, 0, 960, 540);
  return big;
}

export function downloadCard(state, kind) {
  try {
    const url = renderCard(state, kind).toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `odin-den-${state.seed}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    document.getElementById('screen')?.focus();
    return url;
  } catch (e) {
    return null;
  }
}

export class ResultsScene {
  constructor(kind) { this.id = 'results'; this.kind = kind; this.opaque = true; this.t = 0; this.page = 0; }
  enter(game) {
    this.game = game;
    const st = game.state;
    this.menu = new Menu([
      { label: 'Скачать картинку', action: () => { const ok = downloadCard(st, this.kind); game.toast(ok ? 'Картинка сохранена' : 'Не получилось сохранить'); } },
      { label: 'Скопировать текстом', action: () => { copyToClipboard(resultsText(st, this.kind)).then((ok) => game.toast(ok ? 'Текст скопирован' : 'Не получилось скопировать')); } },
      { label: 'Достижения недели', action: () => { this.page = 1 - this.page; } },
      { label: 'В главное меню', action: () => import('./title.js').then(({ TitleScene }) => game.scenes.reset(new TitleScene(), { fade: true })) },
    ], { lineH: 13 });
  }
  update(dt) {
    this.t += dt;
    if (this.t > 0.5) this.menu.update(this.game.input, this.game);
  }
  draw(r) {
    const st = this.game.state;
    if (this.page === 1) {
      r.rect(0, 0, 480, 270, '#14122a');
      r.text('Достижения за неделю', 240, 10, { align: 'center', color: '#c88aff', scale: 2 });
      const ids = st.week.achievements || [];
      if (!ids.length) r.text('Ни одного. Следующая неделя — новый код.', 240, 60, { align: 'center', color: '#9a9aa8' });
      ids.slice(0, 12).forEach((id, i) => {
        const a = ACHIEVEMENTS.find((x) => x.id === id);
        if (!a) return;
        r.text('★ ' + a.name, 40, 40 + i * 14, { color: '#ffe14d' });
        r.text(a.desc, 250, 40 + i * 14, { color: '#9a9aa8' });
      });
    } else {
      drawCard(r, st, this.kind);
      // долги поимённо
      st.debts.slice(0, 4).forEach((d, i) => r.text(`${(getPerson(d.to) || { short: d.to }).short}: ${formatMoney(d.amount)}`, 110 + (i % 2) * 90, 172 + Math.floor(i / 2) * 10, { color: '#ffb0b0' }));
    }
    r.alpha(0.85, () => r.rect(300, 186, 172, 60, '#000'));
    this.menu.draw(r, 312, 192, this.t);
  }
}
