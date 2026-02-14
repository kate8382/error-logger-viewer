---
title: "Error Logger Viewer — миграция на TypeScript и рабочий поток с GitHub Copilot"
published: false
tags: devchallenge, githubchallenge, cli, githubcopilot, typescript
---

Краткое описание
- Проект: Error Logger Viewer — личный инструмент для просмотра и анализа ошибок в приложении.
- Цель этого поста: описать миграцию проекта с JavaScript на TypeScript, организацию общих типов и использование GitHub Copilot для ускорения работы.

Что сделано
- Перенёс общие типы в папку `types/` и сгенерировал декларации `*.d.ts` через `tsc --emitDeclarationOnly`.
- Обновил конфигурации: добавил `tsconfig.types.json`, настроил `backend/tsconfig.json` чтобы потреблять `types/dist/*.d.ts` через `paths`.
- Исправил импорты в `backend/src` на `import type` и алиасы модулей (`projects`, `errors`), чтобы избежать ошибок TS6059.
- Обновил npm-скрипты: добавил `build:types` и сделал сборку типов предварительным шагом для сборок пакетов.

Технические детали (коротко)
- Ядро: Node.js + TypeScript
- Структура: `frontend/`, `backend/`, `types/` (единый источник типов). Декларации генерируются в `types/dist/`.
- Ключевые файлы изменений:
  - `tsconfig.types.json` — сборка деклараций
  - `package.json` — `build:types`, обновлённые `build:*` скрипты
  - `backend/tsconfig.json` — `baseUrl` + `paths` и `include` для `types/dist/**/*.d.ts`
  - `backend/src/*` — правки импортов для работы с `.d.ts`

Инструкции: как собрать и запустить
1) Собрать декларации типов:

```bash
npm run build:types
```

2) Собрать backend и frontend (в репозитории настроено, что сначала генерируются типы):

```bash
npm run build:backend
npm run build:frontend
```

3) Локально запустить backend в режиме разработки (если нужно):

```bash
npm run dev:backend
```

Демо / скриншоты
- Подложите сюда GIF или скриншоты работы: `screenshots/` или `assets/` в репозитории. Я оставил заглушку; при желании могу добавить GIF с записью сборки/tsc.

Использование GitHub Copilot и AI (атрибуция)
- Это мой личный проект, начатый еще в августе 2025, как закрепления материала по курсу JS продвинутый уровень. После, тк. на данный момент я изучаю TS решила мигрировать проект, чтобы также закрепить материал по курсу. Изначально идея, архитектура и реализация принадлежат мне. При миграции проекта с JavaScript на TypeScript я использовала GitHub Copilot и консультации AI-ассистента: они помогали с конфигурацией TypeScript, предложениями патчей и формулировкой README, ISSUE, PR; все изменения я проверяла и утверждала лично.

Как зафиксировать использование Copilot CLI (рекомендация для конкурса)
- Запишите сессию терминала командой PowerShell `Start-Transcript -Path .\copilot-log.txt` перед запуском команд Copilot CLI, затем `Stop-Transcript`.
- Сохраните `copilot-log.txt` или снимок экрана и приложите к посту как доказательство использования Copilot CLI.

Ссылки
- Исходный код (репозиторий): укажите ссылку на ваш GitHub-репозиторий.

Теги
- `devchallenge`, `githubchallenge`, `cli`, `githubcopilot`, `typescript`

Если хочешь, могу:
- добавить GIF с записью сборки и примерами команд (я могу сгенерировать локально инструкции),
- или сразу подготовить final-версию текста для вставки в форму на https://dev.to/new .

---
