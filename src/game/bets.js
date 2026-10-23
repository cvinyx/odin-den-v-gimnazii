// Деньги, ставки и долги (раздел 8): ставка перед соревновательной игрой, три варианта при проигрыше,
// вечные долги и напоминания кредиторов. Чистые функции над состоянием.
import { BALANCE } from '../../data/balance.js';
import { changeStat } from './state.js';
import { eventRng } from './day.js';

const B = BALANCE.bets;

// Счётчик ставок дня — чтобы каждая ставка имела свой детерминированный ГПСЧ.
function nextBetIndex(state) {
  state.flags.betCount = (state.flags.betCount || 0) + 1;
  return state.flags.betCount;
}

export function rollBet(state, opp) {
  const i = nextBetIndex(state);
  const rng = eventRng(state, 'bet:' + opp + ':' + i);
  const steps = Math.round((B.max - B.min) / B.step);
  return B.min + rng.int(0, steps) * B.step;
}

export function payWin(state, amount) {
  changeStat(state, 'money', amount);
  state.wins++;
}

// Варианты при проигрыше. Возвращает { outcome: 'paid'|'exposed'|'escaped'|'truth'|'debt', paid }.
export function resolveLoss(state, opp, amount, option) {
  const money = state.stats.money;
  if (option === 'pay') {
    const paid = Math.min(money, amount);
    changeStat(state, 'money', -paid);
    return { outcome: 'paid', paid };
  }
  if (option === 'nomoney') {
    if (money < amount) return { outcome: 'truth', paid: 0 }; // правда нет денег — разоблачать нечего
    const chance = money >= B.richThreshold ? B.exposeChanceRich : B.exposeChance;
    const rng = eventRng(state, 'expose:' + opp + ':' + state.flags.betCount);
    if (rng.chance(chance)) {
      changeStat(state, 'aura', B.exposedAura);
      changeStat(state, 'money', -amount);
      return { outcome: 'exposed', paid: amount };
    }
    return { outcome: 'escaped', paid: 0 };
  }
  // «Потом отдам» — долг навсегда
  const d = state.debts.find((x) => x.to === opp);
  if (d) d.amount += amount; else state.debts.push({ to: opp, amount });
  return { outcome: 'debt', paid: 0 };
}

export function debtTo(state, opp) {
  const d = state.debts.find((x) => x.to === opp);
  return d ? d.amount : 0;
}

export function totalDebt(state) { return state.debts.reduce((a, d) => a + d.amount, 0); }

// Кредитор при встрече с шансом 50 % язвительно напоминает о долге.
export function creditorReminds(state, opp) {
  if (!debtTo(state, opp)) return false;
  state.flags.metCount = (state.flags.metCount || 0) + 1;
  return eventRng(state, 'remind:' + opp + ':' + state.flags.metCount).chance(B.creditorReminderChance);
}
