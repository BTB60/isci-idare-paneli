/**
 * 555 İnşaat - Backend Authentication Module
 * Loads after config.js (sets window.API_BASE_URL).
 */

function apiBase() {
  return window.API_BASE_URL || 'http://localhost:5000/api';
}

function checkAuth() {
  const token = localStorage.getItem('token');
  const currentUser = localStorage.getItem('currentUser');

  if (!token || !currentUser) {
    window.location.href = 'login.html';
    return null;
  }
  return JSON.parse(currentUser);
}

/** Backend-dən gələn roleLanding və ya köhnə təyinlər əsasında panel növü */
function userRoleLanding(user) {
  if (!user) return 'worker';
  const land = user.roleLanding;
  if (land === 'admin' || land === 'seller' || land === 'worker') return land;
  if (user.role === 'admin') return 'admin';
  if (user.role === 'seller' || user.role === 'cashier') return 'seller';
  return 'worker';
}

async function login(identifier, password, role) {
  try {
    const response = await fetch(`${apiBase()}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: identifier.trim(),
        password,
        role: role != null ? String(role).trim().toLowerCase() : undefined
      })
    });

    const text = await response.text();
    let result = {};
    try {
      result = text ? JSON.parse(text) : {};
    } catch {
      return {
        success: false,
        message:
          'Server düzgün cavab vermədi. Backend işləyir? (npm start backend qovluğunda, port 5000)'
      };
    }

    if (result.success) {
      if (result.user.role !== role) {
        return { success: false, message: 'Rol uyğun gəlmir' };
      }

      localStorage.setItem('token', result.token);
      localStorage.setItem('currentUser', JSON.stringify(result.user));

      return { success: true, user: result.user };
    }

    const backendMsg = result.message || result.errors?.[0]?.msg;
    return {
      success: false,
      message: backendMsg || `Giriş uğursuz (${response.status})`
    };
  } catch (error) {
    console.error('Login error:', error);
    const hint =
      error && error.message === 'Failed to fetch'
        ? 'Backend-ə çata bilmir (CORS və ya server söndürülüb). Backend: cd backend → npm start; MongoDB işləməlidir.'
        : (error && error.message) || 'Şəbəkə xətası';
    return { success: false, message: hint };
  }
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('currentUser');
  localStorage.removeItem('workers_api_cache');
  window.location.href = 'login.html';
}

async function register(userData) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${apiBase()}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(userData)
    });

    return await response.json();
  } catch (error) {
    console.error('Register error:', error);
    return { success: false, message: 'Server xətası' };
  }
}

async function getCurrentUser() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${apiBase()}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const result = await response.json();
    if (result.success) {
      localStorage.setItem('currentUser', JSON.stringify(result.user));
    }
    return result;
  } catch (error) {
    console.error('Get user error:', error);
    return { success: false, message: 'Server xətası' };
  }
}

async function updatePassword(currentPassword, newPassword) {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${apiBase()}/auth/update-password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ currentPassword, newPassword })
    });

    return await response.json();
  } catch (error) {
    console.error('Update password error:', error);
    return { success: false, message: 'Server xətası' };
  }
}

async function apiRequest(endpoint, method = 'GET', data = null) {
  try {
    const token = localStorage.getItem('token');
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    };

    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(`${apiBase()}${endpoint}`, options);
    const result = await response.json().catch(() => ({}));
    return result;
  } catch (error) {
    console.error('API request error:', error);
    return { success: false, message: 'Server xətası' };
  }
}

window.apiFetch = apiRequest;
window.userRoleLanding = userRoleLanding;

const rolesAPI = {
  loginOptions: () => apiRequest('/roles/login-options'),
  assignOptions: () => apiRequest('/roles/assign-options'),
  list: () => apiRequest('/roles'),
  permissionKeys: () => apiRequest('/roles/permission-keys'),
  create: (data) => apiRequest('/roles', 'POST', data),
  update: (slug, data) =>
    apiRequest(`/roles/${encodeURIComponent(String(slug).toLowerCase())}`, 'PUT', data),
  remove: (slug) =>
    apiRequest(`/roles/${encodeURIComponent(String(slug).toLowerCase())}`, 'DELETE')
};

window.rolesAPI = rolesAPI;

const workersAPI = {
  getAll: () => apiRequest('/workers'),
  getById: (id) => apiRequest(`/workers/${id}`),
  create: (data) => apiRequest('/workers', 'POST', data),
  update: (id, data) => apiRequest(`/workers/${id}`, 'PUT', data),
  delete: (id) => apiRequest(`/workers/${id}`, 'DELETE')
};

const attendanceAPI = {
  getAll: () => apiRequest('/attendance'),
  getToday: () => apiRequest('/attendance/today'),
  mark: (data) => apiRequest('/attendance', 'POST', data),
  checkIn: (data) => apiRequest('/attendance/checkin', 'POST', data || {}),
  checkOut: (data) => apiRequest('/attendance/checkout', 'POST', data || {}),
  getVoicePhrase: () => apiRequest('/attendance/voice-phrase'),
  getMyRecords: () => apiRequest('/attendance/my/records')
};

const dashboardAPI = {
  getStats: () => apiRequest('/dashboard/stats'),
  getWorkerDashboard: () => apiRequest('/dashboard/worker')
};

const tasksAPI = {
  getAll: () => apiRequest('/tasks'),
  getMy: () => apiRequest('/tasks/my'),
  create: (data) => apiRequest('/tasks', 'POST', data),
  update: (id, data) => apiRequest(`/tasks/${id}`, 'PUT', data),
  delete: (id) => apiRequest(`/tasks/${id}`, 'DELETE')
};

const permissionsAPI = {
  getAll: () => apiRequest('/permissions'),
  getMy: () => apiRequest('/permissions/my'),
  create: (data) => apiRequest('/permissions', 'POST', data),
  update: (id, data) => apiRequest(`/permissions/${id}`, 'PUT', data)
};

const salaryAPI = {
  getAll: () => apiRequest('/salary'),
  getMy: () => apiRequest('/salary/my'),
  calculate: (data) => apiRequest('/salary/calculate', 'POST', data)
};

const notificationsAPI = {
  getAll: () => apiRequest('/notifications'),
  getUnread: () => apiRequest('/notifications/unread'),
  markAsRead: (id) => apiRequest(`/notifications/${id}/read`, 'PUT'),
  markAllAsRead: () => apiRequest('/notifications/read-all', 'PUT')
};

document.addEventListener('DOMContentLoaded', function () {
  const loginForm = document.getElementById('login-form');
  if (!loginForm) return;

  loginForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const identifierInput = document.getElementById('identifier');
    const passwordInput = document.getElementById('password');
    const roleInput = document.getElementById('role');
    const errorMessage = document.getElementById('error-message');

    const identifier = identifierInput ? identifierInput.value.trim() : '';
    const password = passwordInput ? passwordInput.value : '';
    const role = roleInput ? roleInput.value : '';

    if (!identifier || !password || !role) {
      errorMessage.textContent = 'Bütün sahələri doldurun';
      errorMessage.style.display = 'block';
      return;
    }

    const submitBtn = loginForm.querySelector('button[type="submit"]');
    const labelSpan = submitBtn && submitBtn.querySelector('span');
    const prevLabel = labelSpan ? labelSpan.textContent : '';
    if (labelSpan) labelSpan.textContent = 'Giriş edilir...';
    if (submitBtn) submitBtn.disabled = true;

    const result = await login(identifier, password, role);

    if (labelSpan) labelSpan.textContent = prevLabel || 'Daxil ol';
    if (submitBtn) submitBtn.disabled = false;

    if (result.success) {
      if (typeof refreshWorkersCache === 'function') {
        try {
          await refreshWorkersCache();
        } catch (err) {
          console.warn(err);
        }
      }
      const landing = userRoleLanding(result.user);
      if (landing === 'admin') {
        window.location.href = 'dashboard.html';
      } else if (landing === 'seller') {
        window.location.href = 'seller-dashboard.html';
      } else {
        window.location.href = 'worker-dashboard.html';
      }
    } else {
      errorMessage.textContent = result.message;
      errorMessage.style.display = 'block';
    }
  });
});
