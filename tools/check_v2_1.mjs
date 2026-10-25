// Проверка этапа V2-1 в браузере: лист персонажей (все именные — спрайт и портреты во всех эмоциях,
// учителя, 20 безымянных, дети), галерея, новые персонажи в диалоге. Скриншоты — docs/screenshots/v2-1/.
import path from 'node:path';
import fs from 'node:fs';
import { chromium } from './pw.mjs';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const shots = process.argv[2] || path.join(root, 'docs/screenshots/v2-1');
fs.mkdirSync(shots, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto('file://' + path.join(root, 'dist/index.html'));
await page.waitForTimeout(400);
const shot = (n) => page.locator('#screen').screenshot({ path: path.join(shots, n + '.png') });

await page.evaluate(() => window.__odinDebug('Лист персонажей'));
await page.waitForTimeout(800);
const pages = await page.evaluate(() => window.__odin.scenes.top.pages.map((p) => p.title));
const names = ['ucheniki-1', 'ucheniki-2', 'uchitelya-1', 'uchitelya-2', 'bezymyannye-20', 'deti'];
for (let i = 0; i < pages.length; i++) {
  await page.evaluate((i) => { window.__odin.scenes.top.page = i; }, i);
  await page.waitForTimeout(150);
  await shot(`0${i + 1}-${names[i] || 'list-' + i}`);
}
// галерея: Рома крупно
await page.evaluate(() => window.__odinDebug('Галерея'));
await page.waitForTimeout(800);
await shot('07-galereya-roma');
await page.evaluate(() => { const g = window.__odin.scenes.top; g.group = 1; g.index = 5; });
await page.waitForTimeout(200);
await shot('08-galereya-fizruk');
// новые персонажи в диалоге
let n = 9;
for (const [label, file] of [['Ваня Максимов', 'vanya'], ['Святослав Гулько', 'svyat'], ['Миша Аносов', 'misha'], ['Иван Владимирович', 'ivan'], ['Василий', 'vasily']]) {
  await page.evaluate((l) => window.__odinDebug(l + ' (диалог)'), label);
  await page.waitForTimeout(2200);
  if (file === 'ivan') { for (let k = 0; k < 2; k++) { await page.keyboard.press('z'); await page.waitForTimeout(900); } }
  if (file === 'vasily') { await page.keyboard.press('z'); await page.waitForTimeout(900); }
  await shot(`${String(n++).padStart(2, '0')}-dialog-${file}`);
}
await browser.close();
console.log('страницы листа:', pages.length, 'ошибки:', errors.length ? errors : 'нет');
if (errors.length) process.exit(1);
