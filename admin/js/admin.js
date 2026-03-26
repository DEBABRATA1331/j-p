/**
 * J&P Banquet Admin – Shared JavaScript
 * Handles: Auth check, API fetch wrapper, logout, toast, sidebar
 */

// Detect environment: use localhost backend in dev, Render URL in production
const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:3000'
  : 'https://jandp-banquet-api.onrender.com'; // Update with your Render URL after deploy

/* ── AUTH ─────────────────────────── */
function requireAuth() {
  const token = localStorage.getItem('jandp_admin_token');
  if (!token) {
    window.location.href = 'index.html';
    return;
  }
  // Attach logout button (all pages that include this script)
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) logoutBtn.addEventListener('click', logout);

  // Sidebar mobile toggle
  const hamburger = document.getElementById('hamburger');
  const sidebar = document.getElementById('sidebar');
  if (hamburger && sidebar) {
    hamburger.addEventListener('click', () => sidebar.classList.toggle('open'));
    document.addEventListener('click', (e) => {
      if (sidebar.classList.contains('open') && !sidebar.contains(e.target) && e.target !== hamburger) {
        sidebar.classList.remove('open');
      }
    });
  }
}

function logout() {
  localStorage.removeItem('jandp_admin_token');
  window.location.href = 'index.html';
}

/* ── API FETCH WRAPPER (Express REST Backend) ────────────── */
async function apiFetch(path, method = 'GET', body = null) {
  const token = localStorage.getItem('jandp_admin_token');

  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  };

  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(`${API_BASE}${path}`, options);

  // Token expired or invalid – force logout
  if (res.status === 401) {
    logout();
    throw new Error('Session expired. Please log in again.');
  }

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || `Request failed (${res.status})`);
  }

  return data;
}

/* ── TOAST ────────────────────────── */
let toastTimeout;
function showToast(msg, type = 'success') {
  const toast = document.getElementById('toast');
  const msgEl = document.getElementById('toast-msg');
  if (!toast || !msgEl) return;
  clearTimeout(toastTimeout);
  msgEl.textContent = msg;
  toast.className = `toast ${type} show`;
  const icon = toast.querySelector('i');
  if (icon) {
    icon.className = type === 'success'
      ? 'fa-solid fa-circle-check'
      : 'fa-solid fa-circle-exclamation';
  }
  toastTimeout = setTimeout(() => toast.classList.remove('show'), 3500);
}
