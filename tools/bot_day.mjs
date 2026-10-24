// Скрипт-бот этапа 3: проходит весь день от новой игры до финала нажатиями клавиш (headless Chromium, file://).
// Доходит до каждого кабинета по расписанию через все карты, на переменах говорит с друзьями, на большой
// перемене покупает обед. Запуск: node tools/bot_day.mjs [код_дня] [папка_скриншотов]
import path from 'node:path';
import fs from 'node:fs';
import { chromium } from './pw.mjs';
import { Bot } from './bot_lib.mjs';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

export async function runDay({ seed = 'KQ7M2P', shots = null, cheatStyle = 'cautious' } = {}) {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('file://' + path.join(root, 'dist/index.html'));
  await page.waitForTimeout(300);
  await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });

  let bot;
  // Политика выборов: аккуратная игра; на лестнице — нужный этаж.
  const policy = (q, opts) => {
    if (/этаж/.test(q)) { const i = opts.findIndex((o) => o.startsWith(bot.floorWanted + ' ')); return Math.max(0, i); }
    if (q === 'stub') return 0;
    const prefer = ['К Игорю', 'Отбить место', 'Сидеть тихо', 'Переписывать', 'Читать', 'Не рисковать', 'Ай вос', 'Писать сам',
      'Вызваться читать', 'И не ссорятся', 'Выйти и честно', 'Молча зашнуровать', 'Шанхае', 'Не сегодня', 'бывай', 'передумал'];
    for (const w of prefer) { const i = opts.findIndex((o) => o.includes(w)); if (i >= 0) return i; }
    return 0;
  };
  bot = new Bot(page, { policy, cheatStyle, lossOption: 2 });
  let n = 0;
  const shot = async (name) => {
    if (!shots) return;
    fs.mkdirSync(shots, { recursive: true });
    await page.locator('#screen').screenshot({ path: path.join(shots, `${String(++n).padStart(2, '0')}-${name}.png`) });
  };
  const t0 = Date.now();
  const timings = { walks: [], lessons: [] };

  // Заставка → главное меню → новая игра с кодом дня
  await page.keyboard.press('Space'); await page.waitForTimeout(700);
  await page.evaluate(() => { window.__odin.scenes.top.menu.index = 1; });
  await bot.press('z');
  await page.evaluate(() => { window.__odin.scenes.top.menu.index = 2; });
  await bot.press('z');
  await page.keyboard.type(seed);
  await bot.press('Enter');
  await page.evaluate(() => { window.__odin.scenes.top.menu.index = 0; });
  await bot.press('z');
  // вступление — пропуск удержанием X
  await bot.waitFor((s) => s.top === 'dialog');
  await page.keyboard.down('x'); await page.waitForTimeout(1400); await page.keyboard.up('x');
  await bot.handle((t, s) => t === 'world' && s.map === 'street');

  const schedule = (await bot.data()).SCHEDULE;
  for (const l of schedule) {
    // дорога к кабинету
    const walkMs = await bot.goToRoom(l.room);
    timings.walks.push({ to: l.room, sec: Math.round(walkMs / 1000) });
    const ls = Date.now();
    await bot.handle((t) => t === 'minigame', 120000);
    await shot(`urok-${l.n}-${l.minigame}`);
    await bot.handle((t) => t === 'world' || t === 'results', 240000);
    timings.lessons.push({ n: l.n, sec: Math.round((Date.now() - ls) / 1000) });
    if (l.n === 7 || (await bot.top()) === 'results') break; // последний урок или концовка «К директору!»
    await bot.waitFor((s) => s.top === 'world');
    const map = await bot.curMap();
    await shot(`peremena-${l.n}-${map}`);
    // перемена: поговорить с первым именным NPC на карте
    const named = await page.evaluate(() => { const s = window.__odin.scenes.top; const n = s.npcs.find((x) => x.def.named); return n ? n.id : null; });
    if (named) {
      try { await bot.talkTo(named); await bot.handle((t) => t === 'world', 120000); } catch (e) { errors.push('перемена ' + l.n + ': ' + e.message); }
    }
    // большая перемена: в столовую, там все друзья; купить обед
    if (l.n === 3) {
      await bot.goToMap('canteen');
      await shot('stolovaya-bolshaya-peremena');
      await bot.talkTo('cook');
      await bot.handle((t) => t === 'buffet');
      await shot('bufet');
      await page.evaluate(() => { const b = window.__odin.scenes.top; b.menu.index = 2; });
      await bot.press('z');
      await bot.press('Escape');
      await bot.handle((t) => t === 'world');
    }
    // перемена 6: в библиотеку, зарядить телефон у розетки
    if (l.n === 6) {
      await bot.goToMap('library');
      await bot.walkTo(3, 2);
      await bot.face('up'); await bot.press('z');
      await bot.handle((t, s) => t === 'dialog' && s.mode === 'choice');
      await bot.press('z'); // «Телефон»
      await bot.handle((t) => t === 'world');
      await page.waitForTimeout(6000);
      await shot('biblioteka-zaryadka');
      await page.keyboard.press('Tab'); await page.waitForTimeout(300);
      await shot('shema-shkoly');
      await page.keyboard.press('Tab'); await page.waitForTimeout(200);
    }
  }
  await bot.handle((t) => t === 'results', 60000);
  await page.waitForTimeout(800);
  await shot('final-dnya');
  const state = await page.evaluate(() => JSON.parse(JSON.stringify(window.__odin.state)));
  await browser.close();
  return { seed, ms: Date.now() - t0, errors, log: bot.log, state, timings };
}

if (process.argv[1] && process.argv[1].endsWith('bot_day.mjs')) {
  const [seed = 'KQ7M2P', shots = ''] = process.argv.slice(2);
  const res = await runDay({ seed, shots: shots || null });
  const s = res.state;
  console.log(JSON.stringify({ seed: res.seed, sec: Math.round(res.ms / 1000), grades: s.grades, match: s.flags.matchScore, stats: s.stats, debts: s.debts, director: s.directorCalls, timings: res.timings, errors: res.errors }));
  if (res.errors.length) process.exit(1);
}
