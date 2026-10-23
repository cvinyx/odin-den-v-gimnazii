# Один день в гимназии

Пиксельная RPG про один школьный день. Игра для ПК, открывается в браузере.

- Готовая игра: файл `dist/index.html`. Скачай и открой двойным кликом (нужен Chrome, Edge или Firefox).
- Спецификация: `GAME_SPEC.md`. Этапы разработки: `STAGES.md`. Правила для Claude: `CLAUDE.md`.
- Журнал разработки: `PROGRESS.md`. Скриншоты этапов: `docs/screenshots/`.

## Для разработчика
- `npm install`, затем `npm run dev` — разработка, `npm run build` — сборка `dist/index.html`, `npm test` — тесты.
- `node tools/screenshots.mjs` — проверка сборки в браузере и скриншоты.
