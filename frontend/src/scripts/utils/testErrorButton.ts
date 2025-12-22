import { t } from './i18n.js';
import handleModuleLoadError from './moduleLoad';
import type { ErrorApi } from '../api';

let testErrorBtn: HTMLButtonElement | null = null;

export function showTestErrorButton(): void {
  if (testErrorBtn) return;
  const btn = document.createElement('button');
  testErrorBtn = btn;
  const setBtnText = () => {
    btn.textContent = t('createTestErrorBtn') || 'Создать тестовую ошибку';
  };
  setBtnText();
  btn.style.position = 'fixed';
  btn.style.bottom = '20px';
  btn.style.right = '20px';
  btn.style.zIndex = '10000';
  btn.style.background = '#a0a0ff';
  btn.style.color = '#222';
  btn.style.padding = '10px 20px';
  btn.style.borderRadius = '8px';
  btn.style.border = 'none';
  btn.style.cursor = 'pointer';
  btn.onclick = async (): Promise<void> => {
    try {
      const mod = (await import('../api')) as unknown as { ErrorApi: typeof ErrorApi };
      const win = window as Window & { app?: { errorApi?: ErrorApi, updateErrorTable?: () => void } };
      const mode = win.app?.errorApi?.mode ?? 'server';
      const api = new mod.ErrorApi(mode);
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
      handleModuleLoadError('Failed to load ErrorApi module', err);
    }
  };
  document.body.appendChild(btn);
  // eslint-disable-next-line no-unused-vars
  const winLang = window as Window & { onLangChange?: (fn: (lang: string) => void) => void };
  winLang.onLangChange?.(setBtnText);
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
