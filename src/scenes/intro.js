// Вступление (раздел 13): пробуждение (текст на чёрном), остановка с Артёмом Левончуком,
// поездка в автобусе, прибытие к гимназии в 09:03. Пропуск — удерживать X.
import { DialogScene } from './dialog_scene.js';
import { DejavuScene } from './dejavu.js';
import { WorldScene } from './world.js';
import { sheetOf } from '../gen/people.js';
import { frameRect } from '../gen/sprites.js';
import { GAME_H } from '../engine/renderer.js';

export function arriveAtSchool(game) {
  const st = game.state;
  game.onSkipIntro = null;
  st.phase = 'late';
  st.lesson = 0;
  st.clock = '09:03';
  game.takeActions();
  game.scenes.reset(new WorldScene('street', 'bus', { autosave: true }), { fade: true });
}

function goBusStop(game) {
  const st = game.state;
  st.clock = '08:44';
  game.scenes.reset(new WorldScene('bus_stop', 'start', {
    onAction: (name) => { if (name === 'bus') game.scenes.reset(new BusScene(), { fade: true }); },
  }), { fade: true });
}

export class IntroScene {
  constructor() { this.id = 'intro'; this.opaque = true; this.t = 0; }
  enter(game) {
    this.game = game;
    const st = game.state;
    st.phase = 'intro';
    st.clock = '08:30';
    st.location = 'home';
    st.locationName = 'Дома';
    game.onSkipIntro = () => arriveAtSchool(game);
    game.playMusic('intro');
    const wake = () => game.scenes.push(new DialogScene('intro', 'wake', { onEnd: () => goBusStop(game) }));
    // перед понедельником — титр про дежавю (один раз за неделю)
    if (this.noDejavu) return wake();
    this.noDejavu = true;
    game.scenes.push(new DejavuScene(() => { game.scenes.pop(); game.playMusic('intro'); wake(); }));
  }
  update(dt) { this.t += dt; }
  draw(r) {
    r.rect(0, 0, 480, 270, '#000');
    r.text(this.game.state.clock, 240, 60, { align: 'center', color: '#5a5a6a', scale: 2 });
  }
}

export class BusScene {
  constructor() { this.id = 'bus'; this.opaque = true; this.t = 0; }
  enter(game) {
    this.game = game;
    game.state.clock = '08:52';
    game.state.location = 'bus';
    game.state.locationName = 'Автобус №26';
    game.playMusic('intro');
    game.scenes.push(new DialogScene('intro', 'bus', { onEnd: () => arriveAtSchool(game) }));
  }
  update(dt) { this.t += dt; }
  draw(r) {
    const t = this.t;
    r.rect(0, 0, 480, GAME_H, '#8fc3e8');
    // дальние дома
    for (let i = 0; i < 12; i++) {
      const x = ((i * 70 - t * 30) % 840 + 840) % 840 - 100;
      const h = 50 + (i * 37) % 40;
      r.rect(x, 120 - h, 60, h, '#9aa0b8');
      for (let w = 0; w < 3; w++) for (let k = 0; k < Math.floor(h / 16); k++) r.rect(x + 8 + w * 16, 126 - h + k * 16, 8, 8, '#c8d0e0');
    }
    // деревья
    for (let i = 0; i < 10; i++) {
      const x = ((i * 90 - t * 90) % 900 + 900) % 900 - 60;
      r.rect(x + 10, 110, 6, 30, '#6b4424');
      r.rect(x, 90, 26, 26, '#3f8f3f');
    }
    r.rect(0, 140, 480, 94, '#3a3a40');
    for (let i = 0; i < 10; i++) r.rect(((i * 60 - t * 200) % 600 + 600) % 600 - 60, 186, 30, 3, '#e8e8e0');
    // автобус
    const bob = Math.round(Math.sin(t * 9));
    const bx = 120, by = 72 + bob;
    r.rect(bx, by, 240, 80, '#e8b83a');
    r.rect(bx, by + 60, 240, 6, '#b8862a');
    r.rect(bx + 228, by + 8, 12, 40, '#9fd0e8');
    for (let i = 0; i < 6; i++) r.rect(bx + 10 + i * 36, by + 10, 30, 30, '#9fd0e8');
    r.text(String(this.busNo || 26), bx + 210, by + 50, { color: '#202020', scale: 2 });
    // пассажиры в окнах
    const heads = [['roma', 2], ['levonchuk', 3]];
    for (const [id, w] of heads) {
      const sh = sheetOf(id);
      const f = frameRect('right', 0);
      r.ctx.save();
      r.ctx.beginPath(); r.ctx.rect(bx + 10 + w * 36, by + 10, 30, 30); r.ctx.clip();
      r.sprite(sh, f.sx, f.sy, f.sw, f.sh, bx + 10 + w * 36 - 1, by + 14, 2);
      r.ctx.restore();
    }
    for (const wx of [bx + 40, bx + 190]) {
      const a = t * 8;
      r.rect(wx - 14, by + 66, 28, 28, '#202024');
      r.rect(wx - 4 + Math.round(Math.cos(a) * 6), by + 76 + Math.round(Math.sin(a) * 6), 8, 8, '#8a8a90');
    }
    this.game.hud.draw(r, this.game.state);
  }
}
