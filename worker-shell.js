/**
 * İşçi panel səhifələrində yan menyunun altına profil + çıxış əlavə edir.
 * Şərt: #sidebar içində .sidebar-header və mövcud deyilsə .sidebar-user-card.
 */
(function () {
  function escapeHtml(s) {
    const d = document.createElement('div');
    d.textContent = s == null ? '' : String(s);
    return d.innerHTML;
  }

  function roleLabel(u) {
    if (!u) return '';
    try {
      if (typeof userRoleLanding === 'function') {
        const land = userRoleLanding(u);
        if (land === 'seller') return 'Satış / Kassa';
        if (land === 'admin') return 'Administrator';
      }
    } catch (_) {}
    return u.role || '';
  }

  function inject() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar || sidebar.querySelector('.sidebar-user-card')) return;
    if (!sidebar.querySelector('.sidebar-header')) return;

    sidebar.dataset.workerProfileShell = '1';

    let userName = 'İstifadəçi';
    let smallText = '';
    try {
      const u = JSON.parse(localStorage.getItem('currentUser') || '{}');
      if (u.name) userName = u.name;
      smallText = roleLabel(u) || u.position || 'Hesab';
    } catch (_) {}

    const initial = (userName || 'İ').trim().charAt(0).toUpperCase();

    const card = document.createElement('div');
    card.className = 'sidebar-user-card';
    card.innerHTML =
      '<div class="sidebar-user-avatar" aria-hidden="true">' +
      escapeHtml(initial) +
      '</div>' +
      '<div class="sidebar-user-meta">' +
      '<strong>' +
      escapeHtml(userName) +
      '</strong>' +
      '<small>' +
      escapeHtml(smallText) +
      '</small>' +
      '</div>' +
      '<button type="button" class="sidebar-logout sidebar-logout--labeled" onclick="logout()" title="Profildən çıxış">' +
      '<i class="bi bi-box-arrow-right" aria-hidden="true"></i>' +
      '<span class="sidebar-logout-label">Çıxış</span>' +
      '</button>';

    sidebar.appendChild(card);

    injectWorkerMobileNav();
  }

  /** Mobil/tablet: yan menyunu açmaq üçün düymə və overlay (admin-shell işçi səhifələrində yoxdur) */
  function injectWorkerMobileNav() {
    const layout = document.querySelector('.admin-layout');
    const sidebar = document.getElementById('sidebar');
    if (!layout || !sidebar || !sidebar.querySelector('.sidebar-header')) return;
    if (document.getElementById('mobileMenuBtn')) return;

    let overlay = document.getElementById('sidebarOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'sidebarOverlay';
      overlay.className = 'sidebar-overlay';
      overlay.setAttribute('aria-hidden', 'true');
      const main = layout.querySelector('.main-content');
      if (main) layout.insertBefore(overlay, main);
      else layout.appendChild(overlay);
    }

    const topbarRight = layout.querySelector('.topbar-right');
    if (!topbarRight) return;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'mobileMenuBtn';
    btn.className = 'btn-icon mobile-menu-btn sidebar-toggle-mobile';
    btn.setAttribute('aria-label', 'Menyunu aç və ya bağla');
    btn.innerHTML = '<i class="bi bi-layout-sidebar-inset-reverse" aria-hidden="true"></i>';
    topbarRight.insertBefore(btn, topbarRight.firstChild);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }
})();
