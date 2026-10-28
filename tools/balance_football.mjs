// Баланс «Эль-Класико» (V2-7): N матчей «ИИ против ИИ» (по умолчанию 50) и отдельно матчи с яростью Игоря.
// Цели: Ф-6 — победы каждой команды в основное время 35–50 %, остальное — ничьи (золотой гол);
// стандартов (штрафные + пенальти) за тайм в среднем ≤ 3; ярость — только если Игоря разозлили;
// автогол суперударом ~15 %; диарея Смайла ~50 %.
import { runMatch } from './balance_football_lib.mjs';

const N = Number(process.argv[2] || 50);
const reg = { win: 0, draw: 0, lose: 0 }, fin = { win: 0, draw: 0, lose: 0 };
let goals = 0, nil = 0, fouls = 0, sp = 0, pens = 0, frees = 0, spGoals = 0, hands = 0, diarrhea = 0, saves = 0, shots = 0, golden = 0, rages = 0, sec = 0;
const scorers = {}, mvp = {};
const issues = [];
for (let i = 1; i <= N; i++) {
  const r = runMatch(i);
  reg[r.regResult]++; fin[r.result]++;
  const g = r.score.inyaz + r.score.fizmat;
  goals += g; if (!g) nil++;
  const S = r.stats;
  fouls += S.fouls; sp += S.setPieces[1] + S.setPieces[2]; pens += S.penalties; frees += S.freeKicks; spGoals += S.spGoals; hands += S.hands;
  saves += S.saves; shots += S.shots.inyaz + S.shots.fizmat; rages += S.rages; sec += r.sec;
  if (r.golden) golden++;
  if (r.diarrhea) diarrhea++;
  for (const [k, v] of Object.entries(r.goals)) scorers[k] = (scorers[k] || 0) + v;
  mvp[r.summary.mvp] = (mvp[r.summary.mvp] || 0) + 1;
  issues.push(...r.issues.map((x) => `#${i}: ${x}`), ...r.lineupErrors);
  if (process.argv.includes('-v')) console.log(i, `${r.score.inyaz}:${r.score.fizmat}`, r.golden ? 'зол.гол' : '', `xG ${r.summary.xg.inyaz}–${r.summary.xg.fizmat}`, 'MVP', r.summary.mvp, r.diarrhea ? 'диарея' : '');
}
// ярость: только при rageStart; доля автоголов суперударом
let sup = 0, own = 0, rageMatches = 0;
const RN = Number(process.argv[3] || 150);
for (let i = 1; i <= RN; i++) { const r = runMatch(1000 + i, { rageStart: true }); sup += r.stats.superShots; own += r.stats.ownGoals; if (r.stats.rages) rageMatches++; }
// диарея: доля бросков «сегодня будет» по 400 кодам матча (сама сцена — только если дошло до её секунды)
const { MatchLogic } = await import('../src/football/match.js');
const { Rng } = await import('../src/engine/rng.js');
let roll = 0;
for (let i = 1; i <= 400; i++) if (new MatchLogic(new Rng('match#' + i), { aiRoma: true }).diarrheaAt != null) roll++;
const pct = (x, n = N) => Math.round(100 * x / n) + '%';
console.log(`Матчей: ${N}. Основное время: «ИнЯз» ${pct(reg.win)}, «Физмат» ${pct(reg.lose)}, ничьи ${pct(reg.draw)} (золотой гол ${pct(golden)}). Итог с золотым голом: ${pct(fin.win)} / ${pct(fin.lose)} / ничьи ${pct(fin.draw)}`);
console.log(`Голов в среднем: ${(goals / N).toFixed(2)}, 0:0 ${pct(nil)}, ударов ${(shots / N).toFixed(1)}, сейвов ${(saves / N).toFixed(1)}, длина матча ${(sec / N).toFixed(0)} с`);
console.log(`Фолов ${(fouls / N).toFixed(1)}, стандартов за тайм ${(sp / N / 2).toFixed(2)} (пенальти ${pens}, штрафных ${frees}, голов со стандартов ${spGoals}), «рука» ${hands}`);
console.log(`Диарея Смайла: ${pct(diarrhea)} (бросок по 400 матчам: ${pct(roll, 400)}). Ярость без условия: ${rages} раз. С условием: в ${pct(rageMatches, RN)} матчей, суперударов ${sup}, автоголов ${own} (${pct(own, sup)})`);
console.log('Бомбардиры:', JSON.stringify(Object.entries(scorers).sort((a, b) => b[1] - a[1])));
console.log('MVP:', JSON.stringify(Object.entries(mvp).sort((a, b) => b[1] - a[1])));
console.log('Проблемы:', issues.length ? issues.slice(0, 20) : 'нет');
