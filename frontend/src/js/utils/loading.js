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