// Куда вести игрока по состоянию дня: новая игра, «Продолжить», загрузка кода сохранения.
import { IntroScene } from '../scenes/intro.js';
import { WorldScene } from '../scenes/world.js';
import { LessonScene } from '../scenes/lesson_scene.js';
import { TestRoomScene } from '../scenes/test_room.js';

export function sceneForState(state) {
  switch (state.phase) {
    case 'intro': return new IntroScene();
    case 'lesson': return new LessonScene(state.lesson, { resumed: true });
    case 'late':
    case 'break': return new WorldScene(state.location, null, { restore: true });
    case 'free': return new TestRoomScene();
    default: return new IntroScene();
  }
}

export function startNewDay(game, seed) {
  game.newDay(seed);
  game.state.phase = 'intro';
  game.scenes.reset(new IntroScene(), { fade: true });
}

export function continueFrom(game, state) {
  game.loadState(state);
  game.scenes.reset(sceneForState(game.state), { fade: true });
}
