import { HeaderManager } from '../../frontend/src/scripts/header';

// Мокаем ErrorApi для demo-режима
jest.mock('../../frontend/src/scripts/api', () => {
  return {
    ErrorApi: jest.fn().mockImplementation(() => ({
      getErrors: () => Promise.resolve(mockErrors),
    })),
  };
});

// Два набора данных для тестов
let mockErrors;

describe('HeaderManager фильтрация', () => {
  let header;
  beforeEach(() => {
    header = new HeaderManager();
    header.sections = { table: { style: { display: '' } } };
    header.table = { getErrors: () => mockErrors, renderErrors: jest.fn() };
    header.filteredErrors = null;
  });

  it('фильтрует секции по заголовку (DOM)', () => {
    header.headerTitle = document.createElement('div');
    // Эмулируем DOM секций с заголовками
    document.body.innerHTML = `
      <section id="errorStats"><h2 class="stats__title">Статистика ошибок</h2></section>
      <section id="errorsChart"><h2 class="chart__title">График ошибок</h2></section>
      <section id="errorTableSection"><h2 class="error-table__title">Таблица ошибок</h2></section>
    `;
    header.sections = {
      stats: document.getElementById('errorStats'),
      chart: document.getElementById('errorsChart'),
      table: document.getElementById('errorTableSection'),
    };
    // Запускаем фильтрацию по секции "Таблица ошибок"
    header.handleSearch('Таблица ошибок');
    expect(header.sections.table.style.display).toBe('');
    expect(header.sections.stats.style.display).toBe('none');
    expect(header.sections.chart.style.display).toBe('none');
  });

  it('фильтрует ошибки по таблице (массив)', async () => {
    mockErrors = [
      { id: '1', type: 'TypeError', status: 'new' },
      { id: '2', type: 'ReferenceError', status: 'fixed' },
      { id: '3', type: 'TypeError', status: 'new' },
    ];
    header.api.getErrors = () => Promise.resolve(mockErrors);
    await header.filterTable('Type Error');
    expect(header.filteredErrors.length).toBe(2);
    expect(header.filteredErrors[0].type).toBe('TypeError');
    expect(header.filteredErrors[1].type).toBe('TypeError');

    await header.filterTable('new');
    expect(header.filteredErrors.length).toBe(2);
    expect(header.filteredErrors[0].status).toBe('new');
    expect(header.filteredErrors[1].status).toBe('new');
  });

  it('игнорирует устаревшие ответы (requestId)', async () => {
    // контролируемые промисы
    let resolveFirst, resolveSecond;
    const p1 = new Promise((res) => {
      resolveFirst = res;
    });
    const p2 = new Promise((res) => {
      resolveSecond = res;
    });
    // первый вызов вернёт p1, второй — p2
    let call = 0;
    header.api.getErrors = () => {
      call++;
      return call === 1 ? p1 : p2;
    };

    // Запускаем два запроса подряд
    const first = header.filterTable('a');
    const second = header.filterTable('b');

    // Разрешаем второй промис сначала
    resolveSecond([{ id: '2', type: 'bType', status: 'fixed' }]);
    await second;
    // ожидаем, что table.renderErrors был вызван с данными второго ответа
    expect(header.table.renderErrors).toHaveBeenCalled();
    // prettier-ignore
    const lastCallArgAfterSecond =
      header.table.renderErrors.mock.calls[
      header.table.renderErrors.mock.calls.length - 1
      ][0];
    expect(Array.isArray(lastCallArgAfterSecond)).toBe(true);
    expect(lastCallArgAfterSecond[0].id).toBe('2');
    // Теперь разрешаем первый (старый) — он не должен перезаписать результат
    resolveFirst([{ id: '1', type: 'aType', status: 'new' }]);
    await first;
    // последний вызов всё ещё должен ссылаться на данные второго ответа
    // prettier-ignore
    const lastCallArgAfterFirst =
      header.table.renderErrors.mock.calls[
      header.table.renderErrors.mock.calls.length - 1
      ][0];
    expect(lastCallArgAfterFirst[0].id).toBe('2');
  });
});
