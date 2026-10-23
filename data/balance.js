// ВСЕ игровые числа (разделы 7, 8, 11, 14, 15, 16 спецификации). Деньги — в копейках.

export const BALANCE = {
  start: {
    battery: 34,      // % iPhone 11
    stress: 30,
    aura: 50,
    vapeCharge: 60,   // % заряда вейпа
    juice: 2,         // заправки жижки
    suspicion: 0,
    hunger: 40,
    money: 600,       // 6,00 BYN
    time: '09:03',
    lateSuspicion: 15, // опоздание на английский
  },

  limits: {
    battery: [0, 100], stress: [0, 100], aura: [0, 100], vapeCharge: [0, 100],
    suspicion: [0, 100], hunger: [0, 100], juice: [0, 20], money: [0, 999999],
  },

  battery: {
    perLesson: -1,
    perPhoneGame: -8,
    lowThreshold: 20,         // ниже — лаги чаще
    lagFreeze: [0.2, 0.6],    // длительность фриза, с
    lagInterval: [5, 10],     // интервал между фризами, с
    lagIntervalLow: [2.5, 5], // при батарее < 20 %
    deadStressPerLesson: 5,
    chargePerSecond: 1,       // розетка в библиотеке
    critical: 15,             // мигает красным
  },

  stress: {
    breakdownAt: 100,
    resetAfterBreakdown: 60,
    critical: 85,
  },

  aura: {
    winMin: 5, winMax: 10,
    funnyMin: 3, funnyMax: 5,
    exposedLie: -10,
    fail: -5,
    humiliationMin: -10, humiliationMax: -5,
    critical: 15,
  },

  vape: {
    puffsPerRefill: 5,
    puffStress: -15,
    puffCharge: -10,
    puffSuspicion: 25,          // на уроке
    staminaPenaltyPerPuff: 0.05,
    staminaPenaltyMax: 0.40,
    emptyStressPerLesson: 5,    // если заряд 0 или жижка 0
    chargePerSecond: 1,         // та же розетка в библиотеке
    critical: 10,
  },

  suspicion: {
    carryOver: 0.25,   // следующий урок стартует с 25 % предыдущего
    directorAt: 100,
    vapeSmellBonus: 20, // после вейп-игры на перемене
    critical: 75,
  },

  hunger: {
    perLesson: 8,
    perFootball: 15,
    slowThreshold: 70,  // выше — скорость и точность −20 %
    slowFactor: 0.8,
    maxStressPerLesson: 10, // на 100
    critical: 70,
  },

  money: {
    critical: 100, // < 1 BYN
  },

  // Буфет (раздел 7). lunchOnly — только на большой перемене.
  food: {
    smazhenka: { name: 'Смаженка', price: 120, hunger: -25, stress: 0 },
    topChoco: { name: '«Топ с шоколадом»', price: 180, hunger: -20, stress: -5 },
    lunch: { name: 'Комплексный обед', price: 350, hunger: -50, stress: 0, lunchOnly: true },
    tea: { name: 'Чай', price: 40, hunger: -5, stress: -3 },
  },

  director: {
    stress: 20,
    grade: 2,
    endingOnCall: 3,
  },

  // Ставки и долги (раздел 8).
  bets: {
    min: 50, max: 200, step: 10,
    exposeChance: 0.40,
    exposeChanceRich: 0.60,
    richThreshold: 200,      // ≥ 2 BYN — соперник видел покупку еды
    exposedAura: -10,
    creditorReminderChance: 0.5,
  },

  dad: {
    gradeThreshold: 7,
    transferMin: 100, transferMax: 300,
  },

  // Рассадка (раздел 11).
  seating: {
    stealChance: 0.20,
    stealSuccessSuspicion: 0.7,
    stealSuccessCheatSpeed: 1.3,
    stealFailSuspicion: 1.4,
    frontSuspicion: 1.4,
    frontGradeBonus: 1,
  },

  // Мини-игры (раздел 14) — базовые числа, детали на этапе 4.
  minigames: {
    cheat: { duration: 60, secondsPerAnswer: 1.5, maxAnswers: 10, warnTime: 0.4, suspicionPerSecond: 30 },
    phone: { suspicionPerSecond: 25, auraMin: 3, auraMax: 8 },
    bait: { roundsMin: 3, roundsMax: 4, romaBoilFactor: 1.5, suspicionMin: 5, suspicionMax: 15 },
    vapeBattle: { rounds: 3, chargeCost: -20, juiceCost: -1, stressAfter: 5 },
    eat: { entryCount: 3, fastHungerThreshold: 30 },
    toilet: { rounds: 3 },
    durationMin: 30, durationMax: 90,
  },

  // Эль-Класико (раздел 15). Скорость / навык 1–10, вратари — реакция.
  football: {
    halfSeconds: 90,
    halves: 2,
    diarrheaChance: 0.35,
    berserk: { speed: 1.4, seconds: 20 },
    win: { aura: 20, stress: -10 },
    draw: { aura: 0, stress: 0 },
    lose: { aura: -10, stress: 0 },
    goalAura: 5,
    gradeBase: 6,
    gradeWinBonus: 2,
    players: {
      chernyak: { speed: 8, skill: 9 },
      vadim: { speed: 6, skill: 5 },
      vitalik: { speed: 6, skill: 5 },
      shurpo: { speed: 2, skill: 4 },
      bochko: { speed: 4, skill: 1 },
      zakha: { speed: 5, skill: 4 },
      igor: { speed: 7, skill: 6 },
      roma: { speed: 7, skill: 5 },
      denis: { speed: 6, skill: 6 },
      matych: { speed: 4, skill: 2 },
      guza: { speed: 5, skill: 4 },
    },
    keepers: { smile: 7, buy: 5, bochko: 2, zakha: 4 },
  },

  // Концовки (раздел 16).
  endings: {
    perfect: { aura: 70, avgGrade: 6 },
    baitLegend: { aura: 85, wins: 5 },
    squeezed: { breakdowns: 2, money: 100 },
  },

  // Действия на уроке через выборы (до появления телефонных мини-игр на этапе 4).
  lessonActions: {
    phoneSuspicion: [10, 25],
    quietStress: 3,
    quietSuspicionDrop: 10,
  },

  // Байт-дуэль (раздел 14, пункт 3). Сила реплик — сколько «закипания» добавляет сопернику.
  bait: {
    weak: [9, 13],
    mid: [15, 22],
    strong: [30, 42], strongChance: 0.55, strongBackfire: 12,
    weird: [28, 44], weirdHit: 0.4, weirdFizzle: 4, weirdBackfire: 8,
    retortMul: 1.5,              // Рома закипает на 50 % быстрее
    sulkBonus: 1.3,              // Игорь дуется (отбили место) — легче забайтить
    winAura: [5, 10], loseAura: -5, loseStress: 10,
    // resist — делитель урона по сопернику, attack — сила ответных реплик (до множителя Ромы).
    opponents: {
      igor: { resist: 0.9, attack: [11, 17] },
      denis: { resist: 1.0, attack: [10, 16] },
      matych: { resist: 0.8, attack: [7, 12] },
      buy: { resist: 0.95, attack: [9, 15] },
      guza: { resist: 1.15, attack: [12, 19] },
      levonchuk: { resist: 1.05, attack: [10, 16] },
      chernyak: { resist: 1.4, attack: [8, 13] },
      shurpo: { resist: 1.0, attack: [9, 14] },
      bochko: { resist: 0.85, attack: [8, 13] },
      default: { resist: 1.0, attack: [9, 15] },
    },
  },

  // Списывание: поведение учителя по умолчанию (переопределяется параметрами учителя).
  cheat: {
    lookTime: [1.8, 3.4],       // сколько учитель смотрит в одну сторону
    randomTurnPerSec: 0.18,     // шанс внезапного поворота в секунду
    turnSpeed: 300,             // градусов в секунду
    coneHalf: 24, coneHalfWide: 32, coneLength: 230,
    pRoma: 0.3,                // как часто учитель смотрит прямо на Рому
    progressDecay: 1.0,         // как быстро теряется прогресс ответа, если отпустить Z (в долях в секунду)
    spotBonus: 3,               // разовый скачок подозрения, когда учитель «заметил» подсматривание
  },

  // Движение по карте (пикселей в секунду).
  move: {
    walk: 64,
    run: 112,
  },
};

// Стартовые значения в виде, удобном для HUD/отладки.
export const STAT_KEYS = ['battery', 'stress', 'aura', 'vapeCharge', 'juice', 'suspicion', 'hunger', 'money'];
