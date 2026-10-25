// Проверка этапа V2-3 в браузере: бот проходит по новой карте (улица → турникеты → корпус 3, 4 эт. → туалет →
// 2-й этаж корпуса 1 → актовый зал → корпус 2 → столовая → буфет → задний двор) и делает 6 скриншотов
// в docs/screenshots/v2-3/. Карты целиком — node tools/render_maps.mjs docs/screenshots/v2-3/karty.
import path from 'node:path';
import fs from 'node:fs';
import { chromium } from './pw.mjs';
import { Bot } from './bot_lib.mjs';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const shots = process.argv[2] || path.join(root, 'docs/screenshots/v2-3');
fs.mkdirSync(shots, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto('file://' + path.join(root, 'dist/index.html'));
await page.waitForTimeout(400);
let bot;
bot = new Bot(page, { policy: (q, opts) => (/этаж/.test(q) ? Math.max(0, opts.findIndex((o) => o.startsWith(bot.floorWanted + ' '))) : 0) });
const shot = (n) => page.locator('#screen').screenshot({ path: path.join(shots, n + '.png') });

await page.keyboard.press('Space'); await page.waitForTimeout(600);
await page.evaluate(() => window.__odinDebug('Начать с дня', 3));
await bot.handle((t, s) => t === 'world' && s.map === 'street');
// перемена 1: в коридорах народ
await page.evaluate(() => { const s = window.__odin.state; s.phase = 'break'; s.lesson = 1; });
const t0 = Date.now();
const route = [];
const go = async (id) => { await bot.goToMap(id); route.push(id); await page.waitForTimeout(500); };
await go('c1_f1');
await bot.walkTo(19, 21);
await shot('01-turnikety-face-id');
await go('c3_f4');
await bot.walkTo(34, 10);
await shot('02-korpus3-4etazh-razvilka');
await go('c3_f4_wc');
await shot('03-tualet');
await go('c1_f2');
await go('c1_hall');
await bot.walkTo(12, 6);
await shot('04-aktovyy-zal');
await go('c2_f2');
await go('c2_f4');
await go('canteen');
await shot('05-stolovaya');
await go('buffet');
await go('c1_back');
await go('c1_yard');
await page.keyboard.press('Tab'); await page.waitForTimeout(400);
await shot('06-shema-po-tab');
await page.keyboard.press('Tab');
const sec = Math.round((Date.now() - t0) / 1000);
await browser.close();
console.log(JSON.stringify({ route, sec, errors }));
if (errors.length) process.exit(1);
