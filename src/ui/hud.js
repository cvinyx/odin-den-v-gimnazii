// HUD (раздел 4): низ экрана 480×36 на тёмной плашке. Слева — локация и время, справа — статусы
// иконками 8×8 с числом и мини-шкалой. Критические значения мигают красным. Подозрение — только на уроке.
import { GAME_H, HUD_H } from '../engine/renderer.js';
import { getIcon } from '../gen/icons.js';
import { BALANCE } from '../../data/balance.js';
import { formatMoney } from '../game/state.js';

const SLOT_W = 34;
const B = BALANCE;

export const HUD_SLOTS = [
  { key: 'battery', icon: 'battery', label: 'Батарея', max: 100, fmt: (s) => s.battery + '%', critical: (s) => s.battery <= B.battery.critical, bar: (s) => s.battery / 100, color: '#5ad65a' },
  { key: 'stress', icon: 'stress', label: 'Стресс', max: 100, fmt: (s) => String(s.stress), critical: (s) => s.stress >= B.stress.critical, bar: (s) => s.stress / 100, color: '#ffb84a' },
  { key: 'aura', icon: 'aura', label: 'Аура', max: 100, fmt: (s) => String(s.aura), critical: (s) => s.aura <= B.aura.critical, bar: (s) => s.aura / 100, color: '#b98cff' },
  { key: 'vapeCharge', icon: 'vape', label: 'Вейп', max: 100, fmt: (s) => s.vapeCharge + '%', critical: (s) => s.vapeCharge <= B.vape.critical || s.juice <= 0, bar: (s) => s.vapeCharge / 100, color: '#8fd0ff', juice: true },
  { key: 'suspicion', icon: 'suspicion', label: 'Подозрение', max: 100, fmt: (s) => String(s.suspicion), critical: (s) => s.suspicion >= B.suspicion.critical, bar: (s) => s.suspicion / 100, color: '#ff6a5a', lessonOnly: true },
  { key: 'hunger', icon: 'hunger', label: 'Голод', max: 100, fmt: (s) => String(s.hunger), critical: (s) => s.hunger >= B.hunger.critical, bar: (s) => s.hunger / 100, color: '#e0a050' },
  { key: 'money', icon: 'money', label: 'Деньги', fmt: (s) => formatMoney(s.money), critical: (s) => s.money < B.money.critical, bar: null, color: '#5ac85a' },
];

const DAY_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт'];
export function phaseLabel(state) {
  const d = DAY_SHORT[(state.day || 1) - 1] + ' · ';
  if (state.phase === 'lesson') return `${d}Урок ${state.lesson} / ${state.clock}`;
  if (state.phase === 'break') return `${d}Перемена ${state.lesson} / ${state.clock}`;
  if (state.phase === 'intro') return d + state.clock;
  if (state.phase === 'late') return state.late ? `${d}Опаздываю! / ${state.clock}` : `${d}До урока / ${state.clock}`;
  if (state.phase === 'home') return `${d}Домой / ${state.clock}`;
  return `Свободное время / ${state.clock}`;
}

export class Hud {
  constructor() {
    this.prev = null;
    this.pops = []; // всплывающие изменения { key, text, color, t }
    this.hint = null; // подсказка «Следующий: …»
  }

  // Сравнивает статусы с прошлым кадром и создаёт всплывающие «+5 / −3».
  update(dt, state) {
    const s = state.stats;
    if (this.prev) {
      for (const slot of HUD_SLOTS) {
        const d = s[slot.key] - this.prev[slot.key];
        if (d !== 0) {
          const good = slot.key === 'stress' || slot.key === 'suspicion' || slot.key === 'hunger' ? d < 0 : d > 0;
          const val = slot.key === 'money' ? formatMoney(Math.abs(d)) : Math.abs(d);
          this.pops.push({ key: slot.key, text: (d > 0 ? '+' : '-') + val, color: good ? '#6be36b' : '#ff5a5a', t: 0 });
        }
      }
      const dj = s.juice - this.prev.juice;
      if (dj !== 0) this.pops.push({ key: 'vapeCharge', text: (dj > 0 ? '+' : '-') + Math.abs(dj) + 'ж', color: dj > 0 ? '#6be36b' : '#ff5a5a', t: 0 });
    }
    this.prev = { ...s };
    for (const p of this.pops) p.t += dt;
    this.pops = this.pops.filter((p) => p.t < 1.6);
  }

  visibleSlots(state) {
    return HUD_SLOTS.filter((sl) => !sl.lessonOnly || state.phase === 'lesson');
  }

  // opts.hint — показывать подсказку «Следующий: …» (только когда игрок свободно ходит).
  draw(r, state, opts = {}) {
    const y0 = GAME_H;
    r.rect(0, y0, 480, HUD_H, '#141221');
    r.rect(0, y0, 480, 1, '#3a3552');
    r.rect(0, y0 + 1, 480, 1, '#0a0912');
    // слева — локация и время
    r.text(state.locationName || '', 6, y0 + 6, { color: '#ffffff' });
    r.text(phaseLabel(state), 6, y0 + 19, { color: '#9fd3ff' });
    // справа — статусы
    const slots = this.visibleSlots(state);
    const s = state.stats;
    let x = 480 - slots.length * SLOT_W - 2;
    const blinkOn = r.blink(0.3);
    for (const slot of slots) {
      const crit = slot.critical(s);
      const red = crit && blinkOn;
      r.image(getIcon(slot.icon, red ? '#ff3a3a' : null), x, y0 + 5);
      const txt = slot.fmt(s);
      r.text(txt, x + 10, y0 + 5, { color: red ? '#ff4a4a' : crit ? '#ffb0b0' : '#ffffff' });
      if (slot.bar) {
        const bw = SLOT_W - 4;
        r.rect(x, y0 + 17, bw, 3, '#2c2840');
        r.rect(x, y0 + 17, Math.round(bw * Math.max(0, Math.min(1, slot.bar(s)))), 3, red ? '#ff3a3a' : slot.color);
      }
      const ch = state.charging;
      if (ch && ((ch.device === 'phone' && slot.key === 'battery') || (ch.device === 'vape' && slot.key === 'vapeCharge'))) {
        // анимация зарядки: бегущая полоска и молния
        const k = (r.time * 1.5) % 1;
        r.rect(x + Math.round((SLOT_W - 6) * k), y0 + 17, 3, 3, '#ffffff');
        if (r.blink(0.25)) r.text('+', x + 2, y0 - 2, { color: '#ffe14d', shadow: '#000' });
      }
      if (slot.juice) {
        // заправки жижки — маленькие капли под шкалой
        for (let i = 0; i < Math.min(6, s.juice); i++) r.rect(x + i * 4, y0 + 22, 3, 3, '#c9a0ff');
        if (s.juice > 6) r.text('+', x + 24, y0 + 21, { color: '#c9a0ff' });
      }
      for (const p of this.pops) {
        if (p.key !== slot.key) continue;
        const a = 1 - p.t / 1.6;
        r.alpha(a, () => r.text(p.text, x + 2, y0 - 10 - Math.round(p.t * 10), { color: p.color, shadow: '#000' }));
      }
      x += SLOT_W;
    }
    if (this.hint && opts.hint) {
      const w = r.measure(this.hint) + 10;
      r.alpha(0.6, () => r.rect(240 - w / 2, y0 - 13, w, 12, '#000'));
      r.text(this.hint, 240, y0 - 11, { align: 'center', color: '#ffe14d' });
    }
  }
}
