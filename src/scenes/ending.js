// Концовка недели (ИС-5, Р-4): короткая сцена с друзьями (data/dialogs/endings.txt, метка = id концовки)
// под свой музыкальный мотив, затем экран итогов недели (results.js).
import { DialogScene } from './dialog_scene.js';
import { ResultsScene } from './results.js';
import { ENDING_TITLES, ENDING_MUSIC, ENDING_COLORS, avgGrade } from '../game/endings.js';
import { checkAchievements } from '../game/achievements.js';
import { storeRemove, KEYS } from '../engine/save.js';
import { sheetOf } from '../gen/people.js';
import { frameRect } from '../gen/sprites.js';
import { audio } from '../engine/audio.js';

// Кто стоит в кадре концовки.
const CAST = {
  pride: ['denis', 'roma', 'chernyak'],
  bntu: ['igor', 'roma', 'denis'],
  habza: ['levonchuk', 'roma', 'igor'],
  dad: ['roma'],
};
const BG = { pride: '#1c2a14', bntu: '#0e2026', habza: '#1e1030', dad: '#1a0c0c' };

export class EndingScene {
  constructor(kind) { this.id = 'ending'; this.kind = kind; this.opaque = true; this.t = 0; }
  enter(game) {
    this.game = game;
    const st = game.state;
    st.phase = 'end';
    st.flags.ending = this.kind;
    storeRemove(KEYS.autosave); // неделя окончена — «Продолжить» больше нечего
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
    r.text('КОНЦОВКА НЕДЕЛИ', 240, 10, { align: 'center', color: '#9a9aa8' });
    r.text(`Средний балл за неделю: ${avgGrade(this.game.state).toFixed(2).replace('.', ',')}`, 240, 54, { align: 'center', color: '#c8c8d8' });
    r.text(ENDING_TITLES[k], 240, 24, { align: 'center', color: ENDING_COLORS[k], scale: 3, shadow: '#000' });
    const cast = CAST[k] || ['roma'];
    cast.forEach((id, i) => {
      const f = frameRect('down', k === 'habza' ? Math.floor(this.t * 4 + i) % 3 : 0);
      const x = 240 + (i - (cast.length - 1) / 2) * 46;
      const bob = k === 'pride' || k === 'bntu' ? Math.round(Math.abs(Math.sin(this.t * 4 + i)) * -4) : 0;
      r.sprite(sheetOf(id), f.sx, f.sy, f.sw, f.sh, x - f.sw, 70 + bob, 2);
    });
  }
}
