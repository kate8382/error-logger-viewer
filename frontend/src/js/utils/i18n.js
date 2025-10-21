// Централизованный модуль i18n для управления языком и переводами
export const translations = {
  en: {
    // Main
    createTestErrorBtn: 'Create test error',
    createTestErrorBtn_aria: 'Create a test error for checking dates',
    testErrorMsg: 'Test error for checking dates',
    testErrorCreated: 'Test error created! Please refresh the table.',
    // Header
    loading: 'Loading...',
    headerBurgerAria: 'Open menu',
    title: 'Error Logger & Viewer',
    titleAria: 'Open project on GitHub',
    placeholder: 'Search by application...',
    ariaInput: 'Search by application',
    ariaInputBtn: 'Button search',
    placeholderTable: 'Search in table...',
    ariaInputTable: 'Search in table',
    // Sidebar
    logoFigmaAria: 'Open original logo design in Figma',
    logoFigmaTitle: 'Open original logo design in Figma',
    ariaSidebar: 'Sidebar navigation',
    // About
    navAbout: 'About',
    aboutClose: 'Close about section',
    aboutText_en: `
     <button class="about-btn-close" id="aboutCloseBtn" data-i18n-aria-label="aboutClose">
          <svg class="about-btn-close-icon" width="12" height="18" viewBox="0 0 12 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g clip-path="url(#clip0_1456_12087)">
              <path
                d="M11.2945 5.29448C11.7339 4.85503 11.7339 4.14136 11.2945 3.7019C10.855 3.26245 10.1413 3.26245 9.70189 3.7019L5.99994 7.40737L2.29447 3.70542C1.85501 3.26597 1.14134 3.26597 0.701889 3.70542C0.262436 4.14487 0.262436 4.85854 0.701889 5.298L4.40736 8.99995L0.705405 12.7054C0.265952 13.1449 0.265952 13.8585 0.705405 14.298C1.14486 14.7375 1.85853 14.7375 2.29798 14.298L5.99994 10.5925L9.70541 14.2945C10.1449 14.7339 10.8585 14.7339 11.298 14.2945C11.7374 13.855 11.7374 13.1414 11.298 12.7019L7.59251 8.99995L11.2945 5.29448Z"
                fill="currentColor" />
            </g>
            <defs>
              <clipPath id="clip0_1456_12087">
                <rect width="11.25" height="18" fill="white" transform="translate(0.374939)" />
              </clipPath>
            </defs>
          </svg>
        </button>
      <h2 class="about-title">About Error Logger &amp;&nbsp;Viewer</h2>
      <p class="about-description"><span class="about-description-highlight">Error Logger &amp;&nbsp;Viewer</span> is&nbsp;a&nbsp;modern SPA for collecting, storing, analyzing, and visualizing JavaScript errors in&nbsp;web projects. It&nbsp;is&nbsp;designed for developers and teams who need to&nbsp;quickly identify, group, and track errors in&nbsp;production or&nbsp;test environments.</p>
      <ul class="about-features flex">
        <li class="about-feature">Automatic error collection (JS, resource loading, unhandled promises, fetch errors)</li>
        <li class="about-feature">Server or&nbsp;local storage (demo mode)</li>
        <li class="about-feature">Statistics and charts by&nbsp;type, status, date</li>
        <li class="about-feature">Filtering, sorting, commenting</li>
        <li class="about-feature">Status tracking (new, in&nbsp;progress, fixed, ignored)</li>
        <li class="about-feature">English and Russian&nbsp;UI</li>
      </ul>
      <h3 class="about-subtitle">How to&nbsp;use</h3>
      <ol class="about-steps">
        <li class="about-step">Install and run backend and frontend</li>
        <li class="about-step">Errors are collected automatically</li>
        <li class="about-step">Navigate via sidebar, use search and filters</li>
        <li class="about-step">Edit, comment, and change error status in&nbsp;the table</li>
        <li class="about-step">Analyze statistics and charts</li>
      </ol>
      <h3 class="about-subtitle">Architecture</h3>
      <ul class="about-features flex">
        <li class="about-feature"><span class="about-feature-bold">Frontend:</span> pure JS&nbsp;SPA, modular structure</li>
        <li class="about-feature"><span class="about-feature-bold">Backend:</span> Node.js + Express + LowDB</li>
        <li class="about-feature">REST API, i18n, theming, error grouping</li>
      </ul>
      <p class="about-text">See the full documentation in&nbsp;the <a class="about-link" href="https://github.com/kate8382/error-logger-viewer" target="_blank">README</a>.</p>
    `,
    navStats: 'Error Statistics',
    navCharts: 'Error Charts',
    navErrors: 'Error Table',
    sidebarDropdown: 'Settings',
    sidebarDropdownAria: 'Open settings',
    sidebarDropdownMode: 'Mode',
    sidebarDropdownModeAria: 'Open mode list',
    sidebarDropdownServer: 'Server',
    sidebarDropdownServerAria: 'Select server mode',
    sidebarDropdownDemo: 'Demo',
    sidebarDropdownDemoAria: 'Select demo mode',
    sidebarDropdownTheme: 'Theme',
    sidebarDropdownThemeAria: 'Open theme list',
    sidebarDropdownLight: 'Light',
    sidebarDropdownLightAria: 'Enable light theme',
    sidebarDropdownDark: 'Dark',
    sidebarDropdownDarkAria: 'Enable dark theme',
    sidebarDropdownLanguage: 'Language',
    sidebarDropdownLanguageAria: 'Open language list',
    sidebarDropdownEn: 'English',
    sidebarDropdownEnAria: 'Select English',
    sidebarDropdownRu: 'Russian',
    sidebarDropdownRuAria: 'Select Russian',
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
    noChartData: 'No data for chart',
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
    // Dynamic import/load errors
    moduleLoadFailed: 'Failed to load UI module. Please reload the page.',
  },
  ru: {
    // Main
    createTestErrorBtn: 'Создать тестовую ошибку',
    createTestErrorBtn_aria: 'Создать тестовую ошибку для проверки дат',
    testErrorMsg: 'Тестовая ошибка для проверки дат',
    testErrorCreated: 'Тестовая ошибка создана! Обновите таблицу.',
    // Header
    loading: 'Загрузка...',
    headerBurgerAria: 'Открыть меню',
    title: 'Error Logger & Viewer',
    titleAria: 'Открыть проект на GitHub',
    placeholder: 'Поиск по приложению...',
    ariaInput: 'Поиск ошибок',
    ariaInputBtn: 'Кнопка поиска',
    placeholderTable: 'Поиск в таблице...',
    ariaInputTable: 'Поиск в таблице',
    // Sidebar
    logoFigmaAria: 'Открыть оригинальный макет логотипа в Figma',
    logoFigmaTitle: 'Открыть оригинальный макет логотипа в Figma',
    ariaSidebar: 'Навигация по сайдбару',
    // About
    navAbout: 'О программе',
    aboutClose: 'Закрыть раздел о программе',
    aboutText_ru: `
     <button class="about-btn-close" id="aboutCloseBtn" data-i18n-aria-label="aboutClose">
          <svg class="about-btn-close-icon" width="12" height="18" viewBox="0 0 12 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g clip-path="url(#clip0_1456_12087)">
              <path
                d="M11.2945 5.29448C11.7339 4.85503 11.7339 4.14136 11.2945 3.7019C10.855 3.26245 10.1413 3.26245 9.70189 3.7019L5.99994 7.40737L2.29447 3.70542C1.85501 3.26597 1.14134 3.26597 0.701889 3.70542C0.262436 4.14487 0.262436 4.85854 0.701889 5.298L4.40736 8.99995L0.705405 12.7054C0.265952 13.1449 0.265952 13.8585 0.705405 14.298C1.14486 14.7375 1.85853 14.7375 2.29798 14.298L5.99994 10.5925L9.70541 14.2945C10.1449 14.7339 10.8585 14.7339 11.298 14.2945C11.7374 13.855 11.7374 13.1414 11.298 12.7019L7.59251 8.99995L11.2945 5.29448Z"
                fill="currentColor" />
            </g>
            <defs>
              <clipPath id="clip0_1456_12087">
                <rect width="11.25" height="18" fill="white" transform="translate(0.374939)" />
              </clipPath>
            </defs>
          </svg>
        </button>
      <h2 class="about-title">О&nbsp;приложении Error Logger &amp;&nbsp;Viewer</h2>
      <p class="about-description"><span class="about-description-highlight">Error Logger &amp;&nbsp;Viewer</span>&nbsp;&mdash; это современное SPA-приложение для сбора, хранения, анализа и&nbsp;визуализации ошибок JavaScript в&nbsp;веб-проектах. Оно предназначено для разработчиков и&nbsp;команд, которым важно быстро выявлять, группировать и&nbsp;отслеживать ошибки на&nbsp;продакшене или в&nbsp;тестовой среде.</p>
      <ul class="about-features">
        <li class="about-feature">Автоматический сбор ошибок (JS, загрузка ресурсов, необработанные промисы, fetch)</li>
        <li class="about-feature">Серверное или локальное хранилище (демо-режим)</li>
        <li class="about-feature">Статистика и&nbsp;графики по&nbsp;типу, статусу, дате</li>
        <li class="about-feature">Фильтрация, сортировка, комментирование</li>
        <li class="about-feature">Отслеживание статуса (новая, в&nbsp;работе, исправлена, игнорируется)</li>
        <li class="about-feature">Интерфейс на&nbsp;русском и&nbsp;английском языках</li>
      </ul>
      <h3 class="about-subtitle">Как пользоваться</h3>
      <ol class="about-steps">
        <li class="about-step">Установите и&nbsp;запустите backend и&nbsp;frontend</li>
        <li class="about-step">Ошибки собираются автоматически</li>
        <li class="about-step">Навигация через сайдбар, используйте поиск и&nbsp;фильтры</li>
        <li class="about-step">Редактируйте, комментируйте и&nbsp;меняйте статус ошибок в&nbsp;таблице</li>
        <li class="about-step">Анализируйте статистику и&nbsp;графики</li>
      </ol>
      <h3 class="about-subtitle">Архитектура</h3>
      <ul class="about-features">
        <li class="about-feature"><span class="about-feature-bold">Frontend:</span> чистый JS&nbsp;SPA, модульная структура</li>
        <li class="about-feature"><span class="about-feature-bold">Backend:</span> Node.js + Express + LowDB</li>
        <li class="about-feature">REST API, i18n, темы, группировка ошибок</li>
      </ul>
      <p class="about-text">Полную документацию смотри в&nbsp;<a class="about-link" href="https://github.com/kate8382/error-logger-viewer" target="_blank">README</a>.</p>
    `,
    navStats: 'Статистика ошибок',
    navCharts: 'Графики ошибок',
    navErrors: 'Таблица ошибок',
    sidebarDropdown: 'Настройки',
    sidebarDropdownAria: 'Открыть настройки',
    sidebarDropdownMode: 'Режим',
    sidebarDropdownModeAria: 'Открыть список режимов',
    sidebarDropdownServer: 'Сервер',
    sidebarDropdownServerAria: 'Выбрать режим сервер',
    sidebarDropdownDemo: 'Демо-режим',
    sidebarDropdownDemoAria: 'Выбрать демо-режим',
    sidebarDropdownTheme: 'Тема',
    sidebarDropdownThemeAria: 'Открыть список тем',
    sidebarDropdownLight: 'Светлая',
    sidebarDropdownLightAria: 'Включить светлую тему',
    sidebarDropdownDark: 'Тёмная',
    sidebarDropdownDarkAria: 'Включить тёмную тему',
    sidebarDropdownLanguage: 'Язык',
    sidebarDropdownLanguageAria: 'Открыть список языков',
    sidebarDropdownEn: 'Английский',
    sidebarDropdownEnAria: 'Выбрать английский',
    sidebarDropdownRu: 'Русский',
    sidebarDropdownRuAria: 'Выбрать русский',
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
    noChartData: 'Нет данных для графика',
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
    // Ошибка загрузки динамического импорта
    moduleLoadFailed: 'Не удалось загрузить модуль интерфейса. Пожалуйста, перезагрузите страницу.',
  }
};

// Используем глобальный объект translations
// Try to restore previously selected language from localStorage, then fall back to window.app or navigator
let currentLang;
try {
  const savedLang = localStorage.getItem('lang');
  if (savedLang) {
    currentLang = savedLang;
  } else if (window.app && window.app.lang) {
    currentLang = window.app.lang;
  } else {
    currentLang = ((navigator.language || navigator.userLanguage).startsWith('en') ? 'en' : 'ru');
  }
} catch {
  // Если localStorage недоступен, используем app или navigator
  if (window.app && window.app.lang) {
    currentLang = window.app.lang;
  } else {
    currentLang = ((navigator.language || navigator.userLanguage).startsWith('en') ? 'en' : 'ru');
  }
}

let listeners = [];

export function getCurrentLang() {
  return currentLang;
}

export function setLang(lang) {
  if (lang !== currentLang) {
    currentLang = lang;
    if (window.app) window.app.lang = lang;
    listeners.forEach(fn => fn(lang));
    // Сохраняем выбор языка, как делаем для темы
    try {
      localStorage.setItem('lang', lang);
    } catch {
      // игнорируем (localStorage может быть недоступен)
    }
  }
}

export function onLangChange(fn) {
  if (typeof fn === 'function') listeners.push(fn);
}

// Получить перевод по ключу (универсально)
export function t(key, vars = {}) {
  let str = (translations?.[currentLang]?.[key]) || key;
  // Поддержка шаблонов вида "Hello, {name}!"
  Object.entries(vars).forEach(([k, v]) => {
    str = str.replace(new RegExp(`{${k}}`, 'g'), v);
  });
  return str;
}

// Получить перевод для типа/статуса ошибки (универсально)
export function getLabel(key) {
  if (!key) return key;
  const typeKey = key.startsWith('errorType_') ? key : 'errorType_' + key;
  return t(typeKey) || t(key) || key;
}

// Получить все переводы для текущего языка
export function getTranslations() {
  return (translations?.[currentLang]) || {};
}

// Экспортируем объект для удобства
const i18n = {
  getCurrentLang,
  setLang,
  onLangChange,
  t,
  getLabel,
  getTranslations
};
export default i18n;