export class ErrorApi {
  constructor(mode = 'server') {
    this.mode = mode; // 'server' или 'demo'
    this.baseUrl = 'http://localhost:3000/errors';
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
      const res = await fetch(`${this.baseUrl}?${searchParams}`);
      return await res.json();
    } else {
      let errors = JSON.parse(localStorage.getItem(this.localKey) || '[]');
      // Фильтрация по всем переданным полям, кроме sort/order
      Object.entries(params).forEach(([key, value]) => {
        if (['sort', 'order'].includes(key)) return;
        if (value !== undefined && value !== null && value !== '') {
          errors = errors.filter(e => e[key] !== undefined && String(e[key]).toLowerCase().includes(String(value).toLowerCase()));
        }
      });
      // Сортировка
      const sort = params.sort;
      const order = params.order;
      if (sort) {
        const ord = order === 'desc' ? -1 : 1;
        if (sort === 'count') {
          errors = errors.sort((a, b) => ((a.count || 0) - (b.count || 0)) * ord);
        } else if (sort === 'firstSeen') {
          const getFirstSeen = err => err.firstSeen || '';
          errors = errors.sort((a, b) => {
            const aValue = getFirstSeen(a) ? new Date(getFirstSeen(a)).getTime() : 0;
            const bValue = getFirstSeen(b) ? new Date(getFirstSeen(b)).getTime() : 0;
            return (aValue - bValue) * ord;
          });
        } else if (sort === 'lastSeen') {
          const getLastSeen = err => err.lastSeen || '';
          errors = errors.sort((a, b) => {
            const aValue = getLastSeen(a) ? new Date(getLastSeen(a)).getTime() : 0;
            const bValue = getLastSeen(b) ? new Date(getLastSeen(b)).getTime() : 0;
            return (aValue - bValue) * ord;
          });
        } else {
          errors = errors.sort((a, b) => (a[sort] < b[sort] ? -1 * ord : a[sort] > b[sort] ? 1 * ord : 0));
        }
      }
      return errors;
    }
  }

  // Получить статистику по статусу, типу или дням
  async getStats(by = 'status') {
    if (this.mode === 'server') {
      const res = await fetch(`http://localhost:3000/errors/stats?by=${by}`);
      if (!res.ok) {
        console.error(`[ErrorApi] Ошибка запроса статистики: ${res.status} ${res.statusText}`);
        return {};
      }
      return await res.json();
    } else {
      // Локальная агрегация для demo-режима
      const errors = JSON.parse(localStorage.getItem(this.localKey) || '[]');
      if (by === 'status') {
        return errors.reduce((acc, e) => {
          const status = e.status || 'new';
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {});
      }
      if (by === 'type') {
        return errors.reduce((acc, e) => {
          const type = e.type || 'Unknown';
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {});
      }
      if (by === 'day') {
        const dayCounts = {};
        errors.forEach(e => {
          const day = (e.lastSeen || e.firstSeen || '').slice(0, 10);
          if (!day) return;
          if (!dayCounts[day]) dayCounts[day] = {};
          const status = e.status || 'new';
          dayCounts[day][status] = (dayCounts[day][status] || 0) + 1;
        });
        return dayCounts;
      }
      return {};
    }
  }

  async createError(data) {
    if (this.mode === 'server') {
      const res = await fetch(this.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
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
      await fetch(`${this.baseUrl}/${id}`, { method: 'DELETE' });
    } else {
      let errors = JSON.parse(localStorage.getItem(this.localKey) || '[]');
      errors = errors.filter(e => e.id !== id);
      localStorage.setItem(this.localKey, JSON.stringify(errors));
    }
  }

  async updateError(id, data) {
    if (this.mode === 'server') {
      const res = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await res.json();
    } else {
      let errors = JSON.parse(localStorage.getItem(this.localKey) || '[]');
      const idx = errors.findIndex(e => e.id === id);
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
