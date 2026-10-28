// Геометрия зала для «Эль-Класико»: один экран 480×234 (под HUD), вид сверху.
// Сверху полоса 0–24: табло. Поле — внутри стен, ворота — в левой и правой стене. Снизу — трибуна (Ф-17).
export const FIELD = {
  left: 20, right: 460, top: 28, bottom: 206,
  goalTop: 96, goalBottom: 138, goalDepth: 12,
};
FIELD.cx = (FIELD.left + FIELD.right) / 2;
FIELD.cy = (FIELD.top + FIELD.bottom) / 2;
FIELD.w = FIELD.right - FIELD.left;
FIELD.h = FIELD.bottom - FIELD.top;

// «ИнЯз» защищает левые ворота и атакует вправо, «Физмат» — наоборот.
export const SIDE = { inyaz: 1, fizmat: -1 };
export const TEAM_NAMES = { inyaz: '«ИнЯз»', fizmat: '«Физмат»' };
// Форма (Ф-1, Р-11): «ИнЯз» — чёрная, «Физмат» — белая. TEAM_UI — цвет надписей на тёмном фоне.
export const TEAM_COLORS = { inyaz: '#1d1d22', fizmat: '#f2f2f2' };
export const TEAM_UI = { inyaz: '#ff9a4a', fizmat: '#9fd3ff' };

// x линии ворот, которые команда защищает / атакует
export function ownGoalX(team) { return SIDE[team] > 0 ? FIELD.left : FIELD.right; }
export function oppGoalX(team) { return SIDE[team] > 0 ? FIELD.right : FIELD.left; }
export function other(team) { return team === 'inyaz' ? 'fizmat' : 'inyaz'; }
export function clampField(x, y, m = 6) {
  return [Math.max(FIELD.left + m, Math.min(FIELD.right - m, x)), Math.max(FIELD.top + m, Math.min(FIELD.bottom - m, y))];
}
