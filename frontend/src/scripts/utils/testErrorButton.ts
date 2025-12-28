/* eslint-disable no-unused-vars */
/* eslint-disable prettier/prettier */

import type { ErrorApi } from '../api';
import { t, onLangChange } from './i18n';
import handleModuleLoadError from './moduleLoad';
import { createElement } from './dom';

let testErrorBtn: HTMLButtonElement | null = null;

export function showTestErrorButton(): void {
  if (testErrorBtn) return;
  const btn = createElement('button', { className: 'test-error-btn' });
  testErrorBtn = btn;
  const setBtnText = () => {
    btn.textContent = t('createTestErrorBtn') || 'Создать тестовую ошибку';
  };
  setBtnText();
  const container = document.querySelector('.container');

  btn.onclick = async (): Promise<void> => {
    if (btn.disabled) return;
    btn.disabled = true;
    try {
      const mod = await import('../api');
      const ErrorApiCtor = (mod as { ErrorApi: new (mode?: string) => any }).ErrorApi;
      const win = window as Window & { app?: { errorApi?: ErrorApi; updateErrorTable?: () => void } };
      const mode = win.app?.errorApi?.mode ?? 'server';
      const api = new ErrorApiCtor(mode) as { createError: (e: any) => Promise<void> };
      await api.createError({
        type: 'TestError',
        message: t('testErrorMsg') || 'Тестовая ошибка для проверки дат',
        firstSeen: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
      });
      win.app?.updateErrorTable?.();
      alert(t('testErrorCreated') || 'Тестовая ошибка создана! Обновите таблицу.');
    } catch (err) {
      console.error('Failed to load ErrorApi module', err);
      handleModuleLoadError('Failed to load ErrorApi module', err, undefined, undefined);
    } finally {
      btn.disabled = false;
    }
  };

  if (container) container.appendChild(btn);
  else document.body.appendChild(btn);

  // Регистрируем слушатель смены языка через экспортированную функцию
  onLangChange(setBtnText);
}

export function hideTestErrorButton(): void {
  if (testErrorBtn && testErrorBtn.parentNode) {
    testErrorBtn.parentNode.removeChild(testErrorBtn);
    testErrorBtn = null;
  }
}

export function updateTestErrorButtonVisibility(): void {
  const win2 = window as Window & { app?: { errorApi?: ErrorApi } };
  const mode = win2.app?.errorApi?.mode ?? 'server';
  if (mode === 'demo') {
    showTestErrorButton();
  } else {
    hideTestErrorButton();
  }
}
