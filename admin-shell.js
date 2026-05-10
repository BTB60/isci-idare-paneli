/**
 * Admin panel: vahid yan menyu, mobil düymə və overlay.
 * Səhifədə boş <aside id="sidebar"> olmalıdır.
 */
(function () {
  const sidebar = document.getElementById('sidebar');
  const layout = document.querySelector('.admin-layout');
  if (!sidebar || !layout || sidebar.dataset.adminShell === '1') return;

  /** cari fayl adı (hash/query təmiz) */
  function currentPageFile() {
    const path = String(window.location.pathname || '').replace(/\/+$/, '');
    const i = path.lastIndexOf('/');
    let name = i >= 0 ? path.slice(i + 1) : path;
    if (!name) name = 'index.html';
    name = name.split('?')[0].split('#')[0];
    return name.toLowerCase();
  }

  const page = currentPageFile();

  /**
   * Köhnə panel sırasına uyğun qrup strukturu:
   * əvvəl: Dashboard → işçilər … → layihə/tapşırıq → maliyyə → hədəflər → icazə/növbə → sənəd → bildiriş/hesabat
   */
  const sections = [
    {
      title: 'Əsas',
      items: [{ href: 'dashboard.html', icon: 'speedometer2', label: 'İdarə paneli' }]
    },
    {
      title: 'Əmək və davamiyyət',
      items: [
        { href: 'workers.html', icon: 'people-fill', label: 'İşçilər' },
        { href: 'roles.html', icon: 'person-badge', label: 'Rollar' },
        { href: 'attendance.html', icon: 'clock-history', label: 'Davamiyyət' },
        { href: 'performance.html', icon: 'graph-up-arrow', label: 'Performans' }
      ]
    },
    {
      title: 'Layihə və tapşırıqlar',
      items: [
        { href: 'projects.html', icon: 'buildings', label: 'Layihələr' },
        { href: 'tasks.html', icon: 'list-task', label: 'Tapşırıqlar' }
      ]
    },
    {
      title: 'Maliyyə və hədəflər',
      items: [
        { href: 'admin-kassa.html', icon: 'cash-stack', label: 'Kasa (mədaxil/məxaric)' },
        { href: 'overtime.html', icon: 'clock-fill', label: 'Məsai' },
        { href: 'advances.html', icon: 'cash-coin', label: 'Avanslar' },
        { href: 'salary.html', icon: 'wallet2', label: 'Maaşlar' },
        { href: 'penalties.html', icon: 'exclamation-octagon', label: 'Cərimələr' },
        { href: 'targets.html', icon: 'bullseye', label: 'Hədəflər' }
      ]
    },
    {
      title: 'İnzibati',
      items: [
        { href: 'permissions.html', icon: 'calendar-check', label: 'İcazələr' },
        { href: 'shift-change.html', icon: 'arrow-left-right', label: 'Növbə dəyişmə' }
      ]
    },
    {
      title: 'Sənəd və təhlükəsizlik',
      items: [
        { href: 'documents.html', icon: 'folder2-open', label: 'Sənədlər' },
        { href: 'safety.html', icon: 'shield-check', label: 'Təhlükəsizlik' }
      ]
    },
    {
      title: 'Bildiriş və hesabat',
      items: [
        { href: 'notifications.html', icon: 'bell', label: 'Bildirişlər' },
        { href: 'reports.html', icon: 'pie-chart', label: 'Hesabatlar' }
      ]
    }
  ];

  function isActive(href) {
    return page === href.toLowerCase();
  }

  let navHtml = '';
  sections.forEach((sec, si) => {
    const tid = `admin-nav-sec-${si}`;
    navHtml += `<section class="nav-section" aria-labelledby="${tid}">`;
    navHtml += `<h2 class="nav-section-title" id="${tid}">${sec.title}</h2>`;
    navHtml += `<ul class="nav-section-items">`;
    sec.items.forEach((it) => {
      const cls = isActive(it.href) ? 'nav-item active' : 'nav-item';
      navHtml += `<li><a href="${it.href}" class="${cls}"><i class="bi bi-${it.icon}" aria-hidden="true"></i><span>${it.label}</span></a></li>`;
    });
    navHtml += `</ul></section>`;
  });

  let userName = 'Admin';
  let userRole = 'Administrator';
  try {
    const u = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (u.name) userName = u.name;
    if (u.role === 'admin') userRole = 'İnzibatçı';
    else if (u.role === 'seller') userRole = 'Satıcı';
    else if (u.role === 'worker') userRole = 'İşçi';
  } catch (_) {}

  const initial = (userName || 'A').trim().charAt(0).toUpperCase();

  sidebar.innerHTML = `
    <div class="sidebar-brand">
      <div class="sidebar-brand-mark"><i class="bi bi-building-fill"></i></div>
      <div class="sidebar-brand-text">
        <span class="sidebar-brand-title">555 İnşaat</span>
        <span class="sidebar-brand-sub">İdarəetmə konsolu</span>
      </div>
    </div>
    <div class="sidebar-inner">
      <nav class="sidebar-nav" aria-label="Admin menyusu">${navHtml}</nav>
    </div>
    <div class="sidebar-user-card">
      <div class="sidebar-user-avatar" aria-hidden="true">${initial}</div>
      <div class="sidebar-user-meta">
        <strong id="sidebarUserDisplay">${escapeHtml(userName)}</strong>
        <small>${escapeHtml(userRole)}</small>
      </div>
      <button type="button" class="sidebar-logout sidebar-logout--labeled" onclick="logout()" title="Profildən çıxış">
        <i class="bi bi-box-arrow-right" aria-hidden="true"></i>
        <span class="sidebar-logout-label">Çıxış</span>
      </button>
    </div>
  `;

  sidebar.dataset.adminShell = '1';

  function escapeHtml(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function injectOverlay() {
    if (document.getElementById('sidebarOverlay')) return;
    const el = document.createElement('div');
    el.id = 'sidebarOverlay';
    el.className = 'sidebar-overlay';
    const main = layout.querySelector('.main-content');
    if (main) layout.insertBefore(el, main);
    else layout.appendChild(el);
  }

  function injectMobileBtn() {
    if (document.getElementById('mobileMenuBtn')) return;
    const tr = layout.querySelector('.topbar-right');
    if (!tr) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'mobileMenuBtn';
    btn.className = 'btn-icon mobile-menu-btn sidebar-toggle-mobile';
    btn.setAttribute('aria-label', 'Menyunu aç/bağla');
    btn.innerHTML = '<i class="bi bi-layout-sidebar-inset-reverse"></i>';
    tr.insertBefore(btn, tr.firstChild);
  }

  injectOverlay();
  injectMobileBtn();
})();
