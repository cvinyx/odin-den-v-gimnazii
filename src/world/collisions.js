// Коллизии: прямоугольник «ног» персонажа против твёрдых тайлов и других персонажей.
import { TILE } from '../gen/tiles.js';

export const FEET_W = 10;
export const FEET_H = 6;

export function feetBox(a, x = a.x, y = a.y) {
  return { x: x - FEET_W / 2, y: y - FEET_H, w: FEET_W, h: FEET_H };
}

export function boxesOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function boxHitsMap(map, box) {
  const x0 = Math.floor(box.x / TILE), x1 = Math.floor((box.x + box.w - 0.001) / TILE);
  const y0 = Math.floor(box.y / TILE), y1 = Math.floor((box.y + box.h - 0.001) / TILE);
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (map.solidAt(tx, ty)) return true;
  return false;
}

function blocked(actor, x, y, map, others) {
  const box = feetBox(actor, x, y);
  if (boxHitsMap(map, box)) return true;
  for (const o of others) if (o !== actor && o.solid !== false && boxesOverlap(box, feetBox(o))) return true;
  return false;
}

// Движение по осям раздельно, чтобы скользить вдоль стен. Возвращает фактический сдвиг.
export function moveActor(actor, dx, dy, map, others = []) {
  let mx = 0, my = 0;
  if (dx) {
    if (!blocked(actor, actor.x + dx, actor.y, map, others)) { actor.x += dx; mx = dx; }
    else {
      // мелкими шагами до упора
      const s = Math.sign(dx);
      for (let i = 0; i < Math.abs(dx); i += 0.5) {
        if (blocked(actor, actor.x + s * 0.5, actor.y, map, others)) break;
        actor.x += s * 0.5; mx += s * 0.5;
      }
    }
  }
  if (dy) {
    if (!blocked(actor, actor.x, actor.y + dy, map, others)) { actor.y += dy; my = dy; }
    else {
      const s = Math.sign(dy);
      for (let i = 0; i < Math.abs(dy); i += 0.5) {
        if (blocked(actor, actor.x, actor.y + s * 0.5, map, others)) break;
        actor.y += s * 0.5; my += s * 0.5;
      }
    }
  }
  return { x: mx, y: my };
}
