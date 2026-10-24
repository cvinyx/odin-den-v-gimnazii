// Единое состояние дня. Чистые данные (без ссылок на канвасы), чтобы легко сохранять и сравнивать.
import { BALANCE } from '../../data/balance.js';
import { normalizeSeed, rngFromCode } from '../engine/rng.js';

export const STATE_VERSION = 1;

export function createState(seedCode) {
  const s = BALANCE.start;
  const seed = normalizeSeed(seedCode);
  return {
    v: STATE_VERSION,
    seed,
    rng: rngFromCode(seed).getState(), // состояние ГПСЧ дня
    stats: {
      battery: s.battery,
      stress: s.stress,
      aura: s.aura,
      vapeCharge: s.vapeCharge,
      juice: s.juice,
      suspicion: s.suspicion,
      hunger: s.hunger,
      money: s.money,
    },
    // Где и когда мы: phase = 'intro' | 'lesson' | 'break' | 'free' (тестовая комната) | 'end'
    phase: 'free',
    lesson: 0,
    location: 'test_room',
    locationName: 'Тестовая комната',
    clock: s.time,
    pos: { x: 0, y: 0, dir: 'down' },
    grades: [],
    directorCalls: 0,
    breakdowns: 0,
    puffsToday: 0,
    wins: 0,
    debts: [],      // { to: id, amount: копейки }
    flags: {},      // произвольные события дня
    met: {},        // кого Рома встретил сегодня (id → true)
    puffsInRefill: 0, // затяжек из текущей заправки (5 = заправка кончилась)
    seat: null,     // место на текущем уроке: 'steal_ok' | 'steal_fail' | 'front' | 'igor'
    lessonMul: 1,   // множитель подозрения на уроке (рассадка × учитель)
    suspicionPrev: 0, // подозрение в конце прошлого урока (25 % переходит на следующий)
    vapeSmell: false, // после вейп-игры — +20 к подозрению на следующем уроке
    breakdownPending: false, // после срыва следующая мини-игра или выбор проваливается
    late: true,     // опоздал на первый урок
    charging: null, // зарядка в библиотеке: { device: 'phone'|'vape', x, y, map }
    playTime: 0,    // секунды реального времени (для спидрана)
  };
}

const CLAMPS = BALANCE.limits;

// Изменить статус с ограничением диапазона. Возвращает фактическое изменение.
export function changeStat(state, key, delta) {
  if (!(key in state.stats)) throw new Error('Неизвестный статус: ' + key);
  const [min, max] = CLAMPS[key] || [-Infinity, Infinity];
  const before = state.stats[key];
  let after = before + delta;
  if (after < min) after = min;
  if (after > max) after = max;
  state.stats[key] = after;
  return after - before;
}

export function setStat(state, key, value) {
  return changeStat(state, key, value - state.stats[key]);
}

// Имена статусов из диалоговых файлов → ключи состояния. Деньги в диалогах — в BYN (1.20).
export const STAT_ALIASES = {
  battery: 'battery', батарея: 'battery',
  stress: 'stress', стресс: 'stress',
  aura: 'aura', аура: 'aura',
  vape: 'vapeCharge', vapecharge: 'vapeCharge', вейп: 'vapeCharge',
  juice: 'juice', жижка: 'juice',
  suspicion: 'suspicion', подозрение: 'suspicion',
  hunger: 'hunger', голод: 'hunger',
  money: 'money', деньги: 'money',
};

export function resolveStat(name) {
  return STAT_ALIASES[String(name).toLowerCase()] || null;
}

// Значение статуса в «человеческих» единицах (деньги в BYN) — для условий в диалогах.
export function statForScript(state, key) {
  const v = state.stats[key];
  return key === 'money' ? v / 100 : v;
}

// Изменение в «человеческих» единицах → внутренние (деньги BYN → копейки).
export function scriptDeltaToInternal(key, amount) {
  return key === 'money' ? Math.round(amount * 100) : amount;
}

export function formatMoney(kop) {
  const sign = kop < 0 ? '-' : '';
  const a = Math.abs(Math.round(kop));
  return sign + Math.floor(a / 100) + ',' + String(a % 100).padStart(2, '0');
}

export function cloneState(state) {
  return JSON.parse(JSON.stringify(state));
}

// Проверка формы состояния после загрузки. Возвращает текст ошибки или null.
export function validateState(st) {
  if (!st || typeof st !== 'object') return 'нет данных';
  if (st.v !== STATE_VERSION) return 'другая версия сохранения';
  if (typeof st.seed !== 'string') return 'нет кода дня';
  if (!st.stats || typeof st.stats !== 'object') return 'нет статусов';
  for (const k of Object.keys(BALANCE.limits)) {
    const v = st.stats[k];
    if (typeof v !== 'number' || !Number.isFinite(v)) return 'испорчен статус ' + k;
  }
  if (!Array.isArray(st.grades) || !Array.isArray(st.debts)) return 'испорчены списки';
  if (!st.flags || typeof st.flags !== 'object') return 'испорчены флаги';
  return null;
}

// Сохранение заполняет недостающие поля значениями по умолчанию (на случай расширения на этапах 2–6).
export function normalizeState(st) {
  const base = createState(st.seed);
  const out = { ...base, ...st, stats: { ...base.stats, ...st.stats }, pos: { ...base.pos, ...(st.pos || {}) } };
  for (const k of Object.keys(out.stats)) {
    const [min, max] = CLAMPS[k] || [-Infinity, Infinity];
    out.stats[k] = Math.min(max, Math.max(min, out.stats[k]));
  }
  return out;
}

// Эффект из диалога, меняющий состояние: { type: 'stat', stat, delta } | { type: 'set', stat, value } | { type: 'flag', name, value }.
// Имена статусов — как в файлах диалогов (vape = заряд вейпа, money — в BYN). Возвращает true, если эффект обработан.
export function applyScriptEffect(state, e) {
  if (e.type === 'flag') { state.flags[e.name] = e.value; return true; }
  if (e.type !== 'stat' && e.type !== 'set') return false;
  const key = e.stat === 'vape' ? 'vapeCharge' : resolveStat(e.stat);
  if (!key) throw new Error('Неизвестный статус в диалоге: ' + e.stat);
  if (e.type === 'stat') changeStat(state, key, scriptDeltaToInternal(key, e.delta));
  else setStat(state, key, scriptDeltaToInternal(key, e.value));
  return true;
}

// Значение для условий в диалогах. opp — собеседник (для debt и vapefriend).
export const VAPE_FRIENDS = ['chernyak', 'denis', 'shurpo', 'levonchuk', 'bochko', 'matych', 'buy'];
export function scriptStatValue(state, name, opp = null) {
  switch (name) {
    case 'lastgrade': { const g = state.grades.filter((x) => x != null); return g.length ? g[g.length - 1] : 0; }
    case 'debt': { const d = state.debts.find((x) => x.to === opp); return d ? d.amount / 100 : 0; }
    case 'debts': return state.debts.reduce((a, d) => a + d.amount, 0) / 100;
    case 'wins': return state.wins;
    case 'calls': return state.directorCalls;
    case 'match': return state.flags.matchResult || 0;
    case 'vapefriend': return VAPE_FRIENDS.includes(opp) ? 1 : 0;
    case 'puffs': return state.puffsToday;
    case 'breaknum': return state.phase === 'break' ? state.lesson : 0;
    default: {
      const key = name === 'vape' ? 'vapeCharge' : resolveStat(name);
      return key ? statForScript(state, key) : 0;
    }
  }
}
