// Проверка этапа 2: бот проходит срез для нескольких кодов дня, повтор с тем же кодом даёт тот же день,
// жадное списывание приводит к риску директора. Скриншоты первого прогона — в docs/screenshots/etap-2/.
// Запуск: node tools/check_stage2.mjs [папка_скриншотов]
import path from 'node:path';
import fs from 'node:fs';
import { runSlice } from './bot.mjs';
import { chromium } from './pw.mjs';
import { Bot } from './bot_lib.mjs';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const shots = process.argv[2] || path.join(root, 'docs/screenshots/etap-2');
fs.rmSync(shots, { recursive: true, force: true });

const strip = (st) => { const s = JSON.parse(JSON.stringify(st)); delete s.playTime; delete s.pos; return s; };
const runs = [];
const summary = (r) => ({ seed: r.seed, sec: Math.round(r.ms / 1000), grades: r.state.grades, money: r.state.stats.money, aura: r.state.stats.aura, stress: r.state.stats.stress, debts: r.state.debts, wins: r.state.wins, director: r.state.directorCalls, errors: r.errors.length });

const a1 = await runSlice({ seed: 'KQ7M2P', shots });
runs.push(a1); console.log('прогон 1', JSON.stringify(summary(a1)));
const a2 = await runSlice({ seed: 'KQ7M2P' });
runs.push(a2); console.log('прогон 2 (тот же код)', JSON.stringify(summary(a2)));
const same = JSON.stringify(strip(a1.state)) === JSON.stringify(strip(a2.state)) && JSON.stringify(a1.log) === JSON.stringify(a2.log);
console.log('одинаковый код → одинаковый день:', same);
const b = await runSlice({ seed: 'ZT4H9W' });
runs.push(b); console.log('прогон 3', JSON.stringify(summary(b)));
const c = await runSlice({ seed: 'R8NX3E', cheatStyle: 'greedy', shots: path.join(shots, 'zhadnyi') });
runs.push(c); console.log('прогон 4 (жадно)', JSON.stringify(summary(c)));
// Отдельные сценки через отладочное меню: сообщение отца, ярость Игоря, директор, туалет, вейп.
const extraErrors = [];
{
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  page.on('pageerror', (e) => extraErrors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') extraErrors.push(m.text()); });
  await page.goto('file://' + path.join(root, 'dist/index.html'));
  await page.waitForTimeout(300);
  const bot = new Bot(page);
  const shot = (name) => page.locator('#screen').screenshot({ path: path.join(shots, name + '.png') });
  const dbg = async (label, ms = 1200) => { await page.evaluate((l) => window.__odinDebug(l), label); await page.waitForTimeout(ms); };
  await dbg('Перемена 1');
  await dbg('Сообщение отца', 600);
  await shot('extra-1-soobshchenie-otca');
  await bot.press('z');
  await dbg('Ярость Игоря (сценка)', 300);
  await bot.press('z'); await page.waitForTimeout(1500);
  await shot('extra-2-yarost-igorya');
  await bot.handle((t) => t === 'world');
  await dbg('Вызов к директору', 1500);
  await shot('extra-3-direktor');
  await bot.handle((t) => t === 'world');
  await dbg('c3_f4_wc');
  await bot.walkTo(12, 3);
  await bot.face('up'); await bot.press('z');
  await bot.handle((t, s) => t === 'dialog' && s.mode === 'choice');
  await shot('extra-4-tualet-kabinka');
  await bot.press('z');
  await bot.handle((t) => t === 'world');
  await page.waitForTimeout(400);
  await shot('extra-5-posle-zatyazhki');
  await browser.close();
}
console.log('сценки: ошибки', extraErrors.length ? extraErrors : 'нет');
const errors = runs.flatMap((r) => r.errors).concat(extraErrors);
console.log('ошибки в консоли:', errors.length ? errors : 'нет');
if (errors.length || !same) process.exit(1);
