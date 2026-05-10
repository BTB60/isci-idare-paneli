/**
 * Workers list from API (cached for synchronous getWorkers() used across pages).
 */
const WORKERS_CACHE_KEY = 'workers_api_cache';

function normalizeWorker(w) {
  if (!w) return null;
  const id = w.id != null ? String(w.id) : (w._id != null ? String(w._id) : '');
  const name =
    w.name ||
    [w.firstName, w.lastName].filter(Boolean).join(' ').trim() ||
    w.username ||
    '';
  return {
    id,
    name,
    username: w.username,
    email: w.email,
    role: w.role,
    position: w.position,
    dailySalary: w.dailySalary != null ? Number(w.dailySalary) : 0,
    monthlySalary: w.monthlySalary != null ? Number(w.monthlySalary) : 0,
    workDaysPerMonth: w.workDaysPerMonth != null ? Number(w.workDaysPerMonth) : 26,
    status: w.status || 'active'
  };
}

async function refreshWorkersCache() {
  const token = localStorage.getItem('token');
  if (!token) {
    localStorage.removeItem(WORKERS_CACHE_KEY);
    return [];
  }

  const res = await fetch(`${window.API_BASE_URL}/workers`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json().catch(() => ({}));

  if (!res.ok || !data.success) {
    throw new Error(data.message || 'İşçilər yüklənmədi');
  }

  const workers = (data.workers || []).map(normalizeWorker);
  localStorage.setItem(WORKERS_CACHE_KEY, JSON.stringify(workers));
  return workers;
}

function getWorkers() {
  try {
    return JSON.parse(localStorage.getItem(WORKERS_CACHE_KEY) || '[]');
  } catch {
    return [];
  }
}

function getWorkerById(id) {
  const sid = String(id);
  return getWorkers().find((w) => String(w.id) === sid);
}

window.refreshWorkersCache = refreshWorkersCache;
window.getWorkers = getWorkers;
window.getWorkerById = getWorkerById;
