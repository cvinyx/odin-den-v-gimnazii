// Реестр мини-игр (раздел 14). Единый интерфейс экземпляра:
//   start(params)   — запуск;
//   update(dt, input) — шаг логики (input: pressed/held как у src/engine/input.js);
//   draw(r)         — отрисовка;
//   done            — true, когда игра закончилась;
//   end()           → { result: 'win'|'lose'|'draw', deltas: { stress, aura, battery, ... }, money, grade?, extra? }.
// meta: { title, keys: [строки подсказок], create(ctx) → экземпляр, describe?(params) → строка под названием }
const REG = new Map();

export function registerMinigame(id, meta) { REG.set(id, { id, ...meta }); }
export function getMinigame(id) {
  const m = REG.get(id);
  if (!m) throw new Error('Нет мини-игры ' + id);
  return m;
}
export function minigameIds() { return [...REG.keys()]; }
