// Лента соцсети (урок 6, раздел 14, п. 2c): посты друзей и вымышленных аккаунтов.
// good — «нужный» пост (лайкнуть), иначе — кринж/реклама (не лайкать). pic — какую картинку нарисовать.
// Никаких откровенных изображений: только пиксельные силуэты и смайлы.
export const FEED_POSTS = [
  { id: 'igor_lob', author: 'igor', text: 'Качал лоб 3 часа. Результат налицо. Буквально.', pic: 'forehead', good: true },
  { id: 'igor_cola', author: 'igor', text: 'Двухлитровка — это не напиток. Это кардио.', pic: 'cola', good: true },
  { id: 'denis_messi', author: 'denis', text: 'Месси сегодня опять сделал всех. Как я в Brawl Stars.', pic: 'ball', good: true },
  { id: 'denis_jeans', author: 'denis', text: 'Продам джинсы. Почти целые. Сзади вентиляция.', pic: 'jeans', good: true },
  { id: 'lev_anime', author: 'levonchuk', text: 'Девочка-кошка, 4 сезон. Не плачу. Это рис в глаз попал.', pic: 'cat', good: true },
  { id: 'lev_tank', author: 'levonchuk', text: '«Тигр» на 9 фрагов. Дед сказал — «как в молодости».', pic: 'tank', good: true },
  { id: 'kolya_banana', author: 'bochko', text: 'Батя опять банан. Семейное фото.', pic: 'banana', good: true },
  { id: 'shurpo_real', author: 'shurpo', text: '«Реал» выиграл. Судья — легенда. Как и я на диване.', pic: 'crown', good: true },
  { id: 'chernyak_aura', author: 'chernyak', text: '...', pic: 'aura', good: true },
  { id: 'smile_de', author: 'smile', text: 'Учу немецкий. Методичка старая, но надёжная.', pic: 'book', good: true },
  { id: 'matych_nose', author: 'matych', text: 'Нашёл по запаху смаженки за два корпуса.', pic: 'nose', good: true },
  { id: 'buy_invest', author: 'buy', text: 'Инвестируй в меня 1 рубль! Верну 1,5 (когда-нибудь).', pic: 'coin', good: false },
  { id: 'ad_course', author: null, name: 'Реклама', text: 'Курсы «Стань гением за 5 минут». Скидка 99 %!', pic: 'ad', good: false },
  { id: 'ad_vape', author: null, name: 'Реклама', text: 'Жижка «Клубничный туман». Ой, это нельзя рекламировать.', pic: 'ad', good: false },
  { id: 'cringe_quote', author: null, name: 'Мудрость дня', text: '«Кто рано встаёт — тот рано встаёт». Поделись с 10 друзьями!', pic: 'sun', good: false },
  { id: 'guza_chyo', author: 'guza', text: 'ЧЁ', pic: 'angry', good: true },
  { id: 'cringe_horo', author: null, name: 'Гороскоп', text: 'Скорпионам сегодня повезёт. Остальным — как обычно.', pic: 'star', good: false },
  { id: 'vitalik_skin', author: 'vitalik', text: 'Новый скин! Банан в очках. Коля, это не про тебя.', pic: 'banana', good: true },
];
