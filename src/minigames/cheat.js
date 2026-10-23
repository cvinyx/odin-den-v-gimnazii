// «Списывание»: вид сверху на класс, конус взгляда учителя, Z — подсматривать.
// Используется на английском (урок 1) и обществоведении (урок 7, с вопросами учителя — этап 3).
import { registerMinigame } from './registry.js';
import { CheatLogic } from './cheat_logic.js';
import { ClassroomView } from '../world/classroom_view.js';
import { lessonInfo } from '../game/day.js';
import { TEACHERS } from '../../data/teachers.js';
import { BALANCE } from '../../data/balance.js';
import { GAME_H } from '../engine/renderer.js';
import { audio } from '../engine/audio.js';

class CheatGame {
  constructor(ctx) { this.ctx = ctx; this.game = ctx.game; this.done = false; this.time = 0; }

  start(params) {
    const st = this.ctx.state;
    const l = lessonInfo(params.lesson || st.lesson || 1);
    this.view = params.view || new ClassroomView(st, l);
    const t = TEACHERS[l.teacher];
    const geo = this.view.geometry();
    this.logic = new CheatLogic(this.ctx.rng, {
      teacher: { wide: t.params.coneWidth === 'wide', ...(params.teacher || {}) },
      mul: st.lessonMul || 1,
      speedMul: st.seat === 'steal_ok' ? BALANCE.seating.stealSuccessCheatSpeed : 1,
      hungerSlow: st.stats.hunger > BALANCE.hunger.slowThreshold,
      startSuspicion: st.stats.suspicion,
      ...geo,
    });
    this.lastAnswers = 0;
    this.lastMode = 'look';
  }

  update(dt, input) {
    this.time += dt;
    const L = this.logic;
    const peek = this.botPeek ? this.botPeek(L, dt) : input.held('confirm');
    L.update(dt, peek);
    // подозрение видно в HUD в реальном времени
    this.ctx.state.stats.suspicion = Math.round(L.suspicion);
    if (L.answers > this.lastAnswers) { this.lastAnswers = L.answers; audio.play('menuSelect'); }
    if (L.mode === 'warn' && this.lastMode !== 'warn') audio.play('menuMove');
    this.lastMode = L.mode;
    this.view.roma.dir = L.peeking ? (this.view.roster.roma && this.view.roster.roma.side === 0 ? 'right' : 'left') : 'up';
    const a = L.angle;
    this.view.teacher.dir = a < 60 ? 'right' : a > 120 ? 'left' : 'down';
    if (L.finished) this.done = true;
  }

  forfeit() {
    this.logic.finished = true;
    this.logic.result = 'done';
    this.logic.answers = 0;
    return this.end();
  }

  end() {
    const L = this.logic;
    const director = L.result === 'director';
    return {
      result: director ? 'director' : L.answers >= 5 ? 'win' : 'lose',
      deltas: {}, // подозрение уже записано в состояние по ходу игры
      money: 0,
      grade: director ? BALANCE.director.grade : L.grade,
      extra: { answers: L.answers, director },
      summary: director ? 'Учитель всё видел.' : `Ответов: ${L.answers} из 10 → оценка ${L.grade}`,
    };
  }

  draw(r) {
    const L = this.logic;
    this.view.draw(r, () => {
      const g = this.view.geometry();
      const tp = g.teacherPos;
      const half = L.cfg.coneHalf;
      const sees = L.sees;
      const ctx = r.ctx;
      ctx.save();
      ctx.globalAlpha = sees && L.peeking ? 0.45 : 0.22;
      ctx.fillStyle = sees ? '#ff3030' : '#fff36a';
      ctx.beginPath();
      ctx.moveTo(tp.x, tp.y);
      ctx.arc(tp.x, tp.y, L.cfg.coneLen, (L.angle - half) * Math.PI / 180, (L.angle + half) * Math.PI / 180);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      if (L.mode === 'warn' || L.mode === 'turn') {
        const bob = L.mode === 'warn' ? Math.round(Math.sin(this.time * 40)) : 0;
        r.box(tp.x - 5 + bob, tp.y - 28, 11, 13, '#ff4a4a', '#000', 1);
        r.text('!', tp.x - 2 + bob, tp.y - 26, { color: '#ff4a4a' });
      }
      // прогресс ответа над Ромой
      const ro = this.view.roma;
      if (L.peeking || L.progress > 0) {
        r.rect(ro.x - 10, ro.y - 38, 20, 4, '#000');
        r.rect(ro.x - 9, ro.y - 37, Math.round(18 * L.progress), 2, '#6be36b');
      }
    });
    // панель игры
    r.rect(0, 0, 480, 14, '#000000');
    r.text(`Ответы: ${L.answers}/10`, 6, 3, { color: '#6be36b' });
    const left = Math.max(0, Math.ceil(L.duration - L.t));
    r.text(`0:${String(left).padStart(2, '0')}`, 240, 3, { align: 'center', color: left <= 10 ? '#ff5a5a' : '#ffffff' });
    r.text('Держи Z — списывать', 474, 3, { align: 'right', color: '#9a9aa8' });
    if (L.sees && L.peeking) r.text('ЗАМЕТИЛА!', 240, 18, { align: 'center', color: '#ff4a4a', scale: 2, shadow: '#000' });
    this.game.hud.draw(r, this.ctx.state);
  }
}

registerMinigame('cheat', {
  title: 'Списывание',
  music: 'lesson',
  keys: ['Держи Z — подсматривать у соседа', '1,5 с = один ответ, всего 10', '«!» над учителем — сейчас повернётся', 'Попался в конус — подозрение растёт'],
  describe: () => 'Контрольная. 60 секунд. Оценка = 1 + ответы.',
  create: (ctx) => new CheatGame(ctx),
});
