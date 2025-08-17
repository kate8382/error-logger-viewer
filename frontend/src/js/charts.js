import Chart from 'chart.js/auto';
import { translations } from './utils/i18n';

// Инициализация графика ошибок

function createErrorsChart(lang) {
  const ctx = document.getElementById('errorsChartCanvas').getContext('2d');
  return new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['5 May', '6 May', '7 May', '8 May', '9 May', '10 May', '11 May'],
      datasets: [
        {
          label: 'Total Errors',
          data: [120, 200, 340, 400, 390, 320, 280],
          borderColor: 'rgba(249, 49, 49, 1)',
          backgroundColor: 'rgba(249, 49, 49, 0.1)',
          tension: 0.6,
          pointBackgroundColor: 'rgba(249, 49, 49, 1)',
          pointHoverRadius: 7,
          borderWidth: 3 // увеличена ширина линии
        },
        {
          label: 'Unique Errors',
          data: [80, 120, 200, 300, 270, 250, 230],
          borderColor: 'rgba(45, 204, 255, 1)',
          backgroundColor: 'rgba(45, 204, 255, 0.1)',
          tension: 0.6,
          pointBackgroundColor: 'rgba(45, 204, 255, 1)',
          pointHoverRadius: 7,
          borderWidth: 3
        }
      ]
    },
    options: {
      responsive: true, // адаптивность графика
      maintainAspectRatio: true, // отключение сохранения соотношения сторон
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: '#fff',
          titleColor: '#3A3541',
          bodyColor: '#3A3541',
          borderColor: '#89868D',
          borderWidth: 0.5,
          callbacks: {
            title: function (context) {
              // context[0].label — это дата
              return context[0].label;
            },
            label: function (context) {
              const datasetLabel = context.dataset.label;
              const value = context.parsed.y;
              let translatedLabel = '';
              if (datasetLabel === 'Total Errors') {
                translatedLabel = translations[lang].statsTotal;
              } else if (datasetLabel === 'Unique Errors') {
                translatedLabel = translations[lang].statsUnique;
              } else {
                translatedLabel = datasetLabel;
              }
              return `${translatedLabel}: ${value}`;
            }
          }
        }
      },
      layout: {
        padding: {
          left: 10,
          right: 10,
          top: 10,
          bottom: 10
        }
      },
      scales: {
        x: {
          title: {
            display: false,
          },
          grid: {
            display: false,
            drawBorder: false,
            drawOnChartArea: false,
            drawTicks: false
          },
          ticks: {
            color: '#89868D',
            font: { size: 12 },
            padding: 30,
            maxRotation: 0,
            minRotation: 0
          }
        },
        y: {
          title: {
            display: false,
          },
          grid: {
            display: true,
            color: '#DBDCDE',
            lineWidth: 1, // ширина линий сетки
            drawBorder: false, // убрать рамку
            drawTicks: true, // показывать деления
            tickLength: 1, // длина делений 1 - это минимальная длина
            drawOnChartArea: true, // рисовать сетку на области графика
            offset: false // нормальная разметка сетки (без смещения)
          },
          border: { display: false }, // убрать рамку оси Y
          ticks: {
            padding: 30,
            color: '#89868D',
            font: { size: 12 },
            stepSize: 100,
            count: 5 // количество делений на оси Y
          }
        }
      }
    }
  });
}

// Инициализация графика при загрузке страницы
export const initErrorsCharts = document.addEventListener('DOMContentLoaded', () => {
  let currentLang = localStorage.getItem('lang') || 'ru';
  let chart = createErrorsChart(currentLang);

  // Обработчики смены языка
  const langEnBtn = document.getElementById('lang-en');
  const langRuBtn = document.getElementById('lang-ru');
  if (langEnBtn) {
    langEnBtn.addEventListener('click', () => {
      localStorage.setItem('lang', 'en');
      chart.destroy();
      chart = createErrorsChart('en');
    });
  }
  if (langRuBtn) {
    langRuBtn.addEventListener('click', () => {
      localStorage.setItem('lang', 'ru');
      chart.destroy();
      chart = createErrorsChart('ru');
    });
  }
});
