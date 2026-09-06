// ============ Dark / light theme toggle ============
(function () {
  const stored = localStorage.getItem('qc_theme');
  const initial = stored || 'light';
  document.documentElement.setAttribute('data-theme', initial);

  window.toggleTheme = function () {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('qc_theme', next);
    updateThemeIcon();
  };

  window.updateThemeIcon = function () {
    const btn = document.getElementById('themeToggleIcon');
    if (btn) {
      const current = document.documentElement.getAttribute('data-theme');
      btn.textContent = current === 'dark' ? '☀️' : '🌙';
    }
  };

  document.addEventListener('DOMContentLoaded', updateThemeIcon);
})();
