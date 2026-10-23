// Менеджер сцен со стеком (push/pop/replace) и переходами-затемнениями.
// Сцена — объект с необязательными методами: enter(game), exit(), resume(), update(dt), draw(r).
// Поле opaque=false значит «рисовать сцену под этой» (меню паузы, диалог поверх карты).

export class SceneManager {
  constructor(game) {
    this.game = game;
    this.stack = [];
    this.fade = { alpha: 0, dir: 0, speed: 4, pending: null };
  }

  get top() { return this.stack[this.stack.length - 1] || null; }
  get busy() { return this.fade.dir !== 0; }

  _enter(scene) {
    scene.game = this.game;
    if (scene.enter) scene.enter(this.game);
  }

  push(scene, opts = {}) {
    if (opts.fade) return this._fadeThen(() => this._push(scene));
    this._push(scene);
    return scene;
  }
  _push(scene) {
    this.stack.push(scene);
    this._enter(scene);
    return scene;
  }

  pop(result, opts = {}) {
    if (opts.fade) return this._fadeThen(() => this._pop(result));
    return this._pop(result);
  }
  _pop(result) {
    const s = this.stack.pop();
    if (s && s.exit) s.exit();
    const t = this.top;
    if (t && t.resume) t.resume(result, s);
    return s;
  }

  // Заменить верхнюю сцену.
  replace(scene, opts = {}) {
    if (opts.fade) return this._fadeThen(() => this._replace(scene));
    this._replace(scene);
    return scene;
  }
  _replace(scene) {
    const s = this.stack.pop();
    if (s && s.exit) s.exit();
    return this._push(scene);
  }

  // Очистить стек и поставить одну сцену.
  reset(scene, opts = {}) {
    const doIt = () => {
      while (this.stack.length) { const s = this.stack.pop(); if (s.exit) s.exit(); }
      this._push(scene);
    };
    if (opts.fade) return this._fadeThen(doIt);
    doIt();
    return scene;
  }

  remove(scene) {
    const i = this.stack.indexOf(scene);
    if (i < 0) return;
    this.stack.splice(i, 1);
    if (scene.exit) scene.exit();
  }

  // Затемнение → действие (любые операции со стеком) → проявление.
  transition(action) { this._fadeThen(action); }

  _fadeThen(action) {
    // Если уже идёт переход — выполняем сразу, чтобы не потерять действие.
    if (this.fade.dir !== 0) { action(); return; }
    this.fade.dir = 1;
    this.fade.pending = action;
  }

  update(dt) {
    const f = this.fade;
    if (f.dir === 1) {
      f.alpha = Math.min(1, f.alpha + dt * f.speed);
      if (f.alpha >= 1) {
        const a = f.pending;
        f.pending = null;
        f.dir = -1;
        if (a) a();
      }
      return; // во время затемнения логика сцен стоит
    }
    if (f.dir === -1) {
      f.alpha = Math.max(0, f.alpha - dt * f.speed);
      if (f.alpha <= 0) f.dir = 0;
    }
    const t = this.top;
    if (t && t.update) t.update(dt);
  }

  draw(r) {
    let start = this.stack.length - 1;
    while (start > 0 && this.stack[start].opaque === false) start--;
    for (let i = Math.max(0, start); i < this.stack.length; i++) {
      const s = this.stack[i];
      if (s.draw) s.draw(r);
    }
    if (this.fade.alpha > 0) r.alpha(this.fade.alpha, () => r.rect(0, 0, 480, 270, '#000'));
  }

  find(predicate) { return this.stack.find(predicate) || null; }
}
