// Вызов к директору (раздел 7): сценка у кабинета директора — директор только голосом из-за двери.
// 1-й и 2-й раз: стресс +20 (оценку 2 ставит урок). 3-й раз — концовка «К директору!».
import { directorCall, isDirectorEnding } from '../game/actions.js';
import { DialogScene } from './dialog_scene.js';
import { portraitOf } from '../gen/people.js';
import { audio } from '../engine/audio.js';

export class DirectorScene {
  constructor(opts = {}) { this.id = 'director'; this.opts = opts; this.opaque = true; this.t = 0; }
  enter(game) {
    this.game = game;
    const st = game.state;
    this.k = directorCall(st);
    game.playMusic('director');
    audio.play('door');
    const label = isDirectorEnding(st) ? 'call_3' : 'call_' + this.k;
    game.scenes.push(new DialogScene('director', label, { onEnd: () => this.after() }));
  }
  after() {
    const game = this.game;
    if (isDirectorEnding(game.state)) {
      import('./ending.js').then(({ EndingScene }) => game.scenes.reset(new EndingScene('director'), { fade: true }));
      return;
    }
    game.scenes.remove(this);
    if (this.opts.onDone) this.opts.onDone();
  }
  update(dt) { this.t += dt; }
  draw(r) {
    r.rect(0, 0, 480, 234, '#2a2620');
    for (let x = 0; x < 480; x += 32) r.rect(x, 0, 1, 234, '#332e27');
    r.rect(0, 150, 480, 84, '#5f8f6e');
    r.rect(0, 150, 480, 2, '#3f6650');
    const door = portraitOf('director', 'norm');
    r.image(door, 168, 20, 144, 144);
    r.text('КАБИНЕТ ДИРЕКТОРА', 240, 6, { align: 'center', color: '#ffe14d', shadow: '#000' });
    r.text(`Вызов №${this.k}`, 474, 6, { align: 'right', color: '#ff8a8a' });
    this.game.hud.draw(r, this.game.state);
  }
}
