import { ErrorTable } from '../../frontend/src/scripts/table';

describe('ErrorTable edge-cases', () => {
  it('renderErrors не падает при undefined', () => {
    document.body.innerHTML = '<tbody id="errorTableBody"></tbody>';
    const table = new ErrorTable('demo');
    expect(() => table.renderErrors(undefined)).not.toThrow();
    expect(table.getErrors()).toEqual([]);
  });

  it('formatId корректно работает с коротким id', () => {
    const table = new ErrorTable('demo');
    expect(table.formatId('abc')).toBe('abc');
  });

  it('formatId корректно работает с длинным id', () => {
    const table = new ErrorTable('demo');
    expect(table.formatId('1234567890abcdef')).toBe('12345678-...cdef');
  });

  it('formatDate возвращает корректный формат для некорректной даты', () => {
    const table = new ErrorTable('demo');
    expect(table.formatDate('not-a-date')).toBe('');
  });

  it('sortErrors не падает при пустом массиве', () => {
    const table = new ErrorTable('demo');
    expect(table.sortErrors([], 'count', 'asc')).toEqual([]);
  });

  it('sortErrors корректно сортирует по несуществующему полю', () => {
    const table = new ErrorTable('demo');
    const errors = [{ id: 'a' }, { id: 'b' }];
    expect(table.sortErrors(errors, 'unknown', 'asc')).toEqual(errors);
  });
});
