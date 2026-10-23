// Реестр карт. На этапе 3 сюда добавляются остальные локации по тому же шаблону.
import { TEST_ROOM } from './test_room.js';
import { STREET } from './street.js';
import { REC_F1 } from './rec_f1.js';
import { K2_F1 } from './k2_f1.js';
import { K2_F2 } from './k2_f2.js';
import { K2_F3 } from './k2_f3.js';
import { K2_F4 } from './k2_f4.js';
import { K2_F4_TOILET } from './k2_f4_toilet.js';
import { CAB_404 } from './cab_404.js';
import { BUS_STOP } from './bus_stop.js';

export const MAPS = Object.fromEntries(
  [TEST_ROOM, STREET, REC_F1, K2_F1, K2_F2, K2_F3, K2_F4, K2_F4_TOILET, CAB_404, BUS_STOP].map((m) => [m.id, m]),
);

export function getMapDef(id) {
  const m = MAPS[id];
  if (!m) throw new Error('Нет карты ' + id);
  return m;
}

// Лестницы корпусов: какие этажи доступны (id карт по номерам этажей).
export const STAIRWELLS = {
  2: { 1: 'k2_f1', 2: 'k2_f2', 3: 'k2_f3', 4: 'k2_f4' },
};

// Кабинет → карта класса (для урока). Пока есть только 404; остальные кабинеты строятся по шаблону cab_404.
export const ROOM_MAPS = { '404': 'cab_404' };
