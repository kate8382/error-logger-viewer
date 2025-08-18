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
    this.currentType = 'type'; // default
    this.initFilterHandlers();
    this.renderChart();
    this.initLangHandlers();
  }

  async renderChart() {
    const api = new ErrorApi();
    const stats = await api.getStats(this.currentType);
    console.log('[ChartManager] Статистика для графика:', stats);
    const { labels, data } = this.prepareChartData(stats);
    if (this.chart) this.chart.destroy();
    if (!labels.length || !data.length || data.every(v => v === 0)) {
      this.canvas.getContext('2d').clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.canvas.parentElement.querySelector('.chart__title').textContent = 'Нет данных для графика';
      return;
    } else {
      this.canvas.parentElement.querySelector('.chart__title').textContent = translations[this.lang].chartTitle;
    }
    this.chart = new Chart(this.canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: translations[this.lang][`chartHeaderBtn_${this.currentType}`],
          data,
          backgroundColor: 'rgba(249,49,49,0.2)',
          borderColor: 'rgba(249,49,49,1)',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => `${ctx.label}: ${ctx.parsed.y}`
            }
          }
        }
      }
    });
  }

  prepareChartData(stats) {
    // stats: { "type1": count, "type2": count, ... }
    const labels = Object.keys(stats).map(key => translations[this.lang][key] || key);
    const data = Object.values(stats);
    return { labels, data };
  }

  initFilterHandlers() {
    if (!this.filterList) return;
    this.filterList.querySelectorAll('.chart__filter-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        const type = btn.getAttribute('data-i18n').replace('chartHeaderBtn_', '');
        this.currentType = type;
        this.renderChart();
      });
    });
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
