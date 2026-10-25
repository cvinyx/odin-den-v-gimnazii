// Галерея: все персонажи в ряд с именами (рост и силуэты сравнимы), выбранный — крупно в 4 направлениях
// и портреты во всех эмоциях.
import { CHARACTERS, STUDENT_ORDER } from '../../data/characters.js';
import { TEACHERS, TEACHER_ORDER, STAFF } from '../../data/teachers.js';
import { sheetOf, portraitOf, makeUnnamed, getPerson } from '../gen/people.js';
import { frameRect, WALK_CYCLE, FRAME_W, FRAME_H, DIRS, heightPx } from '../gen/sprites.js';
import { EMOTIONS, EMOTION_NAMES } from '../gen/portraits.js';
import { Rng } from '../engine/rng.js';

export class GalleryScene {
  constructor() { this.id = 'gallery'; this.opaque = true; this.group = 0; this.index = 0; this.time = 0; }

  enter(game) {
    this.game = game;
    const rng = new Rng('gallery-unnamed');
    this.unnamed = Array.from({ length: 20 }, () => makeUnnamed(rng, 'gal'));
    this.kids = Array.from({ length: 12 }, () => makeUnnamed(rng, 'galkid', null, { kids: true }));
    this.groups = [
      { title: 'Ученики', ids: STUDENT_ORDER },
      { title: 'Учителя', ids: TEACHER_ORDER },
      { title: 'Персонал', ids: Object.keys(STAFF) },
      { title: 'Безымянные (по сиду, ~70 % в форме)', ids: this.unnamed },
      { title: 'Младшие классы', ids: this.kids },
    ];
  }

  get ids() { return this.groups[this.group].ids; }

  update(dt) {
    this.time += dt;
    const input = this.game.input;
    if (input.pressed('back')) { input.consume('back'); this.game.scenes.pop(); return; }
    const n = this.ids.length;
    if (input.pressed('left')) this.index = (this.index + n - 1) % n;
    if (input.pressed('right')) this.index = (this.index + 1) % n;
    if (input.pressed('up') || input.pressed('down') || input.pressed('confirm')) {
      this.group = (this.group + (input.pressed('up') ? this.groups.length - 1 : 1)) % this.groups.length;
      this.index = 0;
    }
  }

  draw(r) {
    r.rect(0, 0, 480, 270, '#1c1a2e');
    const g = this.groups[this.group];
    r.text(`Галерея: ${g.title}`, 8, 5, { color: '#ffe14d' });
    r.text('←→ персонаж · ↑↓/Z группа · X назад', 474, 5, { align: 'right', color: '#9a9aa8' });

    // ряд: все персонажи группы в масштабе 1, ноги на одной линии
    const ids = g.ids;
    const step = Math.min(31, Math.floor(464 / ids.length));
    const x0 = 240 - (ids.length * step) / 2;
    const baseY = 50;
    r.rect(0, baseY, 480, 1, '#3a3652');
    ids.forEach((id, i) => {
      const x = x0 + i * step + step / 2;
      const sheet = sheetOf(id);
      const p = getPerson(id);
      if (sheet) {
        const f = frameRect('down', 0);
        r.sprite(sheet, f.sx, f.sy, f.sw, f.sh, x - FRAME_W / 2, baseY - FRAME_H + 1);
      } else {
        r.image(portraitOf(id, 'norm'), x - 12, baseY - 26, 24, 24);
      }
      const sel = i === this.index;
      const name = p.short || p.name;
      const ny = baseY + 4 + (i % 2) * 9;
      r.text(name, x, ny, { align: 'center', color: sel ? '#ffe14d' : '#c8c8d8' });
      if (sel) r.text('▲', x, baseY + 22, { align: 'center', color: '#ffe14d' });
    });

    // выбранный — крупно
    const id = ids[this.index];
    const p = getPerson(id);
    const sheet = sheetOf(id);
    const py = 86;
    r.box(6, py - 4, 468, 180, '#4a4668', '#141224', 1);
    r.text(p.name, 14, py + 2, { color: '#ffffff', scale: 2 });
    const info = [p.cls || p.role || '', p.heightCm ? `${p.heightCm} см → ${heightPx(p.heightCm)} px` : 'только голос'].filter(Boolean).join(' · ');
    r.text(info, 14, py + 22, { color: '#9fd3ff' });
    if (p.about) r.text(p.about, 14, py + 33, { color: '#c8c8d8' });
    if (p.nicknames) r.text('Клички: ' + p.nicknames.map((n) => n.name + (n.rare ? ' (редко)' : n.aboutOnly ? ' (только за глаза)' : '')).join(', '), 14, py + 44, { color: '#9a9aa8' });
    else if (p.unnamed) r.text(p.uniform ? 'В школьной форме' : 'Не в форме', 14, py + 44, { color: '#9a9aa8' });
    if (sheet) {
      const frame = WALK_CYCLE[Math.floor(this.time * 6) % 4];
      DIRS.forEach((d, i) => {
        const f = frameRect(d, frame);
        r.sprite(sheet, f.sx, f.sy, f.sw, f.sh, 14 + i * 40, py + 44, 2);
      });
    } else {
      r.text('Директора не видно — только голос из-за двери.', 14, py + 60, { color: '#c8c8d8' });
    }
    EMOTIONS.forEach((e, i) => {
      const x = 186 + i * 57;
      r.image(portraitOf(id, e), x, py + 50);
      r.frame(x - 1, py + 49, 50, 50, '#4a4668');
      r.text(EMOTION_NAMES[e], x + 24, py + 102 + (i % 2) * 10, { align: 'center', color: '#c8c8d8' });
    });
    r.text(`Тон голоса: ${p.blip.freq} Гц (${p.blip.wave})`, 186, py + 128, { color: '#9a9aa8' });
  }
}
