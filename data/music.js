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
};
