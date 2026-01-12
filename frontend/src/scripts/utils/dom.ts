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
export interface CreateElementOptions extends Record<string, any> {
  className?: string;
  id?: string;
  role?: string;
  tabIndex?: number | string;
  style?: string;
  disabled?: boolean;
  href?: string;
  // legacy-friendly: любые data-*, aria-* и др. атрибуты допускаются
  [attr: string]: any;
}

// Создает элемент с опциональными классами, атрибутами и текстом
export function createElement<K extends keyof HTMLElementTagNameMap>(tag: K, options?: CreateElementOptions, ...children: Array<string | number | Node | Array<Node | string | number> | null | undefined>): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag) as HTMLElementTagNameMap[K];
  if (options?.className) el.className = options.className;
  if (options?.text && (!children || children.length === 0)) el.textContent = options.text;
  if (options?.attrs) {
    for (const [k, v] of Object.entries(options.attrs)) {
      if (v === null || v === undefined) continue;
      el.setAttribute(k, String(v));
    }
  }
  if (options?.id) el.id = String(options.id);
  if (options?.role) el.setAttribute('role', String(options.role));
  if (options?.tabIndex !== undefined) el.setAttribute('tabindex', String(options.tabIndex));
  if (options?.style) el.setAttribute('style', String(options.style));
  if (options?.href) el.setAttribute('href', String(options.href));
  if (options?.disabled !== undefined) (el as any).disabled = Boolean(options.disabled);
  if (options?.dataI18n) el.setAttribute('data-i18n', String(options.dataI18n));
  if (options?.ariaLabel) el.setAttribute('aria-label', String(options.ariaLabel));
  if (options?.ariaHidden) el.setAttribute('aria-hidden', String(options.ariaHidden));

  // добавляем дочерние элементы (строки, узлы или их массивы)
  if (children && children.length) {
    const appendChildValue = (c: string | number | Node) => {
      if (typeof c === 'string' || typeof c === 'number') el.appendChild(document.createTextNode(String(c)));
      else if (c != null) el.appendChild(c);
    };

    children.forEach((ch) => {
      if (ch == null) return;
      if (Array.isArray(ch)) {
        ch.forEach((nested) => {
          if (nested == null) return;
          appendChildValue(typeof nested === 'string' ? nested : (nested as Node));
        });
      } else {
        appendChildValue(typeof ch === 'string' ? ch : (ch as Node));
      }
    });
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
