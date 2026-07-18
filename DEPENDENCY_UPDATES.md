# Обновление зависимостей — план и инструкция

Цель: безопасно и поэтапно обновить зависимости проекта так, чтобы логика и сборка не ломались. Документ даёт команды, рекомендации по порядку обновлений, проверкам и откату.

Общие принципы
- Делайте обновления небольшими и атомарными (по одному пакету или по небольшой группе совместимых пакетов).
- Сначала обновляйте патчевые и минорные версии (не содержащие breaking changes). Мажорные версии — в отдельной ветке и PR с ревью и тестированием.
- Всегда прогоняйте unit и e2e тесты после каждого обновления. Выполняйте сборку frontend/backend и ручную проверку ключевых сценариев.
- Фиксируйте изменения в `package-lock.json` (не удаляйте lock-файл без необходимости). Коммитьте lock-файл вместе с изменением `package.json`.
- Если обновление ломает проект — делайте `git revert` или откат версии, создайте issue и (при необходимости) патч через `patch-package`.

Инструменты (рекомендуемые)
- `npm outdated --json` — список устаревших пакетов.
- `npm audit --json` — вывод уязвимостей.
- `npm update` — обновляет до allowed семантических версий (minor/patch).
- `npm install <pkg>@<version>` — установить конкретную версию и зафиксировать lock-файл.
- `npx npm-check-updates` (ncu) — помогает подготовить массовые обновления (использовать осторожно, особенно для мажорных апдейтов).
- `patch-package` — фиксировать локальные правки в `node_modules` при необходимости.

Контрольный список перед обновлением
1. Убедитесь, что у вас чистая рабочая директория: `git status` — ничего не должно быть в рабочем дереве.
2. Создайте ветку: `git checkout -b DEP_UPDATES/<pkg>-<version>` или `DEP_UPDATES/batch-1`.
3. Запустите в репозитории (в WSL для Windows):

```bash
npm ci
npm outdated --json > outdated.json
npm audit --json > audit.json
```

4. Прочитайте `outdated.json` и `audit.json` чтобы выбрать приоритеты.

Текущие снимки (выполнено автоматически)
--------------------------------------
Выполнил команды:

```bash
npm outdated --json > outdated.json
npm audit --json > audit.json
```

-- `npm outdated --json` (сводка):

```json
{
  "@babel/core": {
    "current": "7.29.7",
    "wanted": "7.29.7",
    "latest": "8.0.1",
    "dependent": "error-logger-viewer",
    "location": "C:\\Users\\kate8382\\Desktop\\GitHub\\error-logger-viewer\\node_modules\\@babel\\core"
  },
  "@babel/preset-env": {
    "current": "7.29.7",
    "wanted": "7.29.7",
    "latest": "8.0.2",
    "dependent": "error-logger-viewer",
    "location": "C:\\Users\\kate8382\\Desktop\\GitHub\\error-logger-viewer\\node_modules\\@babel\\preset-env"
  },
  "@babel/preset-typescript": {
    "current": "7.29.7",
    "wanted": "7.29.7",
    "latest": "8.0.1",
    "dependent": "error-logger-viewer",
    "location": "C:\\Users\\kate8382\\Desktop\\GitHub\\error-logger-viewer\\node_modules\\@babel\\preset-typescript"
  },
  "@eslint/js": {
    "current": "9.39.4",
    "wanted": "9.39.5",
    "latest": "10.0.1",
    "dependent": "error-logger-viewer",
    "location": "C:\\Users\\kate8382\\Desktop\\GitHub\\error-logger-viewer\\node_modules\\@eslint\\js"
  },
  "@types/cypress": {
    "current": "1.1.6",
    "wanted": "1.1.6",
    "latest": "0.1.6",
    "dependent": "error-logger-viewer",
    "location": "C:\\Users\\kate8382\\Desktop\\GitHub\\error-logger-viewer\\node_modules\\@types\\cypress"
  },
  "@types/node": {
    "current": "20.19.43",
    "wanted": "20.19.43",
    "latest": "26.1.1",
    "dependent": "error-logger-viewer",
    "location": "C:\\Users\\kate8382\\Desktop\\GitHub\\error-logger-viewer\\node_modules\\@types\\node"
  },
  "@types/supertest": {
    "current": "6.0.3",
    "wanted": "6.0.3",
    "latest": "7.2.1",
    "dependent": "error-logger-viewer",
    "location": "C:\\Users\\kate8382\\Desktop\\GitHub\\error-logger-viewer\\node_modules\\@types\\supertest"
  },
  "@typescript-eslint/eslint-plugin": {
    "current": "8.61.0",
    "wanted": "8.64.0",
    "latest": "8.64.0",
    "dependent": "error-logger-viewer",
    "location": "C:\\Users\\kate8382\\Desktop\\GitHub\\error-logger-viewer\\node_modules\\@typescript-eslint\\eslint-plugin"
  },
  "@typescript-eslint/parser": {
    "current": "8.61.0",
    "wanted": "8.64.0",
    "latest": "8.64.0",
    "dependent": "error-logger-viewer",
    "location": "C:\\Users\\kate8382\\Desktop\\GitHub\\error-logger-viewer\\node_modules\\@typescript-eslint\\parser"
  },
  "concurrently": {
    "current": "7.6.0",
    "wanted": "7.6.0",
    "latest": "10.0.3",
    "dependent": "error-logger-viewer",
    "location": "C:\\Users\\kate8382\\Desktop\\GitHub\\error-logger-viewer\\node_modules\\concurrently"
  },
  "cypress": {
    "current": "15.17.0",
    "wanted": "15.18.1",
    "latest": "15.18.1",
    "dependent": "error-logger-viewer",
    "location": "C:\\Users\\kate8382\\Desktop\\GitHub\\error-logger-viewer\\node_modules\\cypress"
  },
  "esbuild": {
    "current": "0.27.7",
    "wanted": "0.27.7",
    "latest": "0.28.1",
    "dependent": "error-logger-viewer",
    "location": "C:\\Users\\kate8382\\Desktop\\GitHub\\error-logger-viewer\\node_modules\\esbuild"
  },
  "eslint": {
    "current": "9.39.4",
    "wanted": "9.39.5",
    "latest": "10.7.0",
    "dependent": "error-logger-viewer",
    "location": "C:\\Users\\kate8382\\Desktop\\GitHub\\error-logger-viewer\\node_modules\\eslint"
  },
  "eslint-plugin-jest": {
    "current": "29.15.2",
    "wanted": "29.15.4",
    "latest": "29.15.4",
    "dependent": "error-logger-viewer",
    "location": "C:\\Users\\kate8382\\Desktop\\GitHub\\error-logger-viewer\\node_modules\\eslint-plugin-jest"
  },
  "globals": {
    "current": "16.5.0",
    "wanted": "16.5.0",
    "latest": "17.7.0",
    "dependent": "error-logger-viewer",
    "location": "C:\\Users\\kate8382\\Desktop\\GitHub\\error-logger-viewer\\node_modules\\globals"
  },
  "jest": {
    "current": "30.4.1",
    "wanted": "30.4.2",
    "latest": "30.4.2",
    "dependent": "error-logger-viewer",
    "location": "C:\\Users\\kate8382\\Desktop\\GitHub\\error-logger-viewer\\node_modules\\jest"
  },
  "jest-haste-map": {
    "current": "30.4.0",
    "wanted": "30.4.0",
    "latest": "30.4.1",
    "dependent": "error-logger-viewer",
    "location": "C:\\Users\\kate8382\\Desktop\\GitHub\\error-logger-viewer\\node_modules\\jest-haste-map"
  },
  "prettier": {
    "current": "3.8.4",
    "wanted": "3.9.5",
    "latest": "3.9.5",
    "dependent": "error-logger-viewer",
    "location": "C:\\Users\\kate8382\\Desktop\\GitHub\\error-logger-viewer\\node_modules\\prettier"
  },
  "sass-loader": {
    "current": "16.0.8",
    "wanted": "16.0.8",
    "latest": "17.0.0",
    "dependent": "error-logger-viewer",
    "location": "C:\\Users\\kate8382\\Desktop\\GitHub\\error-logger-viewer\\node_modules\\sass-loader"
  },
  "typescript": {
    "current": "6.0.3",
    "wanted": "6.0.3",
    "latest": "7.0.2",
    "dependent": "error-logger-viewer",
    "location": "C:\\Users\\kate8382\\Desktop\\GitHub\\error-logger-viewer\\node_modules\\typescript"
  },
  "uuid": {
    "current": "14.0.0",
    "wanted": "14.0.1",
    "latest": "14.0.1",
    "dependent": "error-logger-viewer",
    "location": "C:\\Users\\kate8382\\Desktop\\GitHub\\error-logger-viewer\\node_modules\\uuid"
  },
  "webpack": {
    "current": "5.107.2",
    "wanted": "5.108.4",
    "latest": "5.108.4",
    "dependent": "error-logger-viewer",
    "location": "C:\\Users\\kate8382\\Desktop\\GitHub\\error-logger-viewer\\node_modules\\webpack"
  },
  "webpack-cli": {
    "current": "6.0.1",
    "wanted": "6.0.1",
    "latest": "7.2.1",
    "dependent": "error-logger-viewer",
    "location": "C:\\Users\\kate8382\\Desktop\\GitHub\\error-logger-viewer\\node_modules\\webpack-cli"
  },
  "webpack-dev-server": {
    "current": "5.2.5",
    "wanted": "5.2.6",
    "latest": "6.0.0",
    "dependent": "error-logger-viewer",
    "location": "C:\\Users\\kate8382\\Desktop\\GitHub\\error-logger-viewer\\node_modules\\webpack-dev-server"
  }
}
```

Краткий список наиболее заметных пакетов (из `outdated.json`):
- `@babel/core`, `@babel/preset-env`, `@babel/preset-typescript` — доступны major версии 8.x (текущее 7.29.x).
- `@types/node` — latest `26.1.1` (текущее 20.19.43).
- `concurrently` — latest `10.0.3` (текущее 7.6.0).
- `esbuild` — minor/patch available (fix в 0.28.1).
- `webpack-cli` — major 7.x available.
- `webpack-dev-server` — latest `6.0.0` (major), текущая 5.2.5/5.2.6.
- `typescript` — latest `7.0.2` (значительное обновление от 6.x).

-- `npm audit --json` (сводка):

```json
{
  "auditReportVersion": 2,
  "vulnerabilities": {
    "esbuild": {
      "name": "esbuild",
      "severity": "low",
      "isDirect": true,
      "via": [
        {
          "source": 1120680,
          "name": "esbuild",
          "dependency": "esbuild",
          "title": "esbuild allows arbitrary file read when running the development server on Windows",
          "url": "https://github.com/advisories/GHSA-g7r4-m6w7-qqqr",
          "severity": "low",
          "cwe": [
            "CWE-22"
          ],
          "cvss": {
            "score": 2.5,
            "vectorString": "CVSS:3.1/AV:L/AC:H/PR:L/UI:N/S:U/C:N/I:L/A:N"
          },
          "range": ">=0.27.3 <0.28.1"
        }
      ],
      "effects": [],
      "range": "0.27.3 - 0.28.0",
      "nodes": [
        "node_modules/esbuild"
      ],
      "fixAvailable": true
    },
    "http-proxy-middleware": {
      "name": "http-proxy-middleware",
      "severity": "moderate",
      "isDirect": false,
      "via": [
        {
          "source": 1121360,
          "name": "http-proxy-middleware",
          "dependency": "http-proxy-middleware",
          "title": "http-proxy-middleware `router` host+path substring matching allows Host-header-driven backend routing bypass",
          "url": "https://github.com/advisories/GHSA-64mm-vxmg-q3vj",
          "severity": "moderate",
          "cwe": [
            "CWE-20",
            "CWE-187"
          ],
          "cvss": {
            "score": 0,
            "vectorString": null
          },
          "range": ">=0.16.0 <2.0.10"
        }
      ],
      "effects": [],
      "range": ">=0.16.0 <2.0.10",
      "nodes": [
        "node_modules/webpack-dev-server/node_modules/http-proxy-middleware"
      ],
      "fixAvailable": true
    },
    "js-yaml": {
      "name": "js-yaml",
      "severity": "moderate",
      "isDirect": false,
      "via": [
        {
          "source": 1121859,
          "name": "js-yaml",
          "dependency": "js-yaml",
          "title": "JS-YAML: Quadratic-complexity DoS in merge key handling via repeated aliases",
          "url": "https://github.com/advisories/GHSA-h67p-54hq-rp68",
          "severity": "moderate",
          "cwe": [
            "CWE-407"
          ],
          "cvss": {
            "score": 5.3,
            "vectorString": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:L"
          },
          "range": "<3.15.0"
        }
      ],
      "effects": [],
      "range": "<3.15.0",
      "nodes": [
        "node_modules/babel-jest/node_modules/babel-plugin-istanbul/node_modules/@istanbuljs/load-nyc-config/node_modules/js-yaml",
        "node_modules/jest/node_modules/@jest/core/node_modules/@jest/transform/node_modules/babel-plugin-istanbul/node_modules/@istanbuljs/load-nyc-config/node_modules/js-yaml",
        "node_modules/jest/node_modules/jest-cli/node_modules/jest-config/node_modules/jest-circus/node_modules/jest-runtime/node_modules/@jest/transform/node_modules/babel-plugin-istanbul/node_modules/@istanbuljs/load-nyc-config/node_modules/js-yaml",
        "node_modules/jest/node_modules/jest-cli/node_modules/jest-config/node_modules/jest-circus/node_modules/jest-snapshot/node_modules/@jest/transform/node_modules/babel-plugin-istanbul/node_modules/@istanbuljs/load-nyc-config/node_modules/js-yaml",
        "node_modules/jest/node_modules/jest-cli/node_modules/jest-config/node_modules/jest-runner/node_modules/@jest/transform/node_modules/babel-plugin-istanbul/node_modules/@istanbuljs/load-nyc-config/node_modules/js-yaml"
      ],
      "fixAvailable": true
    },
    "sockjs": {
      "name": "sockjs",
      "severity": "moderate",
      "isDirect": false,
      "via": [
        "uuid"
      ],
      "effects": [
        "webpack-dev-server"
      ],
      "range": ">=0.3.17",
      "nodes": [
        "node_modules/webpack-dev-server/node_modules/sockjs"
      ],
      "fixAvailable": {
        "name": "webpack-dev-server",
        "version": "6.0.0",
        "isSemVerMajor": true
      }
    },
    "uuid": {
      "name": "uuid",
      "severity": "moderate",
      "isDirect": false,
      "via": [
        {
          "source": 1119441,
          "name": "uuid",
          "dependency": "uuid",
          "title": "uuid: Missing buffer bounds check in v3/v5/v6 when buf is provided",
          "url": "https://github.com/advisories/GHSA-w5hq-g745-h8pq",
          "severity": "moderate",
          "cwe": [
            "CWE-787",
            "CWE-1285"
          ],
          "cvss": {
            "score": 7.5,
            "vectorString": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:H/A:N"
          },
          "range": "<11.1.1"
        }
      ],
      "effects": [
        "sockjs"
      ],
      "range": "<11.1.1",
      "nodes": [
        "node_modules/webpack-dev-server/node_modules/sockjs/node_modules/uuid"
      ],
      "fixAvailable": {
        "name": "webpack-dev-server",
        "version": "6.0.0",
        "isSemVerMajor": true
      }
    },
    "webpack-dev-server": {
      "name": "webpack-dev-server",
      "severity": "moderate",
      "isDirect": true,
      "via": [
        "sockjs"
      ],
      "effects": [],
      "range": "2.0.0-beta - 5.2.6",
      "nodes": [
        "node_modules/webpack-dev-server"
      ],
      "fixAvailable": {
        "name": "webpack-dev-server",
        "version": "6.0.0",
        "isSemVerMajor": true
      }
    }
  },
  "metadata": {
    "vulnerabilities": {
      "info": 0,
      "low": 1,
      "moderate": 5,
      "high": 0,
      "critical": 0,
      "total": 6
    },
    "dependencies": {
      "prod": 95,
      "dev": 3898,
      "optional": 125,
      "peer": 0,
      "peerOptional": 0,
      "total": 3992
    }
  }
}
```

Короткий обзор уязвимостей (из `audit.json`):
- Всего уязвимостей: 6 (1 low, 5 moderate).
- `esbuild`: low — доступен фикс (обновление до 0.28.1+) — рекомендуется обновить.
- `http-proxy-middleware`: moderate — транзитивная зависимость через `webpack-dev-server` (fix available).
- `js-yaml`: moderate — затрагивает несколько мест в цепочке jest/babel — fix available.
- `sockjs`/`uuid`/`webpack-dev-server`: moderate — некоторые фиксы требуют мажорного обновления `webpack-dev-server` до 6.0.0.

Рекомендация: сначала применить патчевые/минорные обновления и обновить `esbuild` до безопасной версии; затем целенаправленно обновить `webpack-dev-server` и `webpack-cli` после обсуждения рисков (мажорные изменения).

Пошаговый рабочий процесс

1) Автоматические минорные/патчевые обновления
- Запустите: `npm update`
- Прогон тестов и сборки:

```bash
npm ci
npm run test
npm run build:frontend
npm run build:backend
```
- Если всё успешно — закоммитьте изменения (`package-lock.json` и, при изменениях, `package.json`).

2) Целевые обновления ключевых пакетов (пример: `glob`)
- Для каждого критичного пакета:
  - Посмотрите журнал изменений (changelog) и совместимость.
  - Установите конкретную безопасную версию: `npm install glob@^10.5.0 --save-exact` (пример).
  - Запустите тесты и сборку (см. выше).
  - Если что-то сломалось — откатите версию или создайте PR с обсуждением изменений.

3) Мажорные обновления
- Делайте в отдельной ветке и отдельном PR. В PR указывайте возможные breaking changes и шаги тестирования.
- По возможности разбейте мажорные апдейты на несколько PR по связанным пакетам.

4) Обработка уязвимостей
- `npm audit fix` — пробный шаг; если он предлагает безопасные обновления, примените и протестируйте.
- Для уязвимостей, требующих мажорного апдейта, создайте отдельный PR и опишите риски и план в PR.

5) Использование `patch-package`
- Если после обновления возникает проблема, и её исправление пока не принято upstream, сместите правку в `node_modules`, выполните `npx patch-package <package>` и зафиксируйте файл внутри `patches/`.
- Обновите `patches/README.md` с пояснением причины патча.

Тестирование
- Unit-тесты: `npm run test` (фронтенд + бэкенд).
- TypeScript check: `npm run ts:check` и `npm run ts:check:unit`.
- Сборка фронтенда: `npm run build:frontend`.
- Сборка и запуск в docker-compose (локально):

```bash
docker compose -f docker/docker-compose.dev.yml -f docker/docker-compose.e2e.yml up --abort-on-container-exit --exit-code-from cypress --build backend static-frontend cypress
```

Мониторинг и CI
- Убедитесь, что CI (GitHub Actions) прогоняет те же тесты: unit, сборки и e2e (если настроено).
- Для каждого PR убедитесь, что все проверки CI проходят.

Откат и восстановление
- Откатить последний коммит: `git revert <commit>` или `git checkout -- package.json package-lock.json` затем заново установить старые версии.
- Если в PR обнаружились регрессии — закройте PR и откатите изменения, создайте issue с деталями.

Приоритеты обновления (рекомендация)
1. Патчи/миноры для всех пакетов (`npm update`).
2. Критичные security-fixes (из `npm audit`) — если безопасно, примените `npm audit fix` и протестируйте.
3. Пакеты с множеством предупреждений в терминале (например, `glob`) — обновлять по одному, читать changelog и тестировать.
4. Мажорные обновления — только после оценки рисков.

Пример последовательности для `glob` (пример):
1. Создать ветку: `git checkout -b DEP_UPDATES/glob-10.5`
2. Установить: `npm install glob@10.5.0 --save-exact`
3. Прогнать: `npm ci && npm run test && npm run build:frontend && npm run build:backend`
4. Если всё OK — закоммитить и открыть PR с описанием изменений.

Рекомендации по PR и описанию
- В заголовке PR указывайте: `chore(deps): upgrade <package> to <version>`.
- В описании указывайте: зачем, тесты, возможные риски, инструкции для проверяющих.
- Привязывайте CI-артефакты (coverage, сборка) к PR.

Дополнительно
- Для массовых проверок используйте `npm outdated --json` и экспорт результатов в artefact в CI, чтобы увидеть список пакетов, требующих внимания.
- Ведите журнал изменений в таргетной задаче в GitHub Issues (например, `.github/ISSUES/DEPENDENCY_UPDATES.md`).

Если хотите, могу:
- выполнить `npm outdated --json` и `npm audit --json` сейчас и добавить результаты в эту инструкцию;
- подготовить первый PR — например, для `glob` или для пакетной минорной обновы; мы будем действовать по шагам и тестировать после каждого изменения.

*** Конец инструкции
