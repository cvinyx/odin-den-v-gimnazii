// Скрипт-бот: проходит вертикальный срез целиком нажатиями клавиш в headless Chromium (file://).
// Новая игра → вступление → улица → рекреация → корпус 2 → каб. 404 → урок → перемена → байт-дуэли → урок 2.
// Запуск: node tools/bot.mjs [код_дня] [папка_для_скриншотов] [cautious|greedy]
import path from 'node:path';
import fs from 'node:fs';
import { chromium } from './pw.mjs';
import { Bot } from './bot_lib.mjs';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

// Выбор варианта: предпочтения по словам в тексте вариантов.
function policy(q, opts) {
  const prefer = ['К Игорю', 'Шанхае', 'Ай вос', 'Сидеть тихо', 'Затянуться под партой', 'Буй, у тебя', 'на деньги', 'Сыграем', 'Забайчу', 'Давай в байт', 'этаж'];
  if (/этаж/.test(q)) return opts.findIndex((o) => o.startsWith(policy.floor + ' ')) ;
  for (const w of prefer) { const i = opts.findIndex((o) => o.includes(w)); if (i >= 0) return i; }
  return 0;
}
policy.floor = 4;

export async function runSlice({ seed = 'BXT234', shots = null, cheatStyle = 'cautious', lossOption = 2, headless = true } = {}) {
  const browser = await chromium.launch({ headless });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('file://' + path.join(root, 'dist/index.html'));
  await page.waitForTimeout(300);
  await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  const bot = new Bot(page, { policy, cheatStyle, lossOption });
  let n = 0;
  const shot = async (name) => {
    if (!shots) return;
    fs.mkdirSync(shots, { recursive: true });
    await page.locator('#screen').screenshot({ path: path.join(shots, `${String(++n).padStart(2, '0')}-${name}.png`) });
  };
  const t0 = Date.now();

  // Главное меню → Новая игра → ввести код дня
  await bot.press('ArrowDown');
  await page.evaluate(() => { window.__odin.scenes.top.menu.index = 1; });
  await bot.press('z');
  await page.evaluate(() => { window.__odin.scenes.top.menu.index = 2; });
  await bot.press('z');
  await page.keyboard.type(seed);
  await bot.press('Enter');
  await shot('kod-dnya');
  await page.evaluate(() => { window.__odin.scenes.top.menu.index = 0; });
  await bot.press('z');
  await bot.waitFor((s) => s.top === 'dialog');
  await page.waitForTimeout(1200);
  await shot('probuzhdenie');
  await bot.handle((t, s) => t === 'world');
  await shot('ostanovka');
  // остановка: поговорить с Левончуком
  await bot.talkTo('levonchuk');
  await bot.handle((t, s) => s.bottom === 'bus' && t === 'dialog');
  await page.waitForTimeout(1500);
  await shot('avtobus');
  await bot.handle((t, s) => t === 'world' && s.map === 'street');
  await bot.waitFor((s) => s.top === 'world' && s.map === 'street');
  await shot('ulitsa');
  // улица → рекреация
  await bot.useDoor(14, 3);
  await bot.waitFor((s) => s.top === 'world' && s.map === 'rec_f1');
  await shot('rekreatsiya');
  await bot.walkTo(38, 16);
  await bot.page.keyboard.down('ArrowRight'); await bot.wait(300); await bot.page.keyboard.up('ArrowRight');
  await bot.waitFor((s) => s.top === 'world' && s.map === 'k2_f1');
  await shot('korpus2-1etazh');
  // лестница на 4 этаж
  policy.floor = 4;
  await bot.useDoor(17, 1);
  await bot.handle((t, s) => t === 'world' && s.map === 'k2_f4');
  await shot('korpus2-4etazh');
  // каб. 404 → урок 1
  await bot.useDoor(8, 8);
  await bot.waitFor((s) => s.top === 'dialog' || s.top === 'lesson');
  await page.waitForTimeout(900);
  await shot('urok-vhod');
  await bot.handle((t, s) => t === 'dialog' && s.mode === 'choice');
  await shot('urok-vybor-mesta');
  await bot.handle((t, s) => t === 'minigame' && s.phase === 'intro');
  await shot('spisyvanie-ekran-do');
  await bot.press('z');
  await page.waitForTimeout(6000);
  await shot('spisyvanie');
  await bot.handle((t, s) => t === 'lesson_result' || t === 'director');
  await shot(await bot.top() === 'director' ? 'direktor' : 'itog-uroka');
  await bot.handle((t, s) => t === 'world' && s.map === 'k2_f4');
  await shot('peremena-1');
  // перемена: Игорь — байт на деньги
  await bot.talkTo('igor');
  await bot.handle((t, s) => t === 'minigame' && s.phase === 'intro');
  await shot('bait-ekran-do');
  await bot.press('z');
  await bot.handle((t, s) => t === 'minigame' && s.phase === 'play' && s.bmode === 'choose');
  await shot('bait-duel');
  await bot.handle((t, s) => (t === 'minigame' && (s.phase === 'loss' || s.phase === 'outro')) || t === 'world');
  if (await bot.top() === 'minigame') await shot('bait-itog');
  await bot.handle((t) => t === 'world');
  await bot.talkTo('denis');
  await bot.handle((t) => t === 'world');
  // в рекреацию к Матычу
  policy.floor = 1;
  await bot.useDoor(17, 1);
  await bot.handle((t, s) => t === 'world' && s.map === 'k2_f1');
  await bot.walkTo(1, 10);
  await bot.page.keyboard.down('ArrowLeft'); await bot.wait(300); await bot.page.keyboard.up('ArrowLeft');
  await bot.waitFor((s) => s.top === 'world' && s.map === 'rec_f1');
  await shot('rekreatsiya-peremena');
  await bot.talkTo('matych');
  await bot.handle((t, s) => t === 'minigame' && s.phase === 'play' && s.bmode === 'choose');
  await shot('bait-matych');
  await bot.handle((t) => t === 'world');
  // дальше по расписанию: математика, каб. 305 (корпус 1) — срез заканчивается на входе в урок 2
  bot.policy = (q, opts) => (/этаж/.test(q) ? Math.max(0, opts.findIndex((o) => o.startsWith(bot.floorWanted + ' '))) : policy(q, opts));
  await bot.goToRoom('305');
  await bot.waitFor((s) => s.top === 'dialog' || s.top === 'lesson');
  await page.waitForTimeout(900);
  await shot('urok-2-matematika');
  const state = await page.evaluate(() => JSON.parse(JSON.stringify(window.__odin.state)));
  await browser.close();
  return { seed, ms: Date.now() - t0, errors, log: bot.log, state };
}

if (process.argv[1] && process.argv[1].endsWith('bot.mjs')) {
  const [seed = 'BXT234', shots = '', style = 'cautious'] = process.argv.slice(2);
  const res = await runSlice({ seed, shots: shots || null, cheatStyle: style });
  const s = res.state;
  console.log(JSON.stringify({ seed: res.seed, sec: Math.round(res.ms / 1000), grades: s.grades, stats: s.stats, debts: s.debts, wins: s.wins, directorCalls: s.directorCalls, errors: res.errors }, null, 1));
  console.log('выборы:', res.log.map((l) => JSON.stringify(l)).join('\n'));
  if (res.errors.length) process.exit(1);
}
