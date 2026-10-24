// Проверка этапа 5 («Эль-Класико») в браузере: скриншоты (начало, гол, диарея Смайла, перерыв, итог),
// управление Ромой с клавиатуры, FPS на протяжении целого матча в реальном времени, ошибки консоли.
// Баланс 30 матчей — node tools/balance_football.mjs 30. Запуск: node tools/check_stage5.mjs [папка]
import path from 'node:path';
import fs from 'node:fs';
import { chromium } from './pw.mjs';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const shots = process.argv[2] || path.join(root, 'docs/screenshots/etap-5');
fs.mkdirSync(shots, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto('file://' + path.join(root, 'dist/index.html'));
await page.waitForTimeout(400);
const shot = (name) => page.locator('#screen').screenshot({ path: path.join(shots, name + '.png') });

// Ускоренная прокрутка кадров, пока не выполнится условие (cond — тело функции от L, sc, g).
async function stepUntil(cond, maxFrames = 60 * 400) {
  return page.evaluate(([cond, maxFrames]) => {
    const g = window.__odin;
    const sc = g.scenes.stack.find((s) => s.id === 'minigame');
    const f = new Function('L', 'sc', 'g', 'return ' + cond);
    let n = 0;
    while (n < maxFrames) {
      const top = g.scenes.top;
      if (top.id === 'dialog' && top.box) top.box.shown = 1e9;
      if (top.id === 'dialog' && top.mode !== 'choice' && n % 6 === 0) g.input.queuePressed.add('KeyZ');
      const L = sc.inst && sc.inst.L;
      if (f(L, sc, g)) return { ok: true, n };
      g.update(1 / 60); g.draw(); n++;
    }
    return { ok: false, n };
  }, [cond, maxFrames]);
}
const start = async (label, seed) => {
  await page.evaluate(([label, seed]) => {
    const g = window.__odin; g.newDay(seed);
    while (g.scenes.stack.length > 1) g.scenes.pop();
    window.__odinDebug(label);
  }, [label, seed]);
  await page.waitForTimeout(250);
};

// 1. Экран «до», начало матча, гол
await start('ИИ против ИИ', 'KQ7M2P');
await shot('01-ekran-do');
await page.evaluate(() => window.__odin.scenes.top.begin());
await stepUntil('L.state === "kickoff" && L.stateT < 0.6');
await shot('02-nachalo-matcha');
await stepUntil('L.state === "play" && L.total > 12', 60 * 30);
await shot('03-igra');
const g1 = await stepUntil('L.state === "goal" && L.stateT < 2.0');
await shot('04-gol');
// перерыв: сценка-спор с выбором
await stepUntil('g.scenes.top.id === "dialog" && g.scenes.top.mode === "choice"');
await shot('06-pereryv-vybor');
await page.keyboard.press('z');
await stepUntil('L.half === 2 && L.state === "play"');
await shot('07-vtoroy-taym-zameny');
await stepUntil('sc.phase === "outro"');
await shot('08-itog-matcha');
const res1 = await page.evaluate(() => window.__odin.scenes.stack.find((s) => s.id === 'minigame').res);
console.log('матч 1:', res1.summary, res1.result, 'оценка', res1.grade, 'гол найден:', g1.ok);

// 2. Диарея Смайла
await start('Диарея Смайла сразу', 'ZT4H9W');
await page.evaluate(() => { const t = window.__odin.scenes.top; t.begin(); t.inst.autoplay = true; });
await stepUntil('L.state === "diarrhea" && L.stateT < 2.2');
await shot('05-diareya-smayla');
await stepUntil('L.state === "play" && L.smileGone');
await shot('05b-kolya-v-vorotah');

// 3. Управление Ромой с клавиатуры (реальное время)
await start('Матч сразу', 'R8NX3E');
await page.keyboard.press('z');
await page.waitForTimeout(1600);
for (const k of ['ArrowRight', 'ArrowUp', 'ArrowRight', 'ArrowDown']) {
  await page.keyboard.down(k); await page.keyboard.down('Shift'); await page.waitForTimeout(700);
  await page.keyboard.up('Shift'); await page.keyboard.up(k);
  await page.keyboard.press('z'); await page.keyboard.press('x');
  await page.keyboard.down('c'); await page.waitForTimeout(400); await page.keyboard.up('c');
}
const ctrl = await page.evaluate(() => { const L = window.__odin.scenes.top.inst.L; return { x: Math.round(L.roma.x), stamina: L.stamina.toFixed(2), state: L.state }; });
console.log('управление Ромой:', JSON.stringify(ctrl));
await shot('09-roma-upravlenie');

// 4. FPS весь матч «ИИ против ИИ» в реальном времени
await start('ИИ против ИИ', 'BXT234');
await page.evaluate(() => window.__odin.scenes.top.begin());
const fps = [];
for (;;) {
  await page.waitForTimeout(3000);
  const s = await page.evaluate(() => {
    const g = window.__odin; const t = g.scenes.top;
    if (t.id === 'dialog') { if (t.box) t.box.shown = 1e9; g.input.queuePressed.add('KeyZ'); }
    const sc = g.scenes.stack.find((x) => x.id === 'minigame');
    return { fps: g.loop.fps, phase: sc ? sc.phase : 'нет' };
  });
  fps.push(s.fps);
  if (s.phase !== 'play') break;
  if (fps.length > 90) { errors.push('матч в реальном времени не закончился'); break; }
}
console.log('FPS по ходу матча: min', Math.min(...fps), 'среднее', (fps.reduce((a, b) => a + b, 0) / fps.length).toFixed(1), 'замеров', fps.length);
fs.writeFileSync(path.join(shots, 'fps.json'), JSON.stringify(fps));
console.log('ошибки:', errors.length ? errors : 'нет');
await browser.close();
if (errors.length) process.exit(1);
