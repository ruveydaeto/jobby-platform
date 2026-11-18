/* ============================================================
   Shiftly tasarım sistemi — ortak header & footer
   renderNav(rootId)   : role duyarlı üst bar
   renderFooter(rootId): 4 kolonlu kurumsal alt bar
   ============================================================ */

function navLabel(key, fallback) {
  if (typeof window.t === 'function') {
    const v = window.t(key);
    if (v && v !== key) return v;
  }
  return fallback;
}

function getNavLinks(role) {
  if (role === 'candidate') {
    return [
      { href: '/swipe.html', label: 'Hızlı Eşleşme (Swipe)' },
      { href: '/dashboard.html', label: 'Panelim' },
      { href: '/onboarding.html', label: 'Profilim' }
    ];
  }
  if (role === 'company') {
    return [
      { href: '/company/post-job.html', label: 'Etkinlik Oluştur' },
      { href: '/company/dashboard.html', label: 'İlanlarım' },
      { href: '/company/applications.html', label: 'Başvurular' },
      { href: '/company/matches.html', label: 'Eşleşmeler' }
    ];
  }
  return [
    { href: '/#ilanlar', label: navLabel('nav.discover', 'Keşfet & İlanlar') },
    { href: '/#eslesme', label: navLabel('nav.match', 'Hızlı Eşleşme') },
    { href: '/#aday-havuzu', label: navLabel('nav.talent', 'Aday Havuzu') },
    { href: '/#nasil-calisir', label: navLabel('nav.how', 'Nasıl Çalışır?') }
  ];
}

function navIsActive(href) {
  return window.location.pathname === href;
}

function renderNav(rootId) {
  const root = document.getElementById(rootId);
  if (!root) return;

  if (!window.currentLang) {
    window.currentLang = localStorage.getItem('jobby_lang') || 'tr';
  }

  const loggedIn = Api.isLoggedIn();
  const role = loggedIn ? Api.role() : 'guest';
  const links = getNavLinks(role);

  // Dil seçici yalnızca i18n tanımlı sayfalarda (ana sayfa)
  const langToggle = typeof window.setLanguage === 'function' ? `
    <div class="lang-toggle">
      <button class="${window.currentLang === 'en' ? '' : 'active'}" onclick="setLanguage('tr')">TR</button>
      <button class="${window.currentLang === 'en' ? 'active' : ''}" onclick="setLanguage('en')">EN</button>
    </div>` : '';

  let actions;
  if (!loggedIn) {
    actions = `
      ${langToggle}
      <a href="/login.html" class="btn btn-ghost btn-sm">${navLabel('nav.login', 'Giriş yap')}</a>
      <a href="/register.html" class="btn btn-primary btn-sm">
        <span class="mi mi-sm">bolt</span><span>${navLabel('nav.start', 'Ücretsiz başla')}</span>
      </a>`;
  } else {
    const cta = role === 'company'
      ? { href: '/company/post-job.html', icon: 'add_circle', label: 'İlan ver' }
      : { href: '/swipe.html', icon: 'bolt', label: 'Vardiya bul' };
    actions = `
      ${langToggle}
      <button class="icon-btn" type="button" title="Bildirimler" onclick="return false;">
        <span class="mi">notifications</span><span class="dot"></span>
      </button>
      <a href="${cta.href}" class="btn btn-primary btn-sm">
        <span class="mi mi-sm">${cta.icon}</span><span>${cta.label}</span>
      </a>
      <div class="nav-divider"></div>
      <span class="avatar-chip" title="${role === 'company' ? 'Firma hesabı' : 'Aday hesabı'}">${role === 'company' ? 'FR' : 'AD'}</span>
      <button class="icon-btn" type="button" title="Çıkış" onclick="Api.logout()">
        <span class="mi">logout</span>
      </button>`;
  }

  root.innerHTML = `
    <header class="site-header">
      <div class="nav-inner">
        <div class="nav-left">
          <a href="/" class="brand">
            <span class="brand-mark">J</span><span class="brand-text">JOBBY</span>
          </a>
          <div class="nav-divider"></div>
          <nav class="nav-pills">
            ${links.map(l => `<a href="${l.href}" class="nav-pill${navIsActive(l.href) ? ' active' : ''}">${l.label}</a>`).join('')}
          </nav>
        </div>
        <div class="nav-actions">${actions}</div>
      </div>
    </header>`;
}

function renderFooter(rootId) {
  const root = document.getElementById(rootId);
  if (!root) return;
  root.innerHTML = `
    <footer class="site-footer">
      <div class="footer-inner">
        <div class="footer-grid">
          <div class="footer-about">
            <a href="/" class="brand"><span class="brand-mark">J</span><span>JOBBY</span></a>
            <p>${navLabel('footer.about', 'Yeni nesil etkinlik, festival, konser ve kongre yetenek eşleştirme platformu. Doğrulanmış ekipler, anlık vardiya teklifleri ve güvenceli ödemeler.')}</p>
            <span class="chip chip-teal"><span class="live-dot"></span>${navLabel('footer.live', 'Aktif vardiyalar canlı')}</span>
          </div>
          <div class="footer-col">
            <h4>${navLabel('footer.platform', 'Platform')}</h4>
            <ul>
              <li><a href="/#ilanlar">Etkinlik ilanları</a></li>
              <li><a href="/#eslesme">Swipe eşleşme</a></li>
              <li><a href="/#aday-havuzu">Yetenek havuzu</a></li>
              <li><a href="/company/post-job.html">Etkinlik oluştur</a></li>
            </ul>
          </div>
          <div class="footer-col">
            <h4>${navLabel('footer.categories', 'Kategoriler')}</h4>
            <ul>
              <li><a href="/#ilanlar">Konser &amp; Festival</a></li>
              <li><a href="/#ilanlar">Tadım &amp; Promosyon</a></li>
              <li><a href="/#ilanlar">Kongre &amp; Fuar hostesi</a></li>
              <li><a href="/#ilanlar">Saha operasyon &amp; Lojistik</a></li>
            </ul>
          </div>
          <div class="footer-col">
            <h4>${navLabel('footer.corp', 'Kurumsal &amp; Destek')}</h4>
            <ul>
              <li><a href="/#nasil-calisir">Nasıl çalışır?</a></li>
              <li><a href="/register.html">Aday olarak katıl</a></li>
              <li><a href="/register.html?role=company">Firmalar için</a></li>
              <li><a href="/login.html">${navLabel('nav.login', 'Giriş yap')}</a></li>
            </ul>
          </div>
        </div>
        <div class="footer-bottom">
          <span>${navLabel('footer.copy', '© 2026 JOBBY. Demo veriler ile hazırlanmıştır.')}</span>
          <span class="links">
            <a href="#">Gizlilik politikası</a>
            <a href="#">Kullanım koşulları</a>
            <a href="#">KVKK aydınlatma</a>
          </span>
        </div>
      </div>
    </footer>`;
}
