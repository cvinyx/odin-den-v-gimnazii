// Концовка (раздел 16): короткая сцена с друзьями (data/dialogs/endings.txt, метка = id концовки)
// под свой музыкальный мотив, затем экран итогов (results.js).
import { DialogScene } from './dialog_scene.js';
import { ResultsScene } from './results.js';
import { ENDING_TITLES, ENDING_MUSIC, ENDING_COLORS } from '../game/endings.js';
import { checkAchievements } from '../game/achievements.js';
import { storeRemove, KEYS } from '../engine/save.js';
import { sheetOf } from '../gen/people.js';
import { frameRect } from '../gen/sprites.js';
import { audio } from '../engine/audio.js';

// Кто стоит в кадре концовки.
const CAST = {
  director: ['roma'],
  perfect: ['denis', 'roma', 'igor', 'chernyak'],
  legend: ['matych', 'roma', 'buy', 'igor'],
  drained: ['roma'],
  chaos: ['levonchuk', 'denis', 'roma', 'igor', 'shurpo'],
};
const BG = { director: '#1a0c0c', perfect: '#1c2a14', legend: '#1e1030', drained: '#14161c', chaos: '#0e2026' };

export class EndingScene {
  constructor(kind) { this.id = 'ending'; this.kind = kind; this.opaque = true; this.t = 0; }
  enter(game) {
    this.game = game;
    const st = game.state;
    st.phase = 'end';
    st.flags.ending = this.kind;
    storeRemove(KEYS.autosave); // день окончен — «Продолжить» больше нечего
    game.playMusic(ENDING_MUSIC[this.kind] || 'menu');
    audio.play('bell');
    for (const a of checkAchievements(st, true)) game.achQueue.push({ a, t: 0 });
    game.scenes.push(new DialogScene('endings', this.kind, {
      onEnd: () => game.scenes.reset(new ResultsScene(this.kind), { fade: true }),
    }));
  }
  update(dt) { this.t += dt; }
  draw(r) {
    const k = this.kind;
    r.rect(0, 0, 480, 270, BG[k] || '#101024');
    for (let y = 120; y < 234; y += 6) r.rect(0, y, 480, 3, '#ffffff08');
    r.text('КОНЦОВКА', 240, 10, { align: 'center', color: '#9a9aa8' });
    r.text(ENDING_TITLES[k], 240, 24, { align: 'center', color: ENDING_COLORS[k], scale: 3, shadow: '#000' });
    const cast = CAST[k] || ['roma'];
    cast.forEach((id, i) => {
      const f = frameRect('down', k === 'chaos' ? Math.floor(this.t * 4 + i) % 3 : 0);
      const x = 240 + (i - (cast.length - 1) / 2) * 46;
      const bob = k === 'perfect' || k === 'legend' ? Math.round(Math.abs(Math.sin(this.t * 4 + i)) * -4) : 0;
      r.sprite(sheetOf(id), f.sx, f.sy, f.sw, f.sh, x - f.sw, 70 + bob, 2);
    });
  }
}
