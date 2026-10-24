// Завуч-патруль (раздел 10): конус видимости по направлению движения. Заметила вейп → вызов к директору.
export const PATROL = { half: 45, len: 96, close: 28 };
export const DIRA = { right: 0, down: 90, left: 180, up: 270 };

// Видит ли патрульный n (x, y, dir) точку p (x, y).
export function patrolSees(n, p) {
  const dx = p.x - n.x, dy = p.y - n.y;
  const d = Math.hypot(dx, dy);
  if (d < PATROL.close) return true;
  if (d > PATROL.len) return false;
  const a = Math.atan2(dy, dx) * 180 / Math.PI;
  const diff = Math.abs(((a - DIRA[n.dir]) % 360 + 540) % 360 - 180);
  return diff <= PATROL.half;
}
