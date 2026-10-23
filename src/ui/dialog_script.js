// Парсер текстового формата диалогов (раздел 20). Чистый модуль — работает и в node-тестах.
//
//   === метка                 начало сцены
//   @кто [эмоция] текст       реплика (@narrator — текст без говорящего)
//   # stress +5, aura -3      эффекты; также: # sfx имя, # shake, # flag имя, # unflag имя
//   ? Вопрос                  вопрос перед вариантами
//   * Текст => метка {aura -3} {if vape>0}   вариант выбора (переход, эффекты, условие)
//   -> метка                  переход
//   // комментарий

export const EMOTIONS = ['norm', 'happy', 'angry', 'surprised', 'dumb'];
export const STATS = ['battery', 'stress', 'aura', 'vape', 'juice', 'suspicion', 'hunger', 'money'];
// Величины только для условий: последняя оценка, долг собеседнику (BYN), все долги, побед, вызовов к директору,
// итог матча (1 — победа, 0 — ничья/не было, −1 — поражение), может ли собеседник дать жижку (1/0).
// Мини-игры на перемене (1/0, считает сцена мира перед разговором): в туалете, в столовой, большая перемена
// и столовая, рядом Матыч и Буй (и собеседник — друг), можно «Кто больше парит», можно хоть что-то,
// собеседник сам бросает вызов; chalgame — какой (1 байт, 2 парилка, 3 туалет, 4 еда).
export const COND_VALUES = ['lastgrade', 'debt', 'debts', 'wins', 'calls', 'match', 'vapefriend', 'puffs', 'breaknum',
  'intoilet', 'incanteen', 'bigbreak', 'mbnear', 'vapebattle', 'playable', 'challenge', 'chalgame'];
export const SFX_ALLOWED = ['igorLaugh', 'bell', 'whistle', 'kick', 'hit', 'shake', 'puff', 'coin', 'door', 'statUp', 'statDown'];
const OPS = ['>=', '<=', '==', '!=', '>', '<'];
// Игровые действия из диалогов: # action имя [аргумент]. Выполняет игра (src/game/actions.js).
export const ACTIONS = ['phone', 'vape', 'quiet', 'bait', 'seat_steal', 'seat_front', 'seat_igor', 'bus', 'wash', 'leave', 'askjuice', 'buffet', 'charge_phone', 'charge_vape', 'charge_stop', 'play', 'challenge'];

export class DialogParseError extends Error {
  constructor(errors, file) {
    super((file ? file + ': ' : '') + errors.map((e) => `строка ${e.line}: ${e.msg}`).join('\n'));
    this.errors = errors;
    this.file = file;
  }
}

function parseEffectList(src, line, errors) {
  const out = [];
  for (const part of src.split(',').map((s) => s.trim()).filter(Boolean)) {
    const m = /^([a-zA-Z_]+)(?:\s+(.+))?$/.exec(part);
    if (!m) { errors.push({ line, msg: `не понимаю эффект «${part}»` }); continue; }
    const [, name, arg] = m;
    if (name === 'sfx') {
      if (!arg || !SFX_ALLOWED.includes(arg.trim())) errors.push({ line, msg: `неизвестный звук «${arg || ''}». Есть: ${SFX_ALLOWED.join(', ')}` });
      else out.push({ type: 'sfx', name: arg.trim() });
    } else if (name === 'action') {
      const [act, ...rest] = (arg || '').trim().split(/\s+/);
      if (!ACTIONS.includes(act)) errors.push({ line, msg: `неизвестное действие «${act || ''}». Есть: ${ACTIONS.join(', ')}` });
      else out.push({ type: 'action', name: act, arg: rest.join(' ') || null });
    } else if (name === 'shake') {
      out.push({ type: 'shake' });
    } else if (name === 'flag' || name === 'unflag') {
      if (!arg || !/^[\w.]+$/.test(arg.trim())) errors.push({ line, msg: `у ${name} нужно имя флага` });
      else out.push({ type: 'flag', name: arg.trim(), value: name === 'flag' });
    } else if (STATS.includes(name)) {
      const v = /^([+\-=])\s*(\d+(?:[.,]\d+)?)$/.exec((arg || '').trim());
      if (!v) { errors.push({ line, msg: `у «${name}» нужно число со знаком, например ${name} +5` }); continue; }
      const num = parseFloat(v[2].replace(',', '.'));
      if (v[1] === '=') out.push({ type: 'set', stat: name, value: num });
      else out.push({ type: 'stat', stat: name, delta: v[1] === '-' ? -num : num });
    } else {
      errors.push({ line, msg: `неизвестный статус или команда «${name}». Статусы: ${STATS.join(', ')}` });
    }
  }
  return out;
}

function parseCondition(src, line, errors) {
  const s = src.trim();
  let m = /^(!)?flag\s+([\w.]+)$/.exec(s);
  if (m) return { kind: 'flag', name: m[2], negate: !!m[1] };
  for (const op of OPS) {
    const i = s.indexOf(op);
    if (i > 0) {
      const stat = s.slice(0, i).trim();
      const val = s.slice(i + op.length).trim().replace(',', '.');
      if (!STATS.includes(stat) && !COND_VALUES.includes(stat)) { errors.push({ line, msg: `в условии неизвестный статус «${stat}»` }); return null; }
      if (!/^-?\d+(\.\d+)?$/.test(val)) { errors.push({ line, msg: `в условии нужно число: «${val}»` }); return null; }
      return { kind: 'stat', stat, op, value: parseFloat(val) };
    }
  }
  errors.push({ line, msg: `не понимаю условие «${s}». Пример: if vape>0 или if flag met_igor` });
  return null;
}

// opts.speakers — функция (id) => bool для проверки говорящих.
export function parseDialog(text, opts = {}) {
  const errors = [];
  const labels = {};
  const order = [];
  let cur = null;
  let pendingChoice = null;
  const lines = String(text).replace(/\r\n?/g, '\n').split('\n');
  const refs = [];

  const flushChoice = () => {
    if (pendingChoice && !pendingChoice.options.length) errors.push({ line: pendingChoice.line, msg: 'вопрос «?» без вариантов «*»' });
    pendingChoice = null;
  };
  const need = (ln) => {
    if (!cur) { errors.push({ line: ln, msg: 'строка до первой метки «=== имя»' }); return false; }
    return true;
  };

  lines.forEach((raw, i) => {
    const ln = i + 1;
    const line = raw.trim();
    if (!line || line.startsWith('//')) return;

    if (line.startsWith('===')) {
      flushChoice();
      const name = line.slice(3).trim();
      if (!/^[\w.]+$/.test(name)) { errors.push({ line: ln, msg: `плохое имя метки «${name}» (только латиница, цифры, _ и .)` }); cur = null; return; }
      if (labels[name]) errors.push({ line: ln, msg: `метка «${name}» уже есть (строка ${labels[name].line})` });
      cur = { line: ln, cmds: [] };
      labels[name] = cur;
      order.push(name);
      return;
    }
    if (!need(ln)) return;

    if (line.startsWith('*')) {
      if (!pendingChoice) {
        pendingChoice = { type: 'choice', question: '', options: [], line: ln };
        cur.cmds.push(pendingChoice);
      }
      let body = line.slice(1).trim();
      const braces = [];
      body = body.replace(/\{([^}]*)\}/g, (_, inner) => { braces.push(inner.trim()); return ''; }).trim();
      let target = null;
      const arrow = body.indexOf('=>');
      if (arrow >= 0) { target = body.slice(arrow + 2).trim(); body = body.slice(0, arrow).trim(); }
      if (!body) errors.push({ line: ln, msg: 'у варианта нет текста' });
      if (target !== null) {
        if (!/^[\w.]+$/.test(target)) errors.push({ line: ln, msg: `плохая метка перехода «${target}»` });
        else refs.push({ line: ln, target });
      }
      let cond = null;
      let effects = [];
      for (const b of braces) {
        if (b.startsWith('if ')) cond = parseCondition(b.slice(3), ln, errors);
        else effects = effects.concat(parseEffectList(b, ln, errors));
      }
      pendingChoice.options.push({ text: body, target, effects, cond, line: ln });
      // вариантов с условиями может быть до 6, но на экране — не больше 4 видимых (A–D)
      if (pendingChoice.options.length > 6) errors.push({ line: ln, msg: 'больше 6 вариантов (на экране максимум 4)' });
      return;
    }
    flushChoice();

    if (line.startsWith('@')) {
      const m = /^@([\w]+)\s*(?:\[([^\]]*)\])?\s*(.*)$/.exec(line);
      if (!m) { errors.push({ line: ln, msg: 'не понимаю реплику. Формат: @кто [эмоция] текст' }); return; }
      const [, who, emoRaw, textRaw] = m;
      const emo = (emoRaw || 'norm').trim();
      if (!EMOTIONS.includes(emo)) errors.push({ line: ln, msg: `неизвестная эмоция [${emo}]. Есть: ${EMOTIONS.join(', ')}` });
      if (opts.speakers && who !== 'narrator' && !opts.speakers(who)) errors.push({ line: ln, msg: `неизвестный персонаж @${who}` });
      const text = textRaw.trim();
      if (!text) errors.push({ line: ln, msg: 'пустая реплика' });
      const tagErr = checkTags(text);
      if (tagErr) errors.push({ line: ln, msg: tagErr });
      cur.cmds.push({ type: 'say', who, emo, text, line: ln });
      return;
    }
    if (line.startsWith('#')) {
      for (const e of parseEffectList(line.slice(1).trim(), ln, errors)) cur.cmds.push({ ...e, line: ln });
      return;
    }
    if (line.startsWith('?')) {
      pendingChoice = { type: 'choice', question: line.slice(1).trim(), options: [], line: ln };
      cur.cmds.push(pendingChoice);
      return;
    }
    if (line.startsWith('->')) {
      let body = line.slice(2).trim();
      let cond = null;
      const m = /\{if ([^}]*)\}\s*$/.exec(body);
      if (m) { cond = parseCondition(m[1], ln, errors); body = body.slice(0, m.index).trim(); }
      const target = body;
      if (!/^[\w.]+$/.test(target)) { errors.push({ line: ln, msg: `плохая метка перехода «${target}»` }); return; }
      refs.push({ line: ln, target });
      cur.cmds.push({ type: 'goto', target, cond, line: ln });
      return;
    }
    errors.push({ line: ln, msg: `не понимаю строку: «${line.slice(0, 40)}». Строки начинаются с ===, @, #, ?, *, -> или //` });
  });
  flushChoice();

  for (const r of refs) if (!labels[r.target]) errors.push({ line: r.line, msg: `переход на несуществующую метку «${r.target}»` });
  errors.sort((a, b) => a.line - b.line);
  return { labels, order, errors };
}

// Проверка парности тегов эффектов текста.
const TAGS = ['shake', 'slow', 'c', 'wave'];
function checkTags(text) {
  const stack = [];
  const re = /\{(\/)?(\w+)(?:=([#\w]+))?\}/g;
  let m;
  while ((m = re.exec(text))) {
    const [, close, name] = m;
    if (!TAGS.includes(name)) return `неизвестный тег {${name}}. Есть: {shake}, {slow}, {wave}, {c=red}`;
    if (close) {
      if (stack.pop() !== name) return `тег {/${name}} закрыт не по порядку`;
    } else stack.push(name);
  }
  if (stack.length) return `не закрыт тег {${stack[stack.length - 1]}}`;
  return null;
}

// Разметка текста → массив символов с атрибутами {ch, shake, slow, wave, color}.
export const TEXT_COLORS = {
  red: '#ff5555', yellow: '#ffe14d', blue: '#6fb6ff', green: '#6be36b', gray: '#9a9aa8', pink: '#ff8ad0', orange: '#ffa040',
};
export function parseRichText(text) {
  const out = [];
  const st = { shake: 0, slow: 0, wave: 0, colors: [] };
  const re = /\{(\/)?(\w+)(?:=([#\w]+))?\}/g;
  let last = 0;
  let m;
  const push = (s) => {
    for (const ch of s) {
      out.push({ ch, shake: st.shake > 0, slow: st.slow > 0, wave: st.wave > 0, color: st.colors[st.colors.length - 1] || null });
    }
  };
  while ((m = re.exec(text))) {
    push(text.slice(last, m.index));
    last = re.lastIndex;
    const [, close, name, arg] = m;
    const d = close ? -1 : 1;
    if (name === 'shake') st.shake += d;
    else if (name === 'slow') st.slow += d;
    else if (name === 'wave') st.wave += d;
    else if (name === 'c') { if (close) st.colors.pop(); else st.colors.push(TEXT_COLORS[arg] || (arg && arg.startsWith('#') ? arg : '#ffffff')); }
  }
  push(text.slice(last));
  return out;
}

// Проверка условия варианта. getStat(name) → число, getFlag(name) → bool.
export function checkCondition(cond, getStat, getFlag) {
  if (!cond) return true;
  if (cond.kind === 'flag') return !!getFlag(cond.name) !== cond.negate;
  const v = getStat(cond.stat);
  switch (cond.op) {
    case '>': return v > cond.value;
    case '<': return v < cond.value;
    case '>=': return v >= cond.value;
    case '<=': return v <= cond.value;
    case '==': return v === cond.value;
    case '!=': return v !== cond.value;
    default: return false;
  }
}
