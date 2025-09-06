import Chart from 'chart.js/auto';
import { translations } from './utils/i18n';
import { getCurrentLang } from './utils/lang';

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
    if (this.chart) this.chart.destroy();
    // Цвета для графиков
    // Голубые/синие оттенки для всех типов ошибок
    const typeColors = ['#2dccff', '#4285F4', '#31e2f9', '#E0F8FF', '#EBF4FF', '#1877F2', '#5AC8FA', '#A7C7E7', '#007AFF', '#B3E5FC'];
    const statusColors = ['#13e75dad', '#34A853', '#D7FFC3', '#04CE00', '#2AC670'];

    // BAR CHART по датам, неделям, месяцам, годам
    if (['day', 'date', 'week', 'month', 'year'].includes(this.currentType)) {
      // Определяем параметр для запроса
      let byParam = 'day';
      if (this.currentType === 'week') byParam = 'week';
      if (this.currentType === 'month') byParam = 'month';
      if (this.currentType === 'year') byParam = 'year';

      // Получаем статистику по выбранному периоду и типам
      const resType = await fetch(`http://localhost:3000/errors/stats?by=${byParam}&group=type`);
      const statsType = await resType.json();
      // Получаем статистику по выбранному периоду и статусам (до фильтрации periodKeys)
      const resStatus = await fetch(`http://localhost:3000/errors/stats?by=${byParam}&group=status`);
      const statsStatus = await resStatus.json();
      // Оставляем только периоды, где есть хотя бы одна ошибка (по типу или статусу)
      let periodKeys = Object.keys(statsType).filter(date => {
        const typeVals = Object.values((statsType && statsType[date]) ? statsType[date] : {});
        const statusVals = Object.values((statsStatus && statsStatus[date]) ? statsStatus[date] : {});
        const total = [...typeVals, ...statusVals].reduce((sum, v) => sum + v, 0);
        return total > 0;
      });
      // Ограничиваем количество отображаемых периодов и настраиваем ширину баров
      let barPerc = 0.8;
      let catPerc = 0.6;
      if (this.currentType === 'date' || this.currentType === 'day') {
        periodKeys = periodKeys.slice(-7);
        barPerc = 0.8;
        catPerc = 0.6;
      }
      if (this.currentType === 'week') {
        periodKeys = periodKeys.slice(-10); // последние 10 недель
        barPerc = 0.7;
        catPerc = 0.5;
      }
      if (this.currentType === 'month') {
        periodKeys = periodKeys.slice(-6); // последние 6 месяцев
        barPerc = 0.5;
        catPerc = 0.4;
      }
      if (this.currentType === 'year') {
        periodKeys = periodKeys.slice(-4); // последние 4 года
        barPerc = 0.4;
        catPerc = 0.3;
      }
      // Форматированные подписи для оси X
      let labels = periodKeys;
      if (this.currentType === 'date' || this.currentType === 'day') {
        // Форматировать даты для дня: '2025-08-06' → '06.09.2025'
        labels = periodKeys.map(dateStr => {
          if (!dateStr || dateStr.length !== 10) return dateStr;
          const [year, month, day] = dateStr.split('-');
          if (!year || !month || !day) return dateStr;
          return `${day}.${month}.${year}`;
        });
      }
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
        barPercentage: barPerc,
        categoryPercentage: catPerc,
        stack: 'types',
      }));
      // Формируем datasets для статусов
      const statusDatasets = allStatuses.map((status, idx) => ({
        label: translations[this.lang][status] || status,
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
        this.canvas.getContext('2d').clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.canvas.parentElement.querySelector('.chart__title').textContent = 'Нет данных для графика';
        return;
      } else {
        this.canvas.parentElement.querySelector('.chart__title').textContent = translations[this.lang].chartTitle;
      }
      // Автоматический max для оси Y
      const allData = datasets.flatMap(ds => ds.data); // Все значения из всех наборов данных
      let maxY = Math.max(40, ...allData) || 40; // Максимум не меньше 40
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
              ticks: {
                padding: 10,
                color: '#89868d',
                stepSize: maxY > 100 ? 20 : 10,
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

