// Ввод с клавиатуры (раздел 3). Действия: pressed (нажато в этом шаге), held (удерживается), released.

const BINDINGS = {
  up: ['ArrowUp', 'KeyW'],
  down: ['ArrowDown', 'KeyS'],
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  confirm: ['KeyZ', 'Enter', 'Space', 'NumpadEnter'],
  back: ['KeyX', 'Escape'],
  pause: ['Escape'],
  run: ['ShiftLeft', 'ShiftRight'],
  action2: ['KeyC'],
  tab: ['Tab'],
  mute: ['KeyM'],
  fullscreen: ['KeyF'],
  debug: ['Backquote'],
};

const PREVENT = new Set([
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Tab', 'Backquote', 'Enter',
]);

class Input {
  constructor() {
    this.down = new Set();        // коды, удерживаемые сейчас
    this.queuePressed = new Set(); // накопленные между шагами
    this.queueReleased = new Set();
    this.pressedCodes = new Set(); // актуальные на текущем шаге
    this.releasedCodes = new Set();
    this.typed = [];              // символы для поля ввода кода
    this.typedQueue = [];
    this.firstInteraction = [];   // колбэки на первое нажатие (старт аудио)
    this.anyKeyCallbacks = [];
    this.attached = false;
  }

  attach(target = window) {
    if (this.attached) return;
    this.attached = true;
    target.addEventListener('keydown', (e) => {
      if (PREVENT.has(e.code)) e.preventDefault();
      this.fireFirstInteraction();
      if (!e.repeat) {
        this.down.add(e.code);
        this.queuePressed.add(e.code);
      }
      if (e.key && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) this.typedQueue.push(e.key);
      if (e.key === 'Backspace') this.typedQueue.push('\b');
      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyV') this.pasteRequested = true;
    });
    target.addEventListener('keyup', (e) => {
      this.down.delete(e.code);
      this.queueReleased.add(e.code);
    });
    target.addEventListener('blur', () => {
      for (const c of this.down) this.queueReleased.add(c);
      this.down.clear();
    });
    target.addEventListener('paste', (e) => {
      const text = (e.clipboardData && e.clipboardData.getData('text')) || '';
      for (const ch of text) this.typedQueue.push(ch);
      e.preventDefault();
    });
    target.addEventListener('mousedown', () => this.fireFirstInteraction());
  }

  fireFirstInteraction() {
    if (!this.firstInteraction.length) return;
    const cbs = this.firstInteraction;
    this.firstInteraction = [];
    for (const cb of cbs) { try { cb(); } catch (err) { console.error(err); } }
  }

  onFirstInteraction(cb) { this.firstInteraction.push(cb); }

  // Вызывается в начале каждого фиксированного шага логики.
  beginStep() {
    this.pressedCodes = this.queuePressed;
    this.releasedCodes = this.queueReleased;
    this.queuePressed = new Set();
    this.queueReleased = new Set();
    this.typed = this.typedQueue;
    this.typedQueue = [];
  }

  pressed(action) {
    const codes = BINDINGS[action];
    if (!codes) return false;
    for (const c of codes) if (this.pressedCodes.has(c)) return true;
    return false;
  }
  held(action) {
    const codes = BINDINGS[action];
    if (!codes) return false;
    for (const c of codes) if (this.down.has(c)) return true;
    return false;
  }
  released(action) {
    const codes = BINDINGS[action];
    if (!codes) return false;
    for (const c of codes) if (this.releasedCodes.has(c)) return true;
    return false;
  }
  anyPressed() { return this.pressedCodes.size > 0; }

  // Съесть нажатие, чтобы следующая сцена в этом же шаге его не увидела.
  consume(action) {
    const codes = BINDINGS[action] || [];
    for (const c of codes) this.pressedCodes.delete(c);
  }
  consumeAll() { this.pressedCodes.clear(); this.typed = []; }

  // Направление движения: {x, y} в диапазоне -1..1.
  axis() {
    let x = 0, y = 0;
    if (this.held('left')) x -= 1;
    if (this.held('right')) x += 1;
    if (this.held('up')) y -= 1;
    if (this.held('down')) y += 1;
    return { x, y };
  }
}

export const input = new Input();
export { BINDINGS };
