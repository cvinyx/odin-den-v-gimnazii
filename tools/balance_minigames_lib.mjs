// Прогон мини-игр этапа 4 «средним» ботом в node (без браузера): настоящий класс игры + autoplay.
// «Матыч и Буй» гоняется через чистую логику (MBLogic), т. к. его игра читает диалоги через Vite.
import { getMinigame } from '../src/minigames/registry.js';
import '../src/minigames/phone_blocks.js';
import '../src/minigames/phone_brawl.js';
import '../src/minigames/phone_feed.js';
import '../src/minigames/toilet.js';
import '../src/minigames/vape_battle.js';
import '../src/minigames/eat.js';
import '../src/minigames/shower.js';
import { MBLogic, mbBotPick } from '../src/minigames/mb_logic.js';
import { createState } from '../src/game/state.js';
import { Rng } from '../src/engine/rng.js';
import { FakeInput } from '../src/minigames/kit.js';

export const GAMES = {
  phone_blocks: { lesson: 2 }, phone_brawl: { lesson: 4 }, phone_feed: { lesson: 6 },
  toilet: { opps: ['guza', 'igor', 'denis', 'chernyak', 'shurpo', 'bochko'] },
  vape: { opps: ['chernyak', 'denis', 'shurpo', 'levonchuk', 'bochko', 'matych', 'buy'] },
  eat: { opps: ['denis', 'shurpo', 'igor', 'guza', 'matych', 'buy'] },
  bait_mb: {}, shower: {},
};

const fakeGame = { r: { shake() {} }, hud: { draw() {} } };

// Возвращает { result, frames, sec, out } или бросает ошибку.
export function runGame(id, seed, { opp = null, hunger = 30, params = {} } = {}) {
  const rng = new Rng('mg#' + id + '#' + seed);
  if (id === 'bait_mb') {
    const L = new MBLogic(rng, {});
    let guard = 0;
    while (!L.finished && guard++ < 20) { L.playRoma(mbBotPick(L, rng)); L.playFriend(); L.retort(); L.endRound(); }
    if (!L.finished) throw new Error('bait_mb не закончилась');
    return { result: L.result, sec: L.round * 15, out: { deltas: {} } };
  }
  const st = createState('KQ7M2P');
  st.stats.hunger = hunger;
  st.stats.battery = 80;
  st.stats.suspicion = 0;
  st.lesson = GAMES[id].lesson || 2;
  const meta = getMinigame(id);
  const inst = meta.create({ game: fakeGame, state: st, rng, params, opp });
  inst.autoplay = true;
  inst.start({ lesson: st.lesson, ...params });
  const input = new FakeInput();
  const dt = 1 / 60;
  let frames = 0;
  while (!inst.done) {
    inst.update(dt, input);
    if (++frames > 60 * 200) throw new Error(id + ': не закончилась за 200 с');
  }
  const out = inst.end();
  if (!['win', 'lose', 'draw', 'director'].includes(out.result)) throw new Error(id + ': странный результат ' + out.result);
  return { result: out.result, sec: frames / 60, out };
}
