# PROGRESS — журнал разработки «Один день в гимназии»

## Статус этапов
- [x] **Этап 1 — движок и каркас** (эта сессия)
- [ ] Этап 2 — вертикальный срез
- [ ] Этап 3 — вся школа и полный день
- [ ] Этап 4 — мини-игры
- [ ] Этап 5 — Эль-Класико
- [ ] Этап 6 — концовки, полировка, сборка

## Этап 1: что сделано
1. Проект Vite (чистый JS) + vite-plugin-singlefile. `npm run dev`, `npm run build` → один файл
   `dist/index.html` (~133 КБ, без внешних ссылок, работает через file://). `npm test` — node-тесты.
2. Движок: цикл с фиксированным шагом 1/60, рендерер 480×270 с целым масштабом и чёрными полями,
   камера и тряска, ввод (pressed/held/released) по разделу 3, стек сцен с затемнениями,
   ГПСЧ с сидом, tween-утилиты, полный экран по F.
3. Битмап-шрифт 5×7 в ячейке 6×9: кириллица с Ёё Іі Ўў, латиница, цифры, знаки, «», —, %, №,
   стрелки и ♥. Цвет, перенос по словам, крупный режим ×2. Сцена «Шрифт».
4. Генератор персонажей: спрайты 16×32 (тело 22–28 px по росту), 4 направления × 3 кадра,
   портреты 48×48 в 5 эмоциях; всё кэшируется в offscreen-canvas. Все 15 именных учеников и
   14 учителей (директор — дверь, только голос) + безымянные по сиду. Сцена «Галерея».
5. Диалоги: окно в стиле Undertale (портрет, 3 строки, печать с блипами, пропуск, {shake} {slow}
   {wave} {c=цвет}), меню выбора A–D, парсер формата раздела 20 с ошибками по номерам строк.
6. Состояние дня (`src/game/state.js`), все числа в `data/balance.js`. HUD с 7 статусами,
   мини-шкалами, миганием критических значений и всплывающими «+5/−3». Панель по Tab.
7. Звук Web Audio: блипы с тоном персонажа, звуки меню, звонок, свисток, удар, смех Игоря,
   секвенсор чиптюна, треки «меню» и «комната». M — звук вкл/выкл. Старт после первого нажатия.
8. Сохранение: localStorage в try/catch + код сохранения (компактный JSON → base64 + CRC32).
9. Главное меню, «Новая игра» (код дня), ввод кода сохранения, настройки, пауза. «Достижения» — «Скоро».
10. Тестовая комната: карта 40×18 тайлов, коллизии, ходьба/бег, Игорь (ходит по маршруту) и
    Черняк, разговор по Z, выбор меняет статусы — видно в HUD. Реплики в `data/dialogs/test.txt`.
11. Отладочное меню (` или ?debug): FPS, сцены, редактор статусов, проверка звуков. Реестр пунктов.

## Карта кода и ключевые API

### src/engine/
| Файл | Что внутри |
|---|---|
| `loop.js` | `Loop(update, draw)`: фикс. шаг `STEP = 1/60`, `fps` |
| `renderer.js` | `Renderer`: `W=480, H=270, GAME_H=234, HUD_H=36`; `rect, frame, box, image, sprite(img,sx,sy,sw,sh,x,y,scale,flip), text(str,x,y,{color,scale,shadow,align}), glyph, measure, wrap, alpha(a,fn), clip, withCamera(fn), withShake(fn), shake(power,time), blink(period)`; `cam {x,y}`; `toggleFullscreen()` |
| `input.js` | `input.pressed/held/released(action)`, `axis()`, `consume(action)`, `consumeAll()`, `typed` (символы для полей ввода), `onFirstInteraction(cb)`. Действия: up, down, left, right, confirm, back, pause, run, action2, tab, mute, fullscreen, debug |
| `scenes.js` | `SceneManager`: `push/pop/replace/reset(scene, {fade})`, `transition(fn)`, `remove`, `top`. Сцена: `enter(game), exit(), resume(result), update(dt), draw(r)`, `opaque=false` — рисовать сцену под ней. У сцен есть `id` |
| `rng.js` | `Rng(seed)`: `next, float, int(min,max), chance(p), pick, shuffle, fork(name), getState/setState`; `rngFromCode(code, stream)`, `generateSeedCode()`, `isValidSeed`, `normalizeSeed` |
| `tween.js` | `Ease.*`, `Tween`, `Tweener.add(target, props, dur, ease, onDone)`, `wait`, `lerp`, `clamp` |
| `font_glyphs.js`, `font.js` | `GLYPHS`, `REQUIRED_CHARS`; `drawText`, `drawGlyph`, `measure`, `wrapText`, `wrapChars`, `LINE_H` |
| `audio.js` | `audio.unlock()`, `play(name)` (`SFX_NAMES`), `blip(freq, wave)`, `playMusic(name, data)`, `stopMusic`, `toggleMute`, `setMusicVolume/setSfxVolume`; `noteFreq('A4')` |
| `save.js` | `storeGet/storeSet/storeRemove`, `autosave(state)`, `loadAutosave()`, `encodeSaveCode(state)`, `decodeSaveCode(code)` → `{ok, state}` или `{ok:false, error}`, `copyToClipboard` |
| `canvas.js` | `makeCanvas(w,h)` |

### src/gen/
- `sprites.js`: `heightPx(cm)`, `buildSheetPixels(params)` (48×128: 3 кадра × [down, left, right, up]), `getSheet(key, params)`, `frameRect(dir, frame)`, `WALK_CYCLE`.
- `portraits.js`: `EMOTIONS = norm, happy, angry, surprised, dumb`, `getPortrait(key, params, emo)`, `buildPortraitPixels`.
- `people.js`: `getPerson(id)`, `sheetOf(id)`, `portraitOf(id, emo)`, `makeUnnamed(rng)`, `NARRATOR`.
- `tiles.js`: тайлы 16×16 и легенда `TILE_DEFS` (`.` пол, `,` ковёр, `#` верх стены, `W` стена, `w` окно с батареей, `D` дверь, `B` доска, `L` шкафчики, `T` парта, `P` цветок, `b` скамейка).
- `icons.js`: иконки статусов 8×8. `pixels.js` — пиксельный буфер (работает в node), `color.js`.

Параметры персонажа (data/characters.js, data/teachers.js): `heightCm, build (thin/normal/athletic/full), skin, hairStyle (short, side-part, slick, buzz, spiky, curly-short, medium-straight, medium, mullet, long-curly, long-messy, village, long-straight, ponytail, bob, bun), hairColor, eyeColor, top (suit, shirt, blouse, sweater, hoodie, cardigan, tshirt, tshirt-supreme, tracksuit, coat, dress), topColor, shirtColor, pants (trousers, jeans, wide, track, skirt), pantsColor, tie, glasses (round/thin), noBrows, bigNose, bigChin, bigLips, bigForehead, wideSmile, beard, mustache, wrinkles, whistle, briefcase, rippedPants, female, blip {freq, wave}`.

### src/ui/
- `dialog.js`: `DialogBox.show(person, portrait, text)`, `update(dt, input)` → true, когда дочитано; `BOX`, `TEXT_SPEEDS`.
- `dialog_script.js`: `parseDialog(text, {speakers})` → `{labels, order, errors[{line,msg}]}`; `parseRichText`, `checkCondition`, `DialogParseError`.
- `choice.js`: `ChoiceMenu(question, options)`; `menu.js`: `Menu(items)` (пункт: `label, action, soon, disabled, value, change`).
- `hud.js`: `Hud.update(dt, state)`, `Hud.draw(r, state)`, `HUD_SLOTS`, `hud.hint` (строка «Следующий: …» — для этапа 2).
- `transitions.js`: `drawFade`, `drawWipe`, `drawToast`. `format.js`: `formatTimer`.

### src/game/
- `state.js`: `createState(seed)`, `changeStat(state, key, delta)`, `setStat`, `applyScriptEffect`, `scriptStatValue`, `formatMoney`, `validateState`, `normalizeState`. Деньги — в копейках. Статусы: `battery, stress, aura, vapeCharge, juice (заправки), suspicion, hunger, money`.
- `game.js`: `Game` — `r, scenes, input, audio, hud, state, settings`; `newDay(seed)`, `loadState`, `autosave()`, `applyEffect(e)`, `playMusic(name)`, `toast(text)`.
- `dialog_runner.js`: `DialogRunner(script, label, hooks)`: `next()` → say/choice/end, `choose(i)`.
- `dialogs.js`: `getDialog(name)` (все `data/dialogs/*.txt` импортируются как текст), `validateAllDialogs()`.

### src/world/
- `tilemap.js` `TileMap(def)`; `collisions.js` `moveActor`, `feetBox`; `npc.js` `Actor`, `Npc` (маршрут `route`, `talk {file, label}`); `interactions.js` `findTalkTarget`; `maps/test_room.js`.

### src/scenes/
`title`, `new_game`, `text_input`, `settings`, `pause`, `save_code`, `status_panel`, `dialog_scene`, `test_room`, `font_test`, `gallery`.

### src/debug/
- `registry.js`: `registerDebug(группа, подпись, (game) => …)` — сюда этапы 2–5 добавляют уроки, мини-игры, локации.
- `debug_menu.js`, `entries.js` (пункты этапа 1).

### data/
`balance.js` (все числа разделов 7, 8, 11, 14, 15, 16), `characters.js`, `teachers.js`, `schedule.js`, `npc_schedule.js` (таблица раздела 11 с id локаций будущих карт), `music.js`, `dialogs/test.txt`.

### Пустые пока папки
`src/minigames/`, `src/football/` — для этапов 4–5. `src/game/day.js`, `endings.js`, `achievements.js` появятся на этапах 2, 6.

## Проверки этапа 1
- `npm run build` — без ошибок, один файл, внешних ссылок нет.
- `node tools/screenshots.mjs` — dist/index.html через file:// в headless Chromium: ошибок в консоли
  нет, внешних запросов нет, 18 скриншотов в `docs/screenshots/etap-1/`. Выбор в диалоге с Игорем
  меняет статусы (аура 50→55, стресс 30→25), HUD показывает «+5/−5». Испорченный код сохранения
  даёт сообщение «Код повреждён…», верный код восстанавливает то же состояние.
- `npm test` — 25 тестов: парсер на test.txt и на файле с ошибками (номера строк), исполнитель
  диалога, сохранение → код → загрузка = то же состояние, испорченные коды и отсутствие
  localStorage не роняют игру, ГПСЧ, шрифт (все обязательные символы), данные персонажей,
  уникальность спрайтов и портретов.
- Ходьба 64 px/с, бег (Shift) 112 px/с, упор в стены, 60 FPS в headless Chromium.
- `node tools/preview_chars.mjs <папка>` — PNG всех листов спрайтов и портретов (без браузера).

## Решения (спорные места)
- В репозитории два файла спецификации: `GAME_SPEC.md` и более новый `GAME SPEC.md` (с пробелом).
  Они отличаются только описанием Дениса (160 см, полный, очень лохматый, рвущиеся джинсы, фанат
  Месси) и Смайла (Германия, Fortnite). Новая версия совпадает с JOKES.md, поэтому внешность Дениса
  и Смайла сделана по ней. Оба файла не трогал.
- Часть шуток в JOKES.md нарушает раздел 22 (национальные/этнические шутки, сексуальные темы,
  отсылки к нацизму). В игре их не использую; беру остальное (лоб Игоря, молчание и аура Черняка,
  «Реал» Шурпо, банан-отец Коли, Месси Дениса и т. п.).
- Деньги хранятся в копейках (целые числа), в диалогах пишутся в BYN (`# money +1.20`).
- Жижка хранится в заправках (`juice`), затяжки внутри заправки будут считаться на этапе 2.
- «Новая игра» на этапе 1 ведёт в тестовую комнату (день ещё не собран), «Продолжить» и ввод кода
  тоже загружают состояние в тестовую комнату. На этапе 2 это заменится на вступление/день.
- Отладочное меню пока открывается и по `, и через ?debug (FPS сразу). Скрыть — на этапе 6.
- Учителя в окне диалога подписываются полным именем-отчеством, ученики — коротким именем.
- Текстовые эффекты: `{shake}`, `{slow}`, `{wave}`, `{c=red|yellow|blue|green|gray|pink|orange|#hex}`.
  Команды эффектов: `# stat ±N`, `# stat =N`, `# sfx имя`, `# shake`, `# flag имя`, `# unflag имя`.
  Условия: `{if stat>N}` (>, <, >=, <=, ==, !=), `{if flag имя}`, `{if !flag имя}`.
- Таймер спидрана уже работает (настройка) — считает время в игровых сценах.

## Известные проблемы
- Анимации простоя (глупый взгляд Ромы) пока нет — запланировано на этап 6 (полировка).
- Глиф «№» в 5 пикселях выглядит тесновато.
- Автосохранение пока делается при входе в тестовую комнату и после каждого диалога; по правилам
  раздела 18 (начало урока/перемены) — на этапе 2.
