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

export function sheetOf(id) {
  const p = getPerson(id);
  if (!p || p.voiceOnly || p.narrator) return null;
  return getSheet(id, p);
}

export function portraitOf(id, emo) {
  const p = getPerson(id);
  if (!p || p.narrator || p.noPortrait) return null;
  return getPortrait(id, p, emo);
}

// Безымянный ученик/ученица: параметры выбираются ГПСЧ (rng — экземпляр Rng).
export function makeUnnamed(rng, idPrefix = 'u', fixedId = null) {
  const P = UNNAMED_POOL;
  const girl = rng.chance(0.5);
  const id = fixedId || idPrefix + '_' + (unnamed.size + 1);
  const p = {
    name: girl ? 'Ученица' : 'Ученик',
    short: girl ? 'Ученица' : 'Ученик',
    cls: rng.pick(['9', '10', '11']) + ' класс',
    female: girl,
    heightCm: rng.int(P.heightCm[0], P.heightCm[1]) - (girl ? 6 : 0),
    build: rng.pick(P.builds),
    skin: rng.pick(P.skins),
    hairStyle: rng.pick(girl ? P.hairGirl : P.hairBoy),
    hairColor: rng.pick(P.hairColors),
    eyeColor: rng.pick(P.eyes),
    top: rng.pick(girl ? P.topsGirl : P.topsBoy),
    topColor: rng.pick(P.topColors),
    shirtColor: rng.chance(0.7) ? '#f2f2f2' : '#cfe0f2',
    pants: girl ? (rng.chance(0.6) ? 'skirt' : 'trousers') : 'trousers',
    pantsColor: rng.pick(P.pantsColors),
    tie: !girl && rng.chance(0.2) ? '#1c1c1c' : null,
    glasses: rng.chance(0.15) ? 'thin' : null,
    blip: { freq: rng.int(...(girl ? P.blipGirl : P.blipBoy)), wave: rng.pick(['square', 'triangle']) },
    unnamed: true,
  };
  unnamed.set(id, p);
  return id;
}

export function clearUnnamed() { unnamed.clear(); }
