// Tween-утилиты: функции сглаживания и простой менеджер анимаций по времени логики.

export const Ease = {
  linear: (t) => t,
  inQuad: (t) => t * t,
  outQuad: (t) => t * (2 - t),
  inOutQuad: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  outCubic: (t) => 1 - Math.pow(1 - t, 3),
  outBack: (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  outBounce: (t) => {
    const n1 = 7.5625, d1 = 2.75;
    if (t < 1 / d1) return n1 * t * t;
    if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
    if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  },
};

export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (v, min, max) => (v < min ? min : v > max ? max : v);

// Tween изменяет числовые поля объекта target от текущих значений к props за duration секунд.
export class Tween {
  constructor(target, props, duration, ease = Ease.linear, onDone = null) {
    this.target = target;
    this.to = props;
    this.from = {};
    for (const k in props) this.from[k] = target[k];
    this.duration = Math.max(0.0001, duration);
    this.ease = ease;
    this.onDone = onDone;
    this.time = 0;
    this.done = false;
  }
  update(dt) {
    if (this.done) return;
    this.time = Math.min(this.duration, this.time + dt);
    const k = this.ease(this.time / this.duration);
    for (const key in this.to) this.target[key] = lerp(this.from[key], this.to[key], k);
    if (this.time >= this.duration) {
      this.done = true;
      if (this.onDone) this.onDone();
    }
  }
}

export class Tweener {
  constructor() { this.list = []; }
  add(target, props, duration, ease, onDone) {
    const t = new Tween(target, props, duration, ease, onDone);
    this.list.push(t);
    return t;
  }
  // Ожидание без изменения свойств.
  wait(duration, onDone) { return this.add({}, {}, duration, Ease.linear, onDone); }
  update(dt) {
    if (!this.list.length) return;
    for (const t of this.list) t.update(dt);
    this.list = this.list.filter((t) => !t.done);
  }
  clear() { this.list.length = 0; }
  get busy() { return this.list.length > 0; }
}
