// Отладка: «лист персонажей» — все именные со спрайтом и портретами во всех эмоциях, учителя,
// безымянные и дети. ←→ — страницы, X — назад. Нужен для скриншотов этапа V2-1.
import { STUDENT_ORDER } from '../../data/characters.js';
import { TEACHER_ORDER } from '../../data/teachers.js';
import { sheetOf, portraitOf, makeUnnamed, getPerson } from '../gen/people.js';
import { frameRect } from '../gen/sprites.js';
import { EMOTIONS } from '../gen/portraits.js';
import { Rng } from '../engine/rng.js';

const PER_PAGE = 12;

export class CastSheetScene {
  constructor(page = 0) { this.id = 'cast_sheet'; this.opaque = true; this.page = page; }

  enter(game) {
    this.game = game;
    const rng = new Rng('cast-sheet');
    const unnamed = Array.from({ length: 20 }, () => makeUnnamed(rng, 'cast'));
    const kids = Array.from({ length: 20 }, () => makeUnnamed(rng, 'castkid', null, { kids: true }));
    const chunks = (title, ids) => {
      const out = [];
      for (let i = 0; i < ids.length; i += PER_PAGE) out.push({ title, ids: ids.slice(i, i + PER_PAGE), full: true });
      return out;
    };
    const voiced = TEACHER_ORDER.filter((id) => !getPerson(id).voiceOnly);
    this.pages = [
      ...chunks('Ученики', STUDENT_ORDER),
      ...chunks('Учителя', voiced),
      { title: 'Безымянные: 20 по сиду (~70 % в форме гимназии)', ids: unnamed, grid: true },
      { title: 'Младшие классы (рост 120–150 см)', ids: kids, grid: true },
    ];
  }

  update() {
    const input = this.game.input;
    if (input.pressed('back')) { input.consume('back'); this.game.scenes.pop(); return; }
    const n = this.pages.length;
    if (input.pressed('right') || input.pressed('confirm')) this.page = (this.page + 1) % n;
    if (input.pressed('left')) this.page = (this.page + n - 1) % n;
  }

  draw(r) {
    r.rect(0, 0, 480, 270, '#1c1a2e');
    const pg = this.pages[this.page];
    r.text(`${pg.title} · стр. ${this.page + 1}/${this.pages.length}`, 6, 3, { color: '#ffe14d' });
    if (pg.grid) {
      pg.ids.forEach((id, i) => {
        const x = 14 + (i % 10) * 46, y = 22 + Math.floor(i / 10) * 122;
        const f = frameRect('down', 0);
        r.sprite(sheetOf(id), f.sx, f.sy, f.sw, f.sh, x, y, 2);
        r.image(portraitOf(id, 'norm'), x - 4, y + 68, 40, 40);
        const p = getPerson(id);
        r.text(p.uniform ? 'форма' : '—', x + 16, y + 110, { align: 'center', color: p.uniform ? '#9fd3ff' : '#7d7d90' });
      });
      return;
    }
    pg.ids.forEach((id, i) => {
      const col = i < 6 ? 0 : 1, row = i % 6;
      const x = 4 + col * 238, y = 16 + row * 42;
      const p = getPerson(id);
      r.rect(x, y, 234, 40, row % 2 ? '#24223a' : '#2a2844');
      const f = frameRect('down', 0);
      r.sprite(sheetOf(id), f.sx, f.sy, f.sw, f.sh, x + 2, y + 6);
      EMOTIONS.forEach((e, k) => r.image(portraitOf(id, e), x + 20 + k * 30, y + 1, 28, 28));
      const nick = p.nicknames ? ' «' + p.nicknames.map((n) => n.name).join('», «') + '»' : '';
      r.text(p.name + nick, x + 20, y + 30, { color: '#ffffff' });
      r.text(`${p.heightCm} см`, x + 230, y + 2, { align: 'right', color: '#9a9aa8' });
    });
  }
}
