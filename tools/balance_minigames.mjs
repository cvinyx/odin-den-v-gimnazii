// Баланс мини-игр этапа 4: «средний» бот играет каждую игру N раз (разные сиды) против каждого соперника.
// Цель — победа в 45–65 % (STAGES.md, этап 4). Запуск: node tools/balance_minigames.mjs [N] [id]
import { GAMES, runGame } from './balance_minigames_lib.mjs';

const N = Number(process.argv[2] || 100);
const only = process.argv[3];
for (const [id, g] of Object.entries(GAMES)) {
  if (only && id !== only) continue;
  for (const opp of g.opps || [null]) {
    const cnt = {}; let sec = 0;
    for (let i = 0; i < N; i++) {
      const r = runGame(id, i + 1, { opp });
      cnt[r.result] = (cnt[r.result] || 0) + 1; sec += r.sec;
    }
    const win = Math.round(100 * (cnt.win || 0) / N);
    const mark = win >= 45 && win <= 65 ? 'ок' : 'ВНЕ ЦЕЛИ';
    console.log(`${id}${opp ? ' vs ' + opp : ''}`.padEnd(26), `победы ${win}%`.padEnd(12), mark.padEnd(9), `время ~${Math.round(sec / N)} с`, JSON.stringify(cnt));
  }
}
