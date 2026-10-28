// Баланс недели (этап 6, неделя — V2-2): N недель × 3 стиля в быстром симуляторе (tools/sim_day_lib.mjs).
// Печатает доли концовок, средние оценки, деньги, батарею, время живого игрока.
// Запуск: node tools/sim_days.mjs [N=50]
import { simDay } from './sim_day_lib.mjs';
import { SEED_ALPHABET } from '../src/engine/rng.js';
import { ENDINGS, ENDING_TITLES } from '../src/game/endings.js';

const N = Number(process.argv[2] || 50);
const seedOf = (i) => Array.from({ length: 6 }, (_, k) => SEED_ALPHABET[(i * 7 + k * 13 + i * k * 3) % SEED_ALPHABET.length]).join('');
const out = {};
for (const style of ['cautious', 'average', 'chaotic']) {
  const end = Object.fromEntries(ENDINGS.map((e) => [e, 0]));
  let avg = 0, money = 0, battery = 0, mins = 0, deadPhone = 0, broke = 0, wins = 0, aura = 0, calls = 0, bd = 0, matchWin = 0;
  for (let i = 0; i < N; i++) {
    const r = simDay(seedOf(i + 1), style);
    end[r.ending]++;
    avg += r.avg; money += r.st.stats.money; battery += r.st.stats.battery; mins += r.minutes; aura += r.st.stats.aura;
    wins += r.st.wins; calls += r.st.directorCalls; bd += r.st.breakdowns;
    if (r.st.stats.battery <= 0) deadPhone++;
    if (r.st.stats.money < 100) broke++;
    if (r.st.flags.matchResult === 1) matchWin++;
  }
  const pct = (x) => Math.round(100 * x / N) + '%';
  out[style] = end;
  console.log(`\n== ${style} (${N} недель) ==`);
  console.log('Концовки:', ENDINGS.map((e) => `${ENDING_TITLES[e]} ${pct(end[e])}`).join(', '));
  console.log(`Средняя оценка ${(avg / N).toFixed(2)}, аура ${(aura / N).toFixed(0)}, побед ${(wins / N).toFixed(1)}, вызовов ${(calls / N).toFixed(2)}, срывов ${(bd / N).toFixed(2)}, матч выигран ${pct(matchWin)}`);
  console.log(`Деньги в конце ${(money / N / 100).toFixed(2)} BYN (меньше 1 BYN — ${pct(broke)}), батарея ${(battery / N).toFixed(0)} % (0 % — ${pct(deadPhone)})`);
  console.log(`Время живого игрока ≈ ${(mins / N).toFixed(0)} мин`);
}
