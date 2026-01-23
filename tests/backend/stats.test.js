import fs from 'fs';
import path from 'path';

// Простая проверка: конфиг и логика среза последних N ключей
const cfgPath = path.resolve(process.cwd(), 'config/periods.json');
const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));

function sliceLastPeriods(resultObj, by) {
  const keys = Object.keys(resultObj).sort();
  const lim = (cfg && cfg[by]) || 0;
  if (lim > 0 && keys.length > lim) {
    const last = keys.slice(-lim);
    const filtered = {};
    last.forEach((k) => (filtered[k] = resultObj[k]));
    return filtered;
  }
  return resultObj;
}

// mock data: 10 periods
const generateMock = () => {
  const m = {};
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
