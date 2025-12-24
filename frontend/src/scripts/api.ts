// Универсальный API-клиент для работы с ошибками
export const API_BASE_URL = (typeof globalThis !== 'undefined' && (globalThis as any).API_BASE_URL) || 'http://localhost:3000';

import { request } from './utils/request';
import type { ErrorItem, NewError, Stats } from './types/errors';

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

  async getErrors(params: Record<string, any> = {}): Promise<ErrorItem[]> {
    if (this.mode === 'server') {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      });
      return (await request<ErrorItem[]>(`${this.baseUrl}/errors?${searchParams}`)) || [];
    } else {
      const raw = localStorage.getItem(this.localKey) || '[]';
      const errors = JSON.parse(raw) as ErrorItem[];
      return errors;
    }
  }

  // Получить статистику по статусу, типу или дням
  async getStats(by: 'status' | 'type' | 'day' = 'status'): Promise<Stats> {
    if (this.mode === 'server') {
      try {
        return (await request<Stats>(`${this.baseUrl}/errors/stats?by=${by}`)) || {};
      } catch (e) {
        console.error('[ErrorApi] Ошибка запроса статистики', e);
        return {};
      }
    }
    return {};
  }

  async createError(data: NewError): Promise<ErrorItem> {
    if (this.mode === 'server') {
      const res = await request<ErrorItem>(`${this.baseUrl}/errors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      } as RequestInit);
      if (!res) throw new Error('Empty response from createError');
      return res;
    } else {
      const raw = localStorage.getItem(this.localKey) || '[]';
      const errors = JSON.parse(raw) as ErrorItem[];
      const id = Date.now().toString();
      const now = new Date().toISOString();
      const item: ErrorItem = { ...(data as any), id, firstSeen: now, lastSeen: now };
      errors.push(item);
      localStorage.setItem(this.localKey, JSON.stringify(errors));
      return item;
    }
  }

  async deleteError(id: string): Promise<boolean> {
    if (this.mode === 'server') {
      await request<void>(`${this.baseUrl}/errors/${id}`, { method: 'DELETE' } as RequestInit);
    } else {
      const raw = localStorage.getItem(this.localKey) || '[]';
      let errors = JSON.parse(raw) as ErrorItem[];
      errors = errors.filter((e) => e.id !== id);
      localStorage.setItem(this.localKey, JSON.stringify(errors));
    }
    return true;
  }

  async updateError(id: string, data: Partial<NewError>): Promise<ErrorItem | null> {
    if (this.mode === 'server') {
      const res = await request<ErrorItem>(`${this.baseUrl}/errors/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      } as RequestInit);
      return res || null;
    } else {
      const raw = localStorage.getItem(this.localKey) || '[]';
      const errors = JSON.parse(raw) as ErrorItem[];
      const idx = errors.findIndex((e) => e.id === id);
      if (idx !== -1) {
        const now = new Date().toISOString();
        const item: ErrorItem = { ...(data as any), id, lastSeen: now } as ErrorItem;
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
