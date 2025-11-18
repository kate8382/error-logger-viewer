// Универсальный центральный спиннер для любого контейнера
export function showCenterSpinner(container, type = 'page') {
  if (!container) return; // Если уже есть спиннер — не добавляем второй
  if (container.querySelector('.center-spinner')) return;
  const spinnerDiv = document.createElement('div');
  spinnerDiv.className = 'center-spinner';
  spinnerDiv.innerHTML =
    type === 'page'
      ? '<img src="img/loading.svg" data-i18n="loading" alt="Loading">'
      : type === 'delete'
        ? '<img src="img/load-delete.svg" data-i18n="loading" alt="Loading">'
        : '<img src="img/load-save.svg" data-i18n="loading" alt="Loading">';
  // Ставим абсолютное позиционирование относительно контейнера
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

export function hideCenterSpinner(container) {
  if (!container) return;
  const spinnerDiv = container.querySelector('.center-spinner');
  if (spinnerDiv) spinnerDiv.remove();
}

// Спиннер для кнопок (save/delete)
export function showLoading(button, type) {
  button.classList.add('loading');
  button.setAttribute('aria-busy', 'true');

  const spinner = document.createElement('span');
  spinner.classList.add('spinner');
  button.appendChild(spinner);

  spinner.innerHTML =
    type === 'page'
      ? '<img src="img/loading.svg" data-i18n="loading" alt="Loading">'
      : type === 'delete'
        ? '<img src="img/load-delete.svg" data-i18n="loading" alt="Loading">'
        : '<img src="img/load-save.svg" data-i18n="loading" alt="Loading">';

  // Вставляем спиннер перед текстом кнопки
  button.insertBefore(spinner, button.firstChild);
}

export function hideLoading(button) {
  button.classList.remove('loading');
  button.removeAttribute('aria-busy');

  const spinner = button.querySelector('.spinner');
  if (spinner) {
    spinner.remove();
  }
}
