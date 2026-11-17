/* ============================================================
   Shiftly tasarım sistemi — ortak header & footer
   renderNav(rootId)   : role duyarlı üst bar
   renderFooter(rootId): 4 kolonlu kurumsal alt bar
   ============================================================ */

const NAV_I18N = {
  tr: {
    discover: 'Keşfet & İlanlar',
    match: 'Hızlı Eşleşme',
    talent: 'Aday Havuzu',
    how: 'Nasıl Çalışır?',
    swipe: 'Hızlı Eşleşme',
    jobsList: 'İlanlar',
    panel: 'Panelim',
    profile: 'Profilim',
    postJob: 'Etkinlik Oluştur',
    myJobs: 'İlanlarım',
    apps: 'Başvurular',
    matches: 'Eşleşmeler',
    login: 'Giriş yap',
    start: 'Ücretsiz başla',
    findShift: 'Vardiya bul',
    postCta: 'İlan ver',
    footerAbout: 'Yeni nesil etkinlik, festival, konser ve kongre yetenek eşleştirme platformu. Doğrulanmış ekipler, anlık vardiya teklifleri ve güvenceli ödemeler.',
    footerLive: 'Aktif vardiyalar canlı',
    platform: 'Platform',
    categories: 'Kategoriler',
    corp: 'Kurumsal & Destek',
    listings: 'Etkinlik ilanları',
    swipeLink: 'Swipe eşleşme',
    talentLink: 'Yetenek havuzu',
    createEvent: 'Etkinlik oluştur',
    howLink: 'Nasıl çalışır?',
    joinCand: 'Aday olarak katıl',
    forCompanies: 'Firmalar için',
    loginLink: 'Giriş yap',
    copy: '© 2026 JOBBY. Demo veriler ile hazırlanmıştır.',
    privacy: 'Gizlilik politikası',
    terms: 'Kullanım koşulları',
    kvkk: 'KVKK aydınlatma'
  },
  en: {
    discover: 'Explore & Listings',
    match: 'Quick Match',
    talent: 'Talent Pool',
    how: 'How it works',
    swipe: 'Quick Match',
    jobsList: 'Listings',
    panel: 'My panel',
    profile: 'My profile',
    postJob: 'Create event',
    myJobs: 'My listings',
    apps: 'Applications',
    matches: 'Matches',
    login: 'Log in',
    start: 'Start free',
    findShift: 'Find a shift',
    postCta: 'Post a job',
    footerAbout: 'Next-gen talent matching for events, festivals, concerts and conferences. Verified crews, instant shift offers and secured payments.',
    footerLive: 'Live shifts active',
    platform: 'Platform',
    categories: 'Categories',
    corp: 'Company & Support',
    listings: 'Event listings',
    swipeLink: 'Swipe matching',
    talentLink: 'Talent pool',
    createEvent: 'Create an event',
    howLink: 'How it works?',
    joinCand: 'Join as candidate',
    forCompanies: 'For companies',
    loginLink: 'Log in',
    copy: '© 2026 JOBBY. Built with demo data.',
    privacy: 'Privacy policy',
    terms: 'Terms of use',
    kvkk: 'Privacy notice'
  }
};

function navT(key) {
  const lang = (typeof window.currentLang === 'string' && NAV_I18N[window.currentLang])
    ? window.currentLang
    : (localStorage.getItem('jobby_lang') || 'tr');
  return (NAV_I18N[lang] && NAV_I18N[lang][key]) || key;
}

function getNavLinks(role) {
  if (role === 'candidate') {
    return [
      { href: '/jobs.html', label: navT('jobsList') },
      { href: '/swipe.html', label: navT('swipe') },
      { href: '/dashboard.html', label: navT('panel') },
      { href: '/onboarding.html', label: navT('profile') }
    ];
  }
  if (role === 'company') {
    return [
      { href: '/company/post-job.html', label: navT('postJob') },
      { href: '/company/dashboard.html', label: navT('myJobs') },
      { href: '/company/applications.html', label: navT('apps') },
      { href: '/company/matches.html', label: navT('matches') }
    ];
  }
  return [
    { href: '/#ilanlar', label: navT('discover') },
    { href: '/#eslesme', label: navT('match') },
    { href: '/#aday-havuzu', label: navT('talent') },
    { href: '/#nasil-calisir', label: navT('how') }
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

  const langToggle = typeof window.setLanguage === 'function' ? `
    <div class="lang-toggle">
      <button class="${window.currentLang === 'en' ? '' : 'active'}" onclick="setLanguage('tr')">TR</button>
      <button class="${window.currentLang === 'en' ? 'active' : ''}" onclick="setLanguage('en')">EN</button>
    </div>` : '';

  let actions;
  if (!loggedIn) {
    actions = `
      ${langToggle}
      <a href="/login.html" class="btn btn-ghost btn-sm">${navT('login')}</a>
      <a href="/register.html" class="btn btn-primary btn-sm">
        <span class="mi mi-sm">bolt</span><span>${navT('start')}</span>
      </a>`;
  } else {
    const cta = role === 'company'
      ? { href: '/company/post-job.html', icon: 'add_circle', label: navT('postCta') }
      : { href: '/swipe.html', icon: 'bolt', label: navT('findShift') };
    actions = `
      ${langToggle}
      <button class="icon-btn" type="button" title="Bildirimler" onclick="return false;">
        <span class="mi">notifications</span><span class="dot"></span>
      </button>
      <a href="${cta.href}" class="btn btn-primary btn-sm">
        <span class="mi mi-sm">${cta.icon}</span><span>${cta.label}</span>
      </a>
      <div class="nav-divider"></div>
      <span class="avatar-chip" title="${role === 'company' ? 'Firma' : 'Aday'}">${role === 'company' ? 'FR' : 'AD'}</span>
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
  if (!window.currentLang) {
    window.currentLang = localStorage.getItem('jobby_lang') || 'tr';
  }
  root.innerHTML = `
    <footer class="site-footer">
      <div class="footer-inner">
        <div class="footer-grid">
          <div class="footer-about">
            <a href="/" class="brand"><span class="brand-mark">J</span><span>JOBBY</span></a>
            <p>${navT('footerAbout')}</p>
            <span class="chip chip-teal"><span class="live-dot"></span>${navT('footerLive')}</span>
          </div>
          <div class="footer-col">
            <h4>${navT('platform')}</h4>
            <ul>
              <li><a href="/#ilanlar">${navT('listings')}</a></li>
              <li><a href="/#eslesme">${navT('swipeLink')}</a></li>
              <li><a href="/#aday-havuzu">${navT('talentLink')}</a></li>
              <li><a href="/company/post-job.html">${navT('createEvent')}</a></li>
            </ul>
          </div>
          <div class="footer-col">
            <h4>${navT('categories')}</h4>
            <ul>
              <li><a href="/#ilanlar">Konser &amp; Festival</a></li>
              <li><a href="/#ilanlar">Tadım &amp; Promosyon</a></li>
              <li><a href="/#ilanlar">Kongre &amp; Fuar</a></li>
              <li><a href="/#ilanlar">Lojistik</a></li>
            </ul>
          </div>
          <div class="footer-col">
            <h4>${navT('corp')}</h4>
            <ul>
              <li><a href="/#nasil-calisir">${navT('howLink')}</a></li>
              <li><a href="/register.html">${navT('joinCand')}</a></li>
              <li><a href="/register.html?role=company">${navT('forCompanies')}</a></li>
              <li><a href="/login.html">${navT('loginLink')}</a></li>
            </ul>
          </div>
        </div>
        <div class="footer-bottom">
          <span>${navT('copy')}</span>
          <span class="links">
            <a href="#">${navT('privacy')}</a>
            <a href="#">${navT('terms')}</a>
            <a href="#">${navT('kvkk')}</a>
          </span>
        </div>
      </div>
    </footer>`;
}
