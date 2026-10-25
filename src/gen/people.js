// Реестр всех персонажей: именные ученики, учителя и безымянные (генерация по сиду).
import { CHARACTERS, UNNAMED_POOL, VOICES } from '../../data/characters.js';
import { TEACHERS, STAFF } from '../../data/teachers.js';
import { getSheet } from './sprites.js';
import { getPortrait } from './portraits.js';

const unnamed = new Map();

export const NARRATOR = { name: '', short: '', blip: { freq: 0, wave: 'square' }, narrator: true };

export function getPerson(id) {
  if (id === 'narrator') return NARRATOR;
  return CHARACTERS[id] || TEACHERS[id] || STAFF[id] || VOICES[id] || unnamed.get(id) || null;
}

export function personExists(id) { return getPerson(id) !== null; }

// Ключ кэша картинок. У безымянных id может переиспользоваться с другими параметрами (новая
// перемена, новый день), поэтому ключ — по самим параметрам: спрайт и портрет всегда из одних (ИС-18).
export function visualKey(id, p) {
  if (!p.unnamed) return id;
  return 'u:' + [p.female, p.heightCm, p.build, p.skin, p.hairStyle, p.hairColor, p.eyeColor, p.top, p.topColor, p.shirtColor, p.pants, p.pantsColor, p.tie, p.glasses].join('|');
}

export function sheetOf(id) {
  const p = getPerson(id);
  if (!p || p.voiceOnly || p.narrator) return null;
  return getSheet(visualKey(id, p), p);
}

export function portraitOf(id, emo) {
  const p = getPerson(id);
  if (!p || p.narrator || p.noPortrait) return null;
  return getPortrait(visualKey(id, p), p, emo);
}

// Безымянный ученик/ученица: параметры выбираются ГПСЧ (rng — экземпляр Rng).
// opts.kids — младшие классы (рост 120–150 см, 1-е этажи корпусов).
export function makeUnnamed(rng, idPrefix = 'u', fixedId = null, opts = {}) {
  const P = UNNAMED_POOL;
  const kid = !!opts.kids;
  const girl = rng.chance(0.5);
  const id = fixedId || idPrefix + '_' + (unnamed.size + 1);
  const uniform = rng.chance(P.uniformShare);
  const U = P.uniform;
  let top, topColor, shirtColor, pants, pantsColor, tie;
  if (uniform) {
    top = girl ? 'blouse' : 'shirt';
    topColor = U.shirt; shirtColor = U.shirt;
    pants = girl && rng.chance(0.6) ? 'skirt' : 'trousers';
    pantsColor = U.bottom; tie = U.tie;
  } else {
    top = rng.pick(girl ? P.topsGirl : P.topsBoy);
    topColor = rng.pick(P.topColors);
    shirtColor = rng.chance(0.7) ? '#f2f2f2' : '#cfe0f2';
    pants = girl ? (rng.chance(0.6) ? 'skirt' : 'trousers') : 'trousers';
    pantsColor = rng.pick(P.pantsColors);
    tie = null;
  }
  const [h0, h1] = kid ? P.kidHeightCm : P.heightCm;
  const p = {
    name: girl ? 'Ученица' : 'Ученик',
    short: girl ? 'Ученица' : 'Ученик',
    cls: kid ? rng.pick(['3', '4', '5', '6']) + ' класс' : rng.pick(['9', '10', '11']) + ' класс',
    female: girl,
    heightCm: rng.int(h0, h1) - (girl && !kid ? 6 : 0),
    build: rng.pick(kid ? P.kidBuilds : P.builds),
    skin: rng.pick(P.skins),
    hairStyle: rng.pick(girl ? P.hairGirl : P.hairBoy),
    hairColor: rng.pick(P.hairColors),
    eyeColor: rng.pick(P.eyes),
    top, topColor, shirtColor, pants, pantsColor, tie, tieLogo: uniform,
    glasses: rng.chance(0.15) ? 'thin' : null,
    blip: { freq: rng.int(...(kid ? P.blipKid : girl ? P.blipGirl : P.blipBoy)), wave: rng.pick(['square', 'triangle']) },
    unnamed: true, uniform, kid,
  };
  unnamed.set(id, p);
  return id;
}

export function clearUnnamed() { unnamed.clear(); }
