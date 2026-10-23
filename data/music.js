// Музыка: массивы нот для секвенсора (src/engine/audio.js). '.' — пауза, ноты — 'A4', 'C#5'.
// У ударных: k — бочка, s — малый барабан, h — хай-хэт.

const seq = (str) => str.trim().split(/\s+/);

export const MUSIC = {
  // Главное меню: бодрая мелодия в ля миноре, «школьное утро».
  menu: {
    bpm: 112,
    stepsPerBeat: 4,
    loop: true,
    channels: [
      {
        wave: 'square', vol: 0.06, len: 1.6,
        notes: seq(`
          A4 . C5 . E5 . C5 . D5 . . . B4 . . .
          C5 . E5 . G5 . E5 . F5 . . . E5 . D5 .
          A4 . C5 . E5 . A5 . G5 . E5 . D5 . C5 .
          B4 . . . G4 . B4 . A4 . . . . . . .
          E5 . . D5 C5 . . B4 A4 . . . C5 . E5 .
          F5 . . E5 D5 . . C5 B4 . . . D5 . F5 .
          E5 . . D5 C5 . B4 . A4 . C5 . E5 . A5 .
          G#5 . . . E5 . . . A5 . . . . . . .
        `),
      },
      {
        wave: 'square', vol: 0.03, len: 1,
        notes: seq(`
          . . E4 . . . E4 . . . A4 . . . G4 .
          . . G4 . . . G4 . . . C5 . . . B4 .
          . . E4 . . . E4 . . . A4 . . . A4 .
          . . D4 . . . D4 . . . C4 . . . E4 .
          . . A4 . . . A4 . . . F4 . . . F4 .
          . . A4 . . . A4 . . . G4 . . . G4 .
          . . E4 . . . E4 . . . F4 . . . F4 .
          . . E4 . . . D4 . . . C4 . . . E4 .
        `),
      },
      {
        wave: 'triangle', vol: 0.16, len: 1.8,
        notes: seq(`
          A2 . A3 . A2 . A3 . F2 . F3 . F2 . F3 .
          C3 . C4 . C3 . C4 . G2 . G3 . G2 . G3 .
          A2 . A3 . A2 . A3 . F2 . F3 . F2 . F3 .
          E2 . E3 . E2 . E3 . A2 . A3 . A2 . E3 .
          A2 . A3 . A2 . A3 . F2 . F3 . F2 . F3 .
          D2 . D3 . D2 . D3 . G2 . G3 . G2 . G3 .
          A2 . A3 . A2 . A3 . F2 . F3 . F2 . F3 .
          E2 . E3 . E2 . E3 . A2 . E3 . A2 . . .
        `),
      },
      {
        wave: 'noise', vol: 0.1,
        notes: seq(`
          k . h . s . h . k . k h s . h .
          k . h . s . h . k . k h s . h h
        `),
      },
    ],
  },

  // Тестовая комната: спокойный фон.
  room: {
    bpm: 96,
    stepsPerBeat: 4,
    loop: true,
    channels: [
      {
        wave: 'triangle', vol: 0.09, len: 2,
        notes: seq(`
          E5 . . . D5 . . . C5 . . . D5 . . .
          E5 . . . G5 . . . E5 . . . . . . .
          D5 . . . C5 . . . A4 . . . C5 . . .
          B4 . . . . . . . G4 . . . . . . .
        `),
      },
      {
        wave: 'square', vol: 0.025, len: 1,
        notes: seq(`
          C4 E4 G4 E4 C4 E4 G4 E4 A3 C4 E4 C4 A3 C4 E4 C4
          F3 A3 C4 A3 F3 A3 C4 A3 G3 B3 D4 B3 G3 B3 D4 B3
        `),
      },
      {
        wave: 'triangle', vol: 0.14, len: 3,
        notes: seq(`
          C3 . . . . . . . A2 . . . . . . .
          F2 . . . . . . . G2 . . . . . . .
        `),
      },
    ],
  },
  // Вступление: утро, похмельный батя за стенкой, автобус. Медленно и немного грустно.
  intro: {
    bpm: 84,
    stepsPerBeat: 4,
    loop: true,
    channels: [
      {
        wave: 'triangle', vol: 0.09, len: 3,
        notes: seq(`
          E5 . . . . . D5 . C5 . . . B4 . . .
          A4 . . . . . . . . . . . . . . .
          C5 . . . . . B4 . A4 . . . G4 . . .
          A4 . . . . . . . E4 . . . . . . .
        `),
      },
      {
        wave: 'square', vol: 0.022, len: 1,
        notes: seq(`
          A3 C4 E4 C4 A3 C4 E4 C4 F3 A3 C4 A3 F3 A3 C4 A3
          C4 E4 G4 E4 C4 E4 G4 E4 E3 G#3 B3 G#3 E3 G#3 B3 G#3
        `),
      },
      {
        wave: 'triangle', vol: 0.13, len: 4,
        notes: seq(`
          A2 . . . . . . . F2 . . . . . . .
          C3 . . . . . . . E2 . . . . . . .
        `),
      },
    ],
  },

  // Коридор на перемене: бодро, шумно, «школьный» мажор.
  corridor: {
    bpm: 128,
    stepsPerBeat: 4,
    loop: true,
    channels: [
      {
        wave: 'square', vol: 0.05, len: 1.4,
        notes: seq(`
          C5 . E5 . G5 . E5 . F5 . A5 . G5 . E5 .
          D5 . F5 . A5 . F5 . E5 . G5 . C5 . . .
          C5 . E5 . G5 . C6 . B5 . G5 . A5 . F5 .
          G5 . E5 . D5 . B4 . C5 . . . . . . .
        `),
      },
      {
        wave: 'triangle', vol: 0.15, len: 1.6,
        notes: seq(`
          C3 . C3 . G2 . G2 . F2 . F2 . C3 . C3 .
          D3 . D3 . A2 . A2 . G2 . G2 . C3 . G2 .
        `),
      },
      {
        wave: 'noise', vol: 0.08,
        notes: seq(`
          k . h . s . h h k . h . s . h .
        `),
      },
    ],
  },

  // Урок: тихо, часы тикают.
  lesson: {
    bpm: 72,
    stepsPerBeat: 4,
    loop: true,
    channels: [
      {
        wave: 'triangle', vol: 0.05, len: 2,
        notes: seq(`
          E4 . . . . . . . G4 . . . . . . .
          F4 . . . . . . . D4 . . . . . . .
        `),
      },
      {
        wave: 'noise', vol: 0.03,
        notes: seq(`
          h . . . h . . . h . . . h . . .
        `),
      },
    ],
  },

  // Мини-игры: напряжённо и быстро.
  minigame: {
    bpm: 140,
    stepsPerBeat: 4,
    loop: true,
    channels: [
      {
        wave: 'square', vol: 0.045, len: 1,
        notes: seq(`
          A4 A4 . C5 . A4 E5 . D5 . C5 . B4 . G4 .
          A4 A4 . C5 . A4 E5 . G5 . F5 . E5 . . .
        `),
      },
      {
        wave: 'triangle', vol: 0.15, len: 1,
        notes: seq(`
          A2 . A2 . A2 . A2 . F2 . F2 . G2 . G2 .
        `),
      },
      {
        wave: 'noise', vol: 0.09,
        notes: seq(`
          k . h k s . h . k . h k s . h h
        `),
      },
    ],
  },

  // Байт-дуэль: дерзкий бас и «подколы» в мелодии.
  bait: {
    bpm: 118,
    stepsPerBeat: 4,
    loop: true,
    channels: [
      {
        wave: 'square', vol: 0.05, len: 1,
        notes: seq(`
          E5 . . G5 . E5 . . D5 . . C5 . . B4 .
          E5 . . G5 . A5 . . G5 . E5 . D5 . . .
        `),
      },
      {
        wave: 'sawtooth', vol: 0.035, len: 1,
        notes: seq(`
          E2 . E2 E3 . E2 G2 . A2 . A2 A3 . A2 B2 .
        `),
      },
      {
        wave: 'noise', vol: 0.08,
        notes: seq(`
          k . . k s . . . k . k . s . . h
        `),
      },
    ],
  },

  // У кабинета директора: тревожно и медленно.
  director: {
    bpm: 60,
    stepsPerBeat: 4,
    loop: true,
    channels: [
      {
        wave: 'triangle', vol: 0.12, len: 6,
        notes: seq(`
          D3 . . . . . . . C#3 . . . . . . .
          C3 . . . . . . . B2 . . . . . . .
        `),
      },
      {
        wave: 'sine', vol: 0.04, len: 2,
        notes: seq(`
          . . . . F4 . . . . . . . E4 . . .
        `),
      },
    ],
  },
};
