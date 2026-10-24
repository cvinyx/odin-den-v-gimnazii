// Экран итогов дня (раздел 17) и карточка-картинка PNG 960×540: «Скачать картинку», «Скопировать текстом».
// Обе кнопки работают и при открытии файла через file:// (data-URL и буфер обмена с запасным путём).
import { Menu } from '../ui/menu.js';
import { SCHEDULE } from '../../data/schedule.js';
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

const PORTRAIT_EMO = { director: 'surprised', perfect: 'happy', legend: 'happy', drained: 'dumb', chaos: 'norm' };
const gradeColor = (g) => (g >= 7 ? '#6be36b' : g >= 5 ? '#ffe14d' : '#ff6a6a');

// Короткий текст для чата.
export function resultsText(state, kind) {
  const g = state.grades.map((x) => (x == null ? '—' : x)).join(' ');
  const m = state.flags.matchScore;
  const lines = [
    `Один день в гимназии — «${ENDING_TITLES[kind]}»`,
    `Оценки: ${g} (средняя ${avgGrade(state).toFixed(1).replace('.', ',')})`,
    `Эль-Класико: ${m ? '«ИнЯз» ' + m + ' «Физмат»' : 'не сыграно'}`,
    `Аура ${state.stats.aura} · Деньги ${formatMoney(state.stats.money)} BYN · Долги ${formatMoney(totalDebt(state))} BYN`,
    `Вызовы к директору: ${state.directorCalls} · Время: ${formatTimer(state.playTime)}`,
    `Код дня: ${state.seed} — сыграй этот же день!`,
  ];
  return lines.join('\n');
}

// Отрисовать карточку 480×270 рендерером игры (потом — увеличение ×2 до 960×540).
export function drawCard(r, state, kind) {
  r.rect(0, 0, 480, 270, '#14122a');
  for (let y = 0; y < 270; y += 8) r.rect(0, y, 480, 1, '#1a1834');
  r.rect(0, 0, 480, 3, ENDING_COLORS[kind]); r.rect(0, 267, 480, 3, ENDING_COLORS[kind]);
  r.text('ОДИН ДЕНЬ В ГИМНАЗИИ', 240, 10, { align: 'center', color: '#9a9aa8' });
  r.text(ENDING_TITLES[kind], 240, 24, { align: 'center', color: ENDING_COLORS[kind], scale: 3, shadow: '#000' });
  // портрет Ромы
  r.box(20, 60, 104, 104, '#ffffff', '#000', 2);
  const p = portraitOf('roma', PORTRAIT_EMO[kind] || 'norm');
  if (p) r.image(p, 24, 64, 96, 96);
  r.text('Рома Ковган', 72, 170, { align: 'center', color: '#ffffff' });
  r.text('11 «И»', 72, 182, { align: 'center', color: '#9a9aa8' });
  // оценки
  r.text('Оценки', 146, 60, { color: '#9fd3ff' });
  SCHEDULE.forEach((l, i) => {
    const g = state.grades[i];
    r.text(l.subject, 146, 73 + i * 11, { color: '#c8c8d8' });
    r.text(g == null ? '—' : String(g), 290, 73 + i * 11, { align: 'right', color: g == null ? '#7d7d90' : gradeColor(g) });
  });
  r.text(`Средняя: ${avgGrade(state).toFixed(1).replace('.', ',')}`, 146, 154, { color: '#ffe14d' });
  // статусы
  let y = 60;
  for (const slot of HUD_SLOTS) {
    if (slot.lessonOnly) continue;
    r.image(getIcon(slot.icon), 316, y);
    r.text(slot.label, 330, y, { color: '#c8c8d8' });
    r.text(slot.fmt(state.stats), 462, y, { align: 'right', color: '#ffffff' });
    y += 12;
  }
  const m = state.flags.matchScore;
  r.text(`Матч: ${m ? m : '—'}`, 316, y + 4, { color: '#ffffff' });
  r.text(`К директору: ${state.directorCalls}`, 316, y + 16, { color: state.directorCalls ? '#ff8a8a' : '#ffffff' });
  const ach = (state.flags.achievementsToday || []).length;
  r.text(`Достижений: ${ach}`, 316, y + 28, { color: '#c88aff' });
  r.text(`Долги навсегда: ${formatMoney(totalDebt(state))} BYN`, 146, 172, { color: '#ff8a8a' });
  r.text(`Код дня: ${state.seed}`, 196, 214, { align: 'center', color: '#9fd3ff', scale: 2 });
  r.text(`Время: ${formatTimer(state.playTime)}`, 196, 238, { align: 'center', color: '#9a9aa8' });
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
      { label: 'Достижения дня', action: () => { this.page = 1 - this.page; } },
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
      r.text('Достижения за день', 240, 10, { align: 'center', color: '#c88aff', scale: 2 });
      const ids = st.flags.achievementsToday || [];
      if (!ids.length) r.text('Сегодня ни одного. Завтра — новый день (и новый код).', 240, 60, { align: 'center', color: '#9a9aa8' });
      ids.slice(0, 12).forEach((id, i) => {
        const a = ACHIEVEMENTS.find((x) => x.id === id);
        if (!a) return;
        r.text('★ ' + a.name, 40, 40 + i * 14, { color: '#ffe14d' });
        r.text(a.desc, 250, 40 + i * 14, { color: '#9a9aa8' });
      });
    } else {
      drawCard(r, st, this.kind);
      // долги поимённо
      st.debts.slice(0, 4).forEach((d, i) => r.text(`${(getPerson(d.to) || { short: d.to }).short}: ${formatMoney(d.amount)}`, 146 + (i % 2) * 80, 184 + Math.floor(i / 2) * 10, { color: '#ffb0b0' }));
    }
    r.alpha(0.85, () => r.rect(300, 186, 172, 60, '#000'));
    this.menu.draw(r, 312, 192, this.t);
  }
}
