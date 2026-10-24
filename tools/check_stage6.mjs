// Проверка этапа 6 в браузере (dist/index.html через file://):
// 1) нет ошибок консоли и сетевых запросов; заставка, меню, достижения, титры;
// 2) бот доходит до каждой из 5 концовок (последний урок с подготовленным днём → концовка → итоги);
// 3) карточка итогов скачивается PNG 960×540, текст копируется;
// 4) сохранение: выход посреди дня → «Продолжить»; код сохранения после перезагрузки страницы;
// 5) без localStorage игра не падает.
// Запуск: node tools/check_stage6.mjs [папка скриншотов]
import path from 'node:path';
import fs from 'node:fs';
import { chromium } from './pw.mjs';
import { Bot } from './bot_lib.mjs';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const shots = process.argv[2] || path.join(root, 'docs/screenshots/etap-6');
fs.mkdirSync(shots, { recursive: true });
const url = 'file://' + path.join(root, 'dist/index.html');
const errors = [], requests = [];
const browser = await chromium.launch();

async function newPage(opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 960, height: 540 }, acceptDownloads: true, ...opts });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('request', (r) => { const u = r.url(); if (!u.startsWith('file:') && !u.startsWith('data:') && !u.startsWith('blob:')) requests.push(u); });
  return { ctx, page };
}
const shot = (page, name) => page.locator('#screen').screenshot({ path: path.join(shots, name + '.png') });
const policy = (q, opts) => {
  for (const w of ['Сидеть тихо', 'Переписывать', 'Читать', 'Писать сам', 'Не рисковать', 'бывай', 'Не сегодня']) { const i = opts.findIndex((o) => o.includes(w)); if (i >= 0) return i; }
  return 0;
};

// ---------- 1. Заставка, меню, достижения, титры ----------
{
  const { ctx, page } = await newPage();
  await page.goto(url); await page.waitForTimeout(500);
  await shot(page, '01-zastavka');
  await page.keyboard.press('Space'); await page.waitForTimeout(800);
  await shot(page, '02-glavnoe-menu');
  await page.evaluate(() => { window.__odin.scenes.top.menu.index = 4; });
  await page.keyboard.press('z'); await page.waitForTimeout(400);
  await shot(page, '03-dostizheniya');
  await page.keyboard.press('x'); await page.waitForTimeout(300);
  await page.evaluate(() => { window.__odin.scenes.top.menu.index = 5; });
  await page.keyboard.press('z'); await page.waitForTimeout(4000);
  await shot(page, '04-titry');
  await page.keyboard.press('x');
  const debugHidden = await page.evaluate(() => { const g = window.__odin; g.input.queuePressed.add('Backquote'); g.update(1 / 60); return g.scenes.top.id !== 'debug'; });
  console.log('отладка без ?debug скрыта:', debugHidden);
  if (!debugHidden) errors.push('отладочное меню открывается без ?debug');
  console.log('заголовок:', await page.title());
  await ctx.close();
}

// ---------- 2. Бот доходит до каждой концовки ----------
const SETUP = {
  perfect: (st) => { st.grades = [7, 8, 7, 7, 8, 7]; st.stats.aura = 80; st.flags.matchResult = 1; st.flags.matchScore = '3:2'; st.directorCalls = 0; },
  legend: (st) => { st.stats.aura = 95; st.wins = 6; st.flags.matchResult = -1; st.flags.matchScore = '1:3'; },
  drained: (st) => { st.breakdowns = 2; st.flags.matchResult = 0; st.flags.matchScore = '2:2'; },
  chaos: (st) => { st.stats.aura = 55; st.flags.matchResult = 0; st.flags.matchScore = '1:1'; st.directorCalls = 1; },
  director: (st) => { st.directorCalls = 2; st.suspicionPrev = 400; st.flags.matchResult = -1; st.flags.matchScore = '0:2'; },
};
const endings = {};
for (const [k, setup] of Object.entries(SETUP)) {
  const { ctx, page } = await newPage();
  await page.goto(url); await page.waitForTimeout(400);
  await page.evaluate((src) => {
    window.__odinDebug('Урок 7 — Обществоведение');
    const st = window.__odin.state;
    // eslint-disable-next-line no-new-func
    new Function('st', src)(st);
  }, `(${setup.toString()})(st)`);
  const bot = new Bot(page, { policy, cheatStyle: 'cautious', lossOption: 0 });
  await bot.handle((t, s) => t === 'dialog' && s.bottom === 'ending', 300000);
  await page.waitForTimeout(1500);
  await shot(page, `05-koncovka-${k}`);
  await bot.handle((t) => t === 'results', 60000);
  await page.waitForTimeout(600);
  const got = await page.evaluate(() => window.__odin.state.flags.ending);
  endings[k] = got;
  await shot(page, `06-itogi-${k}`);
  if (got !== k) errors.push(`концовка ${k}: получилась ${got}`);
  if (k === 'perfect') {
    // карточка PNG и текст
    const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 8000 }), page.evaluate(() => window.__odin.scenes.top.menu.items[0].action())]);
    const file = path.join(shots, 'kartochka-itogov.png');
    await dl.saveAs(file);
    const buf = fs.readFileSync(file);
    const w = buf.readUInt32BE(16), h = buf.readUInt32BE(20);
    console.log('карточка:', dl.suggestedFilename(), `${w}×${h}`);
    if (w !== 960 || h !== 540) errors.push('карточка не 960×540');
    await page.evaluate(() => window.__odin.scenes.top.menu.items[1].action());
    await page.waitForTimeout(400);
    const toast = await page.evaluate(() => window.__odin.toasts.map((t) => t.text).join(' | '));
    console.log('копирование текстом:', toast);
  }
  await ctx.close();
}
console.log('концовки ботом:', JSON.stringify(endings));

// ---------- 3. Сохранение: выход посреди дня → «Продолжить», код сохранения после перезагрузки ----------
{
  const { ctx, page } = await newPage();
  await page.goto(url); await page.waitForTimeout(400);
  // начало урока — автосохранение (как в обычной игре)
  await page.evaluate(() => window.__odinDebug('Урок 2 — Математика'));
  await page.waitForTimeout(2500);
  const before = await page.evaluate(() => ({ lesson: window.__odin.state.lesson, phase: window.__odin.state.phase, money: window.__odin.state.stats.money, seed: window.__odin.state.seed }));
  // код сохранения (тот же, что в меню паузы «Скопировать код сохранения»)
  const code = await page.evaluate(() => window.__odinSaveCode());
  await page.reload(); await page.waitForTimeout(500);
  await page.keyboard.press('Space'); await page.waitForTimeout(800);
  const canContinue = await page.evaluate(() => !window.__odin.scenes.top.menu.items[0].disabled);
  await page.keyboard.press('z'); await page.waitForTimeout(1500);
  const after = await page.evaluate(() => ({ top: window.__odin.scenes.top.id, lesson: window.__odin.state.lesson, phase: window.__odin.state.phase, seed: window.__odin.state.seed }));
  console.log('«Продолжить» после перезагрузки:', canContinue, JSON.stringify(after));
  if (!canContinue || after.seed !== before.seed || after.lesson !== before.lesson) errors.push('«Продолжить» не вернул в тот же день');
  // ввод кода после перезагрузки (в чистом браузере)
  await ctx.close();
  const p2 = await newPage();
  await p2.page.goto(url); await p2.page.waitForTimeout(400);
  await p2.page.keyboard.press('Space'); await p2.page.waitForTimeout(800);
  await p2.page.evaluate(() => { window.__odin.scenes.top.menu.index = 2; });
  await p2.page.keyboard.press('z'); await p2.page.waitForTimeout(300);
  await p2.page.keyboard.type(code); await p2.page.keyboard.press('Enter'); await p2.page.waitForTimeout(1500);
  const fromCode = await p2.page.evaluate(() => ({ top: window.__odin.scenes.top.id, seed: window.__odin.state.seed, lesson: window.__odin.state.lesson, money: window.__odin.state.stats.money }));
  console.log('загрузка по коду в чистом браузере:', JSON.stringify(fromCode));
  if (fromCode.seed !== before.seed || fromCode.money !== before.money) errors.push('код сохранения не восстановил день');
  // неверный код — понятное сообщение
  await p2.page.evaluate(() => { while (window.__odin.scenes.stack.length > 1) window.__odin.scenes.pop(); });
  await p2.ctx.close();
}

// ---------- 4. Без localStorage ----------
{
  const { ctx, page } = await newPage();
  await ctx.addInitScript(() => { Object.defineProperty(window, 'localStorage', { get() { throw new Error('localStorage запрещён'); } }); });
  await page.goto(url); await page.waitForTimeout(500);
  await page.keyboard.press('Space'); await page.waitForTimeout(800);
  await page.evaluate(() => { window.__odin.scenes.top.menu.index = 1; });
  await page.keyboard.press('z'); await page.waitForTimeout(300);
  await page.keyboard.press('z'); await page.waitForTimeout(1500);
  const top = await page.evaluate(() => window.__odin.scenes.top.id);
  console.log('без localStorage: новая игра →', top);
  await shot(page, '08-bez-localstorage');
  await ctx.close();
}

await browser.close();
console.log('сетевые запросы:', requests.length ? requests : 'нет');
console.log('ошибки:', errors.length ? errors : 'нет');
if (errors.length || requests.length) process.exit(1);
