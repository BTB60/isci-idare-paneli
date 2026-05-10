/**
 * 555 Insaat - Frontend API Service
 * This file should be included in your frontend HTML files
 */

const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:5000/api'
  : 'https://your-backend-url.vercel.app/api'; // Change this to your deployed backend URL

// API Service object
const api = {
  // Auth
  auth: {
    login: async (email, password) => {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      return res.json();
    },
    register: async (data) => {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return res.json();
    },
    me: async () => {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return res.json();
    }
  },

  // Workers
  workers: {
    getAll: async () => {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/workers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return res.json();
    },
    getById: async (id) => {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/workers/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return res.json();
    },
    create: async (data) => {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/workers`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      return res.json();
    },
    update: async (id, data) => {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/workers/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      return res.json();
    },
    delete: async (id) => {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/workers/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return res.json();
    }
  },

  // Attendance
  attendance: {
    getAll: async () => {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/attendance`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return res.json();
    },
    getToday: async () => {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/attendance/today`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return res.json();
    },
    mark: async (data) => {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/attendance`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      return res.json();
    },
    checkIn: async () => {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/attendance/checkin`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ method: 'web' })
      });
      return res.json();
    },
    checkOut: async () => {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/attendance/checkout`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ method: 'web' })
      });
      return res.json();
    },
    getMyRecords: async () => {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/attendance/my/records`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return res.json();
    }
  },

  // Dashboard
  dashboard: {
    getStats: async () => {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/dashboard/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return res.json();
    },
    getWorkerDashboard: async () => {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/dashboard/worker`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return res.json();
    }
  },

  // Tasks
  tasks: {
    getAll: async () => {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/tasks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return res.json();
    },
    getMy: async () => {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/tasks/my`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return res.json();
    },
    create: async (data) => {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/tasks`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      return res.json();
    },
    update: async (id, data) => {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/tasks/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      return res.json();
    }
  },

  // Permissions
  permissions: {
    getAll: async () => {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/permissions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return res.json();
    },
    getMy: async () => {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/permissions/my`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return res.json();
    },
    create: async (data) => {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/permissions`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      return res.json();
    },
    update: async (id, data) => {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/permissions/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      return res.json();
    }
  },

  // Salary
  salary: {
    getAll: async () => {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/salary`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return res.json();
    },
    getMy: async () => {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/salary/my`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return res.json();
    }
  },

  // Notifications
  notifications: {
    getAll: async () => {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return res.json();
    },
    getUnread: async () => {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/notifications/unread`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return res.json();
    },
    markAsRead: async (id) => {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return res.json();
    },
    markAllAsRead: async () => {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/notifications/read-all`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return res.json();
    }
  }
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = api;
}
