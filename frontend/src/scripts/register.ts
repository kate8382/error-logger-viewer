/* eslint-disable prettier/prettier */
/* eslint-disable no-empty */
import { setChildren } from 'redom';
import { t, getCurrentLang, onLangChange } from './utils/i18n';
import { createElement, translateNodes, qsa } from './utils/dom';
import type { ErrorApi } from './api';

export class Register {
  container: HTMLElement | null;
  lang: 'en' | 'ru';
  private api: ErrorApi | null;
  // Links to movable elements and their original positions
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
  private signupGoogleBtn: HTMLButtonElement | null = null;
  private signInLink: HTMLAnchorElement | null = null;

  constructor(api: ErrorApi | null = null) {
    this.api = api;
    this.container = document.getElementById('registerSection');
    // Subscribe to lang change — update section translations
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

  // Move logo and title from aside/header to register block
  mount(): void {
    if (!this.container) return;
    // Registration fixed over page: block background scroll to avoid second scrollbar
    document.body.classList.add('register-open');
    const brandZone = this.container.querySelector<HTMLElement>('.register__brand-zone');
    if (!brandZone) return;

    // Logo — move whole anchor from aside
    const logoAnchor = document.querySelector<HTMLElement>('.sidebar > a');
    if (logoAnchor && !this.logoNode) {
      this.logoNode = logoAnchor;
      this.logoOrigParent = logoAnchor.parentNode;
      this.logoOrigNext = logoAnchor.nextSibling;
      try {
        brandZone.appendChild(logoAnchor);
      } catch {}
    }

    // Project title (link in header) - move the link itself
    const headerLink = document.querySelector<HTMLElement>('.header__title > a');
    if (headerLink && !this.titleLinkNode) {
      this.titleLinkNode = headerLink;
      this.titleOrigParent = headerLink.parentNode;
      this.titleOrigNext = headerLink.nextSibling as Node | null;
      try {
        // Insert title into brandZone (after logo)
        brandZone.appendChild(headerLink);
      } catch {}
    }

    // Lang switch — insert visual copy in register section
    const langSwitch = document.querySelector<HTMLElement>('.header__lang-switch');
    if (langSwitch && !this.langNode) {
      try {
        const clone = langSwitch.cloneNode(true) as HTMLElement;
        // Prepare mapping orig <-> clone for buttons
        const origButtons = Array.from(langSwitch.querySelectorAll<HTMLButtonElement>('.lang-btn'));
        const cloneButtons = Array.from(clone.querySelectorAll<HTMLButtonElement>('.lang-btn'));
        try {
          // Don't copy computed styles (they set inline and override CSS) for buttons: attach delegated clicks.
          cloneButtons.forEach((btn, i) => {
            const orig = origButtons[i];
            if (orig) {
              // sync data-lang
              const dataLang = orig.getAttribute('data-lang') || (orig.textContent || '').trim().toLowerCase();
              btn.setAttribute('data-lang', dataLang || '');
              // on click of clone — trigger original click (keep original logic)
              btn.addEventListener('click', (e) => {
                e.preventDefault();
                try { orig.click(); } catch { /* ignore */ }
              });
            }
          });
        } catch {}

        // Use the existing container (section#registerSection) as wrapper
        const wrapperEl = this.container as HTMLElement;
        const rightEl = wrapperEl.querySelector<HTMLElement>('.register__right');
        if (rightEl) {
          try { rightEl.insertBefore(clone, rightEl.firstChild); } catch { wrapperEl.insertBefore(clone, rightEl); }
        } else if (wrapperEl) {
          wrapperEl.appendChild(clone);
        }
          // Remove any inline styles copied previously (they очень часто перекрывают SCSS правила)
          try {
            clone.removeAttribute('style');
            clone.querySelectorAll<HTMLElement>('[style]').forEach((el) => el.removeAttribute('style'));
          } catch {}

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
        } catch {}
    }
  }

  // Return moved elements to original places
  unmount(): void {
    document.body.classList.remove('register-open');
    // return logo
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

    // return title
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

    // remove lang switch clone from register section
    if (this.langNode) {
      this.langNode.remove();
      this.langNode = null;
    }
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

    // Block to move existing elements (logo and title) temporarily
    const branding = createElement('div', { className: 'register__branding flex' },
      // Insert empty brand zone — mount() will move existing DOM nodes here
      createElement('div', { className: 'register__brand-zone flex' }),
      createElement('p', { className: 'register__text', dataI18n: 'registerText' }, registerText),
      createElement('ul', { className: 'register__features flex', attrs: { 'aria-hidden': 'false' } },
        createElement('li', { dataI18n: 'registerFeatureRealtime' }, registerFeatureRealtime),
        createElement('li', { dataI18n: 'registerFeatureTeam' }, registerFeatureTeam),
        createElement('li', { dataI18n: 'registerFeatureAnalytics' }, registerFeatureAnalytics)
      )
    );

    const left = createElement('div', { className: 'register__left flex', role: 'complementary', attrs: { 'aria-hidden': 'false' } }, branding);

    const formEl = createElement('form', { className: 'register__form flex', id: 'registerForm', attrs: { novalidate: 'true' }, role: 'form' },
      createElement('label', { className: 'visually-hidden', attrs: { for: 'r-name' } }, registerFormName),
      createElement('input', { className: 'register__input', id: 'r-name', name: 'name', type: 'text', required: true, attrs: { placeholder: registerFormName, 'data-i18n-placeholder': 'registerFormName' } }),

      createElement('label', { className: 'visually-hidden', attrs: { for: 'r-email' } }, registerFormEmail),
      createElement('input', { className: 'register__input', id: 'r-email', name: 'email', type: 'email', required: true, attrs: { placeholder: registerFormEmail, 'data-i18n-placeholder': 'registerFormEmail' } }),

      createElement('label', { className: 'visually-hidden', attrs: { for: 'r-password' } }, registerFormPassword),
      createElement('input', { className: 'register__input', id: 'r-password', name: 'password', type: 'password', required: true, attrs: { placeholder: registerFormPassword, 'data-i18n-placeholder': 'registerFormPassword' } }),

      createElement('label', { className: 'visually-hidden', attrs: { for: 'r-project' } }, registerFormProject),
      createElement('input', { className: 'register__input', id: 'r-project', name: 'project', type: 'text', attrs: { placeholder: registerFormProject, 'data-i18n-placeholder': 'registerFormProject' } }),

      // Controls: primary signup, secondary Google signup, and footer links (guest / sign in)
      createElement('div', { className: 'register__controls flex', role: 'group' },
        createElement('button', { className: 'register__signup', type: 'submit', dataI18n: 'registerButtonSignup' }, registerButtonSignup),
        createElement('button', { className: 'register__signup-google', type: 'button', id: 'signupGoogle', dataI18n: 'registerSignUpGoogle' }, t('registerSignUpGoogle') || 'Sign up with Google'),
        createElement('div', { className: 'register__account flex' }, createElement('span', { className: 'register__account-text', dataI18n: 'registerHaveAccount' }, t('registerHaveAccount') || 'I have an account.'), createElement('a', { className: 'register__signin', id: 'signInLink', dataI18n: 'registerSignIn', attrs: { href: '#' } }, t('registerSignIn') || 'Sign in'))
        ),
        createElement('div', { className: 'register__controls-footer' },
          createElement('a', { className: 'register__guest', id: 'continueGuest', role: 'button', dataI18n: 'registerLinkGuest', attrs: { href: '#' } }, registerLinkGuest)
      )
    );

    const right = createElement('div', { className: 'register__right flex', role: 'main' },
      createElement('h2', { className: 'register__subtitle', dataI18n: 'registerSubtitle' }, registerSubtitle),
      formEl,
    );

    // Use existing container (section#registerSection) which already has class 'register'
    setChildren(this.container, [left, right]);
  }


  private captureElements(): void {
    if (!this.container) return;
    this.form = this.container.querySelector<HTMLFormElement>('#registerForm');
    this.nameInput = this.container.querySelector<HTMLInputElement>('#r-name');
    this.projectInput = this.container.querySelector<HTMLInputElement>('#r-project');
    this.emailInput = this.container.querySelector<HTMLInputElement>('#r-email');
    this.passwordInput = this.container.querySelector<HTMLInputElement>('#r-password');
    this.guestLink = this.container.querySelector<HTMLAnchorElement>('#continueGuest');
    this.signupGoogleBtn = this.container.querySelector<HTMLButtonElement>('#signupGoogle');
    this.signInLink = this.container.querySelector<HTMLAnchorElement>('#signInLink');
  }

  private bind(): void {
    if (this.form) {
      this.form.addEventListener('submit', this.onSubmit.bind(this));
    }
    if (this.guestLink) {
      this.guestLink.addEventListener('click', this.onGuest.bind(this));
    }
    if (this.signupGoogleBtn) {
      this.signupGoogleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.announce(t('registerSignUpGoogle') || 'Sign up with Google');
      });
    }
    if (this.signInLink) {
      this.signInLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.announce(t('registerSignIn') || 'Sign in');
      });
    }
  }

  private async onSubmit(e: Event): Promise<void> {
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
      await this.api?.registerUser({ name, email, project });
      localStorage.setItem('currentUser', JSON.stringify(user));
    } catch (err) {
      console.error('[Register] registration failed', err);
      this.announce(t('registerErrorRequest'));
      return;
    }
    this.announce(t('registerRegisteredDemo'));
    this.showMain();
  }

  private onGuest(e: Event): void {
    e.preventDefault();
    const user = { name: 'unknown', project: 'unknown', email: 'unknown', mode: 'guest' };
    try {
      localStorage.setItem('currentUser', JSON.stringify(user));
    } catch {}
    this.showMain();
  }

  // Hide register form and return logo/title/lang switch to original places
  private showMain(): void {
    this.unmount();
    if (this.container) this.container.style.display = 'none';
  }


  private announce(message: string): void {
    // simple accessible announcement — can be improved with live region

    alert(message);
  }

  translatePage(): void {
    if (!this.container) return;
    // translate text nodes
    translateNodes(this.container, '[data-i18n]');

    // placeholder for fields
    const placeholders = qsa<HTMLElement>('[data-i18n-placeholder]', this.container);
    placeholders.forEach((element) => {
      const key = element.getAttribute('data-i18n-placeholder') || '';
      element.setAttribute('placeholder', t(key) || key);
    });

    // aria-label handled by semantic labels where needed; no automatic aria-label setting
  }
}


export default Register;

