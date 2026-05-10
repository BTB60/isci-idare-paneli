/**
 * 555 İnşaat - API Service
 * Connects frontend to MongoDB backend
 * Replaces localStorage with real database
 */

// API Configuration (config.js sets window.API_BASE_URL first when loaded)
function resolveApiBase() {
    if (typeof window === 'undefined') return 'http://localhost:5000/api';
    if (window.API_BASE_URL) return window.API_BASE_URL;
    const h = window.location.hostname;
    const local =
      h === 'localhost' ||
      h === '127.0.0.1' ||
      h === '[::1]' ||
      window.location.protocol === 'file:';
    if (local) return 'http://localhost:5000/api';
    return `${window.location.origin.replace(/\/$/, '')}/api`;
}

const API_CONFIG = {
    BASE_URL: resolveApiBase(),
    HEADERS: {
        'Content-Type': 'application/json'
    }
};

// Get auth token
function getToken() {
    return localStorage.getItem('token');
}

// API Request helper
async function apiRequest(endpoint, method = 'GET', data = null) {
    try {
        const options = {
            method,
            headers: {
                ...API_CONFIG.HEADERS,
                'Authorization': `Bearer ${getToken()}`
            }
        };

        if (data) {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, options);
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'API Error');
        }

        return result;
    } catch (error) {
        console.error('API Request Error:', error);
        throw error;
    }
}

// ==================== WORKERS API ====================
const WorkersAPI = {
    // Get all workers from database
    async getAll() {
        const result = await apiRequest('/workers');
        return result.workers || [];
    },

    // Get worker by ID
    async getById(id) {
        const result = await apiRequest(`/workers/${id}`);
        return result.worker;
    },

    // Create new worker
    async create(workerData) {
        const result = await apiRequest('/workers', 'POST', workerData);
        return result;
    },

    // Update worker
    async update(id, workerData) {
        const result = await apiRequest(`/workers/${id}`, 'PUT', workerData);
        return result;
    },

    // Delete worker
    async delete(id) {
        const result = await apiRequest(`/workers/${id}`, 'DELETE');
        return result;
    }
};

// ==================== ATTENDANCE API ====================
const AttendanceAPI = {
    // Get all attendance records
    async getAll() {
        const result = await apiRequest('/attendance');
        return result.attendance || [];
    },

    // Get today's attendance
    async getToday() {
        const result = await apiRequest('/attendance/today');
        return result;
    },

    // Mark attendance
    async mark(data) {
        const result = await apiRequest('/attendance', 'POST', data);
        return result;
    },

    // Check in
    async checkIn() {
        const result = await apiRequest('/attendance/checkin', 'POST');
        return result;
    },

    // Check out
    async checkOut() {
        const result = await apiRequest('/attendance/checkout', 'POST');
        return result;
    },

    // Get my attendance records
    async getMyRecords() {
        const result = await apiRequest('/attendance/my/records');
        return result;
    }
};

// ==================== TASKS API ====================
const TasksAPI = {
    // Get all tasks
    async getAll() {
        const result = await apiRequest('/tasks');
        return result.tasks || [];
    },

    // Get my tasks
    async getMy() {
        const result = await apiRequest('/tasks/my');
        return result.tasks || [];
    },

    // Create task
    async create(taskData) {
        const result = await apiRequest('/tasks', 'POST', taskData);
        return result;
    },

    // Update task
    async update(id, taskData) {
        const result = await apiRequest(`/tasks/${id}`, 'PUT', taskData);
        return result;
    },

    // Delete task
    async delete(id) {
        const result = await apiRequest(`/tasks/${id}`, 'DELETE');
        return result;
    }
};

// ==================== SALARY API ====================
const SalaryAPI = {
    // Get all salaries
    async getAll() {
        const result = await apiRequest('/salary');
        return result.salaries || [];
    },

    // Get my salary
    async getMy() {
        const result = await apiRequest('/salary/my');
        return result.salaries || [];
    },

    // Calculate salary
    async calculate(data) {
        const result = await apiRequest('/salary/calculate', 'POST', data);
        return result;
    }
};

// ==================== PERMISSIONS API ====================
const PermissionsAPI = {
    // Get all permissions
    async getAll() {
        const result = await apiRequest('/permissions');
        return result.permissions || [];
    },

    // Get my permissions
    async getMy() {
        const result = await apiRequest('/permissions/my');
        return result.permissions || [];
    },

    // Create permission request
    async create(data) {
        const result = await apiRequest('/permissions', 'POST', data);
        return result;
    },

    // Update permission (approve/reject)
    async update(id, data) {
        const result = await apiRequest(`/permissions/${id}`, 'PUT', data);
        return result;
    }
};

// ==================== DASHBOARD API ====================
const DashboardAPI = {
    // Get admin dashboard stats
    async getStats() {
        const result = await apiRequest('/dashboard/stats');
        return result.stats;
    },

    // Get worker dashboard data
    async getWorkerDashboard() {
        const result = await apiRequest('/dashboard/worker');
        return result;
    }
};

// ==================== NOTIFICATIONS API ====================
const NotificationsAPI = {
    // Get all notifications
    async getAll() {
        const result = await apiRequest('/notifications');
        return result.notifications || [];
    },

    // Get unread notifications
    async getUnread() {
        const result = await apiRequest('/notifications/unread');
        return result;
    },

    // Mark as read
    async markAsRead(id) {
        const result = await apiRequest(`/notifications/${id}/read`, 'PUT');
        return result;
    },

    // Mark all as read
    async markAllAsRead() {
        const result = await apiRequest('/notifications/read-all', 'PUT');
        return result;
    }
};

// ==================== BACKWARD COMPATIBILITY ====================
// These functions replace localStorage operations

// Override localStorage functions to use API
window.getWorkers = async function() {
    try {
        return await WorkersAPI.getAll();
    } catch (error) {
        console.error('Failed to load workers:', error);
        return [];
    }
};

window.getTasks = async function() {
    try {
        return await TasksAPI.getAll();
    } catch (error) {
        console.error('Failed to load tasks:', error);
        return [];
    }
};

window.getAttendance = async function() {
    try {
        const result = await AttendanceAPI.getAll();
        return result;
    } catch (error) {
        console.error('Failed to load attendance:', error);
        return [];
    }
};

window.getSalaries = async function() {
    try {
        return await SalaryAPI.getAll();
    } catch (error) {
        console.error('Failed to load salaries:', error);
        return [];
    }
};

window.getPermissions = async function() {
    try {
        return await PermissionsAPI.getAll();
    } catch (error) {
        console.error('Failed to load permissions:', error);
        return [];
    }
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        WorkersAPI,
        AttendanceAPI,
        TasksAPI,
        SalaryAPI,
        PermissionsAPI,
        DashboardAPI,
        NotificationsAPI,
        apiRequest
    };
}
