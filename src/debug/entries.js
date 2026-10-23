// Пункты отладочного меню. Новые этапы добавляют свои через registerDebug(группа, подпись, действие).
import { registerDebug } from './registry.js';
import { FontTestScene } from '../scenes/font_test.js';
import { GalleryScene } from '../scenes/gallery.js';
import { TestRoomScene } from '../scenes/test_room.js';
import { TitleScene } from '../scenes/title.js';
import { DialogScene } from '../scenes/dialog_scene.js';
import { WorldScene } from '../scenes/world.js';
import { LessonScene } from '../scenes/lesson_scene.js';
import { IntroScene } from '../scenes/intro.js';
import { MinigameScene } from '../scenes/minigame_scene.js';
import { DemoEndScene } from '../scenes/demo_end.js';
import { startBreak } from '../game/day.js';
import { generateSeedCode } from '../engine/rng.js';
import { MAPS } from '../world/maps/index.js';
import { rollBet } from '../game/bets.js';
import { PhonePopupScene } from '../scenes/phone_popup.js';
import { DirectorScene } from '../scenes/director.js';
import { labelLines } from '../game/dialogs.js';

// Открыть сцену поверх главного меню (по X вернёмся в меню).
function overTitle(game, scene) {
  game.scenes.transition(() => {
    game.scenes.reset(new TitleScene());
    game.scenes.push(scene);
  });
}

function freshDay(game) {
  if (!game.state.seed || game.state.phase === 'free') game.newDay(generateSeedCode());
}

export function registerDebugEntries() {
  registerDebug('Сцены', 'Шрифт', (game) => overTitle(game, new FontTestScene()));
  registerDebug('Сцены', 'Галерея', (game) => overTitle(game, new GalleryScene()));
  registerDebug('Сцены', 'Тестовая комната', (game) => game.scenes.reset(new TestRoomScene(), { fade: true }));
  registerDebug('Сцены', 'Главное меню', (game) => game.scenes.reset(new TitleScene(), { fade: true }));
  registerDebug('Сцены', 'Конец демо', (game) => game.scenes.reset(new DemoEndScene(), { fade: true }));

  registerDebug('День', 'Вступление', (game) => { game.newDay(generateSeedCode()); game.scenes.reset(new IntroScene(), { fade: true }); });
  registerDebug('День', 'У входа, 09:03', (game) => {
    freshDay(game);
    Object.assign(game.state, { phase: 'late', lesson: 0, clock: '09:03', late: true });
    game.scenes.reset(new WorldScene('street', 'bus'), { fade: true });
  });
  registerDebug('День', 'Урок 1 — английский', (game) => {
    freshDay(game);
    game.state.late = true;
    game.state.phase = 'late';
    game.scenes.reset(new LessonScene(1), { fade: true });
  });
  registerDebug('День', 'Перемена 1', (game) => {
    freshDay(game);
    if (game.state.grades[0] == null) game.state.grades[0] = 5;
    startBreak(game.state, 1);
    game.scenes.reset(new WorldScene('k2_f4', 'door404'), { fade: true });
  });

  for (const id of Object.keys(MAPS)) {
    registerDebug('Локации', id, (game) => { freshDay(game); game.scenes.reset(new WorldScene(id, null), { fade: true }); });
  }

  registerDebug('Мини-игры', 'Списывание (урок 1)', (game) => {
    freshDay(game);
    game.state.phase = 'lesson'; game.state.lesson = 1; game.state.seat = 'igor';
    game.scenes.push(new MinigameScene('cheat', { params: { lesson: 1 } }));
  });
  for (const opp of ['igor', 'denis', 'matych', 'buy', 'guza', 'levonchuk']) {
    registerDebug('Мини-игры', 'Байт-дуэль: ' + opp, (game) => {
      freshDay(game);
      game.scenes.push(new MinigameScene('bait', { opp, bet: rollBet(game.state, opp), params: { opp } }));
    });
  }
  registerDebug('Мини-игры', 'Байт на уроке: igor', (game) => {
    freshDay(game);
    game.state.phase = 'lesson'; game.state.lesson = 1;
    game.scenes.push(new MinigameScene('bait', { opp: 'igor', params: { opp: 'igor', inLesson: true } }));
  });
  registerDebug('Сценки', 'Сообщение отца', (game) => {
    const l = labelLines('dad', 'msg_3')[0];
    game.scenes.push(new PhonePopupScene({ from: 'батя', text: l ? l.text : '', amount: 300 }));
  });
  registerDebug('Сценки', 'Берсерк Игоря', (game) => { freshDay(game); game.scenes.push(new DialogScene('bait_igor', 'berserk')); });
  registerDebug('Сценки', 'Вызов к директору', (game) => { freshDay(game); game.scenes.push(new DirectorScene({})); });
  registerDebug('Мини-игры', 'Диалог с Игорем (тест)', (game) => game.scenes.transition(() => {
    game.scenes.reset(new TestRoomScene());
    game.scenes.push(new DialogScene('test', 'igor_talk'));
  }));
}
