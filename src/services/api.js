import axios from "axios";

// Configure your backend URL
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10 seconds timeout
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("adminToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminUser");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Auth API endpoints
export const authAPI = {
  login: (credentials) => api.post("/auth/login", credentials),
  logout: () => api.post("/auth/logout"), // if logout endpoint exists
  refreshToken: () => api.post("/auth/refresh"),
  getProfile: () => api.get("/auth/profile"),
};

// Dashboard API endpoints
export const dashboardAPI = {
  getStats: () => {
    // Use multiple calls to get stats since your backend doesn't have a combined endpoint
    return Promise.all([
      api.get("/bookings"),
      api.get("/users"),
      api.get("/services"),
      api.get("/categories"),
    ]);
  },
  getRecentBookings: (limit = 5) =>
    api.get(`/bookings?limit=${limit}&sort=-createdAt`),
};

// Services API endpoints
export const servicesAPI = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/services?${queryString}`);
  },
  getById: (id) => api.get(`/services/${id}`),
  create: (data) => api.post("/services", data),
  update: (id, data) => api.put(`/services/${id}`, data),
  delete: (id) => api.delete(`/services/${id}`),
  getCategories: () => api.get("/categories"),
};

// Bookings API endpoints
export const bookingsAPI = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/bookings?${queryString}`);
  },
  getById: (id) => api.get(`/bookings/${id}`),
  updateStatus: (id, status) => api.patch(`/bookings/${id}/status`, { status }),
  create: (data) => api.post("/bookings", data),
};

// Users API endpoints
export const usersAPI = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/users?${queryString}`);
  },
  getById: (id) => api.get(`/users/${id}`),
  getProfile: () => api.get("/users/profile"),
  updateProfile: (data) => api.put("/users/profile", data),
};

// Payments API endpoints
export const paymentsAPI = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/admin/payments?${queryString}`);
  },
  getById: (id) => api.get(`/admin/payments/${id}`),
  processRefund: (paymentId, amount, reason) =>
    api.post(`/admin/payments/${paymentId}/refund`, { amount, reason }),
  getTransactionStats: () => api.get("/admin/payments/stats"),
  export: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/admin/payments/export?${queryString}`, {
      responseType: "blob",
    });
  },
};

// Reviews API endpoints
export const reviewsAPI = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/admin/reviews?${queryString}`);
  },
  getById: (id) => api.get(`/admin/reviews/${id}`),
  moderate: (id, action, reason = "") =>
    api.patch(`/admin/reviews/${id}/moderate`, { action, reason }),
  respond: (id, response) =>
    api.post(`/admin/reviews/${id}/respond`, { response }),
  getStats: () => api.get("/admin/reviews/stats"),
};

// Analytics API endpoints
export const analyticsAPI = {
  getOverview: () => api.get("/analytics/overview"),
  getRevenue: (period = "30days") =>
    api.get(`/admin/analytics/revenue?period=${period}`),
  getBookingTrends: (period = "30days") =>
    api.get(`/admin/analytics/booking-trends?period=${period}`),
  getUserGrowth: (period = "30days") =>
    api.get(`/admin/analytics/user-growth?period=${period}`),
  getServicePerformance: () => api.get("/admin/analytics/service-performance"),
  getProviderStats: () => api.get("/admin/analytics/provider-stats"),
  getCustomReport: (params) =>
    api.post("/admin/analytics/custom-report", params),
};

// Settings API endpoints
export const settingsAPI = {
  getAll: () => api.get("/admin/settings"),
  update: (key, value) => api.patch("/admin/settings", { key, value }),
  getEmailTemplates: () => api.get("/admin/settings/email-templates"),
  updateEmailTemplate: (id, template) =>
    api.put(`/admin/settings/email-templates/${id}`, template),
  getNotificationSettings: () => api.get("/admin/settings/notifications"),
  updateNotificationSettings: (settings) =>
    api.put("/admin/settings/notifications", settings),
};

// File upload utility
export const uploadAPI = {
  uploadImage: (file, folder = "general") => {
    const formData = new FormData();
    formData.append("image", file);
    formData.append("folder", folder);
    return api.post("/admin/upload/image", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
  uploadDocument: (file, folder = "documents") => {
    const formData = new FormData();
    formData.append("document", file);
    formData.append("folder", folder);
    return api.post("/admin/upload/document", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
};

// Utility functions
export const apiUtils = {
  // Handle file download
  downloadFile: (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  // Format API errors
  formatError: (error) => {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.message) {
      return error.message;
    }
    return "An unexpected error occurred";
  },
};

// Promotions API
export const promotionsAPI = {
  getAll: (params = {}) => api.get("/admin/discounts", { params }),
  getById: (id) => api.get(`/admin/discounts/${id}`),
  create: (data) => api.post("/admin/discounts", data),
  update: (id, data) => api.put(`/admin/discounts/${id}`, data),
  delete: (id) => api.delete(`/admin/discounts/${id}`),
};

// Waitlist API
export const waitlistAPI = {
  getAll: () => api.get("/waitlist/all"),
};

export default api;
