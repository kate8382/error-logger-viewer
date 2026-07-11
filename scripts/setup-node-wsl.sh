#!/usr/bin/env bash
set -euo pipefail

# Скрипт для WSL: устанавливает nvm, Node 20.19.0, очищает node_modules и запускает npm ci
# Запуск: в WSL, из корня репозитория:
#   bash ./scripts/setup-node-wsl.sh

REQUIRED_NODE="20.19.0"
NVM_DIR="$HOME/.nvm"

echo "==> Устанавливаю nvm (если ещё не установлен)"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  echo "nvm уже установлен"
else
  curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.8/install.sh | bash
fi

# Загрузим nvm в текущую сессию
export NVM_DIR="$NVM_DIR"
# shellcheck source=/dev/null
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

echo "==> Устанавливаю Node $REQUIRED_NODE"
nvm install "$REQUIRED_NODE"
nvm alias default "$REQUIRED_NODE"
nvm use "$REQUIRED_NODE"

echo "Node: $(node -v)"
echo "npm: $(npm -v)"

# Перейти в корень проекта (если запущено из другого каталога)
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

echo "==> Очистка node_modules и установка зависимостей (npm ci)"
rm -rf node_modules
npm ci

echo "==> Установка завершена. Рекомендуется перезапустить терминал или выполнить 'source ~/.profile' если nvm не доступен в новой сессии."

echo "Дальше вы можете поднять dev-сервисы и запустить тесты, например:
echo "Дальше вы можете поднять dev-сервисы и запустить тесты, например:
  docker compose -f docker/docker-compose.dev.yml up -d --build
  npx cypress run --config-file tests/e2e/cypress.config.ts
или
  # Запуск e2e через Docker (например, если вы используете WSL и хотите запускать тесты в контейнере):
  CYPRESS_BASE_URL=http://static-frontend:80 npm run test:e2e:docker
или (используйте compose e2e, рекомендуется):
  docker compose -f docker/docker-compose.dev.yml -f docker/docker-compose.e2e.yml up --abort-on-container-exit --exit-code-from cypress --build backend static-frontend cypress
"
"
