// Проверка этапа V2-7 в браузере: форма и зрители, штрафной, пенальти, ярость, золотой гол, статистика
// с xG и MVP, подколы; целый матч «ИИ против ИИ» ×4 до итогов и FPS. Скриншоты — docs/screenshots/v2-7/.
import path from 'node:path';
import fs from 'node:fs';
import { chromium } from './pw.mjs';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const shots = process.argv[2] || path.join(root, 'docs/screenshots/v2-7');
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
const press = async (k, ms = 250) => { await page.keyboard.press(k); await page.waitForTimeout(ms); };
const startGame = async (label) => { await dbg(label); await page.waitForTimeout(700); await press('z', 500); };
const G = (fn) => page.evaluate(`(() => { const s = window.__odin.scenes; const g = ([...s.stack].reverse().find((x) => x.inst && x.inst.L) || s.top).inst; return (${fn})(g); })()`);
async function waitFor(fn, sec) { for (let i = 0; i < sec * 10; i++) { if (await G(fn)) return true; await page.waitForTimeout(100); } return false; }
const res = {};

await startGame('Матч сразу');
await page.waitForTimeout(1500);
await shot('01-forma-i-zriteli');
await page.waitForTimeout(1500);
res.fps = await page.evaluate(() => new Promise((ok) => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < 2000) requestAnimationFrame(f); else ok(Math.round(n / 2)); }; requestAnimationFrame(f); }));

await startGame('Штрафной сразу');
res.free = await waitFor('(g) => g.L.sp && g.L.sp.phase === "aim"', 8);
await page.waitForTimeout(600);
await shot('02-shtrafnoy-pricel');

await startGame('Пенальти сразу');
await waitFor('(g) => g.L.sp && g.L.sp.phase === "aim"', 8);
res.penalty = await G('(g) => g.L.sp.penalty');
await page.waitForTimeout(500); await press('z', 700); await press('z', 1200);
res.penaltyResult = await G('(g) => g.L.sp && g.L.sp.result');
await shot('03-penalti-udar');

await startGame('Ярость Игоря');
await G('(g) => { g.autoplay = true; }');
res.rage = await waitFor('(g) => g.L.players.some((q) => q.id === "igor" && q.rage > 0)', 30);
await page.waitForTimeout(400);
await shot('04-yarost-igorya');

await startGame('Золотой гол (ничья в конце)');
res.golden = await waitFor('(g) => g.L.half === 3', 12);
await page.waitForTimeout(400);
await shot('05-zolotoy-gol');

await startGame('ИИ против ИИ ×4');
res.full = await waitFor('(g) => !!g.post', 120);
res.post = await G('(g) => ({ score: g.L.score, xg: g.sum.xg, mvp: g.sum.mvp, lines: g.post.lines })');
await page.waitForTimeout(300);
await shot('06-statistika-xg-mvp');
await waitFor('(g) => g.post.phase === "banter"', 8);
await page.waitForTimeout(300);
await shot('07-podkoly');

await browser.close();
console.log(JSON.stringify({ res, errors }, null, 1));
if (errors.length) process.exit(1);
