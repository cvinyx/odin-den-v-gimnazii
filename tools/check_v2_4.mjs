// Проверка этапа V2-4 в браузере: 6 скриншотов (выбор на тесте, вопрос теста, списывание сидя одному
// с телефона и учитель идёт по рядам, английский, плавание с лавкой, классный час) и прогон ботом
// теста, классного часа и душа до конца. Скриншоты — docs/screenshots/v2-4/.
import path from 'node:path';
import fs from 'node:fs';
import { chromium } from './pw.mjs';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const shots = process.argv[2] || path.join(root, 'docs/screenshots/v2-4');
fs.mkdirSync(shots, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto('file://' + path.join(root, 'dist/index.html'));
await page.waitForTimeout(400);
await page.keyboard.press('Space'); await page.waitForTimeout(500);
const shot = (n) => page.locator('#screen').screenshot({ path: path.join(shots, n + '.png') });
const dbg = (l) => page.evaluate((l) => window.__odinDebug(l), l);
const top = () => page.evaluate(() => { const t = window.__odin.scenes.top; return { id: t.id, phase: t.phase, inner: t.inst && t.inst.phase }; });
const press = async (k, ms = 250) => { await page.keyboard.press(k); await page.waitForTimeout(ms); };
const startGame = async (label) => { await dbg(label); await page.waitForTimeout(700); await press('z', 500); };
// довести мини-игру ботом до конца (autoplay) и вернуть итог
async function finish(maxSec = 120) {
  await page.evaluate(() => { const t = window.__odin.scenes.top; if (t.inst) t.inst.autoplay = true; });
  for (let i = 0; i < maxSec * 4; i++) {
    const s = await top();
    if (s.phase === 'outro') return page.evaluate(() => window.__odin.scenes.top.res);
    await page.waitForTimeout(250);
  }
  return null;
}
const res = {};

await startGame('Тест: выбор (сидит с Игорем)');
await shot('01-test-vybor');
res.modesIgor = await page.evaluate(() => window.__odin.scenes.top.inst.modes.map((m) => m.id));
await press('z', 400); // «Решать самому»
await shot('02-test-vopros');
res.test = await finish(300);

await startGame('Тест: один и телефон сел');
res.modesAloneDead = await page.evaluate(() => window.__odin.scenes.top.inst.modes.map((m) => m.id));

await startGame('Списывание с телефона, учитель идёт по рядам');
await page.waitForTimeout(300);
await page.keyboard.up('z'); await page.waitForTimeout(1800);
await page.keyboard.down('z'); await page.waitForTimeout(500);
await shot('03-spisyvanie-odin-s-telefona-uchitel-idet');
await page.keyboard.up('z');
res.walking = await page.evaluate(() => window.__odin.scenes.top.inst.logic.walking);

await dbg('Урок английского (класс вдвое меньше)');
await page.waitForTimeout(1200);
for (let i = 0; i < 6; i++) await press('z', 350);
await page.waitForTimeout(500);
await shot('04-angliyskiy');
res.english = await page.evaluate(() => { const l = window.__odin.scenes.stack.find((s) => s.id === 'lesson'); const ids = l.view.students.map((a) => a.id); return { n: ids.length + 1, denis: ids.includes('denis'), matych: ids.includes('matych') }; });

await startGame('Плавание (мини-игра)');
await page.evaluate(() => { window.__odin.scenes.top.inst.autoplay = true; });
await page.waitForTimeout(6000);
await shot('05-plavanie-i-lavka');

await startGame('Классный час (мини-игра)');
for (let i = 0; i < 12 && (await page.evaluate(() => window.__odin.scenes.top.inst.phase)) !== 'choose'; i++) await press('z', 300);
await shot('06-klassnyy-chas');
res.classhour = await finish(120);

await startGame('Душ у бассейна');
res.shower = await finish(90);

await browser.close();
console.log(JSON.stringify({ res, errors }));
if (errors.length) process.exit(1);
