// Сцена-проверка шрифта: все глифы, крупный режим ×2, цвета, перенос по словам.
import { GLYPHS } from '../engine/font_glyphs.js';

const SAMPLES = [
  'Съешь же ещё этих мягких французских булок, да выпей чаю.',
  'Белорусские: Іі Ўў — «У Беларусі ўсё будзе добра».',
  'The quick brown fox jumps over the lazy dog. 0123456789',
  'Знаки: . , ! ? : ; - — « » " \' ( ) % № + = / * # @ & …',
];

export class FontTestScene {
  constructor() { this.id = 'font'; this.opaque = true; this.page = 0; }
  enter(game) { this.game = game; }
  update() {
    const input = this.game.input;
    if (input.pressed('back')) { input.consume('back'); this.game.scenes.pop(); return; }
    if (input.pressed('left') || input.pressed('right')) this.page = 1 - this.page;
  }
  draw(r) {
    r.rect(0, 0, 480, 270, '#101018');
    r.text('Шрифт 5×7 (ячейка 6×9)', 8, 6, { scale: 2, color: '#ffe14d' });
    const chars = Object.keys(GLYPHS).filter((c) => c !== ' ');
    const perRow = 39;
    chars.forEach((ch, i) => {
      const x = 8 + (i % perRow) * 12;
      const y = 30 + Math.floor(i / perRow) * 11;
      r.glyph(ch, x, y, '#ffffff');
    });
    let y = 30 + Math.ceil(chars.length / perRow) * 11 + 6;
    SAMPLES.forEach((s) => { r.text(s, 8, y, { color: '#c8e0ff' }); y += 11; });
    y += 4;
    r.text('КРУПНО ×2: Рома, Ёж, Ў!', 8, y, { scale: 2, color: '#ffffff' });
    y += 22;
    const colors = ['#ff5555', '#ffe14d', '#6be36b', '#6fb6ff', '#ff8ad0', '#ffa040'];
    colors.forEach((c, i) => r.text('Цвет', 8 + i * 34, y, { color: c }));
    y += 14;
    const para = 'Перенос по словам: этот длинный абзац переносится в рамку шириной 200 пикселей, слова не рвутся посередине.';
    r.frame(6, y - 2, 204, 46, '#555');
    r.wrap(para, 200).forEach((l, i) => r.text(l, 8, y + i * 10, { color: '#ffffff' }));
    r.text('X — назад', 474, 260, { align: 'right', color: '#9a9aa8' });
  }
}
