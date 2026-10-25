// Главный объект игры: связывает рендерер, ввод, звук, сцены, состояние дня, HUD и настройки.
import { Renderer } from '../engine/renderer.js';
import { SceneManager } from '../engine/scenes.js';
import { Loop } from '../engine/loop.js';
import { input } from '../engine/input.js';
import { audio } from '../engine/audio.js';
import { storeGet, storeSet, KEYS, autosave } from '../engine/save.js';
import { generateSeedCode } from '../engine/rng.js';
import { createState, applyScriptEffect, scriptStatValue, changeStat, VAPE_FRIENDS } from './state.js';
import { puff, sitQuiet, addSuspicion, checkBreakdown, trySeatSteal } from './actions.js';
import { eventRng, setDay } from './day.js';
import { BALANCE } from '../../data/balance.js';
import { Hud } from '../ui/hud.js';
import { drawToast, drawAchievement } from '../ui/transitions.js';
import { MUSIC } from '../../data/music.js';
import { checkAchievements } from './achievements.js';

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
    this.achQueue = [];   // всплывающие «Достижение получено»
    this.achT = 0;
    this.pendingActions = [];
    this.patrolNear = false; // рядом завуч-патруль (ставит сцена мира)
    this.condCtx = {};       // условия мини-игр для диалога перемены (см. WorldScene.talk)
    this.skipHold = 0;
    this.onSkipIntro = null; // пропуск вступления удержанием X (ставит сцена вступления)
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
      // отладочное меню — только в режиме ?debug (в обычной игре скрыто)
      if (input.pressed('debug') && this.debugOpener && this.debugMode) { input.consume('debug'); this.debugOpener(); }
    }
    this.scenes.update(dt);
    // пропуск вступления: удерживать X
    if (this.state.phase === 'intro' && this.onSkipIntro && input.held('back')) {
      this.skipHold += dt;
      if (this.skipHold >= 1.0) { this.skipHold = 0; const f = this.onSkipIntro; this.onSkipIntro = null; f(); }
    } else this.skipHold = 0;
    if (checkBreakdown(this.state)) {
      this.r.shake(6, 1.0);
      audio.play('shake');
      this.toast('СРЫВ! Следующий выбор или мини-игра провалится', 3);
    }
    this.r.update(dt);
    this.hud.update(dt, this.state);
    // достижения: проверка раз в полсекунды, уведомления по одному
    this.achT += dt;
    if (this.achT >= 0.5) { this.achT = 0; for (const a of checkAchievements(this.state)) this.achQueue.push({ a, t: 0 }); }
    if (this.achQueue.length) { const q = this.achQueue[0]; if (q.t === 0) audio.play('statUp'); q.t += dt; if (q.t > 3) this.achQueue.shift(); }
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
    if (this.achQueue.length) drawAchievement(r, this.achQueue[0].a, this.achQueue[0].t);
    if (this.state.phase === 'intro' && this.onSkipIntro) {
      const t = this.skipHold > 0 ? `Пропуск… ${Math.round(this.skipHold * 100)}%` : 'Удерживай X — пропустить вступление';
      r.text(t, 474, 4, { align: 'right', color: '#c8c8d8', shadow: '#000' });
    }
    if (this.showFps) r.text('FPS ' + this.loop.fps, 474, 3, { align: 'right', color: '#6be36b', shadow: '#000' });
  }

  // ---------- Состояние дня ----------
  newDay(seed) {
    this.state = createState(seed);
    setDay(this.state.day);
    this.hud.prev = null;
  }

  loadState(st) {
    this.state = st;
    setDay(st.day);
    this.hud.prev = null;
  }

  autosave() { return autosave(this.state); }

  // Эффект из диалога: изменения состояния — в state.js, звук и тряска — здесь.
  applyEffect(e) {
    if (e.type === 'sfx') { audio.play(e.name); return; }
    if (e.type === 'shake') { this.r.shake(3, 0.35); audio.play('shake'); return; }
    if (e.type === 'action') { this.performAction(e.name, e.arg); return; }
    if (e.type === 'stat' && e.stat === 'suspicion') { addSuspicion(this.state, e.delta); return; }
    try {
      if (!applyScriptEffect(this.state, e)) console.error('Неизвестный эффект', e);
    } catch (err) { console.error(err.message); }
  }

  // Действия из диалогов. Мгновенные меняют состояние сразу (диалог может ветвиться по флагам),
  // остальные (байт, автобус) ставятся в очередь и выполняются сценой после конца диалога.
  performAction(name, arg) {
    const st = this.state;
    switch (name) {
      case 'dia_check':
        // М-2: в кабинке кто-то мог заметить (флаг дня — друзья подкалывают, автобус тоже)
        st.flags.diarrheaT = 0;
        st.flags.diarrheaSeen = eventRng(st, `dianotice:${st.day}:${st.lesson}`).chance(BALANCE.diarrhea.noticedChance);
        break;
      case 'vape': {
        // ИС-7: вне урока — только мужской туалет, раздевалка, кабинет класса (флаг ставит сцена мира)
        if (st.phase !== 'lesson' && this.vapeAllowed === false) { this.toast('Не здесь.'); break; }
        const res = puff(st);
        if (!res.ok) { this.toast(res.reason); break; }
        audio.play('puff');
        st.flags.lastPuffOk = true;
        if (st.phase !== 'lesson' && this.patrolNear) this.pendingActions.push({ name: 'director_patrol' });
        break;
      }
      case 'phone':
        // на уроке — короткая телефонная мини-игра после диалога (LessonScene.afterDialog)
        if (st.stats.battery <= 0) { this.toast('Телефон мёртв.'); break; }
        this.pendingActions.push({ name, arg });
        break;
      case 'quiet': sitQuiet(st); break;
      case 'challenge':
        // вызов собеседника прозвучал — второй раз за разговор не повторяется
        this.condCtx.challenge = 0;
        if (this.currentOpp) st.flags['challenged_' + this.currentOpp + '_' + st.lesson] = true;
        break;
      case 'wash':
        if (!st.flags['washed' + st.lesson]) { changeStat(st, 'stress', -3); st.flags['washed' + st.lesson] = true; }
        break;
      case 'seat_steal': {
        const ok = trySeatSteal(st);
        st.seat = ok ? 'steal_ok' : 'steal_fail';
        st.flags.seat_ok = ok;
        if (ok) st.flags.satWithDenis = true;
        st.lessonMul *= ok ? BALANCE.seating.stealSuccessSuspicion : BALANCE.seating.stealFailSuspicion;
        break;
      }
      case 'seat_front':
        st.seat = 'front';
        st.lessonMul *= BALANCE.seating.frontSuspicion;
        break;
      case 'seat_igor':
        st.seat = 'igor';
        break;
      case 'askjuice': {
        // жижку можно попросить у друзей из списка вейп-игры (раздел 7), у каждого — раз в день
        const opp = this.currentOpp;
        const key = 'askedJuice_' + opp;
        let ok = false;
        if (VAPE_FRIENDS.includes(opp) && !st.flags[key]) ok = eventRng(st, key).chance(BALANCE.vape.askJuiceChance);
        st.flags[key] = true;
        st.flags.juice_ok = ok;
        if (ok) changeStat(st, 'juice', 1);
        break;
      }
      default:
        this.pendingActions.push({ name, arg });
    }
  }

  takeActions() { const a = this.pendingActions; this.pendingActions = []; return a; }

  // condCtx — величины про мини-игры на перемене (ставит сцена мира перед разговором).
  scriptStat(name) {
    if (name in this.condCtx) return this.condCtx[name];
    return scriptStatValue(this.state, name, this.currentOpp);
  }
  scriptFlag(name) { return !!this.state.flags[name]; }
}
