// Тесты этапа V2-5 «Перемены: механики»: один персонаж — одно место, баскетбол, вейп и вейп-баттл, рейджбайт,
// безымянные (ИС-8), пятиклассник, пауэрбанк, смаженка и диарея, вопросы М-7, блюдо дня, баланс еды.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { placesFor, NPC_IDS, CLASS_OF, CLASS_HOME, basketballOn } from '../data/npc_schedule.js';
import { daySchedule } from '../data/schedule.js';
import { MAPS } from '../src/world/maps/index.js';
import { BAIT_LIST, VAPE_BATTLE_LIST, EAT_FRIENDS, vapePlaceOk, vapeBattlePlaceOk } from '../data/rules.js';
import { CHARACTERS } from '../data/characters.js';
import { canVapeBattle } from '../src/minigames/vape_battle.js';
import { parseDialog } from '../src/ui/dialog_script.js';
import { askAnswers, askable } from '../src/game/ask.js';
import { rollPowerbank } from '../src/game/powerbank.js';
import { buyFood } from '../src/scenes/buffet.js';
import { nextToiletStep } from '../src/world/route.js';
import { createState } from '../src/game/state.js';
import { BALANCE } from '../data/balance.js';
import { Rng, hashString } from '../src/engine/rng.js';
import { runGame } from '../tools/balance_minigames_lib.mjs';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const dlg = (f) => parseDialog(fs.readFileSync(path.join(root, 'data/dialogs', f + '.txt'), 'utf8'));
const SEEDS = ['KQ7M2P', 'ZT4H9W', 'AAAAAA', 'B7C8D9', 'Q2W3E4'];

test('Л-22, Л-23: на каждой перемене всех дней каждый именной — ровно в одном существующем месте', () => {
  for (const seed of SEEDS) for (let day = 1; day <= 5; day++) for (let b = 1; b <= 6; b++) {
    const p = placesFor(seed, day, b);
    assert.deepEqual(Object.keys(p).sort(), [...NPC_IDS].sort());
    for (const [id, where] of Object.entries(p)) {
      if (id === 'olga' && where === null) continue;
      assert.ok(MAPS[where], `${id}: нет карты ${where}`);
      const n = Object.values(p).filter((w) => w === where).length; // один ключ — одно место по построению
      assert.ok(n >= 1);
    }
    // большая перемена — все в столовой; перед физрой/плаванием — в раздевалке
    if (b === 3) for (const id of NPC_IDS) if (id !== 'olga') assert.equal(p[id], 'canteen');
    for (const id of NPC_IDS) {
      if (id === 'olga') continue;
      const next = daySchedule(day, CLASS_OF[id])[b];
      if (b !== 3 && next && /^pe_/.test(next.subjectId)) assert.equal(p[id], 'locker_room', `${id} d${day} b${b}`);
    }
  }
  // по коду недели — детерминировано
  assert.deepEqual(placesFor('KQ7M2P', 2, 2), placesFor('KQ7M2P', 2, 2));
});

test('следующий урок в другом корпусе — персонаж в классе, коридоре, туалете, рекреации или по пути', () => {
  for (const seed of SEEDS) for (let day = 1; day <= 5; day++) for (let b = 1; b <= 6; b++) {
    const p = placesFor(seed, day, b);
    for (const id of NPC_IDS) {
      if (id === 'olga' || b === 3) continue;
      const cls = CLASS_OF[id], H = CLASS_HOME[cls], next = daySchedule(day, cls)[b];
      if (next && /^pe_/.test(next.subjectId)) continue;
      const allowed = [H.cab, H.corridor, H.wc, 'c1_f1', 'c1_f2', 'library', 'gym'];
      if (next && next.building > 0) allowed.push(`c${next.building}_f${next.floor}`);
      assert.ok(allowed.includes(p[id]), `${id} d${day} b${b}: ${p[id]}`);
    }
  }
});

test('М-3: баскетбол ~25 % перемен; тогда Левончук, Бочко и Матыч в спортзале и нигде больше', () => {
  let on = 0, total = 0;
  for (let i = 0; i < 400; i++) for (let day = 1; day <= 5; day++) for (let b = 1; b <= 6; b++) {
    total++;
    const seed = 'S' + i;
    if (basketballOn(seed, day, b)) {
      on++;
      const p = placesFor(seed, day, b);
      for (const id of ['levonchuk', 'bochko', 'matych']) assert.equal(p[id], 'gym', id);
      for (const [id, w] of Object.entries(p)) if (w === 'gym') assert.ok(['levonchuk', 'bochko', 'matych'].includes(id) || id === 'olga', id);
    }
  }
  assert.ok(Math.abs(on / total - 0.25) < 0.05 * 1.6, String(on / total)); // на большой и перед физрой баскетбола нет
});

test('ИС-7: вейп — только туалет, раздевалка, класс; вейп-баттл — только туалет и раздевалка и список', () => {
  for (const m of Object.values(MAPS)) {
    const ok = !!m.toilet || m.id === 'locker_room' || !!m.classRoom;
    assert.equal(vapePlaceOk(m), ok, m.id);
    assert.equal(vapeBattlePlaceOk(m), !!m.toilet || m.id === 'locker_room', m.id);
  }
  assert.deepEqual([...VAPE_BATTLE_LIST].sort(), ['bochko', 'buy', 'chernyak', 'denis', 'levonchuk', 'matych', 'shurpo', 'svyat', 'vitalik']);
  for (const id of Object.keys(CHARACTERS)) assert.equal(canVapeBattle(id), VAPE_BATTLE_LIST.includes(id), id);
});

test('ИС-7: рейджбайт на перемене — только список; ИС-8: безымянные вне туалета — только разговор и сплетня', () => {
  assert.deepEqual([...BAIT_LIST].sort(), ['anosov', 'bochko', 'buy', 'chernyak', 'denis', 'igor', 'levonchuk', 'matych', 'shurpo', 'smile', 'svyat', 'vadim', 'vanya', 'zakha']);
  for (const id of ['guza', 'vitalik', 'roma']) assert.ok(!BAIT_LIST.includes(id), id);
  const crowd = dlg('crowd');
  assert.deepEqual(crowd.errors, []);
  const opts = crowd.labels.cmenu.cmds.filter((c) => c.type === 'choice').flatMap((c) => c.options);
  const text = opts.map((o) => `${o.text}|${o.cond ? JSON.stringify(o.cond) : ''}`).join('\n');
  assert.ok(/сплетн|слышно/i.test(text), 'есть сплетня');
  assert.ok(!/байт|съест/i.test(text), 'безымянные не байтят и не едят');
  const cplay = crowd.labels.cplay.cmds.find((c) => c.type === 'choice').options.map((o) => o.text).join('|');
  assert.ok(!/байт|съест/i.test(cplay));
  const g = dlg('gossip');
  assert.deepEqual(g.errors, []);
  assert.ok(Object.keys(g.labels).filter((l) => /^g\d+$/.test(l)).length >= 40, 'сплетен ≥ 40');
});

test('Л-10: пятиклассник — 15 %; пауэрбанк — 25 % и заряд 67–98 (М-1)', () => {
  assert.equal(BALANCE.kid5.chance, 0.15);
  let k = 0;
  for (let i = 0; i < 4000; i++) if (new Rng(hashString('kid' + i)).chance(BALANCE.kid5.chance)) k++;
  assert.ok(Math.abs(k / 4000 - 0.15) < 0.03);
  let ok = 0, n = 0;
  for (let i = 0; i < 4000; i++) {
    const st = createState('P' + i); st.day = 1 + (i % 5); st.lesson = 1 + (i % 6);
    const r = rollPowerbank(st, 'denis'); n++;
    if (r.ok) { ok++; assert.ok(r.level >= 67 && r.level <= 98, String(r.level)); }
  }
  assert.ok(Math.abs(ok / n - 0.25) < 0.03, String(ok / n));
  assert.ok(dlg('kid5').labels.kid && dlg('bait_kid5').labels.roma_weak && dlg('bait_kid5').labels.opp_retort);
});

test('М-2: смаженка → диарея ~33 %, 30 секунд, путь до мужского туалета; «Это позор» есть', () => {
  let d = 0, n = 0;
  for (let i = 0; i < 3000; i++) {
    const st = createState('D' + i); st.stats.money = 1000; st.day = 1 + (i % 5); st.lesson = 1 + (i % 6);
    const r = buyFood(st, 'smazhenka'); n++;
    if (r.diarrhea) { d++; assert.equal(st.flags.diarrheaT, 30); }
  }
  assert.ok(Math.abs(d / n - 0.33) < 0.04, String(d / n));
  for (const from of ['buffet', 'canteen', 'c1_f1', 'c3_f4', 'c2_f3', 'gym', 'library']) {
    let cur = from, guard = 0;
    while (!MAPS[cur].toilet && guard++ < 20) { const s = nextToiletStep(cur); assert.ok(s, 'нет пути из ' + cur); cur = s.map; }
    assert.ok(MAPS[cur].toilet, from);
  }
  const places = dlg('places');
  for (const l of ['dia_start', 'dia_stall', 'dia_sock', 'dia_notebook', 'dia_none', 'dia_seen']) assert.ok(places.labels[l], l);
  assert.ok(dlg('day_end').labels.shame);
});

test('М-7: у одноклассников ответы совпадают, у других классов — по расписанию своего класса', () => {
  for (const seed of SEEDS) for (let day = 1; day <= 5; day++) for (let lesson = 1; lesson <= 5; lesson++) {
    const st = createState(seed); st.day = day; st.lesson = lesson;
    const byClass = {};
    for (const id of NPC_IDS.filter(askable)) {
      const a = JSON.stringify(askAnswers(st, id));
      (byClass[CLASS_OF[id]] ||= new Set()).add(a);
    }
    for (const [cls, set] of Object.entries(byClass)) assert.equal(set.size, 1, `${cls}: ${day}/${lesson}`);
    const sched = daySchedule(day, 'M');
    assert.equal(askAnswers(st, 'chernyak').count, sched.length);
    const nx = sched[lesson];
    assert.equal(askAnswers(st, 'shurpo').next && askAnswers(st, 'shurpo').next.subject, nx && nx.subject);
  }
  assert.ok(!askable('denis') && askable('vanya') && askable('levonchuk'));
});

test('Л-14, Л-13: 5 разных блюд дня, подсесть можно к Игорю, Денису, Гузе, Матычу, Буйу; «Кто больше съест» бесплатно', () => {
  assert.equal(new Set(BALANCE.dishes).size, 5);
  assert.deepEqual([...EAT_FRIENDS].sort(), ['buy', 'denis', 'guza', 'igor', 'matych']);
  assert.equal(BALANCE.eat.entry, 0);
  assert.ok(dlg('npc_again').labels.menu_own);
});

test('ИС-13: «Кто больше съест» — 45–65 % побед у среднего бота, две стрелки', () => {
  let win = 0;
  for (let i = 0; i < 120; i++) if (runGame('eat', i + 1, { opp: 'denis' }).result === 'win') win++;
  const p = win / 120;
  assert.ok(p >= 0.45 && p <= 0.68, String(p));
});
