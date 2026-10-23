// Экран итога урока: оценка и изменения статусов за урок.
import { drawDeltas } from './minigame_scene.js';
import { audio } from '../engine/audio.js';

export class LessonResultScene {
  constructor(opts) { this.id = 'lesson_result'; this.opts = opts; this.opaque = true; this.time = 0; }
  enter(game) { this.game = game; audio.play(this.opts.grade >= 6 ? 'statUp' : 'statDown'); }
  update(dt) {
    this.time += dt;
    const input = this.game.input;
    if (this.time > 0.4 && input.pressed('confirm')) {
      input.consume('confirm');
      this.game.scenes.remove(this);
      this.opts.onDone();
    }
  }
  draw(r) {
    const o = this.opts;
    r.rect(0, 0, 480, 270, '#101a14');
    r.box(40, 16, 400, 238, '#ffffff', '#0c120e');
    r.text(`Урок ${o.lesson.n}: ${o.lesson.subject}`, 240, 26, { align: 'center', color: '#ffe14d', scale: 2 });
    r.text('Оценка', 240, 54, { align: 'center', color: '#9a9aa8' });
    const s = Math.min(1, this.time * 3);
    const color = o.grade >= 7 ? '#6be36b' : o.grade >= 5 ? '#ffe14d' : '#ff5a5a';
    r.text(String(o.grade), 240, 66, { align: 'center', color, scale: s > 0.9 ? 2 : 1 });
    if (o.director) r.text('Вызов к директору — остаток урока пропущен.', 240, 92, { align: 'center', color: '#ff8a8a' });
    r.text('Изменения за урок:', 240, 108, { align: 'center', color: '#9a9aa8' });
    drawDeltas(r, o.before, o.after, 122);
    r.text('Z — дальше', 240, 240, { align: 'center', color: '#9a9aa8' });
  }
}
