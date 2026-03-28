/**
 * J&P Banquet Admin – Shared JavaScript
 * Handles: Auth check, API fetch wrapper, logout, toast, sidebar
 */

const API_BASE = 'https://script.google.com/macros/s/AKfycbysGcuUK2vWqWXuDJaI0jCndqNeZghnnP7SRcOgx-a2VmVFtIrkGIoaYY5qrwD0zR1URw/exec';

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

/* ── API FETCH WRAPPER (App Script Version) ────────────── */
async function apiFetch(action, method = 'GET', body = null) {
  // We must use x-www-form-urlencoded to avoid App Script CORS preflight blocks
  const url = API_BASE;
  
  const formData = new URLSearchParams();
  formData.append('action', action);
  formData.append('method', method);
  
  if (body) {
    formData.append('data', JSON.stringify(body));
  }

  const res = await fetch(url, {
    method: 'POST',
    body: formData,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });

  const text = await res.text();
  
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    throw new Error('Invalid response from server. Make sure the App Script Web App is deployed as "Anyone".');
  }

  if (data.status === 'error' || data.error) {
    throw new Error(data.error || data.message || 'Operation failed');
  }

  return data.data || data;
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
