import ChartManager from '../../frontend/src/scripts/charts';

// Мокаем fetch для Node.js среды
// mock fetch as any to satisfy TS
const mockResponse = { json: async () => ({ data: [] }) } as unknown as Response;
const mockFetch = jest.fn(() => Promise.resolve(mockResponse)) as unknown as jest.MockedFunction<typeof fetch>;
globalThis.fetch = mockFetch;

// Мокаем getContext для canvas, чтобы избежать ошибок jsdom
beforeAll(() => {
  const mockCtx: Partial<CanvasRenderingContext2D> = {
    clearRect: jest.fn(),
    // другие методы, если понадобятся
  };

  jest.spyOn(HTMLCanvasElement.prototype, 'getContext' as any).mockImplementation(function (this: HTMLCanvasElement, ...args: unknown[]): CanvasRenderingContext2D | null {
    const contextId = args[0] as string | undefined;
    // возвращаем 2d-контекст для запросов '2d'
    if (!contextId || contextId === '2d') return mockCtx as CanvasRenderingContext2D;
    return null;
  });
});

describe('ChartManager', () => {
  let chartManager: ChartManager;
  beforeEach(() => {
    // Мокаем DOM-элементы, необходимые для конструктора
    document.body.innerHTML = '<canvas id="chartCanvas"></canvas>' + '<div class="chart__title"></div>' + '<div id="errorsChartSortWeek"></div>' + '<div id="errorsChartSortMonth"></div>' + '<div id="errorsChartSortYear"></div>';
    chartManager = new ChartManager();
  });

  it('корректно форматирует дату для оси X', () => {
    expect(chartManager.formatDayLabel('2025-10-15')).toMatch(/15\.10\.2025|15\.10\.25/);
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
