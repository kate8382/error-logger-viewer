// eslint
// универсальный API-клиент для взаимодействия с сервером ошибок или локальным хранилищем в режиме демо
export const API_BASE_URL = (typeof globalThis !== 'undefined' && (globalThis as any).API_BASE_URL) || 'http://localhost:3000';

export type Mode = 'server' | 'demo';

export class ErrorApi {
  mode: Mode;
  baseUrl: string;
  localKey: string;

  constructor(mode: Mode = 'server') {
    this.mode = mode;
    this.baseUrl = API_BASE_URL;
    this.localKey = 'errorsLocal';
  }

  async getErrors(params: Record<string, any> = {}): Promise<any> {
    if (this.mode === 'server') {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, value as string);
        }
      });
      const res = await fetch(`${this.baseUrl}/errors?${searchParams}`);
      return await res.json();
    } else {
      const raw = localStorage.getItem(this.localKey) || '[]';
      const errors = JSON.parse(raw);
      return errors;
    }
  }

  async getStats(by = 'status'): Promise<any> {
    if (this.mode === 'server') {
      const res = await fetch(`${this.baseUrl}/errors/stats?by=${by}`);
      if (!res.ok) {
        console.error(`[ErrorApi] Stats request failed: ${res.status} ${res.statusText}`);
        return {};
      }
      return await res.json();
    }
    return {};
  }

  async createError(data: Record<string, any>): Promise<any> {
    if (this.mode === 'server') {
      const res = await fetch(`${this.baseUrl}/errors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return await res.json();
    } else {
      const raw = localStorage.getItem(this.localKey) || '[]';
      const errors = JSON.parse(raw);
      const id = Date.now().toString();
      const now = new Date().toISOString();
      const item = { ...data, id, createdAt: now };
      errors.push(item);
      localStorage.setItem(this.localKey, JSON.stringify(errors));
      return item;
    }
  }

  async deleteError(id: string): Promise<boolean> {
    if (this.mode === 'server') {
      await fetch(`${this.baseUrl}/errors/${id}`, { method: 'DELETE' });
    } else {
      const raw = localStorage.getItem(this.localKey) || '[]';
      let errors = JSON.parse(raw);
      errors = errors.filter((e: any) => e.id !== id);
      localStorage.setItem(this.localKey, JSON.stringify(errors));
    }
    return true;
  }

  async updateError(id: string, data: Record<string, any>): Promise<any | null> {
    if (this.mode === 'server') {
      const res = await fetch(`${this.baseUrl}/errors/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return await res.json();
    } else {
      const raw = localStorage.getItem(this.localKey) || '[]';
      const errors = JSON.parse(raw);
      const idx = errors.findIndex((e: any) => e.id === id);
      if (idx !== -1) {
        const now = new Date().toISOString();
        const item = { ...data, id, updatedAt: now };
        errors[idx] = item;
        localStorage.setItem(this.localKey, JSON.stringify(errors));
        return item;
      }
      return null;
    }
  }

  setMode(mode: Mode) {
    this.mode = mode;
  }
}
