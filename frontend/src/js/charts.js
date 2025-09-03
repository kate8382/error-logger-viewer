import Chart from 'chart.js/auto';
import { translations } from './utils/i18n';
import { getCurrentLang } from './utils/lang';
import { ErrorApi } from './api';

export default class ChartManager {
  constructor() {
    this.canvas = document.getElementById('chartCanvas');
    this.filterList = document.getElementById('chartFilterList');
    this.lang = getCurrentLang();
    this.chart = null;
    this.currentType = 'date'; // default bar chart
    this.initFilterHandlers();
    this.renderChart();
    this.initLangHandlers();
  }

  async renderChart() {
    const api = new ErrorApi();
    if (this.chart) this.chart.destroy();
    // Цвета для графиков
    const typeColors = ['#2dccff', '#4285F4', '#31e2f975', '#E0F8FF', '#EBF4FF'];
    const statusColors = ['#13e75dad', '#34A853', '#D7FFC3', '#04CE00', '#2AC670'];

    // BAR CHART по датам, неделям, месяцам, годам
    if (['date', 'week', 'month', 'year'].includes(this.currentType)) {
      // Определяем параметр для запроса
      let byParam = 'day';
      if (this.currentType === 'week') byParam = 'week';
      if (this.currentType === 'month') byParam = 'month';
      if (this.currentType === 'year') byParam = 'year';

      // Получаем статистику по выбранному периоду и типам
      const resType = await fetch(`http://localhost:3000/errors/stats?by=${byParam}&group=type`);
      const statsType = await resType.json();
      const periodKeys = Object.keys(statsType); // исходные ключи (например, '2025-W36')
      // Форматированные подписи для оси X
      let labels = periodKeys;
      if (this.currentType === 'week') {
        labels = periodKeys.map(weekStr => {
          const [year, week] = weekStr.split('-W');
          if (!year || !week) return weekStr;
          // ISO week to date (понедельник)
          const simpleMonday = (y, w) => {
            const d = new Date(y, 0, 1 + (w - 1) * 7);
            const day = d.getDay();
            const diff = d.getDate() - day + (day === 0 ? -6 : 1);
            const monday = new Date(d.setDate(diff));
            return monday;
          };
          const monday = simpleMonday(+year, +week);
          const dd = String(monday.getDate()).padStart(2, '0');
          const mm = String(monday.getMonth() + 1).padStart(2, '0');
          const yyyy = monday.getFullYear();
          return `${dd}.${mm}.${yyyy}`;
        });
      }
      if (this.currentType === 'month') {
        labels = periodKeys.map(monthStr => {
          const [year, month] = monthStr.split('-');
          if (!year || !month) return monthStr;
          return `${month}.${year}`;
        });
      }
      // year: 2025 → 2025 (оставляем как есть)
      // Получаем статистику по выбранному периоду и статусам
      const resStatus = await fetch(`http://localhost:3000/errors/stats?by=${byParam}&group=status`);
      const statsStatus = await resStatus.json();
      // Собираем все типы и статусы
      const allTypes = Array.from(new Set(periodKeys.flatMap(date => Object.keys(statsType[date] || {}))));
      const allStatuses = Array.from(new Set(periodKeys.flatMap(date => Object.keys(statsStatus[date] || {}))));
      // Формируем datasets для типов
      const typeDatasets = allTypes.map((type, idx) => ({
        label: translations[this.lang][`errorType_${type}`] || type,
        data: periodKeys.map(date => statsType[date][type] || 0),
        backgroundColor: typeColors[idx % typeColors.length],
        borderWidth: 0,
        borderRadius: 8,
        barPercentage: 0.8, // отвечает за ширину столбиков
        categoryPercentage: 0.6, // отвечает за ширину категорий
        stack: 'types',
      }));
      // Формируем datasets для статусов
      const statusDatasets = allStatuses.map((status, idx) => ({
        label: translations[this.lang][status] || status,
        data: periodKeys.map(date => statsStatus[date][status] || 0),
        backgroundColor: statusColors[idx % statusColors.length],
        borderWidth: 0,
        borderRadius: 8,
        barPercentage: 0.8,
        categoryPercentage: 0.6,
        stack: 'statuses',
      }));
      const datasets = [...typeDatasets, ...statusDatasets];
      // ОТЛАДОЧНЫЙ ВЫВОД
      console.log('[CHART] statsType:', statsType);
      console.log('[CHART] statsStatus:', statsStatus);
      console.log('[CHART] labels:', labels);
      console.log('[CHART] allTypes:', allTypes);
      console.log('[CHART] allStatuses:', allStatuses);
      console.log('[CHART] datasets:', datasets);
      if (!labels.length || !datasets.length) {
        this.canvas.getContext('2d').clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.canvas.parentElement.querySelector('.chart__title').textContent = 'Нет данных для графика';
        return;
      } else {
        this.canvas.parentElement.querySelector('.chart__title').textContent = translations[this.lang].chartTitle;
      }
      // Автоматический max для оси Y
      const allData = datasets.flatMap(ds => ds.data);
      const maxY = Math.max(40, ...allData) || 40;
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
                label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y}`
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
                display: false,
                drawBorder: false,
                drawOnChartArea: false,
              },
              ticks: {
                display: true,
                color: '#89868d',
                font: { size: 12 },
                padding: 5,
                major: { enabled: false }
              }
            },
            y: {
              stacked: true,
              grid: {
                drawTicks: false,
              },
              border: {
                display: false
              },
              min: 0,
              max: maxY,
              ticks: {
                padding: 10,
                color: '#89868d',
                stepSize: 10,
                callback: function (value) {
                  return value % 10 === 0 ? value : '';
                }
              }
            }
          },
        },
      });
      return;
    }
  }

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
        this.renderChart();
      });
    }
    if (btnMonth) {
      btnMonth.addEventListener('click', e => {
        e.preventDefault();
        this.currentType = 'month';
        this.renderChart();
      });
    }
    if (btnYear) {
      btnYear.addEventListener('click', e => {
        e.preventDefault();
        this.currentType = 'year';
        this.renderChart();
      });
    }
  }

  initLangHandlers() {
    const langEnBtn = document.getElementById('lang-en');
    const langRuBtn = document.getElementById('lang-ru');
    if (langEnBtn) langEnBtn.addEventListener('click', () => {
      this.lang = 'en';
      this.renderChart();
    });
    if (langRuBtn) langRuBtn.addEventListener('click', () => {
      this.lang = 'ru';
      this.renderChart();
    });
  }
}

