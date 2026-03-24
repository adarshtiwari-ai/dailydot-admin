// src/services/api.service.js
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";

let injectedStore;
export const injectStore = (store) => {
    injectedStore = store;
};

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
});

// Add auth token to all requests
axiosInstance.interceptors.request.use(
  (config) => {
    // Use adminToken (based on your authSlice)
    const token = localStorage.getItem("adminToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    console.log("API Request:", {
      method: config.method?.toUpperCase(),
      url: config.url,
      hasToken: !!token,
      data: config.data,
    });

    return config;
  },
  (error) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Handle auth errors and responses
axiosInstance.interceptors.response.use(
  (response) => {
    console.log("API Response:", {
      status: response.status,
      url: response.config.url,
      data: response.data,
    });
    return response;
  },
  (error) => {
    console.error("API Error:", {
      status: error.response?.status,
      url: error.config?.url,
      message: error.response?.data?.message,
      errors: error.response?.data?.errors,
    });

    if (error.response?.status === 401) {
      // 1. Tell Redux to clear the state officially (using raw injected dispatch to bypass cyclic imports)
      if (injectedStore) {
        injectedStore.dispatch({ type: 'auth/logout' });
      }

      // 2. Nuke the raw token and user details
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminUser");

      // 3. Nuke the redux-persist cache
      localStorage.removeItem("persist:dailydot-admin");

      // 4. Safely redirect to login if not already there
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
