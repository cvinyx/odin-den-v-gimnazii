// Взаимодействия: с кем можно поговорить (персонаж перед Ромой в направлении взгляда).
const REACH = 14;

export function pointInFront(actor, dist = REACH) {
  const d = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[actor.dir] || [0, 1];
  return { x: actor.x + d[0] * dist, y: actor.y - 3 + d[1] * dist };
}

export function findTalkTarget(player, npcs) {
  const p = pointInFront(player);
  let best = null, bestD = 1e9;
  for (const n of npcs) {
    if (!n.talk) continue;
    const dx = n.x - p.x, dy = (n.y - 3) - p.y;
    const d = Math.hypot(dx, dy);
    if (d < 12 && d < bestD) { best = n; bestD = d; }
  }
  return best;
}
