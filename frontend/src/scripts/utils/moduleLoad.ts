/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */
import { t } from './i18n.js';

//  Универсальная функция обработки ошибок загрузки модулей
export function handleModuleLoadError(context: string, err: unknown, hideLoading?: (btn?: HTMLElement) => void, btn?: HTMLElement) {
  try {
    console.error(context, err);
  } catch (e) {
    // ignore logging errors
  }

  //  Используется для динамических импортов (lazy loading) модулей интерфейса
  if (typeof hideLoading === 'function') {
    try {
      hideLoading(btn);
    } catch (hideErr) {
      try {
        console.warn('hideLoading failed:', hideErr);
      } catch (e) {
        /* ignore */
      }
    }
  }

  // Переведённое сообщение об ошибке загрузки модуля
  try {
    alert(t('moduleLoadFailed'));
  } catch (alertErr) {
    try {
      alert('Failed to load UI module. Please reload the page.');
    } catch (e) {
      /* ignore */
    }
  }
}

export default handleModuleLoadError;
