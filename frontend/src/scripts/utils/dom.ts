import { t } from './i18n';

// Функции для работы с DOM-элементами
export function qsa<T extends Element = Element>(selector: string, root: ParentNode = document): T[] {
  return Array.from(root.querySelectorAll<T>(selector));
}

// Возвращает первый элемент, соответствующий селектору, или null
export function qs<T extends Element = Element>(selector: string, root: ParentNode = document): T | null {
  return root.querySelector<T>(selector);
}

// Возвращает первый элемент, соответствующий селектору, или выбрасывает ошибку (когда элемент обязателен)
export function assertExists<T extends Element = Element>(el: T | null, selector?: string): T {
  if (!el) {
    throw new Error(selector ? `Element not found: ${selector}` : 'Element not found');
  }
  return el;
}

// Опции для createElement
export interface CreateElementOptions {
  className?: string;
  attrs?: Record<string, string>;
  text?: string;
  dataI18n?: string;
  ariaLabel?: string;
}

// Создает элемент с опциональными классами, атрибутами и текстом
export function createElement<K extends keyof HTMLElementTagNameMap>(tag: K, options?: CreateElementOptions, textContent?: string | undefined): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag) as HTMLElementTagNameMap[K];
  if (options?.className) el.className = options.className;
  if (options?.text) el.textContent = options.text;
  if (options?.attrs) {
    for (const [k, v] of Object.entries(options.attrs)) el.setAttribute(k, v);
  }
  if (options?.dataI18n) el.setAttribute('data-i18n', options.dataI18n);
  if (options?.ariaLabel) el.setAttribute('aria-label', options.ariaLabel);
  if (textContent !== undefined && textContent !== null) {
    el.textContent = textContent;
  }
  return el;
}

// Простая делегация событий: root должен содержать элементы-мишени
// Поддерживаем generic для типа события и целевого элемента
// eslint-disable-next-line no-unused-vars
export function delegate<E extends Event = Event, T extends Element = Element>(root: ParentNode, selector: string, type: string, handler: (_event: E, target: T) => void): void {
  root.addEventListener(type, (ev: Event) => {
    const target = ev.target as Element | null;
    if (!target) return;
    const match = target.closest(selector) as T | null;
    if (match && root instanceof Node && root.contains(match)) {
      handler(ev as E, match);
    }
  });
}

// Перевод всех элементов в корневом узле по селектору (data-i18n)
export function translateNodes(root: ParentNode, sel: string): void {
  qsa<HTMLElement>(sel, root).forEach((el) => {
    const key = el.getAttribute('data-i18n') ?? '';
    if (key) el.textContent = t(key) || key;
  });
}
