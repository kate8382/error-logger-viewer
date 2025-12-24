import { t } from './i18n';

// Универсальная функция обработки ошибок загрузки модулей
// eslint-disable-next-line no-unused-vars
export function handleModuleLoadError(context: string, err: unknown, hideLoading?: (btn?: HTMLElement) => void, btn?: HTMLElement) {
  console.error(context, err);

  //  Используется для динамических импортов (lazy loading) модулей интерфейса
  if (typeof hideLoading === 'function') {
    try {
      hideLoading(btn);
    } catch (hideErr) {
      console.warn('hideLoading failed:', hideErr);
    }
  }

  // Переведённое сообщение об ошибке загрузки модуля
  try {
    alert(t('moduleLoadFailed'));
  } catch {
    try {
      alert('Failed to load UI module. Please reload the page.');
    } catch {
      /* ignore */
    }
  }
}

export default handleModuleLoadError;
