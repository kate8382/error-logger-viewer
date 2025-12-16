import { t } from './i18n.js';
import handleModuleLoadError from './moduleLoad.js';

let testErrorBtn = null;

export function showTestErrorButton() {
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
  btn.style.zIndex = 10000;
  btn.style.background = '#a0a0ff';
  btn.style.color = '#222';
  btn.style.padding = '10px 20px';
  btn.style.borderRadius = '8px';
  btn.style.border = 'none';
  btn.style.cursor = 'pointer';
  btn.onclick = async () => {
    try {
      const { ErrorApi } = await import('../api.js');
      const mode = window.app && window.app.errorApi ? window.app.errorApi.mode : 'server';
      const api = new ErrorApi(mode);
      await api.createError({
        type: 'TestError',
        message: t('testErrorMsg') || 'Тестовая ошибка для проверки дат',
        firstSeen: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
      });
      if (window.app && typeof window.app.updateErrorTable === 'function') {
        window.app.updateErrorTable();
      }
      alert(t('testErrorCreated') || 'Тестовая ошибка создана! Обновите таблицу.');
    } catch (err) {
      console.error('Failed to load ErrorApi module', err);
      handleModuleLoadError('Failed to load ErrorApi module', err);
    }
  };
  document.body.appendChild(btn);
  if (typeof window.onLangChange === 'function') {
    window.onLangChange(setBtnText);
  }
}

export function hideTestErrorButton() {
  if (testErrorBtn && testErrorBtn.parentNode) {
    testErrorBtn.parentNode.removeChild(testErrorBtn);
    testErrorBtn = null;
  }
}

export function updateTestErrorButtonVisibility() {
  const mode = window.app && window.app.errorApi ? window.app.errorApi.mode : 'server';
  if (mode === 'demo') {
    showTestErrorButton();
  } else {
    hideTestErrorButton();
  }
}
