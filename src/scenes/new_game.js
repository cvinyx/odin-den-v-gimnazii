// Новая игра: код дня (сгенерировать или ввести вручную). На этапе 1 день ещё не собран —
// после выбора кода открывается тестовая комната.
import { Menu } from '../ui/menu.js';
import { generateSeedCode, isValidSeed, normalizeSeed, SEED_ALPHABET } from '../engine/rng.js';
import { TextInputScene } from './text_input.js';
import { TestRoomScene } from './test_room.js';

export class NewGameScene {
  constructor() { this.id = 'new_game'; this.opaque = true; this.time = 0; }
  enter(game) {
    this.game = game;
    this.code = generateSeedCode();
    this.menu = new Menu([
      { label: 'Начать', action: () => this.start() },
      { label: 'Другой код', action: () => { this.code = generateSeedCode(); } },
      { label: 'Ввести свой код', action: () => this.enterCode() },
      { label: 'Назад', action: () => game.scenes.pop() },
    ], { lineH: 18 });
  }
  enterCode() {
    this.game.scenes.push(new TextInputScene({
      title: 'Код дня',
      hint: '6 символов: латинские буквы и цифры 2–9',
      maxLen: 6,
      filter: (c) => { const u = c.toUpperCase(); return SEED_ALPHABET.includes(u) ? u : null; },
      onDone: (text, scene) => {
        if (!isValidSeed(text)) { scene.setError('Нужно ровно 6 символов из A–Z и 2–9 (без O, I, L, 0, 1).'); return; }
        this.code = normalizeSeed(text);
        this.game.scenes.pop();
      },
    }));
  }
  start() {
    this.game.newDay(this.code);
    this.game.scenes.reset(new TestRoomScene(), { fade: true });
    this.game.toast('Этап 1: день ещё не собран — это тестовая комната', 3.5);
  }
  update(dt) {
    this.time += dt;
    const input = this.game.input;
    if (input.pressed('back')) { input.consume('back'); this.game.scenes.pop(); return; }
    this.menu.update(input, this.game);
  }
  draw(r) {
    r.rect(0, 0, 480, 270, '#101024');
    r.text('Новая игра', 240, 30, { align: 'center', color: '#ffe14d', scale: 2 });
    r.text('Код дня определяет все случайные события.', 240, 62, { align: 'center', color: '#c8c8d8' });
    r.text('Одинаковый код — одинаковый день. Поделись им с друзьями.', 240, 74, { align: 'center', color: '#c8c8d8' });
    r.box(160, 92, 160, 34);
    r.text(this.code, 240, 101, { align: 'center', color: '#ffffff', scale: 2 });
    this.menu.draw(r, 180, 146, this.time);
  }
}
