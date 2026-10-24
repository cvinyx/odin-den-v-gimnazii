// Игровые действия вне мини-игр: вейп, телефон, «сидеть тихо», подозрение, срыв (разделы 7, 11).
// Чистые функции над состоянием — их используют и сцены, и тесты/бот.
import { BALANCE } from '../../data/balance.js';
import { changeStat } from './state.js';

const B = BALANCE;

// Подозрение растёт с множителем урока (рассадка × учитель); снижение — без множителя.
export function addSuspicion(state, amount) {
  if (state.phase !== 'lesson') return 0;
  const a = amount > 0 ? Math.round(amount * (state.lessonMul || 1)) : amount;
  return changeStat(state, 'suspicion', a);
}

export function canPuff(state) {
  return state.stats.vapeCharge > 0 && state.stats.juice > 0;
}

// Затяжка (раздел 7). Возвращает { ok, reason }.
export function puff(state) {
  if (!canPuff(state)) return { ok: false, reason: state.stats.juice <= 0 ? 'Жижка кончилась.' : 'Вейп разряжен.' };
  changeStat(state, 'stress', B.vape.puffStress);
  changeStat(state, 'vapeCharge', B.vape.puffCharge);
  state.puffsToday++;
  state.puffsInRefill++;
  if (state.puffsInRefill >= B.vape.puffsPerRefill) {
    state.puffsInRefill = 0;
    changeStat(state, 'juice', -1);
  }
  if (state.phase === 'lesson') addSuspicion(state, B.vape.puffSuspicion);
  return { ok: true };
}

// Штраф выносливости в футболе от затяжек за день (раздел 7).
export function staminaPenalty(state) {
  return Math.min(B.vape.staminaPenaltyMax, state.puffsToday * B.vape.staminaPenaltyPerPuff);
}

export function sitQuiet(state) {
  changeStat(state, 'stress', B.lessonActions.quietStress);
  changeStat(state, 'suspicion', -B.lessonActions.quietSuspicionDrop);
  changeStat(state, 'aura', B.lessonActions.quietAura);
  return { ok: true };
}

// Срыв (раздел 7): стресс 100 → тряска, следующая мини-игра или выбор проваливаются, стресс 60.
export function checkBreakdown(state) {
  if (state.stats.stress < B.stress.breakdownAt) return false;
  state.breakdowns++;
  state.breakdownPending = true;
  state.stats.stress = B.stress.resetAfterBreakdown;
  return true;
}

// Вызов к директору (раздел 7). Возвращает номер вызова.
export function directorCall(state) {
  state.directorCalls++;
  changeStat(state, 'stress', B.director.stress);
  return state.directorCalls;
}

export function isDirectorEnding(state) {
  return state.directorCalls >= B.director.endingOnCall;
}
