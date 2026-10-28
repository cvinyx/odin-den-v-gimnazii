// Этап V2-7: Эль-Класико v2 — форма, правила без карточек, штрафные и пенальти, ярость, золотой гол,
// статистика, xG, MVP, подколы и разговоры перед матчем.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { MatchLogic, pickMVP, xgFor, fmtXG } from '../src/football/match.js';
import { TEAM_COLORS, FIELD } from '../src/football/field.js';
import { Rng } from '../src/engine/rng.js';
import { BALANCE } from '../data/balance.js';
import { BANTER, SILENT } from '../data/football_banter.js';
import { parseDialog } from '../src/ui/dialog_script.js';
import { CHARACTERS } from '../data/characters.js';
import { TEACHERS } from '../data/teachers.js';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const B = BALANCE.football;
const play = (M, until, max = 60 * 400) => { for (let f = 0; f < max && !until(M); f++) { M.update(1 / 60, null); for (const e of M.events) if (e.type === 'halftime') M.secondHalf('none'); M.events.length = 0; } };
const full = (M) => play(M, (m) => m.state === 'end');
const CLUB = /реал|барс|«барс|мадрид|атлетико|псж|арсенал|интер\b|бавари|боруссия|ман сити|астон/i;
const CLUB_OK = ['shurpo', 'chernyak', 'denis', 'smile', 'guza'];

test('форма (Ф-1): «ИнЯз» в чёрном, «Физмат» в белом; жёлтых карточек нет (Ф-14), диарея 50 %', () => {
  assert.equal(TEAM_COLORS.inyaz, '#1d1d22');
  assert.equal(TEAM_COLORS.fizmat, '#f2f2f2');
  assert.equal(B.yellowChance, undefined);
  assert.equal(B.diarrheaChance, 0.5);
  let n = 0;
  for (let i = 1; i <= 400; i++) if (new MatchLogic(new Rng('d' + i), { aiRoma: true }).diarrheaAt != null) n++;
  assert.ok(n > 160 && n < 240, `диарея ${n}/400`);
});

test('выравнивание (Ф-6): у полевых скорость и навык 5–6, вратари 5–6', () => {
  for (const [id, p] of Object.entries(B.players)) { assert.ok(p.speed >= 5 && p.speed <= 6, id); assert.ok(p.skill >= 5 && p.skill <= 6, id); }
  for (const [id, r] of Object.entries(B.keepers)) assert.ok(r >= 5 && r <= 6, id);
});

test('стандарты (Ф-15): не больше 3 за тайм, время стоит, фол в штрафной — пенальти', () => {
  for (let i = 1; i <= 6; i++) {
    const M = new MatchLogic(new Rng('sp' + i), { aiRoma: true });
    full(M);
    for (const h of [1, 2, 3]) assert.ok(M.stats.setPieces[h] <= B.setPiece.perHalf);
    assert.equal(M.stats.yellows, undefined);
  }
  const M = new MatchLogic(new Rng('pen'), { aiRoma: true, diarrhea: false });
  play(M, (m) => m.state === 'play');
  const victim = M.roma, foulBy = M.team('fizmat').find((q) => !q.keeper);
  victim.x = FIELD.right - 25; victim.y = FIELD.cy;
  M.foul(foulBy, victim);
  assert.equal(M.state, 'setpiece');
  assert.ok(M.sp.penalty);
  const t = M.t;
  for (let f = 0; f < 600 && M.state === 'setpiece'; f++) M.update(1 / 60, null);
  assert.equal(M.t, t, 'время матча стоит');
  assert.ok(['goal', 'freekick'].includes(M.state));
  // четвёртый фол в тайме — без стандарта
  const N = new MatchLogic(new Rng('cap'), { aiRoma: true, diarrhea: false });
  play(N, (m) => m.state === 'play');
  N.stats.setPieces[1] = 3;
  N.foul(N.team('fizmat').find((q) => !q.keeper), N.roma);
  assert.equal(N.state, 'freekick');
});

test('ярость (Ф-7): только если Игоря разозлили, по разу в тайме, 3–5 с; суперудар всегда в ворота', () => {
  const M = new MatchLogic(new Rng('r0'), { aiRoma: true });
  full(M);
  assert.equal(M.stats.rages, 0);
  let sup = 0, own = 0, goals = 0;
  for (let i = 1; i <= 25; i++) {
    const R = new MatchLogic(new Rng('r' + i), { aiRoma: true, rageStart: true, diarrhea: false });
    let rageEvents = 0, maxRage = 0;
    for (let f = 0; f < 60 * 400 && R.state !== 'end'; f++) {
      R.update(1 / 60, null);
      for (const e of R.events) {
        if (e.type === 'halftime') R.secondHalf('none');
        if (e.type === 'rage') rageEvents++;
        if (e.type === 'goal' && R.stats.superShots > goals) goals++;
      }
      R.events.length = 0;
      const ig = R.players.find((q) => q.id === 'igor' && !q.out);
      if (ig) maxRage = Math.max(maxRage, ig.rage);
    }
    assert.ok(rageEvents >= 1 && rageEvents <= 2);
    assert.ok(maxRage <= 5.01);
    sup += R.stats.superShots; own += R.stats.ownGoals;
  }
  assert.ok(sup > 20);
  assert.ok(own / sup < 0.35);
});

test('золотой гол (Ф-8): ничья после 2-го тайма — овертайм до первого гола', () => {
  const M = new MatchLogic(new Rng('g1'), { aiRoma: true, diarrhea: false });
  play(M, (m) => m.state === 'halftime');
  M.secondHalf('none');
  M.score = { inyaz: 1, fizmat: 1 };
  M.t = B.halfSeconds;
  M.score = { inyaz: 1, fizmat: 1 };
  M.update(1 / 60, null);
  if (M.state === 'goal') M.score = { inyaz: 1, fizmat: 1 };
  assert.equal(M.half, 3);
  assert.equal(M.regResult, 'draw');
  assert.ok(M.events.some((e) => e.type === 'golden'));
  M.events.length = 0;
  for (let f = 0; f < 60 * 120 && M.state !== 'end'; f++) { M.update(1 / 60, null); M.events.length = 0; }
  assert.equal(M.state, 'end');
  assert.ok(M.t <= B.goldenSeconds + 3);
  assert.ok(M.score.inyaz + M.score.fizmat <= 3);
});

test('xG (Ф-4): ±3 от счёта, одна цифра после запятой; MVP (Ф-5): голы → ассисты → победители', () => {
  const rng = new Rng('xg');
  for (let g = 0; g < 8; g++) for (let i = 0; i < 50; i++) {
    const v = xgFor(g, rng);
    assert.ok(Math.abs(v - g) <= 3 && v >= 0);
    assert.match(fmtXG(v), /^\d+,\d$/);
  }
  const P = (id, team, goals, assists) => ({ id, team, goals, assists, keeper: false });
  assert.equal(pickMVP([P('a', 'inyaz', 1, 0), P('b', 'fizmat', 2, 0)], 'inyaz', rng), 'b');
  assert.equal(pickMVP([P('a', 'inyaz', 1, 2), P('b', 'fizmat', 1, 1)], 'fizmat', rng), 'a');
  for (let i = 0; i < 20; i++) assert.equal(pickMVP([P('a', 'inyaz', 1, 1), P('b', 'fizmat', 1, 1)], 'fizmat', rng), 'b');
  for (let i = 0; i < 20; i++) assert.ok(['c', 'd'].includes(pickMVP([P('a', 'inyaz', 0, 0), P('c', 'fizmat', 0, 0), P('d', 'fizmat', 0, 0)], 'fizmat', rng)));
  // статистика матча: голы сходятся со счётом (без автоголов)
  const M = new MatchLogic(new Rng('st'), { aiRoma: true });
  full(M);
  const s = M.summary();
  for (const t of ['inyaz', 'fizmat']) {
    const own = M.stats.ownGoals;
    assert.ok(Math.abs(s.rows[t].reduce((a, r) => a + r.goals, 0) - M.score[t]) <= own);
    assert.ok(s.rows[t].some((r) => r.keeper));
  }
  assert.ok(M.players.some((q) => q.id === s.mvp));
});

test('подколы (Ф-9): ≥ 30 фраз, примеры дословно, молчуны молчат, про клубы — только Ф-11', () => {
  const all = Object.values(BANTER).flat();
  assert.ok(all.length >= 30, `фраз ${all.length}`);
  const texts = all.map((x) => x[0]);
  for (const ex of ['Вам просто повезло!', 'Да я сегодня не в ресурсе', 'Шар как обычно симулировал', 'Типо это первый раз, когда вы победили',
    'Да у вас всякая шара залетает', 'Какую-то рандомную пенку поставили, как обычно',
    'Да вы видели, как вы вообще играете? Типо если бы не [Имя игрока], то вы бы точно отсосали']) assert.ok(texts.includes(ex), ex);
  for (const [t, who] of all) {
    if (who) assert.ok(!SILENT.includes(who));
    if (CLUB.test(t)) assert.ok(CLUB_OK.includes(who), `клуб без Ф-11: ${t}`);
    assert.ok(!new RegExp('Анус|Бо' + 'дак').test(t));
  }
  assert.deepEqual([...SILENT].sort(), ['anosov', 'vadim', 'vitalik', 'zakha']);
});

test('перед матчем (Ф-10…Ф-13): ≥ 12 разговоров во вторник и свои в пятницу, 2–5 участников, без молчунов', () => {
  const speakers = (id) => id in CHARACTERS || id in TEACHERS;
  const d = parseDialog(fs.readFileSync(path.join(root, 'data/dialogs/lesson_pe.txt'), 'utf8'), { speakers });
  assert.equal(d.errors.length, 0, d.errors.join('\n'));
  const pm = Object.keys(d.labels).filter((l) => /^pm\d+$/.test(l)), pf = Object.keys(d.labels).filter((l) => /^pf\d+$/.test(l));
  assert.ok(pm.length >= 12 && pf.length >= 4);
  for (const l of [...pm, ...pf]) {
    const says = d.labels[l].cmds.filter((c) => c.type === 'say' && c.who !== 'narrator');
    const who = new Set(says.map((c) => c.who));
    assert.ok(who.size >= 2 && who.size <= 5, l);
    for (const c of says) {
      assert.ok(!SILENT.includes(c.who), `${l}: молчун ${c.who}`);
      if (CLUB.test(c.text)) assert.ok(CLUB_OK.includes(c.who), `${l}: ${c.who} про клубы`);
    }
  }
  // судья в матче — только о нарушениях
  const f = parseDialog(fs.readFileSync(path.join(root, 'data/dialogs/football.txt'), 'utf8'), { speakers });
  const ref = Object.keys(f.labels).filter((l) => f.labels[l].cmds.some((c) => c.type === 'say' && c.who === 'ivan') && l !== 'halftime');
  assert.deepEqual(ref.sort(), ['ref_foul', 'ref_hand', 'ref_penalty', 'ref_play_on']);
});
