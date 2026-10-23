// Игровой цикл с фиксированным шагом логики 1/60 с и отрисовкой раз в кадр.
export const STEP = 1 / 60;

export class Loop {
  constructor(update, draw) {
    this.update = update;
    this.draw = draw;
    this.acc = 0;
    this.last = 0;
    this.running = false;
    this.fps = 60;
    this._frames = 0;
    this._fpsTime = 0;
    this._raf = (t) => this.frame(t);
  }
  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    requestAnimationFrame(this._raf);
  }
  stop() { this.running = false; }
  frame(now) {
    if (!this.running) return;
    let delta = (now - this.last) / 1000;
    this.last = now;
    if (delta > 0.25) delta = 0.25; // вкладка была неактивна — не догоняем рывком
    this.acc += delta;
    let steps = 0;
    while (this.acc >= STEP && steps < 8) {
      this.update(STEP);
      this.acc -= STEP;
      steps++;
    }
    if (steps >= 8) this.acc = 0;
    this.draw();
    this._frames++;
    this._fpsTime += delta;
    if (this._fpsTime >= 0.5) {
      this.fps = Math.round(this._frames / this._fpsTime);
      this._frames = 0;
      this._fpsTime = 0;
    }
    requestAnimationFrame(this._raf);
  }
}
