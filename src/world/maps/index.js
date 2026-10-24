// Реестр карт (сгенерирован вместе с картами). Новые карты добавляются сюда.
import { TEST_ROOM } from './test_room.js';
import { BUS_STOP } from './bus_stop.js';
import { CAB_115 } from './cab_115.js';
import { CAB_208 } from './cab_208.js';
import { CAB_214 } from './cab_214.js';
import { CAB_305 } from './cab_305.js';
import { CAB_312 } from './cab_312.js';
import { CAB_404 } from './cab_404.js';
import { CANTEEN } from './canteen.js';
import { GYM } from './gym.js';
import { K1_F1 } from './k1_f1.js';
import { K1_F2 } from './k1_f2.js';
import { K1_F3 } from './k1_f3.js';
import { K1_F4 } from './k1_f4.js';
import { K1_F4_TOILET } from './k1_f4_toilet.js';
import { K2_F1 } from './k2_f1.js';
import { K2_F2 } from './k2_f2.js';
import { K2_F3 } from './k2_f3.js';
import { K2_F4 } from './k2_f4.js';
import { K2_F4_TOILET } from './k2_f4_toilet.js';
import { LIBRARY } from './library.js';
import { LOCKER_ROOM } from './locker_room.js';
import { POOL } from './pool.js';
import { REC_F1 } from './rec_f1.js';
import { REC_F2 } from './rec_f2.js';
import { REC_TOILET } from './rec_toilet.js';
import { SHOWERS } from './showers.js';
import { STREET } from './street.js';

export const MAPS = Object.fromEntries(
  [TEST_ROOM, BUS_STOP, CAB_115, CAB_208, CAB_214, CAB_305, CAB_312, CAB_404, CANTEEN, GYM, K1_F1, K1_F2, K1_F3, K1_F4, K1_F4_TOILET, K2_F1, K2_F2, K2_F3, K2_F4, K2_F4_TOILET, LIBRARY, LOCKER_ROOM, POOL, REC_F1, REC_F2, REC_TOILET, SHOWERS, STREET].map((m) => [m.id, m]),
);

export function getMapDef(id) {
  const m = MAPS[id];
  if (!m) throw new Error('Нет карты ' + id);
  return m;
}

// Лестницы корпусов: этаж → id карты.
export const STAIRWELLS = {
  1: { 1: 'k1_f1', 2: 'k1_f2', 3: 'k1_f3', 4: 'k1_f4' },
  2: { 1: 'k2_f1', 2: 'k2_f2', 3: 'k2_f3', 4: 'k2_f4' },
};

// Кабинет → карта класса (для урока).
export const ROOM_MAPS = { '404': 'cab_404', '305': 'cab_305', '208': 'cab_208', '214': 'cab_214', '312': 'cab_312', '115': 'cab_115' };
