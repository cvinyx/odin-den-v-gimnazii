// Ученики (раздел 9). Внешность — параметры генератора src/gen/sprites.js и portraits.js.
// heightCm → высота спрайта 22–28 px. blip — тон печати текста (Гц) и тембр.

export const SKIN = {
  pale: '#f6d7bc',
  light: '#f0c39a',
  warm: '#e2ac83',
  tan: '#c98e64',
};

export const EYES = {
  blue: '#2f63c8',
  lightblue: '#62a4ec',
  green: '#2f8f45',
  brown: '#6b3e1e',
  darkbrown: '#3b2213',
  gray: '#6d7c88',
};

export const HAIR = {
  blond: '#e9cf6e',
  lightblond: '#f3e19a',
  chestnut: '#7b4526',
  darkchestnut: '#4b2a17',
  black: '#1d1a1c',
  brown: '#5e3a22',
  gray: '#c9c9cf',
  auburn: '#9a4423',
  red: '#b8461f',
  darkblond: '#b99a52',
};

// Именные ученики (EDITS_V2: В-1…В-15, Н-1…Н-4). name — полное имя, short — как зовут в игре
// (подпись окна диалога), nicknames — клички (только среди учеников; rare — использовать редко).
const BLACK = '#18181c', WHITE = '#f4f4f4';
const SNEAKER = '#1d1b20';
const STRIPES3 = '#f4f4f4'; // три белые полоски — один светлый пиксель на кроссовке

export const CHARACTERS = {
  roma: {
    name: 'Рома Ковган', short: 'Рома', cls: '11 «И»', heightCm: 183, build: 'normal',
    nicknames: [{ name: 'Косой' }, { name: 'Коган' }],
    skin: SKIN.light, hairStyle: 'tousled', hairColor: HAIR.lightblond, eyeColor: EYES.blue,
    top: 'suit', topColor: BLACK, shirtColor: WHITE, pants: 'wide', pantsColor: '#141418',
    shoeColor: SNEAKER, tie: null, bigLips: true, glasses: 'round',
    blip: { freq: 300, wave: 'square' },
    about: 'Игрок. Списывает, лагающий iPhone 11, вейп, ведётся на байт.',
  },
  chernyak: {
    name: 'Артём Черняк', short: 'Черняк', cls: '11 «М»', heightCm: 183, build: 'normal',
    nicknames: [{ name: 'Чер' }],
    skin: SKIN.pale, hairStyle: 'bangs', hairColor: '#5a4a35', eyeColor: EYES.green,
    top: 'suit', topColor: BLACK, shirtColor: '#202024', pants: 'trousers', pantsColor: '#121216',
    shoeColor: '#141416', belt: true, tie: null,
    blip: { freq: 196, wave: 'triangle' },
    about: 'Лучший друг. Молчит и фармит ауру.',
  },
  igor: {
    name: 'Игорь Ступяк', short: 'Игорь', cls: '11 «И»', heightCm: 175, build: 'athletic',
    nicknames: [{ name: 'Сорняк', rare: true }, { name: 'Стояк', rare: true }],
    skin: SKIN.light, hairStyle: 'wavy', hairColor: '#d6b25a', hairStreak: '#ecd27e', eyeColor: EYES.lightblue,
    top: 'shirt', topColor: BLACK, shirtColor: '#1c1c22', pants: 'trousers', pantsColor: '#141418',
    shoeColor: SNEAKER, shoeStripe: STRIPES3, tie: null, bigForehead: true,
    blip: { freq: 250, wave: 'sawtooth' },
    about: 'Качает даже лоб. Супергромкий смех. Забайтишь — ярость.',
  },
  denis: {
    name: 'Денис Поповский', short: 'Денис', cls: '11 «И»', heightCm: 173, build: 'full',
    nicknames: [{ name: 'Поп' }],
    skin: SKIN.light, hairStyle: 'medium', hairColor: '#8a6e50', hairStreak: '#9a9088', eyeColor: EYES.brown,
    top: 'suit', topColor: BLACK, shirtColor: WHITE, pants: 'wide', pantsColor: '#141418',
    shoeColor: '#121214', shoeStripe: STRIPES3, tie: '#121212', rippedPants: true,
    blip: { freq: 400, wave: 'square' },
    about: 'Крепкий, лохматый. Месси, «Барселона», Brawl Stars. Джинсы рвутся сзади.',
  },
  levonchuk: {
    name: 'Артём Левончук', short: 'Левончук', cls: '11 «Я»', heightCm: 187, build: 'thin',
    nicknames: [{ name: 'Лёва' }],
    skin: SKIN.light, hairStyle: 'tousled', hairColor: '#2e2018', eyeColor: EYES.darkbrown, narrowEyes: true,
    top: 'shirt', topColor: WHITE, shirtColor: WHITE, pants: 'trousers', pantsColor: '#1c1c22',
    shoeColor: '#24242a', tie: null, bigChin: true,
    blip: { freq: 232, wave: 'square' },
    about: 'Из деревни. Standoff 2, танки, баскетбол, аниме. Дед — Василий.',
  },
  bochko: {
    name: 'Коля Бочко', short: 'Коля', cls: '11 «Я»', heightCm: 185, build: 'normal',
    nicknames: [{ name: 'Бочкин' }],
    skin: SKIN.warm, hairStyle: 'tousled', hairColor: '#c9a868', eyeColor: EYES.brown,
    top: 'shirt', topColor: BLACK, shirtColor: '#1c1c22', pants: 'trousers', pantsColor: '#26262c',
    shoeColor: SNEAKER, tie: null, glasses: 'sun', bigLips: true, ring: true,
    blip: { freq: 340, wave: 'triangle' },
    about: 'Его отец — банан. Ужасно играет в футбол. Очки и кольцо.',
  },
  shurpo: {
    name: 'Артём Шурпо', short: 'Шурпо', cls: '11 «М»', heightCm: 173, build: 'full',
    nicknames: [{ name: 'Шар' }],
    skin: SKIN.light, hairStyle: 'curly', hairColor: '#1e1814', eyeColor: EYES.brown,
    top: 'zip-hoodie', topColor: '#1a1a1e', shirtColor: WHITE, pants: 'wide', pantsColor: '#18181c',
    shoeColor: SNEAKER, tie: null, noBrows: true,
    blip: { freq: 175, wave: 'square' },
    about: 'Без бровей, кудри, «Реал». Обожает вейп. Очень медленный.',
  },
  smile: {
    name: 'Максим Самойлик', short: 'Смайл', cls: '11 «М»', heightCm: 185, build: 'normal',
    skin: SKIN.light, hairStyle: 'fringe', hairColor: '#2a1d16', eyeColor: EYES.brown,
    top: 'tank', topColor: '#f6f6f6', shirtColor: '#f6f6f6', pants: 'trousers', pantsColor: '#141418',
    shoeColor: '#2f5fc8', tie: null, wideSmile: true,
    blip: { freq: 360, wave: 'square' },
    about: 'Вратарь «Физмата». Fortnite и мечты о переезде в Германию.',
  },
  vadim: {
    name: 'Вадим Семашко', short: 'Вадим', cls: '11 «М»', heightCm: 191, build: 'normal',
    skin: SKIN.light, hairStyle: 'medium', hairColor: '#5a4632', eyeColor: EYES.brown,
    top: 'sweater', topColor: '#3d4a5c', shirtColor: WHITE, pants: 'trousers', pantsColor: '#22242a',
    shoeColor: SNEAKER, tie: null,
    blip: { freq: 280, wave: 'square' },
    about: '«Физмат». Высокий, полевой. Молчун.',
  },
  anosov: {
    name: 'Миша Аносов', short: 'Миша', cls: '11 «М»', heightCm: 190, build: 'full',
    // «Анус» — только когда о нём говорят другие, не в разговоре с ним самим (Н-4)
    nicknames: [{ name: 'Анус', aboutOnly: true }],
    skin: SKIN.warm, hairStyle: 'buzz', hairColor: HAIR.black, eyeColor: EYES.darkbrown,
    top: 'hoodie', topColor: '#4a3a5a', shirtColor: '#4a3a5a', pants: 'jeans', pantsColor: '#2a3550',
    shoeColor: '#e6e6ea', tie: null,
    blip: { freq: 210, wave: 'triangle' },
    about: '11 «М». Большой и молчаливый.',
  },
  vitalik: {
    name: 'Виталий Дзитко', short: 'Виталик', cls: '11 «М»', heightCm: 185, build: 'thin',
    skin: SKIN.pale, hairStyle: 'short', hairColor: '#141012', eyeColor: EYES.brown,
    top: 'sweater', topColor: '#2c4c9a', shirtColor: '#2c4c9a', pants: 'trousers', pantsColor: '#1e2028',
    shoeColor: SNEAKER, tie: null,
    blip: { freq: 310, wave: 'triangle' },
    about: '«Физмат». Полевой. Синяя кофта. Молчун.',
  },
  zakha: {
    name: 'Захар Корень', short: 'Заха', cls: '11 «М»', heightCm: 175, build: 'athletic',
    skin: SKIN.light, hairStyle: 'side-part', hairColor: HAIR.lightblond, eyeColor: EYES.blue,
    top: 'shirt', topColor: WHITE, shirtColor: WHITE, pants: 'track', pantsColor: '#2a2e3a',
    tie: null,
    blip: { freq: 270, wave: 'sawtooth' },
    about: 'Скамейка «Физмата», может встать в ворота. Молчун.',
  },
  matych: {
    name: 'Матвей Павочка', short: 'Матыч', cls: '11 «И»', heightCm: 187, build: 'thin',
    skin: SKIN.light, hairStyle: 'wavy', hairColor: '#2a1e18', eyeColor: EYES.brown,
    top: 'sweater', topColor: '#8a8c92', shirtColor: '#8a8c92', pants: 'wide', pantsColor: '#141418',
    shoeColor: '#3f9a4a', tie: null, bigNose: true, bigLips: true,
    blip: { freq: 230, wave: 'triangle' },
    about: 'Огромный нос. В футбол играет хуже Коли. На английском — в группе немецкого.',
  },
  buy: {
    name: 'Никита Буевич', short: 'Буй', cls: '11 «И»', heightCm: 187, build: 'thin',
    skin: SKIN.light, hairStyle: 'tousled', hairColor: HAIR.chestnut, eyeColor: '#7ab8f0', hetero: '#6b3e1e',
    top: 'suit', topColor: BLACK, shirtColor: WHITE, pants: 'joggers', pantsColor: '#141418',
    shoeColor: SNEAKER, shoeStripe: '#d0262e', tie: null, briefcase: true,
    blip: { freq: 320, wave: 'square' },
    about: '«Бизнесмен» без денег. Вратарь «ИнЯза». Гетерохромия.',
  },
  guza: {
    name: 'Никита Гузаревич', short: 'Гуза', cls: '11 «И»', heightCm: 187, build: 'full',
    skin: SKIN.light, hairStyle: 'bangs', hairColor: '#a8865a', eyeColor: EYES.blue,
    top: 'sweater', topColor: '#18181c', shirtColor: WHITE, pants: 'trousers', pantsColor: '#121216',
    shoeColor: '#24242a', shoeStripe: STRIPES3, tie: null,
    blip: { freq: 150, wave: 'sawtooth' },
    about: 'Крупный, нестабильный. Сильный соперник в «Царе туалета».',
  },
  vanya: {
    name: 'Ваня Максимов', short: 'Ваня', cls: '11 «У»', heightCm: 187, build: 'normal',
    nicknames: [{ name: 'Максим Иванов', rare: true }],
    skin: SKIN.light, hairStyle: 'fringe', hairColor: '#b9a06a', eyeColor: EYES.brown,
    top: 'zip-hoodie', topColor: '#3c5a46', shirtColor: WHITE, pants: 'trousers', pantsColor: '#2a2c34',
    shoeColor: '#e6e6ea', tie: null,
    blip: { freq: 290, wave: 'sine' },
    about: '11 «У». Спокойный, высокий.',
  },
  svyat: {
    name: 'Святослав Гулько', short: 'Святослав', cls: '11 «У»', heightCm: 173, build: 'normal',
    nicknames: [{ name: 'Светик' }],
    skin: SKIN.pale, hairStyle: 'short', hairColor: '#dcc890', eyeColor: EYES.brown,
    top: 'sweater', topColor: '#7a5a3c', shirtColor: WHITE, pants: 'jeans', pantsColor: '#34507a',
    shoeColor: SNEAKER, tie: null,
    blip: { freq: 370, wave: 'triangle' },
    about: '11 «У». Невысокий, любит вейп.',
  },
};

// Порядок в галерее.
export const STUDENT_ORDER = [
  'roma', 'chernyak', 'igor', 'denis', 'levonchuk', 'bochko', 'shurpo', 'smile',
  'vadim', 'anosov', 'vitalik', 'zakha', 'matych', 'buy', 'guza', 'vanya', 'svyat',
];

export const CLASSES = {
  I: ['roma', 'denis', 'igor', 'matych', 'buy', 'guza'],
  Ya: ['levonchuk', 'bochko'],
  M: ['chernyak', 'shurpo', 'vadim', 'smile', 'anosov', 'vitalik', 'zakha'],
  U: ['vanya', 'svyat'],
};

// Пулы параметров для безымянных учеников (генерация по сиду).
// ИС-17: ~70 % в форме гимназии (чёрный низ, белая рубашка/блузка, синий галстук с золотым
// пикселем-логотипом), остальные — в неярких тонах. Дети младших классов — рост 120–150 см.
export const UNNAMED_POOL = {
  heightCm: [158, 186],
  kidHeightCm: [120, 150],
  uniformShare: 0.7,
  uniform: { shirt: '#f4f4f4', bottom: '#16161a', tie: '#2a4aa8' },
  builds: ['thin', 'normal', 'normal', 'normal', 'athletic', 'full'],
  kidBuilds: ['thin', 'normal', 'normal'],
  skins: [SKIN.pale, SKIN.light, SKIN.light, SKIN.warm, SKIN.tan],
  hairBoy: ['short', 'side-part', 'buzz', 'spiky', 'curly-short', 'medium', 'slick', 'fringe', 'tousled'],
  hairGirl: ['long-straight', 'ponytail', 'bob', 'bun', 'long-straight'],
  hairColors: [HAIR.black, HAIR.brown, HAIR.chestnut, HAIR.darkchestnut, HAIR.blond, HAIR.darkblond, HAIR.auburn],
  eyes: Object.values(EYES),
  topsBoy: ['suit', 'shirt', 'sweater', 'hoodie'],
  topsGirl: ['blouse', 'sweater', 'suit', 'dress'],
  // неяркие тона для тех, кто не в форме
  topColors: ['#4b4f58', '#5a6470', '#6e6a62', '#4a5a4e', '#5c5266', '#7a7066', '#3e4652', '#8a8478'],
  pantsColors: ['#2a2c32', '#3a4252', '#4b4b52', '#3a3630', '#2f3a52'],
  blipBoy: [220, 380],
  blipGirl: [420, 620],
  blipKid: [480, 700],
  namesBoy: ['Ученик'],
  namesGirl: ['Ученица'],
};

// Голоса без спрайта и портрета (только текст).
export const VOICES = {
  dad: { name: 'Батя', short: 'Батя', voiceOnly: true, noPortrait: true, blip: { freq: 110, wave: 'sawtooth' } },
};
