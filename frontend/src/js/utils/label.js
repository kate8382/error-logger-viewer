// Получение перевода для типа/статуса ошибки
export function getLabel(key, lang, translations) {
  // Для типов ошибок используем префикс errorType_
  if (key && translations && lang) {
    const typeKey = key.startsWith('errorType_') ? key : 'errorType_' + key;
    return translations[lang][typeKey] || translations[lang][key] || key;
  }
  return key;
}
