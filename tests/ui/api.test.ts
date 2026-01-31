import { ErrorApi } from '../../frontend/src/scripts/api';
import type { ErrorItem, NewError } from '../../frontend/src/scripts/utils/errors';

// Тест для проверки работы ErrorApi в demo-режиме
describe('ErrorApi', () => {
  it('должен создавать ошибку в demo-режиме', async () => {
    const api = new ErrorApi('demo');
    const error = await api.createError({ message: 'Test error' } as NewError);
    expect(error).toHaveProperty('id');
    expect(error.message).toBe('Test error');
  });

  it('должен возвращать массив ошибок в demo-режиме', async () => {
    const api = new ErrorApi('demo');
    await api.createError({ message: 'Test error 2' } as NewError);
    const errors: ErrorItem[] = await api.getErrors();
    expect(Array.isArray(errors)).toBe(true);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toHaveProperty('id');
  });

  it('должен удалять ошибку в demo-режиме', async () => {
    const api = new ErrorApi('demo');
    const error = await api.createError({ message: 'To delete' } as NewError);
    await api.deleteError(error.id);
    const errorsAfterDelete: ErrorItem[] = await api.getErrors();
    expect(errorsAfterDelete.find((e) => e.id === error.id)).toBeUndefined();
  });

  it('должен обновлять ошибку в demo-режиме', async () => {
    const api = new ErrorApi('demo');
    const error = await api.createError({ message: 'To update' } as NewError);
    const updated = await api.updateError(error.id, {
      ...error,
      message: 'Updated message',
    } as Partial<NewError>);
    expect(updated).not.toBeNull();
    expect(updated!.message).toBe('Updated message');
  });
});
