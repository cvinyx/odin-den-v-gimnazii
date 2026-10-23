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

export const CHARACTERS = {
  roma: {
    name: 'Рома Ковган', short: 'Рома', cls: '11 «И»', heightCm: 183, build: 'normal',
    skin: SKIN.light, hairStyle: 'medium-straight', hairColor: HAIR.blond, eyeColor: EYES.blue,
    top: 'suit', topColor: '#33415e', shirtColor: '#f4f4f4', pants: 'trousers', pantsColor: '#2c3852',
    tie: null, bigLips: true,
    blip: { freq: 300, wave: 'square' },
    about: 'Игрок. Списывает, лагающий iPhone 11, вейп, ведётся на байт.',
  },
  chernyak: {
    name: 'Артём Черняк', short: 'Черняк', cls: '11 «М»', heightCm: 182, build: 'normal',
    skin: SKIN.pale, hairStyle: 'mullet', hairColor: HAIR.black, eyeColor: EYES.green,
    top: 'suit', topColor: '#18181c', shirtColor: '#26262c', pants: 'trousers', pantsColor: '#141418',
    tie: null,
    blip: { freq: 196, wave: 'triangle' },
    about: 'Лучший друг. Молчит и фармит ауру.',
  },
  igor: {
    name: 'Игорь Ступяк', short: 'Игорь', cls: '11 «И»', heightCm: 175, build: 'athletic',
    skin: SKIN.light, hairStyle: 'long-curly', hairColor: HAIR.lightblond, eyeColor: EYES.lightblue,
    top: 'shirt', topColor: '#3f4656', shirtColor: '#3f4656', pants: 'trousers', pantsColor: '#24272e',
    tie: null, bigForehead: true,
    blip: { freq: 250, wave: 'sawtooth' },
    about: 'Качает даже лоб. Супергромкий смех. Забайтишь — берсерк.',
  },
  denis: {
    name: 'Денис Поповский', short: 'Денис', cls: '11 «И»', heightCm: 160, build: 'full',
    skin: SKIN.light, hairStyle: 'long-messy', hairColor: HAIR.chestnut, eyeColor: EYES.brown,
    top: 'suit', topColor: '#4a4e57', shirtColor: '#eeeeee', pants: 'jeans', pantsColor: '#3d5a8a',
    tie: '#121212', rippedPants: true,
    blip: { freq: 400, wave: 'square' },
    about: '160 см, почти центнер. Месси, «Барселона», Brawl Stars.',
  },
  levonchuk: {
    name: 'Артём Левончук', short: 'Левончук', cls: '11 «Я»', heightCm: 190, build: 'thin',
    skin: SKIN.light, hairStyle: 'medium', hairColor: HAIR.darkchestnut, eyeColor: EYES.darkbrown,
    top: 'shirt', topColor: '#f2f2f2', shirtColor: '#f2f2f2', pants: 'trousers', pantsColor: '#1c1c20',
    tie: null, bigChin: true,
    blip: { freq: 232, wave: 'square' },
    about: 'Из деревни. Standoff 2, танки, баскетбол, аниме.',
  },
  bochko: {
    name: 'Коля Бочко', short: 'Коля', cls: '11 «Я»', heightCm: 176, build: 'normal',
    skin: SKIN.warm, hairStyle: 'village', hairColor: HAIR.lightblond, eyeColor: EYES.brown,
    top: 'sweater', topColor: '#7f8f5a', shirtColor: '#e8e8e8', pants: 'trousers', pantsColor: '#4b4b52',
    tie: null, glasses: 'round',
    blip: { freq: 340, wave: 'triangle' },
    about: 'Его отец — банан. Ужасно играет в футбол.',
  },
  shurpo: {
    name: 'Артём Шурпо', short: 'Шурпо', cls: '11 «М»', heightCm: 178, build: 'full',
    skin: SKIN.light, hairStyle: 'long-curly', hairColor: HAIR.black, eyeColor: EYES.brown,
    top: 'tshirt-supreme', topColor: '#f6f6f6', shirtColor: '#f6f6f6', pants: 'wide', pantsColor: '#8a8d93',
    tie: null, noBrows: true,
    blip: { freq: 175, wave: 'square' },
    about: 'Без бровей, Supreme, «Реал». Обожает вейп. Очень медленный.',
  },
  smile: {
    name: 'Смайл', short: 'Смайл', cls: '11 «М»', heightCm: 182, build: 'normal',
    skin: SKIN.light, hairStyle: 'short', hairColor: HAIR.chestnut, eyeColor: EYES.brown,
    top: 'shirt', topColor: '#f7f7f7', shirtColor: '#f7f7f7', pants: 'trousers', pantsColor: '#18181c',
    tie: null, wideSmile: true,
    blip: { freq: 360, wave: 'square' },
    about: 'Вратарь «Физмата». Fortnite и мечты о переезде в Германию.',
  },
  vadim: {
    name: 'Вадим', short: 'Вадим', cls: '11 «М»', heightCm: 179, build: 'athletic',
    skin: SKIN.light, hairStyle: 'side-part', hairColor: HAIR.brown, eyeColor: EYES.gray,
    top: 'shirt', topColor: '#9cc3e6', shirtColor: '#9cc3e6', pants: 'trousers', pantsColor: '#2a2d36',
    tie: null,
    blip: { freq: 280, wave: 'square' },
    about: '«Физмат». Крепкий полевой.',
  },
  anus: {
    name: 'Анус', short: 'Анус', cls: '11 «М»', heightCm: 171, build: 'thin',
    skin: SKIN.warm, hairStyle: 'buzz', hairColor: HAIR.black, eyeColor: EYES.darkbrown,
    top: 'hoodie', topColor: '#7a3b8c', shirtColor: '#7a3b8c', pants: 'jeans', pantsColor: '#2f4a78',
    tie: null,
    blip: { freq: 420, wave: 'triangle' },
    about: '11 «М». Второстепенный.',
  },
  vitalik: {
    name: 'Виталик', short: 'Виталик', cls: '11 «М»', heightCm: 177, build: 'normal',
    skin: SKIN.pale, hairStyle: 'spiky', hairColor: HAIR.darkblond, eyeColor: EYES.blue,
    top: 'suit', topColor: '#5a4632', shirtColor: '#f0f0f0', pants: 'trousers', pantsColor: '#3e3226',
    tie: null,
    blip: { freq: 310, wave: 'triangle' },
    about: '«Физмат». Полевой.',
  },
  zakha: {
    name: 'Заха', short: 'Заха', cls: '11 «М»', heightCm: 174, build: 'normal',
    skin: SKIN.tan, hairStyle: 'curly-short', hairColor: HAIR.black, eyeColor: EYES.darkbrown,
    top: 'tracksuit', topColor: '#2c3e8c', shirtColor: '#2c3e8c', pants: 'track', pantsColor: '#2c3e8c',
    tie: null,
    blip: { freq: 270, wave: 'sawtooth' },
    about: 'Скамейка «Физмата», может встать в ворота.',
  },
  matych: {
    name: 'Матыч', short: 'Матыч', cls: '11 «И»', heightCm: 172, build: 'normal',
    skin: SKIN.light, hairStyle: 'short', hairColor: HAIR.darkchestnut, eyeColor: EYES.brown,
    top: 'sweater', topColor: '#8c2f39', shirtColor: '#f0f0f0', pants: 'trousers', pantsColor: '#33333a',
    tie: null, bigNose: true,
    blip: { freq: 230, wave: 'triangle' },
    about: 'Огромный нос. В футбол играет хуже Коли.',
  },
  buy: {
    name: 'Буй', short: 'Буй', cls: '11 «И»', heightCm: 176, build: 'normal',
    skin: SKIN.light, hairStyle: 'slick', hairColor: HAIR.black, eyeColor: EYES.gray,
    top: 'suit', topColor: '#1f2b45', shirtColor: '#f5f5f5', pants: 'trousers', pantsColor: '#1f2b45',
    tie: '#b8323a', briefcase: true,
    blip: { freq: 320, wave: 'square' },
    about: '«Бизнесмен» без денег. Вратарь «ИнЯза».',
  },
  guza: {
    name: 'Гуза', short: 'Гуза', cls: '11 «И»', heightCm: 187, build: 'full',
    skin: SKIN.warm, hairStyle: 'buzz', hairColor: HAIR.brown, eyeColor: EYES.darkbrown,
    top: 'hoodie', topColor: '#3a3d42', shirtColor: '#3a3d42', pants: 'track', pantsColor: '#202226',
    tie: null,
    blip: { freq: 150, wave: 'sawtooth' },
    about: 'Крупный, нестабильный. Сильный соперник в «Царе туалета».',
  },
};

// Порядок в галерее.
export const STUDENT_ORDER = [
  'roma', 'chernyak', 'igor', 'denis', 'levonchuk', 'bochko', 'shurpo', 'smile',
  'vadim', 'anus', 'vitalik', 'zakha', 'matych', 'buy', 'guza',
];

// Классы (раздел 9).
export const CLASSES = {
  I: ['roma', 'denis', 'igor', 'matych', 'buy', 'guza'],
  Ya: ['levonchuk', 'bochko'],
  M: ['chernyak', 'shurpo', 'vadim', 'smile', 'anus', 'vitalik', 'zakha'],
};

// Пулы параметров для безымянных учеников (генерация по сиду).
export const UNNAMED_POOL = {
  heightCm: [158, 186],
  builds: ['thin', 'normal', 'normal', 'normal', 'athletic', 'full'],
  skins: [SKIN.pale, SKIN.light, SKIN.light, SKIN.warm, SKIN.tan],
  hairBoy: ['short', 'side-part', 'buzz', 'spiky', 'curly-short', 'medium', 'slick'],
  hairGirl: ['long-straight', 'ponytail', 'bob', 'bun', 'long-straight'],
  hairColors: [HAIR.black, HAIR.brown, HAIR.chestnut, HAIR.darkchestnut, HAIR.blond, HAIR.darkblond, HAIR.auburn],
  eyes: Object.values(EYES),
  topsBoy: ['suit', 'shirt', 'sweater', 'hoodie'],
  topsGirl: ['blouse', 'sweater', 'suit', 'dress'],
  topColors: ['#2d3a57', '#4b4f58', '#f2f2f2', '#9cc3e6', '#6b2a33', '#3c5a3a', '#1c1c20', '#7a6a8f', '#c9b38a'],
  pantsColors: ['#1c1c20', '#2c3852', '#4b4b52', '#33333a', '#2f4a78'],
  blipBoy: [220, 380],
  blipGirl: [420, 620],
  namesBoy: ['Ученик'],
  namesGirl: ['Ученица'],
};
