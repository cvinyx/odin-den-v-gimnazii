// Меню паузы (раздел 4): продолжить, статусы, скопировать код сохранения, выйти в меню.
import { Menu } from '../ui/menu.js';
import { StatusPanel } from './status_panel.js';
import { SaveCodeScene } from './save_code.js';
import { SettingsScene } from './settings.js';
import { encodeSaveCode, copyToClipboard } from '../engine/save.js';

export class PauseScene {
  constructor() { this.id = 'pause'; this.opaque = false; this.time = 0; }

  enter(game) {
    this.game = game;
    this.menu = new Menu([
      { label: 'Продолжить', action: () => game.scenes.pop() },
      { label: 'Статусы', action: () => game.scenes.push(new StatusPanel()) },
      { label: 'Скопировать код сохранения', action: () => this.copyCode() },
      { label: 'Настройки', action: () => game.scenes.push(new SettingsScene()) },
      { label: 'Выйти в меню', action: () => this.quit() },
    ]);
  }

  async copyCode() {
    const code = encodeSaveCode(this.game.state);
    this.game.scenes.push(new SaveCodeScene(code));
    const ok = await copyToClipboard(code);
    this.game.toast(ok ? 'Код скопирован в буфер обмена' : 'Скопируй код с экрана вручную');
  }

  async quit() {
    this.game.autosave();
    const { TitleScene } = await import('./title.js');
    this.game.scenes.reset(new TitleScene(), { fade: true });
  }

  update(dt) {
    this.time += dt;
    const input = this.game.input;
    if (input.pressed('back')) { input.consume('back'); this.game.scenes.pop(); return; }
    this.menu.update(input, this.game);
  }

  draw(r) {
    r.alpha(0.6, () => r.rect(0, 0, 480, 270, '#000'));
    const w = 230, h = this.menu.height() + 40;
    const x = 240 - w / 2, y = 60;
    r.box(x, y, w, h);
    r.text('ПАУЗА', 240, y + 9, { align: 'center', color: '#ffe14d', scale: 2 });
    this.menu.draw(r, x + 26, y + 32, this.time);
  }
}
