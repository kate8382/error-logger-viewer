import fs from 'fs';
import path from 'path';
import type { PeriodStats } from '../../frontend/src/scripts/utils/errors';

// Простая проверка: конфиг и логика среза последних N ключей
const cfgPath = path.resolve(process.cwd(), 'config/periods.json');
const cfg: Record<string, number> = JSON.parse(fs.readFileSync(cfgPath, 'utf8')); // используем импорт типа PeriodStats для типизации и чтения конфига

function sliceLastPeriods(resultObj: PeriodStats, by: string): PeriodStats {
  const keys = Object.keys(resultObj).sort();
  const lim = (cfg && cfg[by]) || 0;
  if (lim > 0 && keys.length > lim) {
    const last = keys.slice(-lim);
    const filtered: PeriodStats = {};
    last.forEach((k) => (filtered[k] = resultObj[k]));
    return filtered;
  }
  return resultObj;
}

// mock data: 10 periods
const generateMock = (): PeriodStats => {
  const m: PeriodStats = {};
  for (let i = 1; i <= 10; i++) {
    const k = `2025-01-${String(i).padStart(2, '0')}`;
    m[k] = { a: i };
  }
  return m;
};

test('sliceLastPeriods ограничивает до cfg.day', () => {
  const mock = generateMock();
  const res = sliceLastPeriods(mock, 'day');
  expect(Object.keys(res).length).toBe(cfg.day);
});
