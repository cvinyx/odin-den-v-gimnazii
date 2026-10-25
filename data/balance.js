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
    askJuiceChance: 0.5,        // друг из списка вейп-игры даёт заправку (раз в день)
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

  // Мини-игры (раздел 14) — общие числа; детали каждой игры — ниже.
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
    rage: { speed: 1.4, seconds: 20 },
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
    // Физика (пиксели и секунды). Мяч отскакивает от стен, аутов нет.
    physics: { friction: 1.1, wallBounce: 0.7, ballR: 2.5, playerR: 5, control: 8, trapSpeed: 230,
      passSpeed: [110, 250], shotSpeed: [150, 300], dribbleLag: 14 },
    // Скорость игрока = base + speed × perSpeed (px/с). Shift — ускорение Ромы.
    move: { base: 32, perSpeed: 6, sprint: 1.45, accel: 8, dribble: 0.8 },
    stamina: { drain: 0.3, regen: 0.12 },     // доли шкалы в секунду
    ai: { decide: [0.14, 0.28], shootRange: 140, shootAlways: 38, shootChance: [0.02, 0.006], pressDist: 18, fumblePerSec: 0.06,
      shotError: 0.13, passError: 0.025, tackleDist: 11, tackleCd: 1.2, coverDist: 40, carelessTackle: 0.3 },
    tackle: { base: 0.45, perSkill: 0.05, behindFoul: 0.85, stun: 0.6, rageFoul: 0.3 },
    yellowChance: 0.4,
    keeper: { baseSpeed: 34, perReaction: 7, dive: 2, delay: 0.035, reach: 10, perReach: 1, save: 0.52, perSave: 0.07, fastPenalty: 0.0011, hold: 0.9 },
    diarrheaAt: [25, 150],                       // секунда матча, когда у Смайла начинается диарея
    refLineEvery: [9, 16],                       // как часто Иван Владимирович что-то кричит
    // Перерыв: выбор Ромы в споре Дениса и Шурпо (метки в football.txt) — влияет на 2-й тайм.
    halftime: { barcaDenisSkill: 1, realShurpoSpeed: 2, realDenisSkill: -1, noneStress: -5 },
  },

  // Концовки (раздел 16).
  endings: {
    perfect: { aura: 70, avgGrade: 6 },
    baitLegend: { aura: 85, wins: 5 },
    squeezed: { breakdowns: 2, money: 100 },
  },

  // Действия на уроке через выборы («сидеть тихо»; телефон на уроке — короткая телефонная мини-игра).
  lessonActions: {
    quietStress: 3,
    quietSuspicionDrop: 10,
    quietAura: -2,          // тихоня ауру не фармит (баланс «Идеального дня», этап 6)
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
    quizTimes: [14, 30, 46],    // секунды, когда учитель обществоведения задаёт вопрос
    quizWrong: 6,               // неверный ответ: подозрение растёт
    spotBonus: 3,               // разовый скачок подозрения, когда учитель «заметил» подсматривание
  },

  // Оценка за урок, если главная мини-игра сама её не ставит (байт-дуэль на русском).
  lessonGrades: {
    byResult: { win: 8, draw: 6, lose: 4, director: 2 },
  },

  // ---------- Мини-игры этапа 4 (раздел 14) ----------
  // Телефон под партой: учитель у доски / признак поворота / смотрит; у физика — выходы из кабинета.
  phoneGames: {
    teacher: { board: [2.6, 5.0], warn: 0.4, watch: [1.2, 2.4] },
    suddenTurnWarn: 0.3,          // Жанна Петровна оборачивается внезапно
    outWindows: [[7, 17], [27, 16]], // Станислав Чеславович выходит: [с какой секунды, на сколько]
    shortDuration: 30,            // «залипнуть в телефон» как доп. действие на уроке
    batteryCost: -8,
    auraMin: 3, auraMax: 8,
    grade: { base: [5, 7], listenBonus: 1, listenShare: 0.45, caughtPenalty: 1, caughtAt: 40 },
    blocks: { duration: 45, target: 100, shortTarget: 62, linePoints: 10, comboBonus: 5 },
    brawl: { duration: 45, target: 20, shortTarget: 11, shortDuration: 31, coopTarget: 24, hp: 5, enemyHp: 2, maxEnemies: 3, enemySpeed: [16, 24], enemyFire: [1.6, 2.6],
      bulletSpeed: 120, enemyBullet: 52, playerSpeed: 58, fireCooldown: 0.3, denisFire: 1.2, spawnEvery: 1.6 },
    feed: { duration: 40, target: 8, shortTarget: 6, scroll: 20, fastScroll: 55 },
  },

  // «Царь туалета»: ползунок силы, Z в зелёной зоне — рывок. strength — сила соперника (0–1).
  toilet: {
    rounds: 3, roundTime: 15, sliderSpeed: 1.35, green: [0.4, 0.6], pull: 0.09, miss: 0.03,
    oppEvery: [0.6, 1.0], oppPull: 0.071,
    strength: { default: 0.55, guza: 0.74, igor: 0.72, denis: 0.55, chernyak: 0.6, shurpo: 0.5, matych: 0.5, buy: 0.52,
      levonchuk: 0.55, bochko: 0.5, smile: 0.55, vadim: 0.65, vitalik: 0.55, zakha: 0.55, anosov: 0.5 },
  },

  // «Кто больше парит»: держишь Z — шкала растёт; отпустил в зелёной зоне — большое облако.
  vapeBattle: {
    rounds: 5, fillSpeed: 0.3, fillAccel: 0.35, green: [0.72, 0.9], oppTurn: 2.4, roundPause: 1.6,
    chargeCost: -20, juiceCost: -1, stressAfter: 5, patrolCatch: 0.5,
    skill: { default: 0.58, chernyak: 0.6, denis: 0.56, shurpo: 0.66, levonchuk: 0.56, bochko: 0.5, matych: 0.52, buy: 0.56 },
  },

  // «Кто больше съест»: ритм-игра, серия попаданий = съеденная смаженка.
  eat: {
    duration: 40, entry: 360, notesPerSmazhenka: 6, stomachMax: 10, window: 0.13, beat: 0.42,
    skill: { default: 7, denis: 7.2, shurpo: 7.4, igor: 7.2, guza: 7.3, matych: 7, buy: 6.8, chernyak: 7, levonchuk: 7,
      bochko: 6.8, smile: 7, vadim: 7.2, vitalik: 6.8, zakha: 7, anosov: 6.8 },
  },

  // «Кто забайтит Матыча и Буя»: Рома и друг против двоих.
  baitMB: { rounds: 4, mid: [18, 26], strong: [32, 46], strongChance: 0.55, backfire: 10, friend: [8, 18], retort: [9, 15], winSum: 160, nearPx: 112 },

  // «Душ»: держи Z, держи температуру в зоне, отбивайся X от толчков. friends — сколько секунд стоят друзья.
  shower: {
    maxTime: 60, comfort: [0.36, 0.64], drift: 0.28, jumpEvery: [2.2, 4], jump: 0.3, adjust: 0.75, discomfort: 0.3,
    pushEvery: [6, 10], pushWindow: 0.9, loseStress: 10,
    friends: { igor: [30, 50], denis: [26, 44], chernyak: [28, 48], shurpo: [22, 38], default: [26, 44] },
  },

  // Кто может предложить игру сам (инициатива NPC): шанс при разговоре.
  challengeChance: 0.3,

  // Движение по карте (пикселей в секунду).
  move: {
    walk: 64,
    run: 112,
  },
};

// Стартовые значения в виде, удобном для HUD/отладки.
export const STAT_KEYS = ['battery', 'stress', 'aura', 'vapeCharge', 'juice', 'suspicion', 'hunger', 'money'];
