// Учителя (раздел 10): нейтральные вежливые взрослые. Различаются внешностью и игровыми параметрами.
import { SKIN, EYES, HAIR } from './characters.js';

// EDITS_V2, У-1: по одному учителю на предмет, имена и отчества вымышленные. Пол — по У-1.
// id = предмет. Игровые параметры (params) перешли от учителей версии 1 по тем же предметам.
export const TEACHERS = {
  english: {
    name: 'Инна Геннадьевна', short: 'Инна', role: 'английский язык', female: true, heightCm: 168, build: 'normal',
    skin: SKIN.pale, hairStyle: 'bun', hairColor: HAIR.darkblond, eyeColor: EYES.blue,
    top: 'blouse', topColor: '#cfe0f2', shirtColor: '#cfe0f2', pants: 'skirt', pantsColor: '#2d3550',
    glasses: 'thin', adult: true,
    blip: { freq: 560, wave: 'triangle' },
    params: { coneWidth: 'wide', turnEvery: [2, 4], likesTests: true },
  },
  math: {
    name: 'Жанна Петровна', short: 'Жанна', role: 'математика (алгебра, геометрия)', female: true, heightCm: 164, build: 'normal',
    skin: SKIN.light, hairStyle: 'bob', hairColor: HAIR.brown, eyeColor: EYES.brown,
    top: 'cardigan', topColor: '#6d5a8c', shirtColor: '#f0f0f0', pants: 'skirt', pantsColor: '#2b2b33',
    adult: true,
    blip: { freq: 520, wave: 'triangle' },
    params: { backToClass: true, suddenTurn: true },
  },
  russian: {
    name: 'Лариса Анатольевна', short: 'Лариса', role: 'русский язык и литература', female: true, heightCm: 170, build: 'thin',
    skin: SKIN.pale, hairStyle: 'long-straight', hairColor: HAIR.auburn, eyeColor: EYES.green,
    top: 'dress', topColor: '#3f6b5a', shirtColor: '#3f6b5a', pants: 'skirt', pantsColor: '#3f6b5a',
    adult: true,
    blip: { freq: 600, wave: 'sine' },
    params: { suspicionMul: 1.0, walksRows: true },
  },
  belarusian: {
    name: 'Ядвига Францевна', short: 'Ядвига', role: 'белорусский язык и литература', female: true, heightCm: 160, build: 'full',
    skin: SKIN.light, hairStyle: 'bun', hairColor: '#b8b2aa', eyeColor: EYES.brown,
    top: 'cardigan', topColor: '#b46a3c', shirtColor: '#f3e6d0', pants: 'skirt', pantsColor: '#4a3a30',
    glasses: 'thin', adult: true,
    blip: { freq: 500, wave: 'sine' },
    params: { suspicionMul: 0.5, secondChance: true },
  },
  physics: {
    name: 'Станислав Чеславович', short: 'Станислав', role: 'физика и астрономия', heightCm: 178, build: 'normal',
    skin: SKIN.light, hairStyle: 'side-part', hairColor: '#8e8a86', eyeColor: EYES.gray,
    top: 'suit', topColor: '#5b5f66', shirtColor: '#dfe6ee', pants: 'trousers', pantsColor: '#44474d',
    tie: '#2c4a7a', glasses: 'thin', beard: true, adult: true,
    blip: { freq: 210, wave: 'triangle' },
    params: { leavesRoom: 2, leaveSeconds: [15, 20] },
  },
  ivan: {
    // ИС-14, В-16: физрук (переименован). Невысокий, пухлый, усы и причёска «как у Сталина».
    name: 'Иван Владимирович', short: 'Иван', role: 'физкультура', heightCm: 170, build: 'full',
    skin: SKIN.light, hairStyle: 'stalin', hairColor: '#cfcfd4', eyeColor: EYES.lightblue, mustache: 'stalin',
    top: 'vest', topColor: '#1e2a4a', shirtColor: '#2c3a62', pants: 'track', pantsColor: '#1e2a4a',
    shoeColor: '#141416', shoeStripe: '#f4f4f4', whistle: true, adult: true,
    blip: { freq: 200, wave: 'square' },
    params: { strictReferee: true },
  },
  social: {
    name: 'Нонна Аркадьевна', short: 'Нонна', role: 'обществоведение', female: true, heightCm: 166, build: 'normal',
    skin: SKIN.light, hairStyle: 'curly-short', hairColor: HAIR.darkchestnut, eyeColor: EYES.darkbrown,
    top: 'suit', topColor: '#7a2638', shirtColor: '#f4f4f4', pants: 'skirt', pantsColor: '#2a2a30',
    adult: true,
    blip: { freq: 540, wave: 'triangle' },
    params: { suspicionMul: 1.5, rightAnswerSuspicion: -15 },
  },
  history: {
    name: 'Тамара Ивановна', short: 'Тамара', role: 'история Беларуси и всемирная история', female: true, heightCm: 163, build: 'full',
    skin: SKIN.pale, hairStyle: 'bob', hairColor: '#7a3a2a', eyeColor: EYES.gray,
    top: 'suit', topColor: '#3a4a3a', shirtColor: '#f2eee0', pants: 'skirt', pantsColor: '#2e3a2e',
    glasses: 'thin', adult: true,
    blip: { freq: 490, wave: 'triangle' },
    params: { suspicionMul: 1.2 },
  },
  chemistry: {
    name: 'Ирина Вацлавовна', short: 'Ирина', role: 'химия', female: true, heightCm: 165, build: 'normal',
    skin: SKIN.pale, hairStyle: 'ponytail', hairColor: HAIR.red, eyeColor: EYES.green,
    top: 'coat', topColor: '#f4f6f8', shirtColor: '#7b8ea8', pants: 'trousers', pantsColor: '#3b3f4a',
    adult: true,
    blip: { freq: 610, wave: 'triangle' },
    params: {},
  },
  biology: {
    name: 'Оксана Леонидовна', short: 'Оксана', role: 'биология', female: true, heightCm: 162, build: 'normal',
    skin: SKIN.light, hairStyle: 'curly-short', hairColor: HAIR.chestnut, eyeColor: EYES.green,
    top: 'cardigan', topColor: '#4f7d3a', shirtColor: '#efe8d0', pants: 'skirt', pantsColor: '#3a3a2e',
    adult: true,
    blip: { freq: 530, wave: 'sine' },
    params: {},
  },
  informatics: {
    name: 'Вероника Олеговна', short: 'Вероника', role: 'информатика', female: true, heightCm: 171, build: 'thin',
    skin: SKIN.light, hairStyle: 'long-straight', hairColor: HAIR.black, eyeColor: EYES.darkbrown,
    top: 'sweater', topColor: '#2a2a3a', shirtColor: '#e8e8f0', pants: 'trousers', pantsColor: '#1e1e26',
    glasses: 'thin', adult: true,
    blip: { freq: 580, wave: 'square' },
    params: {},
  },
  geography: {
    name: 'Регина Эдуардовна', short: 'Регина', role: 'география', female: true, heightCm: 169, build: 'normal',
    skin: SKIN.warm, hairStyle: 'ponytail', hairColor: HAIR.darkblond, eyeColor: EYES.blue,
    top: 'blouse', topColor: '#d8e8c8', shirtColor: '#d8e8c8', pants: 'trousers', pantsColor: '#4a4030',
    adult: true,
    blip: { freq: 550, wave: 'sine' },
    params: {},
  },
  classteacher: {
    name: 'Светлана Брониславовна', short: 'Светлана', role: 'классный час, классный руководитель 11 «И»', female: true, heightCm: 167, build: 'normal',
    skin: SKIN.light, hairStyle: 'long-straight', hairColor: HAIR.darkchestnut, eyeColor: EYES.brown,
    top: 'blouse', topColor: '#e8c9d8', shirtColor: '#e8c9d8', pants: 'skirt', pantsColor: '#30303a',
    adult: true,
    blip: { freq: 580, wave: 'triangle' },
    params: {},
  },
  olga: {
    // Завуч (не ведёт уроков по У-1): ходит по коридорам — «патруль».
    name: 'Ольга Геннадьевна', short: 'Ольга', role: 'завуч', female: true, heightCm: 172, build: 'normal',
    skin: SKIN.pale, hairStyle: 'bun', hairColor: HAIR.black, eyeColor: EYES.gray,
    top: 'suit', topColor: '#262a36', shirtColor: '#ffffff', pants: 'skirt', pantsColor: '#262a36',
    glasses: 'thin', adult: true,
    blip: { freq: 470, wave: 'square' },
    params: { patrol: true },
  },
  vasily: {
    // ИС-15, В-17: дедушка Артёма Левончука. Как Артём, но седой, 192 см, чёрный спортивный костюм.
    name: 'Василий', short: 'Василий', role: 'дедушка Артёма Левончука', heightCm: 192, build: 'thin',
    skin: SKIN.light, hairStyle: 'tousled', hairColor: '#d9d9de', eyeColor: EYES.darkbrown, narrowEyes: true,
    top: 'tracksuit', topColor: '#18181c', shirtColor: '#18181c', pants: 'track', pantsColor: '#18181c',
    shoeColor: '#24242a', bigChin: true, adult: true, wrinkles: true,
    blip: { freq: 215, wave: 'square' },
    params: { cameo: true, lookalike: 'levonchuk' },
  },
  director: {
    name: 'Директор', short: 'Директор', role: 'только голос из-за двери', voiceOnly: true,
    blip: { freq: 140, wave: 'triangle' },
    params: {},
  },
};

export const TEACHER_ORDER = [
  'english', 'math', 'russian', 'belarusian', 'physics', 'ivan', 'social', 'history',
  'chemistry', 'biology', 'informatics', 'geography', 'classteacher', 'olga', 'vasily', 'director',
];

// Мужчины по У-1: физкультура и физика; остальные учителя — женщины.
export const MALE_TEACHERS = ['physics', 'ivan'];

// Персонал гимназии (нейтральные взрослые).
export const STAFF = {
  librarian: {
    name: 'Библиотекарь', short: 'Библиотекарь', role: 'библиотека', female: true, heightCm: 163, build: 'normal',
    skin: SKIN.light, hairStyle: 'bun', hairColor: '#7a6a5a', eyeColor: EYES.gray,
    top: 'cardigan', topColor: '#6a7a5a', shirtColor: '#f0ead8', pants: 'skirt', pantsColor: '#3a3a40',
    glasses: 'thin', adult: true,
    blip: { freq: 520, wave: 'sine' },
    params: {},
  },
  cook: {
    name: 'Продавщица буфета', short: 'Буфет', role: 'буфет в столовой', female: true, heightCm: 165, build: 'full',
    skin: SKIN.warm, hairStyle: 'bob', hairColor: HAIR.auburn, eyeColor: EYES.brown,
    top: 'coat', topColor: '#f4f6f8', shirtColor: '#e8a0a0', pants: 'skirt', pantsColor: '#5a5a66',
    adult: true,
    blip: { freq: 480, wave: 'triangle' },
    params: {},
  },
};

// Учителя-камео на переменах (раздел 11: случайно по сиду, 1–2 места за перемену).
export const CAMEO_TEACHERS = ['classteacher', 'chemistry', 'biology', 'geography', 'history', 'informatics', 'vasily'];
