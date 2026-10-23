// Показ кода сохранения на экране (на случай, если буфер обмена недоступен).
export class SaveCodeScene {
  constructor(code) { this.id = 'save_code'; this.code = code; this.opaque = false; }
  enter(game) { this.game = game; }
  update() {
    const input = this.game.input;
    if (input.pressed('back') || input.pressed('confirm')) { input.consume('confirm'); input.consume('back'); this.game.scenes.pop(); }
  }
  draw(r) {
    r.alpha(0.75, () => r.rect(0, 0, 480, 270, '#000'));
    r.box(20, 40, 440, 190);
    r.text('Код сохранения', 240, 50, { align: 'center', color: '#ffe14d', scale: 2 });
    const lines = [];
    const per = 68;
    for (let i = 0; i < this.code.length; i += per) lines.push(this.code.slice(i, i + per));
    lines.slice(0, 13).forEach((l, i) => r.text(l, 36, 76 + i * 10, { color: '#ffffff' }));
    if (lines.length > 13) r.text('…', 36, 76 + 13 * 10, { color: '#ffffff' });
    r.text('Код уже в буфере обмена (если браузер разрешил). Z — назад', 240, 214, { align: 'center', color: '#9a9aa8' });
  }
}
