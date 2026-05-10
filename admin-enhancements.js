/**
 * 555 Insaat - Admin Panel Enhancements
 * Advanced features for admin panel
 */

// Bulk Operations Manager
const BulkOperations = {
    selectedItems: new Set(),
    
    // Toggle selection
    toggleSelect(id) {
        if (this.selectedItems.has(id)) {
            this.selectedItems.delete(id);
        } else {
            this.selectedItems.add(id);
        }
        this.updateUI();
    },
    
    // Select all
    selectAll(ids) {
        ids.forEach(id => this.selectedItems.add(id));
        this.updateUI();
    },
    
    // Deselect all
    deselectAll() {
        this.selectedItems.clear();
        this.updateUI();
    },
    
    // Update UI
    updateUI() {
        const count = this.selectedItems.size;
        const bulkBar = document.getElementById('bulkOperationsBar');
        if (bulkBar) {
            bulkBar.style.display = count > 0 ? 'flex' : 'none';
            document.getElementById('selectedCount').textContent = count;
        }
        
        // Update checkboxes
        document.querySelectorAll('.bulk-checkbox').forEach(cb => {
            cb.checked = this.selectedItems.has(cb.dataset.id);
        });
    },
    
    // Bulk delete
    async bulkDelete() {
        if (!confirm(`${this.selectedItems.size} işçini silmək istədiyinizə əminsiniz?`)) return;
        
        const workers = getWorkers();
        const updated = workers.filter(w => !this.selectedItems.has(w.id.toString()));
        saveData('workers', updated);
        
        this.deselectAll();
        showNotification('İşçilər uğurla silindi', 'success');
        loadWorkers();
    },
    
    // Bulk status update
    async bulkUpdateStatus(status) {
        const workers = getWorkers();
        workers.forEach(w => {
            if (this.selectedItems.has(w.id.toString())) {
                w.status = status;
            }
        });
        saveData('workers', workers);
        
        this.deselectAll();
        showNotification(`Seçilmiş işçilərin statusu ${status} olaraq yeniləndi`, 'success');
        loadWorkers();
    },
    
    // Bulk export
    bulkExport() {
        const workers = getWorkers();
        const selected = workers.filter(w => this.selectedItems.has(w.id.toString()));
        ExportManager.exportToExcel(selected, 'workers');
    }
};

// Export Manager
const ExportManager = {
    // Export to Excel (CSV format)
    exportToExcel(data, filename) {
        if (data.length === 0) {
            showNotification('Export üçün məlumat yoxdur', 'error');
            return;
        }
        
        const headers = Object.keys(data[0]).join(',');
        const rows = data.map(row => Object.values(row).join(','));
        const csv = [headers, ...rows].join('\n');
        
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        
        showNotification('Excel faylı yükləndi', 'success');
    },
    
    // Export to PDF (simplified)
    exportToPDF(data, title) {
        const printWindow = window.open('', '_blank');
        const html = `
            <html>
            <head>
                <title>${title}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    table { width: 100%; border-collapse: collapse; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background: #f3f4f6; }
                    h1 { color: #333; }
                </style>
            </head>
            <body>
                <h1>${title}</h1>
                <p>Tarix: ${new Date().toLocaleDateString('az-AZ')}</p>
                <table>
                    <thead>
                        <tr>${Object.keys(data[0] || {}).map(k => `<th>${k}</th>`).join('')}</tr>
                    </thead>
                    <tbody>
                        ${data.map(row => `<tr>${Object.values(row).map(v => `<td>${v}</td>`).join('')}</tr>`).join('')}
                    </tbody>
                </table>
            </body>
            </html>
        `;
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.print();
    }
};

// Advanced Filter Manager
const FilterManager = {
    filters: {},
    
    // Set filter
    setFilter(key, value) {
        if (value) {
            this.filters[key] = value;
        } else {
            delete this.filters[key];
        }
        this.applyFilters();
    },
    
    // Clear all filters
    clearFilters() {
        this.filters = {};
        document.querySelectorAll('.filter-input').forEach(input => input.value = '');
        this.applyFilters();
    },
    
    // Apply filters to data
    applyFilters() {
        const event = new CustomEvent('filtersChanged', { detail: this.filters });
        document.dispatchEvent(event);
    },
    
    // Filter data
    filterData(data) {
        return data.filter(item => {
            for (const [key, value] of Object.entries(this.filters)) {
                if (!value) continue;
                
                const itemValue = String(item[key] || '').toLowerCase();
                const filterValue = String(value).toLowerCase();
                
                if (!itemValue.includes(filterValue)) {
                    return false;
                }
            }
            return true;
        });
    }
};

// Search Manager
const SearchManager = {
    debounceTimer: null,
    
    // Search with debounce
    search(query, callback) {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            callback(query);
        }, 300);
    },
    
    // Highlight search results
    highlight(text, query) {
        if (!query) return text;
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }
};

// Notification System
const NotificationSystem = {
    notifications: [],
    
    // Add notification
    add(notification) {
        this.notifications.unshift({
            id: Date.now(),
            ...notification,
            read: false,
            time: new Date()
        });
        this.updateBadge();
        this.showToast(notification);
    },
    
    // Mark as read
    markAsRead(id) {
        const notif = this.notifications.find(n => n.id === id);
        if (notif) notif.read = true;
        this.updateBadge();
    },
    
    // Mark all as read
    markAllAsRead() {
        this.notifications.forEach(n => n.read = true);
        this.updateBadge();
    },
    
    // Update badge count
    updateBadge() {
        const unread = this.notifications.filter(n => !n.read).length;
        const badge = document.getElementById('notificationBadge');
        if (badge) {
            badge.textContent = unread;
            badge.style.display = unread > 0 ? 'block' : 'none';
        }
    },
    
    // Show toast notification
    showToast(notification) {
        const toast = document.createElement('div');
        toast.className = `toast-notification ${notification.type || 'info'}`;
        toast.innerHTML = `
            <i class="bi bi-${notification.icon || 'info-circle'}"></i>
            <span>${notification.message}</span>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    }
};

// Data Backup/Restore
const BackupManager = {
    // Create backup
    createBackup() {
        const backup = {
            timestamp: new Date().toISOString(),
            data: {
                workers: getWorkers(),
                tasks: getTasks(),
                performance: getPerformance(),
                salaries: getSalaries(),
                penalties: getPenalties(),
                permissions: getPermissions(),
                shiftChanges: getShiftChanges()
            }
        };
        
        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `backup_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        showNotification('Backup yaradıldı', 'success');
    },
    
    // Restore from backup
    restoreBackup(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const backup = JSON.parse(e.target.result);
                
                if (confirm('Bütün mövcud məlumatlar backup ilə əvəz olunacaq. Əminsiniz?')) {
                    Object.entries(backup.data).forEach(([key, value]) => {
                        localStorage.setItem(key, JSON.stringify(value));
                    });
                    showNotification('Backup bərpa edildi', 'success');
                    location.reload();
                }
            } catch (error) {
                showNotification('Backup faylı xətalıdır', 'error');
            }
        };
        reader.readAsText(file);
    }
};

// Show notification helper
function showNotification(message, type = 'info') {
    const icons = {
        success: 'check-circle',
        error: 'x-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    
    NotificationSystem.add({
        message,
        type,
        icon: icons[type]
    });
}

// Initialize enhancements
document.addEventListener('DOMContentLoaded', () => {
    // Add notification bell to header if not exists
    const topbar = document.querySelector('.topbar-right');
    if (topbar && !document.getElementById('notificationBell')) {
        const bell = document.createElement('button');
        bell.className = 'btn-icon';
        bell.id = 'notificationBell';
        bell.innerHTML = `
            <i class="bi bi-bell"></i>
            <span class="notification-badge" id="notificationBadge" style="display: none;">0</span>
        `;
        bell.onclick = () => {
            window.location.href = 'notifications.html';
        };
        topbar.insertBefore(bell, topbar.firstChild);
    }
});

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        BulkOperations,
        ExportManager,
        FilterManager,
        SearchManager,
        NotificationSystem,
        BackupManager
    };
}
