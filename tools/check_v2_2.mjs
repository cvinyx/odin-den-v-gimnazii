// Проверка этапа V2-2 «Неделя» в браузере: титр перед понедельником, утро среды, вкладки «Расписание»
// и «Дневник» (заряжен и сел), дорога домой, 3-й вызов к директору (день окончен), 4 концовки, итоги недели
// и карточка 960×540. Скриншоты — docs/screenshots/v2-2/.
import path from 'node:path';
import fs from 'node:fs';
import { chromium } from './pw.mjs';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const shots = process.argv[2] || path.join(root, 'docs/screenshots/v2-2');
fs.mkdirSync(shots, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 960, height: 540 }, acceptDownloads: true });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto('file://' + path.join(root, 'dist/index.html'));
await page.waitForTimeout(400);
const shot = (n) => page.locator('#screen').screenshot({ path: path.join(shots, n + '.png') });
const top = () => page.evaluate(() => window.__odin.scenes.top && window.__odin.scenes.top.id);
const stack = () => page.evaluate(() => window.__odin.scenes.stack.map((s) => s.id).join('>'));
const dbg = (l, a) => page.evaluate(([l, a]) => window.__odinDebug(l, a), [l, a]);
const press = async (k, ms = 250) => { await page.keyboard.press(k); await page.waitForTimeout(ms); };
// листать диалоги, пока верхняя сцена — диалог (выбор — первый вариант)
async function skipDialogs(max = 60) {
  for (let i = 0; i < max && (await top()) === 'dialog'; i++) await press('z', 180);
}
const results = {};

// 1. Титр перед понедельником
await dbg('Начать с дня', 1);
await page.waitForTimeout(1800);
results.dejavu = await top();
await shot('01-titr-dezhavyu');

// 2. Утро среды у входа, потом свободное перемещение
await dbg('Начать с дня', 3);
await page.waitForTimeout(1500);
await press('z', 400);
await shot('02-utro-sredy');
await skipDialogs();
await page.waitForTimeout(900);
results.morning = { top: await top(), day: await page.evaluate(() => window.__odin.state.day), clock: await page.evaluate(() => window.__odin.state.clock) };
await shot('03-sreda-u-vhoda');

// 3. Пауза → «Расписание»
await press('Escape', 400);
const pauseItems = await page.evaluate(() => window.__odin.scenes.top.menu.items.map((i) => i.label));
await page.evaluate(() => { window.__odin.scenes.top.menu.index = 2; });
await press('z', 400);
results.schedule = await top();
await shot('04-raspisanie');
await press('x', 300);
// 4. «Дневник»: заряженный и севший телефон
await page.evaluate(() => { window.__odin.scenes.top.menu.index = 3; });
await press('z', 400);
results.diary = await top();
await shot('05-dnevnik');
await press('ArrowLeft', 200); await press('ArrowLeft', 300);
await shot('06-dnevnik-ponedelnik');
await page.evaluate(() => { window.__odin.state.stats.battery = 0; });
await page.waitForTimeout(200);
await shot('07-dnevnik-telefon-sel');
await press('x', 300); await press('x', 300);

// 5. Дорога домой
await dbg('Дорога домой (автобус)');
await page.waitForTimeout(1600);
await press('z', 500);
results.bus = { stack: await stack(), label: await page.evaluate(() => window.__odin.state.week.busSeen.slice(-1)[0]) };
await shot('08-avtobus-domoy');
await press('z', 500); await press('z', 500);
await shot('09-avtobus-domoy-2');

// 6. Третий вызов к директору — день окончен, дальше домой
await dbg('Урок', 2);
await page.waitForTimeout(1500);
await page.evaluate(() => { const s = window.__odin.state; s.directorCalls = 2; s.stats.suspicion = 100; });
for (let i = 0; i < 40 && !(await stack()).includes('day_over'); i++) await press('z', 200);
await page.waitForTimeout(600);
await press('z', 400);
results.dayOver = await stack();
await shot('10-den-okonchen');
for (let i = 0; i < 40 && !(await stack()).includes('bus_home'); i++) await press('z', 200);
results.dayOverHome = await stack();
results.dayEnds = await page.evaluate(() => window.__odin.state.week.dayEnds);

// 7. Четыре концовки и итоги недели
const names = { pride: 'Гордость семьи', bntu: 'Поступаю в БНТУ', habza: 'Дорога в хабзу', dad: 'Папочка зол' };
let k = 11;
results.endings = {};
for (const [id, title] of Object.entries(names)) {
  await dbg('Концовка: ' + title);
  await page.waitForTimeout(1700);
  await press('z', 300); await press('z', 1500);
  await shot(`${k++}-koncovka-${id}`);
  for (let i = 0; i < 40 && (await top()) !== 'results'; i++) await press('z', 200);
  await page.waitForTimeout(900);
  const st = await page.evaluate(() => ({ ending: window.__odin.state.flags.ending, avg: window.__odin.state.week.grades.flat().filter((x) => typeof x === 'number') }));
  results.endings[id] = { top: await top(), ending: st.ending, avg: +(st.avg.reduce((a, b) => a + b, 0) / st.avg.length).toFixed(2) };
  if (id === 'bntu') {
    await shot(`${k++}-itogi-nedeli`);
    // карточка 960×540 — «Скачать картинку»
    await page.evaluate(() => { window.__odin.scenes.top.menu.index = 0; });
    const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 5000 }).catch(() => null), press('z', 300)]);
    if (dl) await dl.saveAs(path.join(shots, `${k++}-kartochka-nedeli-960x540.png`));
    results.card = !!dl;
    results.text = await page.evaluate(async () => {
      const t = window.__odin.scenes.top;
      return t.menu.items.map((i) => i.label);
    });
  }
}
await browser.close();
console.log(JSON.stringify({ results, pauseItems, errors }, null, 1));
if (errors.length) process.exit(1);
