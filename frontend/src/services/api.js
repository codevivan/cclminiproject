/**
 * API client helper with HTTP-only credentials support
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const apiClient = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(options.headers || {})
  };

  const config = {
    ...options,
    headers: defaultHeaders,
    credentials: 'include' // Crucial for receiving and sending HTTP-only JWT cookies
  };

  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg = data.message || `Request failed with status ${response.status}`;
      const error = new Error(errorMsg);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    if (!error.status) {
      console.error(`Network error connecting to ${url}:`, error.message);
      error.message = 'Unable to connect to the backend server. Please verify the server is running.';
    }
    throw error;
  }
};

export const authApi = {
  login: (credentials) => apiClient('/auth/login', { method: 'POST', body: credentials }),
  register: (userData) => apiClient('/auth/register', { method: 'POST', body: userData }),
  logout: () => apiClient('/auth/logout', { method: 'POST' }),
  getCurrentUser: () => apiClient('/auth/me', { method: 'GET' }),
  updatePassword: (passwords) => apiClient('/auth/update-password', { method: 'PUT', body: passwords }),
  getOwnerStatus: () => apiClient('/auth/owner-status', { method: 'GET' }),
  ownerSetup: (ownerData) => apiClient('/auth/owner-setup', { method: 'POST', body: ownerData }),
  ownerLogin: (credentials) => apiClient('/auth/owner-login', { method: 'POST', body: credentials })
};

export const menuApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams();
    if (params.category && params.category !== 'All') query.append('category', params.category);
    if (params.search) query.append('search', params.search);
    if (params.availableOnly) query.append('availableOnly', 'true');
    const qs = query.toString();
    return apiClient(`/menu${qs ? '?' + qs : ''}`, { method: 'GET' });
  },
  create: (itemData) => apiClient('/menu', { method: 'POST', body: itemData }),
  update: (id, itemData) => apiClient(`/menu/${id}`, { method: 'PUT', body: itemData }),
  delete: (id) => apiClient(`/menu/${id}`, { method: 'DELETE' })
};

export const orderApi = {
  createOrder: (orderData) => apiClient('/orders', { method: 'POST', body: orderData }),
  getMyOrders: () => apiClient('/orders/my-orders', { method: 'GET' }),
  getOrderById: (id) => apiClient(`/orders/${id}`, { method: 'GET' }),
  getAllOrders: (params = {}) => {
    const query = new URLSearchParams();
    if (params.status && params.status !== 'all') query.append('status', params.status);
    const qs = query.toString();
    return apiClient(`/orders${qs ? '?' + qs : ''}`, { method: 'GET' });
  },
  updateStatus: (id, status) => apiClient(`/orders/${id}/status`, { method: 'PATCH', body: { status } }),
  getDashboardStats: () => apiClient('/orders/stats', { method: 'GET' }),
  getPaymentConfig: () => apiClient('/orders/payment-config', { method: 'GET' }),
  getPaymentOrders: (params = {}) => {
    const query = new URLSearchParams();
    if (params.payment_status && params.payment_status !== 'all') query.append('payment_status', params.payment_status);
    if (params.payment_method && params.payment_method !== 'all') query.append('payment_method', params.payment_method);
    const qs = query.toString();
    return apiClient(`/orders/admin/payments${qs ? '?' + qs : ''}`, { method: 'GET' });
  },
  confirmPayment: (id) => apiClient(`/orders/${id}/confirm-payment`, { method: 'PATCH' }),
  getReceiptDownloadUrl: (id) => `${API_BASE_URL}/orders/${id}/receipt`
};

export const notificationApi = {
  getAll: () => apiClient('/notifications', { method: 'GET' }),
  markAsRead: (id) => apiClient(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllAsRead: () => apiClient('/notifications/mark-all-read', { method: 'PATCH' })
};

export const canteenApi = {
  getStatus: () => apiClient('/admin/canteen-status', { method: 'GET' })
};

export const adminApi = {
  getUsers: (params = {}) => {
    const query = new URLSearchParams();
    if (params.role) query.append('role', params.role);
    if (params.search) query.append('search', params.search);
    const qs = query.toString();
    return apiClient(`/admin/users${qs ? '?' + qs : ''}`, { method: 'GET' });
  },
  toggleUserStatus: (id) => apiClient(`/admin/users/${id}/toggle-status`, { method: 'PATCH' }),
  getCanteenStatus: () => apiClient('/admin/canteen-status', { method: 'GET' }),
  updateCanteenStatus: (data) => apiClient('/admin/canteen-status', { method: 'PUT', body: data }),
  getReports: () => apiClient('/admin/reports', { method: 'GET' })
};


