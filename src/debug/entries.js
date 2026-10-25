// Пункты отладочного меню. Новые этапы добавляют свои через registerDebug(группа, подпись, действие).
import { registerDebug } from './registry.js';
import { FontTestScene } from '../scenes/font_test.js';
import { GalleryScene } from '../scenes/gallery.js';
import { CastSheetScene } from '../scenes/cast_sheet.js';
import { TestRoomScene } from '../scenes/test_room.js';
import { TitleScene } from '../scenes/title.js';
import { DialogScene } from '../scenes/dialog_scene.js';
import { WorldScene } from '../scenes/world.js';
import { LessonScene } from '../scenes/lesson_scene.js';
import { IntroScene } from '../scenes/intro.js';
import { MinigameScene } from '../scenes/minigame_scene.js';
import { EndingScene } from '../scenes/ending.js';
import { ENDINGS, ENDING_TITLES } from '../game/endings.js';
import { SchoolMapScene } from '../scenes/school_map.js';
import { BuffetScene } from '../scenes/buffet.js';
import { DAYS } from '../../data/schedule.js';
import { NPC_SCHEDULE } from '../../data/npc_schedule.js';
import { startBreak, startDay, todaySchedule, lastLesson, lessonGraded, weekAverage } from '../game/day.js';
import { MorningScene } from '../scenes/day_flow.js';
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

// Подготовить день: уроки 1..done уже прошли (оценка 5, на уроках без оценки — прочерк).
function prepareDay(game, done) {
  freshDay(game);
  const st = game.state;
  st.grades = [];
  for (let i = 0; i < done; i++) st.grades[i] = lessonGraded(st, i + 1) ? 5 : null;
  st.week.grades[st.day - 1] = [...st.grades];
  st.late = done === 0 && st.day === 1;
}

// Оценки со средним avg: все уроки дней до day и первые doneToday уроков дня day. Возвращает число оценок.
function fillWeek(st, avg, day, doneToday) {
  const slots = [];
  for (let d = 1; d <= day; d++) {
    const n = d < day ? lastLesson(d) : doneToday;
    st.week.grades[d - 1] = [];
    for (let i = 1; i <= n; i++) {
      if (lessonGraded(st, i, d)) slots.push([d, i]);
      st.week.grades[d - 1][i - 1] = null;
    }
  }
  const target = Math.round(avg * slots.length);
  const base = Math.floor(target / Math.max(1, slots.length));
  const vals = slots.map((_, k) => base + (k < target - base * slots.length ? 1 : 0));
  // парами ±1, чтобы оценки были разными, а сумма — прежней
  for (let k = 0; k + 1 < vals.length; k += 2) if (vals[k] < 10 && vals[k + 1] > 1) { vals[k]++; vals[k + 1]--; }
  slots.forEach(([d, i], k) => { st.week.grades[d - 1][i - 1] = vals[k]; });
  st.grades = [...st.week.grades[day - 1]];
  return slots.length;
}

export function registerDebugEntries() {
  registerDebug('Сцены', 'Шрифт', (game) => overTitle(game, new FontTestScene()));
  registerDebug('Сцены', 'Галерея', (game) => overTitle(game, new GalleryScene()));
  registerDebug('Сцены', 'Лист персонажей', (game) => overTitle(game, new CastSheetScene()));
  registerDebug('Сцены', 'Тестовая комната', (game) => game.scenes.reset(new TestRoomScene(), { fade: true }));
  registerDebug('Сцены', 'Главное меню', (game) => game.scenes.reset(new TitleScene(), { fade: true }));
  // Концовки недели: пятница после последнего урока, средний балл — внутри границ концовки (Р-5)
  const ENDING_AVG = { pride: 8.6, bntu: 7.0, habza: 5.0, dad: 3.0 };
  for (const k of ENDINGS) {
    registerDebug('Концовки', 'Концовка: ' + ENDING_TITLES[k], (game) => {
      game.newDay(generateSeedCode());
      const st = game.state;
      startDay(st, 5);
      fillWeek(st, ENDING_AVG[k], 5, lastLesson(5));
      st.lesson = lastLesson(5);
      st.week.matches[2] = { score: '3:2', result: 1 };
      st.flags.matchResult = -1; st.flags.matchScore = '1:4';
      st.week.directorCalls = 2;
      st.debts = [{ to: 'igor', amount: 150 }, { to: 'matych', amount: 80 }];
      st.playTime = 4 * 3600 + 120;
      game.scenes.reset(new EndingScene(k), { fade: true });
    });
  }
  // Средний балл X: прошедшие уроки недели получают оценки со средним X. Если уроков ещё не было —
  // заполняются понедельник–четверг и игра переходит к утру пятницы.
  let avgX = 6;
  registerDebug('Неделя', 'Поставить средний балл', (game) => {
    freshDay(game);
    const st = game.state;
    let n = fillWeek(st, avgX, st.day, st.grades.length);
    if (!n) {
      startDay(st, 5);
      n = fillWeek(st, avgX, 5, 0);
      game.scenes.reset(new MorningScene(), { fade: true });
    }
    game.toast(`Средний за неделю: ${weekAverage(st).toFixed(2)} (${n} оценок)`);
  }, { value: () => String(avgX), change: (d) => { avgX = Math.max(2, Math.min(10, avgX + d)); }, set: (v) => { avgX = Number(v); } });
  let dayPick = 1;
  registerDebug('Неделя', 'Начать с дня', (game) => {
    game.newDay(generateSeedCode());
    if (dayPick === 1) { game.scenes.reset(new IntroScene(), { fade: true }); return; }
    const st = game.state;
    startDay(st, dayPick);
    fillWeek(st, 6, dayPick, 0);
    game.autosave();
    game.scenes.reset(new MorningScene(), { fade: true });
  }, { value: () => DAYS[dayPick - 1], change: (d) => { dayPick = Math.max(1, Math.min(5, dayPick + d)); }, set: (v) => { dayPick = Number(v); } });
  registerDebug('Неделя', 'Дорога домой (автобус)', (game) => {
    freshDay(game);
    const st = game.state;
    prepareDay(game, lastLesson());
    st.phase = 'break'; st.lesson = lastLesson();
    import('../scenes/day_flow.js').then(({ goHome }) => goHome(game));
  });
  registerDebug('Сцены', 'Схема школы', (game) => game.scenes.push(new SchoolMapScene()));
  registerDebug('Сцены', 'Буфет', (game) => game.scenes.push(new BuffetScene()));

  registerDebug('День', 'Вступление', (game) => { game.newDay(generateSeedCode()); game.scenes.reset(new IntroScene(), { fade: true }); });
  registerDebug('День', 'У входа, 09:03', (game) => {
    freshDay(game);
    Object.assign(game.state, { phase: 'late', lesson: 0, clock: '09:03', late: true });
    game.scenes.reset(new WorldScene('street', 'bus'), { fade: true });
  });
  // Переход к любому уроку текущего дня (←→ — номер урока; прошлые оценки — 5).
  let lessonPick = 1;
  registerDebug('День', 'Урок', (game) => {
    const n = Math.min(lessonPick, lastLesson());
    prepareDay(game, n - 1);
    game.state.phase = 'late';
    if (n > 1) { game.state.phase = 'break'; game.state.lesson = n - 1; }
    game.scenes.reset(new LessonScene(n), { fade: true });
  }, {
    value: () => { const l = todaySchedule()[Math.min(lessonPick, lastLesson()) - 1]; return `${l.n}. ${l.short}`; },
    change: (d) => { lessonPick = Math.max(1, Math.min(7, lessonPick + d)); },
    set: (v) => { lessonPick = Number(v); },
  });
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
  const students = ['guza', 'igor', 'denis', 'chernyak', 'shurpo', 'levonchuk', 'bochko', 'matych', 'buy', 'smile', 'vadim', 'vitalik', 'zakha', 'anosov', 'безымянный'];
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

  // ---------- Этап 5: Эль-Класико ----------
  const match = (params) => (game) => {
    freshDay(game); Object.assign(game.state, { phase: 'lesson', lesson: 5 });
    game.scenes.push(new MinigameScene('football', { params: { lesson: 5, ...params } }));
  };
  registerDebug('Эль-Класико', 'Матч сразу', match({}));
  registerDebug('Эль-Класико', 'ИИ против ИИ', match({ aiRoma: true }));
  registerDebug('Эль-Класико', 'ИИ против ИИ ×4', match({ aiRoma: true, speed: 4 }));
  registerDebug('Эль-Класико', 'Диарея Смайла сразу', match({ diarrhea: true, diarrheaSoon: true }));
  registerDebug('Эль-Класико', 'Ярость Игоря', (game) => { match({})(game); game.state.flags.igorRage = true; });
  registerDebug('Эль-Класико', 'Физра вторника целиком (раздевалка → матч → душ)', (game) => {
    game.newDay(generateSeedCode());
    startDay(game.state, 2);
    const n = todaySchedule().findIndex((l) => l.subjectId === 'pe_football') + 1;
    prepareDay(game, n - 1);
    Object.assign(game.state, { phase: 'break', lesson: n - 1 });
    game.scenes.reset(new LessonScene(n), { fade: true });
  });

  // V2-1: новые и переименованные персонажи в диалоге (на фоне их места на перемене)
  for (const [label, id, file, lab, map, b] of [
    ['Ваня Максимов', 'vanya', 'break1', 'vanya', 'c3_f2', 1],
    ['Святослав Гулько', 'svyat', 'break1', 'svyat', 'c3_f2', 1],
    ['Миша Аносов', 'anosov', 'break1', 'anosov', 'c2_f4', 1],
    ['Иван Владимирович', 'ivan', 'lesson_pe', 'intro', 'locker_room', 4],
    ['Василий', 'vasily', 'staff', 'vasily', 'c1_f1', 3],
  ]) {
    registerDebug('Персонажи', label + ' (диалог)', (game) => {
      prepareDay(game, b);
      startBreak(game.state, b);
      game.scenes.transition(() => {
        game.scenes.reset(new WorldScene(map, null));
        game.scenes.push(new DialogScene(file, lab, { opp: id }));
      });
    });
  }

  // ---------- V2-4: тесты, списывание, плавание, классный час ----------
  const lessonGame = (id, params, setup) => (game) => {
    freshDay(game);
    const st = game.state;
    Object.assign(st, { phase: 'lesson', lesson: params.lesson || 1 });
    if (setup) setup(st);
    game.scenes.push(new MinigameScene(id, { params }));
  };
  registerDebug('Уроки V2-4', 'Тест: выбор (сидит с Игорем)', lessonGame('test', { lesson: 1 }, (st) => { st.seat = 'igor'; }));
  registerDebug('Уроки V2-4', 'Тест: сидит один (только сам / телефон)', lessonGame('test', { lesson: 2 }, (st) => { st.seat = 'front'; st.stats.battery = 60; }));
  registerDebug('Уроки V2-4', 'Тест: один и телефон сел', lessonGame('test', { lesson: 2 }, (st) => { st.seat = 'front'; st.stats.battery = 0; }));
  registerDebug('Уроки V2-4', 'Списывание с телефона, учитель идёт по рядам', lessonGame('cheat', { lesson: 2, phone: true, walk: 'now' }, (st) => { st.seat = 'front'; }));
  registerDebug('Уроки V2-4', 'Урок английского (класс вдвое меньше)', (game) => {
    prepareDay(game, 0);
    game.scenes.reset(new LessonScene(1), { fade: true });
  });
  registerDebug('Уроки V2-4', 'Плавание (мини-игра)', lessonGame('swim', { lesson: 3, swimmers: ['igor', 'denis', 'guza', 'matych'], bench: ['buy'] }));
  registerDebug('Уроки V2-4', 'Плавание: Рома забыл форму', lessonGame('swim', { lesson: 3, romaBench: true, swimmers: ['igor', 'denis', 'guza', 'matych', 'buy'] }));
  registerDebug('Уроки V2-4', 'Душ у бассейна', lessonGame('shower', { lesson: 3, friends: ['igor', 'denis'] }));
  registerDebug('Уроки V2-4', 'Плавание: четверг, урок целиком', (game) => {
    game.newDay(generateSeedCode());
    startDay(game.state, 4);
    const n = todaySchedule().findIndex((l) => l.subjectId === 'pe_swim') + 1;
    prepareDay(game, n - 1);
    Object.assign(game.state, { phase: 'break', lesson: n - 1 });
    game.scenes.reset(new LessonScene(n), { fade: true });
  });
  registerDebug('Уроки V2-4', 'Классный час (мини-игра)', lessonGame('classhour', { lesson: 6 }));
  registerDebug('Уроки V2-4', 'Классный час: пятница, урок целиком', (game) => {
    game.newDay(generateSeedCode());
    startDay(game.state, 5);
    const n = lastLesson();
    prepareDay(game, n - 1);
    Object.assign(game.state, { phase: 'break', lesson: n - 1 });
    game.scenes.reset(new LessonScene(n), { fade: true });
  });

  registerDebug('Сценки', 'Сообщение отца', (game) => {
    const l = labelLines('dad', 'msg_3')[0];
    game.scenes.push(new PhonePopupScene({ from: 'батя', text: l ? l.text : '', amount: 300 }));
  });
  registerDebug('Сценки', 'Ярость Игоря (сценка)', (game) => { freshDay(game); game.scenes.push(new DialogScene('bait_igor', 'rage')); });
  registerDebug('Сценки', 'Вызов к директору', (game) => { freshDay(game); game.scenes.push(new DirectorScene({})); });
  registerDebug('Мини-игры', 'Диалог с Игорем (тест)', (game) => game.scenes.transition(() => {
    game.scenes.reset(new TestRoomScene());
    game.scenes.push(new DialogScene('test', 'igor_talk'));
  }));
}
