// Буфет (раздел 7; V2-3 — отдельная комната рядом со столовой, меню Л-12): меню с ценами. Комплексный обед — только на большой перемене.
import { Menu } from '../ui/menu.js';
import { BALANCE } from '../../data/balance.js';
import { changeStat, formatMoney } from '../game/state.js';
import { BREAKS } from '../../data/schedule.js';
import { eventRng } from '../game/day.js';
import { portraitOf } from '../gen/people.js';
import { audio } from '../engine/audio.js';

export function isBigBreak(state) {
  const b = BREAKS.find((x) => x.after === state.lesson);
  return state.phase === 'break' && !!(b && b.big);
}

// Купить (чистая функция, используется и тестами): { ok, reason }.
export function buyFood(state, key) {
  const f = BALANCE.food[key];
  if (!f) return { ok: false, reason: 'Нет такого.' };
  if (f.lunchOnly && !isBigBreak(state)) return { ok: false, reason: 'Обед только на большой перемене.' };
  if (state.stats.money < f.price) return { ok: false, reason: 'Не хватает денег.' };
  changeStat(state, 'money', -f.price);
  if (f.hunger) changeStat(state, 'hunger', f.hunger);
  if (f.stress) changeStat(state, 'stress', f.stress);
  // М-2: после смаженки с шансом 33 % диарея — 30 с до туалета
  if (key === 'smazhenka' && !state.flags.diarrheaT) {
    state.flags.smazhN = (state.flags.smazhN || 0) + 1;
    if (eventRng(state, `diarrhea:${state.day}:${state.lesson}:${state.flags.smazhN}`).chance(BALANCE.diarrhea.chance)) {
      state.flags.diarrheaT = BALANCE.diarrhea.seconds;
      return { ok: true, diarrhea: true };
    }
  }
  return { ok: true };
}

export class BuffetScene {
  constructor() { this.id = 'buffet'; this.opaque = false; this.time = 0; }
  enter(game) {
    this.game = game;
    const st = game.state;
    const items = Object.entries(BALANCE.food).map(([key, f]) => ({
      label: `${key === 'lunch' ? 'Комплексный обед: ' + BALANCE.dishes[(st.day || 1) - 1] : f.name} — ${formatMoney(f.price)}`,
      disabled: f.lunchOnly && !isBigBreak(st),
      action: () => this.buy(key),
    }));
    items.push({ label: 'Уйти', action: () => game.scenes.pop() });
    this.menu = new Menu(items, { lineH: 12 });
  }
  buy(key) {
    const res = buyFood(this.game.state, key);
    if (res.ok) { audio.play('coin'); this.game.toast('Куплено: ' + BALANCE.food[key].name); if (res.diarrhea) import('./dialog_scene.js').then(({ DialogScene }) => this.game.scenes.push(new DialogScene('places', 'dia_start'))); }
    else { audio.play('menuDenied'); this.game.toast(res.reason); }
  }
  update(dt) {
    this.time += dt;
    const input = this.game.input;
    if (input.pressed('back')) { input.consume('back'); this.game.scenes.pop(); return; }
    this.menu.update(input, this.game);
  }
  draw(r) {
    r.alpha(0.6, () => r.rect(0, 0, 480, 234, '#000'));
    r.box(60, 6, 360, 222);
    const pt = portraitOf('cook', 'happy');
    if (pt) r.image(pt, 72, 16);
    r.text('Буфет', 130, 18, { color: '#ffe14d', scale: 2 });
    r.text('Деньги: ' + formatMoney(this.game.state.stats.money) + ' BYN', 130, 40, { color: '#6be36b' });
    this.menu.draw(r, 100, 80, this.time);
    const i = this.menu.index;
    const key = Object.keys(BALANCE.food)[i];
    if (key) {
      const f = BALANCE.food[key];
      const parts = [`голод ${f.hunger}`];
      if (f.stress) parts.push(`стресс ${f.stress}`);
      if (f.lunchOnly) parts.push('только на большой перемене');
      r.text(parts.join(', '), 240, 212, { align: 'center', color: '#9a9aa8' });
    }
    this.game.hud.draw(r, this.game.state);
  }
}
