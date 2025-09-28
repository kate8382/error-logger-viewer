import Chart from 'chart.js/auto';
import { translations } from './utils/i18n';
import { getCurrentLang } from './utils/lang';
import { typeColors, statusColors } from './utils/colors';
import { getLabel } from './utils/label';
import { showCenterSpinner, hideCenterSpinner } from './utils/loading';

export default class ChartManager {
  constructor() {
    this.canvas = document.getElementById('chartCanvas');
    this.lang = getCurrentLang();
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
      // Проверяем режим приложения
      const mode = window.app?.errorApi?.mode || 'server';
      if (mode === 'demo') {
        // В демо-режиме строим пустой график
        if (this.chart) {
          this.chart.destroy();
          this.chart = null;
        }
        if (canvasWrapper) {
          hideCenterSpinner(canvasWrapper);
        }
        // Можно нарисовать пустой график или просто очистить canvas
        this.canvas.getContext('2d').clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.canvas.parentElement.querySelector('.chart__title').textContent = 'Нет данных для графика';
        this.isRendering = false;
        return;
      }

      // Определяем параметр для запроса
      let byParam = 'day';
      if (this.currentType === 'week') byParam = 'week';
      if (this.currentType === 'month') byParam = 'month';
      if (this.currentType === 'year') byParam = 'year';

      // timeset для теста спиннера (убрать на проде)
      try {
        await new Promise(res => setTimeout(res, 1200));
        // Получаем статистику по выбранному периоду и типам
        const resType = await fetch(`http://localhost:3000/errors/stats?by=${byParam}&group=type`);
        const statsType = await resType.json();
        // Получаем статистику по выбранному периоду и статусам (до фильтрации periodKeys)
        const resStatus = await fetch(`http://localhost:3000/errors/stats?by=${byParam}&group=status`);
        const statsStatus = await resStatus.json();
        let periodKeys = Object.keys(statsType).filter(date => {
          const typeVals = Object.values(statsType[date] || {});
          const statusVals = Object.values(statsStatus[date] || {});
          const total = [...typeVals, ...statusVals].reduce((sum, v) => sum + v, 0);
          return total > 0;
        });
        // Ограничиваем количество отображаемых периодов и настраиваем ширину баров
        let barPerc = 0.8;
        let catPerc = 0.6;
        if (this.currentType === 'date' || this.currentType === 'day') {
          barPerc = 0.8;
          catPerc = 0.6;
        }
        if (this.currentType === 'week') {
          barPerc = 0.7;
          catPerc = 0.5;
        }
        if (this.currentType === 'month') {
          barPerc = 0.6;
          catPerc = 0.4;
        }
        if (this.currentType === 'year') {
          barPerc = 0.5;
          catPerc = 0.3;
        }
        // Форматированные подписи для оси X
        let labels = periodKeys;
        if (this.currentType === 'date' || this.currentType === 'day') {/* Lines 90-97 omitted */ }
        if (this.currentType === 'week') {/* Lines 99-116 omitted */ }
        if (this.currentType === 'month') {/* Lines 118-123 omitted */ }
        // year: 2025 → 2025 (оставляем как есть)
        // Собираем все типы и статусы
        const allTypes = Array.from(new Set(periodKeys.flatMap(date => Object.keys(statsType[date] || {}))));
        const allStatuses = Array.from(new Set(periodKeys.flatMap(date => Object.keys(statsStatus[date] || {}))));
        // Формируем datasets для типов
        const typeDatasets = allTypes.map((type, idx) => ({
          label: getLabel(type, this.lang, translations),
          data: periodKeys.map(date => statsType[date][type] || 0),
          backgroundColor: typeColors[idx % typeColors.length],
          borderWidth: 0,
          borderRadius: 8,
          barPercentage: barPerc,
          categoryPercentage: catPerc,
          stack: 'types',
        }));
        // Формируем datasets для статусов
        const statusDatasets = allStatuses.map((status, idx) => ({
          label: getLabel(status, this.lang, translations),
          data: periodKeys.map(date => statsStatus[date][status] || 0),
          backgroundColor: statusColors[idx % statusColors.length],
          borderWidth: 0,
          borderRadius: 8,
          barPercentage: barPerc,
          categoryPercentage: catPerc,
          stack: 'statuses',
        }));
        const datasets = [...typeDatasets, ...statusDatasets];
        if (!labels.length || !datasets.length) {
          // Если нет данных для графика
          this.canvas.getContext('2d').clearRect(0, 0, this.canvas.width, this.canvas.height);
          this.canvas.parentElement.querySelector('.chart__title').textContent = 'Нет данных для графика';
        } else {
          // Есть данные — рендерим график
          this.canvas.parentElement.querySelector('.chart__title').textContent = translations[this.lang].chartTitle;
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
          function getStepSize(maxY) {
            if (maxY <= 10) return 2;
            if (maxY <= 50) return 10;
            if (maxY <= 100) return 20;
            if (maxY <= 200) return 50;
            if (maxY <= 1000) return 100;
            // Для больших значений — делим на 10
            return Math.ceil(maxY / 10);
          }
          const stepSize = getStepSize(maxY);
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
                    font: { size: 12 },
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
    const labels = Object.keys(stats).map(key => translations[this.lang][key] || key);
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
    const updateAriaLabels = () => {
      const btnWeek = document.getElementById('errorsChartSortWeek');
      const btnMonth = document.getElementById('errorsChartSortMonth');
      const btnYear = document.getElementById('errorsChartSortYear');
      if (btnWeek) btnWeek.setAttribute('aria-label', translations[this.lang].ariaChartWeek);
      if (btnMonth) btnMonth.setAttribute('aria-label', translations[this.lang].ariaChartMonth);
      if (btnYear) btnYear.setAttribute('aria-label', translations[this.lang].ariaChartYear);
    };
    if (langEnBtn) langEnBtn.addEventListener('click', () => {
      this.lang = 'en';
      this.renderChart();
      updateAriaLabels();
    });
    if (langRuBtn) langRuBtn.addEventListener('click', () => {
      this.lang = 'ru';
      this.renderChart();
      updateAriaLabels();
    });
    // Инициализация при загрузке
    updateAriaLabels();
  }
}


