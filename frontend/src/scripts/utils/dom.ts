// Функции для работы с DOM-элементами
export function qsa<T extends Element = Element>(selector: string, root: ParentNode = document): T[] {
  return Array.from(root.querySelectorAll<T>(selector));
}

// Возвращает первый элемент, соответствующий селектору, или null
export function qs<T extends Element = Element>(selector: string, root: ParentNode = document): T | null {
  return root.querySelector<T>(selector);
}

// Возвращает первый элемент, соответствующий селектору, или выбрасывает ошибку
export function assertExists<T extends Element = Element>(el: T | null, selector?: string): T {
  if (!el) {
    throw new Error(selector ? `Element not found: ${selector}` : 'Element not found');
  }
  return el;
}

// Создает элемент с опциональными классами, атрибутами и текстом
export function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  options?: {
    className?: string,
    attrs?: Record<string, string>,
    text?: string,
  },
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag) as HTMLElementTagNameMap[K];
  if (options?.className) el.className = options.className;
  if (options?.text) el.textContent = options.text;
  if (options?.attrs) {
    for (const [k, v] of Object.entries(options.attrs)) el.setAttribute(k, v);
  }
  return el;
}

// Простая делегация событий: root должен содержать элементы-мишени
// eslint-disable-next-line no-unused-vars
export function delegate<E extends Event = Event>(root: ParentNode, selector: string, type: string, handler: (event: E, target: Element) => void) {
  root.addEventListener(type, (ev: Event) => {
    const target = ev.target as Element | null;
    if (!target) return;
    const match = target.closest(selector);
    if (match && root instanceof Node && root.contains(match)) {
      handler(ev as E, match);
    }
  });
}
