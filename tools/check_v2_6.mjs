// Проверка этапа V2-6: в браузере — разговоры на перемене (бот говорит с несколькими именными, считаем разные
// метки), скриншоты docs/screenshots/v2-6/. Таблица «персонаж → разговоры / фразы» — node tools/count_talks.mjs.
import path from 'node:path';
import fs from 'node:fs';
import { chromium } from './pw.mjs';
import { Bot } from './bot_lib.mjs';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const shots = process.argv[2] || path.join(root, 'docs/screenshots/v2-6');
fs.mkdirSync(shots, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto('file://' + path.join(root, 'dist/index.html'));
await page.waitForTimeout(400);
await page.keyboard.press('Space'); await page.waitForTimeout(500);
const bot = new Bot(page, { policy: () => 0 });
const shot = (n) => page.locator('#screen').screenshot({ path: path.join(shots, n + '.png') });
const seen = [];
let k = 1;
for (const b of [1, 2, 4]) {
  await page.evaluate((b) => window.__odinDebug('Перемена ' + b), b);
  await page.waitForTimeout(2200);
  const ids = await page.evaluate(() => window.__odin.scenes.top.npcs.filter((n) => n.def.named && n.def.talk && n.def.talk.file !== 'staff').map((n) => n.id));
  for (const id of ids.slice(0, 3)) {
    try {
      await bot.talkTo(id);
      await page.waitForTimeout(500);
      const lab = await page.evaluate(() => { const d = window.__odin.scenes.top; return d.id === 'dialog' ? d.file + ':' + d.label : null; });
      if (lab) { seen.push(lab); if (k <= 4) await shot(`0${k++}-razgovor-${id}`); }
      await bot.handle((t) => t === 'world', 60000);
    } catch (e) { errors.push(`${id}: ${e.message}`); }
  }
}
// байт с обновлёнными фразами: Денис
await page.evaluate(() => window.__odinDebug('Байт-дуэль: denis'));
await page.waitForTimeout(1500);
await page.keyboard.press('z'); await page.waitForTimeout(1200);
await shot('05-rejdbayt-denis');
await browser.close();
console.log(JSON.stringify({ unique: new Set(seen).size, seen, errors }));
if (errors.length) process.exit(1);
