export const translations = {
  en: {
    loading: 'Loading...',
    title: 'Error Logger & Viewer',
    placeholder: 'Search by application...',
    ariaInput: 'Search by application',
    ariaInputBtn: 'Button search',
    placeholderTable: 'Search in table...',
    ariaInputTable: 'Search in table',
    // Sidebar
    sidebarLogo: 'Logo',
    ariaSidebar: 'Sidebar navigation',
    navAbout: 'About',
    navStats: 'Error Statistics',
    navCharts: 'Error Charts',
    navErrors: 'Error Table',
    sidebarDropdown: 'Settings',
    sidebarDropdownTheme: 'Theme',
    sidebarDropdownLight: 'Light',
    sidebarDropdownDark: 'Dark',
    sidebarDropdownLanguage: 'Language',
    sidebarDropdownEn: 'English',
    sidebarDropdownRu: 'Russian',
    sidebarDropdownMode: 'Mode',
    sidebarDropdownServer: 'Server',
    sidebarDropdownDemo: 'Demo',
    sidebarDropdownArrow: 'Open',
    // Statistics
    statsTitle: 'Error Statistics',
    statsTotal: 'Total Errors: ',
    statsErrorsPerDay: 'Errors per day: ',
    statsTypeTitle: 'Error Types',
    statsStatusTitle: 'Error Statuses',
    ariaStatsBtnPercent: 'Show percentage',
    ariaStatsBtnCount: 'Show count',
    // Charts
    chartTitle: 'Error Chart',
    statsPeriodWeek: 'Week',
    ariaChartWeek: 'Week',
    statsPeriodMonth: 'Month',
    ariaChartMonth: 'Month',
    statsPeriodYear: 'Year',
    ariaChartYear: 'Year',
    // Error Table
    errorTableTitle: 'Table of Errors',
    tableId: 'ID',
    ariaId: 'Sort by ID',
    tableType: 'Type of Error',
    ariaType: 'Sort by Type',
    errorType_TestError: 'Test Error',
    errorType_FetchError: 'Fetch Error',
    errorType_ResourceLoadError: 'Resource Load Error',
    errorType_UnhandledPromiseRejection: 'Unhandled Promise',
    errorType_ReferenceError: 'ReferenceError',
    errorType_Error: 'JavaScript Error',
    errorType_SyntaxError: 'Syntax Error',
    errorType_TypeError: 'Type Error',
    errorType_RangeError: 'Range Error',
    errorType_EvalError: 'Eval Error',
    errorType_URIError: 'URI Error',
    tableCount: 'Count',
    tableFirstSeen: 'First Seen',
    tableLastSeen: 'Last Seen',
    tableStatus: 'Status',
    ariaStatus: 'Sort by Status',
    tableComment: 'Comment',
    tableActions: 'Actions',
    tableEditBtn: 'Edit',
    tableDeleteBtn: 'Delete',
    // Modal window
    modalTitle: 'Error Details',
    modalClose: 'Close',
    modalField_type: 'Type of Error',
    modalField_id: 'Error ID',
    modalField_date: 'Date',
    modalField_count: 'Repeat count',
    modalField_users: 'Users',
    modalField_firstSeen: 'First seen',
    modalField_lastSeen: 'Last seen',
    modalField_status: 'Status',
    new: 'New',
    in_progress: 'In progress',
    fixed: 'Fixed',
    ignored: 'Ignored',
    modalField_comment: 'Comment',
    modalField_source: 'Source',
    modalField_stack: 'Stack',
    modalField_message: 'Message',
    modalCloseBtn: 'Close',
    modalSaveBtn: 'Save',
    modalDeleteTitle: 'Delete Error',
    modalDeleteMessage: 'Are you sure you want to delete this error?',
    modalCancelBtn: 'Cancel',
    modalDeleteBtn: 'Delete',

    aboutText_en: `
      <h2 class="about-title">About Error Logger & Viewer</h2>
      <p class="about-description">Error Logger & Viewer is a modern SPA for collecting, storing, analyzing, and visualizing JavaScript errors in web projects. It is designed for developers and teams who need to quickly identify, group, and track errors in production or test environments.</p>
      <ul class="about-features">
        <li class="about-feature">Automatic error collection (JS, resource loading, unhandled promises, fetch errors)</li>
        <li class="about-feature">Server or local storage (demo mode)</li>
        <li class="about-feature">Statistics and charts by type, status, date</li>
        <li class="about-feature">Filtering, sorting, commenting</li>
        <li class="about-feature">Status tracking (new, in progress, fixed, ignored)</li>
        <li class="about-feature">English and Russian UI</li>
      </ul>
      <h3 class="about-subtitle">How to use</h3>
      <ol class="about-steps">
        <li class="about-step">Install and run backend and frontend</li>
        <li class="about-step">Errors are collected automatically</li>
        <li class="about-step">Navigate via sidebar, use search and filters</li>
        <li class="about-step">Edit, comment, and change error status in the table</li>
        <li class="about-step">Analyze statistics and charts</li>
      </ol>
      <h3 class="about-subtitle">Architecture</h3>
      <ul class="about-features">
        <li class="about-feature">Frontend: pure JS SPA, modular structure</li>
        <li class="about-feature">Backend: Node.js + Express + LowDB</li>
        <li class="about-feature">REST API, i18n, theming, error grouping</li>
      </ul>
      <p class="about-text">See the full documentation in the <a href="https://github.com/kate8382/error-logger-viewer" target="_blank">README</a>.</p>
    `,

  },

  ru: {
    loading: 'Загрузка...',
    title: 'Error Logger & Viewer',
    placeholder: 'Поиск по приложению...',
    ariaInput: 'Поиск ошибок',
    ariaInputBtn: 'Кнопка поиска',
    placeholderTable: 'Поиск в таблице...',
    ariaInputTable: 'Поиск в таблице',
    // Sidebar
    sidebarLogo: 'Логотип',
    ariaSidebar: 'Навигация по сайдбару',
    navAbout: 'О программе',
    navStats: 'Статистика ошибок',
    navCharts: 'Графики ошибок',
    navErrors: 'Таблица ошибок',
    sidebarDropdown: 'Настройки',
    sidebarDropdownTheme: 'Тема',
    sidebarDropdownLight: 'Светлая',
    sidebarDropdownDark: 'Тёмная',
    sidebarDropdownLanguage: 'Язык',
    sidebarDropdownEn: 'Английский',
    sidebarDropdownRu: 'Русский',
    sidebarDropdownMode: 'Режим',
    sidebarDropdownServer: 'Сервер',
    sidebarDropdownDemo: 'Демо-режим',
    sidebarDropdownArrow: 'Открыть',
    // Статистика
    statsTitle: 'Статистика ошибок',
    statsTotal: 'Всего ошибок: ',
    statsErrorsPerDay: 'Ошибок за день: ',
    statsTypeTitle: 'Типы ошибок',
    statsStatusTitle: 'Статусы ошибок',
    ariaStatsBtnPercent: 'Показать в процентах',
    ariaStatsBtnCount: 'Показать в числах',
    // Графики
    chartTitle: 'График ошибок',
    statsPeriodWeek: 'Неделя',
    ariaChartWeek: 'Неделя',
    statsPeriodMonth: 'Месяц',
    ariaChartMonth: 'Месяц',
    statsPeriodYear: 'Год',
    ariaChartYear: 'Год',
    // Таблица ошибок
    errorTableTitle: 'Таблица ошибок',
    tableId: 'ID',
    ariaId: 'Сортировка по ID',
    tableType: 'Тип ошибки',
    ariaType: 'Сортировка по типу ошибки',
    errorType_TestError: 'Тестовая ошибка',
    errorType_FetchError: 'Ошибка запроса',
    errorType_ResourceLoadError: 'Ошибка загрузки ресурса',
    errorType_UnhandledPromiseRejection: 'Необработанный Promise',
    errorType_ReferenceError: 'Переменная не определена',
    errorType_Error: 'Ошибка JavaScript',
    errorType_SyntaxError: 'Синтаксическая ошибка',
    errorType_TypeError: 'Ошибка типа',
    errorType_RangeError: 'Ошибка диапазона',
    errorType_EvalError: 'Ошибка eval',
    errorType_URIError: 'Ошибка URI',
    tableCount: 'Кол-во',
    tableFirstSeen: 'Дата создания',
    tableLastSeen: 'Дата изменения',
    tableStatus: 'Статус',
    ariaStatus: 'Сортировка по статусу',
    tableComment: 'Комментарий',
    tableActions: 'Действия',
    tableEditBtn: 'Изменить',
    tableDeleteBtn: 'Удалить',
    // Модальное окно
    modalTitle: 'Детали ошибки',
    modalClose: 'Закрыть',
    modalField_type: 'Тип ошибки',
    modalField_id: 'ID ошибки',
    modalField_date: 'Дата',
    modalField_count: 'Количество повторов',
    modalField_users: 'Пользователи',
    modalField_firstSeen: 'Дата создания',
    modalField_lastSeen: 'Дата изменения',
    modalField_status: 'Статус',
    new: 'Новая',
    in_progress: 'В работе',
    fixed: 'Исправлено',
    ignored: 'Игнорировать',
    duplicate: 'Дубликат ошибки',
    modalField_comment: 'Комментарий',
    modalField_source: 'Источник',
    modalField_stack: 'Стек',
    modalField_message: 'Сообщение',
    modalCloseBtn: 'Закрыть',
    modalSaveBtn: 'Сохранить',
    modalDeleteTitle: 'Удалить ошибку',
    modalDeleteMessage: 'Вы уверены, что хотите удалить эту ошибку?',
    modalCancelBtn: 'Отмена',
    modalDeleteBtn: 'Удалить',

    aboutText_ru: `
      <h2 class="about-title">О приложении Error Logger & Viewer</h2>
      <p class="about-description">Error Logger & Viewer — это современное SPA-приложение для сбора, хранения, анализа и визуализации ошибок JavaScript в веб-проектах. Оно предназначено для разработчиков и команд, которым важно быстро выявлять, группировать и отслеживать ошибки на продакшене или в тестовой среде.</p>
      <ul class="about-features">
        <li class="about-feature">Автоматический сбор ошибок (JS, загрузка ресурсов, необработанные промисы, fetch)</li>
        <li class="about-feature">Серверное или локальное хранилище (демо-режим)</li>
        <li class="about-feature">Статистика и графики по типу, статусу, дате</li>
        <li class="about-feature">Фильтрация, сортировка, комментирование</li>
        <li class="about-feature">Отслеживание статуса (новая, в работе, исправлена, игнорируется)</li>
        <li class="about-feature">Интерфейс на русском и английском языках</li>
      </ul>
      <h3 class="about-subtitle">Как пользоваться</h3>
      <ol class="about-steps">
        <li class="about-step">Установите и запустите backend и frontend</li>
        <li class="about-step">Ошибки собираются автоматически</li>
        <li class="about-step">Навигируйте через сайдбар, используйте поиск и фильтры</li>
        <li class="about-step">Редактируйте, комментируйте и меняйте статус ошибок в таблице</li>
        <li class="about-step">Анализируйте статистику и графики</li>
      </ol>
      <h3 class="about-subtitle">Архитектура</h3>
      <ul class="about-architecture">
        <li class="about-architecture-item">Frontend: чистый JS SPA, модульная структура</li>
        <li class="about-architecture-item">Backend: Node.js + Express + LowDB</li>
        <li class="about-architecture-item">REST API, i18n, темы, группировка ошибок</li>
      </ul>
      <p class="about-text">Полная документация — в <a href="https://github.com/kate8382/error-logger-viewer" target="_blank">README</a>.</p>
    `,

  }
};