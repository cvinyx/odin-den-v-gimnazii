// Точка входа: создаём игру, регистрируем отладочное меню, показываем главное меню.
import { Game } from './game/game.js';
import { TitleScene } from './scenes/title.js';
import { DebugMenuScene } from './debug/debug_menu.js';
import { registerStage1Debug } from './debug/entries.js';
import { validateAllDialogs } from './game/dialogs.js';

const canvas = document.getElementById('screen');
const game = new Game(canvas);
registerStage1Debug();
game.debugOpener = () => {
  if (!game.scenes.top || game.scenes.top.id !== 'debug') game.scenes.push(new DebugMenuScene());
};
validateAllDialogs();
game.start(new TitleScene());
canvas.focus();
// Доступ для автоматических проверок (Playwright) и отладки из консоли.
window.__odin = game;
