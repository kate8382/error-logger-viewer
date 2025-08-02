import Chart from 'chart.js/auto';

// Инициализация графика ошибок
export const initErrorsCharts = document.addEventListener('DOMContentLoaded', () => {
  // Пример с двумя линиями и разграничениями по осям
  const ctx = document.getElementById('errorsChartCanvas').getContext('2d');
  // Тестовые значения для графика
  const errorsChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['5 May', '6 May', '7 May', '8 May', '9 May', '10 May', '11 May'], // Дни для оси X
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
          borderWidth: 0.5 // ширина рамки вокруг тултипа
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
            lineWidth: 1.2, // ширина линий сетки
            drawBorder: false, // убрать рамку
            drawTicks: true, // показывать деления
            tickLength: 1, // длина делений 1 - это минимальная длина
            drawOnChartArea: true, // рисовать сетку на области графика
            offset: false // смещение сетки для лучшего отображения
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
});
