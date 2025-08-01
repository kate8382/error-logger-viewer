import Chart from 'chart.js/auto';

// Инициализация графика ошибок
export const initErrorsCharts = document.addEventListener('DOMContentLoaded', () => {
  // Пример с двумя линиями и разграничениями по осям
  const ctx = document.getElementById('errorsChart').getContext('2d');
  // Тестовые значения для графика
  const errorsChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['5 May', '6 May', '7 May', '8 May', '9 May', '10 May', '11 May'],
      datasets: [
        {
          label: 'Ошибки (A)',
          data: [120, 200, 340, 400, 390, 320, 280],
          borderColor: 'rgba(146, 85, 253, 1)',
          backgroundColor: 'rgba(146, 85, 253, 0.1)',
          tension: 0.4,
          pointBackgroundColor: 'rgba(146, 85, 253, 1)',
          pointRadius: 5,
          pointHoverRadius: 7
        },
        {
          label: 'Ошибки (B)',
          data: [80, 120, 200, 300, 270, 250, 230],
          borderColor: 'rgba(45, 204, 255, 1)',
          backgroundColor: 'rgba(45, 204, 255, 0.1)',
          tension: 0.4,
          pointBackgroundColor: 'rgba(45, 204, 255, 1)',
          pointRadius: 5,
          pointHoverRadius: 7
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: true,
          labels: {
            color: '#3A3541',
            font: { size: 14 }
          }
        },
        tooltip: {
          enabled: true,
          backgroundColor: '#fff',
          titleColor: '#3A3541',
          bodyColor: '#3A3541',
          borderColor: '#89868D',
          borderWidth: 1
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Дни',
            color: '#89868D',
            font: { size: 14 }
          },
          grid: {
            display: true,
            color: '#E0E0E0'
          },
          ticks: {
            color: '#3A3541',
            font: { size: 12 }
          }
        },
        y: {
          title: {
            display: true,
            text: 'Количество ошибок',
            color: '#89868D',
            font: { size: 14 }
          },
          grid: {
            display: true,
            color: '#E0E0E0'
          },
          ticks: {
            color: '#3A3541',
            font: { size: 12 },
            stepSize: 50
          }
        }
      }
    }

  });
});
