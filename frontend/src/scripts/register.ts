import { setChildren } from 'redom';
import { t, getLabel, onLangChange } from './utils/i18n';
import { createElement, translateNodes, qsa } from './utils/dom';

export class Register {
  container: HTMLElement | null;
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
  }

  init(): void {
    if (!this.container) return;
    this.render();
    this.translatePage();
    this.captureElements();
    this.bind();
  }

  private render(): void {
    if (!this.container) return;

    const branding = createElement('div', { className: 'register__branding' },
      createElement('img', { className: 'register__logo', attrs: { src: 'assets/src/img/logo.png', alt: 'App logo' }, dataI18n: 'logoProjectTitle' }),
      createElement('h1', { className: 'register__title', dataI18n: 'registerTitle', attrs: { 'data-i18n-aria-label': 'titleAria' } }, 'Error Logger & Viewer'),
      createElement('p', { className: 'register__text', dataI18n: 'registerText', attrs: { 'data-i18n-aria-label': 'registerTextAria' } }, 'Start tracking errors and get insights for your project'),
      createElement('ul', { className: 'register__features', attrs: { 'aria-hidden': 'false' } },
        createElement('li', { dataI18n: 'registerFeatureRealtime', attrs: { 'data-i18n-aria-label': 'registerFeatureRealtimeAria' } }, 'Real-time error tracking'),
        createElement('li', { dataI18n: 'registerFeatureTeam', attrs: { 'data-i18n-aria-label': 'registerFeatureTeamAria' } }, 'Team & Solo projects'),
        createElement('li', { dataI18n: 'registerFeatureAnalytics', attrs: { 'data-i18n-aria-label': 'registerFeatureAnalyticsAria' } }, 'Advanced analytics')
      )
    );

    const left = createElement('div', { className: 'register__left', role: 'complementary', attrs: { 'aria-hidden': 'false' } }, branding);

    const formEl = createElement('form', { className: 'register__form', id: 'registerForm', attrs: { novalidate: 'true' }, role: 'form' },
      createElement('label', { className: 'visually-hidden', attrs: { for: 'r-name' } }, 'User Name'),
      createElement('input', { className: 'input', id: 'r-name', name: 'name', type: 'text', required: true, attrs: { placeholder: 'Your name', 'data-i18n-placeholder': 'registerFormName', 'data-i18n-aria-label': 'registerFormNameAria' } }),

      createElement('label', { className: 'visually-hidden', attrs: { for: 'r-project' } }, 'Project Name'),
      createElement('input', { className: 'input', id: 'r-project', name: 'project', type: 'text', attrs: { placeholder: 'Project name (optional)', 'data-i18n-placeholder': 'registerFormProject', 'data-i18n-aria-label': 'registerFormProjectAria' } }),

      createElement('label', { className: 'visually-hidden', attrs: { for: 'r-email' } }, 'Email'),
      createElement('input', { className: 'input', id: 'r-email', name: 'email', type: 'email', required: true, attrs: { placeholder: 'Email', 'data-i18n-placeholder': 'registerFormEmail', 'data-i18n-aria-label': 'registerFormEmailAria' } }),

      createElement('label', { className: 'visually-hidden', attrs: { for: 'r-password' } }, 'Password'),
      createElement('input', { className: 'input', id: 'r-password', name: 'password', type: 'password', required: true, attrs: { placeholder: 'Password', 'data-i18n-placeholder': 'registerFormPassword', 'data-i18n-aria-label': 'registerFormPasswordAria' } }),

      createElement('div', { className: 'register__controls', role: 'group', attrs: { 'data-i18n-aria-label': 'registerControlsAria' } },
        createElement('button', { className: 'btn btn--primary', type: 'submit', dataI18n: 'registerButtonSignup', attrs: { 'data-i18n-aria-label': 'registerButtonSignupAria' } }, 'Sign Up'),
        createElement('a', { className: 'register__guest', id: 'continueGuest', role: 'button', dataI18n: 'registerLinkGuest', attrs: { href: '#', 'data-i18n-aria-label': 'registerLinkGuestAria' } }, 'Continue as Guest →')
      )
    );

    const right = createElement('div', { className: 'register__right', role: 'main' },
      createElement('h2', { className: 'register__subtitle', dataI18n: 'registerSubtitle' }, 'Sign Up'),
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
      this.announce('Please enter your name');
      return;
    }
    if (!email) {
      this.announce('Please enter your email');
      return;
    }
    if (!password) {
      this.announce('Please enter your password');
      return;
    }

    const user = { name, project, email, mode: 'user' };
    try {
      localStorage.setItem('currentUser', JSON.stringify(user));
    } catch {}
    this.announce('Registered (demo).');
    // TODO: replace with actual navigation / API call to server
  }

  private onGuest(e: Event): void {
    e.preventDefault();
    const user = { name: 'unknown', project: 'unknown', email: 'unknown', mode: 'guest' };
    try {
      localStorage.setItem('currentUser', JSON.stringify(user));
    } catch {}
    this.announce('Continuing as guest (demo)');
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

    // aria-label через ключи
    const ariaElements = qsa<HTMLElement>('[data-i18n-aria-label]', this.container);
    ariaElements.forEach((elm) => {
      const key = elm.getAttribute('data-i18n-aria-label') || '';
      if (key) elm.setAttribute('aria-label', t(key));
    });
  }
}

export default Register;
