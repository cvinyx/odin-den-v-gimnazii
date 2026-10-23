// Проверка этапа 3: бот проходит весь день для 3 кодов дня (доходит до каждого кабинета), скриншоты
// ключевых моментов, каждой локации (в игре) и каждой карты целиком. Папка: docs/screenshots/etap-3/.
import path from 'node:path';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { runDay } from './bot_day.mjs';
import { chromium } from './pw.mjs';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const shots = process.argv[2] || path.join(root, 'docs/screenshots/etap-3');
fs.rmSync(shots, { recursive: true, force: true });
fs.mkdirSync(shots, { recursive: true });
const allErrors = [];

// 1. Каждая карта целиком (node)
execFileSync('node', [path.join(root, 'tools/render_maps.mjs'), path.join(shots, 'karty')], { stdio: 'inherit' });

// 2. Каждая локация в игре (перемена 4 — людно), схема по Tab
{
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  page.on('pageerror', (e) => allErrors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') allErrors.push(m.text()); });
  await page.goto('file://' + path.join(root, 'dist/index.html'));
  await page.waitForTimeout(300);
  const ids = await page.evaluate(() => Object.keys(window.__odinData.MAPS).filter((id) => id !== 'test_room'));
  const dir = path.join(shots, 'lokatsii');
  fs.mkdirSync(dir, { recursive: true });
  for (const [b, list] of [[4, ids.filter((x) => !x.startsWith('cab_'))], [3, ['canteen']], [5, ['locker_room']], [6, ['library', 'k1_f4']]]) {
    await page.evaluate((b) => window.__odinDebug('Перемена ' + b), b);
    await page.waitForTimeout(1200);
    for (const id of list) {
      await page.evaluate((id) => window.__odinDebug(id), id);
      await page.waitForTimeout(900);
      await page.locator('#screen').screenshot({ path: path.join(dir, `${id}-peremena${b}.png`) });
    }
  }
  for (const id of ids.filter((x) => x.startsWith('cab_'))) {
    await page.evaluate((id) => window.__odinDebug(id), id);
    await page.waitForTimeout(900);
    await page.locator('#screen').screenshot({ path: path.join(dir, `${id}.png`) });
  }
  await page.evaluate(() => window.__odinDebug('Перемена 2'));
  await page.waitForTimeout(1200);
  await page.keyboard.press('Tab'); await page.waitForTimeout(400);
  await page.locator('#screen').screenshot({ path: path.join(shots, 'shema-shkoly-tab.png') });
  await browser.close();
}

// 3. Бот: весь день для трёх кодов
const results = [];
for (const [i, seed] of ['KQ7M2P', 'ZT4H9W', 'R8NX3E'].entries()) {
  const r = await runDay({ seed, shots: i === 0 ? path.join(shots, 'den') : null });
  results.push(r);
  allErrors.push(...r.errors);
  const s = r.state;
  console.log(JSON.stringify({ seed, sec: Math.round(r.ms / 1000), grades: s.grades, match: s.flags.matchScore, money: s.stats.money, hunger: s.stats.hunger, battery: s.stats.battery, debts: s.debts.length, director: s.directorCalls, walks: r.timings.walks.map((w) => w.sec), errors: r.errors.length }));
}
console.log('ошибки:', allErrors.length ? allErrors : 'нет');
if (allErrors.length) process.exit(1);
