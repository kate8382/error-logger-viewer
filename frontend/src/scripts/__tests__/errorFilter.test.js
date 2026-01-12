import { filterErrors, getDateOnly } from '../services/errorFilter';

const sample = [
  { id: '1', type: 'auth', status: 'new', firstSeen: '2025-10-01T12:00:00Z', lastSeen: '2025-10-02T12:00:00Z' },
  { id: '2', type: 'db', status: 'fixed', firstSeen: '2025-09-15T12:00:00Z', lastSeen: '2025-09-16T12:00:00Z' },
  { id: 'abc-3', type: 'ui', status: 'in_progress', firstSeen: 'invalid', lastSeen: '' },
];

test('getDateOnly форматирует ISO в DD.MM.YYYY и обрабатывает неверные значения', () => {
  expect(getDateOnly('2025-10-01T12:00:00Z')).toMatch(/01\.10\.2025/);
  expect(getDateOnly('invalid')).toBe('');
  expect(getDateOnly(undefined)).toBe('');
});

test('фильтрация по id и частичному id', () => {
  const r = filterErrors(sample, 'abc');
  expect(r).toHaveLength(1);
  expect(r[0].id).toBe('abc-3');
});

test('фильтрация по типу с использованием getLabel и по статусу с использованием t', () => {
  const r = filterErrors(sample, 'database', {
    getLabel: (type) => (type === 'db' ? 'Database' : type || ''),
    t: (k) => (k === 'fixed' ? 'Fixed' : k || ''),
  });
  expect(r).toHaveLength(1);
  expect(r[0].type).toBe('db');
});
