export class ErrorApi {
  constructor(mode = 'server') {
    this.mode = mode; // 'server' или 'demo'
    this.baseUrl = 'http://localhost:3000/errors';
    this.localKey = 'demoErrors';
  }

  async getErrors({ sort, order, filter } = {}) {
    if (this.mode === 'server') {
      const params = new URLSearchParams();
      if (sort) params.append('sort', sort);
      if (order) params.append('order', order);
      if (filter) params.append('filter', filter);
      const res = await fetch(`${this.baseUrl}?${params}`);
      return await res.json();
    } else {
      let errors = JSON.parse(localStorage.getItem(this.localKey) || '[]');
      if (filter) errors = errors.filter(e => String(e.type).toLowerCase() === String(filter).toLowerCase());
      if (sort) {
        const ord = order === 'desc' ? -1 : 1;
        errors = errors.sort((a, b) => (a[sort] < b[sort] ? -1 * ord : a[sort] > b[sort] ? 1 * ord : 0));
      }
      return errors;
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
