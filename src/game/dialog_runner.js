// Исполнитель диалога: идёт по командам метки, применяет эффекты, отдаёт реплики и выборы.
// Не знает про отрисовку — её делает DialogScene. Работает и в node-тестах.
import { checkCondition } from '../ui/dialog_script.js';

const MAX_STEPS = 10000;

export class DialogRunner {
  // hooks: { effect(cmd), stat(name) → число, flag(name) → bool }
  constructor(script, label, hooks) {
    this.script = script;
    this.hooks = hooks;
    this.jump(label);
    this.pendingChoice = null;
  }

  jump(label) {
    const l = this.script.labels[label];
    if (!l) throw new Error(`Нет метки «${label}» в диалоге`);
    this.label = label;
    this.cmds = l.cmds;
    this.pc = 0;
  }

  // Следующее событие: { type: 'say', who, emo, text } | { type: 'choice', question, options } | { type: 'end' }.
  next() {
    let guard = 0;
    while (guard++ < MAX_STEPS) {
      if (this.pc >= this.cmds.length) return { type: 'end' };
      const c = this.cmds[this.pc++];
      switch (c.type) {
        case 'say':
          return { type: 'say', who: c.who, emo: c.emo, text: c.text };
        case 'goto':
          if (checkCondition(c.cond, this.hooks.stat, this.hooks.flag)) this.jump(c.target);
          break;
        case 'choice': {
          const visible = c.options
            .map((o, i) => ({ ...o, index: i }))
            .filter((o) => checkCondition(o.cond, this.hooks.stat, this.hooks.flag));
          if (!visible.length) break; // все варианты скрыты — идём дальше
          this.pendingChoice = visible;
          return { type: 'choice', question: c.question, options: visible.map((o) => ({ text: o.text })) };
        }
        default:
          this.hooks.effect(c);
      }
    }
    throw new Error('Диалог зациклился (переходы по кругу без реплик)');
  }

  // Выбор варианта по индексу среди показанных.
  choose(i) {
    const o = this.pendingChoice && this.pendingChoice[i];
    if (!o) throw new Error('Нет такого варианта');
    this.pendingChoice = null;
    for (const e of o.effects) this.hooks.effect(e);
    if (o.target) this.jump(o.target);
    return o;
  }
}
