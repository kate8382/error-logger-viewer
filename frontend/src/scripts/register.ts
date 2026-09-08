import { setChildren } from 'redom';
import { t, getCurrentLang, onLangChange, setLang } from './utils/i18n';
import { createElement, translateNodes, qsa } from './utils/dom';

export class Register {
  container: HTMLElement | null;
  lang: 'en' | 'ru';
  // Ссылки на перемещаемые элементы и их оригинальные позиции
  private logoNode: HTMLElement | null = null;
  private logoOrigParent: Node | null = null;
  private logoOrigNext: Node | null = null;

  private titleLinkNode: HTMLElement | null = null;
  private titleOrigParent: Node | null = null;
  private titleOrigNext: Node | null = null;
  private langNode: HTMLElement | null = null;
  private langOrigParent: Node | null = null;
  private langOrigNext: Node | null = null;
  private form: HTMLFormElement | null = null;
  private nameInput: HTMLInputElement | null = null;
  private projectInput: HTMLInputElement | null = null;
  private emailInput: HTMLInputElement | null = null;
  private passwordInput: HTMLInputElement | null = null;
  private guestLink: HTMLAnchorElement | null = null;

  constructor() {
    this.container = document.getElementById('registerSection');
    // Подписка на смену языка — обновляем переводы в секции
    onLangChange(() => this.translatePage());
    this.lang = getCurrentLang();
  }

  init(): void {
    if (!this.container) return;
    this.render();
    this.mount();
    this.translatePage();
    this.captureElements();
    this.bind();
  }

  // Перемещает логотип и заголовок из aside/header в блок регистрации
  mount(): void {
    if (!this.container) return;
    const brandZone = this.container.querySelector<HTMLElement>('.register__brand-zone');
    if (!brandZone) return;

    // Логотип — переносим весь ссылочный узел из aside (anchor), чтобы не разрывать ссылку
    const logoAnchor = document.querySelector<HTMLElement>('.sidebar > a');
    if (logoAnchor && !this.logoNode) {
      this.logoNode = logoAnchor;
      this.logoOrigParent = logoAnchor.parentNode;
      this.logoOrigNext = logoAnchor.nextSibling;
      try {
        brandZone.appendChild(logoAnchor);
      } catch {}
    }

    // Заголовок проекта (ссылка в header) - переносим саму ссылку
    const headerLink = document.querySelector<HTMLElement>('.header__title > a');
    if (headerLink && !this.titleLinkNode) {
      this.titleLinkNode = headerLink;
      this.titleOrigParent = headerLink.parentNode;
      this.titleOrigNext = headerLink.nextSibling as Node | null;
      try {
        // Вставляем заголовок внутрь brandZone (после логотипа)
        brandZone.appendChild(headerLink);
      } catch {}
    }

    // Переключатель языка — вставляем визуальную копию в секцию регистрации
    const langSwitch = document.querySelector<HTMLElement>('.header__lang-switch');
    if (langSwitch && !this.langNode) {
      try {
        const clone = langSwitch.cloneNode(true) as HTMLElement;
        // Удаляем потенциальные id-дубликаты
        clone.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'));
        // Подготовим соответствие оригинал <-> клон для кнопок
        const origButtons = Array.from(langSwitch.querySelectorAll<HTMLButtonElement>('.lang-btn'));
        const cloneButtons = Array.from(clone.querySelectorAll<HTMLButtonElement>('.lang-btn'));
        // Копируем вычисленные стили для контейнера и для каждой кнопки, чтобы клон выглядел как оригинал
        try {
          const copyComputed = (src: Element, dst: HTMLElement) => {
            const cs = window.getComputedStyle(src as Element);
            // небольшой набор свойств для копирования — достаточно для визуального соответствия
            const props = ['display','padding','font','font-size','color','background','background-color','border','outline','width','height','align-items','justify-content','gap','cursor', 'color'];
            props.forEach((p) => {
              const v = cs.getPropertyValue(p);
              if (v) dst.style.setProperty(p, v);
            });
          };
          // копируем для контейнера
          copyComputed(langSwitch, clone as HTMLElement);
          // для кнопок: навесим делегирующие клики и скопируем стили
          cloneButtons.forEach((btn, i) => {
            const orig = origButtons[i];
            if (orig) {
              // копируем стиль кнопки
              copyComputed(orig, btn as HTMLElement);
              // синхронизируем data-lang
              const dataLang = orig.getAttribute('data-lang') || (orig.textContent || '').trim().toLowerCase();
              btn.setAttribute('data-lang', dataLang || '');
              // при клике на клон — триггерим клик оригинала (сохраняем оригинальную логику и обработчики)
              btn.addEventListener('click', (e) => {
                e.preventDefault();
                try { orig.click(); } catch { /* ignore */ }
              });
            }
          });
        } catch {}

        const wrapper = this.container.querySelector<HTMLElement>('.register');
        const rightEl = wrapper ? wrapper.querySelector<HTMLElement>('.register__right') : null;
        if (wrapper) {
          if (rightEl) wrapper.insertBefore(clone, rightEl);
          else wrapper.appendChild(clone);
          // Set active state according to current language
          try {
            const cur = getCurrentLang();
            clone.querySelectorAll<HTMLButtonElement>('.lang-btn').forEach((btn) => {
              const dl = (btn.getAttribute('data-lang') || '').toLowerCase();
              btn.classList.toggle('is-active', dl === cur);
              btn.setAttribute('aria-pressed', String(dl === cur));
            });
          } catch {}
          this.langNode = clone;
        }
      } catch {}
    }
  }

  // Возвращает перемещённые элементы на их исходные места
  unmount(): void {
    // возвращаем логотип
    if (this.logoNode && this.logoOrigParent) {
      try {
        if (this.logoOrigNext && this.logoOrigNext.parentNode === this.logoOrigParent) {
          this.logoOrigParent.insertBefore(this.logoNode, this.logoOrigNext);
        } else {
          this.logoOrigParent.appendChild(this.logoNode);
        }
      } catch {}
      this.logoNode = null;
      this.logoOrigParent = null;
      this.logoOrigNext = null;
    }

    // возвращаем заголовок
    if (this.titleLinkNode && this.titleOrigParent) {
      try {
        if (this.titleOrigNext && this.titleOrigNext.parentNode === this.titleOrigParent) {
          this.titleOrigParent.insertBefore(this.titleLinkNode, this.titleOrigNext);
        } else {
          this.titleOrigParent.appendChild(this.titleLinkNode);
        }
      } catch {}
      this.titleLinkNode = null;
      this.titleOrigParent = null;
      this.titleOrigNext = null;
    }

    // удаляем вставленную копию переключателя языка (оригинал остаётся на месте)
    // if (this.langNode && this.langNode.parentNode) {
    //   try {
    //     this.langNode.parentNode.removeChild(this.langNode);
    //   } catch {}
    //   this.langNode = null;
    // }
    // оригинал `.header__lang-switch` не трогаем здесь
  }

  private render(): void {
    if (!this.container) return;

    const registerText = t('registerText');
    const registerFeatureRealtime = t('registerFeatureRealtime');
    const registerFeatureTeam = t('registerFeatureTeam');
    const registerFeatureAnalytics = t('registerFeatureAnalytics');
    const registerFormName = t('registerFormName');
    const registerFormProject = t('registerFormProject');
    const registerFormEmail = t('registerFormEmail');
    const registerFormPassword = t('registerFormPassword');
    const registerButtonSignup = t('registerButtonSignup');
    const registerLinkGuest = t('registerLinkGuest');
    const registerSubtitle = t('registerSubtitle');

    // Блок, в который мы временно переместим существующие элементы (логотип и заголовок)
    const branding = createElement('div', { className: 'register__branding' },
      // Вставляем пустую зону для бренда — туда mount() будет перемещать существующие DOM-узлы
      createElement('div', { className: 'register__brand-zone' }),
      createElement('p', { className: 'register__text', dataI18n: 'registerText' }, registerText),
      createElement('ul', { className: 'register__features', attrs: { 'aria-hidden': 'false' } },
        createElement('li', { dataI18n: 'registerFeatureRealtime' }, registerFeatureRealtime),
        createElement('li', { dataI18n: 'registerFeatureTeam' }, registerFeatureTeam),
        createElement('li', { dataI18n: 'registerFeatureAnalytics' }, registerFeatureAnalytics)
      )
    );

    const left = createElement('div', { className: 'register__left', role: 'complementary', attrs: { 'aria-hidden': 'false' } }, branding);

    const formEl = createElement('form', { className: 'register__form', id: 'registerForm', attrs: { novalidate: 'true' }, role: 'form' },
      createElement('label', { className: 'visually-hidden', attrs: { for: 'r-name' } }, registerFormName),
      createElement('input', { className: 'input', id: 'r-name', name: 'name', type: 'text', required: true, attrs: { placeholder: 'Your name', 'data-i18n-placeholder': 'registerFormName' } }),

      createElement('label', { className: 'visually-hidden', attrs: { for: 'r-project' } }, registerFormProject),
      createElement('input', { className: 'input', id: 'r-project', name: 'project', type: 'text', attrs: { placeholder: 'Project name (optional)', 'data-i18n-placeholder': 'registerFormProject' } }),

      createElement('label', { className: 'visually-hidden', attrs: { for: 'r-email' } }, registerFormEmail),
      createElement('input', { className: 'input', id: 'r-email', name: 'email', type: 'email', required: true, attrs: { placeholder: 'Email', 'data-i18n-placeholder': 'registerFormEmail' } }),

      createElement('label', { className: 'visually-hidden', attrs: { for: 'r-password' } }, registerFormPassword),
      createElement('input', { className: 'input', id: 'r-password', name: 'password', type: 'password', required: true, attrs: { placeholder: 'Password', 'data-i18n-placeholder': 'registerFormPassword' } }),

      createElement('div', { className: 'register__controls', role: 'group' },
        createElement('button', { className: 'btn btn--primary', type: 'submit', dataI18n: 'registerButtonSignup' }, registerButtonSignup),
        createElement('a', { className: 'register__guest', id: 'continueGuest', role: 'button', dataI18n: 'registerLinkGuest', attrs: { href: '#' } }, registerLinkGuest)
      )
    );

    const right = createElement('div', { className: 'register__right', role: 'main' },
      createElement('h2', { className: 'register__subtitle', dataI18n: 'registerSubtitle' }, registerSubtitle),
      formEl,
    );

    const wrapper = createElement('div', { className: 'register' }, left, right);

    setChildren(this.container, [wrapper]);
  }

  private captureElements(): void {
    if (!this.container) return;
    this.form = this.container.querySelector<HTMLFormElement>('#registerForm');
    this.nameInput = this.container.querySelector<HTMLInputElement>('#r-name');
    this.projectInput = this.container.querySelector<HTMLInputElement>('#r-project');
    this.emailInput = this.container.querySelector<HTMLInputElement>('#r-email');
    this.passwordInput = this.container.querySelector<HTMLInputElement>('#r-password');
    this.guestLink = this.container.querySelector<HTMLAnchorElement>('#continueGuest');
  }

  private bind(): void {
    if (this.form) {
      this.form.addEventListener('submit', this.onSubmit.bind(this));
    }
    if (this.guestLink) {
      this.guestLink.addEventListener('click', this.onGuest.bind(this));
    }
  }

  private onSubmit(e: Event): void {
    e.preventDefault();
    const name = (this.nameInput?.value || '').trim();
    const projectRaw = (this.projectInput?.value || '').trim();
    const project = projectRaw || 'Solo Project';
    const email = (this.emailInput?.value || '').trim();
    const password = (this.passwordInput?.value || '').trim();

    if (!name) {
      this.announce(t('registerErrorName'));
      return;
    }
    if (!email) {
      this.announce(t('registerErrorEmail'));
      return;
    }
    if (!password) {
      this.announce(t('registerErrorPassword'));
      return;
    }

    const user = { name, project, email, mode: 'user' };
    try {
      localStorage.setItem('currentUser', JSON.stringify(user));
    } catch {}
    this.announce(t('registerRegisteredDemo'));
    // TODO: replace with actual navigation / API call to server
  }

  private onGuest(e: Event): void {
    e.preventDefault();
    const user = { name: 'unknown', project: 'unknown', email: 'unknown', mode: 'guest' };
    try {
      localStorage.setItem('currentUser', JSON.stringify(user));
    } catch {}
    this.announce(t('registerGuestContinue'));
    // TODO: navigate to main app
  }

  private announce(message: string): void {
    // simple accessible announcement — can be improved with live region
    // eslint-disable-next-line no-alert
    alert(message);
  }

  translatePage(): void {
    if (!this.container) return;
    // переводим текстовые узлы
    translateNodes(this.container, '[data-i18n]');

    // placeholder для полей
    const placeholders = qsa<HTMLElement>('[data-i18n-placeholder]', this.container);
    placeholders.forEach((element) => {
      const key = element.getAttribute('data-i18n-placeholder') || '';
      element.setAttribute('placeholder', t(key) || key);
    });

    // aria-label handled by semantic labels where needed; no automatic aria-label setting
  }
}

export default Register;

