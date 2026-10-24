// Баланс «Эль-Класико»: N матчей «ИИ против ИИ» с разными сидами (по умолчанию 30).
// Цели (STAGES.md, этап 5): 2–6 голов в среднем, ни одна команда не выигрывает > 70 %, 0:0 не больше 15 %.
import { runMatch } from './balance_football_lib.mjs';

const N = Number(process.argv[2] || 30);
const res = { win: 0, draw: 0, lose: 0 };
let goals = 0, nil = 0, fouls = 0, yellows = 0, diarrhea = 0, saves = 0, shots = 0;
const scorers = {};
const issues = [];
for (let i = 1; i <= N; i++) {
  const r = runMatch(i);
  res[r.result]++;
  const g = r.score.inyaz + r.score.fizmat;
  goals += g; if (!g) nil++;
  fouls += r.stats.fouls; yellows += r.stats.yellows; saves += r.stats.saves; shots += r.stats.shots.inyaz + r.stats.shots.fizmat;
  if (r.diarrhea) diarrhea++;
  for (const [k, v] of Object.entries(r.goals)) scorers[k] = (scorers[k] || 0) + v;
  issues.push(...r.issues.map((x) => `#${i}: ${x}`), ...r.lineupErrors);
  if (process.argv.includes('-v')) console.log(i, `${r.score.inyaz}:${r.score.fizmat}`, JSON.stringify(r.stats), r.diarrhea ? 'диарея' : '', 'minGap', r.minGap.toFixed(1));
}
const pct = (x) => Math.round(100 * x / N) + '%';
console.log(`Матчей: ${N}. «ИнЯз» (команда Ромы): победы ${pct(res.win)}, ничьи ${pct(res.draw)}, поражения ${pct(res.lose)}`);
console.log(`Голов в среднем: ${(goals / N).toFixed(2)}, матчей 0:0: ${pct(nil)}, ударов: ${(shots / N).toFixed(1)}, сейвов: ${(saves / N).toFixed(1)}`);
console.log(`Фолов в среднем: ${(fouls / N).toFixed(1)}, жёлтых: ${(yellows / N).toFixed(1)}, диарея Смайла: ${pct(diarrhea)}`);
console.log('Бомбардиры:', JSON.stringify(Object.entries(scorers).sort((a, b) => b[1] - a[1])));
console.log('Проблемы:', issues.length ? issues.slice(0, 20) : 'нет');
