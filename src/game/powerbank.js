// Пауэрбанк у друга (М-1): шанс 25 %, при успехе заряд до случайных 67–98 %. Чистая функция (для теста).
import { BALANCE } from '../../data/balance.js';
import { eventRng } from './day.js';

export function rollPowerbank(state, id) {
  const P = BALANCE.powerbank;
  const rng = eventRng(state, `power:${id}:${state.day}:${state.lesson}`);
  return rng.chance(P.chance) ? { ok: true, level: rng.int(P.min, P.max) } : { ok: false, level: 0 };
}
