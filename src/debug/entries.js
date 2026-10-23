// Пункты отладочного меню. Новые этапы добавляют свои через registerDebug(группа, подпись, действие).
import { registerDebug } from './registry.js';
import { FontTestScene } from '../scenes/font_test.js';
import { GalleryScene } from '../scenes/gallery.js';
import { TestRoomScene } from '../scenes/test_room.js';
import { TitleScene } from '../scenes/title.js';
import { DialogScene } from '../scenes/dialog_scene.js';
import { WorldScene } from '../scenes/world.js';
import { LessonScene } from '../scenes/lesson_scene.js';
import { IntroScene } from '../scenes/intro.js';
import { MinigameScene } from '../scenes/minigame_scene.js';
import { DayEndScene } from '../scenes/day_end.js';
import { SchoolMapScene } from '../scenes/school_map.js';
import { BuffetScene } from '../scenes/buffet.js';
import { SCHEDULE } from '../../data/schedule.js';
import { NPC_SCHEDULE } from '../../data/npc_schedule.js';
import { startBreak } from '../game/day.js';
import { generateSeedCode } from '../engine/rng.js';
import { MAPS } from '../world/maps/index.js';
import { rollBet } from '../game/bets.js';
import { PhonePopupScene } from '../scenes/phone_popup.js';
import { DirectorScene } from '../scenes/director.js';
import { labelLines } from '../game/dialogs.js';
import { makeUnnamed, getPerson } from '../gen/people.js';
import { Rng } from '../engine/rng.js';
import { BALANCE } from '../../data/balance.js';
import { VAPE_WHITELIST } from '../minigames/vape_battle.js';

// Пункт «мини-игра + соперник»: ←→ выбирают соперника, Z запускает.
function mgEntry(label, opps, launch) {
  let i = 0;
  registerDebug('Мини-игры 4', label, (game) => launch(game, opps[i]), {
    value: () => (opps[i] ? (getPerson(opps[i]) || { short: opps[i] }).short : '—'),
    change: (d) => { i = (i + d + opps.length) % opps.length; },
    set: (v) => { const k = opps.indexOf(v); if (k >= 0) i = k; },
  });
}

// Безымянный ученик 9–11 класса для парилки/туалета/еды.
function unnamedOpp() { return makeUnnamed(new Rng('debug-unnamed'), 'dbg', 'dbg_student'); }

// Открыть сцену поверх главного меню (по X вернёмся в меню).
function overTitle(game, scene) {
  game.scenes.transition(() => {
    game.scenes.reset(new TitleScene());
    game.scenes.push(scene);
  });
}

function freshDay(game) {
  if (!game.state.seed || game.state.phase === 'free' || game.state.phase === 'end') game.newDay(generateSeedCode());
}

// Подготовить день: уроки 1..done уже прошли (оценка 5).
function prepareDay(game, done) {
  freshDay(game);
  const st = game.state;
  st.grades = [];
  for (let i = 0; i < done; i++) st.grades[i] = 5;
  st.late = done === 0;
}

export function registerDebugEntries() {
  registerDebug('Сцены', 'Шрифт', (game) => overTitle(game, new FontTestScene()));
  registerDebug('Сцены', 'Галерея', (game) => overTitle(game, new GalleryScene()));
  registerDebug('Сцены', 'Тестовая комната', (game) => game.scenes.reset(new TestRoomScene(), { fade: true }));
  registerDebug('Сцены', 'Главное меню', (game) => game.scenes.reset(new TitleScene(), { fade: true }));
  registerDebug('Сцены', 'Финал дня (временный)', (game) => { freshDay(game); game.scenes.reset(new DayEndScene(), { fade: true }); });
  registerDebug('Сцены', 'Схема школы', (game) => game.scenes.push(new SchoolMapScene()));
  registerDebug('Сцены', 'Буфет', (game) => game.scenes.push(new BuffetScene()));

  registerDebug('День', 'Вступление', (game) => { game.newDay(generateSeedCode()); game.scenes.reset(new IntroScene(), { fade: true }); });
  registerDebug('День', 'У входа, 09:03', (game) => {
    freshDay(game);
    Object.assign(game.state, { phase: 'late', lesson: 0, clock: '09:03', late: true });
    game.scenes.reset(new WorldScene('street', 'bus'), { fade: true });
  });
  // Переход к любому уроку и перемене (прошлые оценки — 5).
  for (const l of SCHEDULE) {
    registerDebug('День', `Урок ${l.n} — ${l.subject}`, (game) => {
      prepareDay(game, l.n - 1);
      game.state.phase = 'late';
      if (l.n > 1) { game.state.phase = 'break'; game.state.lesson = l.n - 1; }
      game.scenes.reset(new LessonScene(l.n), { fade: true });
    });
  }
  for (let b = 1; b <= 6; b++) {
    registerDebug('День', `Перемена ${b}`, (game) => {
      prepareDay(game, b);
      startBreak(game.state, b);
      // начать там, где стоят Денис и Игорь (по таблице раздела 11)
      const map = NPC_SCHEDULE.denis[b];
      game.scenes.reset(new WorldScene(map, null), { fade: true });
    });
  }

  for (const id of Object.keys(MAPS)) {
    registerDebug('Локации', id, (game) => {
      freshDay(game);
      if (game.state.phase === 'lesson' || game.state.phase === 'intro') { game.state.phase = 'break'; game.state.lesson = game.state.lesson || 1; }
      game.scenes.reset(new WorldScene(id, null), { fade: true });
    });
  }

  registerDebug('Мини-игры', 'Списывание (урок 1)', (game) => {
    freshDay(game);
    game.state.phase = 'lesson'; game.state.lesson = 1; game.state.seat = 'igor';
    game.scenes.push(new MinigameScene('cheat', { params: { lesson: 1 } }));
  });
  for (const opp of ['igor', 'denis', 'matych', 'buy', 'guza', 'levonchuk']) {
    registerDebug('Мини-игры', 'Байт-дуэль: ' + opp, (game) => {
      freshDay(game);
      game.scenes.push(new MinigameScene('bait', { opp, bet: rollBet(game.state, opp), params: { opp } }));
    });
  }
  registerDebug('Мини-игры', 'Байт на уроке: igor', (game) => {
    freshDay(game);
    game.state.phase = 'lesson'; game.state.lesson = 1;
    game.scenes.push(new MinigameScene('bait', { opp: 'igor', params: { opp: 'igor', inLesson: true } }));
  });
  // ---------- Этап 4: любая мини-игра с любым соперником ----------
  const students = ['guza', 'igor', 'denis', 'chernyak', 'shurpo', 'levonchuk', 'bochko', 'matych', 'buy', 'smile', 'vadim', 'vitalik', 'zakha', 'anus', 'безымянный'];
  const real = (o) => (o === 'безымянный' ? unnamedOpp() : o);
  const phone = (id, lesson, extra = {}) => (game) => {
    freshDay(game);
    Object.assign(game.state, { phase: 'lesson', lesson });
    game.scenes.push(new MinigameScene(id, { params: { lesson, ...extra } }));
  };
  registerDebug('Мини-игры 4', 'Телефон: блок-пазл (урок 2)', phone('phone_blocks', 2));
  registerDebug('Мини-игры 4', 'Телефон: броулер (урок 4)', phone('phone_brawl', 4));
  registerDebug('Мини-игры 4', 'Телефон: броулер с Денисом (кооп)', phone('phone_brawl', 4, { coop: true }));
  registerDebug('Мини-игры 4', 'Телефон: лента (урок 6)', phone('phone_feed', 6));
  registerDebug('Мини-игры 4', 'Телефон: короткая (урок 1, 25 с)', phone('phone_feed', 1, { short: true }));
  mgEntry('Царь туалета', students, (game, o) => {
    freshDay(game); game.state.phase = 'break'; game.state.lesson = 1;
    const opp = real(o);
    game.scenes.push(new MinigameScene('toilet', { opp, bet: rollBet(game.state, opp), params: { opp } }));
  });
  mgEntry('Кто больше парит', [...VAPE_WHITELIST, 'безымянный'], (game, o) => {
    freshDay(game); game.state.phase = 'break'; game.state.lesson = 1;
    const opp = real(o);
    game.scenes.push(new MinigameScene('vape', { opp, bet: rollBet(game.state, opp), params: { opp } }));
  });
  mgEntry('Кто больше парит (завуч рядом)', VAPE_WHITELIST, (game, opp) => {
    freshDay(game); game.state.phase = 'break'; game.state.lesson = 1;
    game.scenes.push(new MinigameScene('vape', { opp, params: { opp, patrolNear: true },
      onDone: (res) => { if (res && res.extra && res.extra.caught) game.scenes.push(new DirectorScene({})); } }));
  });
  mgEntry('Кто больше съест', students, (game, o) => {
    freshDay(game); Object.assign(game.state, { phase: 'break', lesson: 3 });
    if (game.state.stats.money < BALANCE.eat.entry) game.state.stats.money = BALANCE.eat.entry;
    const opp = real(o);
    game.scenes.push(new MinigameScene('eat', { opp, params: { opp } }));
  });
  mgEntry('Матыч и Буй (друг)', ['denis', 'igor', 'chernyak', 'shurpo', 'levonchuk', 'bochko'], (game, friend) => {
    freshDay(game); game.state.phase = 'break'; game.state.lesson = 1;
    game.scenes.push(new MinigameScene('bait_mb', { opp: 'matych', params: { friend } }));
  });
  mgEntry('Душ (друзья)', ['igor,denis', 'denis,chernyak', 'igor,shurpo', 'chernyak,shurpo'], (game, f) => {
    freshDay(game); Object.assign(game.state, { phase: 'lesson', lesson: 5 });
    game.scenes.push(new MinigameScene('shower', { params: { lesson: 5, friends: f.split(',') } }));
  });

  registerDebug('Сценки', 'Сообщение отца', (game) => {
    const l = labelLines('dad', 'msg_3')[0];
    game.scenes.push(new PhonePopupScene({ from: 'батя', text: l ? l.text : '', amount: 300 }));
  });
  registerDebug('Сценки', 'Берсерк Игоря', (game) => { freshDay(game); game.scenes.push(new DialogScene('bait_igor', 'berserk')); });
  registerDebug('Сценки', 'Вызов к директору', (game) => { freshDay(game); game.scenes.push(new DirectorScene({})); });
  registerDebug('Мини-игры', 'Диалог с Игорем (тест)', (game) => game.scenes.transition(() => {
    game.scenes.reset(new TestRoomScene());
    game.scenes.push(new DialogScene('test', 'igor_talk'));
  }));
}
