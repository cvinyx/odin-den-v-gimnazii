// Прогон «Эль-Класико» без браузера: «ИИ против ИИ» (Ромой тоже управляет ИИ). Возвращает итог и проверки:
// мяч всегда в поле, игроки не накладываются, никто не стоит в углу, состав 5 на 5.
import { MatchLogic } from '../src/football/match.js';
import { FIELD } from '../src/football/field.js';
import { Rng } from '../src/engine/rng.js';

export function runMatch(seed, opts = {}) {
  const rng = new Rng('match#' + seed);
  const M = new MatchLogic(rng, { aiRoma: true, ...opts });
  const dt = 1 / 60;
  const issues = [];
  const corner = new Map();
  let frames = 0, minGap = 99;
  for (;;) {
    M.update(dt, null);
    frames++;
    for (const e of M.events) if (e.type === 'halftime') M.secondHalf(rng.pick(['barca', 'real', 'igor', 'none']));
    M.events.length = 0;
    if (M.state === 'end') break;
    if (frames > 60 * 400) { issues.push('матч не закончился'); break; }
    const b = M.ball;
    if (b.x < FIELD.left - FIELD.goalDepth - 1 || b.x > FIELD.right + FIELD.goalDepth + 1 || b.y < FIELD.top - 1 || b.y > FIELD.bottom + 1) issues.push(`мяч вне поля ${b.x.toFixed(0)},${b.y.toFixed(0)}`);
    if (M.state === 'play') {
      const on = M.onField;
      for (let i = 0; i < on.length; i++) for (let j = i + 1; j < on.length; j++) minGap = Math.min(minGap, Math.hypot(on[i].x - on[j].x, on[i].y - on[j].y));
      for (const q of on) {
        if (q.keeper) continue;
        const inCorner = (q.x < FIELD.left + 14 || q.x > FIELD.right - 14) && (q.y < FIELD.top + 14 || q.y > FIELD.bottom - 14);
        const t = inCorner ? (corner.get(q) || 0) + dt : 0;
        corner.set(q, t);
        if (t > 4) { issues.push(`${q.id} застрял в углу`); corner.set(q, -1e9); }
      }
    }
  }
  return { score: { ...M.score }, result: M.result(), stats: M.stats, diarrhea: M.diarrheaDone, minGap, issues: [...new Set(issues)].slice(0, 5), lineupErrors: M.lineupErrors, sec: frames / 60,
    goals: Object.fromEntries(M.players.filter((q) => q.goals).map((q) => [q.id, q.goals])) };
}
