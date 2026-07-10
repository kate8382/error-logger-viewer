Инструкция по приведению локального Node к версии CI (Node 20.19.0)

Рекомендация: выполнять эти шаги в WSL (Ubuntu / Debian), чтобы бинарники пакетов (esbuild, cypress и т.д.) устанавливались для Linux и не было проблем при запуске контейнеров.

Автоматический скрипт (WSL)
- Скрипт: `scripts/setup-node-wsl.sh`
- Запуск (в WSL, из корня репозитория):

```bash
bash ./scripts/setup-node-wsl.sh
```

Что делает скрипт:
- устанавливает `nvm` (если нет),
- устанавливает Node `20.19.0`, делает его используемым и по умолчанию,
- удаляет `node_modules` и выполняет `npm ci`.

Если вы предпочитаете Windows (PowerShell)
- Рекомендуется использовать `nvm-windows` (https://github.com/coreybutler/nvm-windows). Установите nvm-windows и затем:

```powershell
nvm install 20.19.0
nvm use 20.19.0
node -v
npm -v
```

После установки в WSL
- запустите dev-сервисы и e2e:

```bash
# поднять backend+frontend
docker compose -f docker-compose.dev.yml up -d --build

# локальный прогон (WSL)
npx cypress run --config-file tests/e2e/cypress.config.ts

# или через docker (если хотите запускать Cypress в контейнере)
CYPRESS_BASE_URL=http://frontend:8080 npm run test:e2e:docker
```

Если что-то пойдёт не так — пришлите вывод `node -v`, `npm -v` и `npm ci` ошибки, я помогу дальше.
