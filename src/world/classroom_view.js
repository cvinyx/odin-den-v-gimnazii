// Отрисовка класса с рассаженными учениками и учителем (урок и «Списывание»).
import { TileMap } from './tilemap.js';
import { Actor } from './npc.js';
import { getMapDef, ROOM_MAPS } from './maps/index.js';
import { buildRoster, seatTile, tileToFeet, TEACHER_TILE } from './classroom.js';
import { GAME_H } from '../engine/renderer.js';

export class ClassroomView {
  constructor(state, lessonInfo, opts = {}) {
    this.map = new TileMap(getMapDef(ROOM_MAPS[lessonInfo.room] || 'cab_404'));
    this.lesson = lessonInfo;
    this.opts = opts;
    this.teacher = new Actor(lessonInfo.teacher, 0, 0, 'down');
    const tf = tileToFeet({ ...TEACHER_TILE, half: true });
    this.teacher.x = tf.x; this.teacher.y = tf.y;
    this.roma = new Actor('roma', 0, 0, 'up');
    this.rebuild(state);
  }

  // Пересадить всех по текущему state.seat.
  rebuild(state) {
    const roster = buildRoster(state, this.lesson.n, { denis: this.lesson.subjectId !== 'english' });
    this.roster = roster;
    this.students = roster.seats.map((s) => {
      const f = tileToFeet(seatTile(s.c, s.d, s.side));
      const a = new Actor(s.id, f.x, f.y, 'up');
      a.seat = s;
      return a;
    });
    if (roster.roma) {
      const f = tileToFeet(seatTile(roster.roma.c, roster.roma.d, roster.roma.side));
      this.roma.x = f.x; this.roma.y = f.y; this.roma.dir = 'up';
      this.romaSeated = true;
    } else {
      // стоит у двери
      const f = tileToFeet({ x: 26, y: 2 });
      this.roma.x = f.x; this.roma.y = f.y; this.roma.dir = 'down';
      this.romaSeated = false;
    }
  }

  // Точки, куда «смотрит» учитель (головы учеников) и сам Рома — для «Списывания».
  geometry() {
    const head = (a) => ({ x: a.x, y: a.y - 12 });
    return {
      teacherPos: { x: this.teacher.x, y: this.teacher.y - 18 },
      roma: head(this.roma),
      targets: this.students.map(head),
    };
  }

  draw(r, extra) {
    r.cam.x = (this.map.pixelW - 480) / 2;
    r.cam.y = Math.max(0, this.map.pixelH - GAME_H);
    r.clip(0, 0, 480, GAME_H, () => {
      r.withCamera(() => {
        this.map.draw(r, 480, GAME_H);
        const all = [...this.students, this.roma, this.teacher].sort((a, b) => a.y - b.y);
        for (const a of all) a.draw(r);
        if (this.romaSeated && this.opts.markRoma !== false) {
          const bob = Math.round(Math.sin(r.time * 5));
          r.text('▼', this.roma.x, this.roma.y - 40 + bob, { align: 'center', color: '#ffe14d' });
        }
        if (extra) extra(r);
      });
    });
  }
}
