import type { ErrorItem } from 'errors';
import { HeaderManager } from '../../frontend/src/scripts/header';
import type { ErrorTable } from '../../frontend/src/scripts/table';

// Мокаем ErrorApi для demo-режима
jest.mock('../../frontend/src/scripts/api', () => {
  return {
    ErrorApi: jest.fn().mockImplementation(() => ({
      getErrors: () => Promise.resolve(mockErrors),
    })),
  };
});

// Два набора данных для тестов
let mockErrors: ErrorItem[] = [];

describe('HeaderManager фильтрация', () => {
  let header: HeaderManager & { table: Partial<ErrorTable> & { renderErrors?: jest.Mock } };
  beforeEach(() => {
    header = new HeaderManager() as HeaderManager & { table: Partial<ErrorTable> & { renderErrors?: jest.Mock } };
    header.sections = { table: { style: { display: '' } } } as any;
    header.table = { getErrors: () => mockErrors, renderErrors: jest.fn() } as any;
    header.filteredErrors = undefined as unknown as ErrorItem[] | undefined;
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
      stats: document.getElementById('errorStats') as HTMLElement,
      chart: document.getElementById('errorsChart') as HTMLElement,
      table: document.getElementById('errorTableSection') as HTMLElement,
    };
    // Запускаем фильтрацию по секции "Таблица ошибок"
    header.handleSearch('Таблица ошибок');
    expect(header.sections.table!.style.display).toBe('');
    expect(header.sections.stats!.style.display).toBe('none');
    expect(header.sections.chart!.style.display).toBe('none');
  });

  it('фильтрует ошибки по таблице (массив)', async () => {
    mockErrors = [
      { id: '1', type: 'TypeError', status: 'new' },
      { id: '2', type: 'ReferenceError', status: 'fixed' },
      { id: '3', type: 'TypeError', status: 'new' },
    ];
    header.api.getErrors = (params?: Record<string, string | number | boolean | undefined>) => Promise.resolve(mockErrors);
    await header.filterTable('Type Error');
    expect(header.filteredErrors).toBeDefined();
    expect(header.filteredErrors!.length).toBe(2);
    expect(header.filteredErrors![0].type).toBe('TypeError');
    expect(header.filteredErrors![1].type).toBe('TypeError');

    await header.filterTable('new');
    expect(header.filteredErrors).toBeDefined();
    expect(header.filteredErrors!.length).toBe(2);
    expect(header.filteredErrors![0].status).toBe('new');
    expect(header.filteredErrors![1].status).toBe('new');
  });

  it('игнорирует устаревшие ответы (requestId)', async () => {
    // контролируемые промисы
    let resolveFirst!: (v: ErrorItem[]) => void;
    let resolveSecond!: (v: ErrorItem[]) => void;
    const p1: Promise<ErrorItem[]> = new Promise((res: (v: ErrorItem[]) => void) => {
      resolveFirst = res;
    });
    const p2: Promise<ErrorItem[]> = new Promise((res: (v: ErrorItem[]) => void) => {
      resolveSecond = res;
    });
    // первый вызов вернёт p1, второй — p2
    let call = 0;
    header.api.getErrors = (_params?: Record<string, string | number | boolean | undefined>) => {
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
      (header.table.renderErrors as jest.Mock).mock.calls[
      (header.table.renderErrors as jest.Mock).mock.calls.length - 1
      ][0];
    expect(Array.isArray(lastCallArgAfterSecond)).toBe(true);
    expect(lastCallArgAfterSecond[0].id).toBe('2');
    // Теперь разрешаем первый (старый) — он не должен перезаписать результат
    resolveFirst([{ id: '1', type: 'aType', status: 'new' }]);
    await first;
    // последний вызов всё ещё должен ссылаться на данные второго ответа
    // prettier-ignore
    const lastCallArgAfterFirst =
      (header.table.renderErrors as jest.Mock).mock.calls[
      (header.table.renderErrors as jest.Mock).mock.calls.length - 1
      ][0];
    expect(lastCallArgAfterFirst[0].id).toBe('2');
  });
});
