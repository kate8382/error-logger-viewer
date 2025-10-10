import Chart from 'chart.js/auto';
import { t, getLabel, onLangChange, setLang } from './utils/i18n.js';
import { typeColors, statusColors } from './utils/colors';
import { showCenterSpinner, hideCenterSpinner } from './utils/loading';

export default class ChartManager {
  constructor() {
    this.canvas = document.getElementById('chartCanvas');
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
  formatDayLabel(dateStr) {
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
    if (this.chart && this.chart.options && this.chart.options.plugins && this.chart.options.plugins.legend && this.chart.options.plugins.legend.labels) {
      if (this.chart.options.plugins.legend.labels.font) {
        this.chart.options.plugins.legend.labels.font.size = this.getResponsiveFontSize();
      } else {
        this.chart.options.plugins.legend.labels.font = { size: this.getResponsiveFontSize() };
      }
      // Если график по дням — перерисовываем полностью, чтобы обновить формат дат
      if (this.currentType === 'day' || this.currentType === 'date') {
        this.renderChart();
      } else {
        this.chart.update();
      }
    }
  }

  // Форматируем даты 
  getPeriodKey(dateStr, by) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (by === 'day') return d.toISOString().slice(0, 10);
    if (by === 'week') {
      const year = d.getFullYear();
      const firstJan = new Date(year, 0, 1);
      const days = Math.floor((d - firstJan) / 86400000);
      const week = Math.ceil((days + firstJan.getDay() + 1) / 7);
      return `${year}-W${week.toString().padStart(2, '0')}`;
    }
    if (by === 'month') return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    if (by === 'year') return d.getFullYear().toString();
    return '';
  }

  // Обновляем размер шагов на оси Y в зависимости от maxY
  getStepSize(maxY) {
    if (maxY <= 10) return 2;
    if (maxY <= 50) return 10;
    if (maxY <= 100) return 20;
    if (maxY <= 200) return 50;
    if (maxY <= 1000) return 100;
    return Math.ceil(maxY / 10);
  }

  async renderChart() {
    if (this.isRendering) return;
    this.isRendering = true;
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
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
      let statsType = {};
      let statsStatus = {};
      if (mode === 'demo') {
        // Данные из localStorage
        let errors = [];
        try {
          errors = JSON.parse(localStorage.getItem('errorsLocal') || '[]');
          // eslint-disable-next-line no-unused-vars
        } catch (e) {
          errors = [];
        }
        statsType = {};
        statsStatus = {};
        errors.forEach(e => {
          const key = this.getPeriodKey(e.lastSeen || e.firstSeen, byParam);
          if (!key) return;
          const type = e.type || 'Unknown';
          if (!statsType[key]) statsType[key] = {};
          statsType[key][type] = (statsType[key][type] || 0) + (e.count || 1);
          const status = e.status || 'new';
          if (!statsStatus[key]) statsStatus[key] = {};
          statsStatus[key][status] = (statsStatus[key][status] || 0) + (e.count || 1);
        });
      } else {
        // Получаем статистику по выбранному периоду и типам
        const resType = await fetch(`http://localhost:3000/errors/stats?by=${byParam}&group=type`);
        statsType = await resType.json();
        const resStatus = await fetch(`http://localhost:3000/errors/stats?by=${byParam}&group=status`);
        statsStatus = await resStatus.json();
      }

      // Универсальная подготовка данных для графика (labels, datasets, стили)
      const { labels, datasets } = this.prepareBarChartData(statsType, statsStatus, byParam, this.currentType);

      try {
        if (!labels.length || !datasets.length) {
          // Если нет данных для графика
          this.canvas.getContext('2d').clearRect(0, 0, this.canvas.width, this.canvas.height);
          this.canvas.parentElement.querySelector('.chart__title').textContent = t('noChartData');
        } else {
          // Есть данные — рендерим график
          this.canvas.parentElement.querySelector('.chart__title').textContent = t('chartTitle');
          // Автоматический max для оси Y с округлением и динамическим шагом
          const allData = datasets.flatMap(ds => ds.data);
          let rawMax = Math.max(1, ...allData) || 1;
          // Округляем maxY вверх до "красивого" значения
          function getNiceMax(val) {
            if (val <= 10) return 10;
            if (val <= 50) return Math.ceil(val / 10) * 10;
            if (val <= 100) return Math.ceil(val / 20) * 20;
            if (val <= 200) return Math.ceil(val / 50) * 50;
            if (val <= 1000) return Math.ceil(val / 100) * 100;
            // Для больших значений — округляем к ближайшей сотне/тысяче
            const pow10 = Math.pow(10, Math.floor(Math.log10(val)));
            return Math.ceil(val / pow10) * pow10;
          }
          const maxY = getNiceMax(rawMax);
          // stepSize зависит от диапазона
          const stepSize = this.getStepSize(maxY);
          this.chart = new Chart(this.canvas, {
            type: 'bar',
            data: {
              labels,
              datasets
            },
            options: {
              responsive: true,
              plugins: {
                legend: { // Отображать легенду
                  display: false,
                  position: 'top', // Положение легенды
                  labels: {
                    boxWidth: 12, // Ширина бокса
                    padding: 20
                  }
                },
                tooltip: {
                  callbacks: {
                    label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y}` // ctx - контекст, где ctx.dataset.label - отвечает за название набора данных (label), а ctx.parsed.y - за значение по оси Y
                  }
                },
              },
              // Паддинги
              layout: {
                padding: {
                  left: 30,
                  right: 30,
                  top: 30,
                  bottom: 30
                }
              },
              scales: {
                x: {
                  stacked: true,
                  grid: {
                    display: false, // Отключаем сетку по X
                    drawBorder: false, // Отключаем линию сетки по оси X
                    drawOnChartArea: false, // Отключаем рисование сетки на области графика
                  },
                  ticks: {
                    display: true,
                    color: '#89868d',
                    font: { size: this.getResponsiveFontSize() },
                    padding: 5,
                    major: { enabled: false } // Выключаем выделение крупных меток
                  }
                },
                y: {
                  stacked: true, // Стэк для баров
                  grid: {
                    drawTicks: false, // Отключаем рисование засечек
                  },
                  border: {
                    display: false // Отключаем линию оси Y
                  },
                  min: 0,
                  suggestedMax: maxY,
                  ticks: {
                    padding: 10,
                    color: '#89868d',
                    stepSize: stepSize,
                    callback: function (value) {
                      return value;
                    }
                  }
                }
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
  prepareBarChartData(statsType, statsStatus, byParam, currentType) {
    // Собираем все ключи периодов, фильтруем только валидные
    let periodKeys = Object.keys(statsType)
      .filter(date => {
        if (!date || typeof date !== 'string') return false;
        const typeVals = Object.values(statsType[date] || {});
        const statusVals = Object.values(statsStatus[date] || {});
        const total = [...typeVals, ...statusVals].reduce((sum, v) => sum + v, 0);
        return total > 0;
      });
    // Защита от некорректных periodKeys
    if (!Array.isArray(periodKeys)) periodKeys = [];
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
      labels = periodKeys.map(date => this.formatDayLabel(date));
    }
    if (currentType === 'week') {
      // Поддержка periodKeys: '2025-W39' и '2025-39'
      labels = periodKeys.map(isoWeek => {
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
        if (dow <= 4)
          ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
        else
          ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
        const ISOweekEnd = new Date(ISOweekStart);
        ISOweekEnd.setDate(ISOweekStart.getDate() + 6);
        // Форматирование: дд.мм.гг
        const fmt = d => `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getFullYear().toString().slice(-2)}`;
        return `${fmt(ISOweekStart)} – ${fmt(ISOweekEnd)}`;
      });
    }
    if (currentType === 'month') {
      labels = periodKeys.map(date => new Date(date).toLocaleString('default', { month: 'numeric', year: 'numeric' }));
    }
    // year: 2025 → 2025 (оставляем как есть)
    // Собираем все типы и статусы
    const allTypes = Array.from(new Set(periodKeys.flatMap(date => Object.keys(statsType[date] || {}))));
    const allStatuses = Array.from(new Set(periodKeys.flatMap(date => Object.keys(statsStatus[date] || {}))));
    // Формируем datasets для типов
    const typeDatasets = allTypes.map((type, idx) => ({
      label: getLabel(type),
      data: periodKeys.map(date => statsType[date][type] || 0),
      backgroundColor: typeColors[idx % typeColors.length],
      borderWidth: 0,
      borderRadius: 8,
      barPercentage: barPerc,
      categoryPercentage: catPerc,
      stack: 'types',
    }));
    // Для статусов используем t(status)
    const statusDatasets = allStatuses.map((status, idx) => ({
      label: t(status),
      data: periodKeys.map(date => statsStatus[date][status] || 0),
      backgroundColor: statusColors[idx % statusColors.length],
      borderWidth: 0,
      borderRadius: 8,
      barPercentage: barPerc,
      categoryPercentage: catPerc,
      stack: 'statuses',
    }));
    const datasets = [...typeDatasets, ...statusDatasets];

    return { labels, datasets };
  }

  resetToDefault() {
    this.currentType = 'day';
    // Сброс активных классов у кнопок периодов
    const btnWeek = document.getElementById('errorsChartSortWeek');
    const btnMonth = document.getElementById('errorsChartSortMonth');
    const btnYear = document.getElementById('errorsChartSortYear');
    [btnWeek, btnMonth, btnYear].forEach(btn => {
      if (btn) btn.classList.remove('chart__sort-btn--active');
    });
    this.renderChart();
  }
  isRendering = false;

  prepareChartData(stats) {
    // stats: { "type1": count, "type2": count, ... }
    const labels = Object.keys(stats).map(key => getLabel(key));
    const data = Object.values(stats);
    return { labels, data };
  }

  initFilterHandlers() {
    // Привязываем обработчики к кнопкам фильтра
    const btnWeek = document.getElementById('errorsChartSortWeek');
    const btnMonth = document.getElementById('errorsChartSortMonth');
    const btnYear = document.getElementById('errorsChartSortYear');

    if (btnWeek) {
      btnWeek.addEventListener('click', e => {
        e.preventDefault();
        this.currentType = 'week';
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('chartType', 'week');
        }
        this.renderChart();
      });
    }
    if (btnMonth) {
      btnMonth.addEventListener('click', e => {
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
      btnYear.addEventListener('click', e => {
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
    const langEnBtn = document.getElementById('lang-en');
    const langRuBtn = document.getElementById('lang-ru');
    if (langEnBtn) langEnBtn.addEventListener('click', () => setLang('en'));
    if (langRuBtn) langRuBtn.addEventListener('click', () => setLang('ru'));
    this.updateAriaLabels();
  }

  updateAriaLabels() {
    const btnWeek = document.getElementById('errorsChartSortWeek');
    const btnMonth = document.getElementById('errorsChartSortMonth');
    const btnYear = document.getElementById('errorsChartSortYear');
    if (btnWeek) btnWeek.setAttribute('aria-label', t('ariaChartWeek'));
    if (btnMonth) btnMonth.setAttribute('aria-label', t('ariaChartMonth'));
    if (btnYear) btnYear.setAttribute('aria-label', t('ariaChartYear'));
  }
}