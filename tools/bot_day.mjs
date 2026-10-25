// Скрипт-бот: проходит дни недели от новой игры нажатиями клавиш (headless Chromium, file://).
// Доходит до каждого кабинета по расписанию дня через все карты, на переменах говорит с друзьями, на большой
// перемене покупает обед, после последнего урока едет домой (автобус 26/38), утром — к гимназии.
// Запуск: node tools/bot_day.mjs [код] [папка_скриншотов] [сколько_дней=2] [с_какого_дня=1]
import path from 'node:path';
import fs from 'node:fs';
import { chromium } from './pw.mjs';
import { Bot } from './bot_lib.mjs';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

export async function runDay({ seed = 'KQ7M2P', shots = null, cheatStyle = 'cautious', days = 2, from = 1 } = {}) {
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

  if (from > 1) {
    // отладка «Начать с дня» (прошлые дни — оценки со средним 6), утро → улица
    await page.keyboard.press('Space'); await page.waitForTimeout(700);
    await page.evaluate((d) => window.__odinDebug('Начать с дня', d), from);
    await bot.handle((t, s) => t === 'world' && s.map === 'street');
  } else {
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
    await bot.handle((t) => t === 'dialog', 15000); // титр «дежавю» пропускается Z
    await page.keyboard.down('x'); await page.waitForTimeout(1400); await page.keyboard.up('x');
    await bot.handle((t, s) => t === 'world' && s.map === 'street');
  }
  timings.days = [];
  for (let day = from; day < from + days; day++) {
    bot._data = null; // расписание — текущего дня
    const schedule = (await bot.data()).SCHEDULE;
    const d0 = Date.now();
    let ended = false;
    for (const l of schedule) {
      // дорога к кабинету
      const walkMs = await bot.goToRoom(l.room);
      timings.walks.push({ day, to: l.room, sec: Math.round(walkMs / 1000) });
      const ls = Date.now();
      const last = l.n === schedule.length;
      const s1 = await bot.handle((t, st) => t === 'minigame' || t === 'world' || st.bottom === 'bus_home' || t === 'results', 120000);
      if (s1.id === 'minigame') {
        await shot(`d${day}-urok-${l.n}-${l.minigame}`);
        await bot.handle((t, st) => t === 'world' || st.bottom === 'bus_home' || t === 'results', 240000);
      }
      timings.lessons.push({ day, n: l.n, sec: Math.round((Date.now() - ls) / 1000) });
      const top = await bot.top();
      const bottom = await page.evaluate(() => window.__odin.scenes.stack[0].id);
      if (last || bottom === 'bus_home' || bottom === 'day_over' || top === 'results') { ended = true; break; }
      await bot.waitFor((st) => st.top === 'world');
      const map = await bot.curMap();
      await shot(`d${day}-peremena-${l.n}-${map}`);
      // перемена: поговорить с первым именным NPC на карте
      const named = await page.evaluate(() => { const s = window.__odin.scenes.top; const n = s.npcs.find((x) => x.def.named); return n ? n.id : null; });
      if (named) {
        try { await bot.talkTo(named); await bot.handle((t) => t === 'world', 120000); } catch (e) { errors.push(`день ${day}, перемена ${l.n}: ${e.message}`); }
      }
      // большая перемена: в столовую, там все друзья; купить обед
      if (l.n === 3) {
        await bot.goToMap('canteen');
        await shot(`d${day}-stolovaya`);
        await bot.talkTo('cook');
        await bot.handle((t) => t === 'buffet');
        await page.evaluate(() => { const b = window.__odin.scenes.top; b.menu.index = 2; });
        await bot.press('z');
        await bot.press('Escape');
        await bot.handle((t) => t === 'world');
      }
      // предпоследняя перемена: в библиотеку, зарядить телефон у розетки
      if (l.n === schedule.length - 1) {
        await bot.goToMap('library');
        await bot.walkTo(3, 2);
        await bot.face('up'); await bot.press('z');
        await bot.handle((t, st) => t === 'dialog' && st.mode === 'choice');
        await bot.press('z'); // «Телефон»
        await bot.handle((t) => t === 'world');
        await page.waitForTimeout(6000);
        await shot(`d${day}-biblioteka-zaryadka`);
      }
    }
    if (!ended) errors.push(`день ${day}: уроки кончились, а дорога домой не началась`);
    // дорога домой: автобус и разговор с Левончуком
    const sb = await bot.handle((t, st) => st.bottom === 'bus_home' || t === 'results', 60000);
    if (sb.id !== 'results') {
      await page.waitForTimeout(400);
      await shot(`d${day}-avtobus-domoy`);
      const busLabel = await page.evaluate(() => window.__odin.state.week.busSeen.slice(-1)[0]);
      timings.days.push({ day, sec: Math.round((Date.now() - d0) / 1000), bus: busLabel });
    }
    // следующее утро (или концовка недели после пятницы)
    const sm = await bot.handle((t, st) => (t === 'world' && st.map === 'street') || t === 'results', 120000);
    if (sm.id === 'results') break;
    await shot(`d${day + 1}-utro`);
  }
  const state = await page.evaluate(() => JSON.parse(JSON.stringify(window.__odin.state)));
  await browser.close();
  return { seed, ms: Date.now() - t0, errors, log: bot.log, state, timings };
}

if (process.argv[1] && process.argv[1].endsWith('bot_day.mjs')) {
  const [seed = 'KQ7M2P', shots = '', days = '2', from = '1'] = process.argv.slice(2);
  const res = await runDay({ seed, shots: shots || null, days: Number(days), from: Number(from) });
  const s = res.state;
  console.log(JSON.stringify({ seed: res.seed, sec: Math.round(res.ms / 1000), day: s.day, week: s.week, stats: s.stats, debts: s.debts, timings: { days: res.timings.days, lessons: res.timings.lessons }, errors: res.errors }));
  if (res.errors.length) process.exit(1);
}
