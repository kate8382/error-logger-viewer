// Универсальный API-клиент для работы с ошибками
export const API_BASE_URL = window.API_BASE_URL || 'http://localhost:3000';

export class ErrorApi {
  constructor(mode = 'server') {
    this.mode = mode; // 'server' или 'demo'
    this.baseUrl = API_BASE_URL;
    this.localKey = 'errorsLocal';
  }

  async getErrors(params = {}) {
    if (this.mode === 'server') {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, value);
        }
      });
      const res = await fetch(`${this.baseUrl}/errors?${searchParams}`);
      return await res.json();
    } else {
      let errors = JSON.parse(localStorage.getItem(this.localKey) || '[]');
      // ...фильтрация и сортировка...
      return errors;
    }
  }

  // Получить статистику по статусу, типу или дням
  async getStats(by = 'status') {
    if (this.mode === 'server') {
      const res = await fetch(`${this.baseUrl}/errors/stats?by=${by}`);
      if (!res.ok) {
        console.error(
          `[ErrorApi] Ошибка запроса статистики: ${res.status} ${res.statusText}`,
        );
        return {};
      }
      return await res.json();
    } else {
      // ...локальная агрегация...
      return {};
    }
  }

  async createError(data) {
    if (this.mode === 'server') {
      const res = await fetch(`${this.baseUrl}/errors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return await res.json();
    } else {
      let errors = JSON.parse(localStorage.getItem(this.localKey) || '[]');
      data.id = Date.now().toString();
      data.createdAt = new Date().toISOString();
      errors.push(data);
      localStorage.setItem(this.localKey, JSON.stringify(errors));
      return data;
    }
  }

  async deleteError(id) {
    if (this.mode === 'server') {
      await fetch(`${this.baseUrl}/errors/${id}`, { method: 'DELETE' });
    } else {
      let errors = JSON.parse(localStorage.getItem(this.localKey) || '[]');
      errors = errors.filter((e) => e.id !== id);
      localStorage.setItem(this.localKey, JSON.stringify(errors));
    }
    return true;
  }

  async updateError(id, data) {
    if (this.mode === 'server') {
      const res = await fetch(`${this.baseUrl}/errors/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return await res.json();
    } else {
      let errors = JSON.parse(localStorage.getItem(this.localKey) || '[]');
      const idx = errors.findIndex((e) => e.id === id);
      if (idx !== -1) {
        data.id = id;
        data.updatedAt = new Date().toISOString();
        errors[idx] = data;
        localStorage.setItem(this.localKey, JSON.stringify(errors));
        return data;
      }
      return null;
    }
  }

  setMode(mode) {
    this.mode = mode;
  }
}
