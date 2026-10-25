// Схема школы по Tab (в стиле school_map.png, выпрямленная: вход снизу). «Вы здесь» и следующий кабинет.
// Нумерация версии 2 (Л-1): корпус 1 — бывшая рекреация, 2 — левый, 3 — правый.
// ←→ — переключиться на статусы.
import { MAPS } from '../world/maps/index.js';
import { nextLesson, hintText } from '../game/day.js';
import { roomLabel } from '../../data/schedule.js';

// Зоны схемы: цвет, многоугольник (в пикселях экрана), подпись.
export const ZONES = {
  canteen: { name: 'Столовая', color: '#f0a050', poly: [[70, 70], [140, 62], [150, 128], [118, 136], [78, 128]] },
  gym: { name: 'Спортзал', color: '#f0d050', poly: [[150, 30], [282, 30], [282, 92], [150, 92]] },
  passage: { name: '', color: '#c8a8a8', poly: [[282, 40], [300, 40], [300, 92], [282, 92]] },
  yard: { name: 'Двор', color: '#9ad08a', poly: [[270, 14], [312, 14], [312, 40], [270, 40]] },
  pool: { name: 'Бассейн (0 эт.)', color: '#80c070', poly: [[300, 46], [400, 46], [404, 116], [330, 126], [300, 110]] },
  rec: { name: 'Корпус 1 (рекреация)', color: '#a8a8a8', poly: [[140, 92], [330, 92], [338, 128], [318, 168], [272, 180], [258, 204], [222, 204], [208, 180], [162, 168], [140, 128]] },
  c2: { name: 'Корпус 2', color: '#e06a6a', cross: [118, 205] },
  c3: { name: 'Корпус 3', color: '#6a98e0', cross: [362, 205] },
  street: { name: 'Вход', color: null, at: [240, 236] },
};

// Карта игры → зона схемы.
export function zoneOf(mapId) {
  const m = MAPS[mapId];
  if (!m) return null;
  if (mapId === 'street' || mapId === 'bus_stop') return 'street';
  if (mapId === 'c1_yard') return 'yard';
  if (mapId === 'c1_back' || mapId.startsWith('c1_trudy') || mapId === 'c1_gymroom') return 'passage';
  if (mapId.startsWith('c1_') || mapId === 'library') return 'rec';
  if (mapId === 'canteen' || mapId === 'buffet') return 'canteen';
  if (mapId === 'gym' || mapId === 'locker_room') return 'gym';
  if (mapId === 'pool' || mapId === 'showers') return 'pool';
  if (m.building === 2) return 'c2';
  if (m.building === 3) return 'c3';
  return null;
}

function floorText(mapId) {
  const m = MAPS[mapId];
  if (!m) return '';
  if (mapId === 'c1_f2' || mapId === 'library' || mapId === 'c1_hall') return '2 эт.';
  if (mapId === 'pool' || mapId === 'showers') return '0 эт.';
  if (m.floorNo) return m.floorNo + ' эт.';
  return '1 эт.';
}

function poly(ctx, pts, fill) {
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#1a1a22';
  ctx.stroke();
}

function crossPts([cx, cy]) {
  // крест: центральный коридор и крылья (как у корпусов на схеме)
  const a = 14, b = 44;
  return [[cx - a, cy - b], [cx + a, cy - b], [cx + a, cy - a], [cx + b, cy - a], [cx + b, cy + a], [cx + a, cy + a], [cx + a, cy + b - 18],
    [cx - a, cy + b - 18], [cx - a, cy + a], [cx - b, cy + a], [cx - b, cy - a], [cx - a, cy - a]];
}

export function zoneCenter(z) {
  const Z = ZONES[z];
  if (Z.cross) return Z.cross;
  if (Z.at) return Z.at;
  const xs = Z.poly.map((p) => p[0]), ys = Z.poly.map((p) => p[1]);
  return [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2];
}

export class SchoolMapScene {
  constructor() { this.id = 'school_map'; this.opaque = false; this.t = 0; }
  enter(game) { this.game = game; }
  update(dt) {
    this.t += dt;
    const input = this.game.input;
    if (input.pressed('tab') || input.pressed('back') || input.pressed('confirm')) {
      input.consume('back'); input.consume('confirm');
      this.game.scenes.pop();
      return;
    }
    if (input.pressed('right') || input.pressed('left')) {
      import('./status_panel.js').then(({ StatusPanel }) => this.game.scenes.replace(new StatusPanel()));
    }
  }
  draw(r) {
    const st = this.game.state;
    r.alpha(0.85, () => r.rect(0, 0, 480, 270, '#000'));
    r.box(8, 8, 464, 254, '#ffffff', '#f4f2ea');
    r.text('Схема гимназии', 18, 14, { color: '#2a2430', scale: 2 });
    r.text('←→ статусы · Tab — закрыть', 462, 16, { align: 'right', color: '#6a6a7a' });
    const ctx = r.ctx;
    for (const [key, z] of Object.entries(ZONES)) {
      if (z.poly) poly(ctx, z.poly, z.color);
      if (z.cross) poly(ctx, crossPts(z.cross), z.color);
    }
    for (const [key, z] of Object.entries(ZONES)) {
      if (!z.name || key === 'street') continue;
      const [cx, cy] = zoneCenter(key);
      r.text(z.name, cx, cy - 4, { align: 'center', color: '#1a1a22' });
    }
    // подписи этажей и вход
    r.text('4 этажа', 118, 211, { align: 'center', color: '#3a1a1a' });
    r.text('4 этажа', 362, 211, { align: 'center', color: '#1a2a4a' });
    r.text('2 эт. — библиотека, актовый зал', 240, 166, { align: 'center', color: '#3a3a3a' });
    r.text('▲', 240, 208, { align: 'center', color: '#1a1a22', scale: 2 });
    r.text('Вход', 240, 224, { align: 'center', color: '#1a1a22' });
    // следующий кабинет
    const next = nextLesson(st);
    if (next && st.phase !== 'end') {
      const nz = next.room === 'бассейн' ? 'pool' : next.building === 0 ? 'gym' : 'c' + next.building;
      const [nx, ny] = zoneCenter(nz);
      r.text('★', nx + 22, ny + 6, { color: '#c08000', scale: 2 });
      r.text(st.phase === 'lesson' ? `Сейчас: ${next.subject}, ${roomLabel(next)}` : (hintText(st) || ''), 18, 248, { color: '#806000' });
    }
    // вы здесь
    const z = zoneOf(st.location);
    if (z) {
      const [x, y] = zoneCenter(z);
      if (r.blink(0.35)) { r.rect(x - 4, y + 6, 8, 8, '#e02020'); r.frame(x - 5, y + 5, 10, 10, '#ffffff'); }
      r.text(`Вы здесь: ${st.locationName} (${floorText(st.location)})`, 18, 236, { color: '#c02020' });
    }
  }
}
