export function getCurrentLang() {
  return (window.app && window.app.lang)
    ? window.app.lang
    : ((navigator.language || navigator.userLanguage).startsWith('ru') ? 'ru' : 'en');
}