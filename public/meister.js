const form = document.getElementById('meisterForm');
const passwordInput = document.getElementById('meisterPassword');
const statusEl = document.getElementById('meisterStatus');
const submitBtn = document.getElementById('meisterSubmit');

const MEISTER_HOME = '/meister/blog';

function redirectHome() {
  window.location.href = '/index.html';
}

function setStatus(message, type) {
  statusEl.textContent = message;
  statusEl.className = `meister-login-status${type ? ` ${type}` : ''}`;
}

function showServerRequired() {
  setStatus('Open this page at http://localhost:3000/meister (run npm run dev first).', 'error');
}

async function checkAccess() {
  if (window.location.protocol === 'file:') {
    showServerRequired();
    return;
  }

  try {
    const res = await fetch('/api/meister/status', { credentials: 'same-origin' });
    const data = await res.json();

    if (data.blocked) {
      redirectHome();
      return;
    }

    if (data.authenticated) {
      window.location.replace(MEISTER_HOME);
      return;
    }

    if (data.attemptsLeft < 3) {
      setStatus(`${data.attemptsLeft} attempt${data.attemptsLeft === 1 ? '' : 's'} remaining`, 'warning');
    }
  } catch {
    showServerRequired();
  }
}

checkAccess();

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  setStatus('');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Signing in…';

  try {
    const res = await fetch('/api/meister/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ password: passwordInput.value }),
    });
    const data = await res.json();

    if (data.success) {
      window.location.replace(MEISTER_HOME);
      return;
    }

    if (data.blocked) {
      redirectHome();
      return;
    }

    let message = data.error || 'Incorrect password';
    if (data.attemptsLeft !== undefined) {
      message += ` · ${data.attemptsLeft} attempt${data.attemptsLeft === 1 ? '' : 's'} left`;
    }
    setStatus(message, 'error');
    passwordInput.value = '';
    passwordInput.focus();
  } catch {
    showServerRequired();
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Sign In';
  }
});