// Реестр пунктов отладочного меню. Следующие этапы добавляют сюда уроки, мини-игры, локации:
//   registerDebug('Уроки', 'Урок 1 — английский', (game) => ...)
const groups = new Map();

// extra: { value(), change(d) } — пункт с выбором стрелками ←→ (например, соперник мини-игры).
export function registerDebug(group, label, action, extra = {}) {
  if (!groups.has(group)) groups.set(group, []);
  groups.get(group).push({ label, action, ...extra });
}

export function debugGroups() {
  return [...groups.entries()].map(([name, items]) => ({ name, items }));
}
