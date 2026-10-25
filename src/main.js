// Точка входа: создаём игру, регистрируем отладочное меню, показываем главное меню.
import { Game } from './game/game.js';
import { PressKeyScene } from './scenes/press_key.js';
import { portraitOf } from './gen/people.js';
import { DebugMenuScene } from './debug/debug_menu.js';
import { registerDebugEntries } from './debug/entries.js';
import { debugGroups } from './debug/registry.js';
import { MAPS, STAIRWELLS } from './world/maps/index.js';
import { todaySchedule } from './game/day.js';
import './minigames/index.js';
import { validateAllDialogs } from './game/dialogs.js';
import { encodeSaveCode } from './engine/save.js';

const canvas = document.getElementById('screen');
const game = new Game(canvas);
registerDebugEntries();
game.debugOpener = () => {
  if (!game.scenes.top || game.scenes.top.id !== 'debug') game.scenes.push(new DebugMenuScene());
};
validateAllDialogs();
game.start(new PressKeyScene());
// значок вкладки — пиксельный портрет Ромы (data-URI, без сетевых запросов)
try {
  const c = document.createElement('canvas'); c.width = 32; c.height = 32;
  const x = c.getContext('2d'); x.imageSmoothingEnabled = false;
  x.drawImage(portraitOf('roma', 'happy'), 8, 4, 32, 32, 0, 0, 32, 32);
  const link = document.querySelector('link[rel="icon"]') || document.head.appendChild(Object.assign(document.createElement('link'), { rel: 'icon' }));
  link.href = c.toDataURL('image/png');
} catch (e) { /* без значка — не страшно */ }
canvas.focus();
// Доступ для автоматических проверок (Playwright) и отладки из консоли.
window.__odin = game;
// Вызов пунктов отладочного меню по подписи (для бота): window.__odinDebug('Перемена 1').
// arg — выбрать значение пункта со стрелками (соперника): window.__odinDebug('Туалет', 'guza').
window.__odinDebug = (label, arg) => {
  for (const g of debugGroups()) for (const it of g.items) if (it.label === label) { if (arg != null && it.set) it.set(arg); it.action(game); return true; }
  return false;
};
// Код сохранения текущего дня — тот же, что в меню паузы (для проверок).
window.__odinSaveCode = () => encodeSaveCode(game.state);
// Данные карт и расписания для бота (поиск пути между локациями). SCHEDULE — уроки текущего дня недели.
window.__odinData = { MAPS, STAIRWELLS, get SCHEDULE() { return todaySchedule(); } };
