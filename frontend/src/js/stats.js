import { el, setChildren } from 'redom';
import { translations } from './utils/i18n';
import { getCurrentLang } from './utils/lang';

export class StatsManager {
  constructor(errors = []) {
    this.errors = errors;
    this.translations = translations;
    this.lang = getCurrentLang();
  }

  // Общее количество ошибок
  getTotalCount() {
    return this.errors.length;
  }

  // Количество ошибок за сегодня
  getTodayCount() {
    const today = new Date().toISOString().slice(0, 10);
    return this.errors.filter(e => e.timestamp && e.timestamp.slice(0, 10) === today).length;
  }

  // Статистика по типам ошибок: [['TypeError', 25], ...]
  getTypeStats() {
    const typeStats = {};
    this.errors.forEach(e => {
      const type = e.type || 'Unknown';
      typeStats[type] = (typeStats[type] || 0) + 1;
    });
    return Object.entries(typeStats);
  }

  // Статистика по статусам ошибок: [['new', 10], ...]
  getStatusStats() {
    const statusStats = {};
    this.errors.forEach(e => {
      const status = e.status || 'new';
      statusStats[status] = (statusStats[status] || 0) + 1;
    });
    return Object.entries(statusStats);
  }

  // создание карточек ошибок
  renderErrorCards() {
    // Общие суммы
    const total = document.getElementById('totalErrors');
    if (total) total.textContent = this.getTotalCount();

    const today = document.getElementById('errorsPerDay');
    if (today) today.textContent = this.getTodayCount();

    // Карточки по типам
    const typeList = document.getElementById('statsTypeList');
    if (typeList) {
      typeList.innerHTML = '';
      this.getTypeStats().forEach(([type, count]) => {
        const typeKey = 'errorType_' + type;
        const typeLabel = this.translations[this.lang][typeKey] || type;
        const li = el('li', { className: 'stat-card' });

        setChildren(li, [
          el('span', { className: 'stat-title' }, typeLabel),
          el('span', { className: 'stat-value' }, count)
        ]);
        typeList.appendChild(li);
      });
    }

    // Карточки по статусам
    const statusList = document.getElementById('statsStatusList');
    if (statusList) {
      statusList.innerHTML = '';
      this.getStatusStats().forEach(([status, count]) => {
        const statusLabel = this.translations[this.lang][status] || status;
        const li = el('li', { className: 'stat-card' });

        setChildren(li, [
          el('span', { className: 'stat-title' }, statusLabel),
          el('span', { className: 'stat-value' }, count)
        ]);
        statusList.appendChild(li);
      });
    }
  }
}