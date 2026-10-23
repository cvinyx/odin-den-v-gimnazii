// Проверка сборки в headless Chromium через file:// + скриншоты ключевых экранов этапа 1.
// Запуск: node tools/screenshots.mjs [папка]
import path from 'node:path';
import fs from 'node:fs';
import { chromium } from './pw.mjs';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const outDir = path.resolve(process.argv[2] || path.join(root, 'docs/screenshots/etap-1'));
fs.mkdirSync(outDir, { recursive: true });
const url = 'file://' + path.join(root, 'dist/index.html');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
const errors = [];
const external = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('request', (req) => { if (!req.url().startsWith('file://') && !req.url().startsWith('data:')) external.push(req.url()); });

await page.goto(url);
await page.waitForTimeout(400);
const wait = (ms) => page.waitForTimeout(ms);
const press = async (key, n = 1) => { for (let i = 0; i < n; i++) { await page.keyboard.press(key); await wait(70); } };
const shot = async (name) => {
  await page.locator('#screen').screenshot({ path: path.join(outDir, name + '.png') });
  console.log('скриншот', name);
};
const top = () => page.evaluate(() => window.__odin.scenes.top.id);

// 1. Главное меню
await press('ArrowDown'); await press('ArrowUp');
await wait(300);
await shot('01-glavnoe-menyu');

// 2. Шрифт (через отладочное меню: вкладка «Сцены»)
const openDebugItem = async (label) => {
  await press('Backquote');
  await page.evaluate((label) => {
    const d = window.__odin.scenes.top;
    const tabs = d.tabs();
    const ti = tabs.findIndex((t) => t.items.some((i) => i.label === label));
    d.tab = ti; d.index = tabs[ti].items.findIndex((i) => i.label === label);
  }, label);
  await press('KeyZ');
  await wait(700);
};
await openDebugItem('Шрифт');
await shot('02-shrift');
await press('KeyX');
await wait(200);

// 3. Галерея: ученики и учителя
await openDebugItem('Галерея');
await shot('03-galereya-ucheniki');
await press('ArrowRight', 2); // Игорь
await shot('04-galereya-igor');
await press('ArrowRight', 4); // Шурпо
await shot('05-galereya-shurpo');
await press('ArrowDown');
await shot('06-galereya-uchitelya');
await press('ArrowDown');
await shot('07-galereya-bezymyannye');
await press('KeyX');
await wait(200);

// 4. Новая игра (экран кода дня) и тестовая комната из отладочного меню
await page.evaluate(() => { const t = window.__odin.scenes.top; t.menu.index = 1; });
await press('KeyZ');
await wait(200);
await shot('08-novaya-igra');
await press('KeyX');
await page.evaluate(() => window.__odinDebug('Тестовая комната'));
await wait(900);
await shot('09-testovaya-komnata');

// подойти к Игорю: телепорт рядом и повернуться к нему
await page.evaluate(() => {
  const s = window.__odin.scenes.top;
  const igor = s.npcs.find((n) => n.id === 'igor');
  igor.route = [];
  s.player.x = igor.x; s.player.y = igor.y + 16; s.player.dir = 'up';
});
await wait(300);
await shot('10-podskazka-z');
await press('KeyZ');
await wait(1500);
await shot('11-dialog-igor');
// пролистать реплики до выбора
for (let i = 0; i < 30 && (await page.evaluate(() => window.__odin.scenes.top.mode)) !== 'choice'; i++) {
  await press('KeyZ'); await wait(250);
}
await shot('12-vybor');
const before = await page.evaluate(() => ({ ...window.__odin.state.stats }));
await press('KeyZ'); // вариант A: аура +5, стресс −5
await wait(300);
const after = await page.evaluate(() => ({ ...window.__odin.state.stats }));
await shot('13-posle-vybora-hud');
for (let i = 0; i < 20 && (await top()) === 'dialog'; i++) { await press('KeyZ'); await wait(200); }

// Tab-панель и пауза
await press('Tab');
await wait(200);
await shot('14-panel-tab');
await press('Tab');
await press('Escape');
await wait(200);
await shot('15-pauza');
await press('Escape');

// отладочное меню
await press('Backquote');
await page.evaluate(() => { window.__odin.scenes.top.tab = window.__odin.scenes.top.tabs().findIndex((t) => t.name === 'Статусы'); });
await wait(100);
await shot('16-otladka');
await press('Escape');

// код сохранения: пауза → «Скопировать код» → выйти в меню → ввести испорченный и верный код
await press('Escape');
await page.evaluate(() => { window.__odin.scenes.top.menu.index = 2; });
await press('KeyZ');
await wait(300);
await shot('17-kod-sohraneniya');
const code = await page.evaluate(() => window.__odin.scenes.top.code);
const snap = () => page.evaluate(() => { const s = { ...window.__odin.state }; delete s.playTime; delete s.pos; return JSON.stringify(s); });
const statsBefore = await snap();
await press('KeyZ');
await page.evaluate(() => { window.__odin.scenes.top.menu.index = 4; });
await press('KeyZ');
await wait(900);
await page.evaluate(() => { window.__odin.scenes.top.menu.index = 2; });
await press('KeyZ');
await page.keyboard.type('ODG1-slomannyi-kod');
await press('Enter');
await wait(200);
await shot('18-isporchennyi-kod');
const errShown = await page.evaluate(() => window.__odin.scenes.top.error);
for (let i = 0; i < 20; i++) await press('Backspace');
await page.keyboard.type(code, { delay: 2 });
await press('Enter');
await wait(900);
const statsAfter = await snap();
const sceneAfter = await top();
console.log('ошибка испорченного кода:', errShown);
console.log('код загружен:', sceneAfter, 'состояние совпало:', statsBefore === statsAfter);
if (!errShown || sceneAfter !== 'test_room' || statsBefore !== statsAfter) errors.push('код сохранения: проверка не прошла');

await browser.close();
console.log('статусы до выбора:', JSON.stringify(before));
console.log('статусы после выбора:', JSON.stringify(after));
console.log('внешние запросы:', external.length ? external : 'нет');
console.log('ошибки:', errors.length ? errors : 'нет');
if (errors.length || external.length) process.exit(1);
