// Реестр пунктов отладочного меню. Следующие этапы добавляют сюда уроки, мини-игры, локации:
//   registerDebug('Уроки', 'Урок 1 — английский', (game) => ...)
const groups = new Map();

export function registerDebug(group, label, action) {
  if (!groups.has(group)) groups.set(group, []);
  groups.get(group).push({ label, action });
}

export function debugGroups() {
  return [...groups.entries()].map(([name, items]) => ({ name, items }));
}
