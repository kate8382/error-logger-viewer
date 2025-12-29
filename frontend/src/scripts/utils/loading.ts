import { createElement } from './dom';

// Универсальный центральный спиннер для любого контейнера
function getSpinnerImg(type?: 'page' | 'delete' | 'save') {
  // Page spinner (larger)
  if (type === 'page') {
    return (
      '<svg class="loading-svg" width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<path d="M2 20C2 29.941 10.059 38 20 38C29.941 38 38 29.941 38 20C38 10.059 29.941 2 20 2C17.6755 2 15.454 2.4405 13.414 3.243" stroke="#9255FD" stroke-width="4" stroke-miterlimit="10" stroke-linecap="round"/>' +
      '' +
      '</svg>'
    );
  }

  // Button spinner (small) — color differs for save/delete
  if (type === 'delete') {
    return (
      '<svg class="loading-svg" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<g clip-path="url(#clip0_224_6321)">' +
      '<path d="M3.00008 8.03996C3.00008 10.8234 5.2566 13.08 8.04008 13.08C10.8236 13.08 13.0801 10.8234 13.0801 8.03996C13.0801 5.25648 10.8236 2.99996 8.04008 2.99996C7.38922 2.99996 6.7672 3.1233 6.196 3.348" stroke="#FFDFDF" stroke-width="2" stroke-miterlimit="10" stroke-linecap="round"/>' +
      '</g>' +
      '<defs><clipPath id="clip0_224_6321"><rect width="16" height="16" fill="white"/></clipPath></defs>' +
      '' +
      '</svg>'
    );
  }

  // save (default small spinner)
  return (
    '<svg class="loading-svg" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<g clip-path="url(#clip0_224_6321)">' +
    '<path d="M3.00008 8.03996C3.00008 10.8234 5.2566 13.08 8.04008 13.08C10.8236 13.08 13.0801 10.8234 13.0801 8.03996C13.0801 5.25648 10.8236 2.99996 8.04008 2.99996C7.38922 2.99996 6.7672 3.1233 6.196 3.348" stroke="#DECCFE" stroke-width="2" stroke-miterlimit="10" stroke-linecap="round"/>' +
    '</g>' +
    '<defs><clipPath id="clip0_224_6321"><rect width="16" height="16" fill="white"/></clipPath></defs>' +
    '' +
    '</svg>'
  );
}

export function showCenterSpinner(container: HTMLElement | null, type: 'page' | 'delete' | 'save' = 'page') {
  if (!container) return; // Если уже есть спиннер — не добавляем второй
  if (container.querySelector('.center-spinner')) return;
  const spinnerDiv = createElement('div', { className: 'center-spinner' });
  spinnerDiv.innerHTML = getSpinnerImg(type);
  spinnerDiv.style.position = 'absolute';
  spinnerDiv.style.top = '50%';
  spinnerDiv.style.left = '50%';
  spinnerDiv.style.transform = 'translate(-50%, -50%)';
  spinnerDiv.style.zIndex = '10';
  // Для корректного позиционирования контейнер должен быть position: relative
  if (getComputedStyle(container).position === 'static') {
    container.style.position = 'relative';
  }
  container.appendChild(spinnerDiv);
}

export function hideCenterSpinner(container: HTMLElement | null) {
  if (!container) return;
  const spinnerDiv = container.querySelector('.center-spinner');
  if (spinnerDiv) spinnerDiv.remove();
}

// Спиннер для кнопок (save/delete)
export function showLoading(button: HTMLElement, type?: 'page' | 'delete' | 'save') {
  if (!button) return;
  try {
    console.debug('[loading] showLoading called', button, type);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
  } catch (e) {
    /* ignore */
  }
  if (button.querySelector('.spinner')) return;
  button.classList.add('loading');
  button.setAttribute('aria-busy', 'true');

  const spinner = createElement('span', { className: 'spinner' }) as HTMLSpanElement;
  spinner.innerHTML = getSpinnerImg(type);
  button.insertBefore(spinner, button.firstChild);
}

export function hideLoading(button: HTMLElement) {
  if (!button) return;
  try {
    console.debug('[loading] hideLoading called', button);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
  } catch (e) {
    /* ignore */
  }
  button.classList.remove('loading');
  button.removeAttribute('aria-busy');

  const spinner = button.querySelector('.spinner');
  if (spinner) {
    spinner.remove();
  }
}
