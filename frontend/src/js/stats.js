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

  // Статистика по типам ошибок: [['TypeError', 25], ...]
  getTypeStats() {
    const typeStats = {};
    this.errors.filter(e => e.status !== 'fixed' && e.status !== 'deleted').forEach(e => {
      const type = e.type || 'Unknown';
      typeStats[type] = (typeStats[type] || 0) + 1;
    });
    return Object.entries(typeStats);
  }

  // Статистика по статусам ошибок: [['new', 10], ...]
  getStatusStats() {
    const statusStats = {};
    this.errors.filter(e => e.status !== 'fixed' && e.status !== 'deleted').forEach(e => {
      const status = e.status || 'new';
      statusStats[status] = (statusStats[status] || 0) + 1;
    });
    return Object.entries(statusStats);
  }

  // Общее количество ошибок
  getTotalCount() {
    return this.errors.filter(e => e.status !== 'deleted').length;
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
    // динамическая ширина canvas
    const parentWidth = canvasWrapper.offsetWidth || 385;
    const canvas = document.createElement('canvas');
    canvas.width = parentWidth;
    canvas.height = 130;
    canvasWrapper.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    const stats = this.getTypeStats();
    const labels = stats.map(([type]) => getLabel(type, this.lang, this.translations));
    const data = view === 'percent' ? this.getTypePercentStats() : stats.map(([, count]) => count);
    if (!labels.length) return;
    // параметры дуги
    const cx = canvas.width / 2;
    const cy = canvas.height * 0.98;
    const r = Math.min(canvas.width, canvas.height * 2) / 2 - 16;
    const thickness = 20;
    const startAngle = Math.PI;
    const total = data.reduce((sum, v) => sum + v, 0);
    // уменьшенный зазор между сегментами
    const gap = 0.01; // радиан (~0.5 градуса)
    const minSegment = 0.03; // минимальная длина сегмента
    let currentAngle = startAngle;
    // рисуем сегменты
    data.forEach((value, i) => {
      const color = typeColors[i % typeColors.length];
      let segmentAngle = (Math.PI * value / total) - gap;
      if (segmentAngle < minSegment) segmentAngle = minSegment;
      ctx.save();
      ctx.lineWidth = thickness;
      ctx.lineCap = 'butt'; // строгие края
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.arc(cx, cy, r, currentAngle, currentAngle + segmentAngle, false);
      ctx.stroke();
      ctx.restore();
      currentAngle += segmentAngle + gap;
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
    // динамическая ширина canvas
    const parentWidth = canvasWrapper.offsetWidth || 385;
    const canvas = document.createElement('canvas');
    canvas.width = parentWidth;
    canvas.height = 130;
    canvasWrapper.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    const stats = this.getStatusStats();
    const labels = stats.map(([status]) => getLabel(status, this.lang, this.translations));
    const data = view === 'percent' ? this.getStatusPercentStats() : stats.map(([, count]) => count);
    if (!labels.length) return;
    // параметры дуги
    const cx = canvas.width / 2;
    const cy = canvas.height * 0.98;
    const r = Math.min(canvas.width, canvas.height * 2) / 2 - 16;
    const thickness = 20;
    const startAngle = Math.PI;
    const total = data.reduce((sum, v) => sum + v, 0);
    // уменьшенный зазор между сегментами
    const gap = 0.01; // радиан (~0.5 градуса)
    const minSegment = 0.03; // минимальная длина сегмента
    let currentAngle = startAngle;
    // рисуем сегменты
    data.forEach((value, i) => {
      const color = statusColors[i % statusColors.length];
      let segmentAngle = (Math.PI * value / total) - gap;
      if (segmentAngle < minSegment) segmentAngle = minSegment;
      ctx.save();
      ctx.lineWidth = thickness;
      ctx.lineCap = 'butt'; // строгие края
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.arc(cx, cy, r, currentAngle, currentAngle + segmentAngle, false);
      ctx.stroke();
      ctx.restore();
      currentAngle += segmentAngle + gap;
    });
  }

  // Универсальный рендер карточек для типов/статусов
  renderStatCards(listElem, stats, getValue, valueClass, colors, type) {
    listElem.innerHTML = '';
    stats.forEach(([item, value], idx) => {
      const itemLabel = getLabel(item, this.lang, this.translations);
      const color = colors[idx % colors.length];
      const li = el('li', { className: 'stat__card flex' });
      const colorBox = el('span', { className: 'stat__color-box', style: `background:${color}` });
      setChildren(li, [
        colorBox,
        el('span', { className: valueClass }, getValue(idx, value)),
        el('span', { className: 'stat__title' }, itemLabel)
      ]);
      listElem.appendChild(li);
    });
  }

  // создание карточек ошибок
  renderErrorCards() {
    // Общие суммы
    const total = document.getElementById('totalErrors');
    if (total) total.textContent = this.getTotalCount();

    const today = document.getElementById('errorsPerDay');
    if (today) today.textContent = this.getTodayCount();

    // Карточки по типам
    const typeChart = document.getElementById('statsChartType');
    if (typeChart) {
      const typeStats = this.getTypeStats();
      const typeLabels = typeStats.map(([type]) => getLabel(type, this.lang, this.translations));
      const typeData = typeStats.map(([, count]) => count);
      this.renderTypeDoughnut(typeChart, typeLabels, typeData, typeColors);
    }

    const typeList = document.getElementById('statsTypeList');
    if (typeList) {
      this.renderStatCards(typeList, this.getTypeStats(), (idx, count) => `${count} %`, 'stat__value stat__value--type', typeColors, 'type');
      this.renderTypeDoughnut('percent');

      // Обработчики кнопок
      const btnPercent = document.getElementById('btnStatsTypePercent');
      const btnCount = document.getElementById('btnStatsTypeCount');
      if (btnPercent) btnPercent.onclick = () => {
        this.renderErrorCards();
        this.renderTypeDoughnut('percent');
      };
      if (btnCount) btnCount.onclick = () => {
        // Перерисовать карточки с числами
        this.renderStatCards(typeList, this.getTypeStats(), (idx, count) => count, 'stat__value stat__value--type', typeColors, 'type');
        this.renderTypeDoughnut('count');
      };
    }

    // Карточки по статусам
    const statusChart = document.getElementById('statsChartStatus');
    if (statusChart) {
      const statusStats = this.getStatusStats();
      const statusLabels = statusStats.map(([status]) => getLabel(status, this.lang, this.translations));
      const statusData = statusStats.map(([, count]) => count);
      this.renderStatusDoughnut(statusChart, statusLabels, statusData, statusColors);
    }

    const statusList = document.getElementById('statsStatusList');
    if (statusList) {
      this.renderStatCards(statusList, this.getStatusStats(), (idx, count) => `${count} %`, 'stat__value stat__value--status', statusColors, 'status');
      this.renderStatusDoughnut('percent');

      // Обработчики кнопок
      const btnPercent = document.getElementById('btnStatsStatusPercent');
      const btnCount = document.getElementById('btnStatsStatusCount');
      if (btnPercent) btnPercent.onclick = () => {
        this.renderErrorCards();
      };
      if (btnCount) btnCount.onclick = () => {
        this.renderStatCards(statusList, this.getStatusStats(), (idx, count) => count, 'stat__value stat__value--status', statusColors, 'status');
        this.renderStatusDoughnut('count');
      };
    }
  }
}