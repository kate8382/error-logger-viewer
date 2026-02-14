 # Backend — TypeScript migration guide

Этот документ описывает пошагово, что и как делать для безопасной миграции `backend/server.js` на TypeScript. Цель — получить типизированный код, сохранить текущий поведенческий контракт API и иметь удобные dev/CI-скрипты.

Короткая последовательность
1. Создать ветку `feat/backend-migrate-to-ts` [x].
2. Добавить `backend/src/server.ts` (scaffold) — пока оставить `backend/server.js` как fallback [x].
3. Добавить `backend/tsconfig.json` и скрипты `build:backend`, `dev:backend` в `package.json` [x].
4. Добавить минимальные интерфейсы типов (`ErrorRecord`, `Project`, `DBSchema`, `User`) [x].
5. Прогнать `npm run ts:check` и фиксить ошибки по мере появления [x].
6. Добавить базовые интеграционные smoke-tests (Jest + supertest) [ ].
7. Скомпилировать `backend/dist` и переключить `start:backend` на `node backend/dist/server.js` [ ].
8. Удалить/архивировать старый `server.js` после верификации в CI [ ].

Подробные шаги

1) Подготовка ветки
- Убедитесь, что вы в ветке `feat/backend-migrate-to-ts`:

```powershell
git checkout feat/backend-migrate-to-ts
git pull origin feat/backend-migrate-to-ts
```

2) Scaffold — скопировать текущий сервер в `src/` и сделать минимальную TS-версию
- Создайте папку `backend/src` и добавьте `server.ts` как копию `server.js`.
- В `server.ts` выполните минимальные правки:
  - поменяйте расширение файлов и при необходимости приведите `import`/`export` к TS-совместимому синтаксису (в проекте уже используется ESM).
  - временно используйте `any` там, где типы пока неизвестны — позже уточним.

3) Добавить `backend/tsconfig.json`
- Пример содержимого (`target` / `module` под ESM):

```json
{
  "extends": "../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "src",
    "composite": false,
    "module": "ES2020",
    "target": "ES2020",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"]
}
```

4) Обновить скрипты (root `package.json`)
- Добавьте или обновите скрипты:

```powershell
"build:backend": "tsc -p backend/tsconfig.json",
"dev:backend": "ts-node-dev --respawn --transpile-only backend/src/server.ts",
"start:backend": "node backend/dist/server.js"
```

5) Определить базовые типы
- Создайте `backend/src/types.ts` с интерфейсами, например:

```ts
export interface ErrorRecord {
  id: string;
  projectId: string;
  type?: string;
  message: string;
  stack?: string;
  status?: string;
  comment?: string;
  count?: number;
  firstSeen?: string;
  lastSeen?: string;
  users?: string[];
}

export interface Project {
  id: string;
  name: string;
  owner: string;
  members?: string[];
  apiKey?: string;
}

export interface DBSchema {
  errors: ErrorRecord[];
  projects: Project[];
}
```

6) Подключите LowDB с точной типизацией
- В `server.ts` объявите `db: Low<DBSchema>` и приводите `db.data` к `DBSchema` после чтения.

7) Прогон типов и исправление
- Запустите проверки типов и исправляйте ошибки по мере появления:

```powershell
npm run ts:check
```

8) Добавить тесты (smoke / integration)
- До переключения на `dist` стоит иметь базовый набор тестов, которые поднимают Express app (без listen) и проверяют ключевые эндпойнты.
- Используйте `jest` + `supertest`. Пример структуры:

```
tests/api/
  errors.spec.ts   # GET /errors, POST /errors
  projects.spec.ts # POST /projects, GET /projects
```

Пример команды для запуска backend-тестов:

```powershell
npm run test:backend
```

9) Сборка и переключение start script
- Скомпилируйте в `backend/dist` и запустите продакшн-старт локально:

```powershell
npm run build:backend
node backend/dist/server.js
```

10) CI и финализация
- Обновите CI (если используется) чтобы шаг `ts:check` и `build:backend` выполнялись до `test:e2e`.
- Когда CI проходит — переключите `start:backend` в основном `package.json` (если нужно) и удалите старый `server.js` в отдельном коммите или оставьте как backup до полной проверки.

Проверки и отладка
- В процессе разработки удобно использовать `dev:backend` (ts-node-dev) чтобы не собирать вручную.
- Логи: добавьте подробные сообщения в точках чтения/записи БД и в коде разрешения проекта.

Риски и рекомендации
- Риск: мелкие поведенческие различия при изменении импорта/экспорта — покрывайте тестами.
- Рекомендация: делать миграцию малыми шагами, коммитить и тестировать часто.
