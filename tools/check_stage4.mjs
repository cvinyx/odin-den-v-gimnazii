// Проверка этапа 4 в браузере (dist/index.html): каждая мини-игра — 10 прогонов «средним» ботом
// (autoplay) с разными кодами дня через отладочное меню. Игра идёт ускоренно (кадры по 1/60 с подряд,
// с отрисовкой каждого кадра). Проверяем: нет ошибок, игра всегда заканчивается, итог верный.
// Плюс скриншоты (до / в процессе / после), FPS в реальном времени и память после 10 прогонов.
// Запуск: node tools/check_stage4.mjs [папка скриншотов] [прогонов]
import path from 'node:path';
import fs from 'node:fs';
import { chromium } from './pw.mjs';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const shots = process.argv[2] || path.join(root, 'docs/screenshots/etap-4');
const RUNS = Number(process.argv[3] || 10);
fs.mkdirSync(shots, { recursive: true });

// [подпись в отладке, соперник/вариант, файл скриншота, id игры]
const GAMES = [
  ['Телефон: блок-пазл (урок 2)', null, 'telefon-blok-pazl', 'phone_blocks'],
  ['Телефон: броулер (урок 4)', null, 'telefon-brouler', 'phone_brawl'],
  ['Телефон: броулер с Денисом (кооп)', null, 'telefon-brouler-koop', 'phone_brawl'],
  ['Телефон: лента (урок 6)', null, 'telefon-lenta', 'phone_feed'],
  ['Телефон: короткая (урок 1, 25 с)', null, 'telefon-korotkaya', 'phone_feed'],
  ['Царь туалета', 'guza', 'tualet', 'toilet'],
  ['Кто больше парит', 'shurpo', 'parilka', 'vape'],
  ['Кто больше парит', 'безымянный', 'parilka-bezymyannyi', 'vape'],
  ['Кто больше парит (завуч рядом)', 'chernyak', 'parilka-zavuch', 'vape'],
  ['Кто больше съест', 'denis', 'eda', 'eat'],
  ['Матыч и Буй (друг)', 'igor', 'matych-i-buy', 'bait_mb'],
  ['Душ (друзья)', 'igor,denis', 'dush', 'shower'],
];
const SEEDS = ['KQ7M2P', 'ZT4H9W', 'R8NX3E', 'BXT234', 'MN4P7Q', 'H2K9WX', 'Q7RT3M', 'W9XE4K', 'T3NB8H', 'P6CV2Z', 'J8KM4R', 'X2WQ9N'];

const browser = await chromium.launch({ args: ['--js-flags=--expose-gc'] });
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto('file://' + path.join(root, 'dist/index.html'));
await page.waitForTimeout(400);
const shot = (name) => page.locator('#screen').screenshot({ path: path.join(shots, name + '.png') });

// Один прогон: запустить через отладку, нажать «Начать», включить бота, гнать кадры до экрана итога.
async function run(label, opp, seed, shotName) {
  await page.evaluate(([label, opp, seed]) => {
    const g = window.__odin;
    g.newDay(seed);
    while (g.scenes.stack.length > 1) g.scenes.pop();
    window.__odinDebug(label, opp);
  }, [label, opp, seed]);
  if (shotName) { await page.waitForTimeout(250); await shot(shotName + '-1-do'); }
  const r = await page.evaluate(([withShot]) => {
    const g = window.__odin;
    const top = () => g.scenes.top;
    if (top().id !== 'minigame') return { err: 'нет сцены мини-игры: ' + top().id };
    top().begin();
    const sc = top();
    sc.inst.autoplay = true;
    let frames = 0;
    const limit = withShot ? 60 * 8 : 60 * 200;
    while (sc.phase === 'play' && frames < limit) { g.update(1 / 60); g.draw(); frames++; }
    return { phase: sc.phase, frames };
  }, [!!shotName]);
  if (r.err) return r;
  if (shotName) {
    await shot(shotName + '-2-igra');
    await page.evaluate(() => { const g = window.__odin, sc = g.scenes.top; let f = 0; while (sc.phase === 'play' && f < 60 * 200) { g.update(1 / 60); g.draw(); f++; } });
  }
  // проигрыш на деньги — выбрать «Отдать сейчас» (или первый доступный), дождаться итога
  const out = await page.evaluate(() => {
    const g = window.__odin;
    const sc = g.scenes.stack.find((s) => s.id === 'minigame');
    if (!sc) return { err: 'сцена пропала' };
    if (sc.phase === 'play') return { err: 'не закончилась за 200 с' };
    if (sc.phase === 'loss') sc.loss(g.state.stats.money > 0 ? 'pay' : 'later');
    // реплики после проигрыша — пролистать диалог
    let guard = 0;
    while (g.scenes.top !== sc && guard++ < 2000) {
      const t = g.scenes.top;
      if (t.id === 'dialog' && t.box) t.box.shown = 1e9;
      if (guard % 6 === 0) g.input.queuePressed.add('KeyZ');
      g.update(1 / 60); g.draw();
    }
    return { phase: sc.phase, res: sc.res && { result: sc.res.result, grade: sc.res.grade, summary: sc.res.summary, oppLine: sc.res.oppLine, deltas: sc.res.deltas } };
  });
  if (shotName && !out.err) await shot(shotName + '-3-posle');
  // закрыть экран итога
  await page.evaluate(() => { const g = window.__odin; const sc = g.scenes.stack.find((s) => s.id === 'minigame'); if (sc && sc.phase === 'outro') sc.done(); });
  return { ...out, frames: r.frames };
}

const report = [];
const heap = async () => page.evaluate(() => { if (window.gc) { window.gc(); window.gc(); } return performance.memory ? performance.memory.usedJSHeapSize : 0; });
let heap0 = 0;
for (const [gi, [label, opp, name, id]] of GAMES.entries()) {
  const results = {};
  for (let i = 0; i < RUNS; i++) {
    const r = await run(label, opp, SEEDS[(i + gi) % SEEDS.length], i === 0 ? name : null);
    if (r.err) { errors.push(`${label}: ${r.err}`); continue; }
    if (r.phase !== 'outro' || !['win', 'lose', 'draw', 'director'].includes(r.res.result)) errors.push(`${label}: странный итог ${JSON.stringify(r)}`);
    results[r.res.result] = (results[r.res.result] || 0) + 1;
    if (i === 0) report.push({ game: id, label, opp, first: r.res });
  }
  if (gi === 0) heap0 = await heap();
  console.log(label.padEnd(36), (opp || '').padEnd(12), JSON.stringify(results));
}
const heap1 = await heap();

// FPS в реальном времени: 4 с игры ботом
const fps = {};
for (const [label, opp, , id] of GAMES.filter((g, i, a) => a.findIndex((x) => x[3] === g[3]) === i)) {
  await page.evaluate(([label, opp]) => {
    const g = window.__odin; g.newDay('KQ7M2P');
    while (g.scenes.stack.length > 1) g.scenes.pop();
    window.__odinDebug(label, opp);
    g.scenes.top.begin(); g.scenes.top.inst.autoplay = true;
  }, [label, opp]);
  await page.waitForTimeout(4000);
  fps[id] = await page.evaluate(() => window.__odin.loop.fps);
  await page.evaluate(() => { const g = window.__odin; while (g.scenes.stack.length > 1) g.scenes.pop(); });
}
console.log('FPS:', JSON.stringify(fps));
console.log('Память (JS heap): после первой игры', (heap0 / 1048576).toFixed(1), 'МБ; после всех прогонов', (heap1 / 1048576).toFixed(1), 'МБ');
fs.writeFileSync(path.join(shots, 'otchet.json'), JSON.stringify({ report, fps, heapMB: [heap0 / 1048576, heap1 / 1048576] }, null, 1));
console.log('ошибки:', errors.length ? errors : 'нет');
await browser.close();
if (errors.length) process.exit(1);
