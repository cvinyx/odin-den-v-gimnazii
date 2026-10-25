// Кто с кем может играть на переменах (ИС-7, ИС-8, Л-13, М-1) — один общий список для игры и тестов.
// Рейджбайт на перемене — только с этими именными (и с пятиклассником в кабинке, Л-10).
export const BAIT_LIST = ['igor', 'denis', 'chernyak', 'matych', 'buy', 'shurpo', 'levonchuk', 'smile', 'bochko', 'vanya', 'vadim', 'svyat', 'anosov', 'zakha'];
// Вейп-баттл — только в туалете и раздевалке и только с ними (и с безымянными, ИС-7).
export const VAPE_BATTLE_LIST = ['chernyak', 'levonchuk', 'shurpo', 'denis', 'bochko', 'vitalik', 'buy', 'matych', 'svyat'];
// «Кто больше съест» — на большой перемене, подсесть можно только к ним (Л-13).
export const EAT_FRIENDS = ['igor', 'denis', 'guza', 'matych', 'buy'];
// Пауэрбанк (М-1) просят у друзей из списка ИС-7 (именные, не учителя).
export const POWERBANK_LIST = BAIT_LIST;
// Места, где можно вейпить вне урока (ИС-7): мужской туалет, раздевалка, кабинет класса без учителя.
export function vapePlaceOk(def) {
  return !!def && (!!def.toilet || def.id === 'locker_room' || !!def.classRoom);
}
// Где разрешён вейп-баттл (ИС-7): только туалет и раздевалка.
export function vapeBattlePlaceOk(def) { return !!def && (!!def.toilet || def.id === 'locker_room'); }
