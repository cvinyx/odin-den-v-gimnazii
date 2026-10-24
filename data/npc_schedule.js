// Где стоят именные NPC на переменах (раздел 11). Ключ — номер перемены 1..6, значение — id локации.
// id — это id карт из src/world/maps/.
export const NPC_SCHEDULE = {
  denis:     { 1: 'k2_f4', 2: 'k2_f4_toilet', 3: 'canteen', 4: 'rec_f1', 5: 'locker_room', 6: 'k2_f3' },
  igor:      { 1: 'k2_f4', 2: 'k2_f4_toilet', 3: 'canteen', 4: 'rec_f1', 5: 'locker_room', 6: 'k2_f3' },
  chernyak:  { 1: 'k1_f4_toilet', 2: 'k1_f4_toilet', 3: 'canteen', 4: 'rec_toilet', 5: 'locker_room', 6: 'library' },
  shurpo:    { 1: 'k1_f4_toilet', 2: 'k1_f4_toilet', 3: 'canteen', 4: 'rec_toilet', 5: 'locker_room', 6: 'library' },
  levonchuk: { 1: 'k1_f4', 2: 'rec_f2', 3: 'canteen', 4: 'k1_f4', 5: 'rec_f1', 6: 'rec_f1' },
  bochko:    { 1: 'k1_f4', 2: 'rec_f2', 3: 'canteen', 4: 'k1_f4', 5: 'locker_room', 6: 'rec_f1' },
  matych:    { 1: 'rec_f1', 2: 'k2_f4', 3: 'canteen', 4: 'k2_f4_toilet', 5: 'locker_room', 6: 'rec_f1' },
  buy:       { 1: 'rec_f1', 2: 'k2_f4', 3: 'canteen', 4: 'k2_f4_toilet', 5: 'locker_room', 6: 'rec_f1' },
  guza:      { 1: 'rec_f1', 2: 'k2_f4', 3: 'canteen', 4: 'k2_f4_toilet', 5: 'locker_room', 6: 'rec_f1' },
  smile:     { 1: 'k1_f4', 2: 'k1_f4_toilet', 3: 'canteen', 4: 'rec_f1', 5: 'locker_room', 6: 'k1_f4' },
  vadim:     { 1: 'k1_f4', 2: 'k1_f4_toilet', 3: 'canteen', 4: 'rec_f1', 5: 'locker_room', 6: 'k1_f4' },
  vitalik:   { 1: 'k1_f4', 2: 'k1_f4_toilet', 3: 'canteen', 4: 'rec_f1', 5: 'locker_room', 6: 'k1_f4' },
  zakha:     { 1: 'k1_f4', 2: 'k1_f4_toilet', 3: 'canteen', 4: 'rec_f1', 5: 'locker_room', 6: 'k1_f4' },
  anus:      { 1: 'k1_f4', 2: 'k1_f4_toilet', 3: 'canteen', 4: 'rec_f1', 5: 'locker_room', 6: 'k1_f4' },
  // Завуч-патруль: null — её нет на этой перемене.
  olga:      { 1: null, 2: 'rec_f1', 3: 'canteen', 4: 'k2_f4', 5: null, 6: 'k1_f4' },
};
