// Где стоят именные NPC на переменах (раздел 11). Ключ — номер перемены 1..6, значение — id локации.
// id локаций будут созданы на этапах 2–3 (src/world/maps/).
export const NPC_SCHEDULE = {
  denis:     { 1: 'k2_f4_corridor', 2: 'k2_f4_toilet', 3: 'canteen', 4: 'rec_f1', 5: 'locker_room', 6: 'k2_f3_corridor' },
  igor:      { 1: 'k2_f4_corridor', 2: 'k2_f4_toilet', 3: 'canteen', 4: 'rec_f1', 5: 'locker_room', 6: 'k2_f3_corridor' },
  chernyak:  { 1: 'k1_f4_toilet', 2: 'k1_f4_toilet', 3: 'canteen', 4: 'rec_toilet', 5: 'locker_room', 6: 'library' },
  shurpo:    { 1: 'k1_f4_toilet', 2: 'k1_f4_toilet', 3: 'canteen', 4: 'rec_toilet', 5: 'locker_room', 6: 'library' },
  levonchuk: { 1: 'k1_f4_corridor', 2: 'rec_f2', 3: 'canteen', 4: 'k1_f4_corridor', 5: 'rec_f1', 6: 'rec_f1' },
  bochko:    { 1: 'k1_f4_corridor', 2: 'rec_f2', 3: 'canteen', 4: 'k1_f4_corridor', 5: 'locker_room', 6: 'rec_f1' },
  matych:    { 1: 'rec_f1', 2: 'k2_f4_corridor', 3: 'canteen', 4: 'k2_f4_toilet', 5: 'locker_room', 6: 'rec_f1' },
  buy:       { 1: 'rec_f1', 2: 'k2_f4_corridor', 3: 'canteen', 4: 'k2_f4_toilet', 5: 'locker_room', 6: 'rec_f1' },
  guza:      { 1: 'rec_f1', 2: 'k2_f4_corridor', 3: 'canteen', 4: 'k2_f4_toilet', 5: 'locker_room', 6: 'rec_f1' },
  smile:     { 1: 'k1_f4_corridor', 2: 'k1_f4_toilet', 3: 'canteen', 4: 'rec_f1', 5: 'locker_room', 6: 'k1_f4_corridor' },
  vadim:     { 1: 'k1_f4_corridor', 2: 'k1_f4_toilet', 3: 'canteen', 4: 'rec_f1', 5: 'locker_room', 6: 'k1_f4_corridor' },
  vitalik:   { 1: 'k1_f4_corridor', 2: 'k1_f4_toilet', 3: 'canteen', 4: 'rec_f1', 5: 'locker_room', 6: 'k1_f4_corridor' },
  zakha:     { 1: 'k1_f4_corridor', 2: 'k1_f4_toilet', 3: 'canteen', 4: 'rec_f1', 5: 'locker_room', 6: 'k1_f4_corridor' },
  anus:      { 1: 'k1_f4_corridor', 2: 'k1_f4_toilet', 3: 'canteen', 4: 'rec_f1', 5: 'locker_room', 6: 'k1_f4_corridor' },
  // Завуч-патруль: null — её нет на этой перемене.
  olga:      { 1: null, 2: 'rec_f1', 3: 'canteen', 4: 'k2_f4_corridor', 5: null, 6: 'k1_f4_corridor' },
};
