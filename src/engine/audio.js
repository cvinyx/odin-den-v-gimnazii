// Звук на Web Audio API: синтез эффектов в коде + простой секвенсор чиптюн-музыки.
// AudioContext создаётся только после первого нажатия (политика браузеров).

const NOTE_INDEX = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };

// 'A4' → 440 Гц. '-' или null — пауза.
export function noteFreq(note) {
  if (!note || note === '-') return 0;
  const m = /^([A-G]#?)(-?\d)$/.exec(note);
  if (!m) return 0;
  const n = NOTE_INDEX[m[1]] + (parseInt(m[2], 10) + 1) * 12;
  return 440 * Math.pow(2, (n - 69) / 12);
}

class Audio {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.musicVolume = 0.6;
    this.sfxVolume = 0.8;
    this.track = null;
    this.trackName = null;
    this._noise = null;
    this._schedTimer = null;
  }

  // Вызывается на первом нажатии клавиши.
  unlock() {
    try {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.5;
        this.master.connect(this.ctx.destination);
        this.musicBus = this.ctx.createGain();
        this.musicBus.gain.value = this.musicVolume;
        this.musicFade = this.ctx.createGain(); // плавная смена треков (без щелчков)
        this.musicBus.connect(this.musicFade);
        this.musicFade.connect(this.master);
        this.sfxBus = this.ctx.createGain();
        this.sfxBus.gain.value = this.sfxVolume;
        this.sfxBus.connect(this.master);
        if (this.pendingMusic) { const p = this.pendingMusic; this.pendingMusic = null; this.playMusic(p.name, p.data); }
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    } catch (e) {
      this.ctx = null; // без звука игра работает
    }
  }

  get ready() { return !!this.ctx; }

  setMuted(m) {
    this.muted = m;
    if (this.master) this.master.gain.setTargetAtTime(m ? 0 : 0.5, this.ctx.currentTime, 0.02);
  }
  toggleMute() { this.setMuted(!this.muted); return this.muted; }
  setMusicVolume(v) { this.musicVolume = v; if (this.musicBus) this.musicBus.gain.value = v; }
  setSfxVolume(v) { this.sfxVolume = v; if (this.sfxBus) this.sfxBus.gain.value = v; }

  noiseBuffer() {
    if (this._noise) return this._noise;
    const len = this.ctx.sampleRate;
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    // Детерминированный шум (LCG) — визуально/по логике не важно, но без Math.random.
    let s = 12345;
    for (let i = 0; i < len; i++) { s = (s * 1103515245 + 12345) & 0x7fffffff; d[i] = (s / 0x3fffffff) - 1; }
    this._noise = buf;
    return buf;
  }

  // Базовый тон: осциллятор с огибающей.
  tone({ freq = 440, type = 'square', dur = 0.1, vol = 0.3, attack = 0.005, release = 0.05, slideTo = null, at = 0, bus = null, detune = 0 }) {
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime + at;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    osc.detune.value = detune;
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + attack);
    g.gain.setValueAtTime(vol, t0 + Math.max(attack, dur - release));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(bus || this.sfxBus);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  noise({ dur = 0.1, vol = 0.3, at = 0, filter = 2000, filterType = 'lowpass', bus = null }) {
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime + at;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer();
    const f = this.ctx.createBiquadFilter();
    f.type = filterType;
    f.frequency.value = filter;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f);
    f.connect(g);
    g.connect(bus || this.sfxBus);
    src.start(t0, 0);
    src.stop(t0 + dur + 0.02);
  }

  // ---------- Эффекты ----------

  // Блип печати текста: у каждого персонажа свой тон (Гц) и тембр.
  blip(freq = 440, wave = 'square') {
    this.tone({ freq, type: wave, dur: 0.045, vol: 0.12, attack: 0.002, release: 0.03 });
  }

  play(name) {
    if (!this.ctx) return;
    const fx = SFX[name];
    if (fx) fx(this);
  }

  // ---------- Музыка ----------
  // Трек: { bpm, steps (шагов на такт), loop, channels: [{ wave, vol, notes: ['C4','-',...], len }] }.
  playMusic(name, data) {
    if (this.trackName === name) return;
    const wasPlaying = !!this.track && !!this.ctx;
    this.stopMusic();
    this.trackName = name;
    if (!data) return;
    if (!this.ctx) { this.pendingMusic = { name, data }; return; }
    // смена трека: старый затухает за ~0,3 с, новый начинается после паузы и плавно нарастает
    const now = this.ctx.currentTime;
    const g = this.musicFade.gain;
    const start = now + (wasPlaying ? 0.4 : 0.1);
    g.cancelScheduledValues(now);
    g.setValueAtTime(g.value, now);
    if (wasPlaying) g.linearRampToValueAtTime(0, now + 0.3);
    g.setValueAtTime(wasPlaying ? 0 : g.value, start - 0.01);
    g.linearRampToValueAtTime(1, start + 0.4);
    const stepDur = 60 / data.bpm / (data.stepsPerBeat || 4);
    const length = Math.max(...data.channels.map((c) => c.notes.length));
    this.track = { data, stepDur, length, step: 0, next: start };
    this._schedTimer = setInterval(() => this._schedule(), 25);
    this._schedule();
  }

  stopMusic() {
    if (this._schedTimer) clearInterval(this._schedTimer);
    this._schedTimer = null;
    this.track = null;
    this.trackName = null;
    this.pendingMusic = null;
  }

  _schedule() {
    const tr = this.track;
    if (!tr || !this.ctx) return;
    const ahead = this.ctx.currentTime + 0.12;
    while (tr.next < ahead) {
      for (const ch of tr.data.channels) {
        const n = ch.notes[tr.step % ch.notes.length];
        if (!n || n === '-' || n === '.') continue;
        const at = tr.next - this.ctx.currentTime;
        const dur = tr.stepDur * (ch.len || 1) * 0.95;
        if (ch.wave === 'noise') {
          // Ударные: k — бочка, s — малый, h — хай-хэт.
          const v = ch.vol || 0.2;
          if (n === 'k') this.tone({ freq: 150, type: 'sine', dur: 0.12, vol: v * 1.6, at, slideTo: 45, bus: this.musicBus });
          else if (n === 's') this.noise({ dur: 0.1, vol: v, at, filter: 1800, bus: this.musicBus });
          else this.noise({ dur: 0.035, vol: v * 0.5, at, filter: 7000, filterType: 'highpass', bus: this.musicBus });
        } else {
          this.tone({ freq: noteFreq(n), type: ch.wave || 'square', dur, vol: ch.vol || 0.1, attack: 0.005, release: Math.min(0.05, dur / 2), at, bus: this.musicBus });
        }
      }
      tr.step = (tr.step + 1) % tr.length;
      tr.next += tr.stepDur;
      if (!tr.data.loop && tr.step === 0) { this.stopMusic(); return; }
    }
  }
}

// Синтезированные звуки. Каждый — функция от аудио-движка.
const SFX = {
  menuMove: (a) => a.tone({ freq: 660, type: 'square', dur: 0.05, vol: 0.12 }),
  menuSelect: (a) => { a.tone({ freq: 880, dur: 0.06, vol: 0.14 }); a.tone({ freq: 1320, dur: 0.08, vol: 0.12, at: 0.05 }); },
  menuBack: (a) => a.tone({ freq: 440, dur: 0.08, vol: 0.12, slideTo: 260 }),
  menuDenied: (a) => { a.tone({ freq: 160, type: 'sawtooth', dur: 0.12, vol: 0.12 }); },
  statUp: (a) => { a.tone({ freq: 520, dur: 0.06, vol: 0.12 }); a.tone({ freq: 780, dur: 0.08, vol: 0.12, at: 0.06 }); },
  statDown: (a) => { a.tone({ freq: 520, dur: 0.06, vol: 0.12 }); a.tone({ freq: 330, dur: 0.1, vol: 0.12, at: 0.06 }); },
  // Школьный звонок: электромеханический — быстрые удары молоточка по чашке ~2 с.
  bell: (a) => {
    const hits = 44;
    for (let i = 0; i < hits; i++) {
      const at = i * 0.045;
      a.tone({ freq: 2093, type: 'square', dur: 0.04, vol: 0.06, at, attack: 0.001 });
      a.tone({ freq: 2637, type: 'triangle', dur: 0.06, vol: 0.06, at, attack: 0.001 });
      a.tone({ freq: 1046, type: 'sine', dur: 0.05, vol: 0.05, at, attack: 0.001 });
    }
  },
  // Свисток судьи: высокий синус с трелью.
  whistle: (a) => {
    if (!a.ctx) return;
    const t0 = a.ctx.currentTime;
    const osc = a.ctx.createOscillator();
    const lfo = a.ctx.createOscillator();
    const lfoGain = a.ctx.createGain();
    const g = a.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 2900;
    lfo.frequency.value = 28;
    lfoGain.gain.value = 140;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.18, t0 + 0.02);
    g.gain.setValueAtTime(0.18, t0 + 0.5);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.6);
    osc.connect(g);
    g.connect(a.sfxBus);
    osc.start(t0); lfo.start(t0);
    osc.stop(t0 + 0.65); lfo.stop(t0 + 0.65);
    a.noise({ dur: 0.5, vol: 0.03, filter: 5000, filterType: 'highpass' });
  },
  // Удар по мячу: щелчок шума + низкий «бум».
  kick: (a) => {
    a.noise({ dur: 0.06, vol: 0.4, filter: 3000 });
    a.tone({ freq: 160, type: 'sine', dur: 0.15, vol: 0.4, slideTo: 50 });
  },
  // Гол: рёв зала (шум) и фанфара.
  goal: (a) => {
    a.noise({ dur: 1.4, vol: 0.12, filter: 1400 });
    [523, 659, 784, 1046].forEach((f, i) => a.tone({ freq: f, type: 'square', dur: 0.16, vol: 0.12, at: i * 0.11 }));
  },
  // Живот Смайла: низкое урчание с «бульком».
  tummy: (a) => {
    a.tone({ freq: 70, type: 'sawtooth', dur: 0.5, vol: 0.2, slideTo: 45 });
    a.tone({ freq: 140, type: 'sine', dur: 0.12, vol: 0.18, at: 0.45, slideTo: 300 });
    a.tone({ freq: 90, type: 'sawtooth', dur: 0.4, vol: 0.16, at: 0.6, slideTo: 50 });
  },
  hit: (a) => {
    a.noise({ dur: 0.1, vol: 0.3, filter: 1200 });
    a.tone({ freq: 220, type: 'square', dur: 0.08, vol: 0.15, slideTo: 90 });
  },
  // Супергромкий смех Игоря: серия «ХА» с падающей высотой, грубый тембр.
  igorLaugh: (a) => {
    const n = 8;
    for (let i = 0; i < n; i++) {
      const at = i * 0.13;
      const f = 330 - i * 14 + (i % 2) * 25;
      a.tone({ freq: f, type: 'sawtooth', dur: 0.1, vol: 0.32, at, attack: 0.004, release: 0.05, slideTo: f * 0.8 });
      a.tone({ freq: f * 2.02, type: 'square', dur: 0.08, vol: 0.12, at, attack: 0.004, slideTo: f * 1.6 });
      a.noise({ dur: 0.07, vol: 0.18, at, filter: 2500 });
    }
  },
  // Гомон коридора: короткий «бу-бу» в полосе голоса и далёкие шаги.
  murmur: (a) => {
    a.noise({ dur: 0.25, vol: 0.025, filter: 700 });
    a.tone({ freq: 140 + (Math.floor(a.ctx.currentTime * 37) % 9) * 15, type: 'triangle', dur: 0.18, vol: 0.012, slideTo: 120 });
  },
  stepFar: (a) => a.noise({ dur: 0.04, vol: 0.03, filter: 400 }),
  shake: (a) => a.tone({ freq: 90, type: 'sawtooth', dur: 0.25, vol: 0.2, slideTo: 40 }),
  step: (a) => a.noise({ dur: 0.03, vol: 0.05, filter: 600 }),
  door: (a) => { a.noise({ dur: 0.2, vol: 0.15, filter: 500 }); a.tone({ freq: 120, type: 'triangle', dur: 0.15, vol: 0.15 }); },
  puff: (a) => a.noise({ dur: 0.6, vol: 0.12, filter: 900 }),
  coin: (a) => { a.tone({ freq: 988, dur: 0.06, vol: 0.12 }); a.tone({ freq: 1319, dur: 0.15, vol: 0.12, at: 0.06 }); },
};

export const SFX_NAMES = Object.keys(SFX);
export const audio = new Audio();
