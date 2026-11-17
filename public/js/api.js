const Api = {
  base: '/api',

  token() { return localStorage.getItem('vardiya_token'); },
  role() { return localStorage.getItem('vardiya_role'); },
  isLoggedIn() { return Boolean(this.token()); },

  setSession(token, role) {
    localStorage.setItem('vardiya_token', token);
    localStorage.setItem('vardiya_role', role);
  },
  clearSession() {
    localStorage.removeItem('vardiya_token');
    localStorage.removeItem('vardiya_role');
  },

  async request(path, { method = 'GET', body } = {}) {
    const headers = { 'Content-Type': 'application/json' };
    if (this.token()) headers['Authorization'] = 'Bearer ' + this.token();
    const res = await fetch(this.base + path, {
      method, headers, body: body ? JSON.stringify(body) : undefined
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Bir şeyler ters gitti.');
    return data;
  },

  requireAuth(expectedRole) {
    if (!this.isLoggedIn()) { window.location.href = '/login.html'; return false; }
    if (expectedRole && this.role() !== expectedRole) {
      window.location.href = this.role() === 'company' ? '/company/dashboard.html' : '/dashboard.html';
      return false;
    }
    return true;
  },

  logout() { this.clearSession(); window.location.href = '/'; }
};

function initialsOf(name) {
  return (name || '?').trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

function showError(el, message) {
  el.textContent = message;
  el.style.display = 'block';
}
function hideError(el) {
  el.style.display = 'none';
}

/* ============================================================
   Ortak gorsel/format yardimcilari (Shiftly tasarim sistemi)
   ============================================================ */
const CATEGORY_STYLE = {
  'Tadım & Promosyon': { emoji: '🍷', img: '/img/kategori/tadim.jpg',  bg: 'linear-gradient(140deg,#FB7185 0%,#9F1239 100%)' },
  'Fuar Standı':       { emoji: '🏛️', img: '/img/kategori/fuar.jpg',   bg: 'linear-gradient(140deg,#34D399 0%,#065F46 100%)' },
  'Konser & Etkinlik': { emoji: '🎤', img: '/img/kategori/konser.jpg', bg: 'linear-gradient(140deg,#A78BFA 0%,#4C1D95 100%)' },
  'Hostes/Host':       { emoji: '🎀', img: '/img/kategori/hostes.jpg', bg: 'linear-gradient(140deg,#E879F9 0%,#86198F 100%)' },
  'Anket & Saha':      { emoji: '📋', img: '/img/kategori/anket.jpg',  bg: 'linear-gradient(140deg,#38BDF8 0%,#075985 100%)' },
  'Depo & Lojistik':   { emoji: '📦', img: '/img/kategori/depo.jpg',   bg: 'linear-gradient(140deg,#818CF8 0%,#312E81 100%)' }
};
const FALLBACK_STYLE = { emoji: '🎯', img: '/img/kategori/genel.jpg', bg: 'linear-gradient(140deg,#3B4BF7 0%,#182ae0 100%)' };

function catStyle(cat) { return CATEGORY_STYLE[cat] || FALLBACK_STYLE; }

function daysUntil(dateStr) {
  const d = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((d - today) / 86400000);
}

function dateLabel(job) {
  const n = daysUntil(job.eventDate);
  if (n <= 0) return 'Bugün';
  if (n === 1) return 'Yarın';
  if (n < 7) return n + ' gün sonra';
  return new Date(job.eventDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
}

/* Deterministik degerler — id'ye bagli, her yuklemede ayni kalir */
function viewCount(job) { return 30 + ((job.id * 37) % 170); }
function matchScore(job) { return 88 + ((job.id * 7) % 11); }

function money(n) { return '₺' + Number(n || 0).toLocaleString('tr-TR'); }

/* Google Analytics Events */
function trackGA(eventName, params = {}) {
  if (typeof gtag !== 'undefined') {
    gtag('event', eventName, params);
  }
}

// Growth Events
function onSignup(role) {
  trackGA('sign_up', { method: role, signup_role: role });
}

function onJobView(jobId, category) {
  trackGA('view_item', { item_id: jobId, category: category });
}

function onJobApply(jobId, jobTitle) {
  trackGA('add_to_cart', { item_id: jobId, item_name: jobTitle, event_category: 'başvuru' });
}

function onMatch(jobId, candidateId) {
  trackGA('purchase', { transaction_id: `match_${jobId}_${candidateId}`, value: 1, currency: 'TRY' });
}

function onDashboardVisit(role) {
  trackGA('page_view', { page_title: 'Dashboard', user_role: role });
}
