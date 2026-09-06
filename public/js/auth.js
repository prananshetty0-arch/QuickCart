// ============ Login & Signup page logic ============

function setupPasswordToggle() {
  const toggle = document.getElementById('togglePass');
  const passInput = document.getElementById('password');
  if (!toggle || !passInput) return;
  toggle.addEventListener('click', () => {
    const isPass = passInput.type === 'password';
    passInput.type = isPass ? 'text' : 'password';
    toggle.textContent = isPass ? 'Hide' : 'Show';
  });
}

function showFormError(msg) {
  const el = document.getElementById('formError');
  if (!el) return;
  el.textContent = msg;
  el.style.display = msg ? 'block' : 'none';
}

document.addEventListener('DOMContentLoaded', () => {
  setupPasswordToggle();

  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      showFormError('');
      const btn = document.getElementById('loginSubmitBtn');
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;

      btn.disabled = true;
      btn.textContent = 'Logging in...';
      try {
        const data = await apiFetch('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });
        Auth.setToken(data.token);
        Auth.setUser(data.user);
        const params = new URLSearchParams(window.location.search);
        window.location.href = params.get('next') || '/index.html';
      } catch (err) {
        showFormError(err.message);
        btn.disabled = false;
        btn.textContent = 'Log In';
      }
    });
  }

  const signupForm = document.getElementById('signupForm');
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      showFormError('');
      const btn = document.getElementById('signupSubmitBtn');
      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const phone = document.getElementById('phone').value.trim();
      const password = document.getElementById('password').value;

      btn.disabled = true;
      btn.textContent = 'Creating account...';
      try {
        const data = await apiFetch('/auth/signup', {
          method: 'POST',
          body: JSON.stringify({ name, email, phone, password }),
        });
        Auth.setToken(data.token);
        Auth.setUser(data.user);
        window.location.href = '/index.html';
      } catch (err) {
        showFormError(err.message);
        btn.disabled = false;
        btn.textContent = 'Create Account';
      }
    });
  }
});
