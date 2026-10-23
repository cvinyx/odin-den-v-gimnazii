// Тестовая комната (этап 1, доступна из отладочного меню): карта со статичными Игорем и Черняком.
import { WorldScene } from './world.js';

export class TestRoomScene extends WorldScene {
  constructor() {
    super('test_room', 'start', { autosave: false });
    this.id = 'test_room';
  }
}
