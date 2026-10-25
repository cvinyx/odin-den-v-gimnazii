// Где стоят именные NPC на переменах (раздел 11). Ключ — номер перемены 1..6, значение — id локации.
// id — это id карт из src/world/maps/.
export const NPC_SCHEDULE = {
  denis:     { 1: 'c3_f4', 2: 'c3_f4_wc', 3: 'canteen', 4: 'c1_f1', 5: 'locker_room', 6: 'c3_f3' },
  igor:      { 1: 'c3_f4', 2: 'c3_f4_wc', 3: 'canteen', 4: 'c1_f1', 5: 'locker_room', 6: 'c3_f3' },
  chernyak:  { 1: 'c2_f4_wc', 2: 'c2_f4_wc', 3: 'canteen', 4: 'c1_wc', 5: 'locker_room', 6: 'library' },
  shurpo:    { 1: 'c2_f4_wc', 2: 'c2_f4_wc', 3: 'canteen', 4: 'c1_wc', 5: 'locker_room', 6: 'library' },
  levonchuk: { 1: 'c2_f4', 2: 'c1_f2', 3: 'canteen', 4: 'c2_f4', 5: 'c1_f1', 6: 'c1_f1' },
  bochko:    { 1: 'c2_f4', 2: 'c1_f2', 3: 'canteen', 4: 'c2_f4', 5: 'locker_room', 6: 'c1_f1' },
  matych:    { 1: 'c1_f1', 2: 'c3_f4', 3: 'canteen', 4: 'c3_f4_wc', 5: 'locker_room', 6: 'c1_f1' },
  buy:       { 1: 'c1_f1', 2: 'c3_f4', 3: 'canteen', 4: 'c3_f4_wc', 5: 'locker_room', 6: 'c1_f1' },
  guza:      { 1: 'c1_f1', 2: 'c3_f4', 3: 'canteen', 4: 'c3_f4_wc', 5: 'locker_room', 6: 'c1_f1' },
  smile:     { 1: 'c2_f4', 2: 'c2_f4_wc', 3: 'canteen', 4: 'c1_f1', 5: 'locker_room', 6: 'c2_f4' },
  vadim:     { 1: 'c2_f4', 2: 'c2_f4_wc', 3: 'canteen', 4: 'c1_f1', 5: 'locker_room', 6: 'c2_f4' },
  vitalik:   { 1: 'c2_f4', 2: 'c2_f4_wc', 3: 'canteen', 4: 'c1_f1', 5: 'locker_room', 6: 'c2_f4' },
  zakha:     { 1: 'c2_f4', 2: 'c2_f4_wc', 3: 'canteen', 4: 'c1_f1', 5: 'locker_room', 6: 'c2_f4' },
  anosov:    { 1: 'c2_f4', 2: 'c2_f4_wc', 3: 'canteen', 4: 'c1_f1', 5: 'locker_room', 6: 'c2_f4' },
  // 11 «У» (Н-1, Н-2): кабинет класса 325 — корпус 3, 2-й этаж. Полная таблица мест — этап V2-5.
  vanya:     { 1: 'c3_f2', 2: 'c1_f2', 3: 'canteen', 4: 'c3_f2', 5: 'c1_f1', 6: 'c3_f2' },
  svyat:     { 1: 'c3_f2', 2: 'c1_f2', 3: 'canteen', 4: 'c3_f2', 5: 'c1_f1', 6: 'c3_f2' },
  // Завуч-патруль: null — её нет на этой перемене.
  olga:      { 1: null, 2: 'c1_f1', 3: 'canteen', 4: 'c3_f4', 5: null, 6: 'c2_f4' },
};
