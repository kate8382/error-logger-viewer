Короткий промпт — проект `error-logger-viewer` (история, проблемы, что нужно сделать)

Кто мы и что делаем
- Репозиторий: error-logger-viewer
- Цель: поддерживать frontend + backend, прогонять unit + e2e тесты, собирать фронтенд в `frontend/dist` и деплоить. Локальная разработка и CI должны быть воспроизводимы в Docker/WSL с Node 20.19.0 (CI-пинning).

Краткая история действий (что уже сделано)
- Привели патч для Windows-специфичных проблем: `patch-package` применяет `jest-haste-map` патч (patches/jest-haste-map+30.4.0.patch).
- Исправляли `package.json` (скрипты для e2e, правки года в index.html) — некоторые правки были применены, затем часть отменена пользователем.
- Создан `scripts/setup-node-wsl.sh` для установки `nvm` и Node 20.19.0 в WSL и выполнения `npm ci`.
- Пробовали запускать e2e в контейнере `cypress/included` через временный `docker-compose.e2e.yml` и напрямую `docker run` — столкнулись с ошибками: `npm` usage, volume path expansion, container exit, затем контейнеры остановлены с кодом 137.
- Локальные e2e (через `npx cypress run`) запускались, но начали падать с ошибкой в рантайме браузера: `ReferenceError: require is not defined` (Webpack HMR / dev-client использует `events`/`require`), поэтому тесты падают на `before each`.

Выполнено (кратко):
- Node pinned to 20.19.0 in CI and Docker stages (builder/runtime/test).
- Unified Cypress stage into `docker/Dockerfile` and switched `docker/docker-compose.e2e.yml` to build from it (`target: cypress`). Removed `docker/cypress.Dockerfile`.
- Updated `docker/Dockerfile` to skip lifecycle scripts in production builds (`--ignore-scripts`) so `postinstall`/`patch-package` do not run in prod images.
- Added simple `healthcheck` entries to compose files so e2e waits for services readiness.
- Updated `scripts/README_NODE.md` and `scripts/setup-node-wsl.sh` to reflect docker path changes and `CYPRESS_BASE_URL=http://static-frontend:80` recommendation.
- Added `patches/README.md` documenting existing patch and guidance for future patches.

Проблемы сейчас (актуально)
1. Среда Node на ноутбуке: установлена новая глобальная версия Node (v24), что привело к несовместимым бинарным зависимостям (esbuild, cypress и пр.). Нужно привести локальную среду к Node 20.19.0 (WSL предпочтительно).
2. e2e в Docker: текущий `npm run test:e2e:docker` некорректно работает в Windows/WSL из-за разворачивания `$(pwd)` и entrypoint передачи `-lc` не там; были правки в `package.json`, но запуск из Windows PowerShell/Node вызывает ошибки. Требуется стабильный скрипт, корректно работающий из WSL и из CI.
3. Cypress e2e падают локально: в браузерном рантайме появляются вызовы Node-style `require` (из webpack-dev-server client/hot), что вызывает `require is not defined`. Нужно либо полифиллить/заменить Node-буферы/процесс для браузера в `webpack.config.cjs`, либо отключить HMR/client для e2e прогонов.
4. Docker+WSL: при запуске `docker run` в WSL важно, чтобы `$(pwd)` разворачивался в Linux путь; лучше запускать команды в WSL-терминале и/или обертывать `docker run` в `bash -lc` когда вызов идёт из Windows. Также избегать монтирования Windows-сборок `node_modules` в Linux контейнеры.
5. Нужны стабильные инструкции/скрипты и проверяемый CI job, чтобы поддерживать reproducible dev/test environment.

Открытые задачи (todo):
- Add a CI job that runs e2e via `docker compose -f docker/docker-compose.dev.yml -f docker/docker-compose.e2e.yml up --abort-on-container-exit --exit-code-from cypress` on a runner with Docker (or use `cypress-io/github-action`).
- Review and update critical dependencies that surface many terminal warnings (example: `glob`) — update to minimally compatible newer versions that do not break project logic. Run tests after upgrades and prepare patches if upstream fixes are necessary.
- Decide whether to remove the legacy `test:e2e:docker` script or keep it for backwards compatibility.
- Optionally add a documented CI-friendly `docker-compose.ci.yml` that uses prebuilt images or caches to speed up CI.

Что нужно сделать (приоритеты)
1. Привести локальную среду разработчика в соответствие с CI — Node `20.19.0`:
   - В WSL: установить `nvm`, `nvm install 20.19.0`, `nvm use 20.19.0`, удалить `node_modules`, выполнить `npm ci`.
   - (Опционально) Для Windows: предложить `nvm-windows` инструкции или PowerShell скрипт.
2. Исправить `package.json`:
   - Обновить или добавить `test:e2e:docker` так, чтобы он работал корректно из WSL (или добавлять отдельный `test:e2e:win` который вызывает `wsl ...`). Обеспечить передачу `CYPRESS_BASE_URL` и правильную экспансию `$(pwd)`.
3. Исправить Webpack для e2e/Dev:
   - Добавить либо полифиллы (`events`, `process/browser`, `buffer`) в `resolve.fallback` и `ProvidePlugin`, либо отключить HMR/client при запуске e2e (опция в `webpack.config.cjs` или переменная окружения `NODE_ENV`/`CYPRESS_E2E`), чтобы избежать `require is not defined`.
4. Добавить или зафиксировать рабочий `docker-compose.e2e.yml` (опционально):
   - Сервис `cypress` использует `cypress/included:x.y.z`, монтирует `/e2e`, указывает `--entrypoint bash` или `command: ["bash","-lc","npm ci && npx cypress run ..."]`, зависит от `frontend`, находится в той же сети.
5. Добавить CI Job (GitHub Actions) на ветку/PR для прогонов e2e (используя Node 20.19.0 или `cypress-io/github-action`), чтобы избежать локальной руттиной.
6. Документация: обновить `README`/`DOCKER_WSL_GUIDE.md` и добавить `scripts/README_NODE.md` с точными командами и объяснениями.
7. Я хочу навести порядок в корне своего репозитория и перенести все файлы, связанные с Docker, в отдельную папку `docker/`.

8. Обновление зависимостей:
 - Провести аудит зависимостей (например, `npm audit` + `npm outdated`) и обновить пакеты с наибольшим количеством предупреждений, начиная с непересекающих изменений, таких как `glob`.
 - Прогнать unit/e2e тесты после каждого крупного обновления и фиксировать возникающие регрессии в `patches/` или через PRы в upstream.

Сейчас в корне находятся следующие файлы:
- Dockerfile
- docker-compose.yml
- docker-compose.dev.yml
- docker-compose.example.yml
- start-dev.ps1
- start-dev.sh
- start-prod.ps1
- start-prod.sh

Пожалуйста, предоставь:
7.1 Консольные команды (bash/sh), чтобы создать папку `docker/` и переместить туда эти файлы.
7.2 Обновленное содержимое файлов `docker-compose.dev.yml` и `docker-compose.yml`. Учти, что контекст сборки (build context) и пути монтирования разделов (volumes) должны измениться, так как сами файлы теперь лежат в подпапке `docker/` (то есть пути вида `. ./:/app` или `build: .` теперь должны правильно указывать на корень проекта).
7.3 Изменения, которые нужно внести в npm-скрипты в `package.json` или в скрипты запуска (`start-dev.sh`, `start-dev.ps1` и т.д.), которые вызывают `docker compose`, чтобы они использовали правильный путь к конфигурационным файлам. Например: `docker compose -f docker/docker-compose.dev.yml up`.

8.Мне нужно навести порядок в истории Git и ветках репозитория.

Текущая ситуация:
- Я нахожусь в локальной ветке `fix/dev-server-startup`.
- Эта ветка опережает `main` на 8 коммитов и отстает на 1 коммит (этот 1 коммит — ПР коллаборатора, который недавно влили в `main`).
- Я хочу переименовать свою текущую рабочую ветку в `refactor/project-cleanup`, сохранить все свои изменения, подтянуть актуальное состояние из `main` (чтобы вошел тот самый коммит коллаборатора) и безопасно удалить старые ненужные ветки.

Пожалуйста, напиши пошаговую последовательность Git-команд, чтобы:
1. Скачать последние изменения из удаленного репозитория (fetch).
2. Переименовать мою текущую активную ветку `fix/dev-server-startup` в `refactor/project-cleanup`.
3. Влить (merge) или перебазировать (rebase) ветку `main` в мою переименованную ветку, чтобы добавить недостающий коммит из `main`, и чисто разрешить возможные конфликты.
4. Отправить (push) новую ветку в удаленный репозиторий (`origin`).
5. Удалить старую ветку `fix/dev-server-startup` в удаленном репозитории.
6. Безопасно удалить локальную и удаленную устаревшие ветки с именем `fix/ts-deprecations-stats`.

Команды для немедленного воспроизведения (рекомендуемая последовательность, в WSL)
```bash
# 1) в WSL: привести Node к 20.19.0 (уже есть скрипт)
bash ./scripts/setup-node-wsl.sh

# 2) поднять dev-сервисы
docker compose -f docker-compose.dev.yml up -d --build

# 3) локальный e2e
npx cypress run --config-file tests/e2e/cypress.config.ts

# 4) или запуск Cypress в контейнере (из WSL)
CYPRESS_BASE_URL=http://frontend:8080 npm run test:e2e:docker
```

Дополнительные подсказки для разработчика/ассистента
- Если `require is not defined` — временно запустить dev сервер без HMR для e2e: `webpack --config webpack.config.cjs --mode development` с `hot: false` или добавить условие в конфиг: `if (process.env.CYPRESS_E2E) { devServer.hot = false; devServer.client = false; }`.
- Для CI используйте официальные образы `cypress/included` или `cypress-io/github-action` и пробрасывайте `BASE_URL` как переменную.

Желаемый результат
- Локально и в CI e2e прогоняются стабильно (тот же Node, те же бинарники), `npm ci` ставит linux‑бинарники когда нужно, `docker run`/`docker compose` не ломаются из‑за путей, и тесты проходят (или падения воспроизводимы и фиксируемы).


--
Формат есть. Если нужно — сокращу или расширю (например, добавить точные diff‑патчи и пример `docker-compose.e2e.yml`).
