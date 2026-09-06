// ============ API helper ============
const API_BASE = '/api';

const Auth = {
  getToken() { return localStorage.getItem('qc_token'); },
  setToken(token) { localStorage.setItem('qc_token', token); },
  getUser() {
    try { return JSON.parse(localStorage.getItem('qc_user') || 'null'); } catch { return null; }
  },
  setUser(user) { localStorage.setItem('qc_user', JSON.stringify(user)); },
  isLoggedIn() { return !!this.getToken(); },
  logout() {
    localStorage.removeItem('qc_token');
    localStorage.removeItem('qc_user');
    window.location.href = '/login.html';
  },
};

async function apiFetch(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const token = Auth.getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(API_BASE + path, { ...options, headers });
  } catch (networkErr) {
    throw new Error('Could not reach the server. Please check your connection.');
  }

  let data = null;
  const text = await res.text();
  if (text) {
    try { data = JSON.parse(text); } catch { data = null; }
  }

  if (!res.ok) {
    if (res.status === 401 && Auth.isLoggedIn()) {
      Auth.logout();
    }
    const message = (data && data.message) || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data;
}

// Redirect to login if not authenticated (used on protected pages)
function requireLogin() {
  if (!Auth.isLoggedIn()) {
    window.location.href = `/login.html?next=${encodeURIComponent(window.location.pathname)}`;
    return false;
  }
  return true;
}

function formatMoney(n) {
  return '₹' + Number(n || 0).toLocaleString('en-IN');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : String(str);
  return div.innerHTML;
}

function starString(rating) {
  const full = Math.round(rating);
  return '★'.repeat(full) + '☆'.repeat(5 - full);
}
