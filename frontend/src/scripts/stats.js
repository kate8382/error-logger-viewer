import { el, setChildren } from 'redom';
import { t, getLabel, onLangChange } from './utils/i18n.js';
import { typeColors, statusColors } from './utils/colors.js';
import { showCenterSpinner, hideCenterSpinner } from './utils/loading.js';

export class StatsManager {
  constructor(errors = []) {
    this.errors = errors;
    // Подписка на смену языка для автоматического обновления статистики
    onLangChange(() => {
      this.renderErrorCards();
    });
  }

  // Общее количество ошибок
  get totalCount() {
    return this.errors.filter((e) => e.status !== 'deleted').length;
  }

  // Количество ошибок за сегодня, за исключением deleted
  get todayCount() {
    const today = new Date().toISOString().slice(0, 10);
    return this.errors
      .filter((e) => e.status !== 'deleted')
      .filter((e) => {
        const date = e.firstSeen;
        return date && date.slice(0, 10) === today;
      }).length;
  }

  // Статистика по типам ошибок: [['TypeError', 25], ...]
  get typeStats() {
    const typeStats = {};
    this.errors
      .filter((e) => e.status !== 'deleted')
      .forEach((e) => {
        const type = e.type || 'Unknown';
        typeStats[type] = (typeStats[type] || 0) + 1;
      });
    return Object.entries(typeStats);
  }

  // Статистика по статусам ошибок: [['new', 10], ...]
  get statusStats() {
    const statusStats = {};
    this.errors
      .filter((e) => e.status !== 'deleted')
      .forEach((e) => {
        const status = e.status || 'new';
        statusStats[status] = (statusStats[status] || 0) + 1;
      });
    return Object.entries(statusStats);
  }

  // Универсальный метод для расчёта процентов по статистике
  getPercentStats(getStatsMethod) {
    if (typeof getStatsMethod !== 'function') {
      console.error('[StatsManager] getPercentStats: getStatsMethod должен быть функцией, а не', getStatsMethod);
      return [];
    }
    const stats = getStatsMethod();
    const total = stats.reduce((sum, [, count]) => sum + count, 0);
    if (!total) return stats.map(() => 0);
    // Largest Remainder Method
    const rawPercents = stats.map(([, count]) => (count / total) * 100);
    const floored = rawPercents.map(Math.floor);
    let remainder = 100 - floored.reduce((a, b) => a + b, 0);
    const remainders = rawPercents.map((v, i) => ({ idx: i, frac: v - floored[i] }));
    remainders.sort((a, b) => b.frac - a.frac);
    const percents = [...floored];
    for (let i = 0; i < remainder; i++) {
      percents[remainders[i].idx]++;
    }
    return percents;
  }

  // Проценты по типам
  get typePercentStats() {
    return this.getPercentStats(() => this.typeStats);
  }

  // Проценты по статусам
  get statusPercentStats() {
    return this.getPercentStats(() => this.statusStats);
  }

  // Универсальный рендер полу-бублика
  renderDoughnut({ chartId, stats, colors, view = 'percent' }) {
    const canvasWrapper = document.getElementById(chartId);
    if (!canvasWrapper) return;
    canvasWrapper.innerHTML = '';
    const parentWidth = canvasWrapper.offsetWidth || 385;
    const canvas = document.createElement('canvas');
    canvas.width = parentWidth;
    canvas.height = 130;
    canvasWrapper.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    const data = view === 'percent' ? stats.percents : stats.counts;
    if (!data.length) return;
    const cx = canvas.width / 2;
    const cy = canvas.height * 0.98;
    const r = Math.min(canvas.width, canvas.height * 2) / 2 - 16;
    const thickness = 20;
    const startAngle = Math.PI;
    const total = data.reduce((sum, v) => sum + v, 0);
    const gap = 0.01;
    const minSegment = 0.03;
    let currentAngle = startAngle;
    data.forEach((value, i) => {
      const color = colors[i % colors.length];
      let segmentAngle = (Math.PI * value) / total - gap;
      if (segmentAngle < minSegment) segmentAngle = minSegment;
      ctx.save();
      ctx.lineWidth = thickness;
      ctx.lineCap = 'butt';
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.arc(cx, cy, r, currentAngle, currentAngle + segmentAngle, false);
      ctx.stroke();
      ctx.restore();
      currentAngle += segmentAngle + gap;
    });
  }

  // Универсальный рендер карточек для типов/статусов
  renderStatCards(listElem, stats, getValue, valueClass, colors, isStatus = false) {
    listElem.innerHTML = '';
    stats.forEach(([item, value], idx) => {
      const itemLabel = isStatus ? t(item) : getLabel(item);
      const color = colors[idx % colors.length];
      const li = el('li', { className: 'stat__card flex' });
      const colorBox = el('span', { className: 'stat__color-box', style: `background:${color}` });
      setChildren(li, [colorBox, el('span', { className: valueClass }, getValue(idx, value)), el('span', { className: 'stat__title' }, itemLabel)]);
      listElem.appendChild(li);
    });
  }

  // создание карточек ошибок
  async renderErrorCards() {
    // Общие суммы (без спиннера)
    const total = document.getElementById('totalErrors');
    if (total) total.textContent = this.totalCount;
    const today = document.getElementById('errorsPerDay');
    if (today) today.textContent = this.todayCount;

    // Параллельная загрузка для обеих групп
    const groupTypeContent = document.querySelector('.stats__group-content > #statsChartType')?.parentElement;
    const groupStatusContent = document.querySelector('.stats__group-content > #statsChartStatus')?.parentElement;

    if (groupTypeContent) showCenterSpinner(groupTypeContent, 'page');
    if (groupStatusContent) showCenterSpinner(groupStatusContent, 'page');

    await Promise.all([
      (async () => {
        if (groupTypeContent) {
          this.renderSection({
            chartId: 'statsChartType',
            listId: 'statsTypeList',
            getStats: () => this.typeStats,
            getPercents: () => this.typePercentStats,
            colors: typeColors,
            btnPercentId: 'btnStatsTypePercent',
            btnCountId: 'btnStatsTypeCount',
            doughnutMethod: (view) => {
              const stats = {
                percents: this.typePercentStats,
                counts: this.typeStats.map(([, count]) => count),
              };
              this.renderDoughnut({ chartId: 'statsChartType', stats, colors: typeColors, view });
            },
          });
          hideCenterSpinner(groupTypeContent);
        }
      })(),
      (async () => {
        if (groupStatusContent) {
          this.renderSection({
            chartId: 'statsChartStatus',
            listId: 'statsStatusList',
            getStats: () => this.statusStats,
            getPercents: () => this.statusPercentStats,
            colors: statusColors,
            btnPercentId: 'btnStatsStatusPercent',
            btnCountId: 'btnStatsStatusCount',
            doughnutMethod: (view) => {
              const stats = {
                percents: this.statusPercentStats,
                counts: this.statusStats.map(([, count]) => count),
              };
              this.renderDoughnut({ chartId: 'statsChartStatus', stats, colors: statusColors, view });
            },
          });
          hideCenterSpinner(groupStatusContent);
        }
      })(),
    ]);

    // Динамическое выравнивание высоты .stats__group
    setTimeout(() => {
      const groups = document.querySelectorAll('.stats__group');
      if (groups.length < 2) return;
      // Сброс высоты перед измерением
      groups.forEach((g) => (g.style.height = 'auto'));
      const maxHeight = Math.max(...Array.from(groups).map((g) => g.offsetHeight));
      groups.forEach((g) => (g.style.height = maxHeight + 'px'));
    }, 0);
  }
  // Универсальный рендер секции статистики (тип/статус)
  renderSection({ chartId, listId, getStats, getPercents, colors, btnPercentId, btnCountId, doughnutMethod }) {
    const chartElem = document.getElementById(chartId);
    const listElem = document.getElementById(listId);
    if (!chartElem || !listElem) return;

    // Защита: если getStats/getPercents не функция — не рендерим
    if (typeof getStats !== 'function' || typeof getPercents !== 'function') {
      console.error('[StatsManager] getStats/getPercents не функция:', getStats, getPercents);
      return;
    }

    const percentStats = getPercents.call(this);
    const statsArr = getStats.call(this);
    // Определяем, что это секция статусов, если listId содержит 'Status'
    const isStatus = listId && listId.toLowerCase().includes('status');
    this.renderStatCards(listElem, statsArr, (idx) => `${percentStats[idx]} %`, 'stat__value', colors, isStatus);
    if (typeof doughnutMethod === 'function') {
      doughnutMethod('percent');
    }

    // Обработчики кнопок
    const btnPercent = document.getElementById(btnPercentId);
    const btnCount = document.getElementById(btnCountId);
    if (btnPercent) {
      btnPercent.setAttribute('aria-label', t('ariaStatsBtnPercent'));
      btnPercent.onclick = () => {
        btnPercent.setAttribute('aria-label', t('ariaStatsBtnPercent'));
        this.renderStatCards(listElem, statsArr, (idx) => `${percentStats[idx]} %`, 'stat__value', colors, isStatus);
        if (typeof doughnutMethod === 'function') {
          doughnutMethod('percent');
        }
      };
    }
    if (btnCount) {
      btnCount.setAttribute('aria-label', t('ariaStatsBtnCount'));
      btnCount.onclick = () => {
        btnCount.setAttribute('aria-label', t('ariaStatsBtnCount'));
        this.renderStatCards(listElem, statsArr, (idx) => statsArr[idx][1], 'stat__value', colors, isStatus);
        if (typeof doughnutMethod === 'function') {
          doughnutMethod('count');
        }
      };
    }
  }
}
