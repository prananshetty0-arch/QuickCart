// ============ Shared navbar behaviour (runs on every page) ============
document.addEventListener('DOMContentLoaded', async () => {
  const user = Auth.getUser();
  const loggedIn = Auth.isLoggedIn();

  const loginBtnNav = document.getElementById('loginBtnNav');
  const userMenu = document.getElementById('userMenuLoggedIn');
  const avatarBtn = document.getElementById('avatarBtn');
  const userDropdown = document.getElementById('userDropdown');
  const adminLink = document.getElementById('adminLink');
  const logoutBtn = document.getElementById('logoutBtn');

  if (loggedIn && user) {
    if (loginBtnNav) loginBtnNav.style.display = 'none';
    if (userMenu) userMenu.style.display = 'block';
    if (avatarBtn) avatarBtn.textContent = user.name ? user.name.charAt(0).toUpperCase() : 'U';
    if (adminLink && user.isAdmin) adminLink.style.display = 'flex';
  } else {
    if (loginBtnNav) loginBtnNav.style.display = 'inline-flex';
    if (userMenu) userMenu.style.display = 'none';
  }

  if (avatarBtn) {
    avatarBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      userDropdown.classList.toggle('open');
    });
    document.addEventListener('click', () => userDropdown.classList.remove('open'));
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      apiFetch('/cart').catch(() => {}); // no-op, just avoid unused var warnings in some setups
      Auth.logout();
    });
  }

  // Cart badge
  const cartBadge = document.getElementById('cartBadge');
  if (cartBadge && loggedIn) {
    try {
      const data = await apiFetch('/cart');
      if (data.totalItems > 0) {
        cartBadge.textContent = data.totalItems > 99 ? '99+' : data.totalItems;
        cartBadge.classList.remove('hidden');
      }
    } catch (e) { /* silent */ }
  }

  // Desktop search -> navigate to shop with query
  const navSearchInput = document.getElementById('navSearchInput');
  if (navSearchInput) {
    const params = new URLSearchParams(window.location.search);
    if (params.get('search')) navSearchInput.value = params.get('search');

    navSearchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const q = navSearchInput.value.trim();
        window.location.href = `/index.html?search=${encodeURIComponent(q)}`;
      }
    });
  }

  // Mobile drawer
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const drawer = document.getElementById('mobileDrawer');
  const backdrop = document.getElementById('mobileDrawerBackdrop');
  if (hamburgerBtn && drawer) {
    const openDrawer = () => { drawer.classList.add('open'); backdrop.classList.add('open'); };
    const closeDrawer = () => { drawer.classList.remove('open'); backdrop.classList.remove('open'); };
    hamburgerBtn.addEventListener('click', openDrawer);
    backdrop.addEventListener('click', closeDrawer);

    const mobileSearch = document.getElementById('mobileSearchInput');
    if (mobileSearch) {
      mobileSearch.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          window.location.href = `/index.html?search=${encodeURIComponent(mobileSearch.value.trim())}`;
        }
      });
    }
    const mobileLogout = document.getElementById('mobileLogoutBtn');
    if (mobileLogout) mobileLogout.addEventListener('click', () => Auth.logout());

    const mobileAdminLink = document.getElementById('mobileAdminLink');
    if (mobileAdminLink && user && user.isAdmin) mobileAdminLink.style.display = 'flex';
    if (mobileAdminLink && (!user || !user.isAdmin)) mobileAdminLink.style.display = 'none';

    const mobileAuthArea = document.getElementById('mobileAuthArea');
    if (mobileAuthArea) {
      mobileAuthArea.innerHTML = loggedIn
        ? `<a href="/orders.html">📦 My Orders</a><a href="/profile.html">👤 Profile</a><button class="drawer-link" id="mobileLogoutBtn2">🚪 Logout</button>`
        : `<a href="/login.html">🔑 Login</a><a href="/signup.html">📝 Sign up</a>`;
      const l2 = document.getElementById('mobileLogoutBtn2');
      if (l2) l2.addEventListener('click', () => Auth.logout());
    }
  }

  // Theme toggle button
  const themeBtn = document.getElementById('themeToggleBtn');
  if (themeBtn) themeBtn.addEventListener('click', toggleTheme);
});
