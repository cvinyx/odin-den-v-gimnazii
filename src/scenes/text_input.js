// Поле ввода (код дня, код сохранения). Печать с клавиатуры и вставка Ctrl+V.
// Enter — готово, Esc — отмена, Backspace — стереть.
export class TextInputScene {
  // opts: { title, hint, maxLen, filter: (ch) => ch|null, onDone(text), onCancel() }
  constructor(opts) {
    this.id = 'text_input';
    this.opts = { maxLen: 2000, filter: (c) => c, ...opts };
    this.text = '';
    this.opaque = false;
    this.time = 0;
    this.error = null;
  }
  enter(game) { this.game = game; game.textInputActive = true; }
  exit() { this.game.textInputActive = false; }

  setError(msg) { this.error = msg; this.errorT = 0; }

  update(dt) {
    this.time += dt;
    const input = this.game.input;
    for (const ch of input.typed) {
      if (ch === '\b') { this.text = [...this.text].slice(0, -1).join(''); continue; }
      const f = this.opts.filter(ch);
      if (f && this.text.length < this.opts.maxLen) this.text += f;
    }
    if (input.pasteRequested && navigator.clipboard && navigator.clipboard.readText) {
      input.pasteRequested = false;
      navigator.clipboard.readText().then((t) => {
        for (const ch of t) { const f = this.opts.filter(ch); if (f && this.text.length < this.opts.maxLen) this.text += f; }
      }).catch(() => {});
    }
    input.pasteRequested = false;
    if (input.pressedCodes.has('Enter') || input.pressedCodes.has('NumpadEnter')) {
      input.consumeAll();
      this.opts.onDone(this.text, this);
      return;
    }
    if (input.pressedCodes.has('Escape')) {
      input.consumeAll();
      this.game.scenes.pop();
      if (this.opts.onCancel) this.opts.onCancel();
    }
  }

  draw(r) {
    r.alpha(0.8, () => r.rect(0, 0, 480, 270, '#000'));
    r.box(20, 40, 440, 190);
    r.text(this.opts.title || 'Ввод', 240, 50, { align: 'center', color: '#ffe14d', scale: 2 });
    if (this.opts.hint) r.text(this.opts.hint, 240, 72, { align: 'center', color: '#9a9aa8' });
    const per = 68;
    const shown = this.text + (r.blink(0.4) ? '_' : ' ');
    const lines = [];
    for (let i = 0; i < shown.length; i += per) lines.push(shown.slice(i, i + per));
    const vis = lines.slice(-10);
    vis.forEach((l, i) => r.text(l, 36, 90 + i * 10, { color: '#ffffff' }));
    if (this.error) r.text(this.error, 240, 196, { align: 'center', color: '#ff5a5a' });
    r.text('Enter — готово · Esc — отмена · Ctrl+V — вставить', 240, 214, { align: 'center', color: '#9a9aa8' });
  }
}
