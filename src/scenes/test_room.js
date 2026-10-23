// Тестовая комната (этап 1): Рома ходит и бегает, два NPC, разговор по Z, выбор меняет статусы в HUD.
import { TileMap } from '../world/tilemap.js';
import { Actor, Npc } from '../world/npc.js';
import { findTalkTarget } from '../world/interactions.js';
import { TILE } from '../gen/tiles.js';
import { GAME_H } from '../engine/renderer.js';
import { BALANCE } from '../../data/balance.js';
import { TEST_ROOM } from '../world/maps/test_room.js';
import { DialogScene } from './dialog_scene.js';
import { PauseScene } from './pause.js';
import { StatusPanel } from './status_panel.js';
import { formatTimer } from '../ui/format.js';
import { audio } from '../engine/audio.js';

export class TestRoomScene {
  constructor(def = TEST_ROOM) { this.id = 'test_room';
    this.def = def;
  }

  enter(game) {
    this.game = game;
    this.map = new TileMap(this.def);
    const st = game.state;
    const restore = st.location === this.def.id && st.pos && st.pos.x > 0;
    const sx = restore ? st.pos.x : (this.def.spawn.x + 0.5) * TILE;
    const sy = restore ? st.pos.y : (this.def.spawn.y + 1) * TILE - 2;
    this.player = new Actor('roma', sx, sy, restore ? st.pos.dir : this.def.spawn.dir);
    this.npcs = this.def.npcs.map((d) => new Npc(d));
    this.actors = [this.player, ...this.npcs];
    st.location = this.def.id;
    st.locationName = this.def.name;
    this.talkTarget = null;
    this.stepT = 0;
    game.playMusic(this.def.music);
    this.updateCamera(true);
    game.autosave();
  }

  resume(result) {
    for (const n of this.npcs) n.busy = false;
    this.game.playMusic(this.def.music);
    if (result && result.dialogEnded) this.saveProgress();
  }

  saveProgress() {
    const st = this.game.state;
    st.pos = { x: Math.round(this.player.x), y: Math.round(this.player.y), dir: this.player.dir };
    this.game.autosave();
  }

  update(dt) {
    const game = this.game;
    const input = game.input;
    game.state.playTime += dt;
    for (const n of this.npcs) n.update(dt, this.map, this.actors);

    if (input.pressed('back')) {
      this.saveProgress();
      game.scenes.push(new PauseScene());
      return;
    }
    if (input.pressed('tab')) { game.scenes.push(new StatusPanel()); return; }

    const ax = input.axis();
    const run = input.held('run');
    const speed = (run ? BALANCE.move.run : BALANCE.move.walk) * dt;
    let dx = ax.x, dy = ax.y;
    if (dx && dy) { dx *= Math.SQRT1_2; dy *= Math.SQRT1_2; }
    this.player.step(dx * speed, dy * speed, this.map, this.actors, dt, run ? 12 : 8);
    if (this.player.moving) {
      this.stepT += dt;
      if (this.stepT > (run ? 0.18 : 0.28)) { this.stepT = 0; audio.play('step'); }
    }

    this.talkTarget = findTalkTarget(this.player, this.npcs);
    if (this.talkTarget && input.pressed('confirm')) {
      input.consume('confirm');
      const n = this.talkTarget;
      n.busy = true;
      n.face(this.player);
      this.player.face(n);
      this.player.moving = false;
      game.scenes.push(new DialogScene(n.talk.file, n.talk.label));
    }
    this.updateCamera();
  }

  updateCamera(snap = false) {
    const r = this.game.r;
    const vw = 480, vh = GAME_H;
    let cx = this.player.x - vw / 2;
    let cy = this.player.y - 16 - vh / 2;
    cx = this.map.pixelW <= vw ? (this.map.pixelW - vw) / 2 : Math.max(0, Math.min(this.map.pixelW - vw, cx));
    cy = this.map.pixelH <= vh ? (this.map.pixelH - vh) / 2 : Math.max(0, Math.min(this.map.pixelH - vh, cy));
    if (snap) { r.cam.x = cx; r.cam.y = cy; }
    else { r.cam.x += (cx - r.cam.x) * 0.2; r.cam.y += (cy - r.cam.y) * 0.2; }
  }

  draw(r) {
    r.clip(0, 0, 480, GAME_H, () => {
      r.withCamera(() => {
        this.map.draw(r, 480, GAME_H);
        const sorted = [...this.actors].sort((a, b) => a.y - b.y);
        for (const a of sorted) a.draw(r);
        if (this.talkTarget && this.game.scenes.top === this) {
          const n = this.talkTarget;
          const bob = Math.round(Math.sin(r.time * 6));
          r.box(n.x - 5, n.y - 44 + bob, 11, 12, '#ffffff', '#000000', 1);
          r.text('Z', n.x - 2, n.y - 42 + bob, { color: '#ffe14d' });
        }
      });
    });
    if (this.game.scenes.top === this) {
      r.text('Стрелки — ходить, Shift — бег, Z — говорить, X — пауза, Tab — статусы', 240, 4, { align: 'center', color: '#ffffff', shadow: '#000' });
    }
    if (this.game.settings.speedrunTimer) r.text(formatTimer(this.game.state.playTime), 474, 16, { align: 'right', color: '#ffe14d', shadow: '#000' });
    this.game.hud.draw(r, this.game.state);
  }
}
