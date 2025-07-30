import 'core-js/stable';
import 'regenerator-runtime/runtime';
import '../assets/scss/style.scss';
import { translations } from './i18n';

const userLang = navigator.language || navigator.userLanguage;
const lang = userLang.startsWith('ru') ? 'ru' : 'en';

// Обработчик события для переключения языка
document.addEventListener('DOMContentLoaded', () => {
  translatePage(lang);

  const langButtons = document.querySelectorAll('.lang-btn');
  langButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const selectedLang = button.id === 'lang-en' ? 'en' : 'ru';
      translatePage(selectedLang);
    });
  });

  // Dropdown logic
  const dropdown = document.getElementById('sidebarDropdown');
  const dropdownBtn = dropdown.querySelector('.sidebar__dropdown-btn');
  const dropdownList = dropdown.querySelector('.sidebar__dropdown-list');
  const groupBtns = dropdown.querySelectorAll('.sidebar__dropdown-group-btn');
  const sublists = dropdown.querySelectorAll('.sidebar__dropdown-sublist');
  const options = dropdown.querySelectorAll('.sidebar__dropdown-option');

  // Открытие/закрытие основного dropdown
  dropdownBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('open');
    // Закрыть все подгруппы при открытии
    dropdown.querySelectorAll('.sidebar__dropdown-group').forEach(g => g.classList.remove('open'));
  });

  // Открытие/закрытие подгрупп
  groupBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const group = btn.closest('.sidebar__dropdown-group');
      // Скрыть другие группы
      dropdown.querySelectorAll('.sidebar__dropdown-group').forEach(g => {
        if (g !== group) g.classList.remove('open');
      });
      group.classList.toggle('open');
    });
  });

  // Выбор опции
  options.forEach(option => {
    option.addEventListener('click', (e) => {
      e.stopPropagation();
      // Снять выделение со всех опций
      options.forEach(o => o.classList.remove('selected'));
      option.classList.add('selected');
      // Действия по выбору
      const value = option.dataset.value;
      const group = option.closest('.sidebar__dropdown-sublist').dataset.group;
      if (group === 'language') {
        translatePage(value);
      }
      // Можно добавить обработку theme/sort
      // Закрыть dropdown
      dropdown.classList.remove('open');
      dropdown.querySelectorAll('.sidebar__dropdown-group').forEach(g => g.classList.remove('open'));
    });
  });

  // Закрытие dropdown при клике вне
  document.addEventListener('click', (e) => {
    if (!dropdown.contains(e.target)) {
      dropdown.classList.remove('open');
      dropdown.querySelectorAll('.sidebar__dropdown-group').forEach(g => g.classList.remove('open'));
    }
  });
});

// Функция для перевода страницы
function translatePage(lang) {
  // Переводим только текст внутри .sidebar__item-text, не затрагивая иконки и пробелы
  const sidebarTexts = document.querySelectorAll('.sidebar__item-text[data-i18n]');
  sidebarTexts.forEach((element) => {
    const key = element.getAttribute('data-i18n');
    let replaced = false;
    element.childNodes.forEach(node => {
      if (!replaced && node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== '') {
        node.textContent = translations[lang][key] || key;
        replaced = true;
      }
    });
    // Если не найден текстовый узел, fallback
    if (!replaced) {
      element.textContent = translations[lang][key] || key;
    }
  });

  // Переводим dropdown-btn: ищем .sidebar__item-text внутри кнопки и меняем только её текст
  const dropdownBtns = document.querySelectorAll('.sidebar__dropdown-btn[data-i18n]');
  dropdownBtns.forEach((btn) => {
    const key = btn.getAttribute('data-i18n');
    const textEl = btn.querySelector('.sidebar__item-text');
    if (textEl) {
      textEl.textContent = translations[lang][key] || key;
    }
  });

  // Переводим dropdown-опции: меняем только текстовый узел, не затрагивая иконки/SVG
  const dropdownOptions = document.querySelectorAll('.sidebar__dropdown-option[data-i18n]');
  dropdownOptions.forEach((el) => {
    const key = el.getAttribute('data-i18n');
    let replaced = false;
    el.childNodes.forEach(node => {
      if (!replaced && node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== '') {
        node.textContent = translations[lang][key] || key;
        replaced = true;
      }
    });
    // Если не найден текстовый узел, fallback
    if (!replaced) {
      el.textContent = translations[lang][key] || key;
    }
  });

  // Переводим только текст внутри .sidebar__dropdown-group-text, не затрагивая SVG
  const groupTexts = document.querySelectorAll('.sidebar__dropdown-group-text[data-i18n]');
  groupTexts.forEach((span) => {
    const key = span.getAttribute('data-i18n');
    span.textContent = translations[lang][key] || key;
  });

  // Переводим остальные элементы внутри dropdown (например, sublist), кроме option, btn и group-text
  const dropdownElements = document.querySelectorAll('.sidebar__dropdown [data-i18n]:not(.sidebar__dropdown-btn):not(.sidebar__dropdown-option):not(.sidebar__dropdown-group-text)');
  dropdownElements.forEach((el) => {
    const key = el.getAttribute('data-i18n');
    let replaced = false;
    el.childNodes.forEach(node => {
      if (!replaced && node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== '') {
        node.textContent = translations[lang][key] || key;
        replaced = true;
      }
    });
    if (!replaced) {
      el.textContent = translations[lang][key] || key;
    }
  });

  // Остальные элементы с data-i18n, кроме sidebar__item-text и dropdown
  const otherElements = Array.from(document.querySelectorAll('[data-i18n]')).filter(
    el => !el.classList.contains('sidebar__item-text') && !el.closest('.sidebar__dropdown')
  );
  otherElements.forEach((element) => {
    const key = element.getAttribute('data-i18n');
    const span = element.querySelector('span');
    if (span) {
      span.textContent = translations[lang][key] || key;
    } else {
      element.textContent = translations[lang][key] || key;
    }
  });

  // Перевод плейсхолдеров
  const placeholders = document.querySelectorAll('[data-i18n-placeholder]');
  placeholders.forEach((element) => {
    const key = element.getAttribute('data-i18n-placeholder');
    element.setAttribute('placeholder', translations[lang][key] || key);
  });

  // Перевод aria-labels
  const ariaElements = document.querySelectorAll('[data-i18n-aria-label]');
  ariaElements.forEach((el) => {
    const key = el.getAttribute('data-i18n-aria-label');
    el.setAttribute('aria-label', translations[lang][key] || key);
  });
}
