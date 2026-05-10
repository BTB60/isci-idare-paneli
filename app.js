/**
 * 555 İnşaat - Main Application Module
 * Common functionality and utilities
 */

// Initialize application
document.addEventListener('DOMContentLoaded', async function() {
    if (localStorage.getItem('token') && typeof refreshWorkersCache === 'function') {
        try {
            await refreshWorkersCache();
        } catch (e) {
            console.warn('Workers cache:', e);
        }
    }

    // Initialize tooltips
    initTooltips();
    
    // Initialize mobile menu
    initMobileMenu();

    initLandingNav();
    
    // Initialize theme toggle
    initThemeToggle();
    
    // Initialize alerts auto-dismiss
    initAlerts();
});

// Initialize tooltips
function initTooltips() {
    const tooltipTriggers = document.querySelectorAll('[data-tooltip]');
    tooltipTriggers.forEach(trigger => {
        trigger.addEventListener('mouseenter', showTooltip);
        trigger.addEventListener('mouseleave', hideTooltip);
    });
}

function showTooltip(e) {
    const text = e.target.getAttribute('data-tooltip');
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.textContent = text;
    document.body.appendChild(tooltip);
    
    const rect = e.target.getBoundingClientRect();
    tooltip.style.left = rect.left + rect.width / 2 - tooltip.offsetWidth / 2 + 'px';
    tooltip.style.top = rect.top - tooltip.offsetHeight - 8 + 'px';
}

function hideTooltip() {
    const tooltip = document.querySelector('.tooltip');
    if (tooltip) {
        tooltip.remove();
    }
}

function initLandingNav() {
    const nav = document.querySelector('.landing-nav');
    const toggle = document.getElementById('landingNavToggle');
    const menu = document.getElementById('landingNavMenu');
    const backdrop = document.getElementById('landingNavBackdrop');
    if (!nav || !toggle || !menu) return;

    const mq = window.matchMedia('(max-width: 1023px)');

    function setOpen(open) {
        nav.classList.toggle('landing-nav--open', open);
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        document.body.classList.toggle('landing-nav-open', open);
        if (backdrop) {
            backdrop.classList.toggle('is-visible', open);
            backdrop.setAttribute('aria-hidden', open ? 'false' : 'true');
        }
    }

    function close() {
        setOpen(false);
    }

    toggle.addEventListener('click', function (e) {
        e.preventDefault();
        if (!mq.matches) return;
        setOpen(!nav.classList.contains('landing-nav--open'));
    });

    if (backdrop) {
        backdrop.addEventListener('click', close);
    }

    menu.querySelectorAll('a[href]').forEach(function (a) {
        a.addEventListener('click', function () {
            if (mq.matches) close();
        });
    });

    window.addEventListener('resize', function () {
        if (!mq.matches) close();
    });
}

let mobileMenuDelegationBound = false;

/**
 * Yan panel mobil menyusu — düymə sonradan əlavə oluna bilər (işçi shell),
 * ona görə document üzərindən bir dəfə idarə olunur.
 */
function initMobileMenu() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar || mobileMenuDelegationBound) return;
    mobileMenuDelegationBound = true;

    document.addEventListener('click', function sidebarMobileDocClick(e) {
        const sb = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        if (!sb) return;

        const menuBtn = e.target.closest('#mobileMenuBtn');
        if (menuBtn) {
            e.preventDefault();
            sb.classList.toggle('active');
            if (overlay) overlay.classList.toggle('active');
            document.body.classList.toggle('mobile-sidebar-open', sb.classList.contains('active'));
            return;
        }

        if (overlay && e.target === overlay) {
            sb.classList.remove('active');
            overlay.classList.remove('active');
            document.body.classList.remove('mobile-sidebar-open');
        }
    });

    sidebar.addEventListener('click', function sidebarNavClose(e) {
        if (!e.target.closest('a[href]')) return;
        if (!window.matchMedia('(max-width: 1024px)').matches) return;
        sidebar.classList.remove('active');
        const overlay = document.getElementById('sidebarOverlay');
        if (overlay) overlay.classList.remove('active');
        document.body.classList.remove('mobile-sidebar-open');
    });

    window.addEventListener('resize', function sidebarResizeReset() {
        if (!window.matchMedia('(min-width: 1025px)').matches) return;
        const sb = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        if (sb) sb.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
        document.body.classList.remove('mobile-sidebar-open');
    });
}

// Initialize theme toggle
function initThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const icon = themeToggle.querySelector('i');
            if (document.body.classList.contains('dark-mode')) {
                icon.classList.replace('bi-moon', 'bi-sun');
                localStorage.setItem('theme', 'dark');
            } else {
                icon.classList.replace('bi-sun', 'bi-moon');
                localStorage.setItem('theme', 'light');
            }
        });
        
        // Load saved theme
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
            const icon = themeToggle.querySelector('i');
            icon.classList.replace('bi-moon', 'bi-sun');
        }
    }
}

// Initialize alerts auto-dismiss
function initAlerts() {
    const alerts = document.querySelectorAll('.alert:not(.alert-permanent)');
    alerts.forEach(alert => {
        setTimeout(() => {
            alert.style.opacity = '0';
            setTimeout(() => alert.remove(), 300);
        }, 5000);
    });
}

// Show alert message
function showAlert(message, type = 'success') {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.innerHTML = `
        <i class="bi bi-${type === 'success' ? 'check-circle' : type === 'danger' ? 'exclamation-triangle' : 'info-circle'}"></i>
        <span>${message}</span>
        <button class="alert-close" onclick="this.parentElement.remove()">
            <i class="bi bi-x"></i>
        </button>
    `;
    
    const container = document.querySelector('.page-content') || document.body;
    container.insertBefore(alert, container.firstChild);
    
    // Auto dismiss
    setTimeout(() => {
        alert.style.opacity = '0';
        setTimeout(() => alert.remove(), 300);
    }, 5000);
}

// Modal functions
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
        document.body.style.overflow = '';
    }
});

// Tab functionality
function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            
            // Remove active from all
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Add active to clicked
            btn.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });
}

// Search functionality
function initSearch(inputId, tableId, columns) {
    const searchInput = document.getElementById(inputId);
    const table = document.getElementById(tableId);
    
    if (searchInput && table) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const rows = table.querySelectorAll('tbody tr');
            
            rows.forEach(row => {
                let match = false;
                columns.forEach(col => {
                    const cell = row.querySelector(`[data-col="${col}"]`);
                    if (cell && cell.textContent.toLowerCase().includes(query)) {
                        match = true;
                    }
                });
                row.style.display = match ? '' : 'none';
            });
        });
    }
}

// Sort table functionality
function sortTable(tableId, column, type = 'string') {
    const table = document.getElementById(tableId);
    if (!table) return;
    
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    
    rows.sort((a, b) => {
        let aVal = a.querySelector(`[data-col="${column}"]`)?.textContent?.trim() || '';
        let bVal = b.querySelector(`[data-col="${column}"]`)?.textContent?.trim() || '';
        
        if (type === 'number') {
            aVal = parseFloat(aVal) || 0;
            bVal = parseFloat(bVal) || 0;
            return aVal - bVal;
        } else if (type === 'date') {
            return new Date(aVal) - new Date(bVal);
        }
        
        return aVal.localeCompare(bVal);
    });
    
    rows.forEach(row => tbody.appendChild(row));
}

// Export to CSV
function exportToCSV(data, filename) {
    if (!data || data.length === 0) {
        showAlert('Export ediləcək məlumat yoxdur', 'warning');
        return;
    }
    
    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(h => `"${row[h] || ''}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    
    showAlert('Fayl uğurla yükləndi', 'success');
}

// Print functionality
function printSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
            <head>
                <title>Çap - 555 İnşaat</title>
                <link rel="stylesheet" href="style.css">
            </head>
            <body>
                ${section.innerHTML}
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    }
}

// Confirm dialog
function confirmAction(message, callback) {
    if (confirm(message)) {
        callback();
    }
}

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttle function
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Animate number counter
function animateNumber(element, target, duration = 1000) {
    const start = 0;
    const increment = target / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        element.textContent = Math.floor(current).toLocaleString();
    }, 16);
}

// Get URL parameters
function getUrlParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// Set URL parameter without reload
function setUrlParam(param, value) {
    const url = new URL(window.location);
    url.searchParams.set(param, value);
    window.history.pushState({}, '', url);
}

// Local storage with expiration
function setStorageWithExpiry(key, value, ttl) {
    const now = new Date();
    const item = {
        value: value,
        expiry: now.getTime() + ttl
    };
    localStorage.setItem(key, JSON.stringify(item));
}

function getStorageWithExpiry(key) {
    const itemStr = localStorage.getItem(key);
    if (!itemStr) return null;
    
    const item = JSON.parse(itemStr);
    const now = new Date();
    
    if (now.getTime() > item.expiry) {
        localStorage.removeItem(key);
        return null;
    }
    return item.value;
}

// Form validation
function validateForm(formId) {
    const form = document.getElementById(formId);
    if (!form) return false;
    
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            field.classList.add('error');
            isValid = false;
        } else {
            field.classList.remove('error');
        }
    });
    
    return isValid;
}

// Clear form
function clearForm(formId) {
    const form = document.getElementById(formId);
    if (form) {
        form.reset();
        form.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
    }
}

// Copy to clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showAlert('Mətn kopyalandı', 'success');
    }).catch(() => {
        showAlert('Kopyalama uğursuz oldu', 'danger');
    });
}

// Scroll to element
function scrollToElement(elementId, offset = 80) {
    const element = document.getElementById(elementId);
    if (element) {
        const top = element.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top, behavior: 'smooth' });
    }
}

// Loading spinner
function showLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = '<div class="loading-spinner"></div>';
    }
}

function hideLoading(elementId, content) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = content;
    }
}