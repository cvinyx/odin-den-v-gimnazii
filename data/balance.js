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
    lunch: { name: 'Комплексный обед (блюдо дня)', price: 350, hunger: -50, stress: 0, lunchOnly: true },
    tea: { name: 'Чай', price: 40, hunger: -5, stress: -3 },
    // Л-12 (V2-3)
    carbonara: { name: 'Карбонарка', price: 200, hunger: -35, stress: -3 },
    shashlik: { name: 'Шашлычок', price: 200, hunger: -30, stress: -5 },
    vitba: { name: 'Батончик «Витьба»', price: 90, hunger: -12, stress: -4 },
    bun: { name: 'Булочка с повидлом', price: 120, hunger: -18, stress: -2 },
    juice: { name: 'Сок 1 литр', price: 250, hunger: -8, stress: -6 },
  },

  // V2-3: туалеты (Л-18) и турникеты Face-ID (ИС-6)
  toilets: { wrongDoorAura: -5 },
  faceId: { failChance: 0.15, failDelay: 1.5 },

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
    stealChance: 0.5,           // ИС-4
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

  // Эль-Класико (раздел 15, V2-7: Ф-6, Ф-7, Ф-8, Ф-14, Ф-15). Скорость / навык 1–10 почти равны (Ф-6):
  // разница — в характере (traits: pass — как часто пасует, shoot — как охотно бьёт). Вратари — реакция.
  football: {
    halfSeconds: 100,
    halves: 2,
    goldenSeconds: 120,                        // золотой гол (Ф-8): овертайм до первого гола, но не дольше
    diarrheaChance: 0.5,                       // Ф-14
    // Ярость Игоря (Ф-7): только если его разозлили до матча; раз в тайме на 3–5 с.
    rage: { speed: 1.25, seconds: [3, 5], at: [15, 70], superDelay: 0.6, superSpeed: 260, ownGoal: 0.15 },
    win: { aura: 20, stress: -10 },
    draw: { aura: 0, stress: 0 },
    lose: { aura: -10, stress: 0 },
    goalAura: 5,
    players: {
      chernyak: { speed: 6, skill: 6 },
      vadim: { speed: 5, skill: 6 },
      vitalik: { speed: 6, skill: 5 },
      shurpo: { speed: 5, skill: 6 },
      bochko: { speed: 5, skill: 5 },
      zakha: { speed: 5, skill: 5 },
      igor: { speed: 6, skill: 6 },
      roma: { speed: 6, skill: 5 },
      denis: { speed: 5, skill: 6 },
      matych: { speed: 6, skill: 6 },
      guza: { speed: 5, skill: 6 },
    },
    traits: {
      chernyak: { pass: 0.7, shoot: 1.5 }, shurpo: { pass: 1.4, shoot: 0.8 }, vadim: { pass: 1.2, shoot: 0.8 },
      vitalik: { pass: 1, shoot: 1.1 }, bochko: { pass: 0.8, shoot: 1.3 }, zakha: { pass: 1.2, shoot: 0.9 },
      igor: { pass: 0.6, shoot: 1.6 }, roma: { pass: 1, shoot: 1 }, denis: { pass: 1.5, shoot: 0.8 },
      matych: { pass: 1.3, shoot: 0.7 }, guza: { pass: 0.8, shoot: 1.3 },
    },
    keepers: { smile: 6, buy: 6, bochko: 6, zakha: 5 },
    attackers: ['roma', 'igor', 'chernyak', 'vitalik'], // роли: остальные полевые — в защите
    // Физика (пиксели и секунды). Мяч отскакивает от стен, аутов нет. Скорости снижены (Ф-14).
    physics: { friction: 1.2, wallBounce: 0.7, ballR: 2.5, playerR: 5, control: 8, trapSpeed: 190,
      passSpeed: [90, 190], shotSpeed: [130, 235], dribbleLag: 12 },
    // Скорость игрока = base + speed × perSpeed (px/с). Shift — ускорение Ромы.
    move: { base: 26, perSpeed: 4.5, sprint: 1.45, accel: 7, dribble: 0.8 },
    stamina: { drain: 0.3, regen: 0.12 },     // доли шкалы в секунду
    ai: { decide: [0.16, 0.32], shootRange: 130, shootAlways: 36, shootChance: [0.02, 0.006], pressDist: 18, fumblePerSec: 0.06,
      shotError: 0.13, passError: 0.025, tackleDist: 11, tackleCd: 1.3, coverDist: 40, carelessTackle: 0.3 },
    tackle: { base: 0.45, perSkill: 0.05, behindFoul: 0.85, stun: 0.6 },
    handChance: 0.03,                          // «Рука!»: быстрый мяч попал в руку сопернику
    keeper: { baseSpeed: 30, perReaction: 6, dive: 2, delay: 0.035, reach: 10, perReach: 1, save: 0.34, perSave: 0.07, fastPenalty: 0.0011, hold: 0.9 },
    diarrheaAt: [25, 150],                       // секунда матча, когда у Смайла начинается диарея
    // Штрафные и пенальти (Ф-15): не больше 3 за тайм, время стоит. Бегунок направления (−1…1 — створ,
    // за ±1 — мимо), затем бегунок силы (выше max — над воротами). Вратарь «читает» удар по реакции.
    setPiece: { perHalf: 3, penaltyR: 46, aimSpeed: 2.4, aimRange: 1.2, powerPeriod: 1.3, overPower: 0.94,
      read: [0.2, 0.05], reach: { penalty: 0.32, free: 0.55 }, perReach: 0.03, powerBeat: 0.35, freeWide: 0.85 },
    // Перерыв: выбор Ромы в споре Дениса и Шурпо (метки в football.txt) — влияет на 2-й тайм.
    halftime: { barcaDenisSkill: 1, realShurpoSpeed: 1, realDenisSkill: -1, igorSkill: 1, noneStress: -5 },
  },

  // Концовки недели по среднему баллу (ИС-5, Р-5): > 8,0 — «Гордость семьи»; 6,0–8,0 — «Поступаю в БНТУ»;
  // 4,0–5,99 — «Дорога в хабзу»; < 4,0 — «Папочка зол».
  endings: { pride: 8.0, bntu: 6.0, habza: 4.0 },

  // Оценки (М-4, Р-6, Р-7): минимум у точных и гуманитарных, сколько уроков недели без оценки.
  grades: { minExact: 1, minHumanities: 2, noGradePerWeek: [2, 3] },

  // Утро нового дня (Р-2).
  morning: { battery: [20, 70], vape: [20, 70], stress: 30, hunger: 40, time: '08:50' },

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
      kid5: { resist: 1.5, attack: [4, 8] }, // пятиклассник: слабее обычных соперников
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
    calmAfter: 10,              // ИС-3: столько секунд без «попался» — и подозрение начинает падать
    calmRate: 2,                // на столько в секунду
    walkChance: 0.1,            // М-8: шанс за урок, что учитель пройдёт по рядам
    walkSeconds: 9,             // сколько длится проход (туда и обратно)
  },

  // Тест на уроке (М-4, ИС-1): 10 вопросов, решать самому / у соседа / с телефона
  test: {
    questions: 10,
    questionSeconds: 20,        // на один вопрос, если решаешь сам
    cheatSeconds: 40,           // сколько длится списывание (потом недосписанное — решать самому)
    neighborAccuracy: 0.8,      // доля верных ответов, списанных у соседа
    phoneAccuracy: 0.9,         // с телефона точнее…
    phoneSuspicionMul: 1.5,     // …но учитель замечает телефон сильнее
    phoneBatteryPerAnswer: -1,
    botRight: 0.6,              // бот, решающий сам, отвечает верно с таким шансом
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
    duration: 45, entry: 0, notesPerSmazhenka: 5, stomachMax: 10, window: 0.24, beat: 0.8, beatFast: 0.55, // V2-5: проще и медленнее, вход бесплатный (Л-13)
    skill: { default: 5.4, denis: 5.6, shurpo: 5.8, igor: 5.6, guza: 5.7, matych: 5.5, buy: 5.5, chernyak: 5.4, levonchuk: 5.4,
      bochko: 5.2, smile: 5.4, vadim: 5.6, vitalik: 5.2, zakha: 5.4, anosov: 5.2 },
  },

  // «Кто забайтит Матыча и Буя»: Рома и друг против двоих.
  baitMB: { rounds: 4, mid: [18, 26], strong: [32, 46], strongChance: 0.55, backfire: 10, friend: [8, 18], retort: [9, 15], winSum: 160, nearPx: 112 },

  // «Душ»: держи Z, держи температуру в зоне, отбивайся X от толчков. friends — сколько секунд стоят друзья.
  shower: {
    maxTime: 60, comfort: [0.36, 0.64], drift: 0.28, jumpEvery: [2.2, 4], jump: 0.3, adjust: 0.75, discomfort: 0.3,
    pushEvery: [6, 10], pushWindow: 0.9, loseStress: 10,
    friends: { igor: [30, 50], denis: [26, 44], chernyak: [28, 48], shurpo: [22, 38], default: [26, 44] },
  },

  // V2-5: перемены
  kid5: { chance: 0.15 },                         // Л-10: пятиклассник в кабинке мужского туалета
  basketball: { chance: 0.25, throwEvery: 2.6, hitChance: 0.4 },   // М-3: баскетбол в спортзале
  powerbank: { chance: 0.25, min: 67, max: 98 },  // М-1
  ask: { chance: 0.4, testChance: 0.55 },         // М-7: вопросы ученикам других классов
  diarrhea: { chance: 0.33, seconds: 30, noticedChance: 0.35, aura: { sock: -3, notebook: -4, none: -8 }, noticedAura: -6, stress: 5 }, // М-2
  dishes: ['рис и котлета', 'макароны и рыба', 'гречка с гуляшом', 'пюре и сосиска', 'плов с курицей'], // Л-14: блюдо дня (Пн–Пт)

  // Классный час (У-2): совместный байт учительницы
  classhour: { rounds: 5, friendBoil: [3, 7], romaBoil: [5, 10, 18], kickChance: 0.25, winAura: 10, loseAura: -2, kickAura: -5 },

  // Плавание (У-3): урок 4–5 минут, заплывы на две дорожки, физрук уходит и возвращается по кругу
  swim: {
    duration: 260, commandSeconds: 3, awaySeconds: [14, 20], heatMaxSeconds: 25, distance: 200,
    strokePower: 4, drag: 1.2, strokeCost: 0.02, staminaRegen: 0.15,
    hungerStamina: 0.3,        // при голоде выше порога запас выносливости меньше на эту долю
    forgotChance: 0.1,         // шанс забыть форму (у каждого) — урок на лавке
    npcSpeed: { igor: [17, 21], denis: [13, 17], guza: [14, 18], matych: [15, 19], buy: [15, 19], default: [14, 18] },
    winAura: 3, overtakeAura: 1, splashAura: 1, dunkAura: 2, funCap: 8, caughtStress: 10, hunger: 10,
    earlyReturnChance: 0.2,    // притопил друга — физрук может вернуться раньше и застать
    benchSeconds: 60,          // урок на лавке (Рома забыл форму)
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
