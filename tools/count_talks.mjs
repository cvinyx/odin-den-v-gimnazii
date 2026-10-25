// Таблица «персонаж → сколько разговоров / фраз рейджбайта» (отчёт для PROGRESS.md). Запуск: node tools/count_talks.mjs
import fs from 'node:fs';
import path from 'node:path';
const D = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../data/dialogs');
const cnt = (f) => { const p = path.join(D, f + '.txt'); if (!fs.existsSync(p)) return null; const labs = {}; let c; for (const l of fs.readFileSync(p, 'utf8').split('\n')) { const m = l.match(/^=== (\w+)/); if (m) { c = m[1]; labs[c] = 0; } else if (l.startsWith('@') && c) labs[c]++; } return labs; };
const ids = ['igor', 'denis', 'matych', 'buy', 'guza', 'chernyak', 'shurpo', 'smile', 'vadim', 'anosov', 'vitalik', 'zakha', 'levonchuk', 'bochko', 'vanya', 'svyat'];
console.log('| персонаж | разговоров | личных фраз байта | ответных |');
console.log('|---|---|---|---|');
for (const id of ids) {
  const t = cnt('talk_' + id), b = cnt('bait_' + id);
  const n = t ? Object.keys(t).filter((l) => /^t\d+$/.test(l)).length : 0;
  const mine = b ? ['roma_weak', 'roma_mid', 'roma_strong', 'roma_weird'].reduce((a, l) => a + (b[l] || 0), 0) : '—';
  const his = b ? ['opp_retort', 'opp_hit', 'opp_shrug'].reduce((a, l) => a + (b[l] || 0), 0) : '—';
  console.log(`| ${id} | ${n} | ${mine} | ${his} |`);
}
