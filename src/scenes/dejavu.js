// Титр перед понедельником (EDITS_V2: Р-3, О-2): всё это — сон выпускников про 11 класс.
export class DejavuScene {
  constructor(onDone) { this.id = 'dejavu'; this.opaque = true; this.t = 0; this.onDone = onDone; }
  enter(game) { this.game = game; game.playMusic('intro'); }
  update(dt) {
    this.t += dt;
    const input = this.game.input;
    if ((this.t > 1.2 && (input.pressed('confirm') || input.pressed('back'))) || this.t > 7) {
      input.consume('confirm'); input.consume('back');
      this.onDone();
    }
  }
  draw(r) {
    r.rect(0, 0, 480, 270, '#000');
    const a = Math.min(1, this.t / 1.2);
    r.alpha(a, () => {
      r.text('Все персонажи — совершеннолетние выпускники гимназии.', 240, 96, { align: 'center', color: '#c8c8d8' });
      r.text('Им снова снится 11 класс…', 240, 112, { align: 'center', color: '#c8c8d8' });
      r.text('Понедельник. Опять.', 240, 140, { align: 'center', color: '#ffe14d', scale: 2 });
    });
    if (this.t > 1.2) r.text('Z — дальше', 240, 240, { align: 'center', color: '#5a5a6a' });
  }
}
