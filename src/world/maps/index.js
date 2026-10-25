// Реестр карт (версия 2, этап V2-3; генератор — tools/gen_maps_v2.mjs). Новые карты добавляются сюда.
import { BUFFET } from './buffet.js';
import { BUS_STOP } from './bus_stop.js';
import { C1_BACK } from './c1_back.js';
import { C1_F1 } from './c1_f1.js';
import { C1_F2 } from './c1_f2.js';
import { C1_GYMROOM } from './c1_gymroom.js';
import { C1_HALL } from './c1_hall.js';
import { C1_TRUDY1 } from './c1_trudy1.js';
import { C1_TRUDY2 } from './c1_trudy2.js';
import { C1_WC } from './c1_wc.js';
import { C1_YARD } from './c1_yard.js';
import { C2_F1 } from './c2_f1.js';
import { C2_F1_WC } from './c2_f1_wc.js';
import { C2_F2 } from './c2_f2.js';
import { C2_F2_WC } from './c2_f2_wc.js';
import { C2_F3 } from './c2_f3.js';
import { C2_F3_WC } from './c2_f3_wc.js';
import { C2_F4 } from './c2_f4.js';
import { C2_F4_WC } from './c2_f4_wc.js';
import { C3_F1 } from './c3_f1.js';
import { C3_F1_WC } from './c3_f1_wc.js';
import { C3_F2 } from './c3_f2.js';
import { C3_F2_WC } from './c3_f2_wc.js';
import { C3_F3 } from './c3_f3.js';
import { C3_F3_WC } from './c3_f3_wc.js';
import { C3_F4 } from './c3_f4.js';
import { C3_F4_WC } from './c3_f4_wc.js';
import { CAB_224 } from './cab_224.js';
import { CAB_232 } from './cab_232.js';
import { CAB_241 } from './cab_241.js';
import { CAB_244 } from './cab_244.js';
import { CAB_246 } from './cab_246.js';
import { CAB_321 } from './cab_321.js';
import { CAB_325 } from './cab_325.js';
import { CAB_331 } from './cab_331.js';
import { CAB_343 } from './cab_343.js';
import { CANTEEN } from './canteen.js';
import { GYM } from './gym.js';
import { LIBRARY } from './library.js';
import { LOCKER_ROOM } from './locker_room.js';
import { POOL } from './pool.js';
import { SHOWERS } from './showers.js';
import { STREET } from './street.js';
import { TEST_ROOM } from './test_room.js';

export const MAPS = Object.fromEntries(
  [BUFFET, BUS_STOP, C1_BACK, C1_F1, C1_F2, C1_GYMROOM, C1_HALL, C1_TRUDY1, C1_TRUDY2, C1_WC, C1_YARD, C2_F1, C2_F1_WC, C2_F2, C2_F2_WC, C2_F3, C2_F3_WC, C2_F4, C2_F4_WC, C3_F1, C3_F1_WC, C3_F2, C3_F2_WC, C3_F3, C3_F3_WC, C3_F4, C3_F4_WC, CAB_224, CAB_232, CAB_241, CAB_244, CAB_246, CAB_321, CAB_325, CAB_331, CAB_343, CANTEEN, GYM, LIBRARY, LOCKER_ROOM, POOL, SHOWERS, STREET, TEST_ROOM].map((m) => [m.id, m]),
);

export function getMapDef(id) {
  const m = MAPS[id];
  if (!m) throw new Error('Нет карты ' + id);
  return m;
}

// Лестницы корпусов (Л-1): корпус 1 — бывшая рекреация, 2 — левый («М», «Я»), 3 — правый («И», «У»). Этаж → id карты.
export const STAIRWELLS = {
  1: { 1: 'c1_f1', 2: 'c1_f2' },
  2: { 1: 'c2_f1', 2: 'c2_f2', 3: 'c2_f3', 4: 'c2_f4' },
  3: { 1: 'c3_f1', 2: 'c3_f2', 3: 'c3_f3', 4: 'c3_f4' },
};

// Кабинет → карта класса (для урока).
export const ROOM_MAPS = { '244': 'cab_244', '246': 'cab_246', '325': 'cab_325', '343': 'cab_343', '224': 'cab_224', '232': 'cab_232', '241': 'cab_241', '321': 'cab_321', '331': 'cab_331' };
