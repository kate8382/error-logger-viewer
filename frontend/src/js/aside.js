export class Aside {
  constructor(app) {
    this.app = app;
    this.translations = app.translations;
    this.initControls();
    this.initDropdowns();

  }

  initControls() {
    // Смена языка
    const langButtons = document.querySelectorAll('.lang-btn');
    langButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const selectedLang = button.id === 'lang-en' ? 'en' : 'ru';
        this.setLang(selectedLang);
      });
    });

    // Смена темы
    const themeOptions = document.querySelectorAll('.sidebar__dropdown-sublist[data-group="theme"] .sidebar__dropdown-option');
    themeOptions.forEach(option => {
      option.addEventListener('click', () => {
        const theme = option.dataset.value;
        this.setTheme(theme);
      });
    });

    // Смена режима работы (сервер/демо)
    const modeOptions = document.querySelectorAll('.sidebar__dropdown-sublist[data-group="mode"] .sidebar__dropdown-option');
    modeOptions.forEach(option => {
      option.addEventListener('click', () => {
        const mode = option.dataset.value;
        if (mode === 'server' || mode === 'demo') {
          this.app.errorApi.setMode(mode);
          this.app.updateErrorTable();
        }
      });
    });
  }

  // Инициализация выпадающих списков и подгрупп
  initDropdowns() {
    // Открытие/закрытие основного списка настроек
    const dropdown = document.querySelector('.sidebar__dropdown');
    const dropdownBtn = dropdown ? dropdown.querySelector('.sidebar__dropdown-btn') : null;
    if (dropdown && dropdownBtn) {
      dropdownBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('open');
      });
      // Закрытие при клике вне меню
      document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target)) {
          dropdown.classList.remove('open');
        }
      });
    }

    // Открытие/закрытие подгрупп настроек
    const groupBtns = document.querySelectorAll('.sidebar__dropdown-group-btn');
    groupBtns.forEach(btn => {
      const group = btn.closest('.sidebar__dropdown-group');
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (group) {
          group.classList.toggle('open');
        }
      });
    });
    // Закрытие подгрупп при клике вне
    document.addEventListener('click', (e) => {
      groupBtns.forEach(btn => {
        const group = btn.closest('.sidebar__dropdown-group');
        if (group && !group.contains(e.target)) {
          group.classList.remove('open');
        }
      });
    });
  }

  setLang(lang) {
    this.app.lang = lang;
    this.translatePage(lang);
    // Обновляем таблицу ошибок при смене языка
    if (window.renderErrorTable && typeof window.app !== 'undefined') {
      console.log('updateErrorTable called after lang switch');
      window.app.updateErrorTable();
    }
  }

  setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }

  translatePage(lang) {
    const translations = this.translations;
    const currentLang = lang || this.app.lang;
    const sidebarTexts = document.querySelectorAll('.sidebar__item-text[data-i18n]');
    sidebarTexts.forEach((element) => {
      const key = element.getAttribute('data-i18n');
      let replaced = false;
      element.childNodes.forEach(node => {
        if (!replaced && node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== '') {
          node.textContent = translations[currentLang][key] || key;
          replaced = true;
        }
      });
      if (!replaced) {
        element.textContent = translations[currentLang][key] || key;
      }
    });

    const dropdownBtns = document.querySelectorAll('.sidebar__dropdown-btn[data-i18n]');
    dropdownBtns.forEach((btn) => {
      const key = btn.getAttribute('data-i18n');
      const textEl = btn.querySelector('.sidebar__item-text');
      if (textEl) {
        textEl.textContent = translations[currentLang][key] || key;
      }
    });

    const dropdownOptions = document.querySelectorAll('.sidebar__dropdown-option[data-i18n]');
    dropdownOptions.forEach((el) => {
      const key = el.getAttribute('data-i18n');
      let replaced = false;
      el.childNodes.forEach(node => {
        if (!replaced && node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== '') {
          node.textContent = translations[currentLang][key] || key;
          replaced = true;
        }
      });
      if (!replaced) {
        el.textContent = translations[currentLang][key] || key;
      }
    });

    const groupTexts = document.querySelectorAll('.sidebar__dropdown-group-text[data-i18n]');
    groupTexts.forEach((span) => {
      const key = span.getAttribute('data-i18n');
      span.textContent = translations[currentLang][key] || key;
    });

    const dropdownElements = document.querySelectorAll('.sidebar__dropdown [data-i18n]:not(.sidebar__dropdown-btn):not(.sidebar__dropdown-option):not(.sidebar__dropdown-group-text)');
    dropdownElements.forEach((el) => {
      const key = el.getAttribute('data-i18n');
      let replaced = false;
      el.childNodes.forEach(node => {
        if (!replaced && node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== '') {
          node.textContent = translations[currentLang][key] || key;
          replaced = true;
        }
      });
      if (!replaced) {
        el.textContent = translations[currentLang][key] || key;
      }
    });

    const otherElements = Array.from(document.querySelectorAll('[data-i18n]')).filter(
      el => !el.classList.contains('sidebar__item-text') && !el.closest('.sidebar__dropdown')
    );
    otherElements.forEach((element) => {
      const key = element.getAttribute('data-i18n');
      const span = element.querySelector('span');
      if (span) {
        span.textContent = translations[currentLang][key] || key;
      } else {
        element.textContent = translations[currentLang][key] || key;
      }
    });

    const placeholders = document.querySelectorAll('[data-i18n-placeholder]');
    placeholders.forEach((element) => {
      const key = element.getAttribute('data-i18n-placeholder');
      element.setAttribute('placeholder', translations[currentLang][key] || key);
    });

    const ariaElements = document.querySelectorAll('[data-i18n-aria-label]');
    ariaElements.forEach((el) => {
      const key = el.getAttribute('data-i18n-aria-label');
      el.setAttribute('aria-label', translations[currentLang][key] || key);
    });
  }
}
// Модуль управления боковой панелью (aside)
export function initAsideControls(app) {
  // Смена языка
  const langButtons = document.querySelectorAll('.lang-btn');
  langButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const selectedLang = button.id === 'lang-en' ? 'en' : 'ru';
      app.lang = selectedLang;
      app.translatePage(selectedLang);
    });
  });

  // Смена темы
  const themeOptions = document.querySelectorAll('.sidebar__dropdown-sublist[data-group="theme"] .sidebar__dropdown-option');
  themeOptions.forEach(option => {
    option.addEventListener('click', () => {
      const theme = option.dataset.value;
      app.setTheme(theme);
    });
  });

  // Смена режима работы (сервер/демо)
  const modeOptions = document.querySelectorAll('.sidebar__dropdown-sublist[data-group="mode"] .sidebar__dropdown-option');
  modeOptions.forEach(option => {
    option.addEventListener('click', () => {
      const mode = option.dataset.value;
      if (mode === 'server' || mode === 'demo') {
        app.errorApi.setMode(mode);
        app.updateErrorTable();
      }
    });
  });
}
