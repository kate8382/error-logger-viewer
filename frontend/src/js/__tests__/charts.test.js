import ChartManager from '../charts';

// Мокаем fetch для Node.js среды
globalThis.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ data: [] }),
  }),
);

// Мокаем getContext для canvas, чтобы избежать ошибок jsdom
beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
    clearRect: jest.fn(),
    // другие методы, если понадобятся
  }));
});

describe('ChartManager', () => {
  let chartManager;
  beforeEach(() => {
    // Мокаем DOM-элементы, необходимые для конструктора
    document.body.innerHTML =
      '<canvas id="chartCanvas"></canvas>' +
      '<div class="chart__title"></div>' +
      '<div id="errorsChartSortWeek"></div>' +
      '<div id="errorsChartSortMonth"></div>' +
      '<div id="errorsChartSortYear"></div>';
    chartManager = new ChartManager();
  });

  it('корректно форматирует дату для оси X', () => {
    expect(chartManager.formatDayLabel('2025-10-15')).toMatch(
      /15\.10\.2025|15\.10\.25/,
    );
  });

  it('возвращает корректный ключ периода для дня', () => {
    expect(chartManager.getPeriodKey('2025-10-15', 'day')).toBe('2025-10-15');
  });

  it('возвращает корректный ключ периода для месяца', () => {
    expect(chartManager.getPeriodKey('2025-10-15', 'month')).toBe('2025-10');
  });

  it('возвращает корректный ключ периода для года', () => {
    expect(chartManager.getPeriodKey('2025-10-15', 'year')).toBe('2025');
  });

  it('возвращает корректный шаг для оси Y', () => {
    expect(chartManager.getStepSize(5)).toBe(2);
    expect(chartManager.getStepSize(55)).toBe(20);
    expect(chartManager.getStepSize(150)).toBe(50);
    expect(chartManager.getStepSize(1000)).toBe(100);
  });

  it('prepareChartData возвращает правильные labels и data', () => {
    const stats = { TypeError: 5, ReferenceError: 2 };
    const result = chartManager.prepareChartData(stats);
    expect(result.labels).toContain('Type Error');
    expect(result.data).toEqual([5, 2]);
  });
});
