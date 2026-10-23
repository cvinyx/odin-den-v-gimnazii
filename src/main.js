// Точка входа: создаём игру, регистрируем отладочное меню, показываем главное меню.
import { Game } from './game/game.js';
import { TitleScene } from './scenes/title.js';
import { DebugMenuScene } from './debug/debug_menu.js';
import { registerDebugEntries } from './debug/entries.js';
import { debugGroups } from './debug/registry.js';
import { MAPS, STAIRWELLS } from './world/maps/index.js';
import { SCHEDULE } from '../data/schedule.js';
import './minigames/index.js';
import { validateAllDialogs } from './game/dialogs.js';

const canvas = document.getElementById('screen');
const game = new Game(canvas);
registerDebugEntries();
game.debugOpener = () => {
  if (!game.scenes.top || game.scenes.top.id !== 'debug') game.scenes.push(new DebugMenuScene());
};
validateAllDialogs();
game.start(new TitleScene());
canvas.focus();
// Доступ для автоматических проверок (Playwright) и отладки из консоли.
window.__odin = game;
// Вызов пунктов отладочного меню по подписи (для бота): window.__odinDebug('Перемена 1').
// arg — выбрать значение пункта со стрелками (соперника): window.__odinDebug('Туалет', 'guza').
window.__odinDebug = (label, arg) => {
  for (const g of debugGroups()) for (const it of g.items) if (it.label === label) { if (arg != null && it.set) it.set(arg); it.action(game); return true; }
  return false;
};
// Данные карт и расписания для бота (поиск пути между локациями).
window.__odinData = { MAPS, STAIRWELLS, SCHEDULE };
