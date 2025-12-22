import { ErrorApi } from '../api';

// Тест для проверки работы ErrorApi в demo-режиме
describe('ErrorApi', () => {
  it('должен создавать ошибку в demo-режиме', async () => {
    const api = new ErrorApi('demo');
    const error = await api.createError({ message: 'Test error' });
    expect(error).toHaveProperty('id');
    expect(error.message).toBe('Test error');
  });

  it('должен возвращать массив ошибок в demo-режиме', async () => {
    const api = new ErrorApi('demo');
    await api.createError({ message: 'Test error 2' });
    const errors = await api.getErrors();
    expect(Array.isArray(errors)).toBe(true);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toHaveProperty('id');
  });

  it('должен удалять ошибку в demo-режиме', async () => {
    const api = new ErrorApi('demo');
    const error = await api.createError({ message: 'To delete' });
    await api.deleteError(error.id);
    const errors = await api.getErrors();
    expect(errors.find((e) => e.id === error.id)).toBeUndefined();
  });

  it('должен обновлять ошибку в demo-режиме', async () => {
    const api = new ErrorApi('demo');
    const error = await api.createError({ message: 'To update' });
    const updated = await api.updateError(error.id, {
      ...error,
      message: 'Updated message',
    });
    expect(updated.message).toBe('Updated message');
  });
});
