// Персонажи на карте: общий класс Actor (позиция — точка между ступнями), игрок и NPC с маршрутами.
import { sheetOf } from '../gen/people.js';
import { FRAME_W, FRAME_H, WALK_CYCLE, frameRect } from '../gen/sprites.js';
import { TILE } from '../gen/tiles.js';
import { moveActor } from './collisions.js';

export class Actor {
  constructor(id, x, y, dir = 'down') {
    this.id = id;
    this.x = x;
    this.y = y;
    this.dir = dir;
    this.moving = false;
    this.anim = 0;
    this.solid = true;
  }

  get sheet() { return sheetOf(this.id); }

  step(dx, dy, map, others, dt, fps = 8) {
    const moved = moveActor(this, dx, dy, map, others);
    if (Math.abs(dx) > Math.abs(dy)) this.dir = dx > 0 ? 'right' : 'left';
    else if (dy) this.dir = dy > 0 ? 'down' : 'up';
    this.moving = !!(dx || dy);
    if (this.moving) this.anim += dt * fps;
    else this.anim = 0;
    return moved;
  }

  face(target) {
    const dx = target.x - this.x, dy = target.y - this.y;
    if (Math.abs(dx) > Math.abs(dy)) this.dir = dx > 0 ? 'right' : 'left';
    else this.dir = dy > 0 ? 'down' : 'up';
  }

  draw(r) {
    const sheet = this.sheet;
    if (!sheet) return;
    const frame = this.moving ? WALK_CYCLE[Math.floor(this.anim) % WALK_CYCLE.length] : 0;
    const f = frameRect(this.dir, frame);
    // тень
    r.alpha(0.3, () => r.rect(this.x - 6, this.y - 2, 12, 3, '#000'));
    r.sprite(sheet, f.sx, f.sy, f.sw, f.sh, this.x - FRAME_W / 2, this.y - FRAME_H + 1);
  }
}

// NPC: стоит или ходит по короткому маршруту (точки в тайлах), с паузами.
export class Npc extends Actor {
  constructor(def) {
    const sx = (def.x + 0.5) * TILE, sy = (def.y + 1) * TILE - 2;
    super(def.id, sx, sy, def.dir || 'down');
    this.def = def;
    this.talk = def.talk || null;
    this.route = (def.route || []).map(([tx, ty]) => ({ x: (tx + 0.5) * TILE, y: (ty + 1) * TILE - 2 }));
    this.routeIndex = 0;
    this.wait = def.wait || 1.5;
    this.waitT = 0;
    this.speed = def.speed || 28;
    this.busy = false; // разговаривает — стоит
  }

  update(dt, map, others) {
    if (this.busy || !this.route.length) { this.moving = false; this.anim = 0; return; }
    if (this.waitT > 0) { this.waitT -= dt; this.moving = false; return; }
    const target = this.route[this.routeIndex];
    const dx = target.x - this.x, dy = target.y - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 1) {
      this.routeIndex = (this.routeIndex + 1) % this.route.length;
      this.waitT = this.wait;
      this.moving = false;
      if (this.def.restDir) this.dir = this.def.restDir;
      return;
    }
    const s = Math.min(dist, this.speed * dt);
    const moved = this.step((dx / dist) * s, (dy / dist) * s, map, others, dt, 6);
    if (!moved.x && !moved.y) { this.moving = false; this.anim = 0; } // упёрся в игрока — ждёт
  }
}
