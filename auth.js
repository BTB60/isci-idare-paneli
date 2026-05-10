/**
 * 555 İnşaat - Local demo data helpers + utilities (tasks, permissions, etc. remain localStorage until wired to API).
 * Authentication: auth-backend.js (checkAuth, logout).
 * Workers list: data-layer.js (getWorkers from API cache).
 */

function initializeData() {
  if (!localStorage.getItem('tasks')) {
    localStorage.setItem('tasks', JSON.stringify([
      { id: 1, title: 'Fasad təmiri', description: 'Binanın fasadının təmiri', assignedTo: 2, status: 'pending', priority: 'high', createdAt: new Date().toISOString() },
      { id: 2, title: 'Elektrik işləri', description: '3-cü mərtəbə elektrik çəkilişi', assignedTo: 3, status: 'in-progress', priority: 'medium', createdAt: new Date().toISOString() }
    ]));
  }
  if (!localStorage.getItem('performance')) {
    localStorage.setItem('performance', JSON.stringify([
      { id: 1, workerId: 2, date: new Date().toISOString().split('T')[0], status: 'present', hoursWorked: 8, efficiency: 95 },
      { id: 2, workerId: 3, date: new Date().toISOString().split('T')[0], status: 'present', hoursWorked: 8, efficiency: 88 }
    ]));
  }
  if (!localStorage.getItem('salaries')) {
    localStorage.setItem('salaries', JSON.stringify([
      { id: 1, workerId: 2, month: new Date().getMonth() + 1, year: new Date().getFullYear(), workDays: 22, dailySalary: 50, bonus: 100, penalty: 0, total: 1200 },
      { id: 2, workerId: 3, month: new Date().getMonth() + 1, year: new Date().getFullYear(), workDays: 20, dailySalary: 45, bonus: 50, penalty: 20, total: 930 }
    ]));
  }
  if (!localStorage.getItem('penalties')) {
    localStorage.setItem('penalties', JSON.stringify([
      { id: 1, workerId: 3, amount: 20, reason: 'Gecikmə', date: new Date().toISOString().split('T')[0], status: 'active' }
    ]));
  }
  if (!localStorage.getItem('permissions')) {
    localStorage.setItem('permissions', JSON.stringify([
      { id: 1, workerId: 2, startDate: '2024-03-20', endDate: '2024-03-22', reason: 'Şəxsi iş', type: 'paid', status: 'pending' }
    ]));
  }
  if (!localStorage.getItem('shiftChanges')) {
    localStorage.setItem('shiftChanges', JSON.stringify([
      { id: 1, requesterId: 2, targetId: 3, date: '2024-03-25', reason: 'Şəxsi səbəb', status: 'pending' }
    ]));
  }
}

document.addEventListener('DOMContentLoaded', function () {
  initializeData();
});

function getTasks() {
  return JSON.parse(localStorage.getItem('tasks') || '[]');
}

function getPerformance() {
  return JSON.parse(localStorage.getItem('performance') || '[]');
}

function getSalaries() {
  return JSON.parse(localStorage.getItem('salaries') || '[]');
}

function getPenalties() {
  return JSON.parse(localStorage.getItem('penalties') || '[]');
}

function getPermissions() {
  return JSON.parse(localStorage.getItem('permissions') || '[]');
}

function getShiftChanges() {
  return JSON.parse(localStorage.getItem('shiftChanges') || '[]');
}

function saveData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('az-AZ');
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('az-AZ', {
    style: 'currency',
    currency: 'AZN'
  }).format(amount);
}

function getCurrentMonthName() {
  const months = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'İyun', 'İyul', 'Avqust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'];
  return months[new Date().getMonth()];
}

function calculateWorkerStats(workerId) {
  const performance = getPerformance().filter((p) => p.workerId === workerId);
  const salaries = getSalaries().filter((s) => s.workerId === workerId);
  const penalties = getPenalties().filter((p) => p.workerId === workerId);

  const presentDays = performance.filter((p) => p.status === 'present').length;
  const totalDays = performance.length;
  const attendanceRate = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(1) : 0;

  const totalBonus = salaries.reduce((sum, s) => sum + (s.bonus || 0), 0);
  const totalPenalty = penalties.reduce((sum, p) => sum + (p.amount || 0), 0);

  return {
    presentDays,
    totalDays,
    attendanceRate,
    totalBonus,
    totalPenalty
  };
}
