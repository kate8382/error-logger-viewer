import { StatsManager } from '../stats';

describe('StatsManager', () => {
  // фиксируем системную дату, чтобы todayCount был детерминирован
  beforeAll(() => {
    jest.useFakeTimers('modern');
    jest.setSystemTime(new Date('2025-10-15T16:00:00.000Z'));
  });
  afterAll(() => {
    jest.useRealTimers();
  });
  const mockErrors = [
    { type: 'TypeError', status: 'new', firstSeen: '2025-10-15T10:00:00.000Z' },
    {
      type: 'ReferenceError',
      status: 'fixed',
      firstSeen: '2025-10-15T12:00:00.000Z',
    },
    { type: 'TypeError', status: 'new', firstSeen: '2025-10-14T09:00:00.000Z' },
    {
      type: 'RangeError',
      status: 'deleted',
      firstSeen: '2025-10-15T13:00:00.000Z',
    },
  ];

  it('считает общее количество ошибок (без deleted)', () => {
    const stats = new StatsManager(mockErrors);
    expect(stats.totalCount).toBe(3);
  });

  it('считает количество ошибок за сегодня', () => {
    const stats = new StatsManager(mockErrors);
    expect(stats.todayCount).toBe(2);
  });

  it('возвращает статистику по типам ошибок', () => {
    const stats = new StatsManager(mockErrors);
    expect(stats.typeStats).toEqual([
      ['TypeError', 2],
      ['ReferenceError', 1],
    ]);
  });

  it('возвращает статистику по статусам ошибок', () => {
    const stats = new StatsManager(mockErrors);
    expect(stats.statusStats).toEqual([
      ['new', 2],
      ['fixed', 1],
    ]);
  });

  it('корректно считает проценты по типам', () => {
    const stats = new StatsManager(mockErrors);
    const percents = stats.typePercentStats;
    expect(percents.reduce((a, b) => a + b, 0)).toBe(100);
    expect(percents.length).toBe(stats.typeStats.length);
  });

  it('корректно считает проценты по статусам', () => {
    const stats = new StatsManager(mockErrors);
    const percents = stats.statusPercentStats;
    expect(percents.reduce((a, b) => a + b, 0)).toBe(100);
    expect(percents.length).toBe(stats.statusStats.length);
  });
});
