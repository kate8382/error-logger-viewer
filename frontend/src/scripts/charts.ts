import Chart from 'chart.js/auto';
import type { Chart as ChartJS } from 'chart.js'; // Импортируем тип ChartJS для аннотаций типов
import { API_BASE_URL } from './api';
import type { ErrorItem, Stats, PeriodStats } from './types/errors';
import { request } from './utils/request';
import { qs, delegate } from './utils/dom';
import { t, getLabel, onLangChange, setLang } from './utils/i18n';
import { typeColors, statusColors } from './utils/colors';
import { showCenterSpinner, hideCenterSpinner } from './utils/loading';

// Тип для подготовленных данных графика
type PreparedChartData = {
  labels: string[],
  datasets: Array<{
    label: string,
    data: number[],
    backgroundColor?: string[] | string,
    borderWidth: number,
    borderRadius: number,
    barPercentage: number,
    categoryPercentage: number,
    stack: string,
  }>,
  maxY: number,
  stepSize: number,
};

export default class ChartManager {
  errors: ErrorItem[] = [];
  canvas: HTMLCanvasElement | null = null;
  chart: ChartJS | null = null;
  baseUrl: string;
  currentType: 'day' | 'week' | 'month' | 'year' | 'date';
  isRendering: boolean = false;

  constructor() {
    this.canvas = qs<HTMLCanvasElement>('#chartCanvas') as HTMLCanvasElement | null;
    this.baseUrl = API_BASE_URL;
    // Язык теперь всегда берём через getCurrentLang()
    this.chart = null;
    // Всегда отображаем график по дням при загрузке страницы
    this.currentType = 'day';
    // Если был сохранён тип в localStorage — игнорируем его
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('chartType');
    }
    this.initFilterHandlers();
    this.renderChart();
    this.initLangHandlers();

    // Подписка на смену языка для автоматического обновления графика и aria-label
    onLangChange(() => {
      this.renderChart();
      this.updateAriaLabels();
    });

    // Подписка на resize для динамического изменения размера шрифта
    window.addEventListener('resize', () => this.updateFontSize());
  }

  // Форматирует дату для оси X по дням: короткий или длинный год
  formatDayLabel(dateStr: string): string {
    const d = new Date(dateStr);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear().toString();
    // Если ширина экрана <= desktop, сокращаем год
    if (window.innerWidth <= 1140) {
      return `${day}.${month}.${year.slice(-2)}`;
    } else {
      return `${day}.${month}.${year}`;
    }
  }

  // Возвращает размер шрифта для графика в зависимости от ширины экрана
  getResponsiveFontSize() {
    if (window.innerWidth <= 480) return 8;
    if (window.innerWidth <= 768) return 10;
    if (window.innerWidth <= 1140) return 11;
    return 12;
  }

  // Обновляет размер шрифта на графике и перерисовывает его
  updateFontSize() {
    if (!this.chart || !this.chart.options) return;

    const fontSize = this.getResponsiveFontSize();

    // Обновляем шрифт легенды если она присутствует
    const legendLabels = (this.chart.options.plugins && this.chart.options.plugins.legend && this.chart.options.plugins.legend.labels) as any | undefined;
    if (legendLabels) {
      const currentFont = legendLabels.font;
      if (typeof currentFont === 'function') {
        legendLabels.font = { size: fontSize } as any;
      } else {
        legendLabels.font = { ...(currentFont as any), size: fontSize } as any;
      }
    }

    // Обновляем шрифты для подписей осей X/Y если они доступны
    const xTicks = (this.chart.options.scales && (this.chart.options.scales as any).x && (this.chart.options.scales as any).x.ticks) as any | undefined;
    const yTicks = (this.chart.options.scales && (this.chart.options.scales as any).y && (this.chart.options.scales as any).y.ticks) as any | undefined;
    if (xTicks) xTicks.font = { ...((xTicks.font as any) || {}), size: fontSize } as any;
    if (yTicks) yTicks.font = { ...((yTicks.font as any) || {}), size: fontSize } as any;

    // Если график по дням — перерисовываем полностью, чтобы обновить формат дат
    if (this.currentType === 'day' || this.currentType === 'date') {
      this.renderChart();
    } else {
      this.chart.update();
    }
  }

  // Форматируем даты
  getPeriodKey(dateStr: string, by: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (by === 'day') return d.toISOString().slice(0, 10);
    if (by === 'week') {
      const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
      const dayNum = date.getUTCDay() || 7;
      date.setUTCDate(date.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
      const weekNum = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
      return `${date.getUTCFullYear()}-W${weekNum.toString().padStart(2, '0')}`;
    }
    if (by === 'month') return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    if (by === 'year') return d.getFullYear().toString();
    return '';
  }

  // Обновляем размер шагов на оси Y в зависимости от maxY
  getStepSize(maxY: number): number {
    if (maxY <= 10) return 2;
    if (maxY <= 50) return 10;
    if (maxY <= 100) return 20;
    if (maxY <= 200) return 50;
    if (maxY <= 1000) return 100;
    return Math.ceil(maxY / 10);
  }

  // Округляет максимальное значение до "красивого" числа для отображения на оси
  getNiceMax(val: number): number {
    if (val <= 10) return 10;
    if (val <= 50) return Math.ceil(val / 10) * 10;
    if (val <= 100) return Math.ceil(val / 20) * 20;
    if (val <= 200) return Math.ceil(val / 50) * 50;
    if (val <= 1000) return Math.ceil(val / 100) * 100;
    const pow10 = Math.pow(10, Math.floor(Math.log10(val)));
    return Math.ceil(val / pow10) * pow10;
  }

  // Безопасное чтение значения из PeriodStats
  safeValue(map: PeriodStats | undefined, period: string, key: string): number {
    if (!map) return 0;
    const p = map[period];
    if (!p) return 0;
    const v = p[key];
    return typeof v === 'number' ? v : 0;
  }

  async renderChart() {
    if (this.isRendering) return;
    this.isRendering = true;
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }

    // Защита: если canvas отсутствует — прекращаем рендеринг
    if (!this.canvas) {
      this.isRendering = false;
      return;
    }

    const canvasWrapper = this.canvas.parentElement; // Родительский элемент canvas для спиннера
    // Показываем спиннер загрузки
    if (canvasWrapper) {
      showCenterSpinner(canvasWrapper, 'page');
    }

    // BAR CHART по датам, неделям, месяцам, годам
    if (['day', 'date', 'week', 'month', 'year'].includes(this.currentType)) {
      // Определяем параметр для запроса
      let byParam = 'day';
      if (this.currentType === 'week') byParam = 'week';
      if (this.currentType === 'month') byParam = 'month';
      if (this.currentType === 'year') byParam = 'year';

      // Проверяем режим приложения
      const mode = window.app?.errorApi?.mode || 'server';
      let statsType: PeriodStats = {};
      let statsStatus: PeriodStats = {};
      if (mode === 'demo') {
        // Данные из localStorage
        let errors: ErrorItem[] = [];
        try {
          errors = JSON.parse(localStorage.getItem('errorsLocal') || '[]');
          // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
        } catch (e) {
          errors = [];
        }
        statsType = {};
        statsStatus = {};
        errors.forEach((e: ErrorItem) => {
          const key = this.getPeriodKey(e.lastSeen ?? e.firstSeen ?? '', byParam);
          if (!key) return;
          const type = e.type || 'Unknown';
          if (!statsType[key]) statsType[key] = {};
          statsType[key][type] = (statsType[key][type] ?? 0) + Number(e.count ?? 1);
          const status = e.status || 'new';
          if (!statsStatus[key]) statsStatus[key] = {};
          statsStatus[key][status] = (statsStatus[key][status] ?? 0) + Number(e.count ?? 1);
        });
      } else {
        // Получаем статистику по выбранному периоду и типам
        // request<T> возвращает уже распарсенный JSON (Stats), поэтому ожидаем результат напрямую
        try {
          const resType = await request<PeriodStats>(`${API_BASE_URL}/errors/stats?by=${byParam}&group=type`);
          statsType = resType || {};
          const resStatus = await request<PeriodStats>(`${API_BASE_URL}/errors/stats?by=${byParam}&group=status`);
          statsStatus = resStatus || {};
          // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
        } catch (e) {
          // В случае ошибки — оставляем пустые данные
          statsType = {};
          statsStatus = {};
        }
      }

      // Универсальная подготовка данных для графика (labels, datasets, стили)
      const { labels, datasets, maxY, stepSize } = this.prepareBarChartData(statsType, statsStatus, byParam, this.currentType);

      try {
        if (!labels.length || !datasets.length) {
          // Если нет данных для графика
          const ctx = this.canvas.getContext('2d');
          if (ctx) ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
          const titleEl = this.canvas.parentElement?.querySelector('.chart__title') as HTMLElement | null;
          if (titleEl) titleEl.textContent = t('noChartData');
        } else {
          // Есть данные — рендерим график
          const titleEl = this.canvas.parentElement?.querySelector('.chart__title') as HTMLElement | null;
          if (titleEl) titleEl.textContent = t('chartTitle');
          // Используем precomputed maxY и stepSize из prepareBarChartData
          this.chart = new Chart(this.canvas, {
            type: 'bar',
            data: {
              labels,
              datasets,
            },
            options: {
              responsive: true,
              plugins: {
                legend: {
                  // Отображать легенду
                  display: false,
                  position: 'top', // Положение легенды
                  labels: {
                    boxWidth: 12, // Ширина бокса
                    padding: 20,
                  },
                },
                tooltip: {
                  callbacks: {
                    label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y}`, // ctx - контекст, где ctx.dataset.label - отвечает за название набора данных (label), а ctx.parsed.y - за значение по оси Y
                  },
                },
              },
              // Паддинги
              layout: {
                padding: {
                  left: 30,
                  right: 30,
                  top: 30,
                  bottom: 30,
                },
              },
              scales: {
                x: {
                  stacked: true,
                  grid: {
                    display: false, // Отключаем сетку по X
                    drawOnChartArea: false, // Отключаем рисование сетки на области графика
                  },
                  ticks: {
                    display: true,
                    color: '#89868d',
                    font: { size: this.getResponsiveFontSize() },
                    padding: 5,
                    major: { enabled: false }, // Выключаем выделение крупных меток
                  },
                },
                y: {
                  stacked: true, // Стэк для баров
                  grid: {
                    drawTicks: false, // Отключаем рисование засечек
                  },
                  border: {
                    display: false, // Отключаем линию оси Y
                  },
                  min: 0,
                  suggestedMax: maxY,
                  ticks: {
                    padding: 10,
                    color: '#89868d',
                    stepSize: stepSize,
                    callback: function (value) {
                      return value;
                    },
                  },
                },
              },
            },
          });
        }
      } finally {
        // Скрываем спиннер
        if (canvasWrapper) {
          hideCenterSpinner(canvasWrapper);
        }
        this.isRendering = false;
      }
      return;
    }
  }

  /**
   * Универсальная подготовка данных для bar chart (labels, datasets, стили, форматирование)
   * Используется и для demo, и для server режима
   */
  prepareBarChartData(statsType: PeriodStats = {}, statsStatus: PeriodStats = {}, byParam: string = 'day', currentType?: ChartManager['currentType']): PreparedChartData {
    currentType = currentType ?? this.currentType;

    // Собираем все ключи периодов из типов и статусов, фильтруем только валидные
    const keysSet = new Set<string>([...Object.keys(statsType || {}), ...Object.keys(statsStatus || {})]);
    let periodKeys = Array.from(keysSet).filter((date) => {
      if (!date || typeof date !== 'string') return false;
      const typeVals = Object.values(statsType[date] || {});
      const statusVals = Object.values(statsStatus[date] || {});
      // Защита от ошибки: приводим всё к числам
      const total = [...typeVals, ...statusVals].reduce((sum, v) => {
        if (typeof v === 'number') return sum + v;
        const maybe = Number((v as any) ?? 0);
        return sum + (isNaN(maybe) ? 0 : maybe);
      }, 0);
      return total > 0;
    });

    // Сортируем ключи периодов в хронологическом порядке для корректного отображения
    try {
      if (byParam === 'day' || byParam === 'date') {
        periodKeys.sort((a, b) => Number(new Date(a)) - Number(new Date(b)));
      } else if (byParam === 'week') {
        const parseWeek = (wk: string) => {
          const m = wk.match(/(\d{4})(?:-W)?(\d{1,2})/);
          if (!m) return { y: 0, w: 0 };
          return { y: Number(m[1]), w: Number(m[2]) };
        };
        periodKeys.sort((a, b) => {
          const A = parseWeek(a);
          const B = parseWeek(b);
          return A.y === B.y ? A.w - B.w : A.y - B.y;
        });
      } else if (byParam === 'month') {
        periodKeys.sort((a, b) => Number(new Date(a + '-01')) - Number(new Date(b + '-01')));
      } else if (byParam === 'year') {
        periodKeys.sort((a, b) => Number(a) - Number(b));
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
    } catch (err) {
      // В случае любой ошибки сортировки — оставляем исходный порядок
    }

    // Защита от некорректных periodKeys
    if (!Array.isArray(periodKeys)) periodKeys = [];

    // NOTE: period limits are enforced on the server; frontend will render all received periods
    // Ограничиваем количество отображаемых периодов и настраиваем ширину баров
    let barPerc = 0.8;
    let catPerc = 0.6;
    if (currentType === 'date' || currentType === 'day') {
      barPerc = 0.8;
      catPerc = 0.6;
    }
    if (currentType === 'week') {
      barPerc = 0.7;
      catPerc = 0.5;
    }
    if (currentType === 'month') {
      barPerc = 0.6;
      catPerc = 0.4;
    }
    if (currentType === 'year') {
      barPerc = 0.5;
      catPerc = 0.3;
    }
    // Форматированные подписи для оси X
    let labels = periodKeys;
    if (currentType === 'date' || currentType === 'day') {
      labels = periodKeys.map((date) => this.formatDayLabel(date));
    }
    if (currentType === 'week') {
      // Поддержка periodKeys: '2025-W39' и '2025-39'
      labels = periodKeys.map((isoWeek) => {
        let yearStr, weekStr;
        if (/^\d{4}-W\d{2}$/.test(isoWeek)) {
          [yearStr, weekStr] = isoWeek.split('-W');
        } else if (/^\d{4}-\d{2}$/.test(isoWeek)) {
          [yearStr, weekStr] = isoWeek.split('-');
        } else {
          return isoWeek;
        }
        const year = parseInt(yearStr, 10);
        const week = parseInt(weekStr, 10);
        if (isNaN(year) || isNaN(week)) return isoWeek;
        // ISO: неделя начинается с понедельника
        const simple = new Date(year, 0, 1 + (week - 1) * 7);
        const dow = simple.getDay();
        const ISOweekStart = new Date(simple);
        if (dow <= 4) ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
        else ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
        const ISOweekEnd = new Date(ISOweekStart);
        ISOweekEnd.setDate(ISOweekStart.getDate() + 6);
        // Форматирование: дд.мм.гг
        const fmt = (d: Date) => `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getFullYear().toString().slice(-2)}`;
        return `${fmt(ISOweekStart)} – ${fmt(ISOweekEnd)}`;
      });
    }
    if (currentType === 'month') {
      labels = periodKeys.map((date) =>
        new Date(date).toLocaleString('default', {
          month: 'numeric',
          year: 'numeric',
        }),
      );
    }
    // year: 2025 → 2025 (оставляем как есть)

    // Собираем все типы и статусы
    const allTypes = Array.from(new Set(periodKeys.flatMap((date) => Object.keys(statsType[date] || {}))));
    const allStatuses = Array.from(new Set(periodKeys.flatMap((date) => Object.keys(statsStatus[date] || {}))));

    // Helper для создания dataset — уменьшает дублирование
    const makeDataset = (label: string, data: number[], backgroundColor: string | string[], stack: string) => ({
      label,
      data,
      backgroundColor,
      borderWidth: 0,
      borderRadius: 8,
      barPercentage: barPerc,
      categoryPercentage: catPerc,
      stack,
    });

    // Формируем datasets для типов
    const typeDatasets: PreparedChartData['datasets'] = allTypes.map((type, idx) =>
      makeDataset(
        (getLabel(type) || type) as string,
        periodKeys.map((date) => Number(this.safeValue(statsType, date, type) || 0)),
        typeColors[idx % typeColors.length],
        'types',
      ),
    );

    // Для статусов используем t(status)
    const statusDatasets: PreparedChartData['datasets'] = allStatuses.map((status, idx) =>
      makeDataset(
        t(status),
        periodKeys.map((date) => Number(this.safeValue(statsStatus, date, status) || 0)),
        statusColors[idx % statusColors.length],
        'statuses',
      ),
    );
    const datasets = [...typeDatasets, ...statusDatasets];

    // Рассчитываем nice max и шаг по всем данным
    const allValues = datasets.flatMap((d) => d.data.map((v) => Number(v || 0)));
    const rawMax = Math.max(1, ...allValues);
    const niceMax = this.getNiceMax(rawMax);
    const step = this.getStepSize(niceMax);

    return { labels, datasets, maxY: niceMax, stepSize: step };
  }

  resetToDefault() {
    this.currentType = 'day';
    // Сброс активных классов у кнопок периодов
    const btnWeek = qs<HTMLButtonElement>('#errorsChartSortWeek') as HTMLButtonElement | null;
    const btnMonth = qs<HTMLButtonElement>('#errorsChartSortMonth') as HTMLButtonElement | null;
    const btnYear = qs<HTMLButtonElement>('#errorsChartSortYear') as HTMLButtonElement | null;
    [btnWeek, btnMonth, btnYear].forEach((btn) => {
      if (btn) btn.classList.remove('chart__sort-btn--active');
    });
    this.renderChart();
  }

  // eslint-disable-next-line no-unused-vars
  prepareChartData(stats: Stats, labelFn: (key: string) => string | undefined = getLabel): { labels: string[], data: number[] } {
    // stats: { "type1": count, "type2": count, ... }
    const labels = Object.keys(stats).map((key) => labelFn(key) ?? key);
    const data = Object.values(stats);
    return { labels, data };
  }

  initFilterHandlers() {
    // Привязываем обработчики к кнопкам фильтра
    const btnWeek = qs<HTMLButtonElement>('#errorsChartSortWeek') as HTMLButtonElement | null;
    const btnMonth = qs<HTMLButtonElement>('#errorsChartSortMonth') as HTMLButtonElement | null;
    const btnYear = qs<HTMLButtonElement>('#errorsChartSortYear') as HTMLButtonElement | null;

    if (btnWeek) {
      btnWeek.addEventListener('click', (e) => {
        e.preventDefault();
        this.currentType = 'week';
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('chartType', 'week');
        }
        this.renderChart();
      });
    }
    if (btnMonth) {
      btnMonth.addEventListener('click', (e) => {
        e.preventDefault();
        this.currentType = 'month';
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('chartType', 'month');
        }
        this.renderChart();
      });
    }
    // Если есть кнопка "год", добавляем обработчик
    if (btnYear) {
      btnYear.addEventListener('click', (e) => {
        e.preventDefault();
        this.currentType = 'year';
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('chartType', 'year');
        }
        this.renderChart();
      });
    }
  }

  initLangHandlers() {
    delegate(document, '#lang-en', 'click', () => setLang('en'));
    delegate(document, '#lang-ru', 'click', () => setLang('ru'));
    this.updateAriaLabels();
  }

  updateAriaLabels() {
    const btnWeek = qs<HTMLButtonElement>('#errorsChartSortWeek') as HTMLButtonElement | null;
    const btnMonth = qs<HTMLButtonElement>('#errorsChartSortMonth') as HTMLButtonElement | null;
    const btnYear = qs<HTMLButtonElement>('#errorsChartSortYear') as HTMLButtonElement | null;
    if (btnWeek) btnWeek.setAttribute('aria-label', t('ariaChartWeek'));
    if (btnMonth) btnMonth.setAttribute('aria-label', t('ariaChartMonth'));
    if (btnYear) btnYear.setAttribute('aria-label', t('ariaChartYear'));
  }
}

export type ChartManagerType = ChartManager;
