Short recommendations for E2E tests (Cypress)

1) Intercept network requests explicitly
- Use route matcher object or RegExp in `cy.intercept({ method: 'GET', url: /\/errors(\?|$)/ }, ...)`.
- Assign aliases via `.as('alias')` and wait with `cy.wait('@alias')` before asserting the DOM.

2) Avoid assertions on translated text
- Texts may change due to i18n. Prefer selectors by `id`, `class` or stable `data-*` attributes.

3) Help asynchronous rendering
- If an element is created asynchronously (dynamic import, modal), wait for the specific element with an increased timeout, e.g. `cy.get('#deleteErrorButton', { timeout: 20000 }).should('exist')`.

4) Common helper commands
- `cy.openSettings()` and `cy.openSettingsGroup(group)` - use them to open sidebar settings and specific groups.
- `cy.waitForTable({ timeout = 20000 })` — waits for the table body `#errorTableBody` to exist. Use before asserting rows.
- `cy.getFirstRow()` — returns the first `tr` inside `#errorTableBody` as a Cypress chainable.
- `cy.clickSettingsOption(group, value, opts = { force:false })` — opens settings, opens the named group and clicks the option with `data-value`.

Examples:

```js
// wait for table and assert there are 2 rows
cy.waitForTable();
cy.get('#errorTableBody tr').should('have.length', 2);

// get first row and check first cell contains an id
cy.getFirstRow().find('td').first().should('not.be.empty');

// change language to English (data-value="en") without forcing click
cy.clickSettingsOption('language', 'en');

// change theme and force the click if submenu is animated
cy.clickSettingsOption('theme', 'dark', { force: true });
```

5) Available fixtures
- `fixtures/errors.json` — base errors
- `fixtures/errors_sorted_count_asc.json` — errors sorted by count asc

---

Краткие рекомендации для E2E тестов (Cypress)

1) Перехватывайте сетевые запросы явно
- Используйте объект routeMatcher или RegExp в `cy.intercept({ method: 'GET', url: /\/errors(\?|$)/ }, ...)`.
- Присваивайте алиасы через `.as('alias')` и ждите `cy.wait('@alias')` перед ассертом на DOM.

2) Избегайте проверки по переводу
- Тексты могут меняться в зависимости от i18n. Проверяйте селекторы по `id`, `class` или `data-*` атрибутам.

3) Помогите синхронности элементов
- Если элемент создаётся асинхронно (dynamic import, модалки), ждите конкретного элемента с увеличенным таймаутом, напр.: `cy.get('#deleteErrorButton', { timeout: 20000 }).should('exist')`.

4) Общие helper команды
- `cy.openSettings()` и `cy.openSettingsGroup(group)` - используется для открытия выпадающих списков (подсписков).
- `cy.waitForTable({ timeout = 20000 })` - ожидает появления тела таблицы `#errorTableBody`. Используйте перед утверждением строк.
- `cy.getFirstRow()` - возвращает первый `tr` внутри `#errorTableBody` как цепочку Cypress.
- `cy.clickSettingsOption(group, value, opts = { force:false })` - открывает настройки, открывает именованную группу и выбирает опцию со значением `data-value`.

Примеры:

```js
// ждет таблицу и подтверждает, что есть 2 строки
cy.waitForTable();
cy.get('#errorTableBody tr').should('have.length', 2);

// получает первую строку и проверяет, содержит ли первая ячейка id
cy.getFirstRow().find('td').first().should('not.be.empty');

// изменить язык на английский (data-value="en") без принудительного нажатия
cy.clickSettingsOption('language', 'en');

// изменить тему и принудительно щелкнуть, если подменю анимировано
cy.clickSettingsOption('theme', 'dark', { force: true });
```

5) Какие фикстуры есть
- `fixtures/errors.json` — базовый набор ошибок
- `fixtures/errors_sorted_count_asc.json` — данные, отсортированные по count (asc)
