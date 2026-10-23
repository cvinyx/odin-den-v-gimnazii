// Проверка баланса «Списывания»: бот играет N раз осторожно и жадно, печатает распределение оценок.
// Запуск: node tools/balance_cheat.mjs [N]
import { runCheat, SETUPS } from './balance_cheat_lib.mjs';
import { BALANCE } from '../data/balance.js';

const N = Number(process.argv[2] || 20);
console.log('Параметры:', JSON.stringify(BALANCE.cheat));
for (const [name, setup] of Object.entries(SETUPS)) {
  for (const kind of ['cautious', 'greedy']) {
    const res = Array.from({ length: N }, (_, i) => runCheat(i + 1, kind, setup));
    const dist = {};
    for (const r of res) dist[r.grade] = (dist[r.grade] || 0) + 1;
    const avg = res.reduce((a, b) => a + b.grade, 0) / N;
    const dir = res.filter((r) => r.director).length;
    console.log(`${name} / ${kind === 'cautious' ? 'осторожно' : 'жадно'}`.padEnd(46), 'средняя', avg.toFixed(2), ' директор', `${dir}/${N}`, ' оценки', JSON.stringify(dist));
  }
}
