// Проверка этапа V2-8 в браузере (file://): главное меню, по 2 кадра каждого дня недели, 4 концовки,
// итоги недели и карточка 960×540; считает сетевые запросы (должно быть 0). Скриншоты — docs/screenshots/v2-8/.
import path from 'node:path';
import fs from 'node:fs';
import { chromium } from './pw.mjs';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const shots = process.argv[2] || path.join(root, 'docs/screenshots/v2-8');
fs.mkdirSync(shots, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 960, height: 540 }, acceptDownloads: true });
const errors = [], net = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('request', (r) => { if (!/^(file|data|blob):/.test(r.url())) net.push(r.url()); });
await page.goto('file://' + path.join(root, 'dist/index.html'));
await page.waitForTimeout(400);
const shot = (n) => page.locator('#screen').screenshot({ path: path.join(shots, n + '.png') });
const top = () => page.evaluate(() => window.__odin.scenes.top && window.__odin.scenes.top.id);
const dbg = (l, a) => page.evaluate(([l, a]) => window.__odinDebug(l, a), [l, a]);
const press = async (k, ms = 250) => { await page.keyboard.press(k); await page.waitForTimeout(ms); };
async function skipDialogs(max = 80) { for (let i = 0; i < max && ['dialog', 'dejavu', 'morning', 'intro'].includes(await top()); i++) await press('z', 180); }
const results = { days: {} };

await press('Space', 600);
results.menu = await top();
await shot('01-glavnoe-menyu');

// день недели: утро/улица и характерный урок
const lessons = { 1: 1, 2: 6, 3: 4, 4: 3, 5: 6 };
const names = { 1: 'pn', 2: 'vt', 3: 'sr', 4: 'cht', 5: 'pt' };
let k = 2;
for (let d = 1; d <= 5; d++) {
  await dbg('Начать с дня', d);
  await page.waitForTimeout(1800);
  if (d === 1) await shot(`${String(k++).padStart(2, '0')}-${names[d]}-titr`);
  else { await press('z', 400); await skipDialogs(); await page.waitForTimeout(900); await shot(`${String(k++).padStart(2, '0')}-${names[d]}-utro`); }
  await dbg('Урок', lessons[d]);
  await page.waitForTimeout(2200);
  for (let i = 0; i < 3; i++) await press('z', 400);
  results.days[d] = { top: await top(), loc: await page.evaluate(() => window.__odin.state.locationName), day: await page.evaluate(() => window.__odin.state.day) };
  await shot(`${String(k++).padStart(2, '0')}-${names[d]}-urok-${lessons[d]}`);
}

const endings = { pride: 'Гордость семьи', bntu: 'Поступаю в БНТУ', habza: 'Дорога в хабзу', dad: 'Папочка зол' };
results.endings = {};
for (const [id, title] of Object.entries(endings)) {
  await dbg('Концовка: ' + title);
  await page.waitForTimeout(1700);
  await press('z', 300); await press('z', 1500);
  await shot(`${String(k++).padStart(2, '0')}-koncovka-${id}`);
  for (let i = 0; i < 40 && (await top()) !== 'results'; i++) await press('z', 200);
  await page.waitForTimeout(900);
  results.endings[id] = { top: await top(), ending: await page.evaluate(() => window.__odin.state.flags.ending) };
  if (id === 'dad') {
    await shot(`${String(k++).padStart(2, '0')}-itogi-nedeli`);
    await page.evaluate(() => { window.__odin.scenes.top.menu.index = 0; });
    const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 5000 }).catch(() => null), press('z', 300)]);
    if (dl) await dl.saveAs(path.join(shots, `${String(k++).padStart(2, '0')}-kartochka-nedeli-960x540.png`));
    results.card = !!dl;
  }
}
await browser.close();
results.size = fs.statSync(path.join(root, 'dist/index.html')).size;
console.log(JSON.stringify({ results, net, errors }, null, 1));
if (errors.length || net.length) process.exit(1);
