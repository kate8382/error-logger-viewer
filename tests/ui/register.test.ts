/// <reference types="jest" />

import { Register } from '../../frontend/src/scripts/register';
import { ErrorApi } from '../../frontend/src/scripts/api';
import { request } from '../../frontend/src/shared/request';

jest.mock('../../frontend/src/shared/request', () => ({
  request: jest.fn(async () => ({})),
}));

const requestMock = request as unknown as jest.Mock;

const APP_MARKUP = `
  <aside class="sidebar"><a id="logo" href="#">logo</a><span>menu</span></aside>
  <header class="header">
    <div class="header__title"><a id="titleLink" href="#">Title</a></div>
    <div class="header__lang-switch">
      <button class="lang-btn" data-lang="en">EN</button>
      <button class="lang-btn" data-lang="ru">RU</button>
    </div>
  </header>
  <main>
    <section id="registerSection" class="register"></section>
    <section id="statsSection">stats</section>
  </main>
`;

function setupRegister(api: ErrorApi | null = null): Register {
  document.body.innerHTML = APP_MARKUP;
  const reg = new Register(api);
  reg.init();
  return reg;
}

describe('Register section', () => {
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    localStorage.clear();
    alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => undefined);
    requestMock.mockClear();
  });

  afterEach(() => {
    alertSpy.mockRestore();
  });

  it('renders form controls with i18n attributes on text nodes', () => {
    setupRegister();

    const google = document.getElementById('signupGoogle');
    const signIn = document.querySelector('.register__signin');
    const accountText = document.querySelector('.register__account-text');

    expect(google?.getAttribute('data-i18n')).toBe('registerSignUpGoogle');
    expect(signIn?.getAttribute('data-i18n')).toBe('registerSignIn');
    expect(accountText?.getAttribute('data-i18n')).toBe('registerHaveAccount');
    expect(document.getElementById('r-email')?.getAttribute('data-i18n-placeholder')).toBe('registerFormEmail');
  });

  it('shows an alert and does not register when the name is empty', async () => {
    const api = new ErrorApi('server');
    const registerSpy = jest.spyOn(api, 'registerUser');
    setupRegister(api);

    document.getElementById('registerForm')!.dispatchEvent(new Event('submit', { cancelable: true }));
    await Promise.resolve();

    expect(registerSpy).not.toHaveBeenCalled();
    expect(alertSpy).toHaveBeenCalled();
  });

  it('guest link hides the register section and restores logo, title and language switch', () => {
    setupRegister();

    const logo = document.getElementById('logo')!;
    const titleLink = document.getElementById('titleLink')!;
    expect(document.querySelector('.register__brand-zone')!.contains(logo)).toBe(true);
    expect(document.querySelector('.register__brand-zone')!.contains(titleLink)).toBe(true);

    document.getElementById('continueGuest')!.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

    expect((document.getElementById('registerSection') as HTMLElement).style.display).toBe('none');
    expect(document.querySelector('.sidebar')!.firstElementChild).toBe(logo);
    expect(document.querySelector('.header__title')!.firstElementChild).toBe(titleLink);
    expect(document.querySelectorAll('.header__lang-switch')).toHaveLength(1);
    expect(document.querySelector('.register .header__lang-switch')).toBeNull();
    expect(JSON.parse(localStorage.getItem('currentUser') || '{}').mode).toBe('guest');
  });

  it('registers in server mode via API and then returns elements to place', async () => {
    const api = new ErrorApi('server');
    setupRegister(api);
    const logo = document.getElementById('logo')!;

    (document.getElementById('r-name') as HTMLInputElement).value = 'Kate';
    (document.getElementById('r-email') as HTMLInputElement).value = 'kate@example.com';
    (document.getElementById('r-password') as HTMLInputElement).value = 'secret';
    document.getElementById('registerForm')!.dispatchEvent(new Event('submit', { cancelable: true }));
    await new Promise((r) => setTimeout(r, 0));

    expect(requestMock).toHaveBeenCalledTimes(2);
    expect(requestMock.mock.calls[0][0]).toMatch(/\/users$/);
    expect(requestMock.mock.calls[1][0]).toMatch(/\/projects$/);
    expect(JSON.parse(requestMock.mock.calls[1][1].body)).toEqual({ name: 'Solo Project', owner: 'kate@example.com' });
    expect(document.querySelector('.sidebar')!.firstElementChild).toBe(logo);
  });
});

describe('ErrorApi.registerUser', () => {
  beforeEach(() => {
    requestMock.mockClear();
  });

  it('does not call the server in demo mode', async () => {
    await new ErrorApi('demo').registerUser({ name: 'a', email: 'a@a.com', project: 'p' });
    expect(requestMock).not.toHaveBeenCalled();
  });

  it('propagates server errors so the form can report them', async () => {
    requestMock.mockRejectedValueOnce(new Error('down'));
    await expect(new ErrorApi('server').registerUser({ name: 'a', email: 'a@a.com', project: 'p' })).rejects.toThrow('down');
  });
});
