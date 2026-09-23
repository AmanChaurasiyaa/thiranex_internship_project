/* =====================================================================
   THEME TOGGLE
   Toggles the `.dark-theme` class on <body> — every color in styles.css
   is a CSS variable, so this one class swap re-themes the whole page.
   The choice is saved to localStorage so it persists on the next visit.
   ===================================================================== */

const THEME_KEY = 'preferred-theme'; // localStorage key
const toggleBtn = document.getElementById('theme-toggle');

/** Apply a theme ('dark' | 'light') to the page and update the button. */
function applyTheme(theme) {
  const isDark = theme === 'dark';
  document.body.classList.toggle('dark-theme', isDark);

  if (toggleBtn) {
    toggleBtn.setAttribute('aria-pressed', String(isDark));
    toggleBtn.querySelector('.theme-toggle__icon').textContent = isDark ? '☀️' : '🌙';
    toggleBtn.querySelector('.theme-toggle__label').textContent = isDark ? 'Light' : 'Dark';
    toggleBtn.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
  }
}

/** Decide the starting theme: saved choice first, then OS preference. */
function getInitialTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === 'dark' || saved === 'light') return saved;

  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
}

// --- Run on page load ---
applyTheme(getInitialTheme());

// --- Run on button click ---
if (toggleBtn) {
  toggleBtn.addEventListener('click', () => {
    const isDark = document.body.classList.contains('dark-theme');
    const nextTheme = isDark ? 'light' : 'dark';
    applyTheme(nextTheme);
    localStorage.setItem(THEME_KEY, nextTheme); // remember for next visit
  });
}

// --- Small extra: auto-fill the footer's copyright year ---
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();
