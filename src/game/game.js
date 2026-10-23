// Главный объект игры: связывает рендерер, ввод, звук, сцены, состояние дня, HUD и настройки.
import { Renderer } from '../engine/renderer.js';
import { SceneManager } from '../engine/scenes.js';
import { Loop } from '../engine/loop.js';
import { input } from '../engine/input.js';
import { audio } from '../engine/audio.js';
import { storeGet, storeSet, KEYS, autosave } from '../engine/save.js';
import { generateSeedCode } from '../engine/rng.js';
import { createState, applyScriptEffect, scriptStatValue } from './state.js';
import { Hud } from '../ui/hud.js';
import { drawToast } from '../ui/transitions.js';
import { MUSIC } from '../../data/music.js';

export const DEFAULT_SETTINGS = { musicVolume: 6, sfxVolume: 8, textSpeed: 'normal', speedrunTimer: false, muted: false };

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.r = new Renderer(canvas);
    this.scenes = new SceneManager(this);
    this.input = input;
    this.audio = audio;
    this.hud = new Hud();
    this.state = createState(generateSeedCode());
    this.settings = { ...DEFAULT_SETTINGS, ...(storeGet(KEYS.settings, {}) || {}) };
    this.toasts = [];
    this.textInputActive = false;
    const params = new URLSearchParams((typeof location !== 'undefined' && location.search) || '');
    this.debugMode = params.has('debug');
    this.showFps = this.debugMode;
    this.debugOpener = null; // функция открытия отладочного меню (задаётся в main.js)
    this.applySettings();
    this.loop = new Loop((dt) => this.update(dt), () => this.draw());
    input.attach(window);
    input.onFirstInteraction(() => { audio.unlock(); this.applySettings(); });
  }

  applySettings() {
    audio.setMusicVolume(this.settings.musicVolume / 10);
    audio.setSfxVolume(this.settings.sfxVolume / 10);
    audio.setMuted(!!this.settings.muted);
  }

  saveSettings() { storeSet(KEYS.settings, this.settings); this.applySettings(); }

  start(scene) {
    this.scenes.push(scene);
    this.loop.start();
  }

  playMusic(name) { audio.playMusic(name, MUSIC[name]); }

  toast(text, life = 1.8) { this.toasts.push({ text, t: 0, life }); }

  update(dt) {
    input.beginStep();
    if (!this.textInputActive) {
      if (input.pressed('mute')) {
        this.settings.muted = audio.toggleMute();
        this.saveSettings();
        this.toast(this.settings.muted ? 'Звук выключен (M)' : 'Звук включён (M)');
      }
      if (input.pressed('fullscreen')) this.r.toggleFullscreen();
      if (input.pressed('debug') && this.debugOpener) { input.consume('debug'); this.debugOpener(); }
    }
    this.scenes.update(dt);
    this.r.update(dt);
    this.hud.update(dt, this.state);
    for (const t of this.toasts) t.t += dt;
    this.toasts = this.toasts.filter((t) => t.t < t.life);
  }

  draw() {
    const r = this.r;
    r.beginFrame();
    this.scenes.draw(r);
    if (this.toasts.length) {
      const t = this.toasts[this.toasts.length - 1];
      drawToast(r, t.text, t.t, t.life);
    }
    if (this.showFps) r.text('FPS ' + this.loop.fps, 474, 3, { align: 'right', color: '#6be36b', shadow: '#000' });
  }

  // ---------- Состояние дня ----------
  newDay(seed) {
    this.state = createState(seed);
    this.hud.prev = null;
  }

  loadState(st) {
    this.state = st;
    this.hud.prev = null;
  }

  autosave() { return autosave(this.state); }

  // Эффект из диалога: изменения состояния — в state.js, звук и тряска — здесь.
  applyEffect(e) {
    if (e.type === 'sfx') { audio.play(e.name); return; }
    if (e.type === 'shake') { this.r.shake(3, 0.35); audio.play('shake'); return; }
    try {
      if (!applyScriptEffect(this.state, e)) console.error('Неизвестный эффект', e);
    } catch (err) { console.error(err.message); }
  }

  scriptStat(name) { return scriptStatValue(this.state, name); }
  scriptFlag(name) { return !!this.state.flags[name]; }
}
