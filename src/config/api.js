const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";

const api = {
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
};

// Add token to requests if it exists
api.setAuthToken = (token) => {
  if (token) {
    api.headers["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.headers["Authorization"];
  }
};

export default api;
