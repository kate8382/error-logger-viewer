import { ErrorTable } from '../table';

// Мок-данные для теста рендеринга
const mockErrors = [
  { id: '1234567890abcdef', type: 'TypeError', message: 'Ошибка 1', count: 2, firstSeen: '2025-10-14T10:00:00.000Z', lastSeen: '2025-10-14T12:00:00.000Z', status: 'new' },
  { id: 'abcdef1234567890', type: 'ReferenceError', message: 'Ошибка 2', count: 1, firstSeen: '2025-10-13T09:00:00.000Z', lastSeen: '2025-10-13T09:30:00.000Z', status: 'fixed' }
];

describe('ErrorTable', () => {
  it('должен форматировать дату в виде дд.мм.гггг чч:мм', () => {
    const table = new ErrorTable('demo');
    const dateStr = '2025-10-14T15:30:00.000Z';
    const formatted = table.formatDate(dateStr);
    // Проверяем формат: 14.10.2025  15:30
    expect(formatted).toMatch(/\d{2}\.\d{2}\.\d{4}\s{2}\d{2}:\d{2}/);
  });

  it('должен сортировать ошибки по количеству', () => {
    const table = new ErrorTable('demo');
    const errors = [
      { id: '1', count: 5 },
      { id: '2', count: 2 },
      { id: '3', count: 10 }
    ];
    const sortedAsc = table.sortErrors([...errors], 'count', 'asc');
    expect(sortedAsc.map(e => e.count)).toEqual([2, 5, 10]);
    const sortedDesc = table.sortErrors([...errors], 'count', 'desc');
    expect(sortedDesc.map(e => e.count)).toEqual([10, 5, 2]);
  });

  describe('renderErrors', () => {
    beforeEach(() => {
      document.body.innerHTML = '<table><tbody id="errorTableBody"></tbody></table>';
    });
    it('должен рендерить ошибки в таблицу', () => {
      const table = new ErrorTable('demo');
      table.renderErrors(mockErrors.slice(0, 2));
      const rows = document.querySelectorAll('#errorTableBody tr');
      expect(rows.length).toBe(2);
      expect(rows[0].querySelector('.error-table__cell--id').textContent).toContain('12345678-...cdef');
      expect(rows[1].querySelector('.error-table__cell--id').textContent).toContain('abcdef12-...7890');
      expect(rows[0].querySelector('.error-table__cell--data').textContent).toContain('Type Error');
      expect(rows[1].querySelector('.error-table__cell--data').textContent).toContain('ReferenceError');
      expect(rows[0].querySelector('.error-table__cell--count').textContent).toBe('2');
      expect(rows[1].querySelector('.error-table__cell--count').textContent).toBe('1');
      expect(rows[0].querySelector('.error-table__cell--status').textContent).toBe('New');
      expect(rows[1].querySelector('.error-table__cell--status').textContent).toBe('Fixed');
    });
  });
});
