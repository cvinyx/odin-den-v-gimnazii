// Детерминированный ГПСЧ с сидом (раздел 17). Math.random в игровой логике не используется.

// Алфавит кода дня: без похожих символов (0/O, 1/I/L).
export const SEED_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const SEED_LENGTH = 6;

// Хеш строки в 32-битное число (cyrb53, урезанный до 32 бит).
export function hashString(str) {
  let h1 = 0xdeadbeef ^ str.length;
  let h2 = 0x41c6ce57 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h1 ^ h2) >>> 0;
}

export function normalizeSeed(code) {
  return String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, SEED_LENGTH);
}

export function isValidSeed(code) {
  const c = normalizeSeed(code);
  if (c.length !== SEED_LENGTH) return false;
  for (const ch of c) if (!SEED_ALPHABET.includes(ch)) return false;
  return true;
}

// Новый код дня. Источник энтропии — только для выбора кода, не для логики игры.
export function generateSeedCode() {
  const bytes = new Uint8Array(SEED_LENGTH);
  if (globalThis.crypto && globalThis.crypto.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    let t = Date.now() >>> 0;
    for (let i = 0; i < bytes.length; i++) { t = (Math.imul(t, 1103515245) + 12345) >>> 0; bytes[i] = t >>> 24; }
  }
  let out = '';
  for (const b of bytes) out += SEED_ALPHABET[b % SEED_ALPHABET.length];
  return out;
}

// mulberry32: быстрый, маленький, состояние — одно 32-битное число (легко сохранять).
export class Rng {
  constructor(seed) {
    this.state = (typeof seed === 'number' ? seed : hashString(String(seed))) >>> 0;
  }
  next() {
    let t = (this.state = (this.state + 0x6d2b79f5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  float(min = 0, max = 1) { return min + this.next() * (max - min); }
  // Целое в [min, max] включительно.
  int(min, max) { return min + Math.floor(this.next() * (max - min + 1)); }
  chance(p) { return this.next() < p; }
  pick(arr) { return arr[Math.floor(this.next() * arr.length)]; }
  shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
  // Независимый поток для подсистемы (например, «seating», «npc»), чтобы события не влияли друг на друга.
  fork(name) { return new Rng(hashString(this.state + ':' + name)); }
  getState() { return this.state; }
  setState(s) { this.state = s >>> 0; }
}

export function rngFromCode(code, stream = 'main') {
  return new Rng(hashString(normalizeSeed(code) + '/' + stream));
}
