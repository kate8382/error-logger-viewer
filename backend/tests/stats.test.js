import assert from 'assert';

// Простая проверка: конфиг и логика среза последних N ключей
import fs from 'fs';
const cfg = JSON.parse(fs.readFileSync(new URL('../../config/periods.json', import.meta.url), 'utf8'));

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
const mock = {};
for (let i = 1; i <= 10; i++) {
  const k = `2025-01-${String(i).padStart(2, '0')}`;
  mock[k] = { a: i };
}

const res = sliceLastPeriods(mock, 'day');
assert.strictEqual(Object.keys(res).length, cfg.day, 'Should limit to day value');

console.log('backend/tests/stats.test.js passed');
