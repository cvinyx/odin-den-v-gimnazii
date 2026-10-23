import test from 'node:test';
import assert from 'node:assert/strict';
import { parseDialog, parseRichText } from '../src/ui/dialog_script.js';
import { DialogRunner } from '../src/game/dialog_runner.js';
import { createState, applyScriptEffect, scriptStatValue } from '../src/game/state.js';
import { CHARACTERS, VOICES } from '../data/characters.js';
import { TEACHERS } from '../data/teachers.js';
import { readDialog, dialogNames } from './helpers.mjs';
import { wrapRich } from '../src/ui/dialog_wrap.js';

const speakers = (id) => id === 'opp' || id in CHARACTERS || id in TEACHERS || id in VOICES;

test('все файлы диалогов разбираются без ошибок', () => {
  for (const name of dialogNames()) {
    const res = parseDialog(readDialog(name), { speakers });
    assert.deepEqual(res.errors, [], name + ': ' + JSON.stringify(res.errors));
  }
});

test('test.txt: метки, реплики, выборы и условия', () => {
  const res = parseDialog(readDialog('test'), { speakers });
  assert.ok(res.labels.igor_talk && res.labels.chernyak_talk);
  const choice = res.labels.igor_talk.cmds.find((c) => c.type === 'choice');
  assert.equal(choice.question, 'Что ответить Игорю?');
  assert.equal(choice.options.length, 4);
  assert.equal(choice.options[0].target, 'igor_bait');
  assert.deepEqual(choice.options[0].effects, [{ type: 'stat', stat: 'aura', delta: 5 }, { type: 'stat', stat: 'stress', delta: -5 }]);
  assert.deepEqual(choice.options[3].cond, { kind: 'stat', stat: 'vape', op: '>', value: 0 });
});

test('парсер сообщает ошибки с номерами строк', () => {
  const src = [
    'реплика до метки',          // 1
    '=== a',                     // 2
    '@igor [rage] привет',       // 3 — неизвестная эмоция
    '@nobody текст',             // 4 — неизвестный персонаж
    '# stres +5',                // 5 — опечатка в статусе
    '* вариант => nowhere',      // 6 — нет метки
    '-> also_nowhere',           // 7
    'просто текст',              // 8 — непонятная строка
    '@igor {shake}не закрыт',    // 9
    '=== a',                     // 10 — дубль
  ].join('\n');
  const res = parseDialog(src, { speakers });
  const lines = res.errors.map((e) => e.line);
  for (const l of [1, 3, 4, 5, 6, 7, 8, 9, 10]) assert.ok(lines.includes(l), 'нет ошибки на строке ' + l + ': ' + JSON.stringify(res.errors));
});

test('исполнитель: выбор меняет статусы, условие скрывает вариант', () => {
  const script = parseDialog(readDialog('test'), { speakers });
  const st = createState('ABCDEF');
  const hooks = { effect: (e) => applyScriptEffect(st, e), stat: (n) => scriptStatValue(st, n), flag: (n) => !!st.flags[n] };
  const run = new DialogRunner(script, 'igor_talk', hooks);
  let ev;
  const said = [];
  while ((ev = run.next()).type === 'say') said.push(ev.who);
  assert.deepEqual(said, ['igor', 'igor', 'roma']);
  assert.equal(ev.type, 'choice');
  assert.equal(ev.options.length, 4);
  run.choose(0);
  assert.equal(st.stats.aura, 55);
  assert.equal(st.stats.stress, 25);
  while ((ev = run.next()).type !== 'end') { /* до конца */ }

  // без заряда вейпа вариант D скрыт
  st.stats.vapeCharge = 0;
  const run2 = new DialogRunner(script, 'igor_talk', hooks);
  while ((ev = run2.next()).type === 'say');
  assert.equal(ev.options.length, 3);

  // деньги в диалоге — в BYN
  const run3 = new DialogRunner(script, 'chernyak_talk', hooks);
  st.stats.money = 200;
  while ((ev = run3.next()).type === 'say');
  run3.choose(2);
  while (run3.next().type !== 'end');
  assert.equal(st.stats.money, 300);
});

test('разметка текста и перенос по словам', () => {
  const rich = parseRichText('Ты {shake}чё{/shake} {c=red}сказал{/c}?');
  assert.equal(rich.map((c) => c.ch).join(''), 'Ты чё сказал?');
  assert.ok(rich[3].shake && !rich[0].shake);
  assert.equal(rich[7].color, '#ff5555');
  const lines = wrapRich(parseRichText('раз два три четыре пять шесть'), 10);
  assert.deepEqual(lines.map((l) => l.map((c) => c.ch).join('')), ['раз два', 'три четыре', 'пять шесть']);
});
