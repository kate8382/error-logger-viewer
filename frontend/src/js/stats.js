import Chart from 'chart.js/auto';
import { el, setChildren } from 'redom';
import { translations } from './utils/i18n';
import { getCurrentLang } from './utils/lang';
import { typeColors, statusColors } from './utils/colors';
import { getLabel } from './utils/label';

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

  // Получить проценты по типам
  getTypePercentStats() {
    const stats = this.getTypeStats();
    const total = stats.reduce((sum, [, count]) => sum + count, 0);
    return stats.map(([, count]) => total ? Math.round((count / total) * 100) : 0);
  }

  // Отрисовать полу-бублик для типов
  renderTypeDoughnut(view = 'percent') {
    const canvasWrapper = document.getElementById('statsChartType');
    if (!canvasWrapper) return;
    canvasWrapper.innerHTML = '';
    const canvas = document.createElement('canvas');
    canvas.width = 180;
    canvas.height = 90;
    canvasWrapper.appendChild(canvas);
    const stats = this.getTypeStats();
    const labels = stats.map(([type]) => getLabel(type, this.lang, this.translations));
    const data = view === 'percent' ? this.getTypePercentStats() : stats.map(([, count]) => count);
    if (!labels.length) return;
    if (this.typeChart) this.typeChart.destroy();
    this.typeChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: typeColors.slice(0, labels.length),
          borderWidth: 2,
        }]
      },
      options: {
        responsive: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => `${ctx.label}: ${ctx.parsed} ${view === 'percent' ? '%' : ''}`
            }
          }
        },
        cutout: '60%',
        rotation: Math.PI,
        circumference: Math.PI,
      }
    });
  }

  // Получить проценты по статусам
  getStatusPercentStats() {
    const stats = this.getStatusStats();
    const total = stats.reduce((sum, [, count]) => sum + count, 0);
    return stats.map(([, count]) => total ? Math.round((count / total) * 100) : 0);
  }

  // Отрисовать полу-бублик для статусов
  renderStatusDoughnut(view = 'percent') {
    const canvasWrapper = document.getElementById('statsChartStatus');
    if (!canvasWrapper) return;
    canvasWrapper.innerHTML = '';
    const canvas = document.createElement('canvas');
    canvas.width = 180;
    canvas.height = 90;
    canvasWrapper.appendChild(canvas);
    const stats = this.getStatusStats();
    const labels = stats.map(([status]) => getLabel(status, this.lang, this.translations));
    const data = view === 'percent' ? this.getStatusPercentStats() : stats.map(([, count]) => count);
    if (!labels.length) return;
    if (this.statusChart) this.statusChart.destroy();
    this.statusChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: statusColors.slice(0, labels.length),
          borderWidth: 2,
        }]
      },
      options: {
        responsive: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => `${ctx.label}: ${ctx.parsed} ${view === 'percent' ? '%' : ''}`
            }
          }
        },
        cutout: '60%',
        rotation: Math.PI,
        circumference: Math.PI,
      }
    });
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
      this.getTypeStats().forEach(([type,], idx) => {
        const typeLabel = getLabel(type, this.lang, this.translations);
        const color = typeColors[idx % typeColors.length];
        const li = el('li', { className: 'stat__card flex' });
        const colorBox = el('span', { className: 'stat__color-box', style: `background:${color}` });
        // По умолчанию показываем процент
        const percent = this.getTypePercentStats()[idx];
        setChildren(li, [
          colorBox,
          el('span', { className: 'stat__title' }, typeLabel),
          el('span', { className: 'stat__value stat__value--type' }, `${percent} %`)
        ]);
        typeList.appendChild(li);
      });
      this.renderTypeDoughnut('percent');
      // Обработчики кнопок
      const btnPercent = document.getElementById('btnStatsTypePercent');
      const btnCount = document.getElementById('btnStatsTypeCount');
      if (btnPercent) btnPercent.onclick = () => {
        this.renderErrorCards();
      };
      if (btnCount) btnCount.onclick = () => {
        // Перерисовать карточки с числами
        typeList.innerHTML = '';
        this.getTypeStats().forEach(([type, count], idx) => {
          const typeLabel = getLabel(type, this.lang, this.translations);
          const color = typeColors[idx % typeColors.length];
          const li = el('li', { className: 'stat__card flex' });
          const colorBox = el('span', { className: 'stat__color-box', style: `background:${color}` });
          setChildren(li, [
            colorBox,
            el('span', { className: 'stat__title' }, typeLabel),
            el('span', { className: 'stat__value stat__value--type' }, count)
          ]);
          typeList.appendChild(li);
        });
        this.renderTypeDoughnut('count');
      };
    }
    const typeChart = document.getElementById('statsChartType');
    if (typeChart) {
      const typeStats = this.getTypeStats();
      const typeLabels = typeStats.map(([type]) => getLabel(type, this.lang, this.translations));
      const typeData = typeStats.map(([, count]) => count);
      // this.renderChart(typeChart, typeLabels, typeData, typeColors); // удалено, чтобы не было ошибки
    }

    // Карточки по статусам
    const statusList = document.getElementById('statsStatusList');
    if (statusList) {
      statusList.innerHTML = '';
      this.getStatusStats().forEach(([status,], idx) => {
        const statusLabel = getLabel(status, this.lang, this.translations);
        const color = statusColors[idx % statusColors.length];
        const li = el('li', { className: 'stat__card flex' });
        const percent = this.getStatusPercentStats()[idx];
        const colorBox = el('span', { className: 'stat__color-box', style: `background:${color}` });
        setChildren(li, [
          colorBox,
          el('span', { className: 'stat__title' }, statusLabel),
          el('span', { className: 'stat__value stat__value--status' }, `${percent} %`)
        ]);
        statusList.appendChild(li);
      });
      this.renderStatusDoughnut('percent');

      // Обработчики кнопок
      const btnPercent = document.getElementById('btnStatsStatusPercent');
      const btnCount = document.getElementById('btnStatsStatusCount');
      if (btnPercent) btnPercent.onclick = () => {
        this.renderErrorCards();
      };
      if (btnCount) btnCount.onclick = () => {
        // Перерисовать карточки с числами
        statusList.innerHTML = '';
        this.getStatusStats().forEach(([status, count], idx) => {
          const statusLabel = getLabel(status, this.lang, this.translations);
          const color = statusColors[idx % statusColors.length];
          const li = el('li', { className: 'stat__card flex' });
          const colorBox = el('span', { className: 'stat__color-box', style: `background:${color}` });
          setChildren(li, [
            colorBox,
            el('span', { className: 'stat__title' }, statusLabel),
            el('span', { className: 'stat__value stat__value--status' }, count)
          ]);
          statusList.appendChild(li);
        });
        this.renderStatusDoughnut('count');
      };
    }
  }
}