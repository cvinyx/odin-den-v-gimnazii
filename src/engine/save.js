// Сохранение (раздел 18): localStorage в try/catch + код сохранения (компактный JSON → base64 + контрольная сумма).
import { validateState, normalizeState, STATE_VERSION } from '../game/state.js';

const PREFIX = 'odin-den:';
export const KEYS = {
  autosave: PREFIX + 'autosave',
  settings: PREFIX + 'settings',
  achievements: PREFIX + 'achievements',
};

function storage() {
  try {
    const ls = globalThis.localStorage;
    if (!ls) return null;
    return ls;
  } catch (e) {
    return null;
  }
}

export function storeGet(key, fallback = null) {
  try {
    const ls = storage();
    if (!ls) return fallback;
    const raw = ls.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
}

export function storeSet(key, value) {
  try {
    const ls = storage();
    if (!ls) return false;
    ls.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    return false;
  }
}

export function storeRemove(key) {
  try { const ls = storage(); if (ls) ls.removeItem(key); } catch (e) { /* без localStorage игра работает */ }
}

export function autosave(state) { return storeSet(KEYS.autosave, state); }
export function loadAutosave() {
  const st = storeGet(KEYS.autosave);
  if (!st || validateState(st)) return null;
  return normalizeState(st);
}
export function hasAutosave() { return loadAutosave() !== null; }
// Автосохранение есть, но от версии 1 (один день) — его нельзя продолжить.
export function oldAutosave() {
  const st = storeGet(KEYS.autosave);
  return !!(st && typeof st === 'object' && st.v !== STATE_VERSION);
}

// ---------- Код сохранения ----------

// Короткие ключи для компактного JSON. Порядок важен только для читаемости.
const SHORT = {
  v: 'v', seed: 's', rng: 'r', stats: 't', battery: 'b', stress: 'x', aura: 'a', vapeCharge: 'p',
  juice: 'j', suspicion: 'u', hunger: 'h', money: 'm', phase: 'f', lesson: 'l', location: 'o',
  locationName: 'n', clock: 'c', pos: 'q', grades: 'g', directorCalls: 'd', breakdowns: 'k',
  puffsToday: 'z', wins: 'w', debts: 'e', flags: 'F', playTime: 'T', dir: 'D', x: 'X', y: 'Y',
  to: 'O', amount: 'A',
};
const LONG = Object.fromEntries(Object.entries(SHORT).map(([k, v]) => [v, k]));

function mapKeys(obj, table, isFlags = false) {
  if (Array.isArray(obj)) return obj.map((o) => mapKeys(o, table));
  if (!obj || typeof obj !== 'object') return obj;
  const out = {};
  for (const k of Object.keys(obj)) {
    const nk = isFlags ? k : (table[k] || k);
    const child = obj[k];
    const childIsFlags = !isFlags && (k === 'flags' || k === 'F');
    out[nk] = childIsFlags ? mapKeys(child, table, true) : mapKeys(child, table);
  }
  return out;
}

// CRC32 → 6 символов base36.
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
export function crc32(str) {
  let c = 0xffffffff;
  for (let i = 0; i < str.length; i++) c = CRC_TABLE[(c ^ str.charCodeAt(i)) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function checksum(str) { return crc32(str).toString(36).toUpperCase().padStart(7, '0'); }

function toBase64(text) {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/=+$/, '');
}
function fromBase64(b64) {
  const pad = b64.length % 4 ? '='.repeat(4 - (b64.length % 4)) : '';
  const bin = atob(b64 + pad);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}

const CODE_TAG = 'ODG1';

export function encodeSaveCode(state) {
  const json = JSON.stringify(mapKeys(state, SHORT));
  const body = toBase64(json);
  return CODE_TAG + '-' + body + '-' + checksum(body);
}

// Возвращает { ok: true, state } или { ok: false, error: 'понятный текст' }. Никогда не бросает исключение.
export function decodeSaveCode(code) {
  try {
    const clean = String(code || '').replace(/\s+/g, '');
    if (!clean) return { ok: false, error: 'Код пустой.' };
    const parts = clean.split('-');
    if (parts.length !== 3 || parts[0] !== CODE_TAG) return { ok: false, error: 'Это не код сохранения этой игры.' };
    const [, body, sum] = parts;
    if (!/^[A-Za-z0-9+/]+$/.test(body)) return { ok: false, error: 'В коде есть лишние символы.' };
    if (checksum(body) !== sum.toUpperCase()) return { ok: false, error: 'Код повреждён: не сходится контрольная сумма.' };
    let json;
    try { json = fromBase64(body); } catch (e) { return { ok: false, error: 'Код повреждён: не читается.' }; }
    let data;
    try { data = JSON.parse(json); } catch (e) { return { ok: false, error: 'Код повреждён: неверные данные.' }; }
    const st = mapKeys(data, LONG);
    const err = validateState(st);
    if (err && st.v !== STATE_VERSION) return { ok: false, error: 'Сохранение от старой версии игры (один день). Начни новую неделю.' };
    if (err) return { ok: false, error: 'Код не подходит: ' + err + '.' };
    return { ok: true, state: normalizeState(st) };
  } catch (e) {
    return { ok: false, error: 'Не удалось прочитать код.' };
  }
}

// Копирование в буфер обмена: Clipboard API, затем запасной путь через textarea (работает и с file://).
export async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (e) { /* пробуем запасной путь */ }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-1000px';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    document.getElementById('screen')?.focus();
    return ok;
  } catch (e) {
    return false;
  }
}
