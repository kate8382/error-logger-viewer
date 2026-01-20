import { el, setChildren } from 'redom';
import type { ErrorItem, PeriodStats } from './types/errors';
import { request } from './utils/request';
import { qs, qsa, createElement } from './utils/dom';
import { t, getLabel, onLangChange } from './utils/i18n';
import { typeColors, statusColors } from './utils/colors';
import { showCenterSpinner, hideCenterSpinner } from './utils/loading';

// Типы и интерфейсы, получающие и возвращающие функции статистики
export type DoughnutData = { percents: number[], counts: number[] };
export type GetStatsFn = () => Array<[string, number]>;
export type GetPercentsFn = () => number[];

export interface RenderSectionOptions {
  chartId: string;
  listId: string;
  getStats: GetStatsFn;
  getPercents: GetPercentsFn;
  colors: readonly string[];
  btnPercentId: string;
  btnCountId: string;
  // eslint-disable-next-line no-unused-vars
  doughnutMethod?: (_view: 'percent' | 'count') => void;
}

export class StatsManager {
  // eslint-disable-next-line prettier/prettier, no-unused-vars
  constructor(public errors: ErrorItem[] = []) {
    // Подписка на смену языка для автоматического обновления статистики
    onLangChange(() => {
      this.renderErrorCards();
    });
  }

  // Загружает статистику по периодам с сервера, типизировано как `PeriodStats`
  async fetchPeriodStats(by: string = 'day'): Promise<PeriodStats> {
    try {
      const url = `/errors/stats?by=${encodeURIComponent(by)}`;
      const res = await request<PeriodStats>(url);
      return (res ?? {}) as PeriodStats;
    } catch (e) {
      // В случае ошибки логируем и возвращаем пустой объект

      console.error('[StatsManager] fetchPeriodStats error', e);
      return {} as PeriodStats;
    }
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
    const typeStats: Record<string, number> = {};
    this.errors
      .filter((e) => e.status !== 'deleted')
      .forEach((e) => {
        const type = e.type || 'Unknown';
        typeStats[type] = (typeStats[type] || 0) + 1;
      });
    return Object.entries(typeStats) as Array<[string, number]>;
  }

  // Статистика по статусам ошибок: [['new', 10], ...]
  get statusStats() {
    const statusStats: Record<string, number> = {};
    this.errors
      .filter((e) => e.status !== 'deleted')
      .forEach((e) => {
        const status = e.status || 'new';
        statusStats[status] = (statusStats[status] || 0) + 1;
      });
    return Object.entries(statusStats) as Array<[string, number]>;
  }

  // Универсальный метод для расчёта процентов по статистике
  getPercentStats(getStatsMethod: () => Array<[string, number]>): number[] {
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
    // распределяем оставшиеся проценты
    for (let i = 0; i < Math.min(remainder, remainders.length); i++) {
      const idx = remainders[i].idx;
      if (typeof percents[idx] === 'number') percents[idx]++;
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
  renderDoughnut({ chartId, stats, colors, view = 'percent' }: { chartId: string, stats: { percents: number[], counts: number[] }, colors: readonly string[], view?: 'percent' | 'count' }) {
    const canvasWrapper = qs<HTMLElement>(`#${chartId}`);
    if (!canvasWrapper) return;
    canvasWrapper.innerHTML = '';
    const parentWidth = canvasWrapper.offsetWidth || 385;
    const canvas = createElement('canvas') as HTMLCanvasElement;
    canvas.width = parentWidth;
    canvas.height = 130;
    canvasWrapper.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const data = view === 'percent' ? stats.percents : stats.counts;
    if (!data.length) return;
    const cx = canvas.width / 2;
    const cy = canvas.height * 0.98;
    // Радиус с учётом отступов
    let r = Math.min(canvas.width, canvas.height * 2) / 2 - 16;
    r = Math.max(0, r);
    const thickness = 20;
    const startAngle = Math.PI;
    const total = data.reduce((sum, v) => sum + v, 0);
    if (!total) return;
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
  // eslint-disable-next-line no-unused-vars
  renderStatCards(listElem: HTMLElement, stats: Array<[string, number]>, getValue: (idx: number, value: number) => string | number, valueClass: string, colors: readonly string[], isStatus = false) {
    listElem.innerHTML = '';
    stats.forEach(([item, value], idx) => {
      const itemLabel = (isStatus ? t(item) : getLabel(item)) ?? item;
      const color = colors[idx % colors.length];
      const li = el('li', { className: 'stat__card flex' });
      const colorBox = el('span', { className: 'stat__color-box', style: `background:${color}` });
      setChildren(li, [colorBox, el('span', { className: valueClass }, getValue(idx, value)), el('span', { className: 'stat__title' }, itemLabel)]);
      listElem.appendChild(li);
    });
  }

  // создание карточек ошибок
  async renderErrorCards(): Promise<void> {
    // Общие суммы (без спиннера)
    const total = qs<HTMLDivElement>('#totalErrors');
    if (total) total.textContent = String(this.totalCount);
    const today = qs<HTMLDivElement>('#errorsPerDay');
    if (today) today.textContent = String(this.todayCount);

    // Параллельная загрузка для обеих групп
    const _typeCanvas = qs<HTMLDivElement>('.stats__group-content > #statsChartType');
    const groupTypeContent = _typeCanvas && _typeCanvas.parentElement instanceof HTMLElement ? _typeCanvas.parentElement : null;
    const _statusCanvas = qs<HTMLDivElement>('.stats__group-content > #statsChartStatus');
    const groupStatusContent = _statusCanvas && _statusCanvas.parentElement instanceof HTMLElement ? _statusCanvas.parentElement : null;

    if (groupTypeContent) showCenterSpinner(groupTypeContent, 'page');
    if (groupStatusContent) showCenterSpinner(groupStatusContent, 'page');

    // helper для создания метода рендера бублика с замыканием
    const makeDoughnut = (getPercentsFn: () => number[], getCountsFn: () => number[], chartIdLocal: string, colorsLocal: readonly string[]) => (view: 'percent' | 'count') => {
      const stats = {
        percents: getPercentsFn(),
        counts: getCountsFn(),
      };
      this.renderDoughnut({ chartId: chartIdLocal, stats, colors: colorsLocal, view });
    };

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
            doughnutMethod: makeDoughnut(() => this.typePercentStats, () => this.typeStats.map(([, c]) => c), 'statsChartType', typeColors),
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
            doughnutMethod: makeDoughnut(() => this.statusPercentStats, () => this.statusStats.map(([, c]) => c), 'statsChartStatus', statusColors),
          });
          hideCenterSpinner(groupStatusContent);
        }
      })(),
    ]);

    // Динамическое выравнивание высоты .stats__group
    setTimeout(() => {
      const groups = qsa<HTMLElement>('.stats__group');
      if (groups.length < 2) return;
      // Сброс высоты перед измерением
      groups.forEach((g) => (g.style.height = 'auto'));
      const maxHeight = Math.max(...groups.map((g) => g.offsetHeight));
      groups.forEach((g) => (g.style.height = maxHeight + 'px'));
    }, 0);
  }
  // Универсальный рендер секции статистики (тип/статус)
  renderSection({ chartId, listId, getStats, getPercents, colors, btnPercentId, btnCountId, doughnutMethod }: RenderSectionOptions) {
    const chartElem = qs<HTMLElement>(`#${chartId}`);
    const listElem = qs<HTMLElement>(`#${listId}`);
    if (!chartElem || !listElem) return;

    // Защита: если getStats/getPercents не функция — не рендерим
    if (typeof getStats !== 'function' || typeof getPercents !== 'function') {
      console.error('[StatsManager] getStats/getPercents не функция:', getStats, getPercents);
      return;
    }

    const percentStats = getPercents.call(this) as number[];
    const statsArr = getStats.call(this) as Array<[string, number]>;
    // Определяем, что это секция статусов, если listId содержит 'Status'
    const isStatus = !!(listId && listId.toLowerCase().includes('status'));
    this.renderStatCards(listElem, statsArr, (idx) => `${percentStats[idx]} %`, 'stat__value', colors, isStatus);
    if (typeof doughnutMethod === 'function') {
      doughnutMethod('percent');
    }

    // Обработчики кнопок
    const btnPercent = qs<HTMLButtonElement>(`#${btnPercentId}`);
    const btnCount = qs<HTMLButtonElement>(`#${btnCountId}`);
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
