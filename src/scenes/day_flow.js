// Неделя (EDITS_V2: Р-1…Р-4, М-6): конец дня раньше времени
// (3-й вызов к директору, «Это позор»), дорога домой в автобусе 26/38 с Артёмом Левончуком,
// утро следующего дня у входа в гимназию. После пятницы — концовка недели.
import { DialogScene } from './dialog_scene.js';
import { BusScene } from './intro.js';
import { getDialog } from '../game/dialogs.js';
import { eventRng, startDay, endDayEarly, finishLesson } from '../game/day.js';
import { pickEnding } from '../game/endings.js';
import { checkAchievements } from '../game/achievements.js';
import { DAYS } from '../../data/schedule.js';
import { BALANCE } from '../../data/balance.js';
import { sheetOf } from '../gen/people.js';
import { frameRect } from '../gen/sprites.js';

// Подходящие метки файла: имя начинается с prefix, ещё не было на этой неделе.
function pickLabel(state, file, prefix, seen, rngName) {
  const d = getDialog(file);
  const all = d.order.filter((l) => l.startsWith(prefix) && /_\d+$/.test(l));
  const fresh = all.filter((l) => !seen.includes(l));
  const pool = fresh.length ? fresh : all;
  return eventRng(state, rngName).pick(pool);
}

// День закончился раньше (Р-4): короткая сцена, потом дорога домой.
export class DayOverScene {
  constructor(reason) { this.id = 'day_over'; this.reason = reason; this.opaque = true; this.t = 0; }
  enter(game) {
    this.game = game;
    const st = game.state;
    // текущий урок закрыт оценкой вызова к директору, остальные уроки дня — минимальной
    if (st.phase === 'lesson' && st.grades[st.lesson - 1] == null) finishLesson(st, st.lesson, BALANCE.director.grade);
    endDayEarly(st, this.reason);
    st.phase = 'day_over';
    game.playMusic('director');
    game.scenes.push(new DialogScene('day_end', this.reason, { onEnd: () => goHome(game) }));
  }
  update(dt) { this.t += dt; }
  draw(r) {
    r.rect(0, 0, 480, 270, '#1a0c0c');
    r.text('ДЕНЬ ОКОНЧЕН', 240, 40, { align: 'center', color: '#ff5a5a', scale: 3, shadow: '#000' });
    r.text(DAYS[this.game.state.day - 1], 240, 76, { align: 'center', color: '#9a9aa8' });
  }
}

export function goHome(game) {
  game.scenes.reset(new BusHomeScene(), { fade: true });
}

// Дорога домой (М-6): автобус 26 или 38, с Артёмом Левончуком, разные разговоры, без повторов за неделю.
// (без extends: рисунок автобуса берём у BusScene во время отрисовки — так нет проблем с циклом импортов)
export class BusHomeScene {
  constructor() { this.id = 'bus_home'; this.opaque = true; this.t = 0; }
  update(dt) { this.t += dt; }
  enter(game) {
    this.game = game;
    const st = game.state;
    st.phase = 'home';
    st.clock = '15:40';
    this.busNo = eventRng(st, 'busno' + st.day).chance(0.5) ? 26 : 38;
    st.location = 'bus';
    st.locationName = `Автобус №${this.busNo}`;
    st.flags.busNo = this.busNo;
    game.playMusic('intro');
    for (const a of checkAchievements(st, true)) game.achQueue.push({ a, t: 0 });
    const label = pickLabel(st, 'bus_home', 'home_', st.week.busSeen, 'bushome' + st.day);
    st.week.busSeen.push(label);
    game.scenes.push(new DialogScene('bus_home', label, { opp: 'levonchuk', onEnd: () => nextDay(game) }));
  }
  draw(r) {
    BusScene.prototype.draw.call(this, r);
    r.rect(4, 4, 150, 14, '#000000aa');
    r.text(`${DAYS[this.game.state.day - 1]}, домой · №${this.busNo}`, 8, 7, { color: '#ffe14d' });
  }
}

// Следующее утро или концовка недели.
export function nextDay(game) {
  const st = game.state;
  if (st.day >= 5) {
    st.phase = 'end';
    import('./ending.js').then(({ EndingScene }) => game.scenes.reset(new EndingScene(pickEnding(st)), { fade: true }));
    return;
  }
  startDay(st, st.day + 1);
  game.autosave();
  game.scenes.reset(new MorningScene(), { fade: true });
}

// Утро вторника–пятницы (Р-3): короткая сценка у входа в гимназию, потом — свободное перемещение.
export class MorningScene {
  constructor() { this.id = 'morning'; this.opaque = true; this.t = 0; }
  enter(game) {
    this.game = game;
    const st = game.state;
    st.phase = 'late';
    st.location = 'street';
    st.locationName = 'У гимназии';
    game.playMusic('intro');
    const label = pickLabel(st, 'morning', `d${st.day}_`, st.week.morningSeen, 'morningscene' + st.day);
    st.week.morningSeen.push(label);
    game.scenes.push(new DialogScene('morning', label, {
      onEnd: () => import('./world.js').then(({ WorldScene }) => game.scenes.reset(new WorldScene('street', 'bus', { autosave: true }), { fade: true })),
    }));
  }
  update(dt) { this.t += dt; }
  draw(r) {
    const st = this.game.state;
    r.rect(0, 0, 480, 234, '#8fc3e8');
    r.rect(0, 120, 480, 114, '#9a9aa2');
    r.rect(140, 30, 200, 90, '#c9b48a');
    for (let i = 0; i < 6; i++) r.rect(152 + i * 31, 44, 18, 22, '#5a7ea8');
    r.rect(222, 80, 36, 40, '#6b4424');
    r.text('ГИМНАЗИЯ', 240, 34, { align: 'center', color: '#3a2a1a' });
    for (let i = 0; i < 5; i++) r.rect(200 - i * 6, 120 + i * 6, 80 + i * 12, 6, '#b8b8c0');
    const f = frameRect('up', 0);
    r.sprite(sheetOf('roma'), f.sx, f.sy, f.sw, f.sh, 232, 160, 2);
    r.text(`${DAYS[st.day - 1]}, ${st.clock}`, 8, 6, { color: '#ffffff', shadow: '#000' });
    this.game.hud.draw(r, st);
  }
}

