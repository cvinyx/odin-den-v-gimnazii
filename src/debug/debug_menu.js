// Отладочное меню (клавиша ` или ?debug): FPS, переходы к сценам, изменение статусов, звуки.
import { debugGroups } from './registry.js';
import { changeStat, formatMoney } from '../game/state.js';
import { BALANCE } from '../../data/balance.js';
import { audio } from '../engine/audio.js';

const STAT_STEPS = { battery: 5, stress: 5, aura: 5, vapeCharge: 10, juice: 1, suspicion: 5, hunger: 5, money: 50 };
const STAT_NAMES = { battery: 'Батарея', stress: 'Стресс', aura: 'Аура', vapeCharge: 'Вейп', juice: 'Жижка', suspicion: 'Подозрение', hunger: 'Голод', money: 'Деньги' };

export class DebugMenuScene {
  constructor() { this.id = 'debug'; this.opaque = false; this.tab = 0; this.index = 0; }

  enter(game) { this.game = game; }

  // Вкладки: группы из реестра + «Статусы» (редактор) + «Звуки».
  tabs() {
    const g = debugGroups();
    const st = this.game.state;
    const statItems = Object.keys(STAT_STEPS).map((k) => ({
      label: STAT_NAMES[k],
      value: () => (k === 'money' ? formatMoney(st.stats[k]) : String(st.stats[k])),
      change: (d) => changeStat(st, k, d * STAT_STEPS[k]),
    }));
    statItems.push({ label: 'Фаза: урок / свободно', value: () => (st.phase === 'lesson' ? 'урок' : 'свободно'), action: () => { st.phase = st.phase === 'lesson' ? 'free' : 'lesson'; } });
    statItems.push({ label: 'Сбросить статусы', action: () => { for (const k of Object.keys(st.stats)) st.stats[k] = BALANCE.start[k]; } });
    const sfx = ['bell', 'whistle', 'kick', 'igorLaugh', 'menuSelect', 'coin', 'puff', 'hit'].map((n) => ({ label: 'Звук: ' + n, action: () => audio.play(n) }));
    sfx.push({ label: 'Музыка: меню', action: () => this.game.playMusic('menu') });
    sfx.push({ label: 'Музыка: комната', action: () => this.game.playMusic('room') });
    sfx.push({ label: 'Блип Игоря', action: () => audio.blip(250, 'sawtooth') });
    return [
      { name: 'Общее', items: [{ label: 'Показывать FPS', value: () => (this.game.showFps ? 'да' : 'нет'), action: () => { this.game.showFps = !this.game.showFps; } }] },
      ...g,
      { name: 'Статусы', items: statItems },
      { name: 'Звук', items: sfx },
    ];
  }

  update() {
    const input = this.game.input;
    const tabs = this.tabs();
    if (input.pressed('back') || input.pressed('debug')) { input.consume('back'); this.game.scenes.pop(); return; }
    if (input.pressed('tab')) { this.tab = (this.tab + 1) % tabs.length; this.index = 0; audio.play('menuMove'); return; }
    const items = tabs[this.tab].items;
    if (input.pressed('up')) { this.index = (this.index + items.length - 1) % items.length; audio.play('menuMove'); }
    if (input.pressed('down')) { this.index = (this.index + 1) % items.length; audio.play('menuMove'); }
    const it = items[this.index];
    if (it.change) {
      if (input.pressed('left')) it.change(-1);
      if (input.pressed('right')) it.change(1);
    }
    if (input.pressed('confirm') && it.action) {
      input.consume('confirm');
      audio.play('menuSelect');
      it.action(this.game, this);
    }
  }

  draw(r) {
    const tabs = this.tabs();
    r.alpha(0.85, () => r.rect(0, 0, 480, 270, '#000'));
    r.box(10, 10, 460, 250, '#6be36b');
    r.text('ОТЛАДКА', 20, 18, { color: '#6be36b', scale: 2 });
    r.text('Tab — вкладка · ↑↓ — пункт · ←→ — изменить · Z — выбрать · X — закрыть', 240, 246, { align: 'center', color: '#9a9aa8' });
    let x = 20;
    tabs.forEach((t, i) => {
      const sel = i === this.tab;
      r.text(t.name, x, 42, { color: sel ? '#ffe14d' : '#7d7d90' });
      if (sel) r.rect(x, 52, r.measure(t.name), 1, '#ffe14d');
      x += r.measure(t.name) + 14;
    });
    const items = tabs[this.tab].items;
    const start = Math.max(0, this.index - 15);
    items.slice(start, start + 17).forEach((it, j) => {
      const i = start + j;
      const sel = i === this.index;
      let label = it.label;
      if (it.value) label += ': ' + it.value();
      r.text((sel ? '► ' : '  ') + label, 24, 60 + j * 11, { color: sel ? '#ffe14d' : '#ffffff' });
    });
  }
}
