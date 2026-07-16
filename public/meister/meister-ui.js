(function initMeisterChrome() {
  document.body.classList.add('meister-mode');

  const mobileMenu = document.getElementById('mobileMenu');
  if (mobileMenu && !mobileMenu.querySelector('.meister-logout-mobile')) {
    const logoutBtn = document.createElement('button');
    logoutBtn.type = 'button';
    logoutBtn.className = 'meister-logout-mobile';
    logoutBtn.textContent = 'Log Out';
    logoutBtn.addEventListener('click', () => window.meisterLogout());
    mobileMenu.appendChild(logoutBtn);
  }
})();

async function meisterLogout() {
  await fetch('/api/meister/logout', { method: 'POST', credentials: 'same-origin' });
  window.location.href = '/index.html';
}

window.meisterLogout = meisterLogout;
