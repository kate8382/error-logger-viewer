export class Register {
  container: HTMLElement | null;

  constructor() {
    this.container = document.getElementById('registerSection');
  }

  init() {
    if (!this.container) return;
    this.render();
    this.bind();
  }

  render() {
    if (!this.container) return;
    this.container.innerHTML = `
      <div class="register">
        <div class="register__left">
          <div class="register__branding">
            <h1 class="register__title">Sign Up</h1>
            <p class="register__subtitle">Start tracking errors and get insights for your project.</p>
          </div>
        </div>
        <div class="register__right">
          <form class="register__form" id="registerForm" novalidate>
            <label class="visually-hidden" for="r-name">Name</label>
            <input id="r-name" name="name" placeholder="Your name" required>

            <label class="visually-hidden" for="r-project">Project (optional)</label>
            <input id="r-project" name="project" placeholder="Project name (optional)">

            <div class="register__controls">
              <button type="submit" class="btn btn--primary">Get started</button>
              <button type="button" id="continueGuest" class="btn btn--ghost">Continue as guest</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  bind() {
    const form = document.getElementById('registerForm') as HTMLFormElement | null;
    const guestBtn = document.getElementById('continueGuest');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const data = new FormData(form);
        const name = String(data.get('name') || '').trim();
        const project = String(data.get('project') || '').trim();
        if (!name) {
          // simple client validation
          alert('Please enter your name');
          return;
        }
        // For now we store minimal user info in localStorage as a demo flow
        const user = { name, project: project || null, mode: 'user' };
        try {
          localStorage.setItem('currentUser', JSON.stringify(user));
        } catch {}
        alert('Registered (demo). You can extend server flow later.');
        // TODO: navigate to main app section
      });
    }
    if (guestBtn) {
      guestBtn.addEventListener('click', () => {
        const user = { name: 'Guest', project: null, mode: 'guest' };
        try {
          localStorage.setItem('currentUser', JSON.stringify(user));
        } catch {}
        // TODO: navigate to main app section
        alert('Continuing as guest (demo)');
      });
    }
  }

  translatePage() {
    // Placeholder for i18n integration
  }
}

export default Register;
