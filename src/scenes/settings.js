// Настройки (раздел 4): громкость музыки и звуков, скорость текста, таймер спидрана.
import { Menu } from '../ui/menu.js';
import { ScheduleScene, DiaryScene } from './week_tabs.js';

const SPEEDS = ['slow', 'normal', 'fast'];
const SPEED_NAMES = { slow: 'медленно', normal: 'обычно', fast: 'быстро' };

export class SettingsScene {
  constructor() { this.id = 'settings'; this.opaque = false; this.time = 0; }
  enter(game) {
    this.game = game;
    const s = game.settings;
    const vol = (key) => (dir) => { s[key] = Math.max(0, Math.min(10, s[key] + dir)); game.saveSettings(); };
    this.menu = new Menu([
      { label: 'Музыка', value: () => String(s.musicVolume), change: vol('musicVolume') },
      { label: 'Звуки', value: () => String(s.sfxVolume), change: (d) => { vol('sfxVolume')(d); game.audio.play('menuSelect'); } },
      { label: 'Скорость текста', value: () => SPEED_NAMES[s.textSpeed], change: (d) => { const i = SPEEDS.indexOf(s.textSpeed); s.textSpeed = SPEEDS[(i + d + 3) % 3]; game.saveSettings(); } },
      { label: 'Таймер спидрана', value: () => (s.speedrunTimer ? 'вкл' : 'выкл'), change: () => { s.speedrunTimer = !s.speedrunTimer; game.saveSettings(); } },
      { label: 'Расписание', action: () => game.scenes.push(new ScheduleScene()) },
      { label: 'Дневник', action: () => game.scenes.push(new DiaryScene()) },
      { label: 'Назад', action: () => game.scenes.pop() },
    ], { lineH: 16 });
  }
  update(dt) {
    this.time += dt;
    const input = this.game.input;
    if (input.pressed('back')) { input.consume('back'); this.game.scenes.pop(); return; }
    this.menu.update(input, this.game);
  }
  draw(r) {
    r.alpha(0.7, () => r.rect(0, 0, 480, 270, '#000'));
    r.box(70, 40, 340, 180);
    r.text('Настройки', 240, 48, { align: 'center', color: '#ffe14d', scale: 2 });
    this.menu.draw(r, 100, 74, this.time);
    r.text('Влево/вправо — изменить, X — назад', 240, 206, { align: 'center', color: '#9a9aa8' });
  }
}
