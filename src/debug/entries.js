// Пункты отладочного меню этапа 1. Новые этапы добавляют свои через registerDebug.
import { registerDebug } from './registry.js';
import { FontTestScene } from '../scenes/font_test.js';
import { GalleryScene } from '../scenes/gallery.js';
import { TestRoomScene } from '../scenes/test_room.js';
import { TitleScene } from '../scenes/title.js';
import { DialogScene } from '../scenes/dialog_scene.js';

// Открыть сцену поверх главного меню (по X вернёмся в меню).
function overTitle(game, scene) {
  game.scenes.transition(() => {
    game.scenes.reset(new TitleScene());
    game.scenes.push(scene);
  });
}

export function registerStage1Debug() {
  registerDebug('Сцены', 'Шрифт', (game) => overTitle(game, new FontTestScene()));
  registerDebug('Сцены', 'Галерея', (game) => overTitle(game, new GalleryScene()));
  registerDebug('Сцены', 'Тестовая комната', (game) => game.scenes.reset(new TestRoomScene(), { fade: true }));
  registerDebug('Сцены', 'Главное меню', (game) => game.scenes.reset(new TitleScene(), { fade: true }));
  registerDebug('Сцены', 'Диалог с Игорем', (game) => game.scenes.transition(() => {
    game.scenes.reset(new TestRoomScene());
    game.scenes.push(new DialogScene('test', 'igor_talk'));
  }));
}
