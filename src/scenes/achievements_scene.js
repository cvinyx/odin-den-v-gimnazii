// Экран «Достижения» в главном меню: полученные — с названием и описанием, закрытые — «???».
import { ACHIEVEMENTS, unlockedIds } from '../game/achievements.js';

export class AchievementsScene {
  constructor() { this.id = 'achievements'; this.opaque = true; this.t = 0; this.index = 0; }
  enter(game) { this.game = game; this.have = new Set(unlockedIds()); }
  update(dt) {
    this.t += dt;
    const input = this.game.input;
    if (input.pressed('back') || input.pressed('confirm')) { input.consume('back'); input.consume('confirm'); this.game.scenes.pop(); return; }
    const n = ACHIEVEMENTS.length;
    if (input.pressed('down')) this.index = Math.min(n - 1, this.index + 1);
    if (input.pressed('up')) this.index = Math.max(0, this.index - 1);
  }
  draw(r) {
    r.rect(0, 0, 480, 270, '#14122a');
    for (let y = 0; y < 270; y += 8) r.rect(0, y, 480, 1, '#1a1834');
    r.text('Достижения', 240, 8, { align: 'center', color: '#ffe14d', scale: 2, shadow: '#000' });
    r.text(`Получено ${this.have.size} из ${ACHIEVEMENTS.length}`, 240, 28, { align: 'center', color: '#9a9aa8' });
    const per = 13;
    const start = Math.max(0, Math.min(ACHIEVEMENTS.length - per, this.index - 6));
    ACHIEVEMENTS.slice(start, start + per).forEach((a, j) => {
      const i = start + j;
      const got = this.have.has(a.id);
      const y = 44 + j * 15;
      if (i === this.index) r.rect(16, y - 2, 448, 14, '#2a2650');
      r.text(got ? '★' : '·', 24, y + 1, { color: got ? '#ffe14d' : '#4a4668' });
      r.text(got ? a.name : '???', 38, y + 1, { color: got ? '#ffffff' : '#7d7d90' });
      if (got) r.text(a.desc, 462, y + 1, { align: 'right', color: '#9a9aa8' });
    });
    r.text('↑↓ — листать · X — назад', 240, 254, { align: 'center', color: '#9a9aa8' });
  }
}
