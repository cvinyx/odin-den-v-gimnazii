// Главное меню (раздел 4): Продолжить, Новая игра, Ввести код сохранения, Настройки, Достижения.
import { Menu } from '../ui/menu.js';
import { loadAutosave, decodeSaveCode, oldAutosave } from '../engine/save.js';
import { sheetOf } from '../gen/people.js';
import { frameRect, WALK_CYCLE, FRAME_W, FRAME_H } from '../gen/sprites.js';
import { NewGameScene } from './new_game.js';
import { SettingsScene } from './settings.js';
import { TextInputScene } from './text_input.js';
import { continueFrom } from '../game/flow.js';
import { AchievementsScene } from './achievements_scene.js';
import { CreditsScene } from './credits.js';

const LINEUP = ['chernyak', 'igor', 'roma', 'denis', 'levonchuk'];

export class TitleScene {
  constructor() { this.id = 'title'; this.opaque = true; this.time = 0; }

  enter(game) {
    this.game = game;
    this.build();
    game.playMusic('menu');
  }

  resume() { this.build(); this.game.playMusic('menu'); }

  build() {
    const game = this.game;
    const save = loadAutosave();
    const prev = this.menu ? this.menu.index : 0;
    this.menu = new Menu([
      { label: 'Продолжить', disabled: !save && !oldAutosave(), action: () => this.continueGame() },
      { label: 'Новая игра', action: () => game.scenes.push(new NewGameScene()) },
      { label: 'Ввести код сохранения', action: () => this.enterCode() },
      { label: 'Настройки', action: () => game.scenes.push(new SettingsScene()) },
      { label: 'Достижения', action: () => game.scenes.push(new AchievementsScene()) },
      { label: 'Титры', action: () => game.scenes.push(new CreditsScene()) },
    ], { lineH: 15, align: 'center' });
    this.menu.index = Math.min(prev, 5);
    this.menu.skipDisabled();
  }

  continueGame() {
    const st = loadAutosave();
    if (!st) { this.game.toast(oldAutosave() ? 'Сохранение от старой версии' : 'Сохранения нет'); return; }
    continueFrom(this.game, st);
  }

  enterCode() {
    this.game.scenes.push(new TextInputScene({
      title: 'Код сохранения',
      hint: 'Вставь код (Ctrl+V) и нажми Enter',
      maxLen: 4000,
      filter: (c) => (/[A-Za-z0-9+/=\-]/.test(c) ? c : null),
      onDone: (text, scene) => {
        const res = decodeSaveCode(text);
        if (!res.ok) { scene.setError(res.error); return; }
        this.game.toast('Сохранение загружено');
        continueFrom(this.game, res.state);
      },
    }));
  }

  update(dt) {
    this.time += dt;
    this.menu.update(this.game.input, this.game);
  }

  draw(r) {
    // небо и силуэт гимназии
    for (let y = 0; y < 270; y += 6) r.rect(0, y, 480, 6, y < 120 ? (y < 60 ? '#1b1e46' : '#2a2c5e') : '#1a1830');
    r.rect(60, 64, 360, 86, '#2e2a48');
    r.rect(200, 50, 80, 100, '#38345a');
    for (let i = 0; i < 9; i++) for (let j = 0; j < 3; j++) {
      const lit = (i * 7 + j * 3) % 5 === 0;
      r.rect(72 + i * 38, 74 + j * 24, 14, 12, lit ? '#e8d27a' : '#4a4670');
    }
    r.rect(228, 110, 24, 40, '#4a3424');
    r.rect(0, 150, 480, 120, '#3b3a3a');
    r.rect(0, 150, 480, 2, '#555');
    // персонажи
    LINEUP.forEach((id, i) => {
      const sheet = sheetOf(id);
      const frame = id === 'roma' ? 0 : WALK_CYCLE[Math.floor(this.time * 4 + i) % 4];
      const dir = id === 'roma' ? 'down' : i < 2 ? 'right' : 'left';
      const f = frameRect(dir, id === 'roma' ? 0 : frame);
      r.sprite(sheet, f.sx, f.sy, f.sw, f.sh, 160 + i * 34 - FRAME_W, 166 - FRAME_H * 2, 2);
    });
    r.text('Один день', 240, 10, { align: 'center', color: '#ffe14d', scale: 2, shadow: '#000' });
    r.text('в гимназии', 240, 30, { align: 'center', color: '#ffffff', scale: 2, shadow: '#000' });
    r.alpha(0.75, () => r.rect(120, 160, 240, 98, '#000'));
    this.menu.draw(r, 240, 162, this.time);
    r.text('Z — выбрать · M — звук · F — полный экран', 240, 260, { align: 'center', color: '#9a9aa8' });
  }
}
